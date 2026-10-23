/**
 * Seven-day practice plans, assessment history / progress comparison, course resources,
 * and the read-only admin views, end to end through the real API and database.
 * Synthetic data only. Refuses to run unless DATABASE_URL points to a local database
 * whose name ends in "_test" (never production). Everything it creates is removed.
 *
 * Run: DATABASE_URL=<local *_test db> npx tsx tests/practice-progress-api.test.ts
 */
import { Server } from "http";
import { AddressInfo } from "net";
import { prisma, UserRole, CourseStatus } from "@insight-ignite/database";
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

  const mkUser = async (tag: string, role: UserRole) => {
    const u = await prisma.user.create({
      data: { email: `pp_${tag}_${stamp}@example.test`, fullName: `Synthetic ${tag}`, role, emailVerified: new Date(), passwordHash: "not-a-real-hash" },
    });
    const { sessionToken } = await createSession(u.id);
    return { user: u, cookie: `insight_session=${sessionToken}` };
  };
  const admin = await mkUser("admin", UserRole.PLATFORM_ADMIN);
  const parentA = await mkUser("parentA", UserRole.PARENT);
  const parentB = await mkUser("parentB", UserRole.PARENT);
  const userIds = [admin.user.id, parentA.user.id, parentB.user.id];
  let instrumentId = "";
  let courseId = "";

  const call = async (method: string, path: string, body?: unknown, cookie = "") => {
    const res = await fetch(base + path, {
      method,
      headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, json: (await res.json().catch(() => null)) as any };
  };

  try {
    // --- Synthetic instrument shaped like the Parent Style Questionnaire ---
    const slug = `pp-test-${stamp}`;
    let r = await call("POST", "/admin/assessments/instruments", { slug, title: "Practice Plan Test Instrument", description: "Synthetic.", category: "parenting" }, admin.cookie);
    instrumentId = r.json?.data?.instrument?.id;
    const v1 = r.json?.data?.instrument?.versions?.[0]?.id;
    const dims = [
      ["WARMTH", "Emotional Warmth and Responsiveness"],
      ["STRUCTURE", "Structure and Consistent Boundaries"],
      ["AUTONOMY", "Autonomy and Independence"],
      ["CONTROL", "Psychological Control and Criticism"],
    ];
    const factorIds: Record<string, string> = {};
    for (const [i, [code, name]] of dims.entries()) {
      r = await call("POST", `/admin/assessments/versions/${v1}/factors`, { code, name, orderIndex: i + 1 }, admin.cookie);
      factorIds[code] = r.json?.data?.factor?.id;
    }
    const options = ["Never", "Rarely", "Sometimes", "Often", "Always"].map((label, i) => ({ id: `o${i + 1}`, label, orderIndex: i + 1, value: i + 1 }));
    const itemIds: Record<string, string[]> = {};
    let order = 1;
    for (const [code] of dims) {
      itemIds[code] = [];
      for (let n = 1; n <= 2; n++) {
        r = await call("POST", `/admin/assessments/versions/${v1}/items`, { factorId: factorIds[code], itemKey: `${code}_${n}`, orderIndex: order++, prompt: `Synthetic ${code} statement ${n}`, options }, admin.cookie);
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
      reverseScoredFactors: ["CONTROL"],
    };
    await call("PUT", `/admin/assessments/versions/${v1}/scoring-config`, scoring, admin.cookie);

    // A real (synthetic) course mapped to AUTONOMY, published, with lesson durations
    const course = await prisma.course.create({
      data: {
        slug: `pp-course-${stamp}`, title: "Synthetic Autonomy Course", description: "Synthetic course for tests.",
        priceAmount: 149900, currency: "INR", status: CourseStatus.PUBLISHED,
        lessons: { create: [{ title: "L1", orderIndex: 1, durationMin: 20 }, { title: "L2", orderIndex: 2, durationMin: 25 }] },
      },
    });
    courseId = course.id;
    await prisma.assessmentCourseMapping.create({ data: { versionId: v1, factorId: factorIds.AUTONOMY, courseId } });

    await call("POST", `/admin/assessments/versions/${v1}/approve`, { approverName: "Test Approver" }, admin.cookie);
    r = await call("POST", `/admin/assessments/versions/${v1}/activate`, undefined, admin.cookie);
    check("synthetic instrument published", r.status === 200);

    const submit = async (pick: Record<string, number[]>, versionId: string, ids = itemIds, cookie = parentA.cookie) => {
      const answers = Object.keys(ids).flatMap((c) => ids[c].map((id, i) => ({ itemId: id, selectedOptionId: `o${pick[c][i]}` })));
      return call("POST", "/assessments/submit", { versionId, consentGiven: true, consentNoticeVersion: "test", answers }, cookie);
    };

    // --- Progress before any attempt ---
    r = await call("GET", `/assessments/my-progress/${slug}`, undefined, parentA.cookie);
    check("no attempts: empty history and no comparison", r.status === 200 && r.json.data.progress.attempts.length === 0 && r.json.data.progress.comparison.available === false);

    // --- Attempt 1 ---
    // WARMTH 5,5 strength | STRUCTURE 3,4 developing | AUTONOMY 2,1 growth | CONTROL 4,5 raw 90% -> 30% growth
    r = await submit({ WARMTH: [5, 5], STRUCTURE: [3, 4], AUTONOMY: [2, 1], CONTROL: [4, 5] }, v1);
    const res1 = r.json?.data?.result;
    check("attempt 1 saved with a 7-day plan and recommendations", r.status === 201 && res1.practicePlan.length === 7 && res1.practiceRecommendations.length === 4);
    check("result names its assessment (for retake / history)", res1.instrumentSlug === slug);
    check("course resource uses real catalogue facts", res1.recommendedCourses.length === 1 &&
      res1.recommendedCourses[0].priceAmount === 149900 && res1.recommendedCourses[0].lessonCount === 2 &&
      res1.recommendedCourses[0].totalDurationMin === 45 && res1.recommendedCourses[0].isEnrolled === false);
    const s1 = res1.submissionId;

    r = await call("GET", `/assessments/my-progress/${slug}`, undefined, parentA.cookie);
    check("one attempt: listed, comparison explains a retake is needed",
      r.json.data.progress.attempts.length === 1 && r.json.data.progress.comparison.available === false && /again/.test(r.json.data.progress.comparison.reason));

    // --- Practice plan access control and persistence ---
    r = await call("GET", `/assessments/results/${s1}/practice-plan`);
    check("plan requires sign-in (401)", r.status === 401);
    r = await call("GET", `/assessments/results/${s1}/practice-plan`, undefined, parentB.cookie);
    check("another parent cannot read the plan (403)", r.status === 403);
    r = await call("GET", `/assessments/results/${s1}/practice-plan`, undefined, admin.cookie);
    check("an administrator cannot read a parent's plan either (403)", r.status === 403);
    r = await call("GET", `/assessments/results/${s1}/practice-plan`, undefined, parentA.cookie);
    check("owner sees the plan, not started yet", r.status === 200 && r.json.data.plan.started === false && r.json.data.plan.days.length === 7);
    r = await call("PUT", `/assessments/results/${s1}/practice-plan/days/1`, { completed: true }, parentA.cookie);
    check("marking a day before starting is refused (400)", r.status === 400 && r.json.error.code === "PLAN_NOT_STARTED");

    const [st1, st2] = await Promise.all([
      call("POST", `/assessments/results/${s1}/practice-plan/start`, undefined, parentA.cookie),
      call("POST", `/assessments/results/${s1}/practice-plan/start`, undefined, parentA.cookie),
    ]);
    const planCount = await prisma.assessmentPracticePlan.count({ where: { submissionId: s1 } });
    check("starting twice (even at once) creates one plan", (st1.status === 200 || st2.status === 200) && planCount === 1, `${st1.status}/${st2.status}/${planCount}`);
    r = await call("POST", `/assessments/results/${s1}/practice-plan/start`, undefined, parentB.cookie);
    check("another parent cannot start it (403)", r.status === 403);

    r = await call("PUT", `/assessments/results/${s1}/practice-plan/days/1`, { completed: true, note: "Synthetic reflection." }, parentA.cookie);
    const firstDone = r.json?.data?.plan?.days?.[0]?.completedAt;
    await call("PUT", `/assessments/results/${s1}/practice-plan/days/1`, { completed: true }, parentA.cookie);
    r = await call("GET", `/assessments/results/${s1}/practice-plan`, undefined, parentA.cookie);
    const p = r.json.data.plan;
    const dayRows = await prisma.assessmentPracticeDay.count({ where: { plan: { submissionId: s1 }, dayNumber: 1 } });
    check("repeated completion keeps one record and the original time", dayRows === 1 && p.days[0].completedAt === firstDone);
    check("note persists after reload (and is kept when not resent)", p.days[0].note === "Synthetic reflection.");
    check("progress counts and percentage", p.completedCount === 1 && p.completionPct === 14);
    r = await call("PUT", `/assessments/results/${s1}/practice-plan/days/8`, { completed: true }, parentA.cookie);
    check("day outside 1-7 refused (400)", r.status === 400);
    r = await call("PUT", `/assessments/results/${s1}/practice-plan/days/2`, { completed: true, note: "x".repeat(1001) }, parentA.cookie);
    check("over-long note refused (400)", r.status === 400);
    r = await call("PUT", `/assessments/results/${s1}/practice-plan/days/2`, { completed: true }, parentB.cookie);
    check("another parent cannot mark a day (403)", r.status === 403);
    for (let d = 2; d <= 7; d++) {
      r = await call("PUT", `/assessments/results/${s1}/practice-plan/days/${d}`, { completed: true }, parentA.cookie);
    }
    check("all seven done: plan completed", r.json.data.plan.completedAt !== null && r.json.data.plan.completionPct === 100);
    r = await call("PUT", `/assessments/results/${s1}/practice-plan/days/7`, { completed: false }, parentA.cookie);
    check("un-marking a day reopens the plan", r.json.data.plan.completedAt === null && r.json.data.plan.completedCount === 6);

    // --- Attempt 2 and 3 (retakes) ---
    // CONTROL raw rises 90% -> 100% (more frequent concerning behaviour); AUTONOMY 30% -> 70%
    r = await submit({ WARMTH: [5, 5], STRUCTURE: [3, 4], AUTONOMY: [4, 3], CONTROL: [5, 5] }, v1);
    const s2 = r.json?.data?.result?.submissionId;
    check("retake creates a new attempt", r.status === 201 && s2 && s2 !== s1);
    r = await call("GET", `/assessments/results/${s1}`, undefined, parentA.cookie);
    check("first report still available and unchanged", r.status === 200 && r.json.data.result.factorScores.AUTONOMY.percentage === 30);

    r = await call("GET", `/assessments/my-progress/${slug}`, undefined, parentA.cookie);
    let prog = r.json.data.progress;
    let rows = Object.fromEntries(prog.comparison.rows.map((x: any) => [x.factorCode, x]));
    check("two attempts: comparison available", prog.comparison.available === true && prog.comparison.comparedAttempts === 2);
    check("difference = latest - earlier in percentage points", rows.AUTONOMY.earlier === 30 && rows.AUTONOMY.latest === 70 && rows.AUTONOMY.difference === 40);
    check("increase on a positive dimension described as more of the positive behaviour", /more often/.test(rows.AUTONOMY.meaning) && /positive behaviour/.test(rows.AUTONOMY.meaning));
    check("increase on a reverse-scored dimension is NOT called an improvement",
      rows.CONTROL.difference === 10 && /may be happening more often/.test(rows.CONTROL.meaning) && !/improv/i.test(rows.CONTROL.meaning));
    check("no change described as the same", rows.WARMTH.difference === 0 && /same/.test(rows.WARMTH.meaning));
    check("attempts newest first with numbers", prog.attempts.map((a: any) => a.attemptNumber).join() === "2,1" && prog.attempts[1].practiceCompletedDays === 6);

    r = await submit({ WARMTH: [4, 4], STRUCTURE: [3, 3], AUTONOMY: [4, 4], CONTROL: [2, 2] }, v1);
    r = await call("GET", `/assessments/my-progress/${slug}`, undefined, parentA.cookie);
    prog = r.json.data.progress;
    rows = Object.fromEntries(prog.comparison.rows.map((x: any) => [x.factorCode, x]));
    check("three attempts: first vs latest across 3", prog.comparison.comparedAttempts === 3 && prog.comparison.firstSubmissionId === s1);
    check("decrease on a reverse-scored dimension described as the positive direction", rows.CONTROL.difference === -50 && /positive direction/.test(rows.CONTROL.meaning));

    // --- A changed version is not compared directly ---
    r = await call("POST", `/admin/assessments/instruments/${instrumentId}/versions`, {}, admin.cookie);
    const v2 = r.json?.data?.version?.id;
    const v2Detail = await prisma.assessmentVersion.findUnique({ where: { id: v2 }, include: { items: true, factors: true } });
    const warmV2 = v2Detail!.factors.find((f) => f.code === "WARMTH")!;
    await call("POST", `/admin/assessments/versions/${v2}/items`, { factorId: warmV2.id, itemKey: "WARMTH_3", orderIndex: 9, prompt: "Synthetic WARMTH statement 3", options }, admin.cookie);
    await call("POST", `/admin/assessments/versions/${v2}/approve`, { approverName: "Test Approver" }, admin.cookie);
    r = await call("POST", `/admin/assessments/versions/${v2}/activate`, undefined, admin.cookie);
    const v2Items = await prisma.assessmentItem.findMany({ where: { versionId: v2 }, include: { factor: true }, orderBy: { orderIndex: "asc" } });
    const ids2: Record<string, string[]> = {};
    for (const it of v2Items) (ids2[it.factor.code] ||= []).push(it.id);
    r = await submit({ WARMTH: [5, 5, 5], STRUCTURE: [3, 3], AUTONOMY: [4, 4], CONTROL: [2, 2] }, v2, ids2);
    check("attempt on changed version saved", r.status === 201);
    r = await call("GET", `/assessments/my-progress/${slug}`, undefined, parentA.cookie);
    prog = r.json.data.progress;
    check("changed questions: not compared, reason given, all 4 reports listed",
      prog.comparison.available === false && /different version/.test(prog.comparison.reason) && prog.attempts.length === 4);
    check("earlier attempts marked not comparable with the latest", prog.attempts.filter((a: any) => a.comparable).length === 1);

    // --- A legacy result (no recorded scoring direction) is never compared ---
    const legacyScores = Object.fromEntries(dims.map(([c, n]) => [c, { factorCode: c, factorName: n, rawScore: 8, maxScore: 10, percentage: 80, band: "Strengths" }]));
    const legacy = await prisma.assessmentSubmission.create({
      data: { versionId: v1, userId: parentB.user.id, status: "SUBMITTED", completedAt: new Date(Date.now() - 86400000), consentGiven: true, consentNoticeVersion: "test",
        result: { create: { versionId: v1, factorScores: legacyScores, strengths: [], growthAreas: [], recommendationsSummary: [] } } },
    });
    r = await submit({ WARMTH: [5, 5, 5], STRUCTURE: [3, 3], AUTONOMY: [4, 4], CONTROL: [2, 2] }, v2, ids2, parentB.cookie);
    r = await call("GET", `/assessments/my-progress/${slug}`, undefined, parentB.cookie);
    check("parent B sees only their own 2 attempts", r.json.data.progress.attempts.length === 2);
    check("legacy result not compared", r.json.data.progress.comparison.available === false);
    r = await call("GET", `/assessments/results/${legacy.id}`, undefined, parentB.cookie);
    check("legacy report still opens, with no invented plan", r.status === 200 && r.json.data.result.practicePlan.length === 0);
    r = await call("POST", `/assessments/results/${legacy.id}/practice-plan/start`, undefined, parentB.cookie);
    check("legacy result cannot start a plan (400)", r.status === 400 && r.json.error.code === "PLAN_UNAVAILABLE");

    // --- History list ---
    r = await call("GET", "/assessments/my-history", undefined, parentA.cookie);
    const hist = r.json.data.history.filter((h: any) => h.instrumentSlug === slug);
    check("history: 4 attempts numbered 1-4 with plan progress", hist.length === 4 &&
      hist.map((h: any) => h.attemptNumber).sort().join() === "1,2,3,4" && hist.find((h: any) => h.submissionId === s1).practiceCompletedDays === 6);

    // --- Courses: enrollment flag, unpublished course dropped ---
    await prisma.enrollment.create({ data: { userId: parentA.user.id, courseId } });
    r = await call("GET", `/assessments/results/${s1}`, undefined, parentA.cookie);
    check("enrolled parent sees 'already enrolled'", r.json.data.result.recommendedCourses[0]?.isEnrolled === true);
    r = await call("GET", "/courses/my/enrollments", undefined, parentA.cookie);
    check("my enrollments returns own real enrollment", r.status === 200 && r.json.data.enrollments.length === 1 && r.json.data.enrollments[0].courseId === courseId);
    r = await call("GET", "/courses/my/enrollments", undefined, parentB.cookie);
    check("other parent's enrollments not shown", r.json.data.enrollments.length === 0);
    await prisma.course.update({ where: { id: courseId }, data: { status: CourseStatus.ARCHIVED } });
    r = await call("GET", `/assessments/results/${s1}`, undefined, parentA.cookie);
    check("unpublished course no longer recommended", r.json.data.result.recommendedCourses.length === 0);

    // --- Read-only admin views ---
    r = await call("GET", "/admin/platform/users", undefined, admin.cookie);
    const usersJson = JSON.stringify(r.json);
    check("admin users list returns real accounts without password hashes",
      r.status === 200 && r.json.data.users.some((u: any) => u.id === parentA.user.id) && !usersJson.includes("passwordHash") && !usersJson.includes("not-a-real-hash"));
    r = await call("GET", "/admin/platform/overview", undefined, admin.cookie);
    check("admin overview returns counts", r.status === 200 && typeof r.json.data.overview.users.total === "number");
    r = await call("GET", "/admin/platform/users", undefined, parentA.cookie);
    check("parent cannot use admin APIs (403)", r.status === 403);
    r = await call("GET", "/admin/platform/enrollments");
    check("admin APIs require sign-in (401)", r.status === 401);
    r = await call("GET", "/admin/assessments/instruments", undefined, parentA.cookie);
    check("parent cannot use admin assessment APIs (403)", r.status === 403);
  } catch (e) {
    failed++;
    console.log("  FAIL unexpected error ::", (e as Error).message);
  } finally {
    if (instrumentId) {
      const where = { version: { instrumentId } };
      await prisma.assessmentPracticePlan.deleteMany({ where: { submission: where } }).catch(() => {});
      await prisma.assessmentResult.deleteMany({ where }).catch(() => {});
      await prisma.assessmentRawResponse.deleteMany({ where: { submission: where } }).catch(() => {});
      await prisma.assessmentSubmission.deleteMany({ where }).catch(() => {});
      await prisma.assessmentAuditLog.deleteMany({ where: { instrumentId } }).catch(() => {});
      await prisma.assessmentCourseMapping.deleteMany({ where }).catch(() => {});
      await prisma.assessmentItem.deleteMany({ where }).catch(() => {});
      await prisma.assessmentFactorDefinition.deleteMany({ where }).catch(() => {});
      await prisma.assessmentVersion.deleteMany({ where: { instrumentId } }).catch(() => {});
      await prisma.assessmentInstrument.delete({ where: { id: instrumentId } }).catch(() => {});
    }
    if (courseId) await prisma.course.delete({ where: { id: courseId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: userIds } } }).catch(() => {});
    server.close();
    await prisma.$disconnect();
    console.log(`\n${failed === 0 ? "ALL" : ""} ${passed} passed, ${failed} failed`);
    process.exit(failed === 0 ? 0 : 1);
  }
})();
