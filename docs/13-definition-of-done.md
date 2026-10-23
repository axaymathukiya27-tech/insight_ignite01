# Definition of Done (DoD)

A feature is complete only when all applicable items below are satisfied.

## 1. Requirements
- [ ] User story and acceptance criteria are documented.
- [ ] Product owner has reviewed the behavior.
- [ ] Assumptions and limitations are visible in documentation.
- [ ] Out-of-scope behavior is not accidentally implemented.

## 2. Code quality
- [ ] Code is typed and follows project conventions.
- [ ] Inputs are validated on the server.
- [ ] Errors are handled and do not leak secrets or private data.
- [ ] Loading, empty, success, validation and failure states are implemented.
- [ ] No placeholder functionality is presented as complete.
- [ ] No dead code or debug statements remain.

## 3. Security and privacy
- [ ] Authentication and authorization are enforced server-side.
- [ ] Database/RLS policies are updated and tested where applicable.
- [ ] Cross-tenant and object-level access tests pass.
- [ ] Consent/authorization checks are applied where required.
- [ ] Sensitive data is minimized and logs are redacted.
- [ ] Secrets are not committed or exposed to the client.
- [ ] File access and exports are protected.

## 4. Data integrity
- [ ] Migrations are versioned and reviewed.
- [ ] Foreign keys, uniqueness and validation constraints are appropriate.
- [ ] Retry and duplicate-event behavior is safe.
- [ ] Rollback/recovery or forward-fix strategy is documented.
- [ ] No real sensitive data is used in tests.

## 5. Testing
- [ ] Unit and integration tests pass.
- [ ] Relevant end-to-end tests pass.
- [ ] Accessibility checks pass for the affected flow.
- [ ] Critical error and permission-denied paths are tested.
- [ ] Payment/assessment-specific tests pass where relevant.

## 6. UX and documentation
- [ ] UI matches approved design and is responsive.
- [ ] Text is clear and non-stigmatizing.
- [ ] Help/error copy is accurate.
- [ ] README/API/schema docs are updated.
- [ ] Screenshots/demo data use synthetic records.

## 7. Review and release
- [ ] Code review completed.
- [ ] CI checks pass.
- [ ] No unresolved critical/high issue remains.
- [ ] Product owner signs off.
- [ ] Rollout/monitoring plan is defined.
