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
  AssessmentRecommendationDto,
  FactorScoreDto,
  AreaSummaryDto,
  AssessmentSubmissionHistoryItem,
} from "@insight-ignite/shared";
import {
  calculateAssessmentScores,
  AssessmentError,
  RawOptionWithWeight,
} from "./scoring.service";
import { getApprovedCourseRecommendations } from "./recommendations.service";
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
        recommendationsSummary: recommendedCourses as unknown as object,
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
    recommendedCourses,
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

  return {
    submissionId: submission.id,
    versionNumber: submission.version.versionNumber,
    completedAt: submission.completedAt ? submission.completedAt.toISOString() : submission.createdAt.toISOString(),
    isAnonymous: submission.userId === null,
    factorScores: submission.result.factorScores as unknown as Record<string, FactorScoreDto>,
    strengths: (submission.result.strengths as unknown as AreaSummaryDto[]) || [],
    growthAreas: (submission.result.growthAreas as unknown as AreaSummaryDto[]) || [],
    recommendedCourses: (submission.result.recommendationsSummary as unknown as AssessmentRecommendationDto[]) || [],
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

  return submissions.map((sub) => {
    const strengths = (sub.result?.strengths as unknown as AreaSummaryDto[]) || [];
    const growthAreas = (sub.result?.growthAreas as unknown as AreaSummaryDto[]) || [];

    return {
      submissionId: sub.id,
      instrumentTitle: sub.version.instrument.title,
      versionNumber: sub.version.versionNumber,
      completedAt: sub.completedAt
        ? sub.completedAt.toISOString()
        : sub.createdAt.toISOString(),
      topStrength: strengths[0]?.factorName,
      topGrowthArea: growthAreas[0]?.factorName,
    };
  });
}
