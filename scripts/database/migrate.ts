/**
 * Database migration runner script.
 */
import "dotenv/config";
import { checkDatabaseConnection } from "../../database/src";
import { execSync } from "child_process";
import path from "path";

export async function runMigrations() {
  console.log("Checking database connection before applying Prisma migrations...");
  const conn = await checkDatabaseConnection();
  if (!conn.connected) {
    console.error("❌ Cannot apply migrations: Database is unreachable:", conn.error);
    process.exit(1);
  }
  console.log(`✅ Connected to PostgreSQL database in ${conn.latencyMs}ms.`);

  const databaseDir = path.resolve(__dirname, "../../database");
  console.log("Applying pending Prisma migrations (deploy mode)...");
  execSync("npx prisma migrate deploy", {
    cwd: databaseDir,
    stdio: "inherit",
    env: process.env,
  });
  console.log("✅ Database migrations applied and verified.");
}

if (require.main === module) {
  runMigrations().catch((err) => {
    console.error("Migration runner failed:", err);
    process.exit(1);
  });
}
