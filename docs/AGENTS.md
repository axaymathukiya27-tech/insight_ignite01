# AGENTS.md — Coding Agent Rules

Read `docs/01-project-brief.md`, `docs/02-requirements-srs.md`, `docs/04-roles-permissions.md`, `docs/05-technical-architecture.md`, `docs/06-database-design.md`, `docs/08-security-privacy.md`, `docs/09-assessment-governance.md` and the relevant tests before making material changes.

## Rules
- Implement one small, testable task at a time.
- Treat approved docs as the source of truth. Report conflicts and ask rather than guessing.
- Enforce permissions on the server and in database RLS. Never rely on UI hiding.
- Deny access by default and test cross-tenant/object-level access.
- Use migrations for schema changes. Never reset or delete data without explicit approval.
- Use synthetic student data in development.
- Keep secrets out of source control and client bundles.
- Do not invent psychometric tests, clinical thresholds, diagnoses or treatment advice.
- Preserve immutable assessment versions and payment auditability.
- Add tests for normal, invalid, unauthorized and edge-case behavior.
- Report only tests actually run and include unresolved risks.
- Do not claim production readiness without security, privacy, professional and operational review.
