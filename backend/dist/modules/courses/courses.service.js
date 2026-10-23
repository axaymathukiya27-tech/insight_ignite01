"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseError = void 0;
exports.getPublishedCourses = getPublishedCourses;
exports.getPublishedCourseBySlug = getPublishedCourseBySlug;
exports.getAdminCourses = getAdminCourses;
exports.getAdminCourseById = getAdminCourseById;
exports.createCourse = createCourse;
exports.updateCourse = updateCourse;
exports.setCourseStatus = setCourseStatus;
const database_1 = require("@insight-ignite/database");
class CourseError extends Error {
    statusCode;
    code;
    constructor(message, statusCode = 400, code = "COURSE_ERROR") {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = "CourseError";
    }
}
exports.CourseError = CourseError;
/**
 * Public catalog: returns only courses with PUBLISHED status.
 * Draft, development preview, or archived courses are strictly filtered out.
 */
async function getPublishedCourses() {
    const courses = await database_1.prisma.course.findMany({
        where: {
            status: database_1.CourseStatus.PUBLISHED,
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            _count: {
                select: { lessons: true },
            },
        },
    });
    return courses.map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        subtitle: c.subtitle,
        description: c.description,
        instructor: c.instructor,
        thumbnailUrl: c.thumbnailUrl,
        lessonCount: c._count.lessons,
        createdAt: c.createdAt.toISOString(),
    }));
}
/**
 * Public course detail: returns single published course by slug with lessons.
 */
async function getPublishedCourseBySlug(slug) {
    const course = await database_1.prisma.course.findFirst({
        where: {
            slug,
            status: database_1.CourseStatus.PUBLISHED,
        },
        include: {
            lessons: {
                orderBy: { orderIndex: "asc" },
            },
        },
    });
    if (!course) {
        return null;
    }
    return {
        id: course.id,
        slug: course.slug,
        title: course.title,
        subtitle: course.subtitle,
        description: course.description,
        instructor: course.instructor,
        thumbnailUrl: course.thumbnailUrl,
        lessonCount: course.lessons.length,
        createdAt: course.createdAt.toISOString(),
        lessons: course.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            slug: l.slug,
            description: l.description,
            orderIndex: l.orderIndex,
            durationMin: l.durationMin,
            isFreePreview: l.isFreePreview,
        })),
    };
}
/**
 * Admin: retrieve all courses regardless of status.
 */
async function getAdminCourses() {
    const courses = await database_1.prisma.course.findMany({
        orderBy: {
            createdAt: "desc",
        },
        include: {
            _count: {
                select: { lessons: true },
            },
        },
    });
    return courses.map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        subtitle: c.subtitle,
        description: c.description,
        instructor: c.instructor,
        status: c.status,
        thumbnailUrl: c.thumbnailUrl,
        lessonCount: c._count.lessons,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
    }));
}
/**
 * Admin: retrieve single course by ID for management.
 */
async function getAdminCourseById(id) {
    const course = await database_1.prisma.course.findUnique({
        where: { id },
        include: {
            lessons: {
                orderBy: { orderIndex: "asc" },
            },
        },
    });
    if (!course) {
        return null;
    }
    return {
        id: course.id,
        slug: course.slug,
        title: course.title,
        subtitle: course.subtitle,
        description: course.description,
        instructor: course.instructor,
        status: course.status,
        thumbnailUrl: course.thumbnailUrl,
        lessonCount: course.lessons.length,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
        lessons: course.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            slug: l.slug,
            description: l.description,
            orderIndex: l.orderIndex,
            durationMin: l.durationMin,
            isFreePreview: l.isFreePreview,
        })),
    };
}
/**
 * Admin: create a new course.
 */
async function createCourse(input) {
    const normalizedSlug = input.slug.trim().toLowerCase();
    const existingSlug = await database_1.prisma.course.findUnique({
        where: { slug: normalizedSlug },
    });
    if (existingSlug) {
        throw new CourseError(`A course with slug '${normalizedSlug}' already exists.`, 400, "SLUG_ALREADY_EXISTS");
    }
    const course = await database_1.prisma.course.create({
        data: {
            title: input.title.trim(),
            slug: normalizedSlug,
            subtitle: input.subtitle?.trim() || null,
            description: input.description.trim(),
            instructor: input.instructor?.trim() || "Dr. Nivedita Ganguli",
            status: input.status || database_1.CourseStatus.DRAFT,
            thumbnailUrl: input.thumbnailUrl || null,
        },
        include: {
            lessons: true,
        },
    });
    return {
        id: course.id,
        slug: course.slug,
        title: course.title,
        subtitle: course.subtitle,
        description: course.description,
        instructor: course.instructor,
        status: course.status,
        thumbnailUrl: course.thumbnailUrl,
        lessonCount: 0,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
        lessons: [],
    };
}
/**
 * Admin: update course details.
 */
async function updateCourse(id, input) {
    const existing = await database_1.prisma.course.findUnique({
        where: { id },
        include: { lessons: { orderBy: { orderIndex: "asc" } } },
    });
    if (!existing) {
        throw new CourseError("Course not found", 404, "NOT_FOUND");
    }
    let newSlug = undefined;
    if (input.slug && input.slug.trim().toLowerCase() !== existing.slug) {
        newSlug = input.slug.trim().toLowerCase();
        const slugTaken = await database_1.prisma.course.findUnique({
            where: { slug: newSlug },
        });
        if (slugTaken) {
            throw new CourseError(`A course with slug '${newSlug}' already exists.`, 400, "SLUG_ALREADY_EXISTS");
        }
    }
    const updated = await database_1.prisma.course.update({
        where: { id },
        data: {
            title: input.title !== undefined ? input.title.trim() : undefined,
            slug: newSlug,
            subtitle: input.subtitle !== undefined ? (input.subtitle?.trim() || null) : undefined,
            description: input.description !== undefined ? input.description.trim() : undefined,
            instructor: input.instructor !== undefined ? input.instructor.trim() : undefined,
            status: input.status !== undefined ? input.status : undefined,
            thumbnailUrl: input.thumbnailUrl !== undefined ? input.thumbnailUrl : undefined,
        },
        include: {
            lessons: { orderBy: { orderIndex: "asc" } },
        },
    });
    return {
        id: updated.id,
        slug: updated.slug,
        title: updated.title,
        subtitle: updated.subtitle,
        description: updated.description,
        instructor: updated.instructor,
        status: updated.status,
        thumbnailUrl: updated.thumbnailUrl,
        lessonCount: updated.lessons.length,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        lessons: updated.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            slug: l.slug,
            description: l.description,
            orderIndex: l.orderIndex,
            durationMin: l.durationMin,
            isFreePreview: l.isFreePreview,
        })),
    };
}
/**
 * Admin: set publication status (PUBLISHED or DRAFT).
 */
async function setCourseStatus(id, status) {
    const existing = await database_1.prisma.course.findUnique({
        where: { id },
    });
    if (!existing) {
        throw new CourseError("Course not found", 404, "NOT_FOUND");
    }
    const updated = await database_1.prisma.course.update({
        where: { id },
        data: { status },
        include: {
            lessons: { orderBy: { orderIndex: "asc" } },
        },
    });
    return {
        id: updated.id,
        slug: updated.slug,
        title: updated.title,
        subtitle: updated.subtitle,
        description: updated.description,
        instructor: updated.instructor,
        status: updated.status,
        thumbnailUrl: updated.thumbnailUrl,
        lessonCount: updated.lessons.length,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        lessons: updated.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            slug: l.slug,
            description: l.description,
            orderIndex: l.orderIndex,
            durationMin: l.durationMin,
            isFreePreview: l.isFreePreview,
        })),
    };
}
