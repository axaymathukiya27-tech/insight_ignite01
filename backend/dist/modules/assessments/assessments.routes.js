"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assessmentClaimRateLimiter = exports.assessmentSubmitRateLimiter = void 0;
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const assessments_controller_1 = require("./assessments.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const shared_1 = require("@insight-ignite/shared");
const response_1 = require("../../utils/response");
const router = (0, express_1.Router)();
// Rate limiter for assessment submissions: 20 per hour per IP
exports.assessmentSubmitRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        const requestId = req.headers["x-request-id"];
        (0, response_1.sendError)(res, "Too many assessment submissions from this network. Please wait before retrying.", 429, "RATE_LIMIT_EXCEEDED", requestId);
    },
});
// Rate limiter for claiming: 15 per 15 minutes per IP
exports.assessmentClaimRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        const requestId = req.headers["x-request-id"];
        (0, response_1.sendError)(res, "Too many account claim attempts. Please wait a few minutes before trying again.", 429, "RATE_LIMIT_EXCEEDED", requestId);
    },
});
/**
 * Public endpoint to retrieve active, published assessment instrument and questions.
 * Strips internal point weights and scoring configs.
 */
router.get("/active", assessments_controller_1.handleGetActiveAssessment);
/**
 * Submit assessment answers.
 * Supports anonymous guests or authenticated learners.
 * Calculates scores server-side.
 */
router.post("/submit", auth_middleware_1.authenticate, exports.assessmentSubmitRateLimiter, (0, validate_middleware_1.validateRequest)({ body: shared_1.SubmitAssessmentInputSchema }), assessments_controller_1.handleSubmitAssessment);
/**
 * Retrieve assessment result by ID.
 * Protected: Requires either active user session matching submission owner
 * or HTTP-only anonymous access credential cookie.
 */
router.get("/results/:id", auth_middleware_1.authenticate, assessments_controller_1.handleGetResult);
/**
 * Link an anonymous assessment submission to an authenticated user profile.
 * Protected: Requires authentication and single-use claim token.
 */
router.post("/claim", auth_middleware_1.requireAuth, exports.assessmentClaimRateLimiter, (0, validate_middleware_1.validateRequest)({ body: shared_1.ClaimAssessmentInputSchema }), assessments_controller_1.handleClaimAssessment);
/**
 * Retrieve assessment submission history for the authenticated user.
 * Protected: Requires authentication. Restricted strictly to caller's records.
 */
router.get("/my-history", auth_middleware_1.requireAuth, assessments_controller_1.handleGetMyAssessmentHistory);
exports.default = router;
