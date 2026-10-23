import { Request, Response, NextFunction } from "express";
import { User, UserRole } from "@insight-ignite/database";
import { validateSession } from "../modules/auth/session.service";
import { env } from "../config/env";
import { sendError } from "../utils/response";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
      sessionToken?: string;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: User;
  sessionToken: string;
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const sessionToken = req.cookies?.[env.sessionCookieName] as string | undefined;

  if (!sessionToken) {
    next();
    return;
  }

  try {
    const session = await validateSession(sessionToken);
    if (session) {
      req.user = session.user;
      req.sessionToken = sessionToken;
    }
  } catch {
    // Session validation error, proceed unauthenticated
  }

  next();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const sessionToken = req.cookies?.[env.sessionCookieName] as string | undefined;
  const requestId = req.headers["x-request-id"] as string;

  if (!sessionToken) {
    sendError(res, "Authentication required. Please sign in.", 401, "UNAUTHORIZED", requestId);
    return;
  }

  const session = await validateSession(sessionToken);
  if (!session) {
    sendError(res, "Session has expired or is invalid. Please sign in again.", 401, "SESSION_EXPIRED", requestId);
    return;
  }

  req.user = session.user;
  req.sessionToken = sessionToken;
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestId = req.headers["x-request-id"] as string;

    if (!req.user) {
      sendError(res, "Authentication required.", 401, "UNAUTHORIZED", requestId);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        `Access denied. Requires one of: [${allowedRoles.join(", ")}]. Current role: [${req.user.role}].`,
        403,
        "INSUFFICIENT_PERMISSIONS",
        requestId
      );
      return;
    }

    next();
  };
}

export function requireVerifiedEmail(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.headers["x-request-id"] as string;

  if (!req.user) {
    sendError(res, "Authentication required.", 401, "UNAUTHORIZED", requestId);
    return;
  }

  if (req.user.role !== UserRole.PLATFORM_ADMIN && !req.user.emailVerified) {
    sendError(
      res,
      "Email verification required. Please verify your email address to access learner features.",
      403,
      "EMAIL_NOT_VERIFIED",
      requestId
    );
    return;
  }

  next();
}
