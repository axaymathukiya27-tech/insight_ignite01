# Parenting Assessment Result Fix Report

**Date:** 23 October 2026
**Scope:** The local project only. No production database, Supabase project, or deployment was touched (see section 8).
**Status:** The fix is implemented and tested locally. Two decisions are waiting for your approval (section 7).

---

## 1. Root cause

The "Psychological Control and Criticism: 84% (Strengths)" result came from several problems stacked together:

| # | Where | Problem |
|---|-------|---------|
| 1 | `scoring.service.ts` | The scoring engine had **no concept of scoring direction**. Every dimension was treated as "higher = better". |
| 2 | `scoring.service.ts` | Strength and growth were decided by comparing the **raw percentage** to `strengthsThresholdPct` and `growthThresholdPct`. A high control score became a "strength". |
| 3 | `scoring.service.ts` | The band label (for example "Strengths") was looked up separately from the strength/growth decision, so the label and the section could disagree. |
| 4 | `scoring.service.ts` | The overall score added the control items without reversing them, which contradicts the instrument description ("Psychological Control is reverse-scored for overall score"). |
| 5 | `recommendations.service.ts` | Recommendations were picked by **lowest raw percentage**. A parent with frequent criticism (high %) never got criticism-related recommendations. |
| 6 | `AssessmentReportView.tsx` | The frontend recalculated the colour/tone with its **own hard-coded 75 / 50 cutoffs**, ignoring the backend. |
| 7 | Report text | Strength and growth cards reused the generic dimension description, so there was no "why this is a strength", behaviour focus, actions, or example. |
| 8 | Report layout | The six required sections did not exist as such. Intermediate dimensions were dropped or forced into a section. |

**In short:** the stored *answers and raw scores* were correct. What was wrong was the *interpretation* of the reverse-scored dimension and everything built on it (label, section, recommendations, overall score, colours).

## 2. Verified direction for each dimension

| Dimension | Direction | Source |
|-----------|-----------|--------|
| Emotional Warmth and Responsiveness | Higher is positive | PSQ instrument description; your brief |
| Structure and Consistent Boundaries | Higher is positive | PSQ instrument description; your brief |
| Autonomy and Independence | Higher is positive | PSQ instrument description; your brief |
| Psychological Control and Criticism | **Higher is a concern** (reverse-scored) | PSQ instrument description ("reverse-scored for overall score"); your brief |

Direction is **not** inferred from names or percentages. It is set explicitly per assessment version in the scoring config:

```json
"reverseScoredFactors": ["<PSYCH_CONTROL_FACTOR_CODE>"]
```

Admins can set this in **Admin → Assessment → Scoring → Scoring direction** (one checkbox per dimension). The server rejects unknown codes.

## 3. Exact classification rules (as now implemented)

For each dimension:

1. **Raw percentage** = `round(sum of selected option values / sum of max option values × 100)`. This is unchanged and is what the progress bar shows ("as you answered").
2. **Interpreted percentage**:
   - For a positive dimension, the interpreted percentage equals the raw percentage.
   - For a reverse-scored dimension, each answer is first reversed as `minOption + maxOption − value` (on a 1–5 scale: 5↔1, 4↔2, 3 stays 3). The same formula is then applied.
   - *Example:* 5 items, raw total 21/25, which is 84%. The reversed total is 30 − 21 = 9/25, which is **36%**.
3. **Classification** uses the interpreted percentage only:
   - If the version's `bands` contain a band covering that value, the band's own `classification` decides: `STRENGTH`, `STEADY` (Developing), or `GROWTH_OPPORTUNITY`. The label shown is the band's name. Label and section therefore always agree.
   - If no band covers the value (a gap in the config), the version's own thresholds apply as a fallback: `≥ strengthsThresholdPct` is a Strength, `≤ growthThresholdPct` is an Area for Growth, and anything else is Developing.
   - **No cutoffs are hard-coded.** All numbers come from the approved scoring config of that assessment version.
4. **Sections**:
   - `STRENGTH` dimensions go to *Your Foundational Strengths*.
   - `GROWTH_OPPORTUNITY` dimensions go to *Your Areas for Growth*, with the greatest need first.
   - `STEADY` dimensions are shown as "Developing" in the breakdown and recommendations. They are **not** forced into either section.
5. **Recommendations**:
   - Built from growth dimensions first, sorted by need.
   - If there are none, they are built from Developing dimensions.
   - Strengths only get a "keep it going" suggestion.
   - Course mappings follow the same order.
6. **Overall score** = sum of the interpreted (reversed where applicable) item values.

## 4. Files changed

**Shared**
- `shared/src/types/index.ts` adds:
  - `ScoringDirection` and `ResultClassification`;
  - `direction`, `interpretedPercentage`, `classification` and interpretation text on each dimension score;
  - richer strength and growth fields;
  - `steadyAreas`.

**Backend**
- `backend/src/modules/assessments/scoring.service.ts`:
  - `reverseScoredFactors` in the scoring config;
  - item-level reversal;
  - interpreted percentage;
  - band-driven classification (`classifyPercentage`);
  - the corrected overall score;
  - optional authored guidance fields per dimension.
- `backend/src/modules/assessments/report-content.ts` (new). It builds the strength, growth and developing cards:
  - Direction-aware fallback text that is non-judgemental and states "not a diagnosis".
  - 3 default actions and an everyday example.
  - Authored guidance always takes priority.
- `backend/src/modules/assessments/recommendations.service.ts`: recommendations follow classification, not raw %.
- `backend/src/modules/assessments/assessments.service.ts`: returns `steadyAreas` on submit and on reading a saved result.
- `backend/src/modules/assessments/admin-assessments.service.ts`:
  - Validates reverse-scored codes.
  - The readiness check flags unknown codes.
  - **"New draft version" now copies the latest version's dimensions, questions, scoring config, disclaimer and course mappings.** Before this change, a new version started empty.

**Frontend**
- `frontend/src/features/assessments/report-model.ts` (new): a single source for the report content. It uses the backend classification and never recalculates from %.
- `frontend/src/features/assessments/components/AssessmentReportView.tsx` (rewritten). It has the six sections in the required order:
  1. Summary: completion date, version and disclaimer.
  2. Breakdown: score, label, bar and explanation for each dimension. Reverse-scored bars are marked "How often (lower is better)".
  3. Strengths: score, explanation, why it is a strength, how to keep it going.
  4. Areas for Growth: score and label, explanation, behaviour focus, 2–3 actions, everyday example.
  5. Personalized Recommendations.
  6. Next Steps.
- `frontend/src/app/globals.css`: print rules. Only the site header, footer and buttons are hidden, bar colours are kept, and cards are not split across pages. The PDF therefore shows exactly the web report.
- `frontend/src/app/(admin)/admin/assessments/[id]/page.tsx`: the "Scoring direction" checkboxes in the Scoring tab.

**Tests (new)**
- `backend/tests/scoring-direction.test.ts`
- `backend/tests/scoring-direction-api.test.ts`
- `frontend/tests/report-view.test.tsx`

## 5. Tests and results

All tests use **synthetic data** in a throwaway local Postgres database (`insight_test` on 127.0.0.1:55432). The API test refuses to run against anything that is not a local `*_test` database.

| Suite | Result |
|-------|--------|
| `scoring-direction.test.ts`: unit tests for direction and classification | **67 / 67 pass** |
| `scoring-direction-api.test.ts`: end-to-end through the real API and DB | **19 / 19 pass** |
| `report-view.test.tsx`: report model, rendered sections, and web vs print | **31 / 31 pass** |
| Existing backend suites (api, database-error, auth, courses, assessments, admin-assessments) | **104 / 104 pass** |
| Existing frontend suites (assessments-frontend 12, admin-assessments-ui 15) | **27 / 27 pass** |
| TypeScript (`tsc`) and ESLint | Clean |

Key cases covered:
- Psych Control at **84% raw becomes 36%, which classifies as Area for Growth** and never as a Strength.
- Boundaries at 0 / 49 / 50 / 74 / 75 / 100.
- A 0–4 option scale.
- A gap in the bands falls back to thresholds.
- Developing dimensions stay out of both sections.
- Recommendations never target a strength.
- The overall score uses reversal.
- The saved result reads back with the same classification.
- A new draft version copies all questions and the direction, and v1 is unchanged.
- Old results are flagged as legacy.
- Only controls are hidden in print.

I also checked the report visually in the browser with a synthetic "Demo Parent Style" assessment. All six sections appear in order, and Psych Control at 90% raw is shown under Areas for Growth.

## 6. Are historical results affected?

- **Stored answers and raw scores are correct.** Nothing about what parents answered was lost or miscalculated.
- **Stored interpretation is wrong for the reverse-scored dimension.** This covers:
  - the band label (for example "Strengths" at 84%);
  - the strength and growth lists;
  - recommendations and course mappings;
  - the overall score.

  Any result where Psych Control scored high was presented incorrectly.
- **What users see now:** old results carry no classification data. The new report therefore:
  - shows them with neutral colours;
  - does not guess a label from the %;
  - shows a note that the result was calculated before the improved scoring and may not be fully accurate.

  No stored record was changed.

**Proposed recalculation plan (NOT implemented; needs your approval):**
1. Take a full backup with the existing `backup-export.js`, and verify that it restores into a test DB.
2. Run a dry-run script on a *restored copy* that recomputes each result from its stored raw answers with the corrected active scoring config. It would output only counts and changed classifications, with no answers or personal data.
3. Review the dry-run summary together.
4. Only after approval, run the update in one transaction that updates only `AssessmentResult` scoring fields, and record an audit log entry per result.

## 7. Unresolved ambiguity (your decisions needed)

1. **The live PSQ configuration could not be inspected.** Production access was off-limits for this task, so I could not confirm:
   - the real factor codes (only `EMOTIONAL_WARMTH` is known from your screenshot);
   - the bands and thresholds;
   - whether every Psych Control item is worded in the same direction.

   The new code does nothing different for the PSQ until Psychological Control is marked reverse-scored in a version's config.
2. **How to apply it to the live PSQ.** Choose one:
   - **Option A (recommended, no SQL):** Admin → the PSQ → *New Draft Version* (it now copies all questions) → Scoring tab → tick *Psychological Control and Criticism* under Scoring direction → approve → publish. New submissions are correct immediately, and old results stay as they are.
   - **Option B:** a reviewed SQL migration that adds `reverseScoredFactors` to the currently active version's config. This needs your explicit approval.
3. **Bands vs thresholds.** When both exist, I treat each band's own `classification` as the source of truth and use thresholds only for gaps. If Dr. Ganguli intended different cutoffs, the bands in the config should be edited. No numbers were invented in code.
4. **Reversal method.** I reverse at item level (`min + max − value`), which is the standard method and matches "reverse-scored". If the instrument intends something else (for example `100 − %`), please say so. The results differ slightly because options start at 1, not 0.
5. **Report wording.** Generic, direction-aware text is used unless authored text exists. Dr. Ganguli can supply her own text per dimension in the scoring config under `guidanceTemplates.<CODE>`, using these fields:
   - `strengthExplanation`, `strengthWhy`, `actionableHabit`;
   - `growthExplanation`, `growthBehavior`, `growthActions` (1–5), `growthExample`;
   - `steadyExplanation`, `steadyTip`.

   Suggested Psych Control text for review (factor code is a placeholder):

```json
"<PSYCH_CONTROL_CODE>": {
  "growthExplanation": "Your answers suggest that criticism, guilt or comparisons come up fairly often. Most parents use these when stressed; noticing it is the first step.",
  "growthBehavior": "Correcting through shame, comparisons with others, or threats, rather than calm limits.",
  "growthActions": [
    "Describe the behaviour, not the child's character.",
    "Avoid comparisons with siblings or other children.",
    "Set limits calmly, with consequences that are stated in advance rather than threats.",
    "Allow respectful disagreement and listen before deciding."
  ],
  "growthExample": "Instead of \"Why can't you be like your sister?\", try \"The homework isn't finished yet. Let's decide together when you'll do it.\"",
  "strengthExplanation": "Criticism, guilt and comparisons rarely come up in your parenting.",
  "strengthWhy": "Children who are corrected without shame tend to feel safer sharing mistakes.",
  "actionableHabit": "Keep naming the behaviour, not the child, when you correct."
}
```

## 8. Production confirmation

- No connection was made to the production Supabase database in this task. All database work used a local throwaway Postgres (`insight_test`, loopback, port 55432). Each run checked this target first, and the API test refuses any other target.
- No production records, migrations, permissions, scoring configs, or assessment versions were changed.
- Nothing was deployed. No Supabase CLI was run and no packages were installed.
- No answers, personal data, credentials or session tokens were written to logs or to this report. Test logs show only a masked database target.
- The educational self-reflection disclaimer is preserved on screen and in print.
- The temporary local test servers and test database used for verification have been stopped.

**Note:** Midway through the work, several of the edited files were reverted on disk by something outside this session. I re-applied all changes and confirmed at the end that every changed file matches the final version. If you use a sync tool or editor that restores files, please check that it does not undo these changes.
