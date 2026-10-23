"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import PortalShell from "@/components/layout/PortalShell";
import { adminNav, parentNav } from "@/config/portal-nav";

/**
 * Signed-in parent portal (/learn and /profile). The proxy already sends visitors without
 * a session cookie to the login page; this also handles an expired or signed-out session.
 * Administrators opening their own profile see the admin console frame.
 */
export default function LearnerPortalLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const pathname = usePathname() || "/learn";
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, pathname, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
        <div className="text-center space-y-3" role="status">
          <div className="w-10 h-10 border-2 border-[#8C5E42] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#8A796E]">{loading ? "Loading your portal..." : "Redirecting to sign in..."}</p>
        </div>
      </div>
    );
  }

  const adminFrame = isAdmin && pathname.startsWith("/profile");
  return (
    <PortalShell
      variant={adminFrame ? "admin" : "parent"}
      nav={adminFrame ? adminNav : parentNav}
      homeHref={adminFrame ? "/admin" : "/learn"}
    >
      {children}
    </PortalShell>
  );
}
