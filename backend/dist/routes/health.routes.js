"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("@insight-ignite/database");
const response_1 = require("../utils/response");
const env_1 = require("../config/env");
const router = (0, express_1.Router)();
/**
 * Health / Liveness Check
 * Reports application process status independently from database connectivity.
 */
router.get("/health", (req, res) => {
    const requestId = req.headers["x-request-id"];
    return (0, response_1.sendSuccess)(res, {
        status: "ok",
        service: "insight-ignite-api",
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        environment: env_1.env.nodeEnv,
        version: "0.1.0",
        memoryUsage: {
            heapUsedMb: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
            rssMb: Math.round((process.memoryUsage().rss / 1024 / 1024) * 100) / 100,
        },
    }, "Application is healthy", 200, requestId);
});
/**
 * Database Readiness Check
 * Executes a real database query (SELECT 1) and returns 200 or 503.
 */
async function handleReadiness(req, res) {
    const requestId = req.headers["x-request-id"];
    if (!env_1.env.isDatabaseConfigured) {
        return (0, response_1.sendError)(res, "Database configuration is missing or empty (DATABASE_URL not set)", 503, "DATABASE_UNCONFIGURED", requestId, {
            status: "unready",
            database: "disconnected",
        });
    }
    const result = await (0, database_1.checkDatabaseConnection)();
    if (!result.connected) {
        return (0, response_1.sendError)(res, "Database connection failed or unreachable", 503, "DATABASE_UNAVAILABLE", requestId, {
            status: "unready",
            database: "disconnected",
            timestamp: new Date().toISOString(),
            error: env_1.env.nodeEnv === "development" ? result.error : "Database unavailable",
        });
    }
    return (0, response_1.sendSuccess)(res, {
        status: "ready",
        database: "connected",
        latencyMs: result.latencyMs,
        timestamp: new Date().toISOString(),
    }, "Database is ready and responsive", 200, requestId);
}
router.get("/ready", handleReadiness);
router.get("/health/ready", handleReadiness);
exports.default = router;
