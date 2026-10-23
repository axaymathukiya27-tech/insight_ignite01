import { Request, Response, NextFunction } from "express";
import {
  registerUser,
  verifyEmail,
  resendVerification,
  loginUser,
  getMe,
  logoutUser,
  forgotPassword,
  resetPassword,
} from "./auth.service";
import { getSessionCookieOptions, getClearCookieOptions } from "./session.service";
import { sendSuccess } from "../../utils/response";
import { env } from "../../config/env";

export async function handleRegister(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const result = await registerUser(req.body);
    sendSuccess(res, result, "Account created successfully. Please verify your email.", 201, requestId);
  } catch (error) {
    next(error);
  }
}

export async function handleVerifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const result = await verifyEmail(req.body.token);
    sendSuccess(res, result, result.message, 200, requestId);
  } catch (error) {
    next(error);
  }
}

export async function handleResendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const result = await resendVerification(req.body.email);
    sendSuccess(res, result, result.message, 200, requestId);
  } catch (error) {
    next(error);
  }
}

export async function handleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const { sessionToken, expiresAt, user } = await loginUser(req.body);

    res.cookie(env.sessionCookieName, sessionToken, getSessionCookieOptions(expiresAt));

    sendSuccess(res, { user }, "Signed in successfully.", 200, requestId);
  } catch (error) {
    next(error);
  }
}

export async function handleGetMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const user = await getMe(req.user!.id);
    sendSuccess(res, { user }, undefined, 200, requestId);
  } catch (error) {
    next(error);
  }
}

export async function handleLogout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const sessionToken = req.sessionToken || (req.cookies?.[env.sessionCookieName] as string);

    if (sessionToken) {
      await logoutUser(sessionToken);
    }

    res.clearCookie(env.sessionCookieName, getClearCookieOptions());
    sendSuccess(res, { loggedOut: true }, "Logged out successfully.", 200, requestId);
  } catch (error) {
    next(error);
  }
}

export async function handleForgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const result = await forgotPassword(req.body.email);
    sendSuccess(res, result, result.message, 200, requestId);
  } catch (error) {
    next(error);
  }
}

export async function handleResetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const result = await resetPassword(req.body);

    res.clearCookie(env.sessionCookieName, getClearCookieOptions());
    sendSuccess(res, result, result.message, 200, requestId);
  } catch (error) {
    next(error);
  }
}
