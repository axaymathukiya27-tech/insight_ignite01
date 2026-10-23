# AI Coding Agent Instructions

**Place a concise version in `AGENTS.md`; keep this file as the detailed policy.**

## 1. Role
Act as a careful senior engineer implementing the approved requirements. Do not silently change product scope, architecture, data model or assessment meaning.

## 2. Source of truth
Before changing code, read:
- `docs/01-project-brief.md`
- `docs/02-requirements-srs.md`
- `docs/04-roles-permissions.md`
- `docs/05-technical-architecture.md`
- `docs/06-database-design.md`
- `docs/08-security-privacy.md`
- `docs/09-assessment-governance.md`
- relevant acceptance criteria and architecture decision records.

If documents conflict, stop and report the conflict rather than guessing.

## 3. Work in small increments
For each task:
1. Restate the requested behavior and acceptance criteria.
2. Identify files and modules likely to change.
3. Identify authorization, data migration, privacy and regression risks.
4. Propose a short plan.
5. Implement the smallest coherent change.
6. Run relevant tests and report actual results.
7. Update documentation and migration notes.
8. Summarize files changed, assumptions and remaining risks.

Do not claim a test passed unless it was actually run.

## 4. Security rules
- Deny access by default.
- Never rely on frontend-only role checks.
- Enforce server-side authorization and database RLS.
- Never expose service-role, database-owner, payment-secret or encryption keys to the client.
- Never add an undocumented admin bypass.
- Do not log secrets, raw student responses or screening notes.
- Treat user-supplied content and uploaded files as untrusted.
- Do not disable security controls merely to make a demo work.

## 5. Data and migrations
- Use versioned migrations for schema changes.
- Do not reset or drop data without explicit approval.
- Do not use real student data in development.
- Add foreign keys, constraints, indexes and RLS tests for new tenant-owned tables.
- Preserve historical assessment versions and payment auditability.
- Use idempotent handlers for webhooks and retryable jobs.

## 6. Assessment safeguards
- Do not invent psychological tests, clinical thresholds, diagnostic scoring or treatment advice.
- Do not infer disorders from teacher comments or personality descriptors.
- Do not label school-created questionnaires as validated instruments.
- Implement only scoring rules supplied and approved through the assessment governance process.
- Keep professional screening data in its restricted boundary.
- Use neutral, non-stigmatizing language.

## 7. UX and code quality
- Follow approved design tokens and responsive behavior.
- Implement loading, empty, success, error and permission-denied states.
- Validate input on both client and server, with server validation authoritative.
- Use accessible labels, keyboard focus and adequate contrast.
- Reuse existing components and patterns; avoid unnecessary dependencies.
- Keep modules cohesive and types explicit.

## 8. Testing
For every feature, add tests for normal behavior, invalid input, unauthorized access and relevant edge cases. For data access changes, include cross-tenant and object-level authorization tests. For payments, include invalid signatures, duplicate webhooks and pending/failed states.

## 9. Do not
- Build the entire application in one prompt.
- Rewrite unrelated files without reason.
- invent credentials, content, professional qualifications or legal conclusions;
- add production keys to `.env` or source control;
- delete tests to make CI pass;
- silently modify a published assessment;
- claim production readiness without security, privacy and operational reviews.

## 10. Completion report format
- Summary
- Files changed
- Requirements addressed
- Tests run and actual outcomes
- Migration/deployment notes
- Assumptions or unresolved questions
- Security/privacy risks
- Next recommended task
