# Project Brief — Dr. Nivedita Ganguli Learning & Student Assessment Platform

**Document status:** Draft for stakeholder approval  
**Version:** 0.1  
**Owner:** Dr. Nivedita Ganguli / project sponsor (confirm)  
**Prepared for:** Product, design, engineering, privacy, school and professional stakeholders

## 1. Executive summary
Build a custom, responsive platform that combines (1) a public professional website and online course academy and (2) a multi-tenant student-support and assessment portal for schools and individual parents. The platform supports educational questionnaires, strengths-oriented assessments, classroom observations, and a separately governed emotional-wellbeing screening workflow. It must not diagnose students automatically or label children from teacher opinions.

## 2. Problem and opportunity
The sponsor needs one trusted digital presence to publish professional information, sell courses, and offer structured assessment/support workflows to schools and families. Schools need roster and classroom workflows; parents need a private view of their own child's permitted information; professionals need restricted workflows for approved screening and review.

## 3. Product goals
- Establish a credible public website for Dr. Nivedita Ganguli.
- Publish and sell recorded courses and, if needed, workshops.
- Give schools isolated workspaces to manage classes, teachers, students and authorized observations.
- Allow individual parents to create a verified account and manage an eligible child assessment journey.
- Support approved personality/strengths assessments without inventing instruments or scoring.
- Keep emotional-wellbeing screening separate and under qualified professional oversight.
- Protect children's data through purpose limitation, strict access control, auditability and retention rules.
- Make the system maintainable for a small development team.

## 4. Out of scope for initial release
- Automated clinical diagnosis or disease prediction.
- AI-based diagnosis from teacher free text, photos, voice or other inferred signals.
- Unvalidated psychometric scoring or claims of clinical validity for school-created questionnaires.
- Public social profiles or student leaderboards.
- Sharing a child's records between school and parent contexts without a documented, authorized workflow.
- Custom video streaming infrastructure built from scratch.
- Complex microservices architecture before scale justifies it.

## 5. Primary users
- Public visitor / prospective course customer
- Course learner
- Platform administrator
- School administrator
- Teacher
- Parent or legal guardian
- Student (only where age, consent and workflow permit)
- Qualified psychologist / assessment professional
- Content editor / course manager
- Support/security operator with restricted access

## 6. Success measures
Set baselines and targets after stakeholder discovery. Candidate measures:
- Course page-to-purchase conversion rate
- Payment success and reconciliation rate
- Course completion rate
- School onboarding completion rate
- Roster import success rate and actionable error rate
- Percentage of access-control tests passing
- Number of cross-tenant access failures in security testing (target: zero)
- Consent/notice records present where required
- Report generation success rate
- Support response time and incident resolution time

Do not use student personality or wellbeing scores as business KPIs.

## 7. Assumptions requiring confirmation
- Exact professional qualifications, biography, services and claims used on public pages.
- School subscription model and pricing.
- Whether individual parents pay per assessment, per session or via a professional service.
- Approved assessment instruments, licenses, age ranges, languages and intended uses.
- Which professionals are qualified and authorized to review screening.
- Legal roles of platform operator, schools and any service providers.
- Hosting region, retention schedules, and legal commencement requirements.
- Payment provider and video-hosting provider.
- Brand identity, domain, content ownership and support contact.

## 8. Constraints and principles
- Build incrementally; do not prompt an AI coding agent to create the whole product in one pass.
- Use synthetic data in development and demos.
- Deny access by default; verify every sensitive operation server-side.
- Keep school, parent, course and professional screening data logically separated.
- Use migrations, tests and reviewed changes for all schema changes.
- Publish only content and instruments approved by the appropriate owner.
- Obtain legal, privacy and professional review before production use.

## 9. Release strategy
Phase 1: public site and secure foundation.  
Phase 2: school and parent onboarding.  
Phase 3: educational questionnaires and observations.  
Phase 4: course academy and payment.  
Phase 5: professional screening, only after governance approval.  
Phase 6: security validation and limited pilot.

## 10. Approval
Sponsor: __________________ Date: __________  
Product owner: ______________ Date: __________  
Technical lead: ______________ Date: __________  
Privacy/legal reviewer: _______ Date: __________  
Assessment professional: _____ Date: __________
