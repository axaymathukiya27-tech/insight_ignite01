# Insight Ignite — Comprehensive System Readiness & Architecture Audit

**Document ID:** `SYS-AUDIT-2026-10-20`  
**Date:** October 20, 2026  
**Auditor:** Senior Product Architect, Systems & QA Engineering Team  
**Scope:** Whole Monorepo (`frontend/`, `backend/`, `database/`, `shared/`, `config/`, `scripts/`, `tests/`)  
**Status:** Phase 0 Audit Complete — Awaiting Approval Before Implementation  

---

## 1. Executive Readiness Summary

Insight Ignite is an educational and developmental mentorship platform led by Dr. Nivedita Ganguli. This audit assesses the production readiness of the existing codebase against the comprehensive product specification.

### System Readiness Scorecard

| Subsystem | Readiness Status | Evidence / Key Finding |
| :--- | :--- | :--- |
| **Monorepo Architecture** | **Scaffolded (60%)** | Workspaces configured (`frontend`, `backend`, `database`, `shared`). Root scripts intact. |
| **Public Frontend** | **Partially Operational (55%)** | Builds and compiles (32 static pages), but over-indexes on parenting, has anchor link bugs, and 404s on canonical legal routes. |
| **Authentication** | **Non-Functional (10%)** | UI forms only render client warning notices. No backend authentication, no token generation, no password hashing, no `/reset-password` route. |
| **Backend API** | **Skeleton Only (15%)** | Express server mounts only `/api/health`. 13 empty module directories. No business logic, services, or controllers implemented. |
| **Database & ORM** | **Unconnected (10%)** | `schema.prisma` exists but lacks auth/reset/inquiry models. `@prisma/client` is **not installed**. Migrations directory is empty. DB client is a placeholder. |
| **Learner Platform** | **Mockup Only (20%)** | Static UI shells at `/learn`. Displays hardcoded dummy progress. No session check, no enrollment gating, no server-side authorization. |
| **Admin Platform** | **Incomplete & Unprotected (25%)** | `/admin` is publicly accessible without login. Subroutes for `/lessons`, `/enrollments`, and `/contact-inquiries` return HTTP 404. |
| **Payments & Orders** | **Unimplemented (0%)** | No payment gateway SDK or webhook verification. Orders table is defined in schema but disconnected from real payment lifecycles. |
| **Testing & QA** | **Inactive (5%)** | `npm test` runs no test suite. `navigation.spec.ts` contains a trivial length assertion with no runner configured. |

> [!CAUTION]
> **Production Blockers:** The application cannot be deployed to real users in its current state. Core transactional, authentication, and database features are mockups or disconnected stubs.

---

## 2. Live Diagnostics & Verification Commands Executed

All checks were executed on the active repository (`d:\website`) on October 20, 2026.

### 2.1 Git Status & Commit History
```powershell
# Command: git status
On branch master
nothing to commit, working tree clean

# Command: git log -n 5 --oneline
a5f3015 docs: add frontend audit and stabilization plan report
2a0d0fb chore: clean up obsolete build cache and integrate design tokens, breadcrumbs, and response utils
cb69459 feat: complete monorepo structure and multi-page application with auth
108c6db chore: ignore .next across monorepo
8ef12d2 feat(workspace): migrate frontend to apps/web with npm workspaces
```

### 2.2 Workspace Lint & Build Verification
```powershell
# Command: npm run lint
> insight-ignite-workspace@0.1.0 lint
> npm run lint --workspaces --if-present
> @insight-ignite/frontend@0.1.0 lint
> eslint
# Result: 0 errors, 0 warnings
> @insight-ignite/backend@0.1.0 lint
> echo "Backend linting placeholder"
# Result: Exited 0

# Command: npm run build:backend
> @insight-ignite/backend@0.1.0 build
> tsc
# Result: Compiled successfully (exited 0)

# Command: npm run build:frontend
▲ Next.js 16.4.2 (Turbopack)
✓ Compiled successfully in 8.0s
✓ Generating static pages using 15 workers (32/32) in 2.6s
# Result: 32 pages statically generated without error
```

### 2.3 Automated Test Execution
```powershell
# Command: npm test
> insight-ignite-workspace@0.1.0 test
> npm run test --workspaces --if-present
> @insight-ignite/backend@0.1.0 test
> echo "No tests specified for backend yet"
# Result: Exited 0. No automated tests executed across any workspace.
```

### 2.4 Active Network Port Diagnostics
```powershell
# Command: Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in 3000, 5000, 5432 }
Port 3000 : LISTENING (Next.js App Server, PID 14396)
Port 5000 : NOT LISTENING (Express Backend is stopped)
Port 5432 : LISTENING (Local PostgreSQL instance, PID 6916)
```

---

## 3. Route Verification & Feature Inventory

### 3.1 Public Website Routes (Section 5)

| Specification Route | Existing Route File | Live HTTP Status | Functional Assessment |
| :--- | :--- | :--- | :--- |
| `/` | `frontend/src/app/(public)/page.tsx` | **200 OK** | Operational, but ~75% duplicates parenting course; `#about` and `#six-powers` anchor link bugs. |
| `/about` | `frontend/src/app/(public)/about/page.tsx` | **200 OK** | Operational. Displays Dr. Ganguli bio and institutional philosophy. |
| `/programs` | `frontend/src/app/(public)/programs/page.tsx` | **200 OK** | Operational. Shows 5 institutional pillar cards. |
| `/programs/[slug]` | `frontend/src/app/(public)/programs/[slug]/page.tsx` | **200 OK** | Operational. Statically generated for all 5 slugs. |
| `/courses` | `frontend/src/app/(public)/courses/page.tsx` | **200 OK** | Operational. Shows academy course catalogue. |
| `/courses/[slug]` | `frontend/src/app/(public)/courses/[slug]/page.tsx` | **200 OK** | Operational. Deep-dive syllabus for *The 6 Powers*. |
| `/resources` | `frontend/src/app/(public)/resources/page.tsx` | **200 OK** | Operational. Resource guide cards and download request actions. |
| `/contact` | `frontend/src/app/(public)/contact/page.tsx` | **200 OK** | UI rendered; submission is client-simulated (`setSubmitted(true)`) with no API dispatch. |
| `/privacy` | *Nested under `/legal/privacy`* | **404 Not Found** | **Defect AUD-011**: Missing canonical root path `/privacy`. |
| `/terms` | *Nested under `/legal/terms`* | **404 Not Found** | **Defect AUD-011**: Missing canonical root path `/terms`. |
| `/refund-policy` | *Nested under `/legal/refunds`* | **404 Not Found** | **Defect AUD-011**: Missing canonical root path `/refund-policy`. |

### 3.2 Authentication Routes (Section 6)

| Specification Route | Existing Route File | Live HTTP Status | Functional Assessment |
| :--- | :--- | :--- | :--- |
| `/login` | `frontend/src/app/(auth)/login/page.tsx` | **200 OK** | UI shell only. Submit displays: *"Authentication service integration is scheduled for Phase 1"*. |
| `/register` | `frontend/src/app/(auth)/register/page.tsx` | **200 OK** | UI shell only. Multi-role selector present; submit logs client warning notice. |
| `/verify-email` | `frontend/src/app/(auth)/verify-email/page.tsx` | **200 OK** | Informational static shell. No token verification logic or backend route. |
| `/forgot-password` | `frontend/src/app/(auth)/forgot-password/page.tsx` | **200 OK** | UI shell only. Displays simulated email confirmation notice. |
| `/reset-password` | *Missing* | **404 Not Found** | **Defect AUD-012**: Route completely missing. Token-based password recovery cannot complete. |

### 3.3 Learner Platform Routes (Section 7)

| Specification Route | Existing Route File | Live HTTP Status | Functional Assessment |
| :--- | :--- | :--- | :--- |
| `/learn` | `frontend/src/app/(learner)/learn/page.tsx` | **200 OK** | Hardcoded dashboard mockup. No session check. Unauthenticated users can view. |
| `/learn/courses` | `frontend/src/app/(learner)/learn/courses/page.tsx` | **200 OK** | Hardcoded course enrollment list. |
| `/learn/courses/[courseId]` | `frontend/src/app/.../[courseId]/page.tsx` | **200 OK** | Statically prerendered classroom view. |
| `/learn/courses/[courseId]/lessons/[lessonId]` | `frontend/src/app/.../lessons/[lessonId]/page.tsx` | **200 OK** | Video placeholder player & worksheet view. Progress is not persisted. |
| `/profile` | *Missing* | **404 Not Found** | **Defect AUD-013**: Profile page missing from learner route tree. |

### 3.4 Admin Platform Routes (Section 8)

| Specification Route | Existing Route File | Live HTTP Status | Functional Assessment |
| :--- | :--- | :--- | :--- |
| `/admin` | `frontend/src/app/(admin)/admin/page.tsx` | **200 OK** | **Critical Defect AUD-016**: Publicly viewable without login or role authorization. |
| `/admin/courses` | `frontend/src/app/(admin)/admin/courses/page.tsx` | **200 OK** | Static table of courses. No CRUD functionality. |
| `/admin/lessons` | *Missing* | **404 Not Found** | **Defect AUD-014**: Required admin route missing. |
| `/admin/users` | `frontend/src/app/(admin)/admin/users/page.tsx` | **200 OK** | Static table of users. |
| `/admin/enrollments` | *Missing* | **404 Not Found** | **Defect AUD-014**: Required admin route missing. |
| `/admin/orders` | `frontend/src/app/(admin)/admin/orders/page.tsx` | **200 OK** | Static table of simulated transactions. |
| `/admin/contact-inquiries` | *Missing* | **404 Not Found** | **Defect AUD-014**: Required admin route missing. |

### 3.5 Out-of-Scope Premature Modules (Section 12 Non-Negotiable)

| Route Group | Files | Status | Assessment |
| :--- | :--- | :--- | :--- |
| `frontend/src/app/(assessment)` | `/assessments`, `/assessments/[id]` | **Compiled (200 OK)** | **Defect AUD-015**: Scaffolded prematurely. Must be isolated or removed from initial release. |
| `frontend/src/app/(school)` | `/school`, `/reports`, `/students`, `/teachers` | **Compiled (200 OK)** | **Defect AUD-015**: Scaffolded prematurely. Must be isolated or removed from initial release. |

---

## 4. Subsystem Architectural Audits

### 4.1 Database Layer (`database/`)
- **Prisma Schema (`database/prisma/schema.prisma`):**
  - Defines `User`, `Course`, `Lesson`, `Enrollment`, `Order`.
  - **Missing Required Models:**
    - `PasswordResetToken` (needed for secure, expiring single-use reset tokens).
    - `EmailVerificationToken` (needed for secure email verification flows).
    - `Session` / `RefreshToken` (needed for stateful/revocable session management).
    - `ContactInquiry` (needed to persist contact submissions).
    - `LessonProgress` (needed for granular completion tracking per lesson).
  - **Missing User Fields:** No `passwordHash`, no `emailVerified` (DateTime?), no `isActive` flag.
- **Client & Driver Status:**
  - `database/package.json` contains `prisma` (devDependencies), but **omits `@prisma/client`** from `dependencies`.
  - `node_modules/@prisma/client` does **not exist**.
  - `database/src/client.ts` only exports `{ driver: "postgresql", schema: "public" }` — no initialized `PrismaClient` is exported.
- **Migrations Status:**
  - `database/prisma/migrations` is completely **empty**. No migrations have been created or executed.
  - `scripts/database/migrate.ts` contains console log statements without executing Prisma CLI migrations.

### 4.2 Backend API Layer (`backend/`)
- **Express Application (`backend/src/app.ts`):**
  - Scaffolded with CORS, JSON body parser, request ID middleware, and error middleware.
  - Mounted router: Only mounts `health.routes.ts` (`GET /api/health`).
- **Module Skeletons:**
  - Contains 13 empty directories in `backend/src/modules/` (`auth`, `users`, `courses`, `lessons`, `enrollments`, `orders`, `inquiries`, etc.).
  - No database connection is imported or configured.
  - No authentication strategies (JWT, session cookies, bcrypt) are installed or implemented.
  - No input validation middleware (Zod) is connected.

### 4.3 Shared Contracts (`shared/`)
- **Types & Interfaces (`shared/src/schemas/index.ts`):**
  - Defines TypeScript interfaces: `ContactFormInput`, `RegisterUserInput`, `LoginUserInput`.
  - No runtime schema validator (e.g., Zod) is configured. Validation cannot execute safely at runtime on incoming JSON payloads.

### 4.4 Environment & Secret Management
- **Configuration Files:**
  - Root contains `.env.example` defining `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `PORT`, `NODE_ENV`, `CORS_ORIGIN`, `DATABASE_URL`.
  - No `.env` or `.env.local` files exist in the repository (properly matching security rule 9).
  - Pre-deployment check `scripts/deployment/check-env.ts` only validates `NODE_ENV`.

---

## 5. Current vs Target Architecture Comparison

```
CURRENT REPOSITORY STRUCTURE:
d:\website\
├── backend/
│   ├── src/
│   │   ├── app.ts (mounts only /health)
│   │   ├── server.ts
│   │   ├── routes/ (health.routes.ts only)
│   │   └── modules/ (13 empty directories)
│   └── package.json
├── database/
│   ├── prisma/
│   │   ├── schema.prisma (incomplete models)
│   │   └── migrations/ (empty)
│   ├── src/ (dummy client.ts)
│   └── package.json (missing @prisma/client)
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (admin)/ (unprotected; 3 subroutes missing)
│   │   │   ├── (assessment)/ (out of scope)
│   │   │   ├── (auth)/ (missing /reset-password; mock submit)
│   │   │   ├── (learner)/ (unprotected; missing /profile)
│   │   │   ├── (public)/ (404 on canonical legal routes)
│   │   │   └── (school)/ (out of scope)
│   │   ├── components/
│   │   └── features/
│   └── package.json
├── shared/ (TypeScript interfaces only)
├── scripts/ (stubs for migrate, seed, env)
├── tests/ (e2e/navigation.spec.ts stub)
└── docs/
```

### Alignment with Target Architecture (Section 4)
The repository has already established the root folders (`frontend`, `backend`, `database`, `shared`, `config`, `tests`, `docs`, `scripts`).  
**Crucial Architectural Decision:**  
A folder reorganization is **not required**. The top-level packages already match the target layout specified in Section 4. What is needed is **internal package completion, schema refinement, and real integration wiring**, rather than moving directories.

---

## 6. Migration Risks & Safeguards

1. **Premature Restructuring Risk:** Moving files across workspaces before database and backend schemas stabilize risks breaking Next.js App Router paths and TypeScript path aliases.
   - *Safeguard:* Maintain current workspace layout. Work strictly within established workspace boundaries.
2. **Database Schema Mutation Risk:** Applying ad-hoc migrations without testing relationships and rollback scripts could corrupt development data.
   - *Safeguard:* Review complete Prisma schema with all relations, unique constraints, and cascade delete rules before generating the initial baseline migration.
3. **Authentication Security Risk:** Client-side only route guards can be trivially bypassed.
   - *Safeguard:* Enforce authentication and role checks exclusively in server-side Next.js middleware / server components and Express API middleware.
4. **Out-of-Scope Bloat Risk:** Activating assessment and school management features prematurely dilutes focus on the inaugural course (*The 6 Powers of Conscious Parenting*).
   - *Safeguard:* Hide/gate assessment and school routes from public and admin navigation until Phase 6+ authorization.

---

## 7. Required External Information & Service Credentials (Non-Secret Checklist)

The following service choices and configuration parameters must be confirmed with the product owner before Phase 3 and Phase 5 implementation:

1. **Transactional Email Service Provider:**
   - Provider selection (e.g., Resend, AWS SES, SendGrid, or Postmark).
   - Verified sender email address (e.g., `noreply@insightignite.org` or `mentorship@insightignite.org`).
   - Approved email template copy for account verification and password reset.
2. **Payment Gateway Provider:**
   - Provider selection for INR / international transactions (e.g., Razorpay, Stripe, or Cashfree).
   - Webhook signing endpoint and operational currency confirmation.
   - Approved course pricing and tax breakdown for *The 6 Powers of Conscious Parenting*.
3. **Course Deliverables & Asset Approvals:**
   - Confirmed video hosting architecture (e.g., Mux, Vimeo OTT, or Cloudflare Stream).
   - High-resolution, approved portrait photography of Dr. Nivedita Ganguli.
   - Verified curriculum syllabus, downloadable PDF worksheets, and module lesson counts.
4. **Production Database Instance:**
   - PostgreSQL version (v15+ recommended) and SSL connection parameters.
   - Connection pool limits and backup retention schedule.
