import { createApp } from "../src/app";
import { Server } from "http";

async function runApiTests() {
  console.log("=== Insight Ignite API Foundation Test Suite ===");
  const app = createApp();
  const testPort = 5055;
  const baseUrl = `http://localhost:${testPort}`;

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(testPort, () => resolve(s));
  });

  try {
    // 1. Health / Liveness Endpoint
    console.log("\n--- Test 1: GET /api/health (Liveness) ---");
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthBody = await healthRes.json();
    console.log("Status:", healthRes.status);
    console.log("Response:", JSON.stringify(healthBody, null, 2));

    if (healthRes.status !== 200 || !healthBody.success || healthBody.data.status !== "ok") {
      throw new Error("FAIL: /api/health returned invalid response");
    }
    console.log("PASS: /api/health reported application healthy.");

    // 2. Readiness Endpoint
    console.log("\n--- Test 2: GET /api/ready (Database Readiness) ---");
    const readyRes = await fetch(`${baseUrl}/api/ready`);
    const readyBody = await readyRes.json();
    console.log("Status:", readyRes.status);
    console.log("Response:", JSON.stringify(readyBody, null, 2));

    if (readyRes.status !== 200 || !readyBody.success || readyBody.data.database !== "connected") {
      throw new Error("FAIL: /api/ready did not report database connected");
    }
    console.log(`PASS: /api/ready reported database connected in ${readyBody.data.latencyMs}ms.`);

    // 3. Health Ready Alias Endpoint
    console.log("\n--- Test 3: GET /api/health/ready ---");
    const healthReadyRes = await fetch(`${baseUrl}/api/health/ready`);
    const healthReadyBody = await healthReadyRes.json();
    if (healthReadyRes.status !== 200 || !healthReadyBody.success) {
      throw new Error("FAIL: /api/health/ready alias failed");
    }
    console.log("PASS: /api/health/ready alias operational.");

    // 4. Top-level Root Aliases
    console.log("\n--- Test 4: Root Aliases GET /health and GET /ready ---");
    const rootHealthRes = await fetch(`${baseUrl}/health`);
    const rootHealthBody = await rootHealthRes.json();
    if (rootHealthRes.status !== 200 || !rootHealthBody.success) {
      throw new Error("FAIL: Root /health failed");
    }
    const rootReadyRes = await fetch(`${baseUrl}/ready`);
    const rootReadyBody = await rootReadyRes.json();
    if (rootReadyRes.status !== 200 || !rootReadyBody.success) {
      throw new Error("FAIL: Root /ready failed");
    }
    console.log("PASS: Root aliases operational for load balancer / orchestrator probes.");

    // 5. Standardized 404 Error Contract
    console.log("\n--- Test 5: Unknown Route 404 Contract ---");
    const notFoundRes = await fetch(`${baseUrl}/api/unknown-endpoint-xyz`);
    const notFoundBody = await notFoundRes.json();
    console.log("Status:", notFoundRes.status);
    console.log("Response:", JSON.stringify(notFoundBody, null, 2));

    if (
      notFoundRes.status !== 404 ||
      notFoundBody.success !== false ||
      notFoundBody.error.code !== "NOT_FOUND"
    ) {
      throw new Error("FAIL: 404 error envelope mismatch");
    }
    console.log("PASS: Standardized 404 contract verified.");

    // 6. Request ID Propagation
    console.log("\n--- Test 6: Request ID Propagation ---");
    const customRequestId = "test-request-id-123456";
    const reqIdRes = await fetch(`${baseUrl}/api/health`, {
      headers: { "X-Request-Id": customRequestId },
    });
    const reqIdHeader = reqIdRes.headers.get("x-request-id");
    const reqIdBody = await reqIdRes.json();

    if (reqIdHeader !== customRequestId || reqIdBody.requestId !== customRequestId) {
      throw new Error("FAIL: Request ID did not propagate correctly");
    }
    console.log(`PASS: Request ID successfully propagated: ${reqIdHeader}`);

    console.log("\n==========================================");
    console.log("ALL API FOUNDATION TESTS PASSED (6/6)");
    console.log("==========================================");
  } finally {
    server.close();
  }
}

runApiTests().catch((err) => {
  console.error("FATAL: API test failed:", err);
  process.exit(1);
});
