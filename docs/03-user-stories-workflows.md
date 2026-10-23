# User Stories and Workflows

**Status:** Draft  
**Version:** 0.1

## 1. Public visitor
- As a visitor, I can understand Dr. Nivedita's verified professional background and services.
- As a visitor, I can browse courses, see price and terms, and contact the team.
- As a visitor, I can use the website on mobile and keyboard-only navigation.

**Acceptance:** No unverified claims or private records are displayed; public forms validate and rate-limit requests.

## 2. Course learner
- As a learner, I can register, purchase a course, access lessons after payment confirmation, track progress and access permitted resources.
- As a learner, I can see order status and receive support for failed or duplicate payments.

**Workflow:** Course page → checkout → server-created order → payment provider → verified webhook/reconciliation → enrollment → lesson access.

**Acceptance:** A forged success redirect cannot grant access; repeated webhook delivery does not duplicate an enrollment or charge.

## 3. Platform administrator
- As a platform administrator, I can manage platform configuration and organization lifecycle.
- I cannot browse sensitive student records by default.
- I can use controlled, audited support access only when authorized.

**Acceptance:** Support access is scoped, time-limited where possible, justified and audited.

## 4. School administrator
- As a school admin, I can set up my school, academic year, classes and teacher memberships.
- I can import a roster, preview errors, correct them and re-import safely.
- I can review permitted school-level reports without seeing restricted professional screening notes.

**Workflow:** Create school → add members → create academic year/classes → import roster → validate → confirm import → assign teachers.

**Acceptance:** A school admin cannot access another school's records through UI, API, export or direct object ID.

## 5. Teacher
- As a teacher, I can view assigned classes and students.
- I can record observable behaviour with context and date.
- I can create a draft school questionnaire if my permissions allow.
- I can assign approved questionnaires only when consent/authorization checks pass.
- I see only educational results authorized for my role.

**Acceptance:** Teacher free text cannot trigger automatic diagnosis or disease labels.

## 6. Parent or guardian
- As a parent, I can create an account, verify my identity/guardian relationship and manage my own eligible child assessment journey.
- I can view only my linked child's permitted reports.
- I can review relevant notices and manage applicable consent choices.
- I can request correction or deletion as applicable.

**Workflow:** Register → verify account → create/request child profile → guardian verification → notice/consent → choose eligible service → complete assessment or book professional session → view authorized report.

**Acceptance:** Parent A cannot access Parent B's child by guessing an ID; parent profiles do not automatically merge with school records.

## 7. Student
- As a student, where the approved workflow permits, I can complete an assigned age-appropriate questionnaire and view suitable feedback.
- I cannot see another student's answers or reports.

**Acceptance:** Student-facing language is age-appropriate and avoids stigmatizing labels.

## 8. Psychologist / assessment professional
- As a professional, I can manage only assigned cases, use approved instruments, review results and record follow-up.
- I can distinguish locally developed questionnaires from validated instruments.
- I cannot change a published assessment version silently.

**Acceptance:** Professional credentials, scope and permissions are verified through the sponsor's governance process.

## 9. Core exception workflows
- Expired/revoked consent: block new assignment or collection as policy requires; route to authorized review.
- User removed from school: revoke membership access and invalidate relevant sessions.
- Payment pending/failed: no course entitlement until confirmed; show clear status.
- Duplicate payment webhook: process idempotently.
- Roster import partial failure: show row-level errors and preserve a safe retry path.
- Suspected privacy incident: contain access, preserve evidence and follow incident response.
- Screening concern: follow the professionally approved referral/escalation protocol; do not invent automatic clinical decisions.

## 10. Cross-context sharing
School and parent contexts remain separate by default. Any permitted sharing must specify:
- source and destination context;
- purpose and legal/consent basis;
- data fields shared;
- authorized approver;
- date/time and expiration/review;
- audit record and revocation behavior.
