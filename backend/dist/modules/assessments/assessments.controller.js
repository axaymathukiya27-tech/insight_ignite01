"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetActiveAssessment = handleGetActiveAssessment;
exports.handleSubmitAssessment = handleSubmitAssessment;
exports.handleGetResult = handleGetResult;
exports.handleClaimAssessment = handleClaimAssessment;
exports.handleGetMyAssessmentHistory = handleGetMyAssessmentHistory;
const assessments_service_1 = require("./assessments.service");
const token_util_1 = require("./token.util");
const response_1 = require("../../utils/response");
async function handleGetActiveAssessment(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const slug = req.query.slug || undefined;
        const instrument = await (0, assessments_service_1.getActiveAssessment)(slug);
        (0, response_1.sendSuccess)(res, { instrument }, undefined, 200, requestId);
    }
    catch (error) {
        next(error);
    }
}
async function handleSubmitAssessment(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const { result, accessKey, claimToken, expiresAt } = await (0, assessments_service_1.submitAssessment)(req.body, req.user);
        // If anonymous, set the secure HTTP-only access cookie
        if (accessKey) {
            res.cookie(token_util_1.ASSESSMENT_COOKIE_NAME, accessKey, (0, token_util_1.getAssessmentCookieOptions)(expiresAt));
        }
        (0, response_1.sendSuccess)(res, {
            result,
            ...(claimToken ? { claimToken } : {}),
        }, "Assessment responses submitted and calculated successfully.", 201, requestId);
    }
    catch (error) {
        next(error);
    }
}
async function handleGetResult(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const { id } = req.params;
        // Retrieve credential from HTTP-only cookie or custom authorization header
        const accessKey = req.cookies?.[token_util_1.ASSESSMENT_COOKIE_NAME] ||
            req.headers["x-assessment-access-key"];
        const result = await (0, assessments_service_1.getAssessmentResult)(id, req.user, accessKey);
        (0, response_1.sendSuccess)(res, { result }, undefined, 200, requestId);
    }
    catch (error) {
        next(error);
    }
}
async function handleClaimAssessment(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const { claimToken } = req.body;
        const claimResponse = await (0, assessments_service_1.claimAssessment)(claimToken, req.user);
        // Clear guest cookie now that the assessment is linked to user's profile
        res.clearCookie(token_util_1.ASSESSMENT_COOKIE_NAME, (0, token_util_1.getClearAssessmentCookieOptions)());
        (0, response_1.sendSuccess)(res, claimResponse, claimResponse.message, 200, requestId);
    }
    catch (error) {
        next(error);
    }
}
async function handleGetMyAssessmentHistory(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const history = await (0, assessments_service_1.getUserAssessmentHistory)(req.user.id);
        (0, response_1.sendSuccess)(res, { history }, undefined, 200, requestId);
    }
    catch (error) {
        next(error);
    }
}
