"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import PortalShell from "@/components/layout/PortalShell";
import { adminNav, isActive } from "@/config/portal-nav";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

function Restricted({ title, message, children }: { title: string; message: string; children?: React.ReactNode }) {
  return (
    <main className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-4" role="alert">
        <span className="inline-block px-3 py-1 rounded-full bg-red-50 text-red-800 text-xs font-bold uppercase tracking-wider">
          Access restricted
        </span>
        <h1 className="font-serif text-2xl font-bold text-[#2D241E]">{title}</h1>
        <p className="text-sm text-[#5C4D42] leading-relaxed">{message}</p>
        <div className="flex flex-col gap-2 pt-2">{children}</div>
      </Card>
    </main>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || "/admin";
  const { user, loading, logout, isAdmin } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, pathname, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F4F0] text-[#2D241E]">
        <div className="text-center space-y-3" role="status">
          <div className="w-10 h-10 border-2 border-[#8C5E42] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-wider text-[#8A796E] font-semibold">
            {loading ? "Checking your access..." : "Redirecting to sign in..."}
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#2D241E]">
        <Restricted
          title="Administrator access required"
          message="This area is for Insight Ignite administrators. Your account does not have administrator access."
        >
          <Link href="/learn">
            <Button variant="primary" className="w-full justify-center text-xs">
              Go to my portal
            </Button>
          </Link>
          <Button
            variant="outline"
            className="w-full justify-center text-xs"
            onClick={async () => {
              await logout();
              router.replace("/login?returnTo=/admin");
            }}
          >
            Sign in with a different account
          </Button>
        </Restricted>
      </div>
    );
  }

  // Sections limited to platform administrators (the API enforces the same rule)
  const section = adminNav.find((item) => item.href !== "/admin" && isActive(pathname, item));
  const allowed = !section?.roles || section.roles.includes(user.role);

  return (
    <PortalShell variant="admin" nav={adminNav} homeHref="/admin">
      {allowed ? (
        children
      ) : (
        <Restricted
          title="Not available for your role"
          message={`The ${section!.label} section is limited to platform administrators.`}
        >
          <Link href="/admin">
            <Button variant="primary" className="w-full justify-center text-xs">
              Back to admin overview
            </Button>
          </Link>
        </Restricted>
      )}
    </PortalShell>
  );
}
