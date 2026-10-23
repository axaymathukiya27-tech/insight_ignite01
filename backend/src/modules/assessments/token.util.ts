import crypto from "crypto";
import { CookieOptions } from "express";
import { env } from "../../config/env";

export const ASSESSMENT_COOKIE_NAME = "insight_assessment_key";

/**
 * Generates a cryptographically strong random token (hex-encoded).
 */
export function generateSecureToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString("hex");
}

/**
 * Computes SHA-256 digest of a raw token.
 * Only the digest is stored in the database.
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken.trim()).digest("hex");
}

/**
 * Cookie options for storing the anonymous assessment access credential.
 * Uses HTTP-only, SameSite=Lax, and Secure in production.
 */
export function getAssessmentCookieOptions(expiresAt?: Date): CookieOptions {
  const isProd = env.nodeEnv === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    expires: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default: 30 days retention
  };
}

/**
 * Cookie options to clear the anonymous assessment access key.
 */
export function getClearAssessmentCookieOptions(): CookieOptions {
  const isProd = env.nodeEnv === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
  };
}
