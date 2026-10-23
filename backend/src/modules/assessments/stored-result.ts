import {
  AssessmentRecommendationDto,
  PracticePlanDayTemplateDto,
  PracticeRecommendationDto,
} from "@insight-ignite/shared";

/**
 * AssessmentResult.recommendationsSummary holds the report guidance captured when the
 * result was calculated. Older results stored only the course list (a JSON array); newer
 * results store an object with the courses, the personalized recommendations and the
 * seven-day plan. Both shapes are read here so historical results keep working.
 */
export interface StoredGuidance {
  courses: AssessmentRecommendationDto[];
  practiceRecommendations: PracticeRecommendationDto[];
  practicePlan: PracticePlanDayTemplateDto[];
}

export function readStoredGuidance(value: unknown): StoredGuidance {
  if (Array.isArray(value)) {
    return { courses: value as AssessmentRecommendationDto[], practiceRecommendations: [], practicePlan: [] };
  }
  const v = (value || {}) as Partial<StoredGuidance>;
  return {
    courses: Array.isArray(v.courses) ? v.courses : [],
    practiceRecommendations: Array.isArray(v.practiceRecommendations) ? v.practiceRecommendations : [],
    practicePlan: Array.isArray(v.practicePlan) ? v.practicePlan : [],
  };
}

export function storeGuidance(g: StoredGuidance): object {
  return g as unknown as object;
}
