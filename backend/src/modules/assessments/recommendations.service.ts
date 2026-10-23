import { prisma, CourseStatus } from "@insight-ignite/database";
import { AssessmentRecommendationDto, FactorScoreDto } from "@insight-ignite/shared";

/**
 * Chooses which dimensions course recommendations should address, using the
 * direction-aware classification rather than the raw percentage:
 *   - growth areas first, most pressing (lowest interpreted score) first;
 *   - if there are none, developing (steady) dimensions;
 *   - never dimensions classified as strengths.
 */
export function selectRecommendationFactors(factorScores: Record<string, FactorScoreDto>): string[] {
  const scores = Object.values(factorScores);
  const byNeed = (a: FactorScoreDto, b: FactorScoreDto) =>
    (a.interpretedPercentage ?? a.percentage) - (b.interpretedPercentage ?? b.percentage);
  const growth = scores.filter((s) => s.classification === "GROWTH_OPPORTUNITY").sort(byNeed);
  if (growth.length > 0) return growth.map((s) => s.factorCode);
  return scores.filter((s) => s.classification === "STEADY").sort(byNeed).map((s) => s.factorCode);
}

/** Direction-aware sentence explaining why a course is suggested. */
export function describeRelevance(score: FactorScoreDto | undefined, factorName: string): string {
  if (!score) return `Suggested to support your growth in ${factorName}.`;
  const label = score.band ? ` ("${score.band}")` : "";
  return score.direction === "HIGHER_IS_CONCERN"
    ? `Suggested because your answers show the behaviours in ${factorName} happen fairly often${label}; this course offers practical alternatives.`
    : `Suggested to help you build ${factorName}${label} in everyday moments.`;
}

/**
 * Derives published course recommendations based on approved version mappings
 * for the dimensions selected above.
 */
export async function getApprovedCourseRecommendations(
  versionId: string,
  factorScores: Record<string, FactorScoreDto>
): Promise<AssessmentRecommendationDto[]> {
  const candidateFactorCodes = selectRecommendationFactors(factorScores);

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

  // Order by need (the order of candidateFactorCodes), then by displayOrder
  mappings.sort(
    (a, b) =>
      candidateFactorCodes.indexOf(a.factor.code) - candidateFactorCodes.indexOf(b.factor.code) ||
      a.displayOrder - b.displayOrder
  );

  const seenCourseIds = new Set<string>();
  const recommendations: AssessmentRecommendationDto[] = [];

  for (const m of mappings) {
    if (seenCourseIds.has(m.courseId)) {
      continue;
    }
    seenCourseIds.add(m.courseId);

    recommendations.push({
      courseId: m.course.id,
      slug: m.course.slug,
      title: m.course.title,
      subtitle: m.course.subtitle,
      instructor: m.course.instructor,
      thumbnailUrl: m.course.thumbnailUrl,
      relevanceReason: m.customGuidance || describeRelevance(factorScores[m.factor.code], m.factor.name),
      matchingFactorCode: m.factor.code,
    });
  }

  return recommendations;
}
