import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { sendError } from "../utils/response";

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 login requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const requestId = req.headers["x-request-id"] as string;
    sendError(
      res,
      "Too many login attempts from this network. Please wait 15 minutes before retrying.",
      429,
      "RATE_LIMIT_EXCEEDED",
      requestId
    );
  },
});

export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 registration attempts per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const requestId = req.headers["x-request-id"] as string;
    sendError(
      res,
      "Too many account creation attempts. Please try again later.",
      429,
      "RATE_LIMIT_EXCEEDED",
      requestId
    );
  },
});

export const forgotPasswordRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 password recovery attempts per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const requestId = req.headers["x-request-id"] as string;
    sendError(
      res,
      "Too many password recovery requests. Please try again later.",
      429,
      "RATE_LIMIT_EXCEEDED",
      requestId
    );
  },
});
