import { createApp } from "../src/app";
import { Server } from "http";
import { prisma, UserRole, CourseStatus } from "@insight-ignite/database";

async function runCoursesTestSuite() {
  console.log("======================================================");
  console.log("   INSIGHT IGNITE — PHASE 4A COURSE CATALOG TEST SUITE");
  console.log("======================================================");

  const app = createApp();
  const testPort = 5058;
  const baseUrl = `http://localhost:${testPort}`;

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(testPort, () => resolve(s));
  });

  const timestamp = Date.now();
  const testAdminEmail = `admin_courses_${timestamp}@insightignite.org`;
  const testLearnerEmail = `learner_courses_${timestamp}@insightignite.org`;
  const defaultPassword = "AdminSecurePassword123!";

  let adminSessionCookie = "";
  let learnerSessionCookie = "";

  const testCourseSlug = `test-course-${timestamp}`;
  let createdCourseId = "";

  try {
    // -------------------------------------------------------------------------
    // Setup: Provision Admin and Learner
    // -------------------------------------------------------------------------
    const { hashPassword } = await import("../src/modules/auth/password.util");
    const hashedPassword = await hashPassword(defaultPassword);

    await prisma.user.create({
      data: {
        email: testAdminEmail,
        fullName: "Course Catalog Admin",
        role: UserRole.PLATFORM_ADMIN,
        passwordHash: hashedPassword,
        emailVerified: new Date(),
        isActive: true,
      },
    });

    await prisma.user.create({
      data: {
        email: testLearnerEmail,
        fullName: "Test Learner Visitor",
        role: UserRole.LEARNER,
        passwordHash: hashedPassword,
        emailVerified: new Date(),
        isActive: true,
      },
    });

    // Login Admin
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testAdminEmail, password: defaultPassword }),
    });
    adminSessionCookie = adminLoginRes.headers.get("set-cookie")!.split(";")[0];

    // Login Learner
    const learnerLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testLearnerEmail, password: defaultPassword }),
    });
    learnerSessionCookie = learnerLoginRes.headers.get("set-cookie")!.split(";")[0];

    // -------------------------------------------------------------------------
    // 1. PUBLIC COURSE CATALOG TESTS
    // -------------------------------------------------------------------------
    console.log("\n[1/4] Testing Public Course Catalog & Published Filtering...");

    const publicCatalogRes = await fetch(`${baseUrl}/api/courses`);
    const publicCatalogBody = await publicCatalogRes.json();

    if (publicCatalogRes.status !== 200 || !Array.isArray(publicCatalogBody.data?.courses)) {
      throw new Error("FAIL: Public course catalog did not return 200 with courses array");
    }

    // Ensure all returned courses have status PUBLISHED
    for (const c of publicCatalogBody.data.courses) {
      if (c.status && c.status !== "PUBLISHED") {
        throw new Error(`FAIL: Non-published course leaked in public catalog! Course ID: ${c.id}, status: ${c.status}`);
      }
    }
    console.log(`  PASS 1.1: Public catalog returns ${publicCatalogBody.data.courses.length} published courses without auth.`);

    // -------------------------------------------------------------------------
    // 2. PUBLIC COURSE DETAIL TESTS
    // -------------------------------------------------------------------------
    console.log("\n[2/4] Testing Public Course Detail & 404 Guarantees...");

    // 2.1 Seeded inaugural course should be accessible
    const inauguralRes = await fetch(`${baseUrl}/api/courses/the-6-powers-of-conscious-parenting`);
    const inauguralBody = await inauguralRes.json();

    if (inauguralRes.status !== 200 || !inauguralBody.data?.course) {
      throw new Error("FAIL: Could not retrieve published inaugural course detail");
    }
    if (inauguralBody.data.course.slug !== "the-6-powers-of-conscious-parenting") {
      throw new Error("FAIL: Retrieved course slug mismatch");
    }
    if (!Array.isArray(inauguralBody.data.course.lessons) || inauguralBody.data.course.lessons.length !== 6) {
      throw new Error(`FAIL: Expected 6 core lessons, found: ${inauguralBody.data.course.lessons?.length}`);
    }
    console.log("  PASS 2.1: Published inaugural course detail retrieved with 6 structured lessons.");

    // 2.2 Non-existent slug returns 404
    const nonExistentRes = await fetch(`${baseUrl}/api/courses/non-existent-course-slug-xyz`);
    const nonExistentBody = await nonExistentRes.json();
    if (nonExistentRes.status !== 404 || nonExistentBody.error?.code !== "NOT_FOUND") {
      throw new Error("FAIL: Non-existent course did not return 404 NOT_FOUND");
    }
    console.log("  PASS 2.2: Non-existent course slug returns 404 NOT_FOUND.");

    // -------------------------------------------------------------------------
    // 3. ADMIN AUTHORIZATION & ACCESS CONTROL
    // -------------------------------------------------------------------------
    console.log("\n[3/4] Testing Administrator Authorization on Course Management...");

    // 3.1 Unauthenticated access to admin courses endpoint
    const unauthAdminRes = await fetch(`${baseUrl}/api/courses/admin/all`);
    if (unauthAdminRes.status !== 401) {
      throw new Error("FAIL: Unauthenticated access to admin courses did not return 401");
    }
    console.log("  PASS 3.1: Unauthenticated request to /api/courses/admin/all rejected with 401.");

    // 3.2 Learner access to admin courses endpoint
    const learnerAdminRes = await fetch(`${baseUrl}/api/courses/admin/all`, {
      headers: { Cookie: learnerSessionCookie },
    });
    if (learnerAdminRes.status !== 403) {
      throw new Error("FAIL: Learner was allowed to access /api/courses/admin/all! Expected 403");
    }
    console.log("  PASS 3.2: Learner strictly forbidden from /api/courses/admin/all (403 INSUFFICIENT_PERMISSIONS).");

    // 3.3 Learner cannot create course
    const learnerCreateRes = await fetch(`${baseUrl}/api/courses/admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: learnerSessionCookie,
      },
      body: JSON.stringify({
        title: "Unauthorized Course",
        slug: "unauthorized-course",
        description: "Malicious attempt by learner to create a course",
      }),
    });
    if (learnerCreateRes.status !== 403) {
      throw new Error("FAIL: Learner was allowed to post to /api/courses/admin! Expected 403");
    }
    console.log("  PASS 3.3: Learner strictly forbidden from creating courses (403 INSUFFICIENT_PERMISSIONS).");

    // 3.4 Admin can access admin courses list
    const adminListRes = await fetch(`${baseUrl}/api/courses/admin/all`, {
      headers: { Cookie: adminSessionCookie },
    });
    const adminListBody = await adminListRes.json();
    if (adminListRes.status !== 200 || !Array.isArray(adminListBody.data?.courses)) {
      throw new Error("FAIL: Platform Admin denied access to /api/courses/admin/all");
    }
    console.log(`  PASS 3.4: Administrator granted access to admin courses management (${adminListBody.data.courses.length} total courses).`);

    // -------------------------------------------------------------------------
    // 4. ADMIN COURSE CRUD & LIFECYCLE (CREATE -> PUBLISH -> UNPUBLISH)
    // -------------------------------------------------------------------------
    console.log("\n[4/4] Testing Admin Course Lifecycle (Create -> Publish -> Unpublish)...");

    // 4.1 Invalid input validation
    const invalidCreateRes = await fetch(`${baseUrl}/api/courses/admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminSessionCookie,
      },
      body: JSON.stringify({
        title: "A", // too short (<3 chars)
        slug: "INVALID SLUG WITH SPACES", // invalid regex
        description: "short", // <10 chars
      }),
    });
    const invalidCreateBody = await invalidCreateRes.json();
    if (invalidCreateRes.status !== 400 || invalidCreateBody.error?.code !== "VALIDATION_ERROR") {
      throw new Error("FAIL: Invalid course input was not rejected with 400 VALIDATION_ERROR");
    }
    console.log("  PASS 4.1: Invalid course input safely rejected with 400 VALIDATION_ERROR.");

    // 4.2 Admin creates draft course
    const validCreateRes = await fetch(`${baseUrl}/api/courses/admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminSessionCookie,
      },
      body: JSON.stringify({
        title: "Foundations of Adolescent Mentorship",
        slug: testCourseSlug,
        subtitle: "Bridging the connection between identity and emotional regulation",
        description:
          "An advanced developmental masterclass exploring neural remodeling, peer attachment, and conscious boundaries during early and middle adolescence.",
        instructor: "Dr. Nivedita Ganguli",
        status: "DRAFT",
      }),
    });
    const validCreateBody = await validCreateRes.json();
    if (validCreateRes.status !== 201 || !validCreateBody.data?.course?.id) {
      throw new Error(`FAIL: Course creation failed: ${JSON.stringify(validCreateBody)}`);
    }
    createdCourseId = validCreateBody.data.course.id;
    if (validCreateBody.data.course.status !== "DRAFT") {
      throw new Error(`FAIL: Expected created course status to be DRAFT, got: ${validCreateBody.data.course.status}`);
    }
    console.log(`  PASS 4.2: Administrator created draft course [id: ${createdCourseId}, slug: ${testCourseSlug}].`);

    // 4.3 Verify DRAFT course is NOT visible in public catalog
    const checkPublicCatalog = await fetch(`${baseUrl}/api/courses`);
    const checkCatalogBody = await checkPublicCatalog.json();
    const draftInPublic = checkCatalogBody.data.courses.some((c: { slug: string }) => c.slug === testCourseSlug);
    if (draftInPublic) {
      throw new Error("FAIL: Draft course leaked in public catalog!");
    }

    const checkPublicDetail = await fetch(`${baseUrl}/api/courses/${testCourseSlug}`);
    if (checkPublicDetail.status !== 404) {
      throw new Error("FAIL: Public detail returned 200 for DRAFT course! Must return 404.");
    }
    console.log("  PASS 4.3: Draft course is strictly hidden from public catalog and returns 404 on direct URL.");

    // 4.4 Admin publishes course
    const publishRes = await fetch(`${baseUrl}/api/courses/admin/${createdCourseId}/publish`, {
      method: "PATCH",
      headers: { Cookie: adminSessionCookie },
    });
    const publishBody = await publishRes.json();
    if (publishRes.status !== 200 || publishBody.data?.course?.status !== "PUBLISHED") {
      throw new Error(`FAIL: Publishing course failed: ${JSON.stringify(publishBody)}`);
    }
    console.log("  PASS 4.4: Administrator published course (status transitioned to PUBLISHED).");

    // 4.5 Verify PUBLISHED course IS NOW visible in public catalog and direct URL
    const publicPublishedRes = await fetch(`${baseUrl}/api/courses/${testCourseSlug}`);
    const publicPublishedBody = await publicPublishedRes.json();
    if (publicPublishedRes.status !== 200 || publicPublishedBody.data?.course?.slug !== testCourseSlug) {
      throw new Error("FAIL: Published course not accessible via public URL!");
    }
    console.log("  PASS 4.5: Published course now immediately accessible on public URL.");

    // 4.6 Admin edits course details
    const updateRes = await fetch(`${baseUrl}/api/courses/admin/${createdCourseId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminSessionCookie,
      },
      body: JSON.stringify({
        subtitle: "Updated Subtitle for Adolescent Mentorship",
      }),
    });
    const updateBody = await updateRes.json();
    if (updateRes.status !== 200 || updateBody.data?.course?.subtitle !== "Updated Subtitle for Adolescent Mentorship") {
      throw new Error("FAIL: Updating course subtitle failed");
    }
    console.log("  PASS 4.6: Administrator successfully updated course metadata.");

    // 4.7 Admin unpublishes course (returns to DRAFT)
    const unpublishRes = await fetch(`${baseUrl}/api/courses/admin/${createdCourseId}/unpublish`, {
      method: "PATCH",
      headers: { Cookie: adminSessionCookie },
    });
    const unpublishBody = await unpublishRes.json();
    if (unpublishRes.status !== 200 || unpublishBody.data?.course?.status !== "DRAFT") {
      throw new Error(`FAIL: Unpublishing course failed: ${JSON.stringify(unpublishBody)}`);
    }
    console.log("  PASS 4.7: Administrator unpublished course (status reverted to DRAFT).");

    // 4.8 Verify course is immediately removed from public access
    const postUnpublishRes = await fetch(`${baseUrl}/api/courses/${testCourseSlug}`);
    if (postUnpublishRes.status !== 404) {
      throw new Error("FAIL: Course remained accessible publicly after unpublishing!");
    }
    console.log("  PASS 4.8: Unpublished course immediately returns 404 on public route.");

    console.log("\n======================================================");
    console.log("   ALL 15 COURSE CATALOG & ADMIN TESTS PASSED!        ");
    console.log("======================================================");
  } finally {
    // Cleanup test data
    if (createdCourseId) {
      await prisma.lesson.deleteMany({ where: { courseId: createdCourseId } });
      await prisma.course.delete({ where: { id: createdCourseId } }).catch(() => {});
    }
    await prisma.session.deleteMany({
      where: { user: { email: { in: [testAdminEmail, testLearnerEmail] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [testAdminEmail, testLearnerEmail] } },
    });
    await prisma.$disconnect();
    server.close();
  }
}

runCoursesTestSuite().catch((err) => {
  console.error("FATAL: Course test suite failed:", err);
  process.exit(1);
});
