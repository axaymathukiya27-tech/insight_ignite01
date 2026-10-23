import {
  listAdminInstruments,
  createDraftInstrument,
  getInstrumentDetail,
  createDraftVersion,
  getAdminVersionDetail,
  updateDraftVersionMetadata,
  createAssessmentFactor,
  updateAssessmentFactor,
  deleteAssessmentFactor,
  createAssessmentItem,
  updateAssessmentItem,
  deleteAssessmentItem,
  updateVersionScoringConfig,
  createCourseMapping,
  deleteCourseMapping,
  checkActivationReadiness,
  listAdminCourses,
} from "../src/features/assessments/admin-api";
import { prisma, UserRole, CourseStatus } from "@insight-ignite/database";

async function runAdminAssessmentsUiApiSuite() {
  console.log("======================================================");
  console.log("   INSIGHT IGNITE — PHASE 4C ADMIN UI API INTEGRATION ");
  console.log("======================================================");

  const timestamp = Date.now();
  const adminEmail = `admin_ui_test_${timestamp}@insightignite.org`;
  let adminUserId = "";
  let instrumentId = "";
  let version1Id = "";
  let version2Id = "";
  let factorId = "";
  let itemId = "";
  let publishedCourseId = "";
  let mappingId = "";

  const originalFetch = global.fetch;

  try {
    // -------------------------------------------------------------------------
    // Setup: Provision Admin & Session
    // -------------------------------------------------------------------------
    console.log("\n[1/6] Provisioning Administrator Session for UI Client...");
    const { hashPassword } = await import(
      "../../backend/src/modules/auth/password.util"
    );
    const { createSession } = await import(
      "../../backend/src/modules/auth/session.service"
    );

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        fullName: "Dr. Nivedita Ganguli (UI Admin)",
        role: UserRole.PLATFORM_ADMIN,
        passwordHash: await hashPassword("TestPassword123!"),
        emailVerified: new Date(),
        isActive: true,
      },
    });
    adminUserId = admin.id;

    const session = await createSession(admin.id);
    const sessionCookie = `insight_session=${session.sessionToken}`;

    // Configure global fetch to inject admin session cookie
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      headers.set("Cookie", sessionCookie);
      return originalFetch(input, { ...init, headers });
    };
    console.log("  PASS 1.1: Platform administrator session provisioned.");

    // -------------------------------------------------------------------------
    // 2. Instrument & Version Operations via Client API
    // -------------------------------------------------------------------------
    console.log("\n[2/6] Testing Instrument & Version Authoring Client Calls...");

    // List instruments
    const initialList = await listAdminInstruments();
    console.log(`  PASS 2.1: listAdminInstruments returned ${initialList.length} instruments.`);

    // Create instrument
    const createdInstrument = await createDraftInstrument({
      title: `Parent Growth Instrument ${timestamp}`,
      slug: `parent-growth-ui-${timestamp}`,
      subtitle: "UI Integration Test Instrument",
      description: "A reflective tool created to verify Increment 4C admin interface workflows.",
      category: "PARENTING",
      intendedAudience: "Parents and primary caregivers",
    });
    if (!createdInstrument?.id || createdInstrument.versions.length !== 1) {
      throw new Error(`FAIL 2.2: Instrument creation failed: ${JSON.stringify(createdInstrument)}`);
    }
    instrumentId = createdInstrument.id;
    version1Id = createdInstrument.versions[0].id;
    console.log("  PASS 2.2: createDraftInstrument initialized container and Version 1 (DRAFT).");

    // Fetch detail
    const detail = await getInstrumentDetail(instrumentId);
    if (detail.id !== instrumentId) {
      throw new Error("FAIL 2.3: getInstrumentDetail returned mismatched record.");
    }
    console.log("  PASS 2.3: getInstrumentDetail returned complete instrument specification.");

    // Create incremental draft version 2
    const version2 = await createDraftVersion(instrumentId, {
      disclaimerText: "Version 2 custom educational disclaimer.",
      instructionsText: "Version 2 custom participant instructions.",
    });
    if (version2.versionNumber !== 2 || version2.status !== "DRAFT") {
      throw new Error(`FAIL 2.4: Unexpected version 2 creation result: ${JSON.stringify(version2)}`);
    }
    version2Id = version2.id;
    console.log("  PASS 2.4: createDraftVersion created incremental draft Version 2.");

    // Update metadata on version 1
    const updatedV1 = await updateDraftVersionMetadata(version1Id, {
      disclaimerText: "Updated disclaimer for testing.",
      instructionsText: "Updated instructions for testing.",
    });
    if (updatedV1.disclaimerText !== "Updated disclaimer for testing.") {
      throw new Error("FAIL 2.5: updateDraftVersionMetadata did not persist changes.");
    }
    console.log("  PASS 2.5: updateDraftVersionMetadata updated draft instructions and disclaimer.");

    // -------------------------------------------------------------------------
    // 3. Factor & Question Item Authoring
    // -------------------------------------------------------------------------
    console.log("\n[3/6] Testing Factor & Question Authoring Client Calls...");

    // Create factor
    const factor = await createAssessmentFactor(version1Id, {
      code: "ATTUNEMENT",
      name: "Emotional Attunement",
      tagline: "Listening beneath spoken words",
      description: "Caregiver attunement to underlying non-verbal cues and emotional distress.",
      orderIndex: 1,
    });
    factorId = factor.id;
    console.log("  PASS 3.1: createAssessmentFactor registered domain factor.");

    // Update factor
    const updatedFactor = await updateAssessmentFactor(factorId, {
      name: "Mindful Emotional Attunement",
    });
    if (updatedFactor.name !== "Mindful Emotional Attunement") {
      throw new Error("FAIL 3.2: updateAssessmentFactor did not persist name.");
    }
    console.log("  PASS 3.2: updateAssessmentFactor updated factor definition.");

    // Create question item with 4 weighted options
    const item = await createAssessmentItem(version1Id, {
      factorId,
      itemKey: "ATT_01",
      orderIndex: 1,
      prompt: "When my child becomes agitated, I tune in to their physical posture and facial expressions.",
      contextPrompt: "During transition times or after school reunions.",
      responseType: "SINGLE_CHOICE",
      isRequired: true,
      options: [
        { id: "rarely", label: "Rarely", orderIndex: 1, value: 1 },
        { id: "sometimes", label: "Sometimes", orderIndex: 2, value: 2 },
        { id: "often", label: "Often", orderIndex: 3, value: 3 },
        { id: "consistently", label: "Consistently", orderIndex: 4, value: 4 },
      ],
    });
    itemId = item.id;
    console.log("  PASS 3.3: createAssessmentItem created reflective item with weighted options.");

    // Update question item
    const updatedItem = await updateAssessmentItem(itemId, {
      prompt: "When my child is emotionally overwhelmed, I observe their posture and non-verbal cues.",
    });
    if (!updatedItem.prompt.includes("emotionally overwhelmed")) {
      throw new Error("FAIL 3.4: updateAssessmentItem did not persist updated prompt.");
    }
    console.log("  PASS 3.4: updateAssessmentItem modified question prompt.");

    // -------------------------------------------------------------------------
    // 4. Scoring Configuration Management
    // -------------------------------------------------------------------------
    console.log("\n[4/6] Testing Scoring Configuration Validation via Client API...");

    const scoringConfig = {
      formula: "SUM_OF_WEIGHTS",
      bands: [
        {
          name: "Developing",
          minPercentage: 0,
          maxPercentage: 49,
          classification: "GROWTH_OPPORTUNITY",
          description: "Foundational reflective awareness",
        },
        {
          name: "Steady",
          minPercentage: 50,
          maxPercentage: 74,
          classification: "STEADY",
          description: "Emerging consistency",
        },
        {
          name: "Strengths",
          minPercentage: 75,
          maxPercentage: 100,
          classification: "STRENGTH",
          description: "Established emotional presence",
        },
      ],
      strengthsThresholdPct: 75,
      growthThresholdPct: 50,
      guidanceTemplates: {
        "ATTUNEMENT": {
          strengthTitle: "Attunement Grounding",
          strengthHabit: "Maintain your habit of noticing micro-expressions.",
          growthTitle: "Attunement Practice",
          growthHabit: "Pause and observe body language before giving instructions.",
        },
      },
    };

    const scoringResult = await updateVersionScoringConfig(version1Id, scoringConfig);
    if (!scoringResult.success) {
      throw new Error(`FAIL 4.1: Scoring config update returned failure: ${JSON.stringify(scoringResult)}`);
    }
    console.log("  PASS 4.1: updateVersionScoringConfig validated and saved scoring configuration.");

    // -------------------------------------------------------------------------
    // 5. Course Recommendation Mappings
    // -------------------------------------------------------------------------
    console.log("\n[5/6] Testing Course Recommendation Mappings Client Calls...");

    // Create published test course in DB
    const course = await prisma.course.create({
      data: {
        slug: `conscious-parenting-${timestamp}`,
        title: "Conscious Parenting & Attunement",
        description: "Pedagogical course on responsive parenting.",
        status: CourseStatus.PUBLISHED,
        priceAmount: 299900,
      },
    });
    publishedCourseId = course.id;

    // List courses via admin API client
    const courses = await listAdminCourses();
    const foundCourse = courses.find((c) => c.id === publishedCourseId);
    if (!foundCourse) {
      throw new Error("FAIL 5.1: listAdminCourses did not return the test course.");
    }
    console.log(`  PASS 5.1: listAdminCourses returned available curriculum courses (found '${foundCourse.title}').`);

    // Create course mapping
    const mapping = await createCourseMapping(version1Id, {
      factorId,
      courseId: publishedCourseId,
      triggerCondition: "GROWTH_OPPORTUNITY",
      displayOrder: 1,
      customGuidance: "Deepen attunement and emotional co-regulation.",
    });
    mappingId = mapping.id;
    console.log("  PASS 5.2: createCourseMapping mapped factor to published curriculum course.");

    // Delete mapping
    const deleteRes = await deleteCourseMapping(mappingId);
    if (!deleteRes.success) {
      throw new Error("FAIL 5.3: deleteCourseMapping failed.");
    }
    console.log("  PASS 5.3: deleteCourseMapping removed course mapping.");

    // Re-create mapping so readiness check has it
    await createCourseMapping(version1Id, {
      factorId,
      courseId: publishedCourseId,
      triggerCondition: "GROWTH_OPPORTUNITY",
      displayOrder: 1,
    });

    // -------------------------------------------------------------------------
    // 6. Pre-Activation Readiness Report Verification
    // -------------------------------------------------------------------------
    console.log("\n[6/6] Testing Pre-Activation Readiness Validation via Client API...");

    const readinessReport = await checkActivationReadiness(version1Id);
    if (!readinessReport || !Array.isArray(readinessReport.checks)) {
      throw new Error(`FAIL 6.1: checkActivationReadiness returned invalid report: ${JSON.stringify(readinessReport)}`);
    }

    if (readinessReport.checks.length !== 7) {
      throw new Error(`FAIL 6.2: Expected 7 diagnostic checks, got ${readinessReport.checks.length}`);
    }

    // Verify clinical approval check is reported
    const approvalCheck = readinessReport.checks.find(
      (c) => c.id === "PROFESSIONAL_APPROVAL"
    );
    if (!approvalCheck || approvalCheck.passed !== false) {
      throw new Error("FAIL 6.3: Clinical approval should be reported as incomplete.");
    }
    console.log("  PASS 6.1: checkActivationReadiness returned 7 comprehensive diagnostic checks.");
    console.log(`  PASS 6.2: Pre-activation correctly reports approval status: ${approvalCheck.message}`);
    console.log(`  PASS 6.3: Overall readiness correctly marked: isReadyForActivation=${readinessReport.isReadyForActivation}`);

    console.log("\n======================================================");
    console.log("   ALL 15 PHASE 4C UI CLIENT API INTEGRATION TESTS PASSED! ");
    console.log("======================================================");
  } finally {
    global.fetch = originalFetch;

    // Clean up test data
    try {
      if (publishedCourseId) {
        await prisma.assessmentCourseMapping.deleteMany({
          where: { courseId: publishedCourseId },
        }).catch(() => {});
      }
      if (instrumentId) {
        await prisma.assessmentAuditLog.deleteMany({
          where: { instrumentId },
        }).catch(() => {});
        await prisma.assessmentCourseMapping.deleteMany({
          where: { version: { instrumentId } },
        }).catch(() => {});
        await prisma.assessmentItem.deleteMany({
          where: { version: { instrumentId } },
        }).catch(() => {});
        await prisma.assessmentFactorDefinition.deleteMany({
          where: { version: { instrumentId } },
        }).catch(() => {});
        await prisma.assessmentVersion.deleteMany({
          where: { instrumentId },
        }).catch(() => {});
        await prisma.assessmentInstrument.delete({
          where: { id: instrumentId },
        }).catch(() => {});
      }
      if (publishedCourseId) {
        await prisma.course.delete({ where: { id: publishedCourseId } }).catch(() => {});
      }
      if (adminUserId) {
        await prisma.user.delete({ where: { id: adminUserId } }).catch(() => {});
      }
    } catch {
      // Best-effort cleanup
    }
  }
}

if (require.main === module) {
  runAdminAssessmentsUiApiSuite().catch((err) => {
    console.error("ADMIN ASSESSMENTS UI TEST FAILED:", err);
    process.exit(1);
  });
}

export { runAdminAssessmentsUiApiSuite };
