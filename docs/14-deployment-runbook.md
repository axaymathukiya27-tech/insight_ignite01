# Deployment and Operations Runbook

**Status:** Draft; complete with selected providers before launch  
**Version:** 0.1

## 1. Environments
- Local: synthetic data, local/test credentials.
- Preview/staging: separate database, storage and payment sandbox.
- Production: isolated credentials, production domain, monitoring and approved real-data access.

Never clone production student records into development. If a support reproduction needs data, create a synthetic case or use an approved de-identification process.

## 2. Required configuration
Maintain `.env.example` with names and safe placeholders only. Actual values belong in the deployment provider's secret store.

Typical configuration categories:
- application base URL and environment;
- database/managed backend URL and public client key;
- server-only database/service credentials, if truly needed;
- identity-provider settings;
- payment public/secret keys and webhook secret;
- video/storage credentials;
- email provider credentials;
- logging/monitoring DSN;
- encryption key references and key-rotation configuration.

Never place server secrets in `NEXT_PUBLIC_*` variables or client bundles.

## 3. Release procedure
1. Confirm release scope and approvals.
2. Review changes and migrations.
3. Run formatting, lint, type checks, unit/integration tests and security tests.
4. Deploy to staging.
5. Apply migrations using the documented procedure.
6. Run smoke tests, authorization tests and payment sandbox tests.
7. Confirm backups and rollback/recovery plan.
8. Deploy production using a controlled rollout.
9. Run post-deploy health checks.
10. Monitor errors, latency, authorization failures and payment reconciliation.
11. Record release version, operator, time and outcome.

## 4. Database migrations
- Back up according to the approved policy before risky migrations.
- Prefer backward-compatible expand/migrate/contract changes.
- Review data backfills for scope, runtime and retry safety.
- Never edit production data ad hoc through a coding agent.
- A rollback may not be safe after data transformations; document forward recovery where appropriate.

## 5. Payment operations
- Keep live and sandbox credentials separate.
- Verify webhook endpoint and signature procedure.
- Monitor pending orders and failed webhook jobs.
- Reconcile provider records against local orders.
- Define refund authority and audit trail.
- Never manually mark paid without documented provider evidence and dual review where policy requires.

## 6. Backup and recovery
- Define RPO and RTO with stakeholders.
- Confirm backup frequency, encryption, retention and access.
- Test restoration in an isolated environment periodically.
- Document database, object-storage and configuration recovery.
- Verify restored data access policies and secrets.
- Record test results and remediation.

## 7. Monitoring
Track uptime, error rate, response latency, database health, queue backlog, failed imports, webhook failures, unauthorized access attempts and backup status. Logs must not contain raw student answers or screening notes.

## 8. Incident response quick steps
1. Report and classify the incident.
2. Contain access or disable affected feature/credentials.
3. Preserve evidence and relevant logs.
4. Notify incident owner, security lead and legal/privacy contact.
5. Assess affected data and applicable notification duties.
6. Recover and verify.
7. Document timeline, root cause and corrective actions.

## 9. Operational contacts
Incident owner: __________________  
Technical lead: __________________  
Privacy/legal contact: __________________  
Assessment professional: __________________  
Payment provider support: __________________  
Hosting provider support: __________________
