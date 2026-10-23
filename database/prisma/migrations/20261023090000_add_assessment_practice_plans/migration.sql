-- Seven-day practice plans linked to completed assessment attempts (additive; no existing data changed)

-- CreateTable
CREATE TABLE "assessment_practice_plans" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "days" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_practice_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_practice_days" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3),
    "note" VARCHAR(1000),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_practice_days_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assessment_practice_plans_submissionId_key" ON "assessment_practice_plans"("submissionId");

-- CreateIndex
CREATE INDEX "assessment_practice_plans_userId_idx" ON "assessment_practice_plans"("userId");

-- CreateIndex
CREATE INDEX "assessment_practice_days_planId_idx" ON "assessment_practice_days"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_practice_days_planId_dayNumber_key" ON "assessment_practice_days"("planId", "dayNumber");

-- AddForeignKey
ALTER TABLE "assessment_practice_plans" ADD CONSTRAINT "assessment_practice_plans_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "assessment_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_practice_plans" ADD CONSTRAINT "assessment_practice_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_practice_days" ADD CONSTRAINT "assessment_practice_days_planId_fkey" FOREIGN KEY ("planId") REFERENCES "assessment_practice_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Follow the least-privilege model (security-proposal migration 20261022100000) when it is in
-- place: RLS on, and only the backend role may read and write these rows. Skipped when that
-- role does not exist, so this migration also applies cleanly to databases without it.
ALTER TABLE "assessment_practice_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assessment_practice_days" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_backend') THEN
    GRANT SELECT, INSERT, UPDATE ON public.assessment_practice_plans TO app_backend;
    GRANT SELECT, INSERT, UPDATE ON public.assessment_practice_days TO app_backend;
    CREATE POLICY app_backend_all ON public.assessment_practice_plans FOR ALL TO app_backend USING (true) WITH CHECK (true);
    CREATE POLICY app_backend_all ON public.assessment_practice_days FOR ALL TO app_backend USING (true) WITH CHECK (true);
  END IF;
END
$$;
