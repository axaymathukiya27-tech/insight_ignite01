"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_assessments_controller_1 = require("./admin-assessments.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const database_1 = require("@insight-ignite/database");
const shared_1 = require("@insight-ignite/shared");
const router = (0, express_1.Router)();
// Strict platform administrator authorization boundary
router.use(auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(database_1.UserRole.PLATFORM_ADMIN));
/**
 * List all assessment instruments.
 */
router.get("/instruments", admin_assessments_controller_1.handleListInstruments);
/**
 * Create a new draft assessment instrument and initial draft Version 1.
 */
router.post("/instruments", (0, validate_middleware_1.validateRequest)({ body: shared_1.CreateAssessmentInstrumentInputSchema }), admin_assessments_controller_1.handleCreateInstrument);
/**
 * Retrieve instrument details, version timeline, and audit logs.
 */
router.get("/instruments/:id", admin_assessments_controller_1.handleGetInstrumentDetail);
/**
 * Create a new incremental draft version for an instrument.
 */
router.post("/instruments/:id/versions", (0, validate_middleware_1.validateRequest)({ body: shared_1.CreateAssessmentVersionInputSchema }), admin_assessments_controller_1.handleCreateDraftVersion);
/**
 * Retrieve detailed authoring spec for an assessment version.
 */
router.get("/versions/:versionId", admin_assessments_controller_1.handleGetVersionDetail);
/**
 * Update metadata for a DRAFT version.
 * Blocked if version is ACTIVE or RETIRED.
 */
router.put("/versions/:versionId", (0, validate_middleware_1.validateRequest)({ body: shared_1.UpdateAssessmentVersionMetadataInputSchema }), admin_assessments_controller_1.handleUpdateDraftVersionMetadata);
// ---------------------------------------------------------------------------
// Phase 4B: Factors Authoring
// ---------------------------------------------------------------------------
/**
 * Create a new factor definition in a draft assessment version.
 */
router.post("/versions/:versionId/factors", (0, validate_middleware_1.validateRequest)({ body: shared_1.CreateAssessmentFactorInputSchema }), admin_assessments_controller_1.handleCreateFactor);
/**
 * Update an existing factor definition in a draft version.
 */
router.put("/factors/:factorId", (0, validate_middleware_1.validateRequest)({ body: shared_1.UpdateAssessmentFactorInputSchema }), admin_assessments_controller_1.handleUpdateFactor);
/**
 * Delete a factor definition from a draft version.
 * Blocked if any questions reference the factor.
 */
router.delete("/factors/:factorId", admin_assessments_controller_1.handleDeleteFactor);
// ---------------------------------------------------------------------------
// Phase 4B: Question Items & Options Authoring
// ---------------------------------------------------------------------------
/**
 * Create a new question item and its response options in a draft version.
 */
router.post("/versions/:versionId/items", (0, validate_middleware_1.validateRequest)({ body: shared_1.CreateAssessmentItemInputSchema }), admin_assessments_controller_1.handleCreateItem);
/**
 * Update a question item and/or its response options in a draft version.
 */
router.put("/items/:itemId", (0, validate_middleware_1.validateRequest)({ body: shared_1.UpdateAssessmentItemInputSchema }), admin_assessments_controller_1.handleUpdateItem);
/**
 * Delete a question item from a draft version.
 */
router.delete("/items/:itemId", admin_assessments_controller_1.handleDeleteItem);
// ---------------------------------------------------------------------------
// Phase 4B: Scoring Configuration
// ---------------------------------------------------------------------------
/**
 * Upload/update the approved scoring configuration for a draft version.
 * Strictly validated against ApprovedScoringConfigSchema.
 */
router.put("/versions/:versionId/scoring-config", admin_assessments_controller_1.handleUpdateScoringConfig);
// ---------------------------------------------------------------------------
// Phase 4B: Published Course Recommendation Mappings
// ---------------------------------------------------------------------------
/**
 * Create a factor-to-course recommendation mapping.
 * Restricted strictly to courses in PUBLISHED status.
 */
router.post("/versions/:versionId/course-mappings", (0, validate_middleware_1.validateRequest)({ body: shared_1.CreateCourseMappingBodySchema }), admin_assessments_controller_1.handleCreateCourseMapping);
/**
 * Remove a course recommendation mapping from a draft version.
 */
router.delete("/course-mappings/:mappingId", admin_assessments_controller_1.handleDeleteCourseMapping);
// ---------------------------------------------------------------------------
// Phase 4B: Pre-Activation Readiness Validation Service (Read-Only)
// ---------------------------------------------------------------------------
/**
 * Validate all technical and governance prerequisites for activation.
 * Returns structured findings without modifying or activating the version.
 */
router.get("/versions/:versionId/readiness", admin_assessments_controller_1.handleCheckActivationReadiness);
exports.default = router;
