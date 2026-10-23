# Database Design and Data Dictionary

**Status:** Logical design draft; requires migration-level review  
**Version:** 0.1

## 1. Design principles
- UUID primary keys; timestamps in UTC.
- Foreign keys and explicit ownership columns.
- Tenant scope enforced in database policies, not trusted from client input.
- Sensitive data minimized and separated.
- Published assessment versions immutable.
- Money stored as integer minor units (e.g., paise).
- Avoid generic polymorphic references unless referential integrity is enforced by a unified subject model.
- Define deletion, archival and retention behavior before production.

## 2. Identity and tenancy
### `profiles`
`id UUID PK`, `auth_user_id UUID UNIQUE NOT NULL`, `display_name`, `status`, `created_at`, `updated_at`.

### `organizations`
`id UUID PK`, `name`, `organization_type`, `status`, `plan_id NULL`, timestamps.

### `organization_memberships`
`id UUID PK`, `organization_id FK`, `user_id FK`, `role`, `status`, `created_at`, `revoked_at NULL`; unique active membership policy per organization/user/role as appropriate.

### `schools`
`id UUID PK`, `organization_id FK`, `name`, `address fields minimized`, `status`.

### `academic_years`
`id UUID PK`, `school_id FK`, `label`, `starts_on`, `ends_on`, `status`.

### `classes`
`id UUID PK`, `school_id FK`, `academic_year_id FK`, `name`, `section`, `status`.

### `students`
`id UUID PK`, `school_id FK`, `school_student_code`, `status`, `created_at`; unique `(school_id, school_student_code)` when present. Store only necessary identity fields; define separate access to name/date of birth.

### `teacher_assignments`
`id UUID PK`, `teacher_user_id FK`, `class_id FK`, optional `subject_id`, `status`, dates.

### `class_memberships`
`id UUID PK`, `class_id FK`, `student_id FK`, `status`, dates; enforce that class and student belong to the same school.

## 3. Parent and assessment subject model
Prefer a unified `assessment_subjects` table to avoid unsafe polymorphic foreign keys:
- `assessment_subjects`: `id UUID PK`, `subject_type` (`school_student` or `parent_child`), `school_student_id NULL FK`, `child_profile_id NULL FK`, `created_by_user_id`, `status`, timestamps. A CHECK constraint ensures exactly one source FK is populated.
- `parent_student_links`: `id UUID PK`, `parent_user_id FK`, `school_student_id NULL FK`, `child_profile_id NULL FK`, `relationship`, `verification_status`, `verified_at`, `revoked_at`; CHECK exactly one child reference.
- `child_profiles`: `id UUID PK`, `created_by_user_id FK`, minimal fields, `status`, timestamps.
- Cross-context linkage must be explicit and audited; do not silently merge school and parent identities.

## 4. Consent and governance
### `consent_records`
`id UUID PK`, `subject_id FK`, `actor_user_id FK`, `purpose_code`, `notice_version`, `status`, `method`, `recorded_at`, `revoked_at`, `evidence_ref NULL`, timestamps. Store minimal evidence; protect any uploaded documents.

### `retention_policies`
`id UUID PK`, `data_category`, `retention_period`, `trigger_event`, `deletion_method`, `legal_hold_behavior`, `approved_by`, `version`.

### `data_subject_requests`
`id UUID PK`, `requester_id`, `subject_id`, `request_type`, `status`, `received_at`, `due_at`, `resolution`, `completed_at`.

## 5. Assessment templates and results
### `assessment_templates`
`id UUID PK`, `owner_organization_id NULL`, `created_by`, `category`, `purpose`, `intended_audience`, `language`, `validation_status`, `approval_status`, `status`, timestamps.

### `assessment_versions`
`id UUID PK`, `template_id FK`, `version_number`, `schema_json`, `scoring_config_ref NULL`, `approved_by NULL`, `published_at NULL`, `retired_at NULL`; unique `(template_id, version_number)`.

### `assessment_items`
`id UUID PK`, `version_id FK`, `item_key`, `prompt`, `response_type`, `validation_json`, `position`; unique `(version_id, item_key)`.

### `assessment_assignments`
`id UUID PK`, `version_id FK`, `subject_id FK`, `assigned_by`, `source_context`, `status`, `assigned_at`, `due_at`, `submitted_at`; ensure assignment context is authorized.

### `assessment_responses`
`id UUID PK`, `assignment_id FK`, `item_id FK`, `response_encrypted` or appropriately protected JSON, timestamps. Validate that item belongs to the assigned version. Apply strict access policy.

### `assessment_results`
`id UUID PK`, `assignment_id FK`, `scoring_version NULL`, `result_payload_protected`, `interpretation_status`, `review_status`, `generated_at`; results must be reproducible from the correct version where scoring is approved.

### `assessment_reviews`
`id UUID PK`, `result_id FK`, `reviewer_user_id FK`, `review_status`, `notes_protected NULL`, `reviewed_at`; access limited by case and role.

## 6. Classroom observations
`observation_records`: `id`, `school_id`, `student_id`, `teacher_id`, `class_id`, `observed_at`, `context_code`, `factual_summary`, `interpretation_separate NULL`, `status`, timestamps.
`observation_behaviours`: `id`, `observation_id`, `behaviour_code`, `frequency NULL`, `duration_seconds NULL`, `notes_protected NULL`.
`observation_reviews`: `id`, `observation_id`, `reviewer_id`, `outcome`, `reviewed_at`.

Enforce same-school relationships for school, class and student. Do not auto-classify behaviour as a disorder.

## 7. Professional screening
`screening_referrals`: `id`, `subject_id`, `referral_reason_code`, `referred_by`, `status`, timestamps.
`screening_instruments`: `id`, `name`, `version`, `license_reference`, `age_range`, `language`, `permitted_use`, `approval_status`, `approved_by`.
`screening_sessions`: `id`, `referral_id`, `professional_id`, `instrument_id`, `status`, timestamps.
`screening_results`: `id`, `session_id`, `protected_result`, `review_status`, `reviewed_by`, `reviewed_at`.
`professional_followups`: `id`, `session_id`, `action_category`, `due_at`, `status`, protected notes if required.

These tables need stricter policies than general school records. Do not create scoring logic until an instrument and scoring rights are approved.

## 8. Courses and commerce
`courses`: `id`, `slug UNIQUE`, `title`, `description`, `status`, `published_at`.
`course_versions`: `id`, `course_id`, `version_number`, `content_snapshot`, `published_at`.
`course_lessons`: `id`, `course_version_id`, `title`, `position`, `asset_id`.
`course_assets`: `id`, `storage_key`, `asset_type`, `access_policy`, `status`.
`orders`: `id`, `user_id`, `amount_minor`, `currency`, `status`, `idempotency_key`, timestamps.
`payments`: `id`, `order_id`, `provider`, `provider_payment_id`, `status`, `amount_minor`, `currency`, timestamps.
`payment_webhook_events`: `id`, `provider_event_id UNIQUE`, `signature_valid`, `received_at`, `processed_at`, `processing_status`.
`course_enrollments`: `id`, `user_id`, `course_id`, `order_id NULL`, `status`, `expires_at`, timestamps.
`course_progress`: `id`, `enrollment_id`, `lesson_id`, `completed_at`, `last_position NULL`.

## 9. Audit and operations
`audit_events`: actor, organization scope, action, resource type/id, outcome, timestamp, correlation ID, minimal metadata.
`access_reviews`: user, role/scope, reviewer, reviewed_at, outcome.
`security_incidents`: severity, status, systems affected, response steps, timeline, resolution.
`notification_jobs`: recipient reference, purpose code, delivery status, retry metadata; no sensitive content in logs.

## 10. Constraints and indexes
- Index all foreign keys used in access checks.
- Index common list filters `(school_id, status)`, `(class_id, status)`, `(subject_id, status)`, `(user_id, status)`.
- Unique provider event ID for webhook idempotency.
- Unique order idempotency key per applicable scope.
- Validate numeric bounds and enumerated states in the database where feasible.
- Use CHECK constraints for source context and status transitions where practical.
- Add RLS policies and automated tests for every tenant-scoped table.
- Define cascade/restrict behavior explicitly; avoid cascading deletion of audit or legally retained records.

## 11. Migration process
Every schema change is a versioned migration, reviewed and tested against staging. Never ask a coding agent to edit production data directly. Seed only synthetic records. Document backfill and rollback/recovery steps.
