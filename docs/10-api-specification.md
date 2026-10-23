# API Specification — Initial Contract

**Status:** Draft; adapt to implementation and provider APIs  
**Version:** 0.1

## 1. API conventions
- JSON over HTTPS.
- Authentication through the selected identity provider.
- Validate every request on the server with shared schemas.
- Use stable UUID identifiers; do not treat IDs as authorization.
- Consistent error shape: `{ "error": { "code": "...", "message": "...", "requestId": "..." } }`.
- Do not return internal stack traces or sensitive fields.
- Pagination for lists; bounded page sizes.
- Rate-limit login, contact, roster import, assessment submission and exports.
- Use idempotency keys for payment-related operations.

## 2. Proposed endpoint groups
### Public/content
- `GET /api/public/courses`
- `GET /api/public/courses/{slug}`
- `POST /api/public/contact`

### Account
- `GET /api/me`
- `POST /api/account/close-request`
- `GET /api/me/consents`
- `POST /api/me/consents`
- `POST /api/me/privacy-requests`

### Organizations/schools
- `POST /api/organizations`
- `GET /api/organizations/{organizationId}`
- `POST /api/schools/{schoolId}/classes`
- `POST /api/schools/{schoolId}/roster-imports`
- `GET /api/roster-imports/{importId}`
- `POST /api/schools/{schoolId}/teacher-assignments`

### Observations
- `POST /api/schools/{schoolId}/observations`
- `GET /api/schools/{schoolId}/observations`
- `GET /api/observations/{observationId}`
- `POST /api/observations/{observationId}/reviews`

### Assessment
- `POST /api/assessment-templates`
- `POST /api/assessment-templates/{id}/versions`
- `POST /api/assessment-versions/{id}/submit-review`
- `POST /api/assessment-versions/{id}/publish`
- `POST /api/assessment-assignments`
- `GET /api/assessment-assignments/{id}`
- `POST /api/assessment-assignments/{id}/responses`
- `POST /api/assessment-assignments/{id}/submit`
- `GET /api/assessment-results/{id}`

### Professional screening
- `POST /api/screening-referrals`
- `POST /api/screening-referrals/{id}/sessions`
- `POST /api/screening-sessions/{id}/review`
- `GET /api/screening-results/{id}`

These endpoints are proposals, not a promise that every route belongs in a public API. Some operations may be server actions or internal services. Every endpoint requires an authorization contract.

### Commerce
- `POST /api/orders`
- `GET /api/orders/{id}`
- `POST /api/payments/checkout`
- `POST /api/webhooks/payment-provider`
- `POST /api/orders/{id}/refund-request`
- `GET /api/me/enrollments`
- `GET /api/courses/{courseId}/lessons/{lessonId}/access`

## 3. Authorization contract
For every endpoint document:
- allowed roles;
- required organization/student/case relationship;
- consent/authorization requirements;
- request schema;
- response schema and fields;
- audit event;
- rate limit;
- error cases;
- idempotency behavior;
- data classification.

## 4. Error codes
Suggested stable codes:
- `UNAUTHENTICATED`
- `FORBIDDEN`
- `NOT_FOUND`
- `VALIDATION_ERROR`
- `CONSENT_REQUIRED`
- `CONFLICT`
- `RATE_LIMITED`
- `PAYMENT_PENDING`
- `PAYMENT_FAILED`
- `INSTRUMENT_NOT_APPROVED`
- `RESOURCE_EXPIRED`
- `INTERNAL_ERROR`

Avoid confirming whether another user's private resource exists; return a consistent not-found/forbidden behavior according to the threat model.

## 5. Payment webhook requirements
- Verify signature using the provider's official procedure.
- Persist event ID uniquely.
- Reject invalid signatures.
- Process idempotently and safely retry.
- Reconcile order, amount, currency and provider state.
- Grant entitlement only after confirmed success.
- Log event metadata without card data or unnecessary personal information.
- Monitor events stuck in retry or reconciliation.

## 6. File access
Do not expose permanent public URLs for sensitive files. Authorize access, generate a short-lived URL and audit the download where appropriate. Validate file type/size and scan uploads.
