"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionCookieOptions = getSessionCookieOptions;
exports.getClearCookieOptions = getClearCookieOptions;
exports.createSession = createSession;
exports.validateSession = validateSession;
exports.revokeSession = revokeSession;
exports.revokeAllUserSessions = revokeAllUserSessions;
const database_1 = require("@insight-ignite/database");
const env_1 = require("../../config/env");
const token_util_1 = require("./token.util");
function getSessionCookieOptions(expiresAt) {
    const isProd = env_1.env.nodeEnv === "production";
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
        expires: expiresAt || new Date(Date.now() + env_1.env.sessionMaxAgeDays * 24 * 60 * 60 * 1000),
    };
}
function getClearCookieOptions() {
    const isProd = env_1.env.nodeEnv === "production";
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        path: "/",
    };
}
async function createSession(userId) {
    const sessionToken = (0, token_util_1.generateSecureToken)(32);
    const expiresAt = new Date(Date.now() + env_1.env.sessionMaxAgeDays * 24 * 60 * 60 * 1000);
    await database_1.prisma.session.create({
        data: {
            userId,
            sessionToken,
            expiresAt,
        },
    });
    return { sessionToken, expiresAt };
}
async function validateSession(sessionToken) {
    if (!sessionToken || sessionToken.trim() === "") {
        return null;
    }
    const session = await database_1.prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
    });
    if (!session) {
        return null;
    }
    // Check expiration
    if (session.expiresAt.getTime() <= Date.now()) {
        // Delete expired session asynchronously
        database_1.prisma.session.delete({ where: { id: session.id } }).catch(() => { });
        return null;
    }
    // Check account active status
    if (!session.user.isActive) {
        return null;
    }
    return session;
}
async function revokeSession(sessionToken) {
    if (!sessionToken)
        return;
    try {
        await database_1.prisma.session.deleteMany({
            where: { sessionToken },
        });
    }
    catch {
        // Session already removed or invalid
    }
}
async function revokeAllUserSessions(userId) {
    if (!userId)
        return;
    try {
        await database_1.prisma.session.deleteMany({
            where: { userId },
        });
    }
    catch {
        // Sessions already cleaned up
    }
}
