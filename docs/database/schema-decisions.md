# Insight Ignite — Database Schema Decisions (Phase 2 Foundation)

## Overview
This document records the data model decisions, relationship strategies, constraints, indexes, and deletion behaviors for the minimum first-release database schema of Insight Ignite using Prisma ORM with PostgreSQL.

---

## 1. Core Models & Tables

### 1.1 `users` (`User`)
- **Primary Identifier**: `id` UUID string (`@default(uuid())`).
- **Unique Fields**: `email` (`@unique`).
- **Security & Lifecycle**:
  - `passwordHash`: Nullable string for password hashing (Argon2id/bcrypt in Phase 3). Nullable allows potential OAuth/SSO integration without schema alteration.
  - `emailVerified`: Timestamp indicating when email was verified.
  - `isActive`: Boolean flag for administrative deactivation or soft disabling.
- **Roles**: Enum `UserRole`:
  - `PUBLIC_VISITOR`, `LEARNER`, `PARENT`, `TEACHER`, `SCHOOL_ADMIN`, `PLATFORM_ADMIN`.
- **Deletion Behavior**:
  - Cascade deletes associated `sessions`, `enrollments`, and `progress`.
  - Restricted (`onDelete: Restrict`) for `orders` to ensure an immutable financial audit trail.

### 1.2 `sessions` (`Session`)
- **Mechanism**: Server-side opaque session token stored in PostgreSQL.
- **Fields**: `id`, `userId`, `sessionToken` (`@unique`), `expiresAt`, `createdAt`, `updatedAt`.
- **Constraints & Indexes**:
  - `sessionToken` unique index for O(1) auth validation.
  - Index on `userId` for quick session invalidation upon logout or password change.
- **Deletion Behavior**: Cascade on `User` delete.

### 1.3 `email_verification_tokens` (`EmailVerificationToken`)
- **Fields**: `id`, `email`, `token` (`@unique`), `expiresAt`, `createdAt`.
- **Indexes**: `token` unique, `email` index.

### 1.4 `password_reset_tokens` (`PasswordResetToken`)
- **Fields**: `id`, `email`, `token` (`@unique`), `expiresAt`, `createdAt`.
- **Indexes**: `token` unique, `email` index.

### 1.5 `courses` (`Course`)
- **Fields**:
  - `id`: UUID primary key.
  - `slug`: `@unique` for clean routing (`/courses/the-6-powers-of-conscious-parenting`).
  - `title`, `subtitle`, `description`.
  - `priceAmount`: Integer representing minor currency units (paisa) to avoid floating-point rounding errors.
  - `currency`: ISO code, default `"INR"`.
  - `status`: Enum `CourseStatus` (`DRAFT`, `DEVELOPMENT_PREVIEW`, `PUBLISHED`, `ARCHIVED`). Default: `DEVELOPMENT_PREVIEW`.
  - `instructor`: String, default `"Dr. Nivedita Ganguli"`.
  - `thumbnailUrl`: String URL.
- **Deletion Behavior**:
  - Cascade deletes `lessons` and `enrollments`.
  - Restricted on `orders` to preserve transaction integrity.

### 1.6 `lessons` (`Lesson`)
- **Fields**:
  - `id`: UUID primary key.
  - `courseId`: Foreign key to `Course`.
  - `title`: String.
  - `slug`: Optional string.
  - `description`: Optional text.
  - `orderIndex`: Integer indicating sequence in the course.
  - `durationMin`: Integer duration in minutes.
  - `videoUrl`: Optional string for lesson video stream.
  - `isFreePreview`: Boolean flag for preview access.
- **Constraints & Indexes**:
  - Composite unique constraint `@@unique([courseId, orderIndex])` ensuring no duplicate lesson sequencing.
  - Index on `courseId`.
- **Deletion Behavior**: Cascade on `Course` delete.

### 1.7 `enrollments` (`Enrollment`)
- **Fields**: `id`, `userId`, `courseId`, `enrolledAt`, `progressPct` (0-100), `completedAt`.
- **Constraints & Indexes**:
  - Composite unique constraint `@@unique([userId, courseId])` preventing duplicate enrollments.
  - Foreign key indexes on `userId` and `courseId`.
- **Deletion Behavior**: Cascade on `User` and `Course` delete.

### 1.8 `lesson_progress` (`LessonProgress`)
- **Fields**: `id`, `userId`, `lessonId`, `completed` (Boolean), `completedAt`, `lastPositionSec` (Integer for video playback bookmarking).
- **Constraints & Indexes**:
  - Composite unique constraint `@@unique([userId, lessonId])`.
  - Indexes on `userId` and `lessonId`.
- **Deletion Behavior**: Cascade on `User` and `Lesson` delete.

### 1.9 `orders` (`Order`)
- **Fields**:
  - `id`: UUID primary key.
  - `userId`: Foreign key to `User` (`onDelete: Restrict`).
  - `courseId`: Foreign key to `Course` (`onDelete: Restrict`).
  - `amount`: Integer minor units (paisa).
  - `currency`: Default `"INR"`.
  - `status`: Enum `OrderStatus` (`PENDING`, `PAID`, `FAILED`, `REFUNDED`).
- **Indexes**: `userId`, `courseId`.

### 1.10 `payments` (`Payment`)
- **Fields**:
  - `id`: UUID primary key.
  - `orderId`: Foreign key to `Order` (`onDelete: Cascade`).
  - `paymentGateway`: Default `"RAZORPAY"`.
  - `gatewayPaymentId`: Unique string for gateway transaction ID.
  - `gatewayOrderId`: Gateway order reference.
  - `gatewaySignature`: Cryptographic signature for webhook validation.
  - `amount`: Integer minor units.
  - `currency`: Default `"INR"`.
  - `status`: Enum `PaymentStatus` (`PENDING`, `SUCCESS`, `FAILED`, `REFUNDED`).
  - `errorMessage`: String for failure diagnostics.
- **Indexes**: `orderId`, `gatewayPaymentId`.

### 1.11 `contact_inquiries` (`ContactInquiry`)
- **Fields**:
  - `id`: UUID primary key.
  - `name`: Contact name.
  - `email`: Contact email (indexed).
  - `phone`: Optional contact phone.
  - `organization`: Optional school/institution name.
  - `inquiryType`: Category string (`parenting`, `adolescent`, `schools`, `corporate`, `general`).
  - `message`: Inquirer message text.
  - `status`: Enum `InquiryStatus` (`NEW`, `IN_PROGRESS`, `RESPONDED`, `ARCHIVED`).
- **Indexes**: `email`, `status`, `createdAt`.

---

## 2. Integrity & Deletion Strategy Matrix

| Entity | Child Entity | Foreign Key Action | Rationale |
|---|---|---|---|
| User | Session | `Cascade` | Expired/abandoned user data should remove active sessions |
| User | Enrollment | `Cascade` | Enrollment access revoked upon user removal |
| User | LessonProgress | `Cascade` | Progress tracking revoked upon user removal |
| User | Order | `Restrict` | Financial transaction audit trail must survive user account changes |
| Course | Lesson | `Cascade` | Lessons are purely child records of a course |
| Course | Enrollment | `Cascade` | Deleting a course cancels active enrollments |
| Course | Order | `Restrict` | Financial transaction audit trail must retain course reference |
| Order | Payment | `Cascade` | Payments belong to orders; order removal removes attempts |
| Lesson | LessonProgress | `Cascade` | Progress is tied to a specific lesson |
