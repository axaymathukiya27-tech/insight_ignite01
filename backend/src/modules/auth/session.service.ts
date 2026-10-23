import { prisma } from "@insight-ignite/database";
import { CookieOptions } from "express";
import { env } from "../../config/env";
import { generateSecureToken } from "./token.util";

export function getSessionCookieOptions(expiresAt?: Date): CookieOptions {
  const isProd = env.nodeEnv === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    expires: expiresAt || new Date(Date.now() + env.sessionMaxAgeDays * 24 * 60 * 60 * 1000),
  };
}

export function getClearCookieOptions(): CookieOptions {
  const isProd = env.nodeEnv === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
  };
}

export async function createSession(userId: string): Promise<{ sessionToken: string; expiresAt: Date }> {
  const sessionToken = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + env.sessionMaxAgeDays * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      sessionToken,
      expiresAt,
    },
  });

  return { sessionToken, expiresAt };
}

export async function validateSession(sessionToken: string) {
  if (!sessionToken || sessionToken.trim() === "") {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  // Check expiration
  if (session.expiresAt.getTime() <= Date.now()) {
    // Delete expired session asynchronously
    prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // Check account active status
  if (!session.user.isActive) {
    return null;
  }

  return session;
}

export async function revokeSession(sessionToken: string): Promise<void> {
  if (!sessionToken) return;
  try {
    await prisma.session.deleteMany({
      where: { sessionToken },
    });
  } catch {
    // Session already removed or invalid
  }
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  if (!userId) return;
  try {
    await prisma.session.deleteMany({
      where: { userId },
    });
  } catch {
    // Sessions already cleaned up
  }
}
