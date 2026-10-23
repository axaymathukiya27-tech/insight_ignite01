/**
 * Imported first by every test suite that writes to the database. Without an explicit
 * DATABASE_URL, Prisma falls back to database/.env (the real database), so these suites
 * refuse to run unless the target is a local database whose name ends in "_test".
 */
const target = new URL(process.env.DATABASE_URL || "postgresql://invalid/none");
if (!["127.0.0.1", "localhost", "::1"].includes(target.hostname) || !/_test$/.test(target.pathname.slice(1))) {
  console.error("REFUSED: set DATABASE_URL to a local *_test database before running this suite.");
  process.exit(2);
}

export {};
