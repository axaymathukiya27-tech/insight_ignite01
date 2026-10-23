import {
  prisma,
  User,
  UserRole,
  AssessmentStatus,
  AssessmentSubmissionStatus,
} from "@insight-ignite/database";
import {
  SubmitAssessmentInput,
  PublicAssessmentInstrument,
  PublicAssessmentFactor,
  PublicAssessmentItem,
  PublicAssessmentOption,
  AssessmentResultDto,
  AssessmentProgressDto,
  FactorScoreDto,
  AreaSummaryDto,
  AssessmentSubmissionHistoryItem,
} from "@insight-ignite/shared";
import {
  calculateAssessmentScores,
  AssessmentError,
  RawOptionWithWeight,
  ApprovedScoringConfigSchema,
} from "./scoring.service";
import { getApprovedCourseRecommendations, refreshCourseRecommendations } from "./recommendations.service";
import {
  buildPracticePlan,
  buildPracticeRecommendations,
  dimensionFromScore,
  DimensionResult,
  steadyAreasFromScores,
} from "./report-content";
import { readStoredGuidance, storeGuidance } from "./stored-result";
import { generateSecureToken, hashToken } from "./token.util";

export { AssessmentError };

/**
 * Public catalog retrieval of the currently active, approved assessment instrument.
 * Excludes internal scoring formulas and question point weights.
 */
export async function getActiveAssessment(
  slug = "parent-growth-self-assessment"
): Promise<PublicAssessmentInstrument> {
  const instrument = await prisma.assessmentInstrument.findFirst({
    where: {
      slug,
      status: AssessmentStatus.ACTIVE,
    },
    include: {
      versions: {
        where: {
          status: AssessmentStatus.ACTIVE,
        },
        include: {
          factors: {
            orderBy: { orderIndex: "asc" },
          },
          items: {
            orderBy: { orderIndex: "asc" },
            include: {
              factor: true,
            },
          },
        },
      },
    },
  });

  if (!instrument || instrument.versions.length === 0) {
    throw new AssessmentError(
      "No active published assessment version is currently available.",
      404,
      "NO_ACTIVE_ASSESSMENT"
    );
  }

  const activeVersion = instrument.versions[0];

  const factors: PublicAssessmentFactor[] = activeVersion.factors.map((f) => ({
    code: f.code,
    name: f.name,
    tagline: f.tagline,
    description: f.description,
    orderIndex: f.orderIndex,
  }));

  const items: PublicAssessmentItem[] = activeVersion.items.map((item) => {
    const rawOptions = (item.options as unknown as RawOptionWithWeight[]) || [];
    // Strictly strip internal scoring weights before public response
    const publicOptions: PublicAssessmentOption[] = rawOptions.map((opt) => ({
      id: opt.id,
      label: opt.label,
      orderIndex: opt.orderIndex,
    }));

    return {
      id: item.id,
      factorCode: item.factor.code,
      itemKey: item.itemKey,
      orderIndex: item.orderIndex,
      prompt: item.prompt,
      contextPrompt: item.contextPrompt,
      options: publicOptions,
      isRequired: item.isRequired,
    };
  });

  return {
    id: instrument.id,
    versionId: activeVersion.id,
    versionNumber: activeVersion.versionNumber,
    slug: instrument.slug,
    title: instrument.title,
    subtitle: instrument.subtitle,
    description: instrument.description,
    disclaimerText: activeVersion.disclaimerText,
    instructionsText: activeVersion.instructionsText,
    factors,
    items,
  };
}

/**
 * Public list of every instrument that currently has an ACTIVE version.
 * Summary fields only (no questions, options or scoring).
 */
export async function listActiveAssessments(): Promise<
  Array<{
    slug: string;
    title: string;
    subtitle: string | null;
    description: string;
    questionCount: number;
  }>
> {
  const instruments = await prisma.assessmentInstrument.findMany({
    where: {
      status: AssessmentStatus.ACTIVE,
      versions: { some: { status: AssessmentStatus.ACTIVE } },
    },
    include: {
      versions: {
        where: { status: AssessmentStatus.ACTIVE },
        include: { _count: { select: { items: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return instruments.map((inst) => ({
    slug: inst.slug,
    title: inst.title,
    subtitle: inst.subtitle,
    description: inst.description,
    questionCount: inst.versions[0]?._count.items ?? 0,
  }));
}

/**
 * Validates responses, calculates scores server-side, saves results,
 * and sets up cryptographic credentials for anonymous or authenticated access.
 */
export async function submitAssessment(
  input: SubmitAssessmentInput,
  user?: User
): Promise<{
  result: AssessmentResultDto;
  accessKey?: string;
  claimToken?: string;
  expiresAt?: Date;
}> {
  // Validate version existence and active status
  const version = await prisma.assessmentVersion.findUnique({
    where: { id: input.versionId },
    include: {
      instrument: true,
      factors: { orderBy: { orderIndex: "asc" } },
      items: { orderBy: { orderIndex: "asc" } },
    },
  });

  if (!version || version.status !== AssessmentStatus.ACTIVE) {
    throw new AssessmentError(
      "The submitted assessment version is not currently active.",
      400,
      "VERSION_NOT_ACTIVE"
    );
  }

  // Calculate scores strictly using version's approved scoring configuration
  const computed = calculateAssessmentScores(
    version,
    version.factors,
    version.items,
    input.answers
  );

  // Derive published course recommendations
  const recommendedCourses = await getApprovedCourseRecommendations(
    version.id,
    computed.factorScores
  );

  // Handle credentials: guest tokens vs authenticated user
  let rawAccessKey: string | undefined;
  let rawClaimToken: string | undefined;
  let accessKeyHash: string | null = null;
  let claimTokenHash: string | null = null;
  let expiresAt: Date | null = null;

  if (user) {
    // Authenticated user: linked immediately to account; no expiration
    expiresAt = null;
  } else {
    // Anonymous participant: generate cryptographically secure tokens
    rawAccessKey = generateSecureToken(32);
    rawClaimToken = generateSecureToken(32);
    accessKeyHash = hashToken(rawAccessKey);
    claimTokenHash = hashToken(rawClaimToken);
    expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days retention
  }

  // Persist submission, raw responses, and results inside an atomic transaction
  const submission = await prisma.$transaction(async (tx) => {
    const sub = await tx.assessmentSubmission.create({
      data: {
        versionId: version.id,
        userId: user ? user.id : null,
        accessKeyHash,
        claimTokenHash,
        status: AssessmentSubmissionStatus.SUBMITTED,
        completedAt: new Date(),
        expiresAt,
        consentGiven: true,
        consentNoticeVersion: input.consentNoticeVersion,
        consentGivenAt: new Date(),
      },
    });

    // Save individual raw responses
    await tx.assessmentRawResponse.createMany({
      data: computed.rawAnswersWithValues.map((ans) => ({
        submissionId: sub.id,
        itemId: ans.itemId,
        selectedOptionId: ans.selectedOptionId,
        numericValue: ans.numericValue,
      })),
    });

    // Save computed results
    await tx.assessmentResult.create({
      data: {
        submissionId: sub.id,
        versionId: version.id,
        factorScores: computed.factorScores as unknown as object,
        overallScore: computed.overallScore,
        strengths: computed.strengths as unknown as object,
        growthAreas: computed.growthAreas as unknown as object,
        recommendationsSummary: storeGuidance({
          courses: recommendedCourses,
          practiceRecommendations: computed.practiceRecommendations,
          practicePlan: computed.practicePlan,
        }),
      },
    });

    return sub;
  });

  const resultDto: AssessmentResultDto = {
    submissionId: submission.id,
    versionNumber: version.versionNumber,
    completedAt: submission.completedAt ? submission.completedAt.toISOString() : new Date().toISOString(),
    isAnonymous: !user,
    claimToken: rawClaimToken, // Returned once upon initial submission for user to save
    factorScores: computed.factorScores,
    strengths: computed.strengths,
    growthAreas: computed.growthAreas,
    steadyAreas: computed.steadyAreas,
    recommendedCourses: await refreshCourseRecommendations(recommendedCourses, user?.id),
    practiceRecommendations: computed.practiceRecommendations,
    practicePlan: computed.practicePlan,
    instrumentSlug: version.instrument.slug,
    instrumentTitle: version.instrument.title,
    disclaimer:
      version.disclaimerText ||
      "This self-assessment is an educational self-reflection tool, not a diagnostic or clinical evaluation.",
  };

  return {
    result: resultDto,
    accessKey: rawAccessKey,
    claimToken: rawClaimToken,
    expiresAt: expiresAt || undefined,
  };
}

/**
 * Retrieves a calculated assessment result with strict authorization checks.
 * Requires either a matching authenticated session or a valid anonymous access key hash.
 */
export async function getAssessmentResult(
  submissionId: string,
  user?: User,
  accessKey?: string
): Promise<AssessmentResultDto> {
  const submission = await prisma.assessmentSubmission.findUnique({
    where: { id: submissionId },
    include: {
      result: true,
      version: {
        include: {
          instrument: true,
        },
      },
    },
  });

  if (!submission || !submission.result) {
    throw new AssessmentError("Assessment result not found.", 404, "NOT_FOUND");
  }

  // Check expiration on anonymous sessions
  if (submission.expiresAt && submission.expiresAt.getTime() <= Date.now()) {
    throw new AssessmentError(
      "This anonymous assessment session has expired and is no longer available.",
      410,
      "SESSION_EXPIRED"
    );
  }

  // Authorization check
  if (submission.userId) {
    // Authenticated result: must belong to the logged-in user or an authorized admin
    if (!user || (user.id !== submission.userId && user.role !== UserRole.PLATFORM_ADMIN)) {
      throw new AssessmentError(
        "You do not have permission to view this assessment report.",
        403,
        "FORBIDDEN"
      );
    }
  } else {
    // Anonymous result: requires matching access key hash
    if (!accessKey || accessKey.trim() === "") {
      throw new AssessmentError(
        "Access credential required to view this anonymous assessment result.",
        403,
        "UNAUTHORIZED"
      );
    }

    const providedHash = hashToken(accessKey);
    if (providedHash !== submission.accessKeyHash) {
      throw new AssessmentError(
        "Invalid access credential for this assessment result.",
        403,
        "FORBIDDEN"
      );
    }
  }

  const storedScores = submission.result.factorScores as unknown as Record<string, FactorScoreDto>;
  const parsedConfig = ApprovedScoringConfigSchema.safeParse(submission.version.scoringConfig);
  const guidanceTemplates = parsedConfig.success ? parsedConfig.data.guidanceTemplates : undefined;
  const stored = readStoredGuidance(submission.result.recommendationsSummary);
  // Results calculated before personalized plans existed, but after scoring direction was
  // recorded, get their plan and recommendations rebuilt from the stored classification.
  // Legacy results (no classification) get none: nothing is guessed from a percentage.
  const dims = Object.values(storedScores || {}).map(dimensionFromScore);
  const classified = dims.length > 0 && dims.every((d) => d !== null) ? (dims as DimensionResult[]) : [];
  const practicePlan =
    stored.practicePlan.length > 0
      ? stored.practicePlan
      : classified.length > 0
      ? buildPracticePlan(classified, guidanceTemplates)
      : [];
  const practiceRecommendations =
    stored.practiceRecommendations.length > 0
      ? stored.practiceRecommendations
      : classified.length > 0
      ? buildPracticeRecommendations(classified, guidanceTemplates, practicePlan)
      : [];

  return {
    submissionId: submission.id,
    versionNumber: submission.version.versionNumber,
    completedAt: submission.completedAt ? submission.completedAt.toISOString() : submission.createdAt.toISOString(),
    isAnonymous: submission.userId === null,
    factorScores: storedScores,
    strengths: (submission.result.strengths as unknown as AreaSummaryDto[]) || [],
    growthAreas: (submission.result.growthAreas as unknown as AreaSummaryDto[]) || [],
    // Not stored separately: rebuilt from the stored classification (results calculated
    // after the scoring-direction fix). Older results have no classification, so none.
    steadyAreas: steadyAreasFromScores(storedScores, guidanceTemplates),
    // Re-checked against the live catalogue, so unpublished courses are dropped
    recommendedCourses: await refreshCourseRecommendations(stored.courses, user?.id),
    practiceRecommendations,
    practicePlan,
    instrumentSlug: submission.version.instrument.slug,
    instrumentTitle: submission.version.instrument.title,
    disclaimer:
      submission.version.disclaimerText ||
      "This self-assessment is an educational self-reflection tool, not a diagnostic or clinical evaluation.",
  };
}

/**
 * Links an anonymous submission to an authenticated user account.
 * Single-use: invalidates the claim token upon use.
 */
export async function claimAssessment(
  claimToken: string,
  user: User
): Promise<{ success: boolean; submissionId: string; message: string }> {
  if (!claimToken || claimToken.trim() === "") {
    throw new AssessmentError("A valid claim token is required.", 400, "INVALID_CLAIM_TOKEN");
  }

  const claimTokenHash = hashToken(claimToken);

  return await prisma.$transaction(async (tx) => {
    const submission = await tx.assessmentSubmission.findUnique({
      where: { claimTokenHash },
    });

    if (!submission) {
      throw new AssessmentError(
        "The provided claim token is invalid, expired, or has already been used.",
        400,
        "INVALID_CLAIM_TOKEN"
      );
    }

    if (submission.userId !== null) {
      throw new AssessmentError(
        "This assessment result has already been claimed.",
        400,
        "ALREADY_CLAIMED"
      );
    }

    if (submission.expiresAt && submission.expiresAt.getTime() <= Date.now()) {
      throw new AssessmentError(
        "This assessment session has expired and can no longer be claimed.",
        410,
        "SESSION_EXPIRED"
      );
    }

    // Atomically link to user, nullify claim token, and remove retention expiration
    await tx.assessmentSubmission.update({
      where: { id: submission.id },
      data: {
        userId: user.id,
        status: AssessmentSubmissionStatus.CLAIMED,
        claimTokenHash: null, // Nullify to prevent reuse
        expiresAt: null,      // Saved permanently with user profile
      },
    });

    return {
      success: true,
      submissionId: submission.id,
      message: "Assessment result has been successfully saved to your profile.",
    };
  });
}

/**
 * Retrieves assessment submission history for an authenticated participant.
 * Strictly scoped to the authenticated user's ID.
 */
export async function getUserAssessmentHistory(
  userId: string
): Promise<AssessmentSubmissionHistoryItem[]> {
  const submissions = await prisma.assessmentSubmission.findMany({
    where: {
      userId,
      status: {
        in: [AssessmentSubmissionStatus.SUBMITTED, AssessmentSubmissionStatus.CLAIMED],
      },
    },
    include: {
      version: {
        include: {
          instrument: true,
        },
      },
      result: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const plans = await practiceProgressBySubmission(submissions.map((s) => s.id));

  // Attempt numbers count completed attempts of the same assessment, oldest first
  const attemptNumbers = new Map<string, number>();
  const counters = new Map<string, number>();
  for (const sub of [...submissions].sort((a, b) => completedTime(a) - completedTime(b))) {
    const n = (counters.get(sub.version.instrumentId) || 0) + 1;
    counters.set(sub.version.instrumentId, n);
    attemptNumbers.set(sub.id, n);
  }

  return submissions
    .filter((sub) => sub.result)
    .map((sub) => {
      const strengths = (sub.result?.strengths as unknown as AreaSummaryDto[]) || [];
      const growthAreas = (sub.result?.growthAreas as unknown as AreaSummaryDto[]) || [];

      return {
        submissionId: sub.id,
        instrumentTitle: sub.version.instrument.title,
        instrumentSlug: sub.version.instrument.slug,
        attemptNumber: attemptNumbers.get(sub.id),
        versionNumber: sub.version.versionNumber,
        completedAt: new Date(completedTime(sub)).toISOString(),
        topStrength: strengths[0]?.factorName,
        topGrowthArea: growthAreas[0]?.factorName,
        practiceStarted: plans.has(sub.id),
        practiceCompletedDays: plans.get(sub.id) ?? 0,
      };
    });
}

/**
 * Completed-day counts for the practice plans of these attempts. If the practice-plan
 * tables have not been created yet in this database (migration not applied), history
 * still works and simply shows no plan progress.
 */
async function practiceProgressBySubmission(submissionIds: string[]): Promise<Map<string, number>> {
  if (submissionIds.length === 0) return new Map();
  try {
    const plans = await prisma.assessmentPracticePlan.findMany({
      where: { submissionId: { in: submissionIds } },
      include: { progress: true },
    });
    return new Map(plans.map((p) => [p.submissionId, p.progress.filter((d) => d.completedAt).length]));
  } catch (error) {
    if ((error as { code?: string }).code === "P2021") return new Map();
    throw error;
  }
}

function completedTime(sub: { completedAt: Date | null; createdAt: Date }): number {
  return (sub.completedAt ?? sub.createdAt).getTime();
}

/**
 * Identifies results that can be compared directly: same assessment, same dimensions,
 * same questions mapped to each dimension, same answer-scale range, same scoring
 * direction, and calculated by the direction-aware scoring (legacy results have no
 * recorded direction and are never compared). Returns null when not comparable.
 */
function comparabilityKey(
  scores: Record<string, FactorScoreDto>,
  version: { items: Array<{ itemKey: string; options: unknown; factor: { code: string } }> }
): string | null {
  const list = Object.values(scores || {});
  if (list.length === 0 || list.some((s) => !s.classification || !s.direction)) return null;
  const itemsByFactor = new Map<string, string[]>();
  for (const it of version.items) {
    const values = ((it.options as Array<{ value: number }>) || []).map((o) => o.value);
    const sig = `${it.itemKey}[${Math.min(...values)}..${Math.max(...values)}]`;
    itemsByFactor.set(it.factor.code, [...(itemsByFactor.get(it.factor.code) || []), sig]);
  }
  return JSON.stringify(
    list
      .map((s) => [s.factorCode, s.direction, s.maxScore, (itemsByFactor.get(s.factorCode) || []).sort()])
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
  );
}

function describeChange(direction: "HIGHER_IS_POSITIVE" | "HIGHER_IS_CONCERN", diff: number): string {
  if (diff === 0) return "Your score is the same as in your earlier attempt.";
  const pts = `${Math.abs(diff)} percentage point${Math.abs(diff) === 1 ? "" : "s"}`;
  if (direction === "HIGHER_IS_CONCERN") {
    return diff > 0
      ? `${pts} higher: your responses indicate that this behaviour may be happening more often than in your earlier attempt. On this dimension, a lower score is the positive direction.`
      : `${pts} lower: your responses indicate that this behaviour is happening less often than in your earlier attempt, which is the positive direction for this dimension.`;
  }
  return diff > 0
    ? `${pts} higher: your responses indicate this positive behaviour happening more often than in your earlier attempt.`
    : `${pts} lower: your responses indicate this behaviour happening less often than in your earlier attempt. Consider whether circumstances during this period may help explain it.`;
}

/**
 * All completed attempts of one assessment for the signed-in parent, plus a first-to-latest
 * comparison across attempts that are directly comparable with the latest one.
 * Percentages are compared as answered; the difference is in percentage points.
 */
export async function getAssessmentProgress(slug: string, user: User): Promise<AssessmentProgressDto> {
  const instrument = await prisma.assessmentInstrument.findUnique({ where: { slug } });
  if (!instrument) {
    throw new AssessmentError("Assessment not found.", 404, "NOT_FOUND");
  }
  const submissions = await prisma.assessmentSubmission.findMany({
    where: {
      userId: user.id,
      version: { instrumentId: instrument.id },
      status: { in: [AssessmentSubmissionStatus.SUBMITTED, AssessmentSubmissionStatus.CLAIMED] },
      result: { isNot: null },
    },
    include: {
      result: true,
      version: { include: { items: { include: { factor: true } } } },
    },
  });
  submissions.sort((a, b) => completedTime(a) - completedTime(b));
  const plans = await practiceProgressBySubmission(submissions.map((s) => s.id));

  const keyed = submissions.map((sub, i) => {
    const scores = sub.result!.factorScores as unknown as Record<string, FactorScoreDto>;
    return { sub, scores, attemptNumber: i + 1, key: comparabilityKey(scores, sub.version) };
  });
  const latest = keyed[keyed.length - 1];
  const group = latest && latest.key ? keyed.filter((k) => k.key === latest.key) : [];

  const attempts = keyed.map((k) => ({
    submissionId: k.sub.id,
    attemptNumber: k.attemptNumber,
    completedAt: new Date(completedTime(k.sub)).toISOString(),
    versionNumber: k.sub.version.versionNumber,
    status: "COMPLETED" as const,
    scores: Object.values(k.scores)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
      .map((s) => ({
      factorCode: s.factorCode,
      factorName: s.factorName,
      percentage: s.percentage,
      band: s.band,
      classification: s.classification ?? null,
    })),
    comparable: group.includes(k),
    practiceStarted: plans.has(k.sub.id),
    practiceCompletedDays: plans.get(k.sub.id) ?? 0,
  }));

  let comparison: AssessmentProgressDto["comparison"];
  if (keyed.length < 2) {
    comparison = {
      available: false,
      reason: keyed.length === 0 ? "You have not completed this assessment yet." : "Complete this assessment again to see how your answers compare over time.",
      rows: [],
    };
  } else if (group.length < 2) {
    comparison = {
      available: false,
      reason:
        "Your earlier attempts used a different version of this assessment (or were calculated before scoring direction was recorded), so their scores cannot be compared directly with your latest attempt. You can still open each report.",
      rows: [],
    };
  } else {
    const first = group[0];
    const rows = Object.values(latest.scores)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
      .map((s) => {
      const earlier = first.scores[s.factorCode];
      const diff = s.percentage - earlier.percentage;
      const direction = s.direction ?? "HIGHER_IS_POSITIVE";
      return {
        factorCode: s.factorCode,
        factorName: s.factorName,
        direction,
        earlier: earlier.percentage,
        latest: s.percentage,
        difference: diff,
        earlierLabel: earlier.band,
        latestLabel: s.band,
        meaning: describeChange(direction, diff),
      };
    });
    comparison = {
      available: true,
      firstSubmissionId: first.sub.id,
      latestSubmissionId: latest.sub.id,
      firstCompletedAt: new Date(completedTime(first.sub)).toISOString(),
      latestCompletedAt: new Date(completedTime(latest.sub)).toISOString(),
      comparedAttempts: group.length,
      rows,
    };
  }

  return {
    instrument: { slug: instrument.slug, title: instrument.title, description: instrument.description },
    attempts: attempts.reverse(), // newest first
    comparison,
  };
}
