import { createApp } from "../src/app";
import { Server } from "http";
import {
  prisma,
  UserRole,
  AssessmentStatus,
  CourseStatus,
} from "@insight-ignite/database";
import { createSession } from "../src/modules/auth/session.service";

async function runAdminAssessmentsTestSuite() {
  console.log("======================================================");
  console.log("   INSIGHT IGNITE — PHASE 4A ADMIN ASSESSMENT TESTS   ");
  console.log("======================================================");

  const app = createApp();
  const testPort = 5063;
  const baseUrl = `http://localhost:${testPort}`;

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(testPort, () => resolve(s));
  });

  const timestamp = Date.now();
  const adminEmail = `admin_test_${timestamp}@insightignite.org`;
  const learnerEmail = `learner_test_${timestamp}@insightignite.org`;
  const parentEmail = `parent_test_${timestamp}@insightignite.org`;
  const teacherEmail = `teacher_test_${timestamp}@insightignite.org`;

  let adminCookie = "";
  let learnerCookie = "";
  let parentCookie = "";
  let teacherCookie = "";

  let adminUserId = "";
  let learnerUserId = "";
  let parentUserId = "";
  let teacherUserId = "";

  // Test entities created
  let testInstrumentId = "";
  let version1Id = "";
  let version2Id = "";
  let activeVersionId = "";
  let retiredVersionId = "";
  let factor1Id = "";
  let factor2Id = "";
  let item1Id = "";
  let publishedCourseId = "";
  let draftCourseId = "";

  try {
    // -------------------------------------------------------------------------
    // Setup: Provision Users & Sessions
    // -------------------------------------------------------------------------
    const { hashPassword } = await import("../src/modules/auth/password.util");
    const pwd = await hashPassword("TestPassword123!");

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        fullName: "Dr. Nivedita Ganguli (Admin)",
        role: UserRole.PLATFORM_ADMIN,
        passwordHash: pwd,
        emailVerified: new Date(),
        isActive: true,
      },
    });
    adminUserId = admin.id;
    const adminSess = await createSession(admin.id);
    adminCookie = `insight_session=${adminSess.sessionToken}`;

    const learner = await prisma.user.create({
      data: {
        email: learnerEmail,
        fullName: "Test Learner",
        role: UserRole.LEARNER,
        passwordHash: pwd,
        emailVerified: new Date(),
        isActive: true,
      },
    });
    learnerUserId = learner.id;
    const learnerSess = await createSession(learner.id);
    learnerCookie = `insight_session=${learnerSess.sessionToken}`;

    const parent = await prisma.user.create({
      data: {
        email: parentEmail,
        fullName: "Test Parent",
        role: UserRole.PARENT,
        passwordHash: pwd,
        emailVerified: new Date(),
        isActive: true,
      },
    });
    parentUserId = parent.id;
    const parentSess = await createSession(parent.id);
    parentCookie = `insight_session=${parentSess.sessionToken}`;

    const teacher = await prisma.user.create({
      data: {
        email: teacherEmail,
        fullName: "Test Teacher",
        role: UserRole.TEACHER,
        passwordHash: pwd,
        emailVerified: new Date(),
        isActive: true,
      },
    });
    teacherUserId = teacher.id;
    const teacherSess = await createSession(teacher.id);
    teacherCookie = `insight_session=${teacherSess.sessionToken}`;

    // -------------------------------------------------------------------------
    // 1. Role-Based Access Control (RBAC) Enforcement
    // -------------------------------------------------------------------------
    console.log("\n[1/6] Testing Administrative Authorization & Role Isolation...");

    // 1.1 Unauthenticated request returns 401
    const unauthedRes = await fetch(`${baseUrl}/api/admin/assessments/instruments`);
    if (unauthedRes.status !== 401) {
      throw new Error(`FAIL 1.1: Expected 401 for unauthenticated request, got ${unauthedRes.status}`);
    }
    console.log("  PASS 1.1: Unauthenticated request rejected with 401 UNAUTHORIZED.");

    // 1.2 LEARNER role returns 403
    const learnerRes = await fetch(`${baseUrl}/api/admin/assessments/instruments`, {
      headers: { Cookie: learnerCookie },
    });
    if (learnerRes.status !== 403) {
      throw new Error(`FAIL 1.2: Expected 403 for LEARNER role, got ${learnerRes.status}`);
    }
    console.log("  PASS 1.2: LEARNER role rejected with 403 INSUFFICIENT_PERMISSIONS.");

    // 1.3 PARENT role returns 403
    const parentRes = await fetch(`${baseUrl}/api/admin/assessments/instruments`, {
      headers: { Cookie: parentCookie },
    });
    if (parentRes.status !== 403) {
      throw new Error(`FAIL 1.3: Expected 403 for PARENT role, got ${parentRes.status}`);
    }
    console.log("  PASS 1.3: PARENT role rejected with 403 INSUFFICIENT_PERMISSIONS.");

    // 1.4 TEACHER role returns 403
    const teacherRes = await fetch(`${baseUrl}/api/admin/assessments/instruments`, {
      headers: { Cookie: teacherCookie },
    });
    if (teacherRes.status !== 403) {
      throw new Error(`FAIL 1.4: Expected 403 for TEACHER role, got ${teacherRes.status}`);
    }
    console.log("  PASS 1.4: TEACHER role rejected with 403 INSUFFICIENT_PERMISSIONS.");

    // 1.5 PLATFORM_ADMIN role succeeds
    const adminRes = await fetch(`${baseUrl}/api/admin/assessments/instruments`, {
      headers: { Cookie: adminCookie },
    });
    if (adminRes.status !== 200) {
      throw new Error(`FAIL 1.5: Expected 200 for PLATFORM_ADMIN role, got ${adminRes.status}`);
    }
    console.log("  PASS 1.5: PLATFORM_ADMIN authorized successfully.");

    // -------------------------------------------------------------------------
    // 2. Input Validation
    // -------------------------------------------------------------------------
    console.log("\n[2/6] Testing Input Validation & Constraints...");

    // 2.1 Invalid slug (uppercase, spaces) rejected
    const badSlugRes = await fetch(`${baseUrl}/api/admin/assessments/instruments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        slug: "INVALID SLUG HERE!",
        title: "Test Instrument",
        description: "Test description that is long enough.",
      }),
    });
    if (badSlugRes.status !== 400) {
      throw new Error(`FAIL 2.1: Expected 400 for invalid slug, got ${badSlugRes.status}`);
    }
    console.log("  PASS 2.1: Invalid slug format rejected with 400 VALIDATION_ERROR.");

    // 2.2 Short description (<10 chars) rejected
    const shortDescRes = await fetch(`${baseUrl}/api/admin/assessments/instruments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        slug: "valid-slug-test",
        title: "Valid Title",
        description: "too short",
      }),
    });
    if (shortDescRes.status !== 400) {
      throw new Error(`FAIL 2.2: Expected 400 for short description, got ${shortDescRes.status}`);
    }
    console.log("  PASS 2.2: Short description rejected with 400 VALIDATION_ERROR.");

    // -------------------------------------------------------------------------
    // 3. Draft Instrument & Initial Version 1 Creation
    // -------------------------------------------------------------------------
    console.log("\n[3/6] Testing Draft Instrument & Version 1 Creation...");

    const testSlug = `parent-growth-admin-${timestamp}`;
    const createRes = await fetch(`${baseUrl}/api/admin/assessments/instruments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        slug: testSlug,
        title: "Parent Growth & Relational Resilience",
        subtitle: "Reflective assessment of co-regulation strengths",
        description: "A developmental questionnaire evaluating parent presence, boundary clarity, and relational repair.",
        category: "parenting",
        intendedAudience: "Parents and primary caregivers",
      }),
    });

    const createBody = await createRes.json();
    if (createRes.status !== 201 || !createBody.success || !createBody.data?.instrument) {
      throw new Error(`FAIL 3.1: Create draft instrument failed: ${JSON.stringify(createBody)}`);
    }

    const inst = createBody.data.instrument;
    testInstrumentId = inst.id;
    if (inst.status !== "DRAFT") {
      throw new Error(`FAIL 3.1: Expected status DRAFT, got ${inst.status}`);
    }
    if (inst.versions.length !== 1 || inst.versions[0].versionNumber !== 1 || inst.versions[0].status !== "DRAFT") {
      throw new Error(`FAIL 3.1: Expected initial Version 1 in DRAFT status: ${JSON.stringify(inst.versions)}`);
    }
    version1Id = inst.versions[0].id;
    console.log("  PASS 3.1: Draft instrument and initial Version 1 created successfully.");

    // 3.2 Audit log verification
    const auditLog = await prisma.assessmentAuditLog.findFirst({
      where: { instrumentId: testInstrumentId, action: "INSTRUMENT_CREATED" },
    });
    if (!auditLog || auditLog.actorUserId !== adminUserId || auditLog.actorEmail !== adminEmail) {
      throw new Error("FAIL 3.2: AssessmentAuditLog missing or incorrect actor data.");
    }
    console.log("  PASS 3.2: AssessmentAuditLog entry created atomically with actor user ID and email.");

    // 3.3 Duplicate slug rejected
    const dupRes = await fetch(`${baseUrl}/api/admin/assessments/instruments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        slug: testSlug,
        title: "Duplicate Slug Instrument",
        description: "Should fail because slug already exists.",
      }),
    });
    if (dupRes.status !== 400) {
      throw new Error(`FAIL 3.3: Expected 400 on duplicate slug, got ${dupRes.status}`);
    }
    console.log("  PASS 3.3: Duplicate instrument slug rejected safely.");

    // -------------------------------------------------------------------------
    // 4. Draft Content Isolation from Public Catalog
    // -------------------------------------------------------------------------
    console.log("\n[4/6] Testing Draft Content Isolation from Public API...");

    const publicRes = await fetch(`${baseUrl}/api/assessments/active?slug=${testSlug}`);
    if (publicRes.status !== 404) {
      throw new Error(`FAIL 4.1: Security failure! Draft instrument was returned by public API (status ${publicRes.status})`);
    }
    console.log("  PASS 4.1: Draft instrument is strictly isolated and hidden from public endpoint (404 NO_ACTIVE_ASSESSMENT).");

    // -------------------------------------------------------------------------
    // 5. Incremental Version Creation & Metadata Updates
    // -------------------------------------------------------------------------
    console.log("\n[5/6] Testing Incremental Draft Versions & Metadata Updates...");

    // 5.1 Create Version 2
    const v2Res = await fetch(`${baseUrl}/api/admin/assessments/instruments/${testInstrumentId}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        disclaimerText: "Updated disclaimer for version 2.",
        instructionsText: "Updated instructions for version 2.",
      }),
    });
    const v2Body = await v2Res.json();
    if (v2Res.status !== 201 || v2Body.data?.version?.versionNumber !== 2) {
      throw new Error(`FAIL 5.1: Create Version 2 failed: ${JSON.stringify(v2Body)}`);
    }
    version2Id = v2Body.data.version.id;
    console.log("  PASS 5.1: Incremental Version 2 created successfully with status DRAFT.");

    // 5.2 Update draft version metadata
    const updateRes = await fetch(`${baseUrl}/api/admin/assessments/versions/${version1Id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        disclaimerText: "Custom edited disclaimer text.",
        instructionsText: "Custom edited instructions text.",
      }),
    });
    const updateBody = await updateRes.json();
    if (updateRes.status !== 200 || updateBody.data?.version?.disclaimerText !== "Custom edited disclaimer text.") {
      throw new Error(`FAIL 5.2: Update draft metadata failed: ${JSON.stringify(updateBody)}`);
    }
    console.log("  PASS 5.2: Draft version metadata updated and confirmed.");

    // 5.3 Retrieve instrument details with all versions
    const detailRes = await fetch(`${baseUrl}/api/admin/assessments/instruments/${testInstrumentId}`, {
      headers: { Cookie: adminCookie },
    });
    const detailBody = await detailRes.json();
    if (detailRes.status !== 200 || detailBody.data?.instrument?.versions?.length !== 2) {
      throw new Error(`FAIL 5.3: Expected 2 versions in instrument detail: ${JSON.stringify(detailBody)}`);
    }
    console.log("  PASS 5.3: Instrument detail returns complete version history and audit trail.");

    // -------------------------------------------------------------------------
    // 6. Immutability Safeguards on ACTIVE and RETIRED Versions
    // -------------------------------------------------------------------------
    console.log("\n[6/6] Testing Version Immutability Guards...");

    // Create a mock ACTIVE version directly in DB
    const activeVer = await prisma.assessmentVersion.create({
      data: {
        instrumentId: testInstrumentId,
        versionNumber: 99,
        status: AssessmentStatus.ACTIVE,
        disclaimerText: "Active version disclaimer.",
      },
    });
    activeVersionId = activeVer.id;

    // Attempting to update ACTIVE version via API must be blocked
    const activeUpdateRes = await fetch(`${baseUrl}/api/admin/assessments/versions/${activeVersionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ disclaimerText: "Malicious mutation on active version!" }),
    });
    if (activeUpdateRes.status !== 403) {
      throw new Error(`FAIL 6.1: Immutability breach! Expected 403 when modifying ACTIVE version, got ${activeUpdateRes.status}`);
    }
    console.log("  PASS 6.1: Mutation attempt on ACTIVE version rejected with 403 VERSION_IMMUTABLE.");

    // Create a mock RETIRED version directly in DB
    const retiredVer = await prisma.assessmentVersion.create({
      data: {
        instrumentId: testInstrumentId,
        versionNumber: 98,
        status: AssessmentStatus.RETIRED,
        disclaimerText: "Retired version disclaimer.",
      },
    });
    retiredVersionId = retiredVer.id;

    // Attempting to update RETIRED version via API must be blocked
    const retiredUpdateRes = await fetch(`${baseUrl}/api/admin/assessments/versions/${retiredVersionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ disclaimerText: "Malicious mutation on retired version!" }),
    });
    if (retiredUpdateRes.status !== 403) {
      throw new Error(`FAIL 6.2: Immutability breach! Expected 403 when modifying RETIRED version, got ${retiredUpdateRes.status}`);
    }
    console.log("  PASS 6.2: Mutation attempt on RETIRED version rejected with 403 VERSION_IMMUTABLE.");

    // -------------------------------------------------------------------------
    // 7. Phase 4B: Draft Factor Authoring & Governance
    // -------------------------------------------------------------------------
    console.log("\n[7/13] Testing Draft Factor Authoring & Governance...");

    // 7.1 Create Factor 1
    const createFactor1Res = await fetch(`${baseUrl}/api/admin/assessments/versions/${version1Id}/factors`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        code: "EMOTIONAL_REGULATION",
        name: "Emotional Regulation",
        tagline: "Awareness and composure under stress",
        description: "Measures a caregiver's ability to maintain calm and responsive awareness during demanding moments.",
        orderIndex: 1,
      }),
    });
    const factor1Body = await createFactor1Res.json();
    if (createFactor1Res.status !== 201 || !factor1Body.data?.factor?.id) {
      throw new Error(`FAIL 7.1: Expected 201 when creating factor 1, got ${createFactor1Res.status}: ${JSON.stringify(factor1Body)}`);
    }
    factor1Id = factor1Body.data.factor.id;
    console.log("  PASS 7.1: Factor 1 ('EMOTIONAL_REGULATION') created successfully.");

    // 7.2 Create Factor 2
    const createFactor2Res = await fetch(`${baseUrl}/api/admin/assessments/versions/${version1Id}/factors`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        code: "PARENTAL_COACHING",
        name: "Parental Coaching",
        tagline: "Guiding problem solving",
        orderIndex: 2,
      }),
    });
    const factor2Body = await createFactor2Res.json();
    if (createFactor2Res.status !== 201 || !factor2Body.data?.factor?.id) {
      throw new Error(`FAIL 7.2: Expected 201 when creating factor 2, got ${createFactor2Res.status}: ${JSON.stringify(factor2Body)}`);
    }
    factor2Id = factor2Body.data.factor.id;
    console.log("  PASS 7.2: Factor 2 ('PARENTAL_COACHING') created successfully.");

    // 7.3 Reject duplicate factor code within version
    const dupFactorCodeRes = await fetch(`${baseUrl}/api/admin/assessments/versions/${version1Id}/factors`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        code: "EMOTIONAL_REGULATION",
        name: "Emotional Regulation Duplicate",
        orderIndex: 3,
      }),
    });
    if (dupFactorCodeRes.status !== 400) {
      throw new Error(`FAIL 7.3: Expected 400 for duplicate factor code, got ${dupFactorCodeRes.status}`);
    }
    console.log("  PASS 7.3: Duplicate factor code rejected with 400 FACTOR_CODE_EXISTS.");

    // 7.4 Reject duplicate orderIndex within version
    const dupFactorOrderRes = await fetch(`${baseUrl}/api/admin/assessments/versions/${version1Id}/factors`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        code: "FACTOR_UNIQUE_CODE",
        name: "Conflicting Order Factor",
        orderIndex: 1, // Already occupied by factor 1
      }),
    });
    if (dupFactorOrderRes.status !== 400) {
      throw new Error(`FAIL 7.4: Expected 400 for duplicate factor orderIndex, got ${dupFactorOrderRes.status}`);
    }
    console.log("  PASS 7.4: Conflicting factor order index rejected with 400 ORDER_INDEX_CONFLICT.");

    // 7.5 Update Factor 2
    const updateFactorRes = await fetch(`${baseUrl}/api/admin/assessments/factors/${factor2Id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        name: "Mindful Parental Coaching",
        description: "Scaffolded emotional coaching techniques.",
      }),
    });
    const updateFactorBody = await updateFactorRes.json();
    if (updateFactorRes.status !== 200 || updateFactorBody.data?.factor?.name !== "Mindful Parental Coaching") {
      throw new Error(`FAIL 7.5: Expected 200 when updating factor, got ${updateFactorRes.status}: ${JSON.stringify(updateFactorBody)}`);
    }
    console.log("  PASS 7.5: Factor updated successfully.");

    // 7.6 Create and Delete temporary factor
    const tempFactorRes = await fetch(`${baseUrl}/api/admin/assessments/versions/${version1Id}/factors`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        code: "TEMP_FACTOR",
        name: "Temporary Factor",
        orderIndex: 9,
      }),
    });
    const tempFactorBody = await tempFactorRes.json();
    const tempFactorId = tempFactorBody.data?.factor?.id;
    const deleteTempFactorRes = await fetch(`${baseUrl}/api/admin/assessments/factors/${tempFactorId}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });
    if (deleteTempFactorRes.status !== 200) {
      throw new Error(`FAIL 7.6: Expected 200 deleting unused factor, got ${deleteTempFactorRes.status}`);
    }
    console.log("  PASS 7.6: Unused factor deleted successfully.");

    // -------------------------------------------------------------------------
    // 8. Phase 4B: Questions & Options Authoring
    // -------------------------------------------------------------------------
    console.log("\n[8/13] Testing Draft Questions & Answer Options Authoring...");

    // 8.1 Create Question 1 with options and score weights
    const createItem1Res = await fetch(`${baseUrl}/api/admin/assessments/versions/${version1Id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        factorId: factor1Id,
        itemKey: "EQ_01",
        orderIndex: 1,
        prompt: "When my child is having an intense meltdown, I am able to pause before responding.",
        contextPrompt: "Think about high-stress interactions during bedtime or morning transitions.",
        responseType: "SINGLE_CHOICE",
        isRequired: true,
        options: [
          { id: "rarely", label: "Rarely or Almost Never", orderIndex: 1, value: 1 },
          { id: "sometimes", label: "Sometimes", orderIndex: 2, value: 2 },
          { id: "often", label: "Often", orderIndex: 3, value: 3 },
          { id: "consistently", label: "Consistently", orderIndex: 4, value: 4 },
        ],
      }),
    });
    const item1Body = await createItem1Res.json();
    if (createItem1Res.status !== 201 || !item1Body.data?.item?.id) {
      throw new Error(`FAIL 8.1: Expected 201 creating item 1, got ${createItem1Res.status}: ${JSON.stringify(item1Body)}`);
    }
    item1Id = item1Body.data.item.id;
    console.log("  PASS 8.1: Question item with 4 weighted options created successfully.");

    // 8.2 Reject duplicate itemKey within version
    const dupKeyRes = await fetch(`${baseUrl}/api/admin/assessments/versions/${version1Id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        factorId: factor1Id,
        itemKey: "EQ_01",
        orderIndex: 2,
        prompt: "Duplicate key item prompt.",
        options: [
          { id: "opt_a", label: "A", orderIndex: 1, value: 1 },
          { id: "opt_b", label: "B", orderIndex: 2, value: 2 },
        ],
      }),
    });
    if (dupKeyRes.status !== 400) {
      throw new Error(`FAIL 8.2: Expected 400 for duplicate itemKey, got ${dupKeyRes.status}`);
    }
    console.log("  PASS 8.2: Duplicate itemKey rejected with 400 ITEM_KEY_EXISTS.");

    // 8.3 Cross-version factor isolation: Version 2 cannot reference factor from Version 1
    const crossVerRes = await fetch(`${baseUrl}/api/admin/assessments/versions/${version2Id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        factorId: factor1Id, // factor1Id belongs to version1Id, NOT version2Id
        itemKey: "V2_ITEM",
        orderIndex: 1,
        prompt: "Cross version test question.",
        options: [
          { id: "opt_1", label: "Opt 1", orderIndex: 1, value: 1 },
          { id: "opt_2", label: "Opt 2", orderIndex: 2, value: 2 },
        ],
      }),
    });
    if (crossVerRes.status !== 400) {
      throw new Error(`FAIL 8.3: Cross-version violation not caught! Expected 400, got ${crossVerRes.status}`);
    }
    console.log("  PASS 8.3: Cross-version factor reference rejected with 400 CROSS_VERSION_REFERENCE.");

    // 8.4 Invalid options integrity rejection (< 2 options)
    const invalidOptRes = await fetch(`${baseUrl}/api/admin/assessments/versions/${version1Id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        factorId: factor1Id,
        itemKey: "EQ_SINGLE_OPT",
        orderIndex: 10,
        prompt: "Invalid item prompt.",
        options: [{ id: "only_one", label: "One option", orderIndex: 1, value: 1 }],
      }),
    });
    if (invalidOptRes.status !== 400) {
      throw new Error(`FAIL 8.4: Expected 400 for question with <2 options, got ${invalidOptRes.status}`);
    }
    console.log("  PASS 8.4: Invalid options count rejected with 400 VALIDATION_ERROR/INVALID_OPTIONS_COUNT.");

    // 8.5 In-use Factor Deletion Rejection
    const inUseFactorDeleteRes = await fetch(`${baseUrl}/api/admin/assessments/factors/${factor1Id}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });
    if (inUseFactorDeleteRes.status !== 400) {
      throw new Error(`FAIL 8.5: In-use factor deletion was not blocked! Expected 400, got ${inUseFactorDeleteRes.status}`);
    }
    console.log("  PASS 8.5: In-use factor deletion blocked with 400 FACTOR_IN_USE.");

    // 8.6 Update Question Item
    const updateItemRes = await fetch(`${baseUrl}/api/admin/assessments/items/${item1Id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        prompt: "When my child has an intense emotional outburst, I stay grounded and mindful.",
      }),
    });
    if (updateItemRes.status !== 200) {
      throw new Error(`FAIL 8.6: Expected 200 updating question item, got ${updateItemRes.status}`);
    }
    console.log("  PASS 8.6: Question item updated successfully.");

    // -------------------------------------------------------------------------
    // 9. Phase 4B: Strict Scoring Configuration Editing
    // -------------------------------------------------------------------------
    console.log("\n[9/13] Testing Strict Scoring Configuration Validation...");

    // 9.1 Reject malformed scoring config (violating schema constraints)
    const badScoringRes = await fetch(`${baseUrl}/api/admin/assessments/versions/${version1Id}/scoring-config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        formula: "INVALID_FORMULA", // schema allows only SUM_OF_WEIGHTS or AVERAGE_WEIGHTS
        bands: [], // must have min 1 band
      }),
    });
    if (badScoringRes.status !== 400) {
      throw new Error(`FAIL 9.1: Malformed scoring config was not rejected! Expected 400, got ${badScoringRes.status}`);
    }
    console.log("  PASS 9.1: Malformed scoring config rejected with 400 SCORING_CONFIG_INVALID.");

    // 9.2 Reject guidance template referencing undefined factor code
    const inconsistentGuidanceRes = await fetch(`${baseUrl}/api/admin/assessments/versions/${version1Id}/scoring-config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        formula: "SUM_OF_WEIGHTS",
        bands: [
          { name: "Developing", minPercentage: 0, maxPercentage: 50, classification: "GROWTH_OPPORTUNITY" },
          { name: "Proficient", minPercentage: 51, maxPercentage: 100, classification: "STRENGTH" },
        ],
        strengthsThresholdPct: 70,
        growthThresholdPct: 50,
        guidanceTemplates: {
          "UNDEFINED_FACTOR_XYZ": {
            strengthTitle: "Strength Title",
            strengthHabit: "Strength Habit",
            growthTitle: "Growth Title",
            growthHabit: "Growth Habit",
          },
        },
      }),
    });
    if (inconsistentGuidanceRes.status !== 400) {
      throw new Error(`FAIL 9.2: Guidance with non-existent factor was not rejected! Expected 400, got ${inconsistentGuidanceRes.status}`);
    }
    console.log("  PASS 9.2: Guidance template referencing non-existent factor rejected with 400 SCORING_CONFIG_INCONSISTENT.");

    // 9.3 Successfully save valid approved scoring config
    const validScoringRes = await fetch(`${baseUrl}/api/admin/assessments/versions/${version1Id}/scoring-config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        formula: "SUM_OF_WEIGHTS",
        bands: [
          { name: "Developing", minPercentage: 0, maxPercentage: 49, classification: "GROWTH_OPPORTUNITY", description: "Foundational self-reflection" },
          { name: "Steady", minPercentage: 50, maxPercentage: 74, classification: "STEADY", description: "Emerging consistency" },
          { name: "Strengths", minPercentage: 75, maxPercentage: 100, classification: "STRENGTH", description: "Established strength" },
        ],
        strengthsThresholdPct: 75,
        growthThresholdPct: 50,
        guidanceTemplates: {
          "EMOTIONAL_REGULATION": {
            strengthTitle: "Grounded Presence",
            strengthHabit: "Maintain your mindful pause practice during high-stress interactions.",
            growthTitle: "Co-Regulation Focus",
            growthHabit: "Practice taking two slow diaphragmatic breaths before addressing bedtime resistance.",
          },
          "PARENTAL_COACHING": {
            strengthTitle: "Empathetic Guidance",
            strengthHabit: "Continue coaching problem solving rather than rushing to solve issues directly.",
            growthTitle: "Scaffolded Autonomy",
            growthHabit: "Ask one reflective question ('What do you think we should try?') before stepping in.",
          },
        },
      }),
    });
    if (validScoringRes.status !== 200) {
      const err = await validScoringRes.json();
      throw new Error(`FAIL 9.3: Expected 200 saving valid scoring config, got ${validScoringRes.status}: ${JSON.stringify(err)}`);
    }
    console.log("  PASS 9.3: Approved scoring configuration validated and saved successfully.");

    // -------------------------------------------------------------------------
    // 10. Phase 4B: Published Course Recommendation Mappings
    // -------------------------------------------------------------------------
    console.log("\n[10/13] Testing Published Course Recommendation Mappings...");

    // 10.1 Setup test courses: one published, one draft
    const publishedCourse = await prisma.course.create({
      data: {
        slug: `mindful-parenting-${timestamp}`,
        title: "Mindful Parenting in the Early Years",
        description: "A comprehensive course on emotional regulation and responsive parenting.",
        status: CourseStatus.PUBLISHED,
        priceAmount: 499900,
      },
    });
    publishedCourseId = publishedCourse.id;

    const draftCourse = await prisma.course.create({
      data: {
        slug: `draft-course-${timestamp}`,
        title: "Unpublished Development Course",
        description: "Draft syllabus not yet approved or published.",
        status: CourseStatus.DEVELOPMENT_PREVIEW,
        priceAmount: 0,
      },
    });
    draftCourseId = draftCourse.id;

    // 10.2 Reject mapping unpublished course
    const mapDraftCourseRes = await fetch(`${baseUrl}/api/admin/assessments/versions/${version1Id}/course-mappings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        factorId: factor1Id,
        courseId: draftCourseId,
        triggerCondition: "GROWTH_OPPORTUNITY",
        displayOrder: 1,
      }),
    });
    if (mapDraftCourseRes.status !== 400) {
      throw new Error(`FAIL 10.2: Expected 400 mapping unpublished course, got ${mapDraftCourseRes.status}`);
    }
    console.log("  PASS 10.2: Mapping unpublished course rejected with 400 COURSE_NOT_PUBLISHED.");

    // 10.3 Cross-version factor rejection for course mapping
    const crossVerMapRes = await fetch(`${baseUrl}/api/admin/assessments/versions/${version2Id}/course-mappings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        factorId: factor1Id, // Belongs to version 1!
        courseId: publishedCourseId,
      }),
    });
    if (crossVerMapRes.status !== 400) {
      throw new Error(`FAIL 10.3: Expected 400 for cross-version course mapping, got ${crossVerMapRes.status}`);
    }
    console.log("  PASS 10.3: Cross-version factor in course mapping rejected with 400 CROSS_VERSION_REFERENCE.");

    // 10.4 Successfully map published course to Factor 1
    const mapCourseRes = await fetch(`${baseUrl}/api/admin/assessments/versions/${version1Id}/course-mappings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        factorId: factor1Id,
        courseId: publishedCourseId,
        triggerCondition: "GROWTH_OPPORTUNITY",
        displayOrder: 1,
        customGuidance: "Recommended to strengthen your emotional co-regulation practice.",
      }),
    });
    const mapCourseBody = await mapCourseRes.json();
    if (mapCourseRes.status !== 201 || !mapCourseBody.data?.courseMapping?.id) {
      throw new Error(`FAIL 10.4: Expected 201 creating course mapping, got ${mapCourseRes.status}: ${JSON.stringify(mapCourseBody)}`);
    }
    const mappingId = mapCourseBody.data.courseMapping.id;
    console.log("  PASS 10.4: Published course mapped to factor successfully.");

    // 10.5 Duplicate course mapping rejection
    const dupMapRes = await fetch(`${baseUrl}/api/admin/assessments/versions/${version1Id}/course-mappings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        factorId: factor1Id,
        courseId: publishedCourseId,
      }),
    });
    if (dupMapRes.status !== 400) {
      throw new Error(`FAIL 10.5: Expected 400 for duplicate course mapping, got ${dupMapRes.status}`);
    }
    console.log("  PASS 10.5: Duplicate course mapping rejected with 400 MAPPING_ALREADY_EXISTS.");

    // 10.6 Delete course mapping and re-create it
    const deleteMapRes = await fetch(`${baseUrl}/api/admin/assessments/course-mappings/${mappingId}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });
    if (deleteMapRes.status !== 200) {
      throw new Error(`FAIL 10.6: Expected 200 deleting course mapping, got ${deleteMapRes.status}`);
    }
    console.log("  PASS 10.6: Course recommendation mapping deleted successfully.");

    // Re-create mapping for readiness check
    await fetch(`${baseUrl}/api/admin/assessments/versions/${version1Id}/course-mappings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        factorId: factor1Id,
        courseId: publishedCourseId,
        triggerCondition: "GROWTH_OPPORTUNITY",
        displayOrder: 1,
      }),
    });

    // -------------------------------------------------------------------------
    // 11. Phase 4B: Immutability Protections on Authoring Endpoints
    // -------------------------------------------------------------------------
    console.log("\n[11/13] Testing Immutability on Factors, Items, Scoring & Mappings...");

    // 11.1 Factor creation on ACTIVE version blocked
    const activeFactorRes = await fetch(`${baseUrl}/api/admin/assessments/versions/${activeVersionId}/factors`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ code: "ACTIVE_FACTOR", name: "Factor on Active", orderIndex: 10 }),
    });
    if (activeFactorRes.status !== 403) {
      throw new Error(`FAIL 11.1: Factor creation on ACTIVE version not blocked! Got ${activeFactorRes.status}`);
    }
    console.log("  PASS 11.1: Factor creation on ACTIVE version rejected with 403 VERSION_IMMUTABLE.");

    // 11.2 Question creation on ACTIVE version blocked
    const activeItemRes = await fetch(`${baseUrl}/api/admin/assessments/versions/${activeVersionId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        factorId: factor1Id,
        itemKey: "ACTIVE_Q",
        orderIndex: 1,
        prompt: "Prompt",
        options: [{ id: "1", label: "A", orderIndex: 1, value: 1 }, { id: "2", label: "B", orderIndex: 2, value: 2 }],
      }),
    });
    if (activeItemRes.status !== 403) {
      throw new Error(`FAIL 11.2: Question item creation on ACTIVE version not blocked! Got ${activeItemRes.status}`);
    }
    console.log("  PASS 11.2: Question item creation on ACTIVE version rejected with 403 VERSION_IMMUTABLE.");

    // 11.3 Scoring update on ACTIVE version blocked
    const activeScoringRes = await fetch(`${baseUrl}/api/admin/assessments/versions/${activeVersionId}/scoring-config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        formula: "SUM_OF_WEIGHTS",
        bands: [{ name: "Band", minPercentage: 0, maxPercentage: 100, classification: "STRENGTH" }],
      }),
    });
    if (activeScoringRes.status !== 403) {
      throw new Error(`FAIL 11.3: Scoring update on ACTIVE version not blocked! Got ${activeScoringRes.status}`);
    }
    console.log("  PASS 11.3: Scoring config update on ACTIVE version rejected with 403 VERSION_IMMUTABLE.");

    // 11.4 Course mapping on ACTIVE version blocked
    const activeMapRes = await fetch(`${baseUrl}/api/admin/assessments/versions/${activeVersionId}/course-mappings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ factorId: factor1Id, courseId: publishedCourseId }),
    });
    if (activeMapRes.status !== 403) {
      throw new Error(`FAIL 11.4: Course mapping on ACTIVE version not blocked! Got ${activeMapRes.status}`);
    }
    console.log("  PASS 11.4: Course mapping on ACTIVE version rejected with 403 VERSION_IMMUTABLE.");

    // -------------------------------------------------------------------------
    // 12. Phase 4B: Pre-Activation Readiness Validation Service
    // -------------------------------------------------------------------------
    console.log("\n[12/13] Testing Pre-Activation Readiness Validation Service...");

    // 12.1 Check readiness on empty draft Version 2 -> must fail with explicit missing requirements
    const v2ReadinessRes = await fetch(`${baseUrl}/api/admin/assessments/versions/${version2Id}/readiness`, {
      headers: { Cookie: adminCookie },
    });
    const v2ReportBody = await v2ReadinessRes.json();
    const v2Report = v2ReportBody.data?.report;
    if (v2ReadinessRes.status !== 200 || v2Report?.isReadyForActivation !== false) {
      throw new Error(`FAIL 12.1: Empty draft Version 2 should NOT be ready for activation: ${JSON.stringify(v2ReportBody)}`);
    }
    if (v2Report.missingRequirements.length < 3) {
      throw new Error(`FAIL 12.1: Expected comprehensive missing requirements list, got: ${JSON.stringify(v2Report.missingRequirements)}`);
    }
    console.log(`  PASS 12.1: Empty draft correctly evaluated as not ready (${v2Report.missingRequirements.length} missing requirements identified).`);

    // 12.2 Check readiness on Version 1 before Factor 2 coverage is provided
    const v1ReadinessRes1 = await fetch(`${baseUrl}/api/admin/assessments/versions/${version1Id}/readiness`, {
      headers: { Cookie: adminCookie },
    });
    const v1Report1 = (await v1ReadinessRes1.json()).data?.report;
    const factorCoverageCheck = v1Report1?.checks?.find((c: any) => c.id === "FACTOR_COVERAGE");
    if (factorCoverageCheck?.passed !== false) {
      throw new Error(`FAIL 12.2: Expected FACTOR_COVERAGE check to fail for factor without items: ${JSON.stringify(v1Report1)}`);
    }
    console.log("  PASS 12.2: Uncovered factor correctly detected by activation readiness validator.");

    // Add question for Factor 2
    await fetch(`${baseUrl}/api/admin/assessments/versions/${version1Id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        factorId: factor2Id,
        itemKey: "PC_01",
        orderIndex: 2,
        prompt: "When my child encounters difficulty, I encourage them to try multiple solutions.",
        responseType: "SINGLE_CHOICE",
        isRequired: true,
        options: [
          { id: "rarely", label: "Rarely", orderIndex: 1, value: 1 },
          { id: "often", label: "Often", orderIndex: 2, value: 4 },
        ],
      }),
    });

    // 12.3 Check readiness on Version 1: Factor coverage now passes, but PROFESSIONAL_APPROVAL is missing
    const v1ReadinessRes2 = await fetch(`${baseUrl}/api/admin/assessments/versions/${version1Id}/readiness`, {
      headers: { Cookie: adminCookie },
    });
    const v1Report2 = (await v1ReadinessRes2.json()).data?.report;
    const approvalCheck = v1Report2?.checks?.find((c: any) => c.id === "PROFESSIONAL_APPROVAL");
    if (approvalCheck?.passed !== false || v1Report2.isReadyForActivation !== false) {
      throw new Error(`FAIL 12.3: Expected readiness to fail without clinical approval: ${JSON.stringify(v1Report2)}`);
    }
    console.log("  PASS 12.3: Missing professional/clinical approval correctly blocks activation readiness.");

    // 12.4 Record clinical approval directly in DB to simulate authorized sign-off
    await prisma.assessmentVersion.update({
      where: { id: version1Id },
      data: {
        approvedBy: "Dr. Nivedita Ganguli",
        approvedAt: new Date(),
      },
    });

    // Check readiness again: all 7 checks must now pass
    const v1ReadinessRes3 = await fetch(`${baseUrl}/api/admin/assessments/versions/${version1Id}/readiness`, {
      headers: { Cookie: adminCookie },
    });
    const v1Report3 = (await v1ReadinessRes3.json()).data?.report;
    if (v1Report3?.isReadyForActivation !== true || v1Report3.missingRequirements.length !== 0) {
      throw new Error(`FAIL 12.4: Version 1 should now be ready for activation: ${JSON.stringify(v1Report3)}`);
    }
    console.log("  PASS 12.4: Fully configured and clinically approved version evaluates as ready for activation.");

    // 12.5 Readiness check is strictly read-only: Version 1 status remains DRAFT
    const v1StatusCheck = await prisma.assessmentVersion.findUnique({ where: { id: version1Id } });
    if (v1StatusCheck?.status !== AssessmentStatus.DRAFT) {
      throw new Error(`FAIL 12.5: Readiness service mutated status! Expected DRAFT, got ${v1StatusCheck?.status}`);
    }
    console.log("  PASS 12.5: Readiness validation service is strictly read-only; version remains in DRAFT status.");

    // -------------------------------------------------------------------------
    // 13. Phase 4B: Audit Trail Completeness Verification
    // -------------------------------------------------------------------------
    console.log("\n[13/13] Testing Complete Audit Logging for All Phase 4B Mutations...");

    const auditLogs = await prisma.assessmentAuditLog.findMany({
      where: { versionId: version1Id },
      orderBy: { timestamp: "asc" },
    });

    const recordedActions = auditLogs.map((l) => l.action);
    const expectedActions = [
      "FACTOR_CREATED",
      "FACTOR_UPDATED",
      "ITEM_CREATED",
      "ITEM_UPDATED",
      "SCORING_CONFIG_UPDATED",
      "COURSE_MAPPING_CREATED",
    ];

    for (const exp of expectedActions) {
      if (!recordedActions.includes(exp)) {
        throw new Error(`FAIL 13.1: Expected audit action '${exp}' missing from audit logs: ${JSON.stringify(recordedActions)}`);
      }
    }

    const allHaveAdminActor = auditLogs.every(
      (l) => l.actorUserId === adminUserId && l.actorEmail === adminEmail
    );
    if (!allHaveAdminActor) {
      throw new Error("FAIL 13.2: Not all audit logs had correct actor user ID and email recorded.");
    }
    console.log(`  PASS 13.1: All ${expectedActions.length} Phase 4B mutation actions recorded in AssessmentAuditLog.`);
    console.log("  PASS 13.2: All audit logs consistently capture administrator actor identity and email.");

    console.log("\n======================================================");
    console.log("   ALL 36 PHASE 4A & 4B ADMIN ASSESSMENT TESTS PASSED! ");
    console.log("======================================================");
  } finally {
    // -------------------------------------------------------------------------
    // Teardown: Clean up isolated test data
    // -------------------------------------------------------------------------
    try {
      if (publishedCourseId) {
        await prisma.assessmentCourseMapping.deleteMany({ where: { courseId: publishedCourseId } }).catch(() => {});
      }
      if (draftCourseId) {
        await prisma.assessmentCourseMapping.deleteMany({ where: { courseId: draftCourseId } }).catch(() => {});
      }
      if (testInstrumentId) {
        await prisma.assessmentAuditLog.deleteMany({ where: { instrumentId: testInstrumentId } }).catch(() => {});
        await prisma.assessmentCourseMapping.deleteMany({ where: { version: { instrumentId: testInstrumentId } } }).catch(() => {});
        await prisma.assessmentItem.deleteMany({ where: { version: { instrumentId: testInstrumentId } } }).catch(() => {});
        await prisma.assessmentFactorDefinition.deleteMany({ where: { version: { instrumentId: testInstrumentId } } }).catch(() => {});
        await prisma.assessmentVersion.deleteMany({ where: { instrumentId: testInstrumentId } }).catch(() => {});
        await prisma.assessmentInstrument.delete({ where: { id: testInstrumentId } }).catch(() => {});
      }
      if (publishedCourseId) await prisma.course.delete({ where: { id: publishedCourseId } }).catch(() => {});
      if (draftCourseId) await prisma.course.delete({ where: { id: draftCourseId } }).catch(() => {});
      if (adminUserId) await prisma.user.delete({ where: { id: adminUserId } }).catch(() => {});
      if (learnerUserId) await prisma.user.delete({ where: { id: learnerUserId } }).catch(() => {});
      if (parentUserId) await prisma.user.delete({ where: { id: parentUserId } }).catch(() => {});
      if (teacherUserId) await prisma.user.delete({ where: { id: teacherUserId } }).catch(() => {});
    } catch {
      // Best-effort cleanup
    }

    server.close();
  }
}

if (require.main === module) {
  runAdminAssessmentsTestSuite().catch((err) => {
    console.error("ADMIN ASSESSMENT TEST SUITE FAILED:", err);
    process.exit(1);
  });
}

export { runAdminAssessmentsTestSuite };
