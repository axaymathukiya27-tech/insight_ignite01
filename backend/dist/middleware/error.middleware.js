"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
const zod_1 = require("zod");
const logger_1 = require("../config/logger");
const response_1 = require("../utils/response");
function errorMiddleware(err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) {
    const requestId = req.headers["x-request-id"] || "unknown";
    // Check for Zod validation error (both instanceof and name/issues check for cross-monorepo boundary)
    const isZod = err instanceof zod_1.ZodError ||
        err.name === "ZodError" ||
        Array.isArray(err.issues);
    if (isZod) {
        const zodErr = err;
        const issueList = zodErr.issues || zodErr.errors || [];
        const details = issueList.map((e) => ({
            field: e.path.join("."),
            message: e.message,
        }));
        logger_1.logger.warn(`Validation failure on ${req.method} ${req.path} [${requestId}]: ${JSON.stringify(details)}`);
        (0, response_1.sendError)(res, "Request validation failed", 400, "VALIDATION_ERROR", requestId, details);
        return;
    }
    const statusCode = err.statusCode || 500;
    const errorCode = err.code || (statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : "BAD_REQUEST");
    const message = statusCode >= 500 && process.env.NODE_ENV === "production"
        ? "An unexpected internal error occurred"
        : err.message || "An unexpected internal error occurred";
    logger_1.logger.error(`Error on ${req.method} ${req.path} [${requestId}]: ${err.message}`, err);
    (0, response_1.sendError)(res, message, statusCode, errorCode, requestId, err.details);
}
