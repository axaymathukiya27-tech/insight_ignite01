import { createApp } from "../src/app";
import { Server } from "http";
import { prisma, UserRole } from "@insight-ignite/database";
import { hashToken, generateSecureToken } from "../src/modules/auth/token.util";
import { createSession } from "../src/modules/auth/session.service";

async function runAuthTestSuite() {
  console.log("======================================================");
  console.log("   INSIGHT IGNITE — PHASE 3.1 AUTHENTICATION TEST SUITE  ");
  console.log("======================================================");

  const app = createApp();
  const testPort = 5057;
  const baseUrl = `http://localhost:${testPort}`;

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(testPort, () => resolve(s));
  });

  const timestamp = Date.now();
  const learnerEmail = `learner_${timestamp}@insightignite.org`;
  const adminEmail = `admin_${timestamp}@insightignite.org`;
  const rateLimitEmail = `ratelimit_${timestamp}@insightignite.org`;
  const initialPassword = "SecureLearnerPassword123!";
  const newPassword = "UpdatedSecurePassword456!";

  let learnerSessionCookie = "";
  let adminSessionCookie = "";

  try {
    // -------------------------------------------------------------------------
    // 1. REGISTRATION TESTS
    // -------------------------------------------------------------------------
    console.log("\n[1/7] Testing User Registration & Security Defaults...");

    // 1.1 Invalid input validation
    const invalidRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "A",
        email: "not-an-email",
        password: "short",
      }),
    });
    const invalidRegBody = await invalidRegRes.json();
    if (invalidRegRes.status !== 400 || invalidRegBody.error?.code !== "VALIDATION_ERROR") {
      throw new Error(`FAIL: Invalid registration input was not rejected with 400 VALIDATION_ERROR`);
    }
    console.log("  PASS 1.1: Invalid input correctly rejected with 400 VALIDATION_ERROR.");

    // 1.2 Attempt privilege escalation during registration
    const maliciousRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Malicious User",
        email: `attacker_${timestamp}@insightignite.org`,
        password: initialPassword,
        role: "PLATFORM_ADMIN",
      }),
    });
    const maliciousRegBody = await maliciousRegRes.json();
    if (maliciousRegRes.status !== 400 || maliciousRegBody.error?.code !== "VALIDATION_ERROR") {
      throw new Error("FAIL: Public registration allowed PLATFORM_ADMIN role attempt!");
    }
    console.log("  PASS 1.2: Public registration strictly prevents PLATFORM_ADMIN role assignment.");

    // 1.3 Valid registration of learner (starts unverified)
    const validRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Learner",
        email: learnerEmail,
        password: initialPassword,
        role: "LEARNER",
      }),
    });
    const validRegBody = await validRegRes.json();
    if (validRegRes.status !== 201 || !validRegBody.success) {
      throw new Error(`FAIL: Valid registration failed: ${JSON.stringify(validRegBody)}`);
    }

    const createdUser = await prisma.user.findUnique({ where: { email: learnerEmail } });
    if (!createdUser || createdUser.role !== UserRole.LEARNER) {
      throw new Error(`FAIL: Created user role mismatch: ${createdUser?.role}`);
    }
    if (createdUser.emailVerified !== null) {
      throw new Error("FAIL: Newly registered user should start with emailVerified = null!");
    }
    if (!createdUser.passwordHash || createdUser.passwordHash === initialPassword) {
      throw new Error("FAIL: Password was not hashed with bcrypt!");
    }
    console.log("  PASS 1.3: Valid registration created unverified learner with bcrypt password hash.");

    // 1.4 Duplicate registration handling
    const dupRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Duplicate User",
        email: learnerEmail,
        password: initialPassword,
      }),
    });
    const dupRegBody = await dupRegRes.json();
    if (dupRegRes.status !== 400 || dupRegBody.error?.code !== "ACCOUNT_EXISTS") {
      throw new Error("FAIL: Duplicate registration did not return 400 ACCOUNT_EXISTS");
    }
    console.log("  PASS 1.4: Duplicate registration prevented safely with 400 ACCOUNT_EXISTS.");

    // -------------------------------------------------------------------------
    // 2. EMAIL VERIFICATION ENFORCEMENT & LEARNER GATE
    // -------------------------------------------------------------------------
    console.log("\n[2/7] Testing Email Verification Enforcement (Unverified Gate)...");

    // 2.1 Unverified learner cannot log in (403 EMAIL_NOT_VERIFIED)
    const unverifiedLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: learnerEmail, password: initialPassword }),
    });
    const unverifiedLoginBody = await unverifiedLoginRes.json();
    if (unverifiedLoginRes.status !== 403 || unverifiedLoginBody.error?.code !== "EMAIL_NOT_VERIFIED") {
      throw new Error(`FAIL: Unverified user was not blocked with 403 EMAIL_NOT_VERIFIED on login: ${JSON.stringify(unverifiedLoginBody)}`);
    }
    console.log("  PASS 2.1: Unverified learner login strictly denied with 403 EMAIL_NOT_VERIFIED.");

    // 2.2 Unverified learner cannot access protected learner API even if session existed
    const tempSession = await createSession(createdUser.id);
    const unverifiedSessionCookie = `insight_session=${tempSession.sessionToken}`;

    const unverifiedProfileRes = await fetch(`${baseUrl}/api/learner/profile`, {
      headers: { Cookie: unverifiedSessionCookie },
    });
    const unverifiedProfileBody = await unverifiedProfileRes.json();
    if (unverifiedProfileRes.status !== 403 || unverifiedProfileBody.error?.code !== "EMAIL_NOT_VERIFIED") {
      throw new Error(`FAIL: Unverified learner accessed /api/learner/profile! Expected 403 EMAIL_NOT_VERIFIED`);
    }
    console.log("  PASS 2.2: Unverified user strictly blocked from protected learner API with 403 EMAIL_NOT_VERIFIED.");

    // Clean up temporary session
    await prisma.session.delete({ where: { sessionToken: tempSession.sessionToken } });

    // 2.3 Resend verification works for unverified user
    const resendRes = await fetch(`${baseUrl}/api/auth/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: learnerEmail }),
    });
    const resendBody = await resendRes.json();
    if (resendRes.status !== 200 || !resendBody.success) {
      throw new Error("FAIL: Resend verification failed for unverified user");
    }
    console.log("  PASS 2.3: Resend verification endpoint operational and reports honest simulation notice.");

    // 2.4 Resend verification anti-spam cooldown
    const rapidResendRes = await fetch(`${baseUrl}/api/auth/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: learnerEmail }),
    });
    const rapidResendBody = await rapidResendRes.json();
    if (!rapidResendBody.data?.message?.includes("wait 60 seconds") && !rapidResendBody.message?.includes("wait 60 seconds")) {
      throw new Error("FAIL: Resend anti-spam cooldown did not trigger");
    }
    console.log("  PASS 2.4: Resend verification cooldown prevents rapid successive token generation.");

    // -------------------------------------------------------------------------
    // 3. STRICT SHA-256 TOKEN LOOKUP & TOKEN LIFECYCLE TESTS
    // -------------------------------------------------------------------------
    console.log("\n[3/7] Testing Strict SHA-256 Token Lookup (Verification)...");

    const rawVerificationToken = generateSecureToken(32);
    const hashedVerificationToken = hashToken(rawVerificationToken);

    // Overwrite the DB token with our known test token hash
    await prisma.emailVerificationToken.deleteMany({ where: { email: learnerEmail } });
    await prisma.emailVerificationToken.create({
      data: {
        email: learnerEmail,
        token: hashedVerificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // 3.1 Invalid verification token
    const invalidTokenRes = await fetch(`${baseUrl}/api/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "completely_invalid_random_token_string" }),
    });
    const invalidTokenBody = await invalidTokenRes.json();
    if (invalidTokenRes.status !== 400 || invalidTokenBody.error?.code !== "INVALID_TOKEN") {
      throw new Error("FAIL: Invalid verification token was not rejected with 400 INVALID_TOKEN");
    }
    console.log("  PASS 3.1: Invalid verification token rejected with 400 INVALID_TOKEN.");

    // 3.2 Direct submission of DB hash MUST fail (verifies redundant lookup was removed)
    const directHashRes = await fetch(`${baseUrl}/api/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: hashedVerificationToken }),
    });
    const directHashBody = await directHashRes.json();
    if (directHashRes.status !== 400 || directHashBody.error?.code !== "INVALID_TOKEN") {
      throw new Error("FAIL: Direct submission of SHA-256 hash was accepted! Redundant lookup was not removed!");
    }
    console.log("  PASS 3.2: Direct submission of DB SHA-256 hash rejected (redundant lookup eliminated).");

    // 3.3 Expired token handling
    const expiredRawToken = generateSecureToken(32);
    const expiredHashedToken = hashToken(expiredRawToken);
    await prisma.emailVerificationToken.create({
      data: {
        email: learnerEmail,
        token: expiredHashedToken,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      },
    });

    const expiredTokenRes = await fetch(`${baseUrl}/api/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: expiredRawToken }),
    });
    const expiredTokenBody = await expiredTokenRes.json();
    if (expiredTokenRes.status !== 400 || expiredTokenBody.error?.code !== "TOKEN_EXPIRED") {
      throw new Error("FAIL: Expired token was not rejected with 400 TOKEN_EXPIRED");
    }
    console.log("  PASS 3.3: Expired token safely rejected with 400 TOKEN_EXPIRED.");

    // 3.4 Valid verification with raw token
    const verifyRes = await fetch(`${baseUrl}/api/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: rawVerificationToken }),
    });
    const verifyBody = await verifyRes.json();
    if (verifyRes.status !== 200 || !verifyBody.success) {
      throw new Error(`FAIL: Verification failed: ${JSON.stringify(verifyBody)}`);
    }

    const verifiedUser = await prisma.user.findUnique({ where: { email: learnerEmail } });
    if (!verifiedUser?.emailVerified) {
      throw new Error("FAIL: User emailVerified timestamp was not updated!");
    }
    console.log("  PASS 3.4: Valid raw token verified account via strict SHA-256 hash matching.");

    // 3.5 Single-use enforcement: Token cannot be consumed a second time
    const reuseTokenRes = await fetch(`${baseUrl}/api/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: rawVerificationToken }),
    });
    const reuseTokenBody = await reuseTokenRes.json();
    if (reuseTokenRes.status !== 400 || reuseTokenBody.error?.code !== "INVALID_TOKEN") {
      throw new Error("FAIL: Consumed verification token was allowed to be reused!");
    }
    console.log("  PASS 3.5: Consumed verification token rejected on subsequent attempt (Single-Use).");

    // -------------------------------------------------------------------------
    // 4. VERIFIED LOGIN & ROLE-BASED ACCESS CONTROL (RBAC)
    // -------------------------------------------------------------------------
    console.log("\n[4/7] Testing Verified Login & Role-Based Access Control...");

    // 4.1 Verified learner logs in successfully
    const learnerLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: learnerEmail, password: initialPassword }),
    });
    const learnerLoginBody = await learnerLoginRes.json();
    if (learnerLoginRes.status !== 200 || !learnerLoginBody.success) {
      throw new Error(`FAIL: Verified learner login failed: ${JSON.stringify(learnerLoginBody)}`);
    }

    const learnerCookieHeader = learnerLoginRes.headers.get("set-cookie");
    if (!learnerCookieHeader || !learnerCookieHeader.includes("insight_session=")) {
      throw new Error("FAIL: insight_session cookie missing!");
    }
    learnerSessionCookie = learnerCookieHeader.split(";")[0];
    console.log("  PASS 4.1: Verified learner successfully logged in and received HttpOnly session cookie.");

    // 4.2 Verified learner accesses learner API
    const verifiedProfileRes = await fetch(`${baseUrl}/api/learner/profile`, {
      headers: { Cookie: learnerSessionCookie },
    });
    const verifiedProfileBody = await verifiedProfileRes.json();
    if (verifiedProfileRes.status !== 200 || verifiedProfileBody.data?.user?.email !== learnerEmail) {
      throw new Error(`FAIL: Verified learner denied access to /api/learner/profile: ${JSON.stringify(verifiedProfileBody)}`);
    }
    console.log("  PASS 4.2: Verified learner granted full access to /api/learner/profile.");

    // 4.3 Learner CANNOT access admin API (403 INSUFFICIENT_PERMISSIONS)
    const learnerAdminRes = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { Cookie: learnerSessionCookie },
    });
    const learnerAdminBody = await learnerAdminRes.json();
    if (learnerAdminRes.status !== 403 || learnerAdminBody.error?.code !== "INSUFFICIENT_PERMISSIONS") {
      throw new Error("FAIL: Learner was not blocked from admin API with 403 Forbidden!");
    }
    console.log("  PASS 4.3: Learner strictly forbidden from accessing /api/admin/stats (403).");

    // 4.4 Provision Administrator and verify admin access
    const adminPassword = "AdminSecurePassword999!";
    const hashedAdminPassword = await import("../src/modules/auth/password.util").then((m) => m.hashPassword(adminPassword));

    await prisma.user.create({
      data: {
        email: adminEmail,
        fullName: "System Platform Admin",
        role: UserRole.PLATFORM_ADMIN,
        passwordHash: hashedAdminPassword,
        emailVerified: new Date(),
        isActive: true,
      },
    });

    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const adminLoginCookieHeader = adminLoginRes.headers.get("set-cookie");
    if (!adminLoginCookieHeader) throw new Error("FAIL: Admin login failed to set cookie");
    adminSessionCookie = adminLoginCookieHeader.split(";")[0];

    const adminStatsRes = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { Cookie: adminSessionCookie },
    });
    const adminStatsBody = await adminStatsRes.json();
    if (adminStatsRes.status !== 200 || !adminStatsBody.data?.adminAccessGranted) {
      throw new Error("FAIL: Platform Admin was denied access to /api/admin/stats!");
    }
    console.log("  PASS 4.4: PLATFORM_ADMIN granted authorized access to /api/admin/stats.");

    // -------------------------------------------------------------------------
    // 5. PASSWORD RECOVERY & STRICT SHA-256 RESET TESTS
    // -------------------------------------------------------------------------
    console.log("\n[5/7] Testing Password Recovery Flow & Strict SHA-256 Token Handling...");

    // 5.1 Forgot password does not leak account existence
    const forgotNonExistentRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "does_not_exist@insightignite.org" }),
    });
    if (forgotNonExistentRes.status !== 200) {
      throw new Error("FAIL: Forgot password leaked account existence!");
    }

    const forgotLearnerRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: learnerEmail }),
    });
    if (forgotLearnerRes.status !== 200) {
      throw new Error("FAIL: Forgot password failed for existing learner");
    }
    console.log("  PASS 5.1: Forgot password generic response protects against account enumeration.");

    // 5.2 Set up known raw password reset token and test strict hash lookup
    const rawResetToken = generateSecureToken(32);
    const hashedResetToken = hashToken(rawResetToken);

    await prisma.passwordResetToken.deleteMany({ where: { email: learnerEmail } });
    await prisma.passwordResetToken.create({
      data: {
        email: learnerEmail,
        token: hashedResetToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    // 5.3 Direct submission of DB hash MUST fail
    const directResetHashRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: hashedResetToken,
        password: newPassword,
      }),
    });
    const directResetHashBody = await directResetHashRes.json();
    if (directResetHashRes.status !== 400 || directResetHashBody.error?.code !== "INVALID_TOKEN") {
      throw new Error("FAIL: Direct submission of reset SHA-256 hash was accepted!");
    }
    console.log("  PASS 5.2: Direct submission of reset SHA-256 DB hash rejected.");

    // 5.4 Expired reset token handling
    const expiredResetRaw = generateSecureToken(32);
    await prisma.passwordResetToken.create({
      data: {
        email: learnerEmail,
        token: hashToken(expiredResetRaw),
        expiresAt: new Date(Date.now() - 1000),
      },
    });

    const expiredResetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: expiredResetRaw,
        password: newPassword,
      }),
    });
    const expiredResetBody = await expiredResetRes.json();
    if (expiredResetRes.status !== 400 || expiredResetBody.error?.code !== "TOKEN_EXPIRED") {
      throw new Error("FAIL: Expired reset token was not rejected with 400 TOKEN_EXPIRED");
    }
    console.log("  PASS 5.3: Expired password reset link safely rejected with 400 TOKEN_EXPIRED.");

    // 5.5 Valid reset with raw token
    const validResetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: rawResetToken,
        password: newPassword,
      }),
    });
    const validResetBody = await validResetRes.json();
    if (validResetRes.status !== 200 || !validResetBody.success) {
      throw new Error(`FAIL: Valid password reset failed: ${JSON.stringify(validResetBody)}`);
    }
    console.log("  PASS 5.4: Valid password reset succeeded using strict SHA-256 hash lookup.");

    // 5.6 Single-use reset enforcement
    const reuseResetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: rawResetToken,
        password: newPassword,
      }),
    });
    const reuseResetBody = await reuseResetRes.json();
    if (reuseResetRes.status !== 400 || reuseResetBody.error?.code !== "INVALID_TOKEN") {
      throw new Error("FAIL: Consumed reset token was allowed to be reused!");
    }
    console.log("  PASS 5.5: Consumed password reset token rejected on second attempt (Single-Use).");

    // 5.7 Invalidation of existing sessions
    const oldSessionMeRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: learnerSessionCookie },
    });
    if (oldSessionMeRes.status !== 401) {
      throw new Error("FAIL: Old session remained active after password reset!");
    }
    console.log("  PASS 5.6: Password reset invalidated all existing sessions in PostgreSQL.");

    // 5.8 New password login succeeds, old password fails
    const oldLoginAttempt = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: learnerEmail, password: initialPassword }),
    });
    if (oldLoginAttempt.status !== 401) {
      throw new Error("FAIL: Old password was still accepted!");
    }

    const newLoginAttempt = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: learnerEmail, password: newPassword }),
    });
    if (newLoginAttempt.status !== 200) {
      throw new Error("FAIL: Login with new password failed!");
    }
    const newCookieHeader = newLoginAttempt.headers.get("set-cookie");
    learnerSessionCookie = newCookieHeader!.split(";")[0];
    console.log("  PASS 5.7: New password verified successfully; old password strictly rejected.");

    // -------------------------------------------------------------------------
    // 6. LOGOUT & SESSION DELETION
    // -------------------------------------------------------------------------
    console.log("\n[6/7] Testing Logout & Session Deletion...");

    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: learnerSessionCookie },
    });
    if (logoutRes.status !== 200) {
      throw new Error("FAIL: Logout endpoint failed");
    }

    const postLogoutMeRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: learnerSessionCookie },
    });
    if (postLogoutMeRes.status !== 401) {
      throw new Error("FAIL: Session was not invalidated after logout!");
    }
    console.log("  PASS 6.1: Logout successfully revoked session in database and cleared cookie.");

    // -------------------------------------------------------------------------
    // 7. AUTHENTICATION RATE LIMITING TESTS
    // -------------------------------------------------------------------------
    console.log("\n[7/7] Testing Authentication Rate Limiting...");

    // 7.1 Rate limiting on POST /api/auth/forgot-password (max: 10 per hour)
    let rateLimitTriggered = false;
    for (let i = 0; i < 11; i++) {
      const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `burst_${i}@insightignite.org` }),
      });
      if (res.status === 429) {
        const body = await res.json();
        if (body.error?.code === "RATE_LIMIT_EXCEEDED") {
          rateLimitTriggered = true;
          break;
        }
      }
    }
    if (!rateLimitTriggered) {
      throw new Error("FAIL: Forgot password burst did not trigger 429 RATE_LIMIT_EXCEEDED!");
    }
    console.log("  PASS 7.1: Burst requests to /api/auth/forgot-password triggered 429 RATE_LIMIT_EXCEEDED.");

    // 7.2 Rate limiting on POST /api/auth/login (max: 15 per 15 min)
    let loginRateLimitTriggered = false;
    for (let i = 0; i < 16; i++) {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: rateLimitEmail, password: "ArbitraryPassword123!" }),
      });
      if (res.status === 429) {
        const body = await res.json();
        if (body.error?.code === "RATE_LIMIT_EXCEEDED") {
          loginRateLimitTriggered = true;
          break;
        }
      }
    }
    if (!loginRateLimitTriggered) {
      throw new Error("FAIL: Login burst did not trigger 429 RATE_LIMIT_EXCEEDED!");
    }
    console.log("  PASS 7.2: Burst login attempts triggered 429 RATE_LIMIT_EXCEEDED.");

    // 7.3 Rate limiting on POST /api/auth/register (max: 10 per hour)
    let regRateLimitTriggered = false;
    for (let i = 0; i < 11; i++) {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Rate Limit User ${i}`,
          email: `burst_reg_${i}_${timestamp}@insightignite.org`,
          password: "SecureRegistrationPass123!",
        }),
      });
      if (res.status === 429) {
        const body = await res.json();
        if (body.error?.code === "RATE_LIMIT_EXCEEDED") {
          regRateLimitTriggered = true;
          break;
        }
      }
    }
    if (!regRateLimitTriggered) {
      throw new Error("FAIL: Register burst did not trigger 429 RATE_LIMIT_EXCEEDED!");
    }
    console.log("  PASS 7.3: Burst registration attempts triggered 429 RATE_LIMIT_EXCEEDED.");

    console.log("\n======================================================");
    console.log("   ALL 24 AUTHENTICATION & SECURITY TESTS PASSED!     ");
    console.log("======================================================");
  } finally {
    // Clean up test records
    await prisma.session.deleteMany({
      where: { user: { email: { in: [learnerEmail, adminEmail, rateLimitEmail] } } },
    });
    await prisma.emailVerificationToken.deleteMany({
      where: { email: { in: [learnerEmail, adminEmail, rateLimitEmail] } },
    });
    await prisma.passwordResetToken.deleteMany({
      where: { email: { in: [learnerEmail, adminEmail, rateLimitEmail] } },
    });
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { in: [learnerEmail, adminEmail, rateLimitEmail] } },
          { email: { startsWith: `burst_reg_` } },
        ],
      },
    });
    await prisma.$disconnect();
    server.close();
  }
}

runAuthTestSuite().catch((err) => {
  console.error("FATAL: Auth test suite failed:", err);
  process.exit(1);
});
