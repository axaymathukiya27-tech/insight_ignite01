"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthError = void 0;
exports.toSafeUser = toSafeUser;
exports.registerUser = registerUser;
exports.verifyEmail = verifyEmail;
exports.resendVerification = resendVerification;
exports.loginUser = loginUser;
exports.getMe = getMe;
exports.logoutUser = logoutUser;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
const database_1 = require("@insight-ignite/database");
const password_util_1 = require("./password.util");
const token_util_1 = require("./token.util");
const session_service_1 = require("./session.service");
const email_service_1 = require("../../services/email.service");
class AuthError extends Error {
    statusCode;
    code;
    constructor(message, statusCode = 400, code = "BAD_REQUEST") {
        super(message);
        this.name = "AuthError";
        this.statusCode = statusCode;
        this.code = code;
    }
}
exports.AuthError = AuthError;
function toSafeUser(user) {
    return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        emailVerified: user.emailVerified ? user.emailVerified.toISOString() : null,
        isActive: user.isActive,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt.toISOString(),
    };
}
async function registerUser(input) {
    const normalizedEmail = input.email.trim().toLowerCase();
    // Enforce permitted public roles (Default: LEARNER; Never allow PLATFORM_ADMIN)
    let assignedRole = database_1.UserRole.LEARNER;
    if (input.role === "PARENT")
        assignedRole = database_1.UserRole.PARENT;
    else if (input.role === "TEACHER")
        assignedRole = database_1.UserRole.TEACHER;
    // Check duplicate
    const existingUser = await database_1.prisma.user.findUnique({
        where: { email: normalizedEmail },
    });
    if (existingUser) {
        throw new AuthError("An account with this email already exists", 400, "ACCOUNT_EXISTS");
    }
    const hashedPassword = await (0, password_util_1.hashPassword)(input.password);
    const rawToken = (0, token_util_1.generateSecureToken)(32);
    const hashedToken = (0, token_util_1.hashToken)(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    // Atomic creation of user and email verification token
    const user = await database_1.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
            data: {
                email: normalizedEmail,
                fullName: input.name.trim(),
                passwordHash: hashedPassword,
                role: assignedRole,
                isActive: true,
            },
        });
        await tx.emailVerificationToken.create({
            data: {
                email: normalizedEmail,
                token: hashedToken,
                expiresAt,
            },
        });
        return newUser;
    });
    // Attempt transactional email delivery
    const delivery = await (0, email_service_1.sendVerificationEmail)(normalizedEmail, user.fullName, rawToken);
    return {
        user: toSafeUser(user),
        emailDelivered: delivery.delivered,
        emailSimulated: Boolean(delivery.simulated),
        verificationToken: delivery.simulated ? rawToken : undefined,
    };
}
async function verifyEmail(rawToken) {
    if (!rawToken || rawToken.trim() === "") {
        throw new AuthError("Verification token is required", 400, "INVALID_TOKEN");
    }
    const hashedToken = (0, token_util_1.hashToken)(rawToken.trim());
    // Strictly query by SHA-256 token hash (unique constraint)
    const tokenRecord = await database_1.prisma.emailVerificationToken.findUnique({
        where: { token: hashedToken },
    });
    if (!tokenRecord) {
        throw new AuthError("Verification token is invalid or has already been used", 400, "INVALID_TOKEN");
    }
    if (tokenRecord.expiresAt.getTime() <= Date.now()) {
        await database_1.prisma.emailVerificationToken.delete({ where: { id: tokenRecord.id } }).catch(() => { });
        throw new AuthError("Verification link has expired. Please request a new verification email.", 400, "TOKEN_EXPIRED");
    }
    // Update user and remove consumed token
    await database_1.prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: { email: tokenRecord.email },
            data: { emailVerified: new Date() },
        });
        await tx.emailVerificationToken.delete({
            where: { id: tokenRecord.id },
        });
    });
    return {
        success: true,
        message: "Email address verified successfully. You may now sign in.",
    };
}
async function resendVerification(email) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await database_1.prisma.user.findUnique({
        where: { email: normalizedEmail },
    });
    // Generic response to avoid user enumeration
    const genericMessage = "If this account is registered and unverified, a verification link has been sent.";
    if (!user || user.emailVerified) {
        return { success: true, message: genericMessage };
    }
    // Rate-limiting check: Prevent spamming if token was generated in the last 60 seconds
    const recentToken = await database_1.prisma.emailVerificationToken.findFirst({
        where: {
            email: normalizedEmail,
            createdAt: { gte: new Date(Date.now() - 60 * 1000) },
        },
    });
    if (recentToken) {
        return {
            success: true,
            message: "A verification email was recently sent. Please check your inbox or wait 60 seconds before requesting again.",
        };
    }
    const rawToken = (0, token_util_1.generateSecureToken)(32);
    const hashedToken = (0, token_util_1.hashToken)(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    // Clean up old tokens and store new one
    await database_1.prisma.$transaction(async (tx) => {
        await tx.emailVerificationToken.deleteMany({
            where: { email: normalizedEmail },
        });
        await tx.emailVerificationToken.create({
            data: {
                email: normalizedEmail,
                token: hashedToken,
                expiresAt,
            },
        });
    });
    const delivery = await (0, email_service_1.sendVerificationEmail)(normalizedEmail, user.fullName, rawToken);
    return {
        success: true,
        message: delivery.simulated
            ? "Simulation Mode: Live SMTP is not configured. An activation link was generated and recorded in the server logs."
            : genericMessage,
        simulated: Boolean(delivery.simulated),
        verificationToken: delivery.simulated ? rawToken : undefined,
    };
}
async function loginUser(input) {
    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await database_1.prisma.user.findUnique({
        where: { email: normalizedEmail },
    });
    if (!user || !user.passwordHash) {
        throw new AuthError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }
    const isPasswordValid = await (0, password_util_1.comparePassword)(input.password, user.passwordHash);
    if (!isPasswordValid) {
        throw new AuthError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }
    if (!user.isActive) {
        throw new AuthError("Your account has been deactivated. Please contact support.", 403, "ACCOUNT_DEACTIVATED");
    }
    if (user.role !== database_1.UserRole.PLATFORM_ADMIN && !user.emailVerified) {
        throw new AuthError("Your email address has not been verified. Please check your inbox or request a new verification link.", 403, "EMAIL_NOT_VERIFIED");
    }
    const session = await (0, session_service_1.createSession)(user.id);
    return {
        sessionToken: session.sessionToken,
        expiresAt: session.expiresAt,
        user: toSafeUser(user),
    };
}
async function getMe(userId) {
    const user = await database_1.prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user || !user.isActive) {
        throw new AuthError("User account not found or deactivated", 401, "UNAUTHORIZED");
    }
    return toSafeUser(user);
}
async function logoutUser(sessionToken) {
    await (0, session_service_1.revokeSession)(sessionToken);
}
async function forgotPassword(email) {
    const normalizedEmail = email.trim().toLowerCase();
    const genericMessage = "If that email exists in our records, password reset instructions have been sent.";
    const user = await database_1.prisma.user.findUnique({
        where: { email: normalizedEmail },
    });
    if (!user || !user.isActive) {
        return { success: true, message: genericMessage };
    }
    const rawToken = (0, token_util_1.generateSecureToken)(32);
    const hashedToken = (0, token_util_1.hashToken)(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await database_1.prisma.$transaction(async (tx) => {
        await tx.passwordResetToken.deleteMany({
            where: { email: normalizedEmail },
        });
        await tx.passwordResetToken.create({
            data: {
                email: normalizedEmail,
                token: hashedToken,
                expiresAt,
            },
        });
    });
    const delivery = await (0, email_service_1.sendPasswordResetEmail)(normalizedEmail, user.fullName, rawToken);
    return {
        success: true,
        message: delivery.simulated
            ? "Simulation Mode: Live SMTP is not configured. Password reset instructions were generated and recorded in the server logs."
            : genericMessage,
        simulated: Boolean(delivery.simulated),
    };
}
async function resetPassword(input) {
    if (!input.token || input.token.trim() === "") {
        throw new AuthError("Reset token is required", 400, "INVALID_TOKEN");
    }
    const rawToken = input.token.trim();
    const hashedToken = (0, token_util_1.hashToken)(rawToken);
    // Strictly query by SHA-256 token hash (unique constraint)
    const tokenRecord = await database_1.prisma.passwordResetToken.findUnique({
        where: { token: hashedToken },
    });
    if (!tokenRecord) {
        throw new AuthError("Password reset link is invalid or has already been used", 400, "INVALID_TOKEN");
    }
    if (tokenRecord.expiresAt.getTime() <= Date.now()) {
        await database_1.prisma.passwordResetToken.delete({ where: { id: tokenRecord.id } }).catch(() => { });
        throw new AuthError("Password reset link has expired. Please request a new link.", 400, "TOKEN_EXPIRED");
    }
    const user = await database_1.prisma.user.findUnique({
        where: { email: tokenRecord.email },
    });
    if (!user) {
        throw new AuthError("Associated account not found", 400, "ACCOUNT_NOT_FOUND");
    }
    const newHashedPassword = await (0, password_util_1.hashPassword)(input.password);
    // Atomically update password, delete token, and invalidate all existing sessions
    await database_1.prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: user.id },
            data: { passwordHash: newHashedPassword },
        });
        await tx.passwordResetToken.delete({
            where: { id: tokenRecord.id },
        });
        await tx.session.deleteMany({
            where: { userId: user.id },
        });
    });
    return {
        success: true,
        message: "Password has been successfully updated. All active sessions have been invalidated. Please sign in.",
    };
}
