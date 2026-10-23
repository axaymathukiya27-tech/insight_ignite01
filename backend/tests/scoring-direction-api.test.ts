/**
 * End-to-end check of direction-aware results through the real API and database.
 * Synthetic data only. Refuses to run unless DATABASE_URL points to a local database
 * whose name ends in "_test" (never production).
 *
 * Run: DATABASE_URL=<local *_test db> npx tsx tests/scoring-direction-api.test.ts
 */
import { Server } from "http";
import { AddressInfo } from "net";
import { prisma, UserRole } from "@insight-ignite/database";
import { createApp } from "../src/app";
import { createSession } from "../src/modules/auth/session.service";

const url = new URL(process.env.DATABASE_URL || "postgresql://invalid/none");
if (!["127.0.0.1", "localhost", "::1"].includes(url.hostname) || !/_test$/.test(url.pathname.slice(1))) {
  console.error("REFUSED: DATABASE_URL must be a local *_test database.");
  process.exit(2);
}

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { passed++; console.log(`  PASS ${name}`); }
  else { failed++; console.log(`  FAIL ${name}${detail ? " :: " + detail : ""}`); }
}

(async () => {
  const stamp = Date.now();
  const app = createApp();
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;

  const admin = await prisma.user.create({
    data: { email: `dir_admin_${stamp}@example.test`, fullName: "Direction Test Admin", role: UserRole.PLATFORM_ADMIN, emailVerified: new Date() },
  });
  const { sessionToken } = await createSession(admin.id);
  const adminCookie = `insight_session=${sessionToken}`;
  let instrumentId = "";

  const call = async (method: string, path: string, body?: unknown, cookie = adminCookie) => {
    const res = await fetch(base + path, {
      method,
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const setCookie = res.headers.getSetCookie();
    return { status: res.status, json: (await res.json().catch(() => null)) as any, setCookie };
  };

  try {
    // Instrument shaped like the Parent Style Questionnaire (2 items per dimension here)
    let r = await call("POST", "/admin/assessments/instruments", {
      slug: `direction-test-${stamp}`, title: "Direction Test Instrument",
      description: "Synthetic instrument for scoring-direction tests.", category: "parenting",
    });
    instrumentId = r.json?.data?.instrument?.id;
    const v1 = r.json?.data?.instrument?.versions?.[0]?.id;
    check("instrument + v1 created", r.status === 201 && !!v1);

    const codes = ["WARMTH", "STRUCTURE", "AUTONOMY", "CONTROL"];
    const factorIds: Record<string, string> = {};
    for (const [i, code] of codes.entries()) {
      r = await call("POST", `/admin/assessments/versions/${v1}/factors`, { code, name: `${code} dimension`, orderIndex: i + 1, description: `About ${code}` });
      factorIds[code] = r.json?.data?.factor?.id;
    }
    const options = [1, 2, 3, 4, 5].map((v) => ({ id: `o${v}`, label: `L${v}`, orderIndex: v, value: v }));
    const itemIds: Record<string, string[]> = {};
    let order = 1;
    for (const code of codes) {
      itemIds[code] = [];
      for (let n = 1; n <= 2; n++) {
        r = await call("POST", `/admin/assessments/versions/${v1}/items`, {
          factorId: factorIds[code], itemKey: `${code}_${n}`, orderIndex: order++, prompt: `Synthetic prompt ${code} ${n}`, options,
        });
        itemIds[code].push(r.json?.data?.item?.id);
      }
    }

    const scoring = {
      formula: "SUM_OF_WEIGHTS",
      bands: [
        { name: "Area for Growth", minPercentage: 0, maxPercentage: 49, classification: "GROWTH_OPPORTUNITY" },
        { name: "Developing", minPercentage: 50, maxPercentage: 74, classification: "STEADY" },
        { name: "Strength", minPercentage: 75, maxPercentage: 100, classification: "STRENGTH" },
      ],
      strengthsThresholdPct: 75,
      growthThresholdPct: 49,
    };
    r = await call("PUT", `/admin/assessments/versions/${v1}/scoring-config`, { ...scoring, reverseScoredFactors: ["NOT_A_FACTOR"] });
    check("unknown reverse-scored code rejected (400)", r.status === 400 && r.json?.error?.code === "SCORING_CONFIG_INCONSISTENT");
    r = await call("PUT", `/admin/assessments/versions/${v1}/scoring-config`, { ...scoring, reverseScoredFactors: ["CONTROL"] });
    check("scoring config with reverseScoredFactors saved", r.status === 200);
    await call("POST", `/admin/assessments/versions/${v1}/approve`, { approverName: "Test Approver" });
    r = await call("POST", `/admin/assessments/versions/${v1}/activate`);
    check("version published", r.status === 200);

    // Answers: WARMTH 5,5 (100%) | STRUCTURE 3,3 (60%) | AUTONOMY 1,2 (30%) | CONTROL 4,5 (90% raw -> 30% reversed)
    const pick: Record<string, number[]> = { WARMTH: [5, 5], STRUCTURE: [3, 3], AUTONOMY: [1, 2], CONTROL: [4, 5] };
    const answers = codes.flatMap((c) => itemIds[c].map((id, i) => ({ itemId: id, selectedOptionId: `o${pick[c][i]}` })));
    r = await call("POST", "/assessments/submit", { versionId: v1, consentGiven: true, consentNoticeVersion: "test", answers }, "");
    const res = r.json?.data?.result;
    const accessCookie = (r.setCookie.find((c: string) => c.startsWith("insight_assessment_key=")) || "").split(";")[0];
    check("submission accepted", r.status === 201 && !!res);
    check("CONTROL 90% raw -> 30% reversed -> GROWTH",
      res.factorScores.CONTROL.percentage === 90 && res.factorScores.CONTROL.interpretedPercentage === 30 &&
      res.factorScores.CONTROL.classification === "GROWTH_OPPORTUNITY");
    check("CONTROL not a strength", !res.strengths.some((s: any) => s.factorCode === "CONTROL"));
    check("WARMTH strength", res.strengths.map((s: any) => s.factorCode).join(",") === "WARMTH");
    check("growth = CONTROL + AUTONOMY", res.growthAreas.map((g: any) => g.factorCode).sort().join(",") === "AUTONOMY,CONTROL");
    check("STRUCTURE developing (steadyAreas)", (res.steadyAreas || []).map((s: any) => s.factorCode).join(",") === "STRUCTURE");

    // Read path: stored result returns the same classification and rebuilds steady areas
    r = await call("GET", `/assessments/results/${res.submissionId}`, undefined, accessCookie);
    const stored = r.json?.data?.result;
    check("stored result readable", r.status === 200 && !!stored);
    check("stored classification persisted", stored.factorScores.CONTROL.classification === "GROWTH_OPPORTUNITY" && stored.factorScores.CONTROL.direction === "HIGHER_IS_CONCERN");
    check("steady areas rebuilt on read", (stored.steadyAreas || []).map((s: any) => s.factorCode).join(",") === "STRUCTURE");
    const dbResult = await prisma.assessmentResult.findUnique({ where: { submissionId: res.submissionId } });
    // overall = 5+5 + 3+3 + 1+2 + reversed(4,5 -> 2,1) = 22
    check("stored overall score uses reverse-scoring (22)", dbResult?.overallScore === 22, `got ${dbResult?.overallScore}`);

    // New draft version copies questions and the scoring direction; v1 is untouched
    r = await call("POST", `/admin/assessments/instruments/${instrumentId}/versions`, {});
    const v2 = r.json?.data?.version;
    check("v2 created", r.status === 201 && v2?.versionNumber === 2);
    check("v2 copied 4 factors and 8 questions", v2?.factorsCount === 4 && v2?.itemsCount === 8, `${v2?.factorsCount}/${v2?.itemsCount}`);
    check("v2 kept reverseScoredFactors", JSON.stringify(v2?.scoringConfig?.reverseScoredFactors) === JSON.stringify(["CONTROL"]));
    check("v2 is a DRAFT", v2?.status === "DRAFT");
    const v1Items = await prisma.assessmentItem.count({ where: { versionId: v1 } });
    const v1Status = (await prisma.assessmentVersion.findUnique({ where: { id: v1 } }))?.status;
    check("v1 unchanged (8 items, still ACTIVE)", v1Items === 8 && v1Status === "ACTIVE");
  } catch (e) {
    failed++;
    console.log("  FAIL unexpected error ::", (e as Error).message);
  } finally {
    if (instrumentId) {
      await prisma.assessmentResult.deleteMany({ where: { version: { instrumentId } } }).catch(() => {});
      await prisma.assessmentRawResponse.deleteMany({ where: { submission: { version: { instrumentId } } } }).catch(() => {});
      await prisma.assessmentSubmission.deleteMany({ where: { version: { instrumentId } } }).catch(() => {});
      await prisma.assessmentAuditLog.deleteMany({ where: { instrumentId } }).catch(() => {});
      await prisma.assessmentCourseMapping.deleteMany({ where: { version: { instrumentId } } }).catch(() => {});
      await prisma.assessmentItem.deleteMany({ where: { version: { instrumentId } } }).catch(() => {});
      await prisma.assessmentFactorDefinition.deleteMany({ where: { version: { instrumentId } } }).catch(() => {});
      await prisma.assessmentVersion.deleteMany({ where: { instrumentId } }).catch(() => {});
      await prisma.assessmentInstrument.delete({ where: { id: instrumentId } }).catch(() => {});
    }
    await prisma.user.delete({ where: { id: admin.id } }).catch(() => {});
    server.close();
    await prisma.$disconnect();
    console.log(`\n${failed === 0 ? "ALL" : ""} ${passed} passed, ${failed} failed`);
    process.exit(failed === 0 ? 0 : 1);
  }
})();
