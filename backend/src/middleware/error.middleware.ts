import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger";
import { sendError } from "../utils/response";

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export function errorMiddleware(
  err: ApiError | ZodError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const requestId = (req.headers["x-request-id"] as string) || "unknown";

  // Check for Zod validation error (both instanceof and name/issues check for cross-monorepo boundary)
  const isZod =
    err instanceof ZodError ||
    err.name === "ZodError" ||
    Array.isArray((err as unknown as { issues?: unknown[] }).issues);

  if (isZod) {
    const zodErr = err as unknown as {
      issues?: Array<{ path: Array<string | number>; message: string }>;
      errors?: Array<{ path: Array<string | number>; message: string }>;
    };
    const issueList = zodErr.issues || zodErr.errors || [];
    const details = issueList.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    logger.warn(`Validation failure on ${req.method} ${req.path} [${requestId}]: ${JSON.stringify(details)}`);
    sendError(res, "Request validation failed", 400, "VALIDATION_ERROR", requestId, details);
    return;
  }

  const statusCode = (err as ApiError).statusCode || 500;
  const errorCode = (err as ApiError).code || (statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : "BAD_REQUEST");
  const message =
    statusCode >= 500 && process.env.NODE_ENV === "production"
      ? "An unexpected internal error occurred"
      : err.message || "An unexpected internal error occurred";

  logger.error(`Error on ${req.method} ${req.path} [${requestId}]: ${err.message}`, err);

  sendError(res, message, statusCode, errorCode, requestId, (err as ApiError).details);
}
