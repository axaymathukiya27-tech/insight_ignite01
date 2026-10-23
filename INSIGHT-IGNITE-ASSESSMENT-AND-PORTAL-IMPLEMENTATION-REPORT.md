# Insight Ignite: Assessment Reports, Practice Plans, Progress and Portal Redesign

**Date:** 23 October 2026
**Scope:** Local project only. All testing used synthetic data in a local throwaway PostgreSQL database (`insight_test`, 127.0.0.1:55432).
**Production:** Nothing was deployed and no production migration was run. One test run did reach the live database by mistake; see section 17.

---

## Feature status at a glance

| Feature | Status |
|---|---|
| Report structure (9 sections, in order) | WORKING AND TESTED |
| Dimension breakdown (what it measures, what your score indicates, what you can practise) | WORKING AND TESTED |
| Personalization from the parent's own answers | WORKING AND TESTED |
| Strengths / areas for growth / developing classification | WORKING AND TESTED |
| Result-driven summary (counts, main opportunity, next step) | WORKING AND TESTED |
| Personalized recommendations (rules-based, deterministic) | WORKING AND TESTED |
| Seven-day practice plan: generate, start, complete, notes, resume | WORKING AND TESTED |
| Retake creates a new attempt; earlier reports kept | WORKING AND TESTED |
| Assessment history (per assessment and across the platform) | WORKING AND TESTED |
| Progress comparison (first vs latest, direction-aware) | WORKING AND TESTED |
| Learning-resource recommendations from the real course catalogue | WORKING AND TESTED (no real parenting courses are mapped yet, so the empty state is what parents will see) |
| Parent portal layout and navigation | WORKING AND TESTED |
| Admin portal layout and navigation | WORKING AND TESTED |
| Admin users / enrollments / lessons / overview showing real records | WORKING AND TESTED |
| In-progress (unfinished) attempts that can be continued | NOT IMPLEMENTED (answers are only saved when the parent submits; see section 15) |
| Live PSQ wording and scoring direction | BLOCKED (needs the live assessment set up; see section 16) |
| Course lesson room (`/learn/courses/[courseId]`) | NOT VERIFIED (still shows placeholder lessons; out of scope; see section 15) |
| Printed PDF | PARTIALLY VERIFIED (print markup and CSS are tested; no physical print or PDF was produced) |

---

## 1. Initial findings and root causes

| Area | What I found in the code |
|---|---|
| Report wording | Every dimension got the same generic paragraph with the name inserted. Nothing referred to the parent's actual answers. "Why this is a strength" and "What could benefit from attention" were fixed generic headings. |
| Summary | Counted sections, but gave no main opportunity or next action. |
| Recommendations | Only course links existed. There were no practical, result-linked actions. |
| Practice plan | Did not exist. |
| History | `/assessments/my-history` listed attempts, but had no attempt numbers, no grouping by assessment, no comparison, and nothing on the assessment page itself. |
| Retakes | Each submission was already a separate record (good). Nothing linked attempts together. |
| Courses | Course suggestions were saved at submit time and never re-checked. A course that was later unpublished would still be shown. No price, length or enrollment facts were shown. |
| Parent portal | Navigation had no current-page marker, no logout, no mobile menu and a hard-coded "L" avatar. There was no client-side session check, so an expired session showed a broken page. The profile page used the public header instead of the portal. |
| Parent dashboard | Showed **hard-coded** "1 Masterclass" and "6 Modules" cards whether or not the parent was enrolled. "My Courses" was hard-coded as well. |
| Admin portal | Had a "Public Site →" text link and no navigation below laptop width. **Users, Enrollments and Lessons showed hard-coded sample people and records as if they were real.** The Overview showed hard-coded figures. |
| Admin permissions | The menu showed every admin section to school administrators, but the backend only allows platform administrators into Assessments, Users and Inquiries. |
| Data storage quirk | Results are stored as JSONB, and PostgreSQL does not keep key order, so dimensions could appear in a random order. |

Scoring direction (reverse-scoring of Psychological Control) was already fixed in the previous task. I re-verified it here and did not change it.

## 2. Existing functionality discovered

- **Stack (unchanged):**
  - Next.js 16 App Router, React 19 and Tailwind v4 in `frontend`.
  - Express with Prisma 6 in `backend`.
  - Shared zod schemas and types in `shared`.
  - PostgreSQL on Supabase.
- **Authentication:**
  - Cookie session (`insight_session`) checked by `authenticate`, `requireAuth` and `requireRole` middleware.
  - The Next.js proxy (`src/proxy.ts`) redirects visitors without a session cookie away from `/learn`, `/profile` and `/admin`.
- **Assessments:**
  - Instruments are versioned.
  - Questions map to dimensions (factors).
  - Scoring is done on the server against the version's approved scoring config: bands, thresholds and `reverseScoredFactors`.
  - The result is snapshotted in `AssessmentResult`.
  - Guest results use an access cookie and can be claimed into an account later.
- **Print:** the existing `window.print()` approach with `@media print` CSS was kept.
- **AI:** there is no AI-generated interpretation in the project, and none was added. Everything is rules-based and deterministic.

## 3. Files changed

**Shared**
- `shared/src/types/index.ts`:
  - answer evidence, dimension order;
  - personalized area fields (`whatItMeasures`, `indicates`, `smallGoal`);
  - `PracticeRecommendationDto`, plan DTOs, `AssessmentProgressDto`, `MyEnrollmentDto`;
  - course facts on course recommendations.
- `shared/src/schemas/index.ts`: `UpdatePracticeDayInputSchema` (completed flag, note of up to 1000 characters).

**Database**
- `database/prisma/schema.prisma`: adds `AssessmentPracticePlan` and `AssessmentPracticeDay`.
- `database/prisma/migrations/20261023090000_add_assessment_practice_plans/migration.sql` (new, see section 4).

**Backend**
- `modules/assessments/guidance-library.ts` (new). Default plain-language wording for the four parenting dimensions. It is only used when a dimension's name *and* configured direction match.
- `modules/assessments/report-content.ts` (rewritten). Builds:
  - personalized strength, growth and developing explanations that quote the parent's answers;
  - recommendations;
  - the seven-day plan.
- `modules/assessments/scoring.service.ts`:
  - records answer evidence and dimension order;
  - builds the plan and recommendations at submit;
  - adds an optional authored `growthGoal`.
- `modules/assessments/stored-result.ts` (new). Reads both old and new shapes of the stored guidance.
- `modules/assessments/practice-plan.service.ts` (new). Get, start and update-day, owner only.
- `modules/assessments/assessments.service.ts`:
  - stores guidance at submit;
  - rebuilds it for classified older results;
  - re-checks courses against the live catalogue;
  - history now has attempt numbers and plan progress;
  - new `getAssessmentProgress`.
- `modules/assessments/recommendations.service.ts`: `refreshCourseRecommendations` (published only; real price, lessons, duration, enrolled flag).
- `modules/assessments/assessments.controller.ts` and `assessments.routes.ts`: new routes (section 8).
- `modules/courses/courses.service.ts`, `courses.controller.ts` and `courses.routes.ts`: `GET /courses/my/enrollments`.
- `modules/admin/admin.service.ts` and `admin.routes.ts` (new). Read-only overview, users, enrollments and lessons, for platform administrators only.
- `routes/index.ts`: mounts `/admin/platform`.

**Frontend**
- `features/assessments/report-model.ts` (rewritten). Counts, summary, breakdown text, dimension order, price and duration formatting.
- `features/assessments/components/AssessmentReportView.tsx` (rewritten). The nine sections.
- `features/assessments/components/PracticePlanSection.tsx` (new).
- `features/assessments/components/AssessmentProgressPanel.tsx` (new). Attempt table, comparison bars and the attempt-by-attempt table.
- `features/assessments/components/MyAttemptsCard.tsx` (new). Earlier attempts shown on the assessment page.
- `features/assessments/components/AssessmentHistoryList.tsx` (rewritten). Grouped per assessment.
- `features/assessments/components/AssessmentIntro.tsx`: shows `MyAttemptsCard`.
- `features/assessments/api.ts`: plan, progress and enrollment calls.
- `context/AuthContext.tsx`: adds `useOptionalAuth`.
- `config/portal-nav.ts` (new). Separate parent and admin navigation, with admin items filtered by role.
- `components/layout/PortalShell.tsx` (new). Shared portal frame.
- `app/(learner)/layout.tsx` (new): parent portal frame plus session check. `app/(learner)/learn/layout.tsx` now carries metadata only.
- `app/(learner)/learn/page.tsx`: dashboard built from real data.
- `app/(learner)/learn/assessments/page.tsx` (new).
- `app/(learner)/learn/courses/page.tsx`: real enrollments.
- `app/(learner)/profile/page.tsx`: moved into the portal frame, and the placeholder email and date were removed.
- `app/(admin)/admin/layout.tsx`: portal frame, plus clear access-denied and role-limited states.
- `app/(admin)/admin/page.tsx`: real figures.
- `app/(admin)/admin/users`, `enrollments` and `lessons` pages: real records.
- `features/admin/AdminRecordsTable.tsx` (new).

**Tests**
- New:
  - `backend/tests/report-personalization.test.ts`
  - `backend/tests/practice-progress-api.test.ts`
  - `backend/tests/local-db-guard.ts`
- Updated:
  - `backend/tests/scoring-direction.test.ts`
  - `frontend/tests/report-view.test.tsx`
  - `frontend/tests/admin-assessments-ui.test.ts` (local-database guard)
- The guard was also added to the `api`, `auth`, `courses`, `assessments` and `admin-assessments` backend tests.
- Both `package.json` test scripts now include the new suites.

## 4. Database models and migration introduced

Migration `20261023090000_add_assessment_practice_plans` only adds tables. No existing table or row is changed.

| Table | Purpose | Ownership / rules |
|---|---|---|
| `assessment_practice_plans` | One plan per completed attempt. Holds a snapshot of the seven days (so later wording changes never alter a plan in progress), `startedAt` and `completedAt`. | `submissionId` is unique (one plan per attempt). `userId` is the owner. Cascade-deleted with the submission or user. |
| `assessment_practice_days` | Completion time and note per day. | Unique `(planId, dayNumber)`, so repeated clicks update the same row. Notes are limited to 1000 characters. |

- **Row-level security:** RLS is enabled on both tables. If the `app_backend` role from the security proposal exists, the migration grants it access and adds its policy; otherwise that step is skipped.
- **Backward compatibility:**
  - `AssessmentResult.recommendationsSummary` used to hold only a course array.
  - New results hold `{ courses, practiceRecommendations, practicePlan }`.
  - The reader accepts both shapes.
- **Rollback:** drop the two tables. No other data depends on them.
- **Applied:** only to the local `insight_test` database, after the target check passed.

## 5. Assessment scoring and interpretation

- **Scoring and thresholds:** unchanged from the previous fix.
  - Item-level reverse-scoring is applied for dimensions listed in `reverseScoredFactors`.
  - The section is decided by the band's `classification`, with thresholds used only for gaps.
  - No thresholds were invented or changed.
- **Display:** the bar still shows the percentage as answered, and reverse-scored dimensions are labelled "lower is better".
- **New: dimension order.** Each score now records its `orderIndex`, so dimensions show in the assessment's order even though JSONB storage reorders keys.

## 6. Personalization logic

- **Answer evidence.** For each dimension, the server records up to two answers on the positive half of that dimension's scale ("supports") and up to two on the other half ("practice"):
  - It quotes the real question text and the option the parent picked.
  - Midpoint answers are never quoted.
  - It uses the reverse-scored position, so "Always" on a criticism question counts as "practice", not "supports".
  - This only chooses which answers to quote. It plays no part in scoring.
- **Wording precedence:**
  1. Authored text in the version's `guidanceTemplates`.
  2. The default wording for the matching parenting dimension (`guidance-library.ts`).
  3. Generic wording that uses the dimension's own name and description.
- **Default wording limits.** The default wording for "Psychological Control and Criticism" is only used when that dimension is configured as reverse-scored. It never guesses direction from a name.
- **Broad results.** If no answer clearly supports the result, the report says the answers point to it "at a general level rather than to one particular situation". It does not make up a specific example.
- **Raw answers.** Raw answers are never shown in admin pages. The parent only sees their own quoted answers on their own report.

## 7. Strengths and areas for growth

- **Strengths:** "Your Foundational Strengths — What You Are Doing Well".
  - Each card shows the name, score and label, what it measures, what you are doing well (with the quoted answers), and one way to build on it.
  - "Why this is a strength" was removed.
  - If there are no strengths, a supportive message is shown and nothing is invented.
- **Areas for growth:** "Your Areas for Growth — What You Can Work on Next".
  - Each card shows the name, score and label, what it measures, what your answers indicate (non-judgemental, "not a diagnosis"), what you can practise, 2–3 actions, an everyday example and one small goal.
  - "What could benefit from attention" was removed.
- **Developing dimensions:** shown separately as "Developing" and never forced into either section.

## 8. Seven-day practice plan

- **How it is built:**
  - Day 1 focuses on the most pressing growth area.
  - Day 5 focuses on the second area (growth, otherwise developing).
  - Day 3 builds on a strength. If there is none, it becomes a second small change.
  - The other days follow the requested structure: Notice → Small change → Strength → Real-life → Respond → Repeat → Reflect and reassess.
  - Every day has a title, focus dimensions, objective, exercise, approximate minutes, example and reflection question.
- **API (signed-in owner only; another parent and admins get 403):**
  - `GET /assessments/results/:id/practice-plan`
  - `POST /assessments/results/:id/practice-plan/start` (safe to call repeatedly; one plan per attempt)
  - `PUT /assessments/results/:id/practice-plan/days/:day` with `{ completed, note? }`
- **Behaviour:**
  - Marking a day again keeps the original completion time.
  - The plan's `completedAt` is set when all seven days are done, and cleared if one is un-ticked.
  - The page shows the start and completion dates, "n of 7 days (x%)", and a note box per day.
  - Guests can see the plan and are asked to save the report to an account to track it.
- **Older results:** results without a recorded classification get no plan, and a message explains why.
- **After Day 7:** a completion message appears, and "What to Do After Seven Days" offers **Retake Assessment**. A retake always creates a new attempt, and the report says the current one is kept. It also notes that retaking before finishing is allowed but may be less useful.
- **No promises:** the plan says completing it does not guarantee a particular result.

## 9. Assessment history and progress

- **Per assessment:**
  - The assessment page shows signed-in parents their attempts, with date, plan progress and a "View report" link, plus a comparison when one is possible.
  - Each report also shows "Your Progress Over Time" when there are earlier attempts.
  - Endpoint: `GET /assessments/my-progress/:slug`, which returns only the caller's own records.
- **Across the platform:**
  - The dashboard and the new **My Assessments** page group completed assessments.
  - They show the attempt count, latest date, latest report, plan progress, every attempt (on My Assessments) and a retake link.
- **When attempts can be compared:**
  - Same assessment, same dimensions, same questions mapped to each dimension, same answer-scale range and same scoring direction.
  - Calculated with the direction-aware scoring. Older results without a direction are never compared.
  - Otherwise a reason is shown and each report stays available.
  - Historical scores are never recalculated.
- **How changes are calculated:** difference = latest % − first % in **percentage points**, comparing the first comparable attempt with the latest. With three or more attempts, an attempt-by-attempt table is also shown.
- **How changes are described:**
  - The wording depends on the dimension's direction. A rise in Psychological Control is described as "may be happening more often … lower is the positive direction" and is never called an improvement.
  - Every comparison notes that answers are self-reported, do not measure parenting ability, and may reflect circumstances.
  - It never claims the plan caused a change.

## 10. Course recommendations

- **"Learning Resources That May Help You Grow".**
  - Courses come only from the version's admin course mappings to **published** courses, re-checked against the live catalogue every time a report is shown.
  - Card details are the real title and subtitle, the reason it relates to the results, the lesson count, the total duration (only if every lesson has one), the price (only if one is recorded) and "already enrolled" for enrolled parents.
  - Each card links to the real `/courses/[slug]` page.
  - Nothing enrols or charges anyone automatically.
- **When there is no matching course:** "We are preparing learning resources to support your parenting journey. In the meantime, you can begin with your personalized seven-day practice plan." No fake cards are shown.
- **To recommend real courses later:** an admin maps a published course to a dimension in **Admin → Assessments → version → Course mappings**. No schema change is needed.

## 11. Parent portal

- **One shared portal frame** for `/learn/*` and `/profile`:
  - branding and a "My Portal" badge;
  - Dashboard, My Assessments, My Courses and Profile & Settings, with the current page marked;
  - a **Visit website** button (globe icon) in the header and in the account menu;
  - an account menu (name, email, role, dashboard, profile, visit website, **Log out**);
  - a mobile menu.
- **Session handling:** the proxy redirects visitors without a session cookie, and the layout redirects expired or signed-out sessions to `/login?returnTo=…`.
- **Real data:** the dashboard and My Courses use real records only, with helpful empty states.
- **Admin profile:** an administrator opening `/profile` sees the admin frame.
- **Checked in the browser** (synthetic accounts):
  - login leads to the dashboard;
  - the public homepage shows only the public header while signed in, with "My Dashboard" linking back;
  - back and forward navigation and refresh work;
  - after logout, a protected URL redirects to login with `returnTo`;
  - mobile menu at 375 px, with no horizontal page scroll.

## 12. Admin portal

- **Same frame in the admin colours.** "Public Site →" was replaced by **Visit website**. Logout is in the account menu, and there is a mobile menu.
- **Menu follows the backend's permissions.** School administrators only see Overview and Courses. Opening a platform-only section shows "Not available for your role", and the API returns 403 regardless.
- **Real data:**
  - The Overview shows real figures: accounts, courses and published courses, enrollments, completed assessments, live assessments and new inquiries.
  - Users, Enrollments and Lessons show real records via the read-only `/admin/platform/*` APIs, which are platform administrators only.
  - No password hashes, sessions or assessment answers are returned.
- **Checked in the browser:** admin login leads to the overview, Users lists real local records, and going to the public site and back keeps the admin session.

## 13. Accessibility and responsive checks

- **Meaning is never colour-only.** Every label pairs colour with a symbol and a word (✓ Strength, ↑ Area for Growth, ◐ Developing).
- **Assistive-technology markup:**
  - progress bars use `role="progressbar"` with labels;
  - `aria-current="page"` marks the active nav item;
  - menu buttons have `aria-expanded`;
  - Escape and outside-click close menus;
  - plan checkboxes have touch targets of at least 44 px.
- **Layout:**
  - Long dimension names wrap.
  - Wide tables scroll inside their own box.
  - The page itself had no horizontal overflow at 375 px or 1280 px (measured in the browser).
- **Print:**
  - Navigation and buttons are hidden.
  - Cards are kept whole, and bar colours are kept.
  - The plan prints with any saved notes, and the disclaimer prints.

## 14. Automated tests and results

All of these were run against the local `insight_test` database with synthetic data.

| Suite | Result |
|---|---|
| backend `api` | 6 / 6 pass |
| backend `database-error` | 2 / 2 pass |
| backend `auth` | 24 / 24 pass |
| backend `courses` | 15 / 15 pass |
| backend `assessments` | 21 / 21 pass |
| backend `admin-assessments` | 36 / 36 pass |
| backend `scoring-direction` (updated for the new wording) | 68 / 68 pass |
| backend `scoring-direction-api` | 19 / 19 pass |
| backend `report-personalization` (new) | 28 / 28 pass |
| backend `practice-progress-api` (new) | 48 / 48 pass |
| frontend `assessments-frontend` | 12 / 12 pass |
| frontend `admin-assessments-ui` | 15 / 15 pass |
| frontend `report-view` (rewritten) | 53 / 53 pass |
| **Total** | **347 / 347 pass** |
| TypeScript (`tsc --noEmit`, backend and frontend) | clean |
| ESLint (frontend `src` + `tests`) | 0 errors; 5 warnings, all pre-existing (verify-email page, unused imports in an old test) |
| `next build` (production build) | succeeds |

**What the new tests cover:**
- Answer evidence, including reverse-scored items and the midpoint.
- Dimension-specific wording, and no control-specific wording when the direction isn't configured.
- Recommendation ordering and fields, and plan structure.
- No invented strengths; different answers give different results.
- Plan access rules (401, other parent 403, admin 403).
- Idempotent start, including two simultaneous starts.
- Idempotent completion that keeps the original time; note persistence and limits; invalid days.
- Plan completion and reopening.
- History with 0, 1, 2 and 3 attempts, and percentage-point differences.
- Direction-aware change wording.
- No comparison across changed questions or with legacy results.
- Earlier reports unchanged after a retake.
- Parents see only their own history.
- Course price, lesson count, duration and enrolled flag; unpublished courses dropped.
- My-enrollments isolation.
- Admin API permissions, with no password data returned.
- Portal navigation: no dead links, role filtering, active-page logic, and logout and mobile menu present.
- Web-versus-print consistency.

## 15. Unresolved issues

1. **Unfinished attempts.** Answers are saved only when the parent submits, so there is no "in progress / continue" attempt. Adding this would need saving answers as the parent goes, which is a separate feature.
2. **Live PSQ setup.** The Parent Style Questionnaire must have Psychological Control and Criticism marked as reverse-scored (Admin → New Draft Version → Scoring direction), as in the previous report.
   - Until that is done, its reports will not get the control-specific wording, and its classification will still be wrong.
   - Production factor codes could not be inspected.
   - The default wording matches on the dimension names from your screenshot.
3. **Default wording needs review.** The default dimension wording in `guidance-library.ts` is educational text I wrote. Dr. Ganguli should review it, or replace it with authored text in the version's `guidanceTemplates`.
4. **Course lesson room.** `/learn/courses/[courseId]` (and its lesson pages) still contain placeholder lessons. The portal no longer links to it, but it is reachable by URL. It needs real lesson delivery, which was out of scope.
5. **Orders page.** It still shows the existing "payments not live yet" notice, which is accurate.
6. **Other test suites.** The `assessments-frontend` test and the backend `database-error` test do not write data, so they have no database guard.
7. **Logout redirect.** After logging out, the login page URL carries `returnTo=/learn`. This is harmless.

## 16. Production configuration and migration requirements (approval needed; not done)

1. Apply migration `20261023090000_add_assessment_practice_plans` to production.
   - It only adds tables and is safe to run before or after the security proposal.
   - Back up first.
2. Deploy the backend and frontend together, because the new frontend calls the new endpoints.
3. Mark Psychological Control as reverse-scored in a new PSQ version, then approve and publish it.
4. Optionally map published parenting courses to dimensions.

No historical results need recalculation for this work. Old results keep working and show the existing "calculated before…" note.

## 17. Production confirmation

- **Deployment, migrations and configuration:** nothing was deployed. No production migration, configuration change or credential change was made.
- **The one exception: a mistaken test run.**
  - **What happened.** I ran the existing `admin-assessments-ui` test without setting `DATABASE_URL`. Prisma then used `database/.env` and connected to the live database.
  - **What it did there.** It created one temporary synthetic admin account (`admin_ui_test_<timestamp>@insightignite.org`) and a login session. It failed at its next step. Its cleanup then deleted the account, which also deletes the session.
  - **Checking it.** I did not connect to production to verify the cleanup. You can confirm with this read-only query in the Supabase SQL editor; it should return no rows:
    ```sql
    select id, email, created_at from users where email like 'admin_ui_test_%';
    ```
  - **Prevention.** Every test suite that writes data now refuses to run unless `DATABASE_URL` points at a local `*_test` database. I verified that the guard blocks the default production fallback.
- **Local test database:**
  - All other database work used the local `insight_test` database. The target was checked before every write, and server logs printed only a masked target.
  - The two synthetic demo accounts used for the browser check (`demo.parent@example.test` and `demo.admin@example.test`) exist only in the local test database.
- **Temporary servers:** the local test backend, frontend and test database were stopped afterwards.
