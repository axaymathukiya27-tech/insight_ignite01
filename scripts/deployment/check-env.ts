/**
 * Environment variable verification script for pre-deployment checks.
 */
import "dotenv/config";

export function verifyEnvironment() {
  const required = [
    "PORT",
    "NODE_ENV",
    "DATABASE_URL",
  ];

  const missing = required.filter((key) => !process.env[key] || process.env[key]?.trim() === "");

  if (missing.length > 0) {
    console.warn(`[WARN] Missing required environment variables: ${missing.join(", ")}`);
    return false;
  } else {
    console.log("[OK] Required environment variables verified for deployment.");
    return true;
  }
}

if (require.main === module) {
  const ok = verifyEnvironment();
  if (!ok) {
    process.exit(1);
  }
}
