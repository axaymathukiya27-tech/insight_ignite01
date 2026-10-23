import { Router, Request, Response } from "express";
import { checkDatabaseConnection } from "@insight-ignite/database";
import { sendSuccess, sendError } from "../utils/response";
import { env } from "../config/env";

const router = Router();

/**
 * Health / Liveness Check
 * Reports application process status independently from database connectivity.
 */
router.get("/health", (req: Request, res: Response) => {
  const requestId = req.headers["x-request-id"] as string;
  return sendSuccess(
    res,
    {
      status: "ok",
      service: "insight-ignite-api",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: env.nodeEnv,
      version: "0.1.0",
      memoryUsage: {
        heapUsedMb: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        rssMb: Math.round((process.memoryUsage().rss / 1024 / 1024) * 100) / 100,
      },
    },
    "Application is healthy",
    200,
    requestId
  );
});

/**
 * Database Readiness Check
 * Executes a real database query (SELECT 1) and returns 200 or 503.
 */
async function handleReadiness(req: Request, res: Response): Promise<Response> {
  const requestId = req.headers["x-request-id"] as string;

  if (!env.isDatabaseConfigured) {
    return sendError(
      res,
      "Database configuration is missing or empty (DATABASE_URL not set)",
      503,
      "DATABASE_UNCONFIGURED",
      requestId,
      {
        status: "unready",
        database: "disconnected",
      }
    );
  }

  const result = await checkDatabaseConnection();

  if (!result.connected) {
    return sendError(
      res,
      "Database connection failed or unreachable",
      503,
      "DATABASE_UNAVAILABLE",
      requestId,
      {
        status: "unready",
        database: "disconnected",
        timestamp: new Date().toISOString(),
        error: env.nodeEnv === "development" ? result.error : "Database unavailable",
      }
    );
  }

  return sendSuccess(
    res,
    {
      status: "ready",
      database: "connected",
      latencyMs: result.latencyMs,
      timestamp: new Date().toISOString(),
    },
    "Database is ready and responsive",
    200,
    requestId
  );
}

router.get("/ready", handleReadiness);
router.get("/health/ready", handleReadiness);

export default router;
