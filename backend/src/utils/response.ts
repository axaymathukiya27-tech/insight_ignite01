import { Response } from "express";
import { ApiSuccessResponse, ApiErrorResponse } from "@insight-ignite/shared";

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
  requestId?: string
) {
  const payload: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(message ? { message } : {}),
    ...(requestId ? { requestId } : {}),
  };
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  code = "BAD_REQUEST",
  requestId?: string,
  details?: unknown
) {
  const payload: ApiErrorResponse = {
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
