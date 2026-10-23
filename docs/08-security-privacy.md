# Security, Privacy and Child-Safety Requirements

**Status:** Draft for legal/security review — not legal advice  
**Version:** 0.1

## 1. Data categories
- Public: published biography, course descriptions, public resources.
- Account: login identifiers, profile and billing metadata.
- School educational: student roster, class membership, classroom observations.
- Assessment: answers, results and reports.
- Highly restricted professional: emotional-wellbeing screening, referrals and professional notes.
- Operational: audit events, logs, support tickets and security incidents.

## 2. Data minimization
Collect only what is necessary for a documented purpose. Avoid unnecessary date of birth, medical history, family information, precise location or sensitive free text. Define the purpose and access level for every field.

## 3. Consent and lawful basis
- Document purposes and notices before collection.
- Determine the applicable lawful basis and who is responsible for processing in each context.
- Implement verifiable parental consent where required by applicable law.
- Record notice version, purpose, actor, timestamp, status and withdrawal.
- Withdrawal must stop future processing where applicable; define what happens to existing records and legally required retention.
- Do not treat school enrollment or a broad checkbox as blanket permission for every assessment or screening.
- Legal counsel must approve the final consent and notice design.

## 4. Access controls
- Deny by default.
- Enforce server-side checks and PostgreSQL RLS.
- Test cross-tenant isolation and parent-child links.
- Separate screening records from educational records.
- MFA for privileged accounts.
- Short-lived sessions and revocation process.
- No unrestricted support backdoor.
- Audit sensitive reads, exports, role changes and report downloads.

## 5. Technical controls
- HTTPS/TLS and managed encryption at rest.
- Field-level encryption for selected sensitive fields where threat analysis justifies it.
- Keep encryption keys separate from encrypted data.
- Private storage buckets and short-lived signed URLs after authorization.
- Secure cookies, CSRF protection where relevant, CSP and safe headers.
- Input validation, output encoding, parameterized queries and file-upload scanning.
- Rate limiting and abuse monitoring.
- Dependency, secret and static-analysis scanning.
- No privileged credentials in browser code.
- No sensitive data in analytics, URL parameters, error messages or logs.

## 6. Assessment safety
- Maintain an approved instrument registry with version, license, intended use, age range, language and approver.
- Do not claim validation without supporting evidence.
- Local school questionnaires must be clearly labelled.
- Separate observed behaviour from interpretation.
- Do not infer diagnosis from behaviour, personality, response patterns or free-text notes.
- No automated disease labels or treatment recommendations.
- Professional screening requires defined oversight, referral and follow-up procedures.

## 7. Retention and deletion
Create a retention schedule by data category and legal/contractual requirement. Document triggers, deletion method, backups, legal holds, audit retention and confirmation. Do not promise immediate erasure from immutable backups unless the actual backup design supports it.

## 8. Vendors and contracts
Review data-processing terms, sub-processors, storage region, access controls, incident notification, deletion, export, business continuity and contract termination for hosting, identity, video, payments, email and analytics providers.

## 9. Incident response
Document:
1. Detection and reporting channels.
2. Triage and severity classification.
3. Containment and credential revocation.
4. Evidence preservation and investigation.
5. Legal and contractual notification assessment.
6. Recovery and validation.
7. Post-incident review and corrective actions.

Assign named responsible roles before launch.

## 10. Legal review
For an India launch, review the Digital Personal Data Protection Act, 2023 and Digital Personal Data Protection Rules, 2025, including commencement notifications and applicable child-data provisions in force on launch date. Review other applicable laws and school contracts as needed. Do not assume all provisions commence simultaneously.

## 11. Launch blockers
- Unresolved cross-tenant access issue.
- Public storage containing student data.
- Missing required consent/notice flow.
- Unapproved screening instrument or scoring logic.
- Exposed secret or privileged key.
- Untested backup restoration.
- No incident-response owner.
- No legal/professional approval for sensitive workflows.
