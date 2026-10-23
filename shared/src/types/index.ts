import { UserRole } from "../enums";

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  requestId?: string;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  requestId?: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface HealthStatus {
  status: "ok" | "degraded" | "down";
  service: string;
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  version: string;
}

export interface DatabaseReadinessStatus {
  status: "ready" | "unready";
  database: "connected" | "disconnected";
  latencyMs?: number;
  timestamp: string;
  error?: string;
}

export interface SafeUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  emailVerified: string | null;
  isActive: boolean;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface AuthSessionData {
  user: SafeUser;
}

export interface LessonSummary {
  id: string;
  title: string;
  slug?: string | null;
  description?: string | null;
  orderIndex: number;
  durationMin?: number | null;
  isFreePreview: boolean;
}

export interface PublicCourseSummary {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description: string;
  instructor: string;
  thumbnailUrl?: string | null;
  lessonCount: number;
  createdAt: string;
}

export interface MyEnrollmentDto {
  courseId: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  instructor: string;
  lessonCount: number;
  progressPct: number;
  enrolledAt: string;
  completedAt: string | null;
}

export interface PublicCourseDetail extends PublicCourseSummary {
  lessons: LessonSummary[];
}

export interface AdminCourseSummary {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description: string;
  instructor: string;
  status: string;
  thumbnailUrl?: string | null;
  lessonCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCourseDetail extends AdminCourseSummary {
  lessons: LessonSummary[];
}

/**
 * =============================================================================
 * Assessment Contracts & DTOs (Phase 1)
 * =============================================================================
 */

export interface PublicAssessmentOption {
  id: string;
  label: string;
  orderIndex: number;
}

export interface PublicAssessmentFactor {
  code: string;
  name: string;
  tagline?: string | null;
  description?: string | null;
  orderIndex: number;
}

export interface PublicAssessmentItem {
  id: string;
  factorCode: string;
  itemKey: string;
  orderIndex: number;
  prompt: string;
  contextPrompt?: string | null;
  options: PublicAssessmentOption[];
  isRequired: boolean;
}

export interface PublicAssessmentInstrument {
  id: string;
  versionId: string;
  versionNumber: number;
  slug: string;
  title: string;
  subtitle?: string | null;
  description: string;
  disclaimerText?: string | null;
  instructionsText?: string | null;
  factors: PublicAssessmentFactor[];
  items: PublicAssessmentItem[];
}

/** Whether a higher score on a dimension is a positive outcome or a more frequent concerning behaviour. */
export type ScoringDirection = "HIGHER_IS_POSITIVE" | "HIGHER_IS_CONCERN";

/** Interpretation category, taken from the matching band of the approved scoring configuration. */
export type ResultClassification = "STRENGTH" | "STEADY" | "GROWTH_OPPORTUNITY";

export interface FactorScoreDto {
  factorCode: string;
  factorName: string;
  orderIndex?: number; // Dimension order in the assessment (JSON storage does not keep key order)
  rawScore: number; // Sum of the answers as given (never reversed)
  maxScore: number;
  percentage: number; // rawScore / maxScore as answered: what the progress bar shows
  band: string; // e.g. "Strength", "Steady", "Growth Opportunity"
  summaryText?: string;
  // Direction-aware fields. Present on results calculated after the scoring-direction
  // fix; older stored results do not have them.
  direction?: ScoringDirection;
  interpretedPercentage?: number; // After reverse-scoring; equals percentage when HIGHER_IS_POSITIVE
  classification?: ResultClassification;
  dimensionDescription?: string | null; // What the dimension measures
  interpretation?: string; // Direction-aware reading of this score
  // Up to two of the parent's own answers that most support, and most qualify, this
  // result (question text + the option they chose). Only shown to the report's owner.
  evidence?: AnswerEvidenceDto[];
}

export interface AnswerEvidenceDto {
  prompt: string;
  answerLabel: string;
  // "supports": the answer is on the positive side of the scale for this dimension.
  // "practice": the answer is on the side of the scale this dimension would improve towards.
  signal: "supports" | "practice";
}

export interface AreaSummaryDto {
  factorCode: string;
  factorName: string;
  title: string;
  description: string; // What the result indicates
  actionableHabit: string; // Strength: how to maintain it. Growth: the first action to try.
  // Direction-aware detail (results calculated after the scoring-direction fix)
  percentage?: number;
  band?: string;
  direction?: ScoringDirection;
  whyItMatters?: string; // Strength: why this counts as a strength
  behaviorFocus?: string; // Growth: the behaviour that could benefit from attention
  actions?: string[]; // Growth: two or three practical actions
  example?: string; // Growth: an everyday example of responding differently
  whatItMeasures?: string; // Plain-language description of the dimension
  indicates?: string; // What this parent's answers indicate (personalized)
  smallGoal?: string; // Growth: one small, achievable goal
  evidence?: AnswerEvidenceDto[];
}

/** A practical, result-specific recommendation (deterministic, rules-based). */
export interface PracticeRecommendationDto {
  factorCode: string;
  factorName: string;
  kind: "growth" | "steady" | "strength";
  finding: string; // The assessment finding it addresses, e.g. "Autonomy and Independence: 40%, Area for Growth"
  title: string;
  what: string;
  when: string;
  how: string;
  example: string;
  objective: string;
  planDays: number[]; // Days of the seven-day plan that practise it
}

/** One day of the seven-day practice plan, generated from the result. */
export interface PracticePlanDayTemplateDto {
  day: number;
  title: string;
  factorCodes: string[];
  factorNames: string[];
  objective: string;
  exercise: string;
  minutes: number;
  example: string;
  reflection: string;
}

export interface PracticePlanDayDto extends PracticePlanDayTemplateDto {
  completedAt: string | null;
  note: string | null;
}

export interface PracticePlanDto {
  submissionId: string;
  started: boolean;
  startedAt: string | null;
  completedAt: string | null;
  days: PracticePlanDayDto[];
  completedCount: number;
  completionPct: number;
}

export interface AssessmentRecommendationDto {
  courseId: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  instructor: string;
  thumbnailUrl?: string | null;
  relevanceReason: string;
  matchingFactorCode: string;
  // Real catalogue facts, filled in when the report is read (never invented)
  priceAmount?: number; // minor units (paisa)
  currency?: string;
  lessonCount?: number;
  totalDurationMin?: number | null; // only when every lesson has a duration
  isEnrolled?: boolean;
}

export interface AssessmentResultDto {
  submissionId: string;
  versionNumber: number;
  completedAt: string;
  isAnonymous: boolean;
  claimToken?: string; // Transmitted once to client upon initial submission for anonymous claim flow
  factorScores: Record<string, FactorScoreDto>;
  strengths: AreaSummaryDto[];
  growthAreas: AreaSummaryDto[];
  steadyAreas?: AreaSummaryDto[]; // Neither a clear strength nor a growth priority
  recommendedCourses: AssessmentRecommendationDto[];
  practiceRecommendations?: PracticeRecommendationDto[];
  practicePlan?: PracticePlanDayTemplateDto[]; // Seven days; empty for legacy results
  instrumentSlug?: string;
  instrumentTitle?: string;
  disclaimer: string;
}

export interface AssessmentSubmissionHistoryItem {
  submissionId: string;
  instrumentTitle: string;
  instrumentSlug?: string;
  attemptNumber?: number; // 1 = first completed attempt of this assessment
  versionNumber: number;
  completedAt: string;
  topStrength?: string;
  topGrowthArea?: string;
  practiceStarted?: boolean;
  practiceCompletedDays?: number;
}

export interface ProgressComparisonRowDto {
  factorCode: string;
  factorName: string;
  direction: ScoringDirection;
  earlier: number; // percentage as answered
  latest: number;
  difference: number; // percentage points: latest - earlier
  earlierLabel: string;
  latestLabel: string;
  meaning: string; // Direction-aware, neutral description of the change
}

export interface AssessmentProgressDto {
  instrument: { slug: string; title: string; description: string };
  attempts: Array<{
    submissionId: string;
    attemptNumber: number;
    completedAt: string;
    versionNumber: number;
    status: "COMPLETED";
    scores: Array<{ factorCode: string; factorName: string; percentage: number; band: string; classification: ResultClassification | null }>;
    comparable: boolean; // Belongs to the same comparable group as the latest attempt
    practiceStarted: boolean;
    practiceCompletedDays: number;
  }>;
  comparison: {
    available: boolean;
    reason?: string; // Why a comparison is not shown
    firstSubmissionId?: string;
    latestSubmissionId?: string;
    firstCompletedAt?: string;
    latestCompletedAt?: string;
    comparedAttempts?: number;
    rows: ProgressComparisonRowDto[];
  };
}

// ---------------------------------------------------------------------------
// Admin Assessment Management Types
// ---------------------------------------------------------------------------

export interface AdminAssessmentAuditLogDto {
  id: string;
  action: string;
  actorEmail?: string | null;
  actorUserId?: string | null;
  timestamp: string;
  metadata?: unknown;
}

export interface AdminAssessmentVersionSummary {
  id: string;
  versionNumber: number;
  status: "DRAFT" | "ACTIVE" | "RETIRED";
  factorsCount: number;
  itemsCount: number;
  publishedAt?: string | null;
  approvedBy?: string | null;
  createdAt: string;
}

export interface AdminAssessmentInstrumentSummary {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  category: string;
  status: "DRAFT" | "ACTIVE" | "RETIRED";
  activeVersionNumber?: number | null;
  totalVersions: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAssessmentInstrumentDetail {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description: string;
  category: string;
  intendedAudience?: string | null;
  status: "DRAFT" | "ACTIVE" | "RETIRED";
  approvedBy?: string | null;
  approvedAt?: string | null;
  versions: AdminAssessmentVersionSummary[];
  auditLogs: AdminAssessmentAuditLogDto[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminAssessmentFactorDto {
  id: string;
  versionId: string;
  code: string;
  name: string;
  tagline?: string | null;
  description?: string | null;
  orderIndex: number;
  itemsCount: number;
}

export interface AdminAssessmentOptionDto {
  id: string;
  label: string;
  orderIndex: number;
  value: number;
}

export interface AdminAssessmentItemDto {
  id: string;
  versionId: string;
  factorId: string;
  factorCode: string;
  factorName: string;
  itemKey: string;
  orderIndex: number;
  prompt: string;
  contextPrompt?: string | null;
  responseType: string;
  options: AdminAssessmentOptionDto[];
  isRequired: boolean;
}

export interface AdminAssessmentCourseMappingDto {
  id: string;
  versionId: string;
  factorId: string;
  factorCode: string;
  factorName: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  courseStatus: string;
  triggerCondition: string;
  displayOrder: number;
  customGuidance?: string | null;
}

export interface AdminAssessmentVersionDetail {
  id: string;
  instrumentId: string;
  instrumentTitle: string;
  instrumentSlug: string;
  versionNumber: number;
  status: "DRAFT" | "ACTIVE" | "RETIRED";
  disclaimerText?: string | null;
  instructionsText?: string | null;
  scoringConfig?: unknown;
  factorsCount: number;
  itemsCount: number;
  factors?: AdminAssessmentFactorDto[];
  items?: AdminAssessmentItemDto[];
  courseMappings?: AdminAssessmentCourseMappingDto[];
  publishedAt?: string | null;
  retiredAt?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  auditLogs: AdminAssessmentAuditLogDto[];
}

export interface AssessmentValidationCheck {
  id: string;
  category: "FACTORS" | "ITEMS" | "SCORING" | "COURSES" | "APPROVAL";
  title: string;
  passed: boolean;
  message: string;
  details?: unknown;
}

export interface AssessmentActivationReadinessReport {
  versionId: string;
  versionNumber: number;
  status: "DRAFT" | "ACTIVE" | "RETIRED";
  isReadyForActivation: boolean;
  checks: AssessmentValidationCheck[];
  missingRequirements: string[];
}


