import {
  PublicAssessmentInstrument,
  AssessmentResultDto,
  AssessmentSubmissionHistoryItem,
  SubmitAssessmentInput,
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
