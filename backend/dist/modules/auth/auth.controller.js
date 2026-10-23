"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRegister = handleRegister;
exports.handleVerifyEmail = handleVerifyEmail;
exports.handleResendVerification = handleResendVerification;
exports.handleLogin = handleLogin;
exports.handleGetMe = handleGetMe;
exports.handleLogout = handleLogout;
exports.handleForgotPassword = handleForgotPassword;
exports.handleResetPassword = handleResetPassword;
const auth_service_1 = require("./auth.service");
const session_service_1 = require("./session.service");
const response_1 = require("../../utils/response");
const env_1 = require("../../config/env");
async function handleRegister(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const result = await (0, auth_service_1.registerUser)(req.body);
        (0, response_1.sendSuccess)(res, result, "Account created successfully. Please verify your email.", 201, requestId);
    }
    catch (error) {
        next(error);
    }
}
async function handleVerifyEmail(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const result = await (0, auth_service_1.verifyEmail)(req.body.token);
        (0, response_1.sendSuccess)(res, result, result.message, 200, requestId);
    }
    catch (error) {
        next(error);
    }
}
async function handleResendVerification(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const result = await (0, auth_service_1.resendVerification)(req.body.email);
        (0, response_1.sendSuccess)(res, result, result.message, 200, requestId);
    }
    catch (error) {
        next(error);
    }
}
async function handleLogin(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const { sessionToken, expiresAt, user } = await (0, auth_service_1.loginUser)(req.body);
        res.cookie(env_1.env.sessionCookieName, sessionToken, (0, session_service_1.getSessionCookieOptions)(expiresAt));
        (0, response_1.sendSuccess)(res, { user }, "Signed in successfully.", 200, requestId);
    }
    catch (error) {
        next(error);
    }
}
async function handleGetMe(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const user = await (0, auth_service_1.getMe)(req.user.id);
        (0, response_1.sendSuccess)(res, { user }, undefined, 200, requestId);
    }
    catch (error) {
        next(error);
    }
}
async function handleLogout(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const sessionToken = req.sessionToken || req.cookies?.[env_1.env.sessionCookieName];
        if (sessionToken) {
            await (0, auth_service_1.logoutUser)(sessionToken);
        }
        res.clearCookie(env_1.env.sessionCookieName, (0, session_service_1.getClearCookieOptions)());
        (0, response_1.sendSuccess)(res, { loggedOut: true }, "Logged out successfully.", 200, requestId);
    }
    catch (error) {
        next(error);
    }
}
async function handleForgotPassword(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const result = await (0, auth_service_1.forgotPassword)(req.body.email);
        (0, response_1.sendSuccess)(res, result, result.message, 200, requestId);
    }
    catch (error) {
        next(error);
    }
}
async function handleResetPassword(req, res, next) {
    try {
        const requestId = req.headers["x-request-id"];
        const result = await (0, auth_service_1.resetPassword)(req.body);
        res.clearCookie(env_1.env.sessionCookieName, (0, session_service_1.getClearCookieOptions)());
        (0, response_1.sendSuccess)(res, result, result.message, 200, requestId);
    }
    catch (error) {
        next(error);
    }
}
