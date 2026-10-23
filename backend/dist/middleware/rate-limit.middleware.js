"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgotPasswordRateLimiter = exports.registerRateLimiter = exports.loginRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const response_1 = require("../utils/response");
exports.loginRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15, // 15 login requests per window per IP
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        const requestId = req.headers["x-request-id"];
        (0, response_1.sendError)(res, "Too many login attempts from this network. Please wait 15 minutes before retrying.", 429, "RATE_LIMIT_EXCEEDED", requestId);
    },
});
exports.registerRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 registration attempts per hour per IP
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        const requestId = req.headers["x-request-id"];
        (0, response_1.sendError)(res, "Too many account creation attempts. Please try again later.", 429, "RATE_LIMIT_EXCEEDED", requestId);
    },
});
exports.forgotPasswordRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 password recovery attempts per hour per IP
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        const requestId = req.headers["x-request-id"];
        (0, response_1.sendError)(res, "Too many password recovery requests. Please try again later.", 429, "RATE_LIMIT_EXCEEDED", requestId);
    },
});
