import { createApp } from "../src/app";
import { Server } from "http";
import {
  prisma,
  UserRole,
  CourseStatus,
  AssessmentStatus,
  AssessmentSubmissionStatus,
} from "@insight-ignite/database";
import { hashToken } from "../src/modules/assessments/token.util";

async function runAssessmentsTestSuite() {
  console.log("======================================================");
  console.log("   INSIGHT IGNITE — PHASE 2 ASSESSMENT BACKEND TEST   ");
  console.log("======================================================");

  const app = createApp();
  const testPort = 5062;
  const baseUrl = `http://localhost:${testPort}`;

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(testPort, () => resolve(s));
  });

  const timestamp = Date.now();
  const testSlug = `parent-growth-test-${timestamp}`;
  const testParentEmail = `parent_test_${timestamp}@insightignite.org`;
  const otherParentEmail = `other_test_${timestamp}@insightignite.org`;
  const defaultPassword = "SecureTestPassword123!";

  let parentSessionCookie = "";
  let otherParentSessionCookie = "";
  let testParentId = "";
  let otherParentId = "";

  // Test entities
  let instrumentId = "";
  let versionId = "";
  let factorPresenceId = "";
  let factorClarityId = "";
  let itemPresenceId = "";
  let itemClarityId = "";
  let publishedCourseId = "";
  let draftCourseId = "";

  try {
    // -------------------------------------------------------------------------
    // Setup: Provision Test Users
    // -------------------------------------------------------------------------
    const { hashPassword } = await import("../src/modules/auth/password.util");
    const hashedPassword = await hashPassword(defaultPassword);

    const parentUser = await prisma.user.create({
      data: {
        email: testParentEmail,
        fullName: "Test Parent User",
        role: UserRole.PARENT,
        passwordHash: hashedPassword,
        emailVerified: new Date(),
        isActive: true,
      },
    });
    testParentId = parentUser.id;

    const otherUser = await prisma.user.create({
      data: {
        email: otherParentEmail,
        fullName: "Other Parent User",
        role: UserRole.PARENT,
        passwordHash: hashedPassword,
        emailVerified: new Date(),
        isActive: true,
      },
    });
    otherParentId = otherUser.id;

    // Login parent users
    const loginRes1 = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testParentEmail, password: defaultPassword }),
    });
    parentSessionCookie = loginRes1.headers.get("set-cookie")?.split(";")[0] || "";

    const loginRes2 = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: otherParentEmail, password: defaultPassword }),
    });
    otherParentSessionCookie = loginRes2.headers.get("set-cookie")?.split(";")[0] || "";

    // -------------------------------------------------------------------------
    // Section 1: Active Assessment Retrieval & Safe 404 Guarantees
    // -------------------------------------------------------------------------
    console.log("\n[1/8] Testing Active Assessment Retrieval & Safe 404 Behavior...");

    // 1.1 When no active assessment exists
    const noActiveRes = await fetch(`${baseUrl}/api/assessments/active?slug=${testSlug}`);
    const noActiveBody = await noActiveRes.json();
    if (noActiveRes.status !== 404 || noActiveBody.error?.code !== "NO_ACTIVE_ASSESSMENT") {
      throw new Error(`FAIL 1.1: Expected 404 NO_ACTIVE_ASSESSMENT, got ${noActiveRes.status}`);
    }
    console.log("  PASS 1.1: Safe error returned when no published assessment is active.");

    // 1.2 Provision test instrument, version, factors, items, and scoring configuration
    const instrument = await prisma.assessmentInstrument.create({
      data: {
        slug: testSlug,
        title: "Parent Growth Self-Assessment (Isolated Test Instrument)",
        description: "Test instrument for Phase 2 validation.",
        category: "parenting",
        status: AssessmentStatus.ACTIVE,
      },
    });
    instrumentId = instrument.id;

    const scoringConfig = {
      formula: "SUM_OF_WEIGHTS",
      bands: [
        {
          name: "Opportunity for Growth",
          minPercentage: 0,
          maxPercentage: 59,
          classification: "GROWTH_OPPORTUNITY",
          description: "An intentional focus area for relational development.",
        },
        {
          name: "Steady Alignment",
          minPercentage: 60,
          maxPercentage: 79,
          classification: "STEADY",
          description: "Consistent and grounded practice.",
        },
        {
          name: "Foundational Strength",
          minPercentage: 80,
          maxPercentage: 100,
          classification: "STRENGTH",
          description: "A deeply integrated relational anchor.",
        },
      ],
      strengthsThresholdPct: 80,
      growthThresholdPct: 59,
      guidanceTemplates: {
        TEST_PRESENCE: {
          strengthTitle: "Presence Anchor",
          strengthHabit: "Maintain unhurried stillness before responding.",
          growthTitle: "Cultivating Grounded Presence",
          growthHabit: "Take a conscious breath when tension arises.",
        },
        TEST_CLARITY: {
          strengthTitle: "Clarity & Predictability",
          strengthHabit: "Set limits with warmth and firm kindness.",
          growthTitle: "Deepening Clarity",
          growthHabit: "Communicate boundaries without shame or irritation.",
        },
      },
    };

    const version = await prisma.assessmentVersion.create({
      data: {
        instrumentId: instrument.id,
        versionNumber: 1,
        status: AssessmentStatus.ACTIVE,
        scoringConfig,
        disclaimerText: "Educational self-reflection tool, not a clinical evaluation.",
        instructionsText: "Select the response that best describes your experience.",
        publishedAt: new Date(),
        approvedBy: "Test Assessor",
        approvedAt: new Date(),
      },
    });
    versionId = version.id;

    const factorPresence = await prisma.assessmentFactorDefinition.create({
      data: {
        versionId: version.id,
        code: "TEST_PRESENCE",
        name: "Test Factor Presence",
        tagline: "Grounded unhurried awareness",
        orderIndex: 1,
      },
    });
    factorPresenceId = factorPresence.id;

    const factorClarity = await prisma.assessmentFactorDefinition.create({
      data: {
        versionId: version.id,
        code: "TEST_CLARITY",
        name: "Test Factor Clarity",
        tagline: "Kind, predictable limits",
        orderIndex: 2,
      },
    });
    factorClarityId = factorClarity.id;

    const itemPresence = await prisma.assessmentItem.create({
      data: {
        versionId: version.id,
        factorId: factorPresence.id,
        itemKey: "pres_1",
        orderIndex: 1,
        prompt: "When my child is distressed, I can pause before reacting.",
        responseType: "SINGLE_CHOICE",
        options: [
          { id: "opt_rarely", label: "Rarely", orderIndex: 1, value: 1 },
          { id: "opt_sometimes", label: "Sometimes", orderIndex: 2, value: 2 },
          { id: "opt_often", label: "Often", orderIndex: 3, value: 3 },
          { id: "opt_almost_always", label: "Almost Always", orderIndex: 4, value: 4 },
        ],
        isRequired: true,
      },
    });
    itemPresenceId = itemPresence.id;

    const itemClarity = await prisma.assessmentItem.create({
      data: {
        versionId: version.id,
        factorId: factorClarity.id,
        itemKey: "clar_1",
        orderIndex: 2,
        prompt: "I can set household boundaries without shouting or shame.",
        responseType: "SINGLE_CHOICE",
        options: [
          { id: "opt_c_rarely", label: "Rarely", orderIndex: 1, value: 1 },
          { id: "opt_c_sometimes", label: "Sometimes", orderIndex: 2, value: 2 },
          { id: "opt_c_often", label: "Often", orderIndex: 3, value: 3 },
          { id: "opt_c_almost_always", label: "Almost Always", orderIndex: 4, value: 4 },
        ],
        isRequired: true,
      },
    });
    itemClarityId = itemClarity.id;

    // 1.3 Active retrieval returns public DTO without internal scoring weights
    const activeRes = await fetch(`${baseUrl}/api/assessments/active?slug=${testSlug}`);
    const activeBody = await activeRes.json();
    if (activeRes.status !== 200 || !activeBody.success || !activeBody.data?.instrument) {
      throw new Error(`FAIL 1.3: Active instrument retrieval failed: ${JSON.stringify(activeBody)}`);
    }

    const fetchedItems = activeBody.data.instrument.items;
    if (fetchedItems.length !== 2) {
      throw new Error(`FAIL 1.3: Expected 2 items, got ${fetchedItems.length}`);
    }

    // Verify raw weights are stripped
    const fetchedOptions = fetchedItems[0].options;
    if (fetchedOptions[0].value !== undefined) {
      throw new Error("FAIL 1.3: Security vulnerability: Option scoring value leaked in public DTO!");
    }
    if (activeBody.data.instrument.scoringConfig !== undefined) {
      throw new Error("FAIL 1.3: Security vulnerability: Scoring configuration leaked in public DTO!");
    }
    console.log("  PASS 1.2: Active published assessment retrieved successfully.");
    console.log("  PASS 1.3: Internal scoring formulas and option values are strictly stripped from public DTOs.");

    // -------------------------------------------------------------------------
    // Section 2: Consent and Input Validation
    // -------------------------------------------------------------------------
    console.log("\n[2/8] Testing Consent Enforcement & Input Validation...");

    // 2.1 Missing consent rejected
    const noConsentRes = await fetch(`${baseUrl}/api/assessments/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        versionId,
        consentNoticeVersion: "notice_2026_v1",
        // consentGiven omitted
        answers: [{ itemId: itemPresenceId, selectedOptionId: "opt_almost_always" }],
      }),
    });
    if (noConsentRes.status !== 400) {
      throw new Error(`FAIL 2.1: Expected 400 when consent is missing, got ${noConsentRes.status}`);
    }
    console.log("  PASS 2.1: Missing consent explicitly rejected with 400 VALIDATION_ERROR.");

    // 2.2 False consent rejected
    const falseConsentRes = await fetch(`${baseUrl}/api/assessments/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        versionId,
        consentGiven: false,
        consentNoticeVersion: "notice_2026_v1",
        answers: [{ itemId: itemPresenceId, selectedOptionId: "opt_almost_always" }],
      }),
    });
    if (falseConsentRes.status !== 400) {
      throw new Error(`FAIL 2.2: Expected 400 when consent is false, got ${falseConsentRes.status}`);
    }
    console.log("  PASS 2.2: False consent rejected with 400 VALIDATION_ERROR.");

    // 2.3 Invalid option ID rejected
    const invalidOptRes = await fetch(`${baseUrl}/api/assessments/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        versionId,
        consentGiven: true,
        consentNoticeVersion: "notice_2026_v1",
        answers: [
          { itemId: itemPresenceId, selectedOptionId: "non_existent_option_123" },
          { itemId: itemClarityId, selectedOptionId: "opt_c_almost_always" },
        ],
      }),
    });
    const invalidOptBody = await invalidOptRes.json();
    if (invalidOptRes.status !== 400 || invalidOptBody.error?.code !== "INVALID_ANSWER_OPTION") {
      throw new Error(`FAIL 2.3: Expected 400 INVALID_ANSWER_OPTION, got ${invalidOptRes.status}: ${JSON.stringify(invalidOptBody)}`);
    }
    console.log("  PASS 2.3: Non-existent answer option ID rejected safely.");

    // 2.4 Duplicate answer rejected
    const dupRes = await fetch(`${baseUrl}/api/assessments/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        versionId,
        consentGiven: true,
        consentNoticeVersion: "notice_2026_v1",
        answers: [
          { itemId: itemPresenceId, selectedOptionId: "opt_often" },
          { itemId: itemPresenceId, selectedOptionId: "opt_almost_always" },
          { itemId: itemClarityId, selectedOptionId: "opt_c_almost_always" },
        ],
      }),
    });
    const dupBody = await dupRes.json();
    if (dupRes.status !== 400 || dupBody.error?.code !== "DUPLICATE_ANSWER") {
      throw new Error(`FAIL 2.4: Expected 400 DUPLICATE_ANSWER, got ${dupRes.status}`);
    }
    console.log("  PASS 2.4: Duplicate answer for same item rejected.");

    // -------------------------------------------------------------------------
    // Section 3: Scoring Engine Safeguards
    // -------------------------------------------------------------------------
    console.log("\n[3/8] Testing Versioned Server-Side Scoring Engine...");

    // 3.1 Version with null/empty scoringConfig rejected without falling back to mock scoring
    const unconfiguredVersion = await prisma.assessmentVersion.create({
      data: {
        instrumentId,
        versionNumber: 99,
        status: AssessmentStatus.ACTIVE,
        scoringConfig: PrismaUndefined(),
      },
    });

    const unconfiguredRes = await fetch(`${baseUrl}/api/assessments/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        versionId: unconfiguredVersion.id,
        consentGiven: true,
        consentNoticeVersion: "notice_2026_v1",
        answers: [{ itemId: itemPresenceId, selectedOptionId: "opt_almost_always" }],
      }),
    });
    const unconfBody = await unconfiguredRes.json();
    if (unconfiguredRes.status !== 400 || unconfBody.error?.code !== "SCORING_CONFIG_INVALID") {
      throw new Error(`FAIL 3.1: Expected 400 SCORING_CONFIG_INVALID, got ${unconfiguredRes.status}`);
    }
    console.log("  PASS 3.1: Version without approved scoring configuration halts execution safely (no mock fallback).");

    // Clean up temporary unconfigured version
    await prisma.assessmentVersion.delete({ where: { id: unconfiguredVersion.id } });

    // -------------------------------------------------------------------------
    // Section 4: Anonymous Assessment Submission & Secure Cookie Generation
    // -------------------------------------------------------------------------
    console.log("\n[4/8] Testing Anonymous Guest Submission & Credential Protection...");

    const guestSubmitRes = await fetch(`${baseUrl}/api/assessments/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        versionId,
        consentGiven: true,
        consentNoticeVersion: "notice_2026_v1",
        answers: [
          { itemId: itemPresenceId, selectedOptionId: "opt_almost_always" }, // 4 / 4 = 100% (Strength)
          { itemId: itemClarityId, selectedOptionId: "opt_c_rarely" },        // 1 / 4 = 25% (Growth Opportunity)
        ],
      }),
    });

    const guestBody = await guestSubmitRes.json();
    if (guestSubmitRes.status !== 201 || !guestBody.success || !guestBody.data?.result) {
      throw new Error(`FAIL 4.1: Guest submission failed: ${JSON.stringify(guestBody)}`);
    }

    const guestSubmissionId = guestBody.data.result.submissionId;
    const issuedClaimToken = guestBody.data.claimToken;

    if (!issuedClaimToken) {
      throw new Error("FAIL 4.1: Missing single-use claimToken in guest response.");
    }

    // Inspect HTTP-only cookie header
    const setCookieHeaders = guestSubmitRes.headers.get("set-cookie") || "";
    if (!setCookieHeaders.includes("insight_assessment_key") || !setCookieHeaders.includes("HttpOnly")) {
      throw new Error(`FAIL 4.1: Missing HTTP-only insight_assessment_key cookie: ${setCookieHeaders}`);
    }

    const guestAccessKeyCookie = setCookieHeaders.split(";")[0];

    // Verify DB integrity: check that raw tokens are NOT in DB
    const dbSub = await prisma.assessmentSubmission.findUnique({
      where: { id: guestSubmissionId },
    });

    if (!dbSub || !dbSub.accessKeyHash || !dbSub.claimTokenHash) {
      throw new Error("FAIL 4.2: Missing hashed credentials in database record.");
    }

    if (dbSub.accessKeyHash.length !== 64 || dbSub.claimTokenHash.length !== 64) {
      throw new Error("FAIL 4.2: Expected SHA-256 64-char hex digest in database.");
    }

    // Confirm raw claimToken is NOT stored directly
    if (dbSub.claimTokenHash === issuedClaimToken) {
      throw new Error("FAIL 4.2: Security failure: Raw claim token was saved in database instead of SHA-256 hash!");
    }

    // Verify score calculations in result
    const resultScores = guestBody.data.result.factorScores;
    if (resultScores.TEST_PRESENCE.percentage !== 100 || resultScores.TEST_PRESENCE.band !== "Foundational Strength") {
      throw new Error(`FAIL 4.3: Expected Presence 100% Foundational Strength, got: ${JSON.stringify(resultScores.TEST_PRESENCE)}`);
    }
    if (resultScores.TEST_CLARITY.percentage !== 25 || resultScores.TEST_CLARITY.band !== "Opportunity for Growth") {
      throw new Error(`FAIL 4.3: Expected Clarity 25% Opportunity for Growth, got: ${JSON.stringify(resultScores.TEST_CLARITY)}`);
    }

    console.log("  PASS 4.1: Guest submission computed server-side and set secure HTTP-only cookie.");
    console.log("  PASS 4.2: Database stores only SHA-256 credential hashes (never raw tokens).");
    console.log("  PASS 4.3: Factor scores accurately reflect approved formulas (100% Strength, 25% Growth).");

    // -------------------------------------------------------------------------
    // Section 5: Authorization Isolation & IDOR Protection
    // -------------------------------------------------------------------------
    console.log("\n[5/8] Testing Authorization Isolation & IDOR Protection...");

    // 5.1 Retrieve with valid cookie succeeds
    const authedGuestRes = await fetch(`${baseUrl}/api/assessments/results/${guestSubmissionId}`, {
      headers: { Cookie: guestAccessKeyCookie },
    });
    const authedGuestBody = await authedGuestRes.json();
    if (authedGuestRes.status !== 200 || !authedGuestBody.success) {
      throw new Error(`FAIL 5.1: Failed to view result with valid cookie: ${JSON.stringify(authedGuestBody)}`);
    }
    console.log("  PASS 5.1: Guest retrieved result successfully using HTTP-only cookie.");

    // 5.2 Retrieve without cookie or credential fails (403)
    const unauthedRes = await fetch(`${baseUrl}/api/assessments/results/${guestSubmissionId}`);
    if (unauthedRes.status !== 403) {
      throw new Error(`FAIL 5.2: Expected 403 for uncredentialed result access, got ${unauthedRes.status}`);
    }
    console.log("  PASS 5.2: Uncredentialed request rejected with 403 UNAUTHORIZED.");

    // 5.3 Retrieve with invalid/tampered key fails
    const tamperedRes = await fetch(`${baseUrl}/api/assessments/results/${guestSubmissionId}`, {
      headers: { Cookie: "insight_assessment_key=bad_tampered_key_value_12345" },
    });
    if (tamperedRes.status !== 403) {
      throw new Error(`FAIL 5.3: Expected 403 for forged access key, got ${tamperedRes.status}`);
    }
    console.log("  PASS 5.3: Forged credential access rejected with 403 FORBIDDEN.");

    // 5.4 Other user cannot view another parent's authenticated result
    const parentAuthSubmit = await fetch(`${baseUrl}/api/assessments/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: parentSessionCookie,
      },
      body: JSON.stringify({
        versionId,
        consentGiven: true,
        consentNoticeVersion: "notice_2026_v1",
        answers: [
          { itemId: itemPresenceId, selectedOptionId: "opt_often" },
          { itemId: itemClarityId, selectedOptionId: "opt_c_often" },
        ],
      }),
    });
    const parentSubmitBody = await parentAuthSubmit.json();
    const parentSubmissionId = parentSubmitBody.data.result.submissionId;

    // Attempt access with other parent's session cookie
    const crossUserRes = await fetch(`${baseUrl}/api/assessments/results/${parentSubmissionId}`, {
      headers: { Cookie: otherParentSessionCookie },
    });
    if (crossUserRes.status !== 403) {
      throw new Error(`FAIL 5.4: IDOR vulnerability! Expected 403 on cross-user access, got ${crossUserRes.status}`);
    }
    console.log("  PASS 5.4: IDOR test passed: Parent cannot access another parent's assessment report.");

    // -------------------------------------------------------------------------
    // Section 6: Course Recommendation Filtering
    // -------------------------------------------------------------------------
    console.log("\n[6/8] Testing Published Course Recommendation Filtering...");

    // Create 1 PUBLISHED course and 1 DRAFT course mapped to Clarity (growth factor)
    const pubCourse = await prisma.course.create({
      data: {
        slug: `pub-course-${timestamp}`,
        title: "Published Conscious Clarity Course",
        description: "Official published masterclass.",
        status: CourseStatus.PUBLISHED,
      },
    });
    publishedCourseId = pubCourse.id;

    const draftCourse = await prisma.course.create({
      data: {
        slug: `draft-course-${timestamp}`,
        title: "Draft Unapproved Clarity Course",
        description: "Draft course that must never be recommended.",
        status: CourseStatus.DRAFT,
      },
    });
    draftCourseId = draftCourse.id;

    // Map both to factorClarity
    await prisma.assessmentCourseMapping.create({
      data: {
        versionId,
        factorId: factorClarityId,
        courseId: pubCourse.id,
        displayOrder: 1,
        customGuidance: "Focus on establishing calm, clear household limits.",
      },
    });

    await prisma.assessmentCourseMapping.create({
      data: {
        versionId,
        factorId: factorClarityId,
        courseId: draftCourse.id,
        displayOrder: 2,
        customGuidance: "Draft guidance.",
      },
    });

    // Submit assessment where clarity is a growth area
    const recSubmitRes = await fetch(`${baseUrl}/api/assessments/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        versionId,
        consentGiven: true,
        consentNoticeVersion: "notice_2026_v1",
        answers: [
          { itemId: itemPresenceId, selectedOptionId: "opt_almost_always" },
          { itemId: itemClarityId, selectedOptionId: "opt_c_rarely" }, // Trigger clarity growth
        ],
      }),
    });
    const recBody = await recSubmitRes.json();
    const recommendedCourses = recBody.data.result.recommendedCourses;

    // Verify recommendations
    const hasPublished = recommendedCourses.some((c: { courseId: string }) => c.courseId === pubCourse.id);
    const hasDraft = recommendedCourses.some((c: { courseId: string }) => c.courseId === draftCourse.id);

    if (!hasPublished) {
      throw new Error("FAIL 6.1: Published mapped course was not recommended.");
    }
    if (hasDraft) {
      throw new Error("FAIL 6.2: Security failure! Draft course was leaked in recommendations!");
    }
    console.log("  PASS 6.1: Approved published course accurately recommended based on growth factor.");
    console.log("  PASS 6.2: Draft and unpublished courses are strictly filtered out of recommendations.");

    // -------------------------------------------------------------------------
    // Section 7: Single-Use Account Claiming & Concurrency Safeguard
    // -------------------------------------------------------------------------
    console.log("\n[7/8] Testing Single-Use Account Claiming & Concurrency...");

    // 7.1 Unauthenticated claim fails (401)
    const unauthedClaim = await fetch(`${baseUrl}/api/assessments/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimToken: issuedClaimToken }),
    });
    if (unauthedClaim.status !== 401) {
      throw new Error(`FAIL 7.1: Expected 401 for unauthenticated claim, got ${unauthedClaim.status}`);
    }
    console.log("  PASS 7.1: Unauthenticated claim attempt rejected with 401.");

    // 7.2 Authenticated claim succeeds
    const authedClaim = await fetch(`${baseUrl}/api/assessments/claim`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: parentSessionCookie,
      },
      body: JSON.stringify({ claimToken: issuedClaimToken }),
    });
    const claimBody = await authedClaim.json();
    if (authedClaim.status !== 200 || !claimBody.success) {
      throw new Error(`FAIL 7.2: Claim failed: ${JSON.stringify(claimBody)}`);
    }

    // Verify DB update
    const claimedDbSub = await prisma.assessmentSubmission.findUnique({
      where: { id: guestSubmissionId },
    });
    if (!claimedDbSub || claimedDbSub.userId !== testParentId || claimedDbSub.status !== AssessmentSubmissionStatus.CLAIMED) {
      throw new Error(`FAIL 7.2: Submission was not updated to CLAIMED with userId ${testParentId}`);
    }
    if (claimedDbSub.claimTokenHash !== null) {
      throw new Error("FAIL 7.2: Claim token was not nullified in database upon claim!");
    }
    console.log("  PASS 7.2: Anonymous assessment successfully and atomically claimed into user profile.");

    // 7.3 Token replay rejection: claiming again with the same token fails (400)
    const replayClaim = await fetch(`${baseUrl}/api/assessments/claim`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: parentSessionCookie,
      },
      body: JSON.stringify({ claimToken: issuedClaimToken }),
    });
    const replayBody = await replayClaim.json();
    if (replayClaim.status !== 400 || replayBody.error?.code !== "INVALID_CLAIM_TOKEN") {
      throw new Error(`FAIL 7.3: Expected 400 INVALID_CLAIM_TOKEN on token replay, got ${replayClaim.status}`);
    }
    console.log("  PASS 7.3: Single-use claim token replay rejected with 400 INVALID_CLAIM_TOKEN.");

    // 7.4 Concurrency test: Create another guest submission and attempt parallel claims
    const parallelGuestSubmit = await fetch(`${baseUrl}/api/assessments/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        versionId,
        consentGiven: true,
        consentNoticeVersion: "notice_2026_v1",
        answers: [
          { itemId: itemPresenceId, selectedOptionId: "opt_often" },
          { itemId: itemClarityId, selectedOptionId: "opt_c_often" },
        ],
      }),
    });
    const parallelBody = await parallelGuestSubmit.json();
    const parallelClaimToken = parallelBody.data.claimToken;

    // Send 2 parallel claims simultaneously
    const [claimA, claimB] = await Promise.all([
      fetch(`${baseUrl}/api/assessments/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: parentSessionCookie },
        body: JSON.stringify({ claimToken: parallelClaimToken }),
      }),
      fetch(`${baseUrl}/api/assessments/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: otherParentSessionCookie },
        body: JSON.stringify({ claimToken: parallelClaimToken }),
      }),
    ]);

    const statuses = [claimA.status, claimB.status];
    const successes = statuses.filter((s) => s === 200).length;
    const failures = statuses.filter((s) => s === 400).length;

    if (successes !== 1 || failures !== 1) {
      throw new Error(`FAIL 7.4: Race condition detected! Expected exactly 1 success (200) and 1 failure (400), got: ${statuses.join(", ")}`);
    }
    console.log("  PASS 7.4: Atomic concurrency test passed: Race condition prevented, exactly one claim succeeded.");

    // -------------------------------------------------------------------------
    // Section 8: Session Expiration Safeguard
    // -------------------------------------------------------------------------
    console.log("\n[8/8] Testing Session Expiration Handling...");

    // Create an expired anonymous submission in DB
    const expiredToken = "expired_raw_token_xyz_123";
    const expiredSub = await prisma.assessmentSubmission.create({
      data: {
        versionId,
        accessKeyHash: hashToken("expired_access_key_123"),
        claimTokenHash: hashToken(expiredToken),
        status: AssessmentSubmissionStatus.SUBMITTED,
        expiresAt: new Date(Date.now() - 1000 * 60), // Expired 1 minute ago
        consentGiven: true,
        consentNoticeVersion: "notice_2026_v1",
      },
    });

    await prisma.assessmentResult.create({
      data: {
        submissionId: expiredSub.id,
        versionId,
        factorScores: {},
        overallScore: 0,
        strengths: [],
        growthAreas: [],
      },
    });

    // 8.1 Retrieval of expired session fails (410 SESSION_EXPIRED)
    const expiredGetRes = await fetch(`${baseUrl}/api/assessments/results/${expiredSub.id}`, {
      headers: { Cookie: "insight_assessment_key=expired_access_key_123" },
    });
    const expiredGetBody = await expiredGetRes.json();
    if (expiredGetRes.status !== 410 || expiredGetBody.error?.code !== "SESSION_EXPIRED") {
      throw new Error(`FAIL 8.1: Expected 410 SESSION_EXPIRED, got ${expiredGetRes.status}`);
    }
    console.log("  PASS 8.1: Expired anonymous session rejected with 410 SESSION_EXPIRED on retrieval.");

    // 8.2 Claiming expired session fails (410 SESSION_EXPIRED)
    const expiredClaimRes = await fetch(`${baseUrl}/api/assessments/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: parentSessionCookie },
      body: JSON.stringify({ claimToken: expiredToken }),
    });
    const expiredClaimBody = await expiredClaimRes.json();
    if (expiredClaimRes.status !== 410 || expiredClaimBody.error?.code !== "SESSION_EXPIRED") {
      throw new Error(`FAIL 8.2: Expected 410 SESSION_EXPIRED on claiming expired token, got ${expiredClaimRes.status}`);
    }
    console.log("  PASS 8.2: Expired session cannot be claimed (410 SESSION_EXPIRED).");

    // -------------------------------------------------------------------------
    // Section 9: Authenticated Participant History Isolation
    // -------------------------------------------------------------------------
    console.log("\n[9/9] Testing Authenticated Participant History Isolation...");

    // 9.1 Unauthenticated access rejected with 401
    const unauthedHistoryRes = await fetch(`${baseUrl}/api/assessments/my-history`);
    if (unauthedHistoryRes.status !== 401) {
      throw new Error(`FAIL 9.1: Expected 401 for unauthenticated history request, got ${unauthedHistoryRes.status}`);
    }
    console.log("  PASS 9.1: Unauthenticated history request rejected with 401.");

    // 9.2 Authenticated parent receives their claimed submission
    const parentHistoryRes = await fetch(`${baseUrl}/api/assessments/my-history`, {
      headers: { Cookie: parentSessionCookie },
    });
    const parentHistoryBody = await parentHistoryRes.json();
    if (parentHistoryRes.status !== 200 || !parentHistoryBody.success || !Array.isArray(parentHistoryBody.data?.history)) {
      throw new Error(`FAIL 9.2: Failed to retrieve user history: ${JSON.stringify(parentHistoryBody)}`);
    }

    const historyItems = parentHistoryBody.data.history;
    const expectedParentCount = await prisma.assessmentSubmission.count({
      where: { userId: testParentId, status: { in: [AssessmentSubmissionStatus.SUBMITTED, AssessmentSubmissionStatus.CLAIMED] } },
    });

    if (historyItems.length !== expectedParentCount) {
      throw new Error(`FAIL 9.2: Expected ${expectedParentCount} history items for test parent, found ${historyItems.length}`);
    }
    console.log(`  PASS 9.2: Authenticated user retrieved history matching their claimed submissions (count: ${historyItems.length}).`);

    // 9.3 Other parent history is isolated
    const expectedOtherCount = await prisma.assessmentSubmission.count({
      where: { userId: otherParentId, status: { in: [AssessmentSubmissionStatus.SUBMITTED, AssessmentSubmissionStatus.CLAIMED] } },
    });

    const otherParentHistoryRes = await fetch(`${baseUrl}/api/assessments/my-history`, {
      headers: { Cookie: otherParentSessionCookie },
    });
    const otherParentHistoryBody = await otherParentHistoryRes.json();
    if (otherParentHistoryRes.status !== 200 || otherParentHistoryBody.data?.history?.length !== expectedOtherCount) {
      throw new Error(`FAIL 9.3: Expected ${expectedOtherCount} history items for other parent, found ${otherParentHistoryBody.data?.history?.length}`);
    }
    console.log(`  PASS 9.3: History isolation verified: Other parent sees only their own submissions (count: ${expectedOtherCount}).`);

    console.log("\n======================================================");
    console.log("   ALL 21 PHASE 2 ASSESSMENT BACKEND TESTS PASSED!    ");
    console.log("======================================================");
  } finally {
    // -------------------------------------------------------------------------
    // Teardown: Clean up isolated test data respecting foreign key RESTRICT constraints
    // -------------------------------------------------------------------------
    try {
      if (versionId) {
        await prisma.assessmentSubmission.deleteMany({ where: { versionId } }).catch(() => {});
        await prisma.assessmentCourseMapping.deleteMany({ where: { versionId } }).catch(() => {});
        await prisma.assessmentItem.deleteMany({ where: { versionId } }).catch(() => {});
        await prisma.assessmentFactorDefinition.deleteMany({ where: { versionId } }).catch(() => {});
      }
      if (instrumentId) {
        await prisma.assessmentVersion.deleteMany({ where: { instrumentId } }).catch(() => {});
        await prisma.assessmentInstrument.delete({ where: { id: instrumentId } }).catch(() => {});
      }
      if (publishedCourseId) await prisma.course.delete({ where: { id: publishedCourseId } }).catch(() => {});
      if (draftCourseId) await prisma.course.delete({ where: { id: draftCourseId } }).catch(() => {});
      if (testParentId) await prisma.user.delete({ where: { id: testParentId } }).catch(() => {});
      if (otherParentId) await prisma.user.delete({ where: { id: otherParentId } }).catch(() => {});
    } catch {
      // Cleanup best effort
    }

    server.close();
  }
}

// Helper for Prisma JSON undefined in test
function PrismaUndefined() {
  return undefined;
}

if (require.main === module) {
  runAssessmentsTestSuite().catch((err) => {
    console.error("ASSESSMENT TEST SUITE FAILED:", err);
    process.exit(1);
  });
}

export { runAssessmentsTestSuite };
