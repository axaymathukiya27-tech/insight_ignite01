"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
function sendSuccess(res, data, message, statusCode = 200, requestId) {
    const payload = {
        success: true,
        data,
        ...(message ? { message } : {}),
        ...(requestId ? { requestId } : {}),
    };
    return res.status(statusCode).json(payload);
}
function sendError(res, message, statusCode = 400, code = "BAD_REQUEST", requestId, details) {
    const payload = {
        success: false,
        error: {
            code,
            message,
            ...(requestId ? { requestId } : {}),
            ...(details !== undefined ? { details } : {}),
        },
    };
    return res.status(statusCode).json(payload);
}
