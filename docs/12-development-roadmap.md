# Development Roadmap and Prioritization

**Status:** Initial roadmap; estimate after technical discovery  
**Version:** 0.1

## 1. Delivery principles
- Ship one testable vertical slice at a time.
- Use synthetic data until the relevant launch gate passes.
- Define acceptance criteria before coding.
- No production credentials in the coding-agent environment.
- Do not develop clinical scoring until instrument governance is approved.

## 2. Phases
### Phase 0 — Discovery and approval
Deliverables: signed project brief, SRS, approved role matrix, wireframes, instrument governance decisions, provider shortlist and legal/privacy review plan.
Exit: unresolved decisions are documented and assigned.

### Phase 1 — Foundation
Deliverables: repository, CI checks, design system, public site skeleton, authentication, profiles, organization membership, migrations, RLS and audit events.
Exit: authorization tests prove basic isolation.

### Phase 2 — School and parent onboarding
Deliverables: school/class management, teacher assignments, roster import, parent account and guardian verification, consent records.
Exit: role-specific end-to-end tests pass.

### Phase 3 — Educational assessment
Deliverables: questionnaire drafts, versioning, approval states, assignments, response capture, classroom observations and neutral reports.
Exit: only approved versions can be assigned; no diagnosis generation exists.

### Phase 4 — Learning Academy
Deliverables: course catalogue, authoring, private lesson assets, checkout, webhook verification, enrollment and progress.
Exit: payment and entitlement tests pass.

### Phase 5 — Professional screening
Deliverables: approved instrument registry, referral, restricted session/results, professional review and follow-up.
Exit: written professional approval, privacy/legal sign-off and access-control review.

### Phase 6 — Production readiness
Deliverables: monitoring, backup/restore tests, incident runbook, security review, load tests, accessibility review, pilot feedback and operational ownership.
Exit: launch checklist signed.

## 3. Priority framework
- P0: authentication, authorization, tenant isolation, consent, audit and secrets.
- P1: school/parent onboarding, roster import, observations and core course purchase.
- P2: reporting, progress, notifications and administration improvements.
- P3: advanced analytics and AI assistance, only after validation and governance.

## 4. Sprint planning template
Sprint goal: __________________  
Included stories: __________________  
Dependencies: __________________  
Risks: __________________  
Acceptance tests: __________________  
Demo scenario: __________________  
Unfinished work and reason: __________________  
Release decision: __________________

## 5. Change control
A change affecting permissions, schema, assessment meaning, scoring, consent, payments or retention requires:
1. written change request;
2. impact analysis;
3. stakeholder approval;
4. migration and test plan if applicable;
5. documentation update;
6. post-change verification.

## 6. Risk register
| Risk | Likelihood/impact | Mitigation | Owner |
|---|---|---|---|
| Cross-school data leak | High impact | RLS, service checks, adversarial tests | Technical lead |
| Unvalidated test used as diagnostic | High impact | Instrument governance, labels, review | Assessment lead |
| Payment grants access incorrectly | Medium/high | Verified webhook, idempotency, reconciliation | Engineering |
| Parent link is fraudulent | High impact | Guardian verification and audit | Operations |
| Vendor outage/data issue | Medium/high | Vendor review, backups, exit plan | Operations |
| Scope expansion delays launch | High | Phase gates and change control | Product owner |
