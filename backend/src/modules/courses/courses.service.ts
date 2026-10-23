import { prisma, CourseStatus } from "@insight-ignite/database";
import {
  CreateCourseInput,
  UpdateCourseInput,
  PublicCourseSummary,
  PublicCourseDetail,
  AdminCourseSummary,
  AdminCourseDetail,
} from "@insight-ignite/shared";

export class CourseError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code: string = "COURSE_ERROR"
  ) {
    super(message);
    this.name = "CourseError";
  }
}

/**
 * Public catalog: returns only courses with PUBLISHED status.
 * Draft, development preview, or archived courses are strictly filtered out.
 */
export async function getPublishedCourses(): Promise<PublicCourseSummary[]> {
  const courses = await prisma.course.findMany({
    where: {
      status: CourseStatus.PUBLISHED,
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
export async function getPublishedCourseBySlug(
  slug: string
): Promise<PublicCourseDetail | null> {
  const course = await prisma.course.findFirst({
    where: {
      slug,
      status: CourseStatus.PUBLISHED,
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
export async function getAdminCourses(): Promise<AdminCourseSummary[]> {
  const courses = await prisma.course.findMany({
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
export async function getAdminCourseById(
  id: string
): Promise<AdminCourseDetail | null> {
  const course = await prisma.course.findUnique({
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
export async function createCourse(
  input: CreateCourseInput
): Promise<AdminCourseDetail> {
  const normalizedSlug = input.slug.trim().toLowerCase();

  const existingSlug = await prisma.course.findUnique({
    where: { slug: normalizedSlug },
  });

  if (existingSlug) {
    throw new CourseError(
      `A course with slug '${normalizedSlug}' already exists.`,
      400,
      "SLUG_ALREADY_EXISTS"
    );
  }

  const course = await prisma.course.create({
    data: {
      title: input.title.trim(),
      slug: normalizedSlug,
      subtitle: input.subtitle?.trim() || null,
      description: input.description.trim(),
      instructor: input.instructor?.trim() || "Dr. Nivedita Ganguli",
      status: (input.status as CourseStatus) || CourseStatus.DRAFT,
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
export async function updateCourse(
  id: string,
  input: UpdateCourseInput
): Promise<AdminCourseDetail> {
  const existing = await prisma.course.findUnique({
    where: { id },
    include: { lessons: { orderBy: { orderIndex: "asc" } } },
  });

  if (!existing) {
    throw new CourseError("Course not found", 404, "NOT_FOUND");
  }

  let newSlug: string | undefined = undefined;
  if (input.slug && input.slug.trim().toLowerCase() !== existing.slug) {
    newSlug = input.slug.trim().toLowerCase();
    const slugTaken = await prisma.course.findUnique({
      where: { slug: newSlug },
    });
    if (slugTaken) {
      throw new CourseError(
        `A course with slug '${newSlug}' already exists.`,
        400,
        "SLUG_ALREADY_EXISTS"
      );
    }
  }

  const updated = await prisma.course.update({
    where: { id },
    data: {
      title: input.title !== undefined ? input.title.trim() : undefined,
      slug: newSlug,
      subtitle: input.subtitle !== undefined ? (input.subtitle?.trim() || null) : undefined,
      description: input.description !== undefined ? input.description.trim() : undefined,
      instructor: input.instructor !== undefined ? input.instructor.trim() : undefined,
      status: input.status !== undefined ? (input.status as CourseStatus) : undefined,
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
export async function setCourseStatus(
  id: string,
  status: CourseStatus
): Promise<AdminCourseDetail> {
  const existing = await prisma.course.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new CourseError("Course not found", 404, "NOT_FOUND");
  }

  const updated = await prisma.course.update({
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
