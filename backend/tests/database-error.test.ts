import { createApp } from "../src/app";
import { Server } from "http";

async function runDatabaseErrorTests() {
  console.log("=== Testing Error Behavior When Database Is Unavailable ===");

  // Simulate missing/broken database connection
  const originalEnv = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "postgresql://invalid_user:invalid_pass@localhost:59999/non_existent_db?connect_timeout=2";

  // Re-import or create app with broken DB
  const app = createApp();
  const testPort = 5056;
  const baseUrl = `http://localhost:${testPort}`;

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(testPort, () => resolve(s));
  });

  try {
    // 1. Health should STILL succeed (liveness intact)
    console.log("\n--- Test A: GET /api/health when DB is down ---");
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthBody = await healthRes.json();
    console.log("Health Status Code:", healthRes.status);
    console.log("Health Body:", JSON.stringify(healthBody));

    if (healthRes.status !== 200 || !healthBody.success) {
      throw new Error("FAIL: Health endpoint should remain 200 even when DB is unreachable");
    }
    console.log("PASS: Application liveness remains healthy independently of database failure.");

    // 2. Readiness should FAIL gracefully with 503
    console.log("\n--- Test B: GET /api/ready when DB is down ---");
    const readyRes = await fetch(`${baseUrl}/api/ready`);
    const readyBody = await readyRes.json();
    console.log("Ready Status Code:", readyRes.status);
    console.log("Ready Body:", JSON.stringify(readyBody, null, 2));

    if (readyRes.status !== 503 || readyBody.success !== false) {
      throw new Error("FAIL: Readiness endpoint did not return 503 when DB is down");
    }
    console.log("PASS: Database readiness correctly returned 503 Service Unavailable with error details.");

    console.log("\n==========================================");
    console.log("DATABASE ERROR RESILIENCE VERIFIED (2/2)");
    console.log("==========================================");
  } finally {
    process.env.DATABASE_URL = originalEnv;
    server.close();
  }
}

runDatabaseErrorTests().catch((err) => {
  console.error("FATAL: Error test failed:", err);
  process.exit(1);
});
