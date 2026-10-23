# Roles, Permissions and Authorization Policy

**Status:** Draft — security-critical  
**Version:** 0.1

## 1. Authorization model
Use RBAC combined with relationship-based and attribute-based checks. A role grants a set of possible actions, but the action must also satisfy organization, class, child-link, case-assignment, record sensitivity, consent and status conditions.

**Default:** deny. Frontend hiding is not enforcement.

## 2. Roles
- `platform_admin`: platform configuration; no routine access to student content.
- `security_operator`: security monitoring and incident handling; sensitive content access only through approved break-glass procedure.
- `content_editor`: public content and course publishing.
- `school_admin`: own organization's school operations.
- `teacher`: assigned classes/students only.
- `parent_guardian`: verified linked child and explicitly permitted information.
- `student`: own account and permitted own feedback.
- `assessment_professional`: assigned assessment/screening cases within approved professional scope.
- `billing_support`: payment/order metadata; no student assessment access.
- `support_agent`: limited account troubleshooting; no routine access to sensitive records.

## 3. Permission matrix
| Action | Platform admin | School admin | Teacher | Parent | Student | Professional | Content editor |
|---|---|---|---|---|---|---|---|
| Manage platform settings | Yes | No | No | No | No | No | No |
| Manage school memberships | Support-only | Own school | No | No | No | No | No |
| Import roster | No by default | Own school | Assigned classes if granted | No | No | No | No |
| Record observations | No by default | Limited | Assigned students | No | No | Assigned cases if relevant | No |
| Draft school questionnaire | No by default | Configure | If granted | No | No | Review if assigned | No |
| Approve professional instrument | No by default | No | No | No | No | Authorized scope | No |
| View educational results | Support-only | Own school, limited | Assigned students | Own child, permitted report | Own feedback | Assigned cases | No |
| View screening records | No by default | No by default | No by default | Authorized disclosure only | Appropriate disclosure only | Assigned case only | No |
| Publish courses | No unless separately assigned | No | No | No | No | Only if separately assigned | Yes |
| View payment status | Limited | Optional billing scope | Own purchases only | Own purchases | Own purchases | Own purchases | No by default |
| View audit logs | Security-only | Own school, restricted | No | No | No | Case-scoped if authorized | No |

## 4. Mandatory authorization checks
Every request that reads or modifies a protected record must validate:
1. authenticated user and active account;
2. active membership in the relevant organization, if applicable;
3. relationship to the target class/student/child/case;
4. action permission;
5. record sensitivity and professional scope;
6. consent/authorization status where required;
7. record state and any time-limited access;
8. audit requirements for the operation.

## 5. Database policy rules
- Every school-owned row must have a trusted organization/school scope.
- RLS must derive user identity from the verified auth context, not user-supplied IDs.
- Do not expose service-role or database-owner credentials to the browser.
- Security-definer functions, if used, must be minimal, reviewed and have safe search paths.
- Restrict direct table access; expose only required operations.
- File access must check the same authorization policy as database access.
- Exports and bulk operations require explicit permissions and audit events.
- Avoid broad administrator access to sensitive tables.

## 6. Break-glass access
If emergency support access is necessary:
- require a defined incident or support ticket;
- require justification and authorized approval where feasible;
- grant least-privilege, time-limited access;
- log every read and change;
- notify/review according to policy;
- revoke access after use.
Do not implement a hidden universal backdoor.

## 7. Revocation
Membership removal, parent-link revocation, case reassignment or professional suspension must promptly prevent future access. Define handling for existing sessions, cached data, signed URLs and exports.

## 8. Required security tests
Test each role against:
- own record;
- another user's record;
- another school;
- altered URL/object ID;
- bulk export;
- file download;
- revoked membership;
- expired consent;
- professional case not assigned;
- direct API request bypassing UI.
