import { prisma, CourseStatus } from "@insight-ignite/database";
import { AssessmentRecommendationDto, FactorScoreDto } from "@insight-ignite/shared";

/**
 * Derives published course recommendations based on approved version mappings
 * for factors where participants have growth opportunities.
 */
export async function getApprovedCourseRecommendations(
  versionId: string,
  factorScores: Record<string, FactorScoreDto>
): Promise<AssessmentRecommendationDto[]> {
  // Sort factors by percentage ascending to prioritize areas of greatest growth
  const sortedFactors = Object.values(factorScores).sort((a, b) => a.percentage - b.percentage);

  // Focus recommendations on growth areas / lowest-scoring factors
  const candidateFactorCodes = sortedFactors.map((f) => f.factorCode);

  if (candidateFactorCodes.length === 0) {
    return [];
  }

  // Retrieve approved mappings for this version
  const mappings = await prisma.assessmentCourseMapping.findMany({
    where: {
      versionId,
      factor: {
        code: { in: candidateFactorCodes },
      },
      // Strictly enforce published courses only
      course: {
        status: CourseStatus.PUBLISHED,
      },
    },
    include: {
      course: true,
      factor: true,
    },
    orderBy: {
      displayOrder: "asc",
    },
  });

  const seenCourseIds = new Set<string>();
  const recommendations: AssessmentRecommendationDto[] = [];

  for (const m of mappings) {
    if (seenCourseIds.has(m.courseId)) {
      continue;
    }
    seenCourseIds.add(m.courseId);

    const factorScore = factorScores[m.factor.code];
    const relevanceReason =
      m.customGuidance ||
      `Deepen your understanding and daily practice of ${m.factor.name} (currently reflecting ${
        factorScore ? `${factorScore.percentage}% alignment` : "growth focus"
      }).`;

    recommendations.push({
      courseId: m.course.id,
      slug: m.course.slug,
      title: m.course.title,
      subtitle: m.course.subtitle,
      instructor: m.course.instructor,
      thumbnailUrl: m.course.thumbnailUrl,
      relevanceReason,
      matchingFactorCode: m.factor.code,
    });
  }

  return recommendations;
}
