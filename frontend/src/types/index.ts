/**
 * Common frontend TypeScript types for Insight Ignite.
 */

export type UserRole = "parent" | "educator" | "mentor" | "admin" | "school_coordinator";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export interface LessonSummary {
  id: string;
  number: string;
  title: string;
  duration: string;
  type: string;
  isCompleted?: boolean;
}

export interface CourseDetail {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  instructor: string;
  description: string;
  lessons: LessonSummary[];
}
