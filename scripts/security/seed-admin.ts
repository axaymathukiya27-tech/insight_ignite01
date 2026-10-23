/**
 * Safe Administrator Account Provisioning Script
 *
 * This script provisions the initial administrative user without hardcoded credentials.
 * It requires explicit environment variables:
 *   ADMIN_EMAIL (required)
 *   ADMIN_PASSWORD (required, minimum 12 characters)
 *   ADMIN_NAME (optional, defaults to "Platform Administrator")
 *
 * Example usage:
 *   $env:ADMIN_EMAIL="admin@insightignite.org"; $env:ADMIN_PASSWORD="YourStrongPassword123!"; npm run admin:provision
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma, UserRole } from "../../database/src";

async function provisionAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_NAME?.trim() || "Platform Administrator";

  console.log("=== Insight Ignite Administrator Provisioning ===");

  if (!email || !password) {
    console.error("❌ ERROR: Both ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.");
    console.error("Usage example (PowerShell):");
    console.error('  $env:ADMIN_EMAIL="admin@insightignite.org"; $env:ADMIN_PASSWORD="YourStrongPassword123!"; npm run admin:provision');
    process.exit(1);
  }

  if (password.length < 12) {
    console.error("❌ ERROR: Administrator password must be at least 12 characters in length.");
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const adminUser = await prisma.user.upsert({
    where: { email },
    update: {
      fullName,
      role: UserRole.PLATFORM_ADMIN,
      passwordHash: hashedPassword,
      emailVerified: new Date(),
      isActive: true,
    },
    create: {
      email,
      fullName,
      role: UserRole.PLATFORM_ADMIN,
      passwordHash: hashedPassword,
      emailVerified: new Date(),
      isActive: true,
    },
  });

  console.log(`✅ Administrator account successfully provisioned:`);
  console.log(`   User ID: ${adminUser.id}`);
  console.log(`   Email:   ${adminUser.email}`);
  console.log(`   Name:    ${adminUser.fullName}`);
  console.log(`   Role:    ${adminUser.role}`);
  console.log(`   Status:  Active & Verified`);
  console.log("\nCredentials have been hashed with bcrypt. Never commit plaintext passwords.");

  await prisma.$disconnect();
}

provisionAdmin().catch(async (error) => {
  console.error("FATAL: Admin provisioning failed:", error);
  await prisma.$disconnect();
  process.exit(1);
});
