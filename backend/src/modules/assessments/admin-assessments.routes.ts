import { Router } from "express";
import {
  handleListInstruments,
  handleCreateInstrument,
  handleGetInstrumentDetail,
  handleCreateDraftVersion,
  handleGetVersionDetail,
  handleUpdateDraftVersionMetadata,
  handleCreateFactor,
  handleUpdateFactor,
  handleDeleteFactor,
  handleCreateItem,
  handleUpdateItem,
  handleDeleteItem,
  handleUpdateScoringConfig,
  handleCreateCourseMapping,
  handleDeleteCourseMapping,
  handleCheckActivationReadiness,
  handleApproveVersion,
  handleActivateVersion,
} from "./admin-assessments.controller";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validate.middleware";
import { UserRole } from "@insight-ignite/database";
import {
  CreateAssessmentInstrumentInputSchema,
  CreateAssessmentVersionInputSchema,
  UpdateAssessmentVersionMetadataInputSchema,
  CreateAssessmentFactorInputSchema,
  UpdateAssessmentFactorInputSchema,
  CreateAssessmentItemInputSchema,
  UpdateAssessmentItemInputSchema,
  CreateCourseMappingBodySchema,
} from "@insight-ignite/shared";

const router = Router();

// Strict platform administrator authorization boundary
router.use(requireAuth, requireRole(UserRole.PLATFORM_ADMIN));

/**
 * List all assessment instruments.
 */
router.get("/instruments", handleListInstruments);

/**
 * Create a new draft assessment instrument and initial draft Version 1.
 */
router.post(
  "/instruments",
  validateRequest({ body: CreateAssessmentInstrumentInputSchema }),
  handleCreateInstrument
);

/**
 * Retrieve instrument details, version timeline, and audit logs.
 */
router.get("/instruments/:id", handleGetInstrumentDetail);

/**
 * Create a new incremental draft version for an instrument.
 */
router.post(
  "/instruments/:id/versions",
  validateRequest({ body: CreateAssessmentVersionInputSchema }),
  handleCreateDraftVersion
);

/**
 * Retrieve detailed authoring spec for an assessment version.
 */
router.get("/versions/:versionId", handleGetVersionDetail);

/**
 * Update metadata for a DRAFT version.
 * Blocked if version is ACTIVE or RETIRED.
 */
router.put(
  "/versions/:versionId",
  validateRequest({ body: UpdateAssessmentVersionMetadataInputSchema }),
  handleUpdateDraftVersionMetadata
);

// ---------------------------------------------------------------------------
// Phase 4B: Factors Authoring
// ---------------------------------------------------------------------------

/**
 * Create a new factor definition in a draft assessment version.
 */
router.post(
  "/versions/:versionId/factors",
  validateRequest({ body: CreateAssessmentFactorInputSchema }),
  handleCreateFactor
);

/**
 * Update an existing factor definition in a draft version.
 */
router.put(
  "/factors/:factorId",
  validateRequest({ body: UpdateAssessmentFactorInputSchema }),
  handleUpdateFactor
);

/**
 * Delete a factor definition from a draft version.
 * Blocked if any questions reference the factor.
 */
router.delete("/factors/:factorId", handleDeleteFactor);

// ---------------------------------------------------------------------------
// Phase 4B: Question Items & Options Authoring
// ---------------------------------------------------------------------------

/**
 * Create a new question item and its response options in a draft version.
 */
router.post(
  "/versions/:versionId/items",
  validateRequest({ body: CreateAssessmentItemInputSchema }),
  handleCreateItem
);

/**
 * Update a question item and/or its response options in a draft version.
 */
router.put(
  "/items/:itemId",
  validateRequest({ body: UpdateAssessmentItemInputSchema }),
  handleUpdateItem
);

/**
 * Delete a question item from a draft version.
 */
router.delete("/items/:itemId", handleDeleteItem);

// ---------------------------------------------------------------------------
// Phase 4B: Scoring Configuration
// ---------------------------------------------------------------------------

/**
 * Upload/update the approved scoring configuration for a draft version.
 * Strictly validated against ApprovedScoringConfigSchema.
 */
router.put("/versions/:versionId/scoring-config", handleUpdateScoringConfig);

// ---------------------------------------------------------------------------
// Phase 4B: Published Course Recommendation Mappings
// ---------------------------------------------------------------------------

/**
 * Create a factor-to-course recommendation mapping.
 * Restricted strictly to courses in PUBLISHED status.
 */
router.post(
  "/versions/:versionId/course-mappings",
  validateRequest({ body: CreateCourseMappingBodySchema }),
  handleCreateCourseMapping
);

/**
 * Remove a course recommendation mapping from a draft version.
 */
router.delete("/course-mappings/:mappingId", handleDeleteCourseMapping);

// ---------------------------------------------------------------------------
// Phase 4B: Pre-Activation Readiness Validation Service (Read-Only)
// ---------------------------------------------------------------------------

/**
 * Validate all technical and governance prerequisites for activation.
 * Returns structured findings without modifying or activating the version.
 */
router.get("/versions/:versionId/readiness", handleCheckActivationReadiness);

// ---------------------------------------------------------------------------
// Professional Approval & Publishing
// ---------------------------------------------------------------------------

/**
 * Record professional sign-off on a draft version.
 */
router.post("/versions/:versionId/approve", handleApproveVersion);

/**
 * Publish a draft version (all readiness checks must pass).
 * Retires any previously active version of the same instrument.
 */
router.post("/versions/:versionId/activate", handleActivateVersion);

export default router;
