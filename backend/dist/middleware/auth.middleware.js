"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
exports.requireVerifiedEmail = requireVerifiedEmail;
const database_1 = require("@insight-ignite/database");
const session_service_1 = require("../modules/auth/session.service");
const env_1 = require("../config/env");
const response_1 = require("../utils/response");
async function authenticate(req, res, next) {
    const sessionToken = req.cookies?.[env_1.env.sessionCookieName];
    if (!sessionToken) {
        next();
        return;
    }
    try {
        const session = await (0, session_service_1.validateSession)(sessionToken);
        if (session) {
            req.user = session.user;
            req.sessionToken = sessionToken;
        }
    }
    catch {
        // Session validation error, proceed unauthenticated
    }
    next();
}
async function requireAuth(req, res, next) {
    const sessionToken = req.cookies?.[env_1.env.sessionCookieName];
    const requestId = req.headers["x-request-id"];
    if (!sessionToken) {
        (0, response_1.sendError)(res, "Authentication required. Please sign in.", 401, "UNAUTHORIZED", requestId);
        return;
    }
    const session = await (0, session_service_1.validateSession)(sessionToken);
    if (!session) {
        (0, response_1.sendError)(res, "Session has expired or is invalid. Please sign in again.", 401, "SESSION_EXPIRED", requestId);
        return;
    }
    req.user = session.user;
    req.sessionToken = sessionToken;
    next();
}
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        const requestId = req.headers["x-request-id"];
        if (!req.user) {
            (0, response_1.sendError)(res, "Authentication required.", 401, "UNAUTHORIZED", requestId);
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            (0, response_1.sendError)(res, `Access denied. Requires one of: [${allowedRoles.join(", ")}]. Current role: [${req.user.role}].`, 403, "INSUFFICIENT_PERMISSIONS", requestId);
            return;
        }
        next();
    };
}
function requireVerifiedEmail(req, res, next) {
    const requestId = req.headers["x-request-id"];
    if (!req.user) {
        (0, response_1.sendError)(res, "Authentication required.", 401, "UNAUTHORIZED", requestId);
        return;
    }
    if (req.user.role !== database_1.UserRole.PLATFORM_ADMIN && !req.user.emailVerified) {
        (0, response_1.sendError)(res, "Email verification required. Please verify your email address to access learner features.", 403, "EMAIL_NOT_VERIFIED", requestId);
        return;
    }
    next();
}
