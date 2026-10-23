# Technical Architecture

**Status:** Proposed architecture — verify current provider capabilities before implementation  
**Version:** 0.1

## 1. Architecture choice
Start as a modular monolith. Do not introduce microservices until measurable scale or team boundaries justify them.

## 2. Suggested stack
- Next.js + TypeScript for public pages and authenticated portals.
- Tailwind CSS and an accessible component system.
- PostgreSQL as the primary relational database.
- Supabase Auth or another managed identity provider.
- PostgreSQL Row-Level Security (RLS) plus server-side authorization.
- Razorpay or another approved payment provider for India.
- Dedicated video hosting with access controls.
- Private object storage for reports and uploads.
- Managed hosting, centralized error monitoring and encrypted backups.

Provider selection is provisional. Verify pricing, regional availability, data processing terms, security features, limits and contractual obligations before production.

## 3. Logical modules
- `public-site`: public content, contact, SEO.
- `identity`: authentication, profiles, sessions and memberships.
- `school-management`: organizations, campuses, classes, teachers and rosters.
- `parent-portal`: verified guardian links and child profiles.
- `assessment-engine`: templates, versions, assignments, responses and approved scoring.
- `observations`: classroom observations and reviews.
- `professional-screening`: restricted referral, session, result and follow-up.
- `academy`: courses, lessons, assets, enrollment and progress.
- `commerce`: orders, payments, refunds and reconciliation.
- `governance`: consent, retention, audit and privacy requests.
- `notifications`: transactional email/SMS using approved providers.
- `operations`: health checks, backups, incidents and access review.

## 4. Trust boundaries
- Public internet → authenticated application.
- School tenant A ↔ school tenant B.
- School educational data ↔ professional screening data.
- Parent context ↔ school context.
- Course commerce ↔ assessment data.
- Application runtime ↔ privileged database/storage credentials.
- User upload ↔ trusted application data.

Each boundary needs explicit authorization and testing.

## 5. Request flow
Browser → route handler/server action → input schema validation → authentication → authorization/policy check → business service → database/storage/provider → audit event → typed response.

Do not rely on middleware alone for record-level authorization. Re-check authorization at the data access/business-service boundary.

## 6. Data and storage
- PostgreSQL for relational records.
- Private object storage for reports and uploads.
- External video service for course video.
- No student-sensitive content in public buckets.
- Short-lived signed URLs after server authorization.
- Avoid putting personal or sensitive information in analytics events, URLs or logs.

## 7. Background processing
Use a managed queue or reliable job system for email delivery, large roster imports, report generation, webhook retries and retention jobs. Jobs must be idempotent and observable.

## 8. Environments
- Local development: synthetic data only.
- Preview/staging: synthetic or carefully de-identified test data.
- Production: real data only after launch gates pass.
Use separate credentials, storage buckets and databases per environment.

## 9. Configuration and secrets
- Store secrets in deployment secret management/environment variables.
- Commit only `.env.example` with variable names and safe placeholders.
- Never expose service-role, database-owner, payment secret or video-provider secrets to client bundles.
- Rotate credentials and document ownership.
- Avoid sharing production credentials with vibe-coding agents.

## 10. Observability and resilience
- Structured logs with correlation IDs and redaction.
- Metrics for latency, error rate, queue failures and payment reconciliation.
- Alerts for unusual access, repeated failures and backup/restore problems.
- Automated backups and periodic restoration tests.
- Define RPO/RTO with the sponsor before launch.
- Document degraded-mode behavior for provider outages.

## 11. API conventions
- Use typed request/response schemas.
- Validate every external input.
- Return consistent error shapes without leaking internals.
- Use pagination and limits for list endpoints.
- Use idempotency keys for payment and other retryable operations.
- Version APIs where compatibility needs require it.
- Rate-limit authentication, contact, assessment submission and export endpoints.

## 12. Architecture decision triggers
Consider splitting services only when there is evidence of independent scaling, independent ownership, deployment bottlenecks or reliability isolation requirements. Record the rationale in an architecture decision record.
