import {
  PublicAssessmentInstrument,
  AssessmentResultDto,
  AssessmentSubmissionHistoryItem,
  SubmitAssessmentInput,
  PracticePlanDto,
  AssessmentProgressDto,
  MyEnrollmentDto,
} from "@insight-ignite/shared";
import { apiFetch, ApiError } from "@/lib/api-client";

export const DEFAULT_CONSENT_NOTICE_VERSION = "2026.1-parent-self-reflection";

export interface ActiveAssessmentResponse {
  instrument: PublicAssessmentInstrument;
}

export interface SubmitAssessmentResponse {
  result: AssessmentResultDto;
  claimToken?: string;
}

export interface AssessmentResultResponse {
  result: AssessmentResultDto;
}

export interface ClaimAssessmentResponse {
  success: boolean;
  submissionId: string;
  message: string;
}

export interface AssessmentHistoryResponse {
  history: AssessmentSubmissionHistoryItem[];
}

/**
 * Retrieves the currently active published assessment instrument.
 * Returns null if the instrument is not currently active (404 NO_ACTIVE_ASSESSMENT).
 */
export async function getActiveAssessment(
  slug = "parent-growth-self-assessment"
): Promise<PublicAssessmentInstrument | null> {
  try {
    const res = await apiFetch<ActiveAssessmentResponse>(
      `/assessments/active?slug=${encodeURIComponent(slug)}`
    );
    return res.instrument;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export interface ActiveAssessmentSummary {
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  questionCount: number;
}

/**
 * Lists every assessment that currently has a published (active) version.
 */
export async function listActiveAssessments(): Promise<ActiveAssessmentSummary[]> {
  const res = await apiFetch<{ assessments: ActiveAssessmentSummary[] }>("/assessments/catalog");
  return res.assessments || [];
}

/**
 * Submits answers for calculation.
 * Computes scores strictly server-side.
 * Sets HTTP-only credential cookie for anonymous sessions.
 */
export async function submitAssessment(
  input: SubmitAssessmentInput
): Promise<SubmitAssessmentResponse> {
  return await apiFetch<SubmitAssessmentResponse>("/assessments/submit", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Retrieves calculated assessment result by ID.
 * Transmits HTTP-only cookie automatically via credentials: "include".
 */
export async function getAssessmentResult(
  submissionId: string
): Promise<AssessmentResultDto> {
  const res = await apiFetch<AssessmentResultResponse>(
    `/assessments/results/${encodeURIComponent(submissionId)}`
  );
  return res.result;
}

/**
 * Links an anonymous submission to an authenticated user account.
 * Single-use: invalidates the claim token upon use.
 */
export async function claimAssessment(
  claimToken: string
): Promise<ClaimAssessmentResponse> {
  return await apiFetch<ClaimAssessmentResponse>("/assessments/claim", {
    method: "POST",
    body: JSON.stringify({ claimToken }),
  });
}

/**
 * Retrieves historical submissions for the authenticated participant.
 */
export async function getMyAssessmentHistory(): Promise<
  AssessmentSubmissionHistoryItem[]
> {
  const res = await apiFetch<AssessmentHistoryResponse>(
    "/assessments/my-history"
  );
  return res.history || [];
}

/** The seven-day practice plan for one of the signed-in parent's results. */
export async function getPracticePlan(submissionId: string): Promise<PracticePlanDto> {
  const res = await apiFetch<{ plan: PracticePlanDto }>(
    `/assessments/results/${encodeURIComponent(submissionId)}/practice-plan`
  );
  return res.plan;
}

/** Starts the plan (safe to call more than once). */
export async function startPracticePlan(submissionId: string): Promise<PracticePlanDto> {
  const res = await apiFetch<{ plan: PracticePlanDto }>(
    `/assessments/results/${encodeURIComponent(submissionId)}/practice-plan/start`,
    { method: "POST" }
  );
  return res.plan;
}

/** Marks a day complete / not complete and saves the reflection note. */
export async function updatePracticeDay(
  submissionId: string,
  day: number,
  input: { completed: boolean; note?: string | null }
): Promise<PracticePlanDto> {
  const res = await apiFetch<{ plan: PracticePlanDto }>(
    `/assessments/results/${encodeURIComponent(submissionId)}/practice-plan/days/${day}`,
    { method: "PUT", body: JSON.stringify(input) }
  );
  return res.plan;
}

/** Every completed attempt of one assessment, with a comparison of comparable attempts. */
export async function getAssessmentProgress(slug: string): Promise<AssessmentProgressDto> {
  const res = await apiFetch<{ progress: AssessmentProgressDto }>(
    `/assessments/my-progress/${encodeURIComponent(slug)}`
  );
  return res.progress;
}

/** The signed-in learner's real course enrollments. */
export async function getMyEnrollments(): Promise<MyEnrollmentDto[]> {
  const res = await apiFetch<{ enrollments: MyEnrollmentDto[] }>("/courses/my/enrollments");
  return res.enrollments || [];
}
