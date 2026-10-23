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

export interface FactorScoreDto {
  factorCode: string;
  factorName: string;
  rawScore: number;
  maxScore: number;
  percentage: number;
  band: string; // e.g. "Strength", "Steady", "Growth Opportunity"
  summaryText?: string;
}

export interface AreaSummaryDto {
  factorCode: string;
  factorName: string;
  title: string;
  description: string;
  actionableHabit: string;
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
  recommendedCourses: AssessmentRecommendationDto[];
  disclaimer: string;
}

export interface AssessmentSubmissionHistoryItem {
  submissionId: string;
  instrumentTitle: string;
  versionNumber: number;
  completedAt: string;
  topStrength?: string;
  topGrowthArea?: string;
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


