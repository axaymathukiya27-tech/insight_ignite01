"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASSESSMENT_COOKIE_NAME = void 0;
exports.generateSecureToken = generateSecureToken;
exports.hashToken = hashToken;
exports.getAssessmentCookieOptions = getAssessmentCookieOptions;
exports.getClearAssessmentCookieOptions = getClearAssessmentCookieOptions;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../../config/env");
exports.ASSESSMENT_COOKIE_NAME = "insight_assessment_key";
/**
 * Generates a cryptographically strong random token (hex-encoded).
 */
function generateSecureToken(byteLength = 32) {
    return crypto_1.default.randomBytes(byteLength).toString("hex");
}
/**
 * Computes SHA-256 digest of a raw token.
 * Only the digest is stored in the database.
 */
function hashToken(rawToken) {
    return crypto_1.default.createHash("sha256").update(rawToken.trim()).digest("hex");
}
/**
 * Cookie options for storing the anonymous assessment access credential.
 * Uses HTTP-only, SameSite=Lax, and Secure in production.
 */
function getAssessmentCookieOptions(expiresAt) {
    const isProd = env_1.env.nodeEnv === "production";
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        expires: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default: 30 days retention
    };
}
/**
 * Cookie options to clear the anonymous assessment access key.
 */
function getClearAssessmentCookieOptions() {
    const isProd = env_1.env.nodeEnv === "production";
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
    };
}
