"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleListInstruments = handleListInstruments;
exports.handleCreateInstrument = handleCreateInstrument;
exports.handleGetInstrumentDetail = handleGetInstrumentDetail;
exports.handleCreateDraftVersion = handleCreateDraftVersion;
exports.handleGetVersionDetail = handleGetVersionDetail;
exports.handleUpdateDraftVersionMetadata = handleUpdateDraftVersionMetadata;
exports.handleCreateFactor = handleCreateFactor;
exports.handleUpdateFactor = handleUpdateFactor;
exports.handleDeleteFactor = handleDeleteFactor;
exports.handleCreateItem = handleCreateItem;
exports.handleUpdateItem = handleUpdateItem;
exports.handleDeleteItem = handleDeleteItem;
exports.handleUpdateScoringConfig = handleUpdateScoringConfig;
exports.handleCreateCourseMapping = handleCreateCourseMapping;
exports.handleDeleteCourseMapping = handleDeleteCourseMapping;
exports.handleCheckActivationReadiness = handleCheckActivationReadiness;
const admin_assessments_service_1 = require("./admin-assessments.service");
const response_1 = require("../../utils/response");
async function handleListInstruments(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const instruments = await (0, admin_assessments_service_1.listAdminInstruments)();
        (0, response_1.sendSuccess)(res, { instruments }, undefined, 200, requestId);
    }
    catch (error) {
        next(error);
    }
}
async function handleCreateInstrument(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const instrument = await (0, admin_assessments_service_1.createDraftInstrument)(req.body, req.user);
        (0, response_1.sendSuccess)(res, { instrument }, "Draft assessment instrument and initial Version 1 created successfully.", 201, requestId);
    }
    catch (error) {
        next(error);
    }
}
async function handleGetInstrumentDetail(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const { id } = req.params;
        const instrument = await (0, admin_assessments_service_1.getInstrumentDetail)(id);
        (0, response_1.sendSuccess)(res, { instrument }, undefined, 200, requestId);
    }
    catch (error) {
        next(error);
    }
}
async function handleCreateDraftVersion(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const { id } = req.params;
        const version = await (0, admin_assessments_service_1.createDraftVersion)(id, req.body, req.user);
        (0, response_1.sendSuccess)(res, { version }, `Draft Version ${version.versionNumber} created successfully.`, 201, requestId);
    }
    catch (error) {
        next(error);
    }
}
async function handleGetVersionDetail(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const { versionId } = req.params;
        const version = await (0, admin_assessments_service_1.getAdminVersionDetail)(versionId);
        (0, response_1.sendSuccess)(res, { version }, undefined, 200, requestId);
    }
    catch (error) {
        next(error);
    }
}
async function handleUpdateDraftVersionMetadata(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const { versionId } = req.params;
        const version = await (0, admin_assessments_service_1.updateDraftVersionMetadata)(versionId, req.body, req.user);
        (0, response_1.sendSuccess)(res, { version }, "Draft version metadata updated successfully.", 200, requestId);
    }
    catch (error) {
        next(error);
    }
}
// ---------------------------------------------------------------------------
// Phase 4B: Factors
// ---------------------------------------------------------------------------
async function handleCreateFactor(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const { versionId } = req.params;
        const factor = await (0, admin_assessments_service_1.createAssessmentFactor)(versionId, req.body, req.user);
        (0, response_1.sendSuccess)(res, { factor }, "Factor definition created successfully.", 201, requestId);
    }
    catch (error) {
        next(error);
    }
}
async function handleUpdateFactor(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const { factorId } = req.params;
        const factor = await (0, admin_assessments_service_1.updateAssessmentFactor)(factorId, req.body, req.user);
        (0, response_1.sendSuccess)(res, { factor }, "Factor definition updated successfully.", 200, requestId);
    }
    catch (error) {
        next(error);
    }
}
async function handleDeleteFactor(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const { factorId } = req.params;
        const result = await (0, admin_assessments_service_1.deleteAssessmentFactor)(factorId, req.user);
        (0, response_1.sendSuccess)(res, result, result.message, 200, requestId);
    }
    catch (error) {
        next(error);
    }
}
// ---------------------------------------------------------------------------
// Phase 4B: Questions & Options
// ---------------------------------------------------------------------------
async function handleCreateItem(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const { versionId } = req.params;
        const item = await (0, admin_assessments_service_1.createAssessmentItem)(versionId, req.body, req.user);
        (0, response_1.sendSuccess)(res, { item }, "Question item created successfully.", 201, requestId);
    }
    catch (error) {
        next(error);
    }
}
async function handleUpdateItem(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const { itemId } = req.params;
        const item = await (0, admin_assessments_service_1.updateAssessmentItem)(itemId, req.body, req.user);
        (0, response_1.sendSuccess)(res, { item }, "Question item updated successfully.", 200, requestId);
    }
    catch (error) {
        next(error);
    }
}
async function handleDeleteItem(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const { itemId } = req.params;
        const result = await (0, admin_assessments_service_1.deleteAssessmentItem)(itemId, req.user);
        (0, response_1.sendSuccess)(res, result, result.message, 200, requestId);
    }
    catch (error) {
        next(error);
    }
}
// ---------------------------------------------------------------------------
// Phase 4B: Scoring Configuration
// ---------------------------------------------------------------------------
async function handleUpdateScoringConfig(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const { versionId } = req.params;
        const result = await (0, admin_assessments_service_1.updateVersionScoringConfig)(versionId, req.body, req.user);
        (0, response_1.sendSuccess)(res, result, result.message, 200, requestId);
    }
    catch (error) {
        next(error);
    }
}
// ---------------------------------------------------------------------------
// Phase 4B: Course Recommendation Mappings
// ---------------------------------------------------------------------------
async function handleCreateCourseMapping(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const { versionId } = req.params;
        const courseMapping = await (0, admin_assessments_service_1.createCourseMapping)(versionId, req.body, req.user);
        (0, response_1.sendSuccess)(res, { courseMapping }, "Course recommendation mapping created successfully.", 201, requestId);
    }
    catch (error) {
        next(error);
    }
}
async function handleDeleteCourseMapping(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const { mappingId } = req.params;
        const result = await (0, admin_assessments_service_1.deleteCourseMapping)(mappingId, req.user);
        (0, response_1.sendSuccess)(res, result, result.message, 200, requestId);
    }
    catch (error) {
        next(error);
    }
}
// ---------------------------------------------------------------------------
// Phase 4B: Pre-Activation Readiness Check (Read-Only)
// ---------------------------------------------------------------------------
async function handleCheckActivationReadiness(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const { versionId } = req.params;
        const report = await (0, admin_assessments_service_1.checkActivationReadiness)(versionId);
        (0, response_1.sendSuccess)(res, { report }, report.isReadyForActivation
            ? "Assessment version meets all technical and governance prerequisites."
            : "Assessment version is not ready for activation.", 200, requestId);
    }
    catch (error) {
        next(error);
    }
}
