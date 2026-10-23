import { z } from "zod";

/**
 * Shared runtime validation schemas and input types.
 */

export const ContactInquirySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please provide a valid email address").max(255),
  phone: z.string().trim().max(20).optional().nullable(),
  organization: z.string().trim().max(100).optional().nullable(),
  inquiryType: z.enum(["parenting", "adolescent", "schools", "corporate", "general"]).default("general"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000),
});

export type ContactInquiryInput = z.infer<typeof ContactInquirySchema>;

export const RegisterUserInputSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
  role: z.enum(["LEARNER", "PARENT", "TEACHER"]).default("LEARNER"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  agreeTerms: z.boolean().optional(),
});

export type RegisterUserInput = z.infer<typeof RegisterUserInputSchema>;

export const LoginUserInputSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export type LoginUserInput = z.infer<typeof LoginUserInputSchema>;

export const VerifyEmailInputSchema = z.object({
  token: z.string().trim().min(1, "Verification token is required"),
});

export type VerifyEmailInput = z.infer<typeof VerifyEmailInputSchema>;

export const ResendVerificationInputSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
});

export type ResendVerificationInput = z.infer<typeof ResendVerificationInputSchema>;

export const ForgotPasswordInputSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>;

export const ResetPasswordInputSchema = z.object({
  token: z.string().trim().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>;

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const CourseStatusEnumSchema = z.enum(["DRAFT", "DEVELOPMENT_PREVIEW", "PUBLISHED", "ARCHIVED"]);
export type CourseStatusType = z.infer<typeof CourseStatusEnumSchema>;

export const CreateCourseInputSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(150),
  slug: z
    .string()
    .trim()
    .min(3, "Slug must be at least 3 characters")
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and single hyphens"),
  subtitle: z.string().trim().max(255).optional().nullable(),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(5000),
  instructor: z.string().trim().min(2, "Instructor name must be at least 2 characters").max(100).default("Dr. Nivedita Ganguli"),
  status: CourseStatusEnumSchema.default("DRAFT"),
  thumbnailUrl: z.string().trim().url("Invalid image URL").optional().nullable(),
});

export type CreateCourseInput = z.infer<typeof CreateCourseInputSchema>;

export const UpdateCourseInputSchema = CreateCourseInputSchema.partial();
export type UpdateCourseInput = z.infer<typeof UpdateCourseInputSchema>;

/**
 * =============================================================================
 * Assessment Schemas & Contracts (Phase 1)
 * =============================================================================
 */

export const AssessmentStatusEnumSchema = z.enum(["DRAFT", "ACTIVE", "RETIRED"]);
export type AssessmentStatusType = z.infer<typeof AssessmentStatusEnumSchema>;

export const AssessmentSubmissionStatusEnumSchema = z.enum([
  "IN_PROGRESS",
  "SUBMITTED",
  "CLAIMED",
  "ABANDONED",
]);
export type AssessmentSubmissionStatusType = z.infer<
  typeof AssessmentSubmissionStatusEnumSchema
>;

// Individual answer submission item
export const AssessmentAnswerItemSchema = z.object({
  itemId: z.string().uuid("Invalid item identifier"),
  selectedOptionId: z.string().min(1, "Selected option identifier is required"),
});
export type AssessmentAnswerItem = z.infer<typeof AssessmentAnswerItemSchema>;

// Assessment submission schema (validates client payload)
export const SubmitAssessmentInputSchema = z.object({
  versionId: z.string().uuid("Invalid assessment version identifier"),
  consentGiven: z.literal(true, {
    errorMap: () => ({
      message: "Explicit informed consent is required to process self-assessment responses.",
    }),
  }),
  consentNoticeVersion: z
    .string()
    .trim()
    .min(1, "Consent notice version identifier is required"),
  answers: z
    .array(AssessmentAnswerItemSchema)
    .min(1, "At least one assessment answer must be provided"),
});
export type SubmitAssessmentInput = z.infer<typeof SubmitAssessmentInputSchema>;

// Account claiming schema (links anonymous submission to authenticated user)
export const ClaimAssessmentInputSchema = z.object({
  claimToken: z
    .string()
    .trim()
    .min(16, "A valid claim token is required")
    .max(128, "Invalid claim token length"),
});
export type ClaimAssessmentInput = z.infer<typeof ClaimAssessmentInputSchema>;

// Option schema for question items
export const AssessmentOptionSchema = z.object({
  id: z.string().min(1, "Option ID is required"),
  label: z.string().min(1, "Option label is required"),
  orderIndex: z.number().int().positive(),
  value: z.number().int().optional(), // Kept server-side, stripped from public delivery
});
export type AssessmentOption = z.infer<typeof AssessmentOptionSchema>;

// Factor definition schema
export const CreateAssessmentFactorInputSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .regex(
      /^[A-Z0-9_]+$/,
      "Factor code must consist of uppercase letters, numbers, and underscores"
    ),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  tagline: z.string().trim().max(255).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  orderIndex: z.number().int().positive(),
});
export type CreateAssessmentFactorInput = z.infer<
  typeof CreateAssessmentFactorInputSchema
>;

// Question item schema (admin management)
export const CreateAssessmentItemInputSchema = z.object({
  factorId: z.string().uuid("Invalid factor identifier"),
  itemKey: z
    .string()
    .trim()
    .min(1, "Item key is required")
    .max(50),
  orderIndex: z.number().int().positive(),
  prompt: z.string().trim().min(5, "Prompt must be at least 5 characters").max(1000),
  contextPrompt: z.string().trim().max(500).optional().nullable(),
  responseType: z.enum(["SINGLE_CHOICE"]).default("SINGLE_CHOICE"),
  options: z
    .array(AssessmentOptionSchema)
    .min(2, "At least two response options are required per item"),
  isRequired: z.boolean().default(true),
});
export type CreateAssessmentItemInput = z.infer<
  typeof CreateAssessmentItemInputSchema
>;

// Course recommendation mapping schema (admin management)
export const CreateAssessmentCourseMappingInputSchema = z.object({
  versionId: z.string().uuid("Invalid version identifier"),
  factorId: z.string().uuid("Invalid factor identifier"),
  courseId: z.string().uuid("Invalid course identifier"),
  triggerCondition: z
    .enum(["GROWTH_OPPORTUNITY", "GENERAL_RECOMMENDATION"])
    .default("GROWTH_OPPORTUNITY"),
  displayOrder: z.number().int().positive().default(1),
  customGuidance: z.string().trim().max(500).optional().nullable(),
});
export type CreateAssessmentCourseMappingInput = z.infer<
  typeof CreateAssessmentCourseMappingInputSchema
>;

export const CreateCourseMappingBodySchema = z.object({
  factorId: z.string().uuid("Invalid factor identifier"),
  courseId: z.string().uuid("Invalid course identifier"),
  triggerCondition: z
    .enum(["GROWTH_OPPORTUNITY", "GENERAL_RECOMMENDATION"])
    .default("GROWTH_OPPORTUNITY"),
  displayOrder: z.number().int().positive().default(1),
  customGuidance: z.string().trim().max(500).optional().nullable(),
});
export type CreateCourseMappingBody = z.infer<
  typeof CreateCourseMappingBodySchema
>;

export const UpdateAssessmentFactorInputSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100).optional(),
  tagline: z.string().trim().max(255).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  orderIndex: z.number().int().positive().optional(),
});
export type UpdateAssessmentFactorInput = z.infer<
  typeof UpdateAssessmentFactorInputSchema
>;

export const UpdateAssessmentItemInputSchema = z.object({
  factorId: z.string().uuid("Invalid factor identifier").optional(),
  orderIndex: z.number().int().positive().optional(),
  prompt: z.string().trim().min(5, "Prompt must be at least 5 characters").max(1000).optional(),
  contextPrompt: z.string().trim().max(500).optional().nullable(),
  responseType: z.enum(["SINGLE_CHOICE"]).optional(),
  options: z
    .array(AssessmentOptionSchema)
    .min(2, "At least two response options are required per item")
    .optional(),
  isRequired: z.boolean().optional(),
});
export type UpdateAssessmentItemInput = z.infer<
  typeof UpdateAssessmentItemInputSchema
>;

// Admin Instrument Creation Schema
export const CreateAssessmentInstrumentInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3, "Slug must be at least 3 characters")
    .max(100, "Slug cannot exceed 100 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and single hyphens"
    ),
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title cannot exceed 150 characters"),
  subtitle: z.string().trim().max(255).optional().nullable(),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description cannot exceed 2000 characters"),
  category: z.string().trim().min(2).max(50).default("parenting"),
  intendedAudience: z.string().trim().max(255).optional().nullable(),
});
export type CreateAssessmentInstrumentInput = z.infer<
  typeof CreateAssessmentInstrumentInputSchema
>;

// Admin Version Creation Schema (starts as DRAFT)
export const CreateAssessmentVersionInputSchema = z.object({
  disclaimerText: z.string().trim().max(1000).optional().nullable(),
  instructionsText: z.string().trim().max(2000).optional().nullable(),
});
export type CreateAssessmentVersionInput = z.infer<
  typeof CreateAssessmentVersionInputSchema
>;

// Admin Version Metadata Update Schema (DRAFT only)
export const UpdateAssessmentVersionMetadataInputSchema = z.object({
  disclaimerText: z.string().trim().max(1000).optional().nullable(),
  instructionsText: z.string().trim().max(2000).optional().nullable(),
});
export type UpdateAssessmentVersionMetadataInput = z.infer<
  typeof UpdateAssessmentVersionMetadataInputSchema
>;
