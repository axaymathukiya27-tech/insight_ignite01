# Dr. Nivedita Ganguli Platform — Repository README

## Project
Custom public website, Learning Academy and school/parent student-support assessment platform.

## Status
Planning / documentation baseline. This README does not imply the application has been implemented or audited.

## Product modules
- Public website and course catalogue
- Learning Academy and commerce
- Multi-tenant school management
- Parent and child profile workflows
- Educational questionnaires and classroom observations
- Restricted professional wellbeing screening
- Governance, consent, audit and privacy operations

## Technology
Proposed: Next.js, TypeScript, Tailwind CSS, PostgreSQL, managed authentication, RLS, managed hosting, payment provider and dedicated video hosting. Confirm actual versions and providers during implementation.

## Getting started (to be completed after repository initialization)
1. Install the supported Node.js version and package manager.
2. Copy `.env.example` to a local environment file and fill only local/test values.
3. Start the local database/backend using the selected provider's current official instructions.
4. Apply migrations.
5. Seed synthetic development data only.
6. Run lint, type checks and tests.
7. Start the development server.

Do not paste production secrets into a coding assistant or commit them to Git.

## Documentation
See `/docs` for the project brief, SRS, workflows, RBAC, architecture, schema, UI/UX, privacy, assessment governance, API, tests, roadmap, Definition of Done, deployment runbook and AI coding policy.

## Development rules
- Use migrations; do not alter production data manually.
- Enforce authorization server-side and in database policies.
- Use synthetic student data.
- Do not invent assessment scoring or diagnoses.
- Require tests for permission changes.
- Update documentation when requirements or architecture change.

## Launch gates
No real student data until privacy/legal review, role/tenant isolation testing, consent flows, backup restoration, incident response and assessment governance are approved.
