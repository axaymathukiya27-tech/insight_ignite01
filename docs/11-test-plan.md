# Test Plan and Acceptance Criteria

**Status:** Draft  
**Version:** 0.1

## 1. Testing strategy
Use unit, integration, database/RLS, end-to-end, accessibility, performance, security and user-acceptance tests. Test with synthetic data. Production-like staging must use separate credentials and storage.

## 2. Unit tests
- Input schema validation and boundary conditions.
- Role and permission functions.
- Assessment version state transitions.
- Payment state transitions and idempotency logic.
- Consent state handling.
- Roster parsing and normalization.
- Report field filtering.

## 3. Database/RLS tests
For every protected table, test:
- allowed read/write in own scope;
- denied access to another school;
- denied access to unrelated child;
- denied access to unassigned professional case;
- denied access after membership/link revocation;
- denied access after relevant consent state changes;
- restricted screening tables inaccessible to ordinary roles;
- direct API/database query cannot bypass intended policy.

## 4. End-to-end scenarios
1. Visitor browses a course and completes a verified purchase.
2. Payment provider sends the same webhook twice; one entitlement is created.
3. Failed/pending payment does not grant access.
4. School admin imports valid and invalid roster rows and receives accurate errors.
5. Teacher records an observation for an assigned student.
6. Teacher attempts to access a student outside their class and is denied.
7. Parent verifies account and guardian relationship, then sees only the linked child's permitted report.
8. Parent attempts to access another child's report and is denied.
9. Professional accesses an assigned screening case; an unassigned professional is denied.
10. Assessment version is published, assigned and later retired without changing historical version.
11. User is removed from an organization and access is revoked.
12. Authorized privacy request is tracked through completion.

## 5. Security testing
- Broken object-level authorization (BOLA/IDOR).
- Cross-tenant access.
- Privilege escalation and mass assignment.
- Session revocation and MFA behavior.
- CSRF/XSS/SQL injection/file upload risks.
- Rate limits and abuse scenarios.
- Secret leakage and dependency vulnerabilities.
- Signed URL expiry and unauthorized download.
- Webhook signature forgery and replay.
- Log redaction and sensitive data exposure.

Use a qualified security tester before production. Passing automated tests does not replace a penetration test.

## 6. Accessibility testing
- Keyboard-only navigation.
- Visible focus.
- Labels and error associations.
- Contrast and zoom/reflow.
- Screen-reader review for key workflows.
- Accessible charts and status indicators.
- Mobile form usability.

## 7. Acceptance criteria template
Feature: __________________  
Preconditions: __________________  
Role and scope: __________________  
Action: __________________  
Expected success: __________________  
Expected denial/error: __________________  
Audit event expected: __________________  
Privacy/consent condition: __________________  
Automated test reference: __________________  
Reviewer and sign-off: __________________

## 8. Release gate
Do not launch if:
- any critical/high authorization issue remains unresolved;
- cross-tenant isolation is not proven;
- payment reconciliation is unreliable;
- screening instruments or workflows lack approval;
- consent and privacy workflows are incomplete;
- secrets are exposed;
- backup restoration and incident response have not been tested.
