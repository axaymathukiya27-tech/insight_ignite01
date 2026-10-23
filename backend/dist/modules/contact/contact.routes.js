"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const database_1 = require("@insight-ignite/database");
const shared_1 = require("@insight-ignite/shared");
const contact_service_1 = require("./contact.service");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const response_1 = require("../../utils/response");
const router = (0, express_1.Router)();
const contactRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 inquiries per hour per IP
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        const requestId = req.headers["x-request-id"];
        (0, response_1.sendError)(res, "Too many messages sent. Please try again later.", 429, "RATE_LIMIT_EXCEEDED", requestId);
    },
});
// Public: submit an inquiry from the contact page
router.post("/", contactRateLimiter, (0, validate_middleware_1.validateRequest)({ body: shared_1.ContactInquirySchema }), async (req, res, next) => {
    try {
        const requestId = req.headers["x-request-id"];
        const inquiry = await (0, contact_service_1.createContactInquiry)(req.body);
        (0, response_1.sendSuccess)(res, { inquiry }, "Thank you. Your message has been received.", 201, requestId);
    }
    catch (error) {
        next(error);
    }
});
// Admin: list submitted inquiries
router.get("/admin", auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(database_1.UserRole.PLATFORM_ADMIN), async (req, res, next) => {
    try {
        const requestId = req.headers["x-request-id"];
        const inquiries = await (0, contact_service_1.listContactInquiries)();
        (0, response_1.sendSuccess)(res, { inquiries }, undefined, 200, requestId);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
