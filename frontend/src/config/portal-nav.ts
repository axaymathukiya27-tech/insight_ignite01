import type { SafeUser } from "@insight-ignite/shared";

/**
 * Navigation for the signed-in portals. Parent and admin menus are kept separate, and
 * every item points at a page that exists. Admin items are filtered by the role the
 * backend actually authorises for that area (frontend filtering is for clarity only;
 * the API enforces the same rules).
 */
export interface PortalNavItem {
  label: string;
  href: string;
  exact?: boolean;
  roles?: string[]; // omitted = every role allowed into this portal
}

export const parentNav: PortalNavItem[] = [
  { label: "Dashboard", href: "/learn", exact: true },
  { label: "My Assessments", href: "/learn/assessments" },
  { label: "My Courses", href: "/learn/courses" },
  { label: "Profile & Settings", href: "/profile" },
];

export const adminNav: PortalNavItem[] = [
  { label: "Overview", href: "/admin", exact: true },
  { label: "Assessments", href: "/admin/assessments", roles: ["PLATFORM_ADMIN"] },
  { label: "Courses", href: "/admin/courses" },
  { label: "Lessons", href: "/admin/lessons", roles: ["PLATFORM_ADMIN"] },
  { label: "Users", href: "/admin/users", roles: ["PLATFORM_ADMIN"] },
  { label: "Enrollments", href: "/admin/enrollments", roles: ["PLATFORM_ADMIN"] },
  { label: "Orders", href: "/admin/orders", roles: ["PLATFORM_ADMIN"] },
  { label: "Inquiries", href: "/admin/contact-inquiries", roles: ["PLATFORM_ADMIN"] },
];

export function navForRole(items: PortalNavItem[], role: SafeUser["role"] | string | undefined): PortalNavItem[] {
  return items.filter((i) => !i.roles || (role !== undefined && i.roles.includes(String(role))));
}

export function isActive(pathname: string, item: PortalNavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export const ROLE_LABEL: Record<string, string> = {
  PLATFORM_ADMIN: "Platform administrator",
  SCHOOL_ADMIN: "School administrator",
  TEACHER: "Teacher",
  PARENT: "Parent",
  LEARNER: "Learner",
};
