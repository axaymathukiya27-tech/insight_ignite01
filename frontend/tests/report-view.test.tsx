/**
 * Parenting Growth Summary: report model + rendered markup tests (synthetic data only).
 * The printed / saved PDF is the same rendered markup with print CSS applied, so the
 * "web vs PDF" checks verify that the print rules only hide navigation and controls.
 *
 * Run: npx tsx tests/report-view.test.tsx
 */
import React from "react";
import fs from "fs";
import path from "path";
import { renderToStaticMarkup } from "react-dom/server";
import type { AssessmentProgressDto, AssessmentResultDto, PracticePlanDayTemplateDto } from "@insight-ignite/shared";
import { buildReportModel, formatPrice, formatMinutes } from "../src/features/assessments/report-model";
import AssessmentReportView from "../src/features/assessments/components/AssessmentReportView";
import { ProgressComparison, AttemptHistoryTable } from "../src/features/assessments/components/AssessmentProgressPanel";
import { groupHistory } from "../src/features/assessments/components/AssessmentHistoryList";
import { isActive, navForRole, adminNav, parentNav } from "../src/config/portal-nav";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { passed++; console.log(`  PASS ${name}`); }
  else { failed++; console.log(`  FAIL ${name}${detail ? " :: " + detail : ""}`); }
}

const plan: PracticePlanDayTemplateDto[] = [1, 2, 3, 4, 5, 6, 7].map((day) => ({
  day,
  title: day === 7 ? "Reflect and Prepare to Reassess" : `Day title ${day}`,
  factorCodes: ["CONTROL"],
  factorNames: ["Psychological Control and Criticism"],
  objective: `Objective ${day}`,
  exercise: `Exercise ${day}`,
  minutes: 10,
  example: `Example ${day}`,
  reflection: `Reflection ${day}`,
}));

// A synthetic result shaped like the backend's output:
// Warmth strength, Structure developing, Autonomy growth, Control (reverse-scored) growth at 84%.
const result: AssessmentResultDto = {
  submissionId: "synthetic",
  versionNumber: 2,
  completedAt: "2026-10-23T03:00:00.000Z",
  isAnonymous: false,
  instrumentSlug: "parent-style-questionnaire",
  instrumentTitle: "Parent Style Questionnaire",
  disclaimer: "This self-assessment is an educational self-reflection tool, not a diagnostic or clinical evaluation.",
  factorScores: {
    WARMTH: { factorCode: "WARMTH", factorName: "Emotional Warmth and Responsiveness", rawScore: 23, maxScore: 25, percentage: 92, band: "Strength", direction: "HIGHER_IS_POSITIVE", interpretedPercentage: 92, classification: "STRENGTH", dimensionDescription: "How often you listen and respond.", interpretation: "You scored 92%. On this dimension a higher score is the positive result, so this falls in the \"Strength\" range." },
    STRUCTURE: { factorCode: "STRUCTURE", factorName: "Structure and Consistent Boundaries", rawScore: 15, maxScore: 25, percentage: 60, band: "Developing", direction: "HIGHER_IS_POSITIVE", interpretedPercentage: 60, classification: "STEADY", dimensionDescription: "How consistently you set limits.", interpretation: "You scored 60%." },
    AUTONOMY: { factorCode: "AUTONOMY", factorName: "Autonomy and Independence", rawScore: 10, maxScore: 25, percentage: 40, band: "Area for Growth", direction: "HIGHER_IS_POSITIVE", interpretedPercentage: 40, classification: "GROWTH_OPPORTUNITY", dimensionDescription: "How often you let your child choose.", interpretation: "You scored 40%." },
    CONTROL: { factorCode: "CONTROL", factorName: "Psychological Control and Criticism", rawScore: 21, maxScore: 25, percentage: 84, band: "Area for Growth", direction: "HIGHER_IS_CONCERN", interpretedPercentage: 36, classification: "GROWTH_OPPORTUNITY", dimensionDescription: "How often criticism or comparisons are used.", interpretation: "You scored 84%. On this dimension a lower score is the positive result." },
  },
  strengths: [
    { factorCode: "WARMTH", factorName: "Emotional Warmth and Responsiveness", title: "t", whatItMeasures: "How often you listen and respond.", description: "You often make space for feelings.", indicates: "You often make space for feelings. This is reflected in your answers: you answered \"Always\" to \"I listen when my child is upset\".", actionableHabit: "Keep a bedtime chat ritual.", percentage: 92, band: "Strength", direction: "HIGHER_IS_POSITIVE" },
  ],
  growthAreas: [
    { factorCode: "CONTROL", factorName: "Psychological Control and Criticism", title: "t", whatItMeasures: "How often criticism or comparisons are used.", description: "Criticism comes up fairly often.", indicates: "Criticism comes up fairly often. This is a reflection to learn from, not a diagnosis.", behaviorFocus: "Correcting behaviour without shame.", actions: ["Describe behaviour, not character.", "Avoid comparisons with siblings.", "Set limits without threats."], actionableHabit: "Describe behaviour, not character.", example: "Instead of 'Why are you always so lazy?', try 'The homework isn't done yet.'", smallGoal: "Catch one critical comment this week.", percentage: 84, band: "Area for Growth", direction: "HIGHER_IS_CONCERN" },
    { factorCode: "AUTONOMY", factorName: "Autonomy and Independence", title: "t", description: "Autonomy less often.", indicates: "Autonomy less often.", behaviorFocus: "Letting the child try first.", actions: ["Offer two choices.", "Wait before helping."], actionableHabit: "Offer two choices.", example: "Let your child pack their own school bag.", smallGoal: "One real choice a day.", percentage: 40, band: "Area for Growth", direction: "HIGHER_IS_POSITIVE" },
  ],
  steadyAreas: [
    { factorCode: "STRUCTURE", factorName: "Structure and Consistent Boundaries", title: "t", description: "Developing.", indicates: "Developing.", actionableHabit: "Keep a predictable bedtime routine.", percentage: 60, band: "Developing", direction: "HIGHER_IS_POSITIVE" },
  ],
  practiceRecommendations: [
    { factorCode: "CONTROL", factorName: "Psychological Control and Criticism", kind: "growth", finding: "Psychological Control and Criticism: 84%, Area for Growth", title: "Correct the behaviour, not the child", what: "Describe what happened.", when: "During homework.", how: "Pause, describe, invite.", example: "\"You shouted at your brother.\"", objective: "Keep limits clear.", planDays: [1, 2, 4] },
  ],
  practicePlan: plan,
  recommendedCourses: [],
};

console.log("1. Report model");
{
  const m = buildReportModel(result);
  check("not legacy", m.isLegacy === false);
  check("counts calculated from the result", JSON.stringify(m.counts) === JSON.stringify({ total: 4, strengths: 1, growth: 2, steady: 1 }));
  check("summary uses the real counts and names the main opportunities",
    m.summary.includes("4 parenting dimensions") && m.summary.includes("1 is a foundational strength, 2 are areas for growth and 1 is developing") &&
    m.summary.includes("1 is developing") && m.summary.includes("Psychological Control and Criticism and Autonomy and Independence"), m.summary);
  check("most useful next step = day 1 of the plan", m.nextAction === "Start Day 1 of your practice plan: Exercise 1");
  const shuffled = buildReportModel({ ...result, factorScores: Object.fromEntries(Object.entries(result.factorScores).reverse().map(([k, v], i) => [k, { ...v, orderIndex: 4 - i }])) });
  check("dimensions follow the assessment order even if storage reorders keys", shuffled.dimensions.map((d) => d.code).join() === "WARMTH,STRUCTURE,AUTONOMY,CONTROL");
  check("bars use the actual percentages", m.dimensions.map((d) => `${d.code}:${d.percentage}`).join(",") === "WARMTH:92,STRUCTURE:60,AUTONOMY:40,CONTROL:84");
  check("CONTROL tone is growth (not strength) despite 84%", m.dimensions.find((d) => d.code === "CONTROL")!.tone === "growth");
  check("breakdown has measures / indicates / practise per dimension",
    m.dimensions.every((d) => d.measures && d.indicates && d.practise));
  check("practise text is the dimension's own", m.dimensions.find((d) => d.code === "CONTROL")!.practise === "Describe behaviour, not character.");

  const other = buildReportModel({ ...result, strengths: [], growthAreas: [result.growthAreas[1]], steadyAreas: [],
    factorScores: { AUTONOMY: result.factorScores.AUTONOMY } });
  check("different result gives different counts (nothing hard-coded)", other.summary.includes("1 parenting dimension") && other.summary.includes("none is a clear strength yet") && other.counts.strengths === 0);

  const legacy = buildReportModel({
    ...result,
    factorScores: { X: { factorCode: "X", factorName: "X", rawScore: 21, maxScore: 25, percentage: 84, band: "Strengths" } },
    strengths: [], growthAreas: [], steadyAreas: [], practicePlan: [], practiceRecommendations: [],
  });
  check("legacy result flagged, tone neutral (no guessing from %)", legacy.isLegacy && legacy.dimensions[0].tone === "neutral");
  check("price shown only when recorded", formatPrice(149900, "INR")!.includes("1,499") && formatPrice(0, "INR") === null);
  check("duration formatting", formatMinutes(45) === "45 min" && formatMinutes(null) === null);
}

const progress: AssessmentProgressDto = {
  instrument: { slug: "parent-style-questionnaire", title: "Parent Style Questionnaire", description: "" },
  attempts: [
    { submissionId: "synthetic", attemptNumber: 2, completedAt: "2026-10-23T03:00:00.000Z", versionNumber: 2, status: "COMPLETED", scores: [{ factorCode: "CONTROL", factorName: "Psychological Control and Criticism", percentage: 84, band: "Area for Growth", classification: "GROWTH_OPPORTUNITY" }], comparable: true, practiceStarted: false, practiceCompletedDays: 0 },
    { submissionId: "earlier", attemptNumber: 1, completedAt: "2026-10-01T03:00:00.000Z", versionNumber: 2, status: "COMPLETED", scores: [{ factorCode: "CONTROL", factorName: "Psychological Control and Criticism", percentage: 74, band: "Developing", classification: "STEADY" }], comparable: true, practiceStarted: true, practiceCompletedDays: 7 },
  ],
  comparison: {
    available: true, comparedAttempts: 2, firstSubmissionId: "earlier", latestSubmissionId: "synthetic",
    firstCompletedAt: "2026-10-01T03:00:00.000Z", latestCompletedAt: "2026-10-23T03:00:00.000Z",
    rows: [{ factorCode: "CONTROL", factorName: "Psychological Control and Criticism", direction: "HIGHER_IS_CONCERN", earlier: 74, latest: 84, difference: 10, earlierLabel: "Developing", latestLabel: "Area for Growth", meaning: "10 percentage points higher: your responses indicate that this behaviour may be happening more often." }],
  },
};

console.log("2. Rendered report (same markup is printed / saved as PDF)");
{
  const html = renderToStaticMarkup(<AssessmentReportView result={result} progress={progress} />);
  const order = [
    "Your Parenting Growth Summary",
    "Your Growth Dimension Breakdown",
    "Your Foundational Strengths — What You Are Doing Well",
    "Your Areas for Growth — What You Can Work on Next",
    "Your Personalized Recommendations",
    "Your Seven-Day Parenting Practice Plan",
    "What to Do After Seven Days",
    "Your Progress Over Time",
    "Learning Resources That May Help You Grow",
  ].map((h) => html.indexOf(h));
  check("all nine sections present", order.every((i) => i >= 0), order.join(","));
  check("sections in the required order", order.every((v, i) => i === 0 || v > order[i - 1]));
  check("completion date and version shown", html.includes("October 23, 2026") && html.includes("Assessment version 2"));
  check("educational disclaimer preserved", html.includes("not a diagnostic or clinical evaluation"));
  check("breakdown uses natural headings", html.includes("What this measures") && html.includes("What your score indicates") && html.includes("What you can practise"));
  check("old generic headings removed", !html.includes("Why this is a strength") && !html.includes("What could benefit from attention"));
  check("CONTROL card classified GROWTH_OPPORTUNITY", /data-dimension="CONTROL" data-classification="GROWTH_OPPORTUNITY"/.test(html));
  check("CONTROL bar width = 84%", /aria-label="Psychological Control and Criticism: 84%"[^>]*><div[^>]*style="width:84%"/.test(html));
  check("CONTROL under growth, not strengths", /data-section="growth" data-dimension="CONTROL"/.test(html) && !/data-section="strength" data-dimension="CONTROL"/.test(html));
  check("strength shows the parent's own answer", html.includes("you answered &quot;Always&quot; to &quot;I listen when my child is upset&quot;"));
  check("growth shows actions, everyday example and small goal", html.includes("Set limits without threats.") && html.includes("In everyday life") && html.includes("Your small goal"));
  check("STRUCTURE in developing only", /data-section="steady" data-dimension="STRUCTURE"/.test(html) && !/data-section="growth" data-dimension="STRUCTURE"/.test(html));
  check("recommendation shows finding, what/when/how/example and plan days",
    html.includes("Based on: Psychological Control and Criticism: 84%, Area for Growth") && html.includes("When to try it") && html.includes("days 1, 2, 4"));
  check("seven plan days rendered", (html.match(/data-plan-day="/g) || []).length === 7);
  check("plan can be started by a signed-in owner", html.includes("Start my seven-day plan"));
  check("retake links to the same assessment", html.includes('href="/assessments/parent-style-questionnaire"') && html.includes("Retake Assessment"));
  check("progress: percentage-point change and direction-aware meaning",
    html.includes("74% → 84% (+10 points)") && html.includes("may be happening more often") && html.includes("lower score is the positive direction"));
  check("progress: earlier report linked", html.includes('href="/assessments/results/earlier"'));
  check("no courses: helpful empty state, no fake course cards", html.includes("We are preparing learning resources") && !html.includes("data-course="));
  check("no legacy warning on new results", !html.includes("calculated before Insight Ignite recorded"));

  const guest = renderToStaticMarkup(<AssessmentReportView result={{ ...result, isAnonymous: true }} onOpenClaimModal={() => {}} />);
  check("guest: plan visible, tracking asks to save to profile, no history section",
    (guest.match(/data-plan-day="/g) || []).length === 7 && guest.includes("Save this report to a free account") && !guest.includes("Your Progress Over Time"));

  const withCourse = renderToStaticMarkup(<AssessmentReportView result={{ ...result, recommendedCourses: [{ courseId: "c1", slug: "real-course", title: "Real Course", instructor: "I", relevanceReason: "Because.", matchingFactorCode: "AUTONOMY", priceAmount: 149900, currency: "INR", lessonCount: 2, totalDurationMin: 45, isEnrolled: true }] }} />);
  check("course card shows only catalogue facts and a real detail link",
    withCourse.includes('href="/courses/real-course"') && withCourse.includes("2 lessons · 45 min") && withCourse.includes("already enrolled"));

  const none = renderToStaticMarkup(<AssessmentReportView result={{ ...result, strengths: [] }} />);
  check("no strengths: supportive message, nothing invented", none.includes("has not identified a clear strength"));

  const legacyHtml = renderToStaticMarkup(<AssessmentReportView result={{ ...result, factorScores: { X: { factorCode: "X", factorName: "X", rawScore: 21, maxScore: 25, percentage: 84, band: "Strengths" } }, strengths: [], growthAreas: [], steadyAreas: [], practicePlan: [], practiceRecommendations: [] }} />);
  check("legacy results show the accuracy warning and no invented plan", legacyHtml.includes("calculated before Insight Ignite recorded") && legacyHtml.includes("A practice plan is not available"));
}

console.log("3. Progress views");
{
  const unavailable = renderToStaticMarkup(<ProgressComparison progress={{ ...progress, comparison: { available: false, reason: "Different version.", rows: [] } }} />);
  check("comparison unavailable shows the reason only", unavailable.includes("Different version.") && !unavailable.includes("points"));
  const table = renderToStaticMarkup(<AttemptHistoryTable progress={progress} currentSubmissionId="synthetic" />);
  check("attempt table marks the current report and plan progress", table.includes("(this report)") && table.includes("7 of 7 days"));
  const groups = groupHistory([
    { submissionId: "a", instrumentTitle: "A", instrumentSlug: "a", versionNumber: 1, completedAt: "2026-10-01T00:00:00Z" },
    { submissionId: "b", instrumentTitle: "A", instrumentSlug: "a", versionNumber: 1, completedAt: "2026-10-20T00:00:00Z" },
    { submissionId: "c", instrumentTitle: "B", instrumentSlug: "b", versionNumber: 1, completedAt: "2026-10-10T00:00:00Z" },
  ]);
  check("history grouped per assessment, latest first", groups.map((g) => `${g.slug}:${g.attempts.length}:${g.attempts[0].submissionId}`).join() === "a:2:b,b:1:c");
}

console.log("4. Portal navigation");
{
  check("parent nav has no admin links", parentNav.every((i) => !i.href.startsWith("/admin")));
  check("admin nav has no parent links", adminNav.every((i) => i.href.startsWith("/admin")));
  check("school admins only see sections they are authorised for",
    navForRole(adminNav, "SCHOOL_ADMIN").map((i) => i.href).join() === "/admin,/admin/courses");
  check("platform admins see every admin section", navForRole(adminNav, "PLATFORM_ADMIN").length === adminNav.length);
  check("active indicator: exact dashboard, nested sections",
    isActive("/learn", parentNav[0]) && !isActive("/learn/assessments", parentNav[0]) && isActive("/learn/assessments", parentNav[1]));
  const routes = parentNav.concat(adminNav).map((i) => i.href);
  const appDir = path.join(__dirname, "../src/app");
  const exists = (href: string) =>
    ["(learner)", "(admin)"].some((g) => fs.existsSync(path.join(appDir, g, href, "page.tsx")));
  check("no dead navigation items", routes.every(exists), routes.filter((r) => !exists(r)).join());
  const shell = fs.readFileSync(path.join(__dirname, "../src/components/layout/PortalShell.tsx"), "utf8");
  check("old 'Public Site →' link replaced by 'Visit website'", !shell.includes("Public Site") && shell.includes("Visit website"));
  check("portal has logout and mobile menu", shell.includes("Log out") && shell.includes("portal-mobile-nav"));
}

console.log("5. Web vs printed PDF consistency");
{
  const html = renderToStaticMarkup(<AssessmentReportView result={result} progress={progress} onOpenClaimModal={() => {}} />);
  const hiddenInPrint = [...html.matchAll(/<(\w+)[^>]*class="[^"]*print:hidden[^"]*"[^>]*>/g)].map((m) => m[0]);
  check("only controls are hidden in print",
    hiddenInPrint.every((tag) => /^<(button|a|div|label)/.test(tag)) && hiddenInPrint.every((tag) => !/report-section|report-card/.test(tag)), `${hiddenInPrint.length} hidden`);
  check("no report section carries print:hidden", !/report-section[^"]*print:hidden|print:hidden[^"]*report-section/.test(html));
  const css = fs.readFileSync(path.join(__dirname, "../src/app/globals.css"), "utf8");
  const printBlock = css.slice(css.indexOf("@media print"));
  check("print CSS hides only site header and footer", /header,\s*footer\s*{\s*display:\s*none/.test(printBlock) && !/report-section[^{]*{[^}]*display:\s*none/.test(printBlock));
  check("print CSS keeps bar colours", printBlock.includes("print-color-adjust: exact"));
  check("print CSS keeps cards whole across pages", printBlock.includes("break-inside: avoid"));
}

console.log(`\n${failed === 0 ? "ALL" : ""} ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
