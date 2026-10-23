import { prisma, User, AssessmentSubmissionStatus } from "@insight-ignite/database";
import {
  FactorScoreDto,
  PracticePlanDayTemplateDto,
  PracticePlanDto,
  UpdatePracticeDayInput,
} from "@insight-ignite/shared";
import { AssessmentError, ApprovedScoringConfigSchema } from "./scoring.service";
import { buildPracticePlan, dimensionFromScore } from "./report-content";
import { readStoredGuidance } from "./stored-result";

const PLAN_DAYS = 7;

/**
 * Loads a completed submission that belongs to the signed-in parent. Practice plans are
 * personal: only the owner may read or change them (admins included), and anonymous
 * results must be saved to a profile first.
 */
async function loadOwnedSubmission(submissionId: string, user: User) {
  const submission = await prisma.assessmentSubmission
    .findUnique({
      where: { id: submissionId },
      include: { result: true, version: true, practicePlan: { include: { progress: true } } },
    })
    .catch((error) => {
      // Practice-plan tables not created yet in this database (migration pending)
      if ((error as { code?: string }).code === "P2021") {
        throw new AssessmentError("Practice plan tracking is not available yet.", 503, "PLAN_STORAGE_UNAVAILABLE");
      }
      throw error;
    });
  if (!submission || !submission.result) {
    throw new AssessmentError("Assessment result not found.", 404, "NOT_FOUND");
  }
  if (!submission.userId) {
    throw new AssessmentError(
      "Save this result to your profile to start and track a practice plan.",
      403,
      "PLAN_REQUIRES_ACCOUNT"
    );
  }
  if (submission.userId !== user.id) {
    throw new AssessmentError("You do not have permission to view this practice plan.", 403, "FORBIDDEN");
  }
  if (
    submission.status !== AssessmentSubmissionStatus.SUBMITTED &&
    submission.status !== AssessmentSubmissionStatus.CLAIMED
  ) {
    throw new AssessmentError("This assessment attempt is not complete.", 400, "ATTEMPT_NOT_COMPLETE");
  }
  return submission;
}

/** The seven-day plan this result would generate (from the stored result, never re-scored). */
export function planTemplateForResult(
  factorScores: Record<string, FactorScoreDto>,
  recommendationsSummary: unknown,
  scoringConfig: unknown
): PracticePlanDayTemplateDto[] {
  const stored = readStoredGuidance(recommendationsSummary);
  if (stored.practicePlan.length > 0) return stored.practicePlan;
  const dims = Object.values(factorScores || {}).map(dimensionFromScore);
  if (dims.length === 0 || dims.some((d) => d === null)) return []; // legacy result
  const config = ApprovedScoringConfigSchema.safeParse(scoringConfig);
  return buildPracticePlan(dims as NonNullable<(typeof dims)[number]>[], config.success ? config.data.guidanceTemplates : undefined);
}

function toDto(
  submissionId: string,
  template: PracticePlanDayTemplateDto[],
  plan: { startedAt: Date; completedAt: Date | null; progress: Array<{ dayNumber: number; completedAt: Date | null; note: string | null }> } | null
): PracticePlanDto {
  const byDay = new Map((plan?.progress || []).map((p) => [p.dayNumber, p]));
  const days = template.map((t) => {
    const p = byDay.get(t.day);
    return { ...t, completedAt: p?.completedAt ? p.completedAt.toISOString() : null, note: p?.note ?? null };
  });
  const completedCount = days.filter((d) => d.completedAt).length;
  return {
    submissionId,
    started: Boolean(plan),
    startedAt: plan ? plan.startedAt.toISOString() : null,
    completedAt: plan?.completedAt ? plan.completedAt.toISOString() : null,
    days,
    completedCount,
    completionPct: days.length > 0 ? Math.round((completedCount / days.length) * 100) : 0,
  };
}

export async function getPracticePlan(submissionId: string, user: User): Promise<PracticePlanDto> {
  const sub = await loadOwnedSubmission(submissionId, user);
  if (sub.practicePlan) {
    return toDto(sub.id, sub.practicePlan.days as unknown as PracticePlanDayTemplateDto[], sub.practicePlan);
  }
  const template = planTemplateForResult(
    sub.result!.factorScores as unknown as Record<string, FactorScoreDto>,
    sub.result!.recommendationsSummary,
    sub.version.scoringConfig
  );
  return toDto(sub.id, template, null);
}

/** Starts the plan (idempotent): the plan content is snapshotted at this moment. */
export async function startPracticePlan(submissionId: string, user: User): Promise<PracticePlanDto> {
  const sub = await loadOwnedSubmission(submissionId, user);
  if (!sub.practicePlan) {
    const template = planTemplateForResult(
      sub.result!.factorScores as unknown as Record<string, FactorScoreDto>,
      sub.result!.recommendationsSummary,
      sub.version.scoringConfig
    );
    if (template.length !== PLAN_DAYS) {
      throw new AssessmentError(
        "A practice plan is not available for this result because it was calculated before personalized plans existed.",
        400,
        "PLAN_UNAVAILABLE"
      );
    }
    // upsert keeps repeated clicks from creating a second plan
    await prisma.assessmentPracticePlan.upsert({
      where: { submissionId: sub.id },
      create: { submissionId: sub.id, userId: user.id, days: template as unknown as object },
      update: {},
    });
  }
  return getPracticePlan(submissionId, user);
}

/** Marks one day complete or not complete, with an optional reflection note (idempotent). */
export async function updatePracticeDay(
  submissionId: string,
  dayNumber: number,
  input: UpdatePracticeDayInput,
  user: User
): Promise<PracticePlanDto> {
  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > PLAN_DAYS) {
    throw new AssessmentError(`Day must be between 1 and ${PLAN_DAYS}.`, 400, "INVALID_DAY");
  }
  const sub = await loadOwnedSubmission(submissionId, user);
  if (!sub.practicePlan) {
    throw new AssessmentError("Start the practice plan before marking days.", 400, "PLAN_NOT_STARTED");
  }
  const plan = sub.practicePlan;
  const existing = plan.progress.find((p) => p.dayNumber === dayNumber);
  // Keep the original completion time when the same day is marked complete again
  const completedAt = input.completed ? existing?.completedAt ?? new Date() : null;
  const note = input.note === undefined ? existing?.note ?? null : input.note || null;

  await prisma.$transaction(async (tx) => {
    await tx.assessmentPracticeDay.upsert({
      where: { planId_dayNumber: { planId: plan.id, dayNumber } },
      create: { planId: plan.id, dayNumber, completedAt, note },
      update: { completedAt, note },
    });
    const done = await tx.assessmentPracticeDay.count({ where: { planId: plan.id, completedAt: { not: null } } });
    await tx.assessmentPracticePlan.update({
      where: { id: plan.id },
      data: { completedAt: done >= PLAN_DAYS ? plan.completedAt ?? new Date() : null },
    });
  });
  return getPracticePlan(submissionId, user);
}
