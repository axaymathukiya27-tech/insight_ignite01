-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RETIRED');

-- CreateEnum
CREATE TYPE "AssessmentSubmissionStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'CLAIMED', 'ABANDONED');

-- CreateTable
CREATE TABLE "assessment_instruments" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'parenting',
    "intendedAudience" TEXT,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_instruments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_versions" (
    "id" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "scoringConfig" JSONB,
    "disclaimerText" TEXT,
    "instructionsText" TEXT,
    "publishedAt" TIMESTAMP(3),
    "retiredAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_factor_definitions" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "assessment_factor_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_items" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "factorId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "contextPrompt" TEXT,
    "responseType" TEXT NOT NULL DEFAULT 'SINGLE_CHOICE',
    "options" JSONB NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_submissions" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "userId" TEXT,
    "accessKeyHash" TEXT,
    "claimTokenHash" TEXT,
    "status" "AssessmentSubmissionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "consentGiven" BOOLEAN NOT NULL,
    "consentNoticeVersion" TEXT NOT NULL,
    "consentGivenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_raw_responses" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "selectedOptionId" TEXT NOT NULL,
    "numericValue" INTEGER,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_raw_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_results" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "factorScores" JSONB NOT NULL,
    "overallScore" INTEGER,
    "strengths" JSONB NOT NULL,
    "growthAreas" JSONB NOT NULL,
    "recommendationsSummary" JSONB,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_course_mappings" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "factorId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "triggerCondition" TEXT NOT NULL DEFAULT 'GROWTH_OPPORTUNITY',
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "customGuidance" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_course_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_audit_logs" (
    "id" TEXT NOT NULL,
    "instrumentId" TEXT,
    "versionId" TEXT,
    "actorUserId" TEXT,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assessment_instruments_slug_key" ON "assessment_instruments"("slug");

-- CreateIndex
CREATE INDEX "assessment_versions_instrumentId_idx" ON "assessment_versions"("instrumentId");

-- CreateIndex
CREATE INDEX "assessment_versions_status_idx" ON "assessment_versions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_versions_instrumentId_versionNumber_key" ON "assessment_versions"("instrumentId", "versionNumber");

-- CreateIndex
CREATE INDEX "assessment_factor_definitions_versionId_idx" ON "assessment_factor_definitions"("versionId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_factor_definitions_versionId_code_key" ON "assessment_factor_definitions"("versionId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_factor_definitions_versionId_orderIndex_key" ON "assessment_factor_definitions"("versionId", "orderIndex");

-- CreateIndex
CREATE INDEX "assessment_items_versionId_idx" ON "assessment_items"("versionId");

-- CreateIndex
CREATE INDEX "assessment_items_factorId_idx" ON "assessment_items"("factorId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_items_versionId_itemKey_key" ON "assessment_items"("versionId", "itemKey");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_items_versionId_orderIndex_key" ON "assessment_items"("versionId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_submissions_accessKeyHash_key" ON "assessment_submissions"("accessKeyHash");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_submissions_claimTokenHash_key" ON "assessment_submissions"("claimTokenHash");

-- CreateIndex
CREATE INDEX "assessment_submissions_userId_idx" ON "assessment_submissions"("userId");

-- CreateIndex
CREATE INDEX "assessment_submissions_versionId_idx" ON "assessment_submissions"("versionId");

-- CreateIndex
CREATE INDEX "assessment_submissions_accessKeyHash_idx" ON "assessment_submissions"("accessKeyHash");

-- CreateIndex
CREATE INDEX "assessment_submissions_claimTokenHash_idx" ON "assessment_submissions"("claimTokenHash");

-- CreateIndex
CREATE INDEX "assessment_submissions_status_idx" ON "assessment_submissions"("status");

-- CreateIndex
CREATE INDEX "assessment_submissions_expiresAt_idx" ON "assessment_submissions"("expiresAt");

-- CreateIndex
CREATE INDEX "assessment_raw_responses_submissionId_idx" ON "assessment_raw_responses"("submissionId");

-- CreateIndex
CREATE INDEX "assessment_raw_responses_itemId_idx" ON "assessment_raw_responses"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_raw_responses_submissionId_itemId_key" ON "assessment_raw_responses"("submissionId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_results_submissionId_key" ON "assessment_results"("submissionId");

-- CreateIndex
CREATE INDEX "assessment_results_versionId_idx" ON "assessment_results"("versionId");

-- CreateIndex
CREATE INDEX "assessment_course_mappings_versionId_idx" ON "assessment_course_mappings"("versionId");

-- CreateIndex
CREATE INDEX "assessment_course_mappings_factorId_idx" ON "assessment_course_mappings"("factorId");

-- CreateIndex
CREATE INDEX "assessment_course_mappings_courseId_idx" ON "assessment_course_mappings"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_course_mappings_versionId_factorId_courseId_key" ON "assessment_course_mappings"("versionId", "factorId", "courseId");

-- CreateIndex
CREATE INDEX "assessment_audit_logs_instrumentId_idx" ON "assessment_audit_logs"("instrumentId");

-- CreateIndex
CREATE INDEX "assessment_audit_logs_versionId_idx" ON "assessment_audit_logs"("versionId");

-- CreateIndex
CREATE INDEX "assessment_audit_logs_actorUserId_idx" ON "assessment_audit_logs"("actorUserId");

-- CreateIndex
CREATE INDEX "assessment_audit_logs_timestamp_idx" ON "assessment_audit_logs"("timestamp");

-- AddForeignKey
ALTER TABLE "assessment_versions" ADD CONSTRAINT "assessment_versions_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "assessment_instruments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_factor_definitions" ADD CONSTRAINT "assessment_factor_definitions_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "assessment_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_items" ADD CONSTRAINT "assessment_items_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "assessment_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_items" ADD CONSTRAINT "assessment_items_factorId_fkey" FOREIGN KEY ("factorId") REFERENCES "assessment_factor_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_submissions" ADD CONSTRAINT "assessment_submissions_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "assessment_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_submissions" ADD CONSTRAINT "assessment_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_raw_responses" ADD CONSTRAINT "assessment_raw_responses_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "assessment_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_raw_responses" ADD CONSTRAINT "assessment_raw_responses_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "assessment_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "assessment_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "assessment_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_course_mappings" ADD CONSTRAINT "assessment_course_mappings_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "assessment_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_course_mappings" ADD CONSTRAINT "assessment_course_mappings_factorId_fkey" FOREIGN KEY ("factorId") REFERENCES "assessment_factor_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_course_mappings" ADD CONSTRAINT "assessment_course_mappings_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_audit_logs" ADD CONSTRAINT "assessment_audit_logs_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "assessment_instruments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_audit_logs" ADD CONSTRAINT "assessment_audit_logs_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "assessment_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_audit_logs" ADD CONSTRAINT "assessment_audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
