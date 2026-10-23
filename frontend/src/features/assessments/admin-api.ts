import {
  AdminAssessmentInstrumentSummary,
  AdminAssessmentInstrumentDetail,
  AdminAssessmentVersionDetail,
  AdminAssessmentFactorDto,
  AdminAssessmentItemDto,
  AdminAssessmentCourseMappingDto,
  AssessmentActivationReadinessReport,
  CreateAssessmentInstrumentInput,
  CreateAssessmentVersionInput,
  UpdateAssessmentVersionMetadataInput,
  CreateAssessmentFactorInput,
  UpdateAssessmentFactorInput,
  CreateAssessmentItemInput,
  UpdateAssessmentItemInput,
  CreateCourseMappingBody,
  AdminCourseSummary,
} from "@insight-ignite/shared";
import { apiFetch } from "@/lib/api-client";

/**
 * List all assessment instruments.
 */
export async function listAdminInstruments(): Promise<
  AdminAssessmentInstrumentSummary[]
> {
  const res = await apiFetch<{
    instruments: AdminAssessmentInstrumentSummary[];
  }>("/admin/assessments/instruments");
  return res.instruments || [];
}

/**
 * Create a new draft assessment instrument and its initial draft Version 1.
 */
export async function createDraftInstrument(
  input: CreateAssessmentInstrumentInput
): Promise<AdminAssessmentInstrumentDetail> {
  const res = await apiFetch<{
    instrument: AdminAssessmentInstrumentDetail;
  }>("/admin/assessments/instruments", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.instrument;
}

/**
 * Retrieve instrument details, version timeline, and audit logs.
 */
export async function getInstrumentDetail(
  id: string
): Promise<AdminAssessmentInstrumentDetail> {
  const res = await apiFetch<{
    instrument: AdminAssessmentInstrumentDetail;
  }>(`/admin/assessments/instruments/${id}`);
  return res.instrument;
}

/**
 * Create a new incremental draft version for an existing instrument.
 */
export async function createDraftVersion(
  instrumentId: string,
  input: CreateAssessmentVersionInput
): Promise<AdminAssessmentVersionDetail> {
  const res = await apiFetch<{
    version: AdminAssessmentVersionDetail;
  }>(`/admin/assessments/instruments/${instrumentId}/versions`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.version;
}

/**
 * Retrieve detailed authoring spec for an assessment version.
 */
export async function getAdminVersionDetail(
  versionId: string
): Promise<AdminAssessmentVersionDetail> {
  const res = await apiFetch<{
    version: AdminAssessmentVersionDetail;
  }>(`/admin/assessments/versions/${versionId}`);
  return res.version;
}

/**
 * Update metadata for a DRAFT version.
 */
export async function updateDraftVersionMetadata(
  versionId: string,
  input: UpdateAssessmentVersionMetadataInput
): Promise<AdminAssessmentVersionDetail> {
  const res = await apiFetch<{
    version: AdminAssessmentVersionDetail;
  }>(`/admin/assessments/versions/${versionId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return res.version;
}

/**
 * Create a factor definition in a draft version.
 */
export async function createAssessmentFactor(
  versionId: string,
  input: CreateAssessmentFactorInput
): Promise<AdminAssessmentFactorDto> {
  const res = await apiFetch<{
    factor: AdminAssessmentFactorDto;
  }>(`/admin/assessments/versions/${versionId}/factors`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.factor;
}

/**
 * Update an existing factor definition.
 */
export async function updateAssessmentFactor(
  factorId: string,
  input: UpdateAssessmentFactorInput
): Promise<AdminAssessmentFactorDto> {
  const res = await apiFetch<{
    factor: AdminAssessmentFactorDto;
  }>(`/admin/assessments/factors/${factorId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return res.factor;
}

/**
 * Delete a factor definition.
 */
export async function deleteAssessmentFactor(
  factorId: string
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(
    `/admin/assessments/factors/${factorId}`,
    {
      method: "DELETE",
    }
  );
}

/**
 * Create a question item with answer options in a draft version.
 */
export async function createAssessmentItem(
  versionId: string,
  input: CreateAssessmentItemInput
): Promise<AdminAssessmentItemDto> {
  const res = await apiFetch<{
    item: AdminAssessmentItemDto;
  }>(`/admin/assessments/versions/${versionId}/items`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.item;
}

/**
 * Update a question item and its options.
 */
export async function updateAssessmentItem(
  itemId: string,
  input: UpdateAssessmentItemInput
): Promise<AdminAssessmentItemDto> {
  const res = await apiFetch<{
    item: AdminAssessmentItemDto;
  }>(`/admin/assessments/items/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return res.item;
}

/**
 * Delete a question item.
 */
export async function deleteAssessmentItem(
  itemId: string
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(
    `/admin/assessments/items/${itemId}`,
    {
      method: "DELETE",
    }
  );
}

/**
 * Upload/update scoring configuration.
 */
export async function updateVersionScoringConfig(
  versionId: string,
  config: unknown
): Promise<{ success: boolean; message: string; scoringConfig: unknown }> {
  return apiFetch<{ success: boolean; message: string; scoringConfig: unknown }>(
    `/admin/assessments/versions/${versionId}/scoring-config`,
    {
      method: "PUT",
      body: JSON.stringify(config),
    }
  );
}

/**
 * Create a factor-to-course recommendation mapping.
 */
export async function createCourseMapping(
  versionId: string,
  input: CreateCourseMappingBody
): Promise<AdminAssessmentCourseMappingDto> {
  const res = await apiFetch<{
    courseMapping: AdminAssessmentCourseMappingDto;
  }>(`/admin/assessments/versions/${versionId}/course-mappings`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return res.courseMapping;
}

/**
 * Delete a course recommendation mapping.
 */
export async function deleteCourseMapping(
  mappingId: string
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(
    `/admin/assessments/course-mappings/${mappingId}`,
    {
      method: "DELETE",
    }
  );
}

/**
 * Check activation readiness (read-only audit).
 */
export async function checkActivationReadiness(
  versionId: string
): Promise<AssessmentActivationReadinessReport> {
  const res = await apiFetch<{
    report: AssessmentActivationReadinessReport;
  }>(`/admin/assessments/versions/${versionId}/readiness`);
  return res.report;
}

/**
 * Record professional sign-off on a draft version.
 */
export async function approveVersion(
  versionId: string,
  approverName: string
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(
    `/admin/assessments/versions/${versionId}/approve`,
    {
      method: "POST",
      body: JSON.stringify({ approverName }),
    }
  );
}

/**
 * Publish a draft version so participants can take it.
 */
export async function activateVersion(
  versionId: string
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(
    `/admin/assessments/versions/${versionId}/activate`,
    { method: "POST" }
  );
}

/**
 * List courses for recommendation selection.
 */
export async function listAdminCourses(): Promise<AdminCourseSummary[]> {
  const res = await apiFetch<{ courses: AdminCourseSummary[] }>(
    "/courses/admin/all"
  );
  return res.courses || [];
}
