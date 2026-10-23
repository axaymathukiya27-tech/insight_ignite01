import { prisma, CourseStatus } from "@insight-ignite/database";

/**
 * Seed script for local development environment.
 * Seeds the approved inaugural course: "The 6 Powers of Conscious Parenting".
 */
export async function seedDevelopmentData() {
  console.log("Seeding development database with approved inaugural course...");

  const courseData = {
    slug: "the-6-powers-of-conscious-parenting",
    title: "The 6 Powers of Conscious Parenting",
    subtitle: "Presence, Attunement, Clarity, Co-Regulation, Repair & Autonomy",
    description:
      "A comprehensive foundational program translating mindful psychology into dependable daily habits. Learn how to anchor your child during intense dysregulation, establish clear boundaries without shame, and restore trust after conflict.",
    instructor: "Dr. Nivedita Ganguli",
    status: CourseStatus.PUBLISHED,
  };

  const course = await prisma.course.upsert({
    where: { slug: courseData.slug },
    update: {
      title: courseData.title,
      subtitle: courseData.subtitle,
      description: courseData.description,
      instructor: courseData.instructor,
      status: courseData.status,
    },
    create: courseData,
  });

  console.log(`Course upserted: ${course.title} [id: ${course.id}, status: ${course.status}]`);

  const lessons = [
    {
      orderIndex: 1,
      title: "The Power of Presence",
      slug: "power-01-presence",
      description: "Grounding oneself before reacting to high-stress household dynamics.",
      durationMin: 45,
      isFreePreview: true,
    },
    {
      orderIndex: 2,
      title: "The Power of Attunement",
      slug: "power-02-attunement",
      description: "Listening beneath spoken words and misbehavior to uncover the unmet emotional need.",
      durationMin: 50,
      isFreePreview: false,
    },
    {
      orderIndex: 3,
      title: "The Power of Clarity",
      slug: "power-03-clarity",
      description: "Establishing clear, predictable, and shame-free limits.",
      durationMin: 40,
      isFreePreview: false,
    },
    {
      orderIndex: 4,
      title: "The Power of Co-Regulation",
      slug: "power-04-co-regulation",
      description: "Anchoring your child's nervous system through your own grounded stability.",
      durationMin: 55,
      isFreePreview: false,
    },
    {
      orderIndex: 5,
      title: "The Power of Repair",
      slug: "power-05-repair",
      description: "Rebuilding connection, trust, and accountability after rupture.",
      durationMin: 45,
      isFreePreview: false,
    },
    {
      orderIndex: 6,
      title: "The Power of Autonomy",
      slug: "power-06-autonomy",
      description: "Fostering inner confidence, problem-solving, and healthy age-appropriate separation.",
      durationMin: 50,
      isFreePreview: false,
    },
  ];

  for (const lesson of lessons) {
    await prisma.lesson.upsert({
      where: {
        courseId_orderIndex: {
          courseId: course.id,
          orderIndex: lesson.orderIndex,
        },
      },
      update: {
        title: lesson.title,
        slug: lesson.slug,
        description: lesson.description,
        durationMin: lesson.durationMin,
        isFreePreview: lesson.isFreePreview,
      },
      create: {
        courseId: course.id,
        orderIndex: lesson.orderIndex,
        title: lesson.title,
        slug: lesson.slug,
        description: lesson.description,
        durationMin: lesson.durationMin,
        isFreePreview: lesson.isFreePreview,
      },
    });
  }

  console.log(`Successfully seeded ${lessons.length} core lessons for ${course.title}.`);
}

if (require.main === module) {
  seedDevelopmentData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
