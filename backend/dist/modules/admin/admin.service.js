"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminOverview = getAdminOverview;
exports.listAdminUsers = listAdminUsers;
exports.listAdminEnrollments = listAdminEnrollments;
exports.listAdminLessons = listAdminLessons;
const database_1 = require("@insight-ignite/database");
/**
 * Read-only administration views built from real records. These deliberately return no
 * password hashes, session data or assessment answers.
 */
async function getAdminOverview() {
    const [usersByRole, coursesByStatus, enrollments, completedAssessments, activeAssessments, newInquiries] = await Promise.all([
        database_1.prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
        database_1.prisma.course.groupBy({ by: ["status"], _count: { _all: true } }),
        database_1.prisma.enrollment.count(),
        database_1.prisma.assessmentSubmission.count({
            where: { status: { in: [database_1.AssessmentSubmissionStatus.SUBMITTED, database_1.AssessmentSubmissionStatus.CLAIMED] } },
        }),
        database_1.prisma.assessmentInstrument.count({ where: { status: database_1.AssessmentStatus.ACTIVE } }),
        database_1.prisma.contactInquiry.count({ where: { status: "NEW" } }),
    ]);
    const users = Object.fromEntries(usersByRole.map((r) => [r.role, r._count._all]));
    const courses = Object.fromEntries(coursesByStatus.map((c) => [c.status, c._count._all]));
    return {
        users: { total: Object.values(users).reduce((a, b) => a + b, 0), byRole: users },
        courses: { total: Object.values(courses).reduce((a, b) => a + b, 0), published: courses[database_1.CourseStatus.PUBLISHED] ?? 0 },
        enrollments,
        completedAssessments,
        activeAssessments,
        newInquiries,
    };
}
async function listAdminUsers() {
    const users = await database_1.prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 500,
        select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            isActive: true,
            emailVerified: true,
            createdAt: true,
            _count: { select: { enrollments: true, assessmentSubmissions: true } },
        },
    });
    return users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        emailVerified: Boolean(u.emailVerified),
        createdAt: u.createdAt.toISOString(),
        enrollmentCount: u._count.enrollments,
        assessmentCount: u._count.assessmentSubmissions,
    }));
}
async function listAdminEnrollments() {
    const rows = await database_1.prisma.enrollment.findMany({
        orderBy: { enrolledAt: "desc" },
        take: 500,
        include: {
            user: { select: { fullName: true, email: true } },
            course: { select: { title: true, slug: true } },
        },
    });
    return rows.map((e) => ({
        id: e.id,
        learnerName: e.user.fullName,
        learnerEmail: e.user.email,
        courseTitle: e.course.title,
        courseSlug: e.course.slug,
        progressPct: e.progressPct,
        enrolledAt: e.enrolledAt.toISOString(),
        completedAt: e.completedAt ? e.completedAt.toISOString() : null,
    }));
}
async function listAdminLessons() {
    const lessons = await database_1.prisma.lesson.findMany({
        orderBy: [{ course: { title: "asc" } }, { orderIndex: "asc" }],
        include: { course: { select: { title: true, status: true } } },
    });
    return lessons.map((l) => ({
        id: l.id,
        courseTitle: l.course.title,
        courseStatus: l.course.status,
        orderIndex: l.orderIndex,
        title: l.title,
        durationMin: l.durationMin,
        isFreePreview: l.isFreePreview,
        hasVideo: Boolean(l.videoUrl),
    }));
}
