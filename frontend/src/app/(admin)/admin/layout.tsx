"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, logout, isAdmin } = useAuth();

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  // Authorization Check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F4F0] text-[#2D241E]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#8C5E42] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-wider text-[#8A796E] font-semibold">
            Verifying Admin Authorization...
          </p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] p-4 text-[#2D241E]">
        <Card className="max-w-md w-full p-8 text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center text-red-700 text-2xl font-bold">
            ⛔
          </div>
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-red-50 text-red-800 text-xs font-bold uppercase tracking-wider">
              Access Restricted
            </span>
            <h1 className="font-serif text-2xl font-bold text-[#2D241E]">
              Administrator Privilege Required
            </h1>
            <p className="text-xs text-[#5C4D42] leading-relaxed">
              This area is restricted to authorized platform administrators and school leaders. Current account role:{" "}
              <strong>{user?.role || "Unauthenticated Visitor"}</strong>.
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Link href="/learn">
              <Button variant="primary" className="w-full justify-center text-xs">
                Return to Learner Portal
              </Button>
            </Link>
            <Button variant="outline" onClick={handleSignOut} className="w-full justify-center text-xs">
              Sign In as Administrator
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const initial = user.fullName?.charAt(0).toUpperCase() || "A";

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F4F0] text-[#2D241E]">
      {/* Admin Header */}
      <header className="sticky top-0 z-40 bg-[#2D241E] text-white border-b border-[#40342B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="font-serif text-lg font-bold text-white">
                Insight Ignite
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#8C5E42] text-[10px] font-bold uppercase tracking-wider text-white">
                Admin Console
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-white/80">
              <Link
                href="/admin"
                className="px-2.5 py-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
              >
                Overview
              </Link>
              <Link
                href="/admin/courses"
                className="px-2.5 py-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
              >
                Courses
              </Link>
              <Link
                href="/admin/assessments"
                className="px-2.5 py-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
              >
                Assessments
              </Link>
              <Link
                href="/admin/lessons"
                className="px-2.5 py-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
              >
                Lessons
              </Link>
              <Link
                href="/admin/users"
                className="px-2.5 py-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
              >
                Users
              </Link>
              <Link
                href="/admin/enrollments"
                className="px-2.5 py-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
              >
                Enrollments
              </Link>
              <Link
                href="/admin/orders"
                className="px-2.5 py-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
              >
                Orders
              </Link>
              <Link
                href="/admin/contact-inquiries"
                className="px-2.5 py-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
              >
                Inquiries
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs text-white/70 hover:text-white transition-colors"
            >
              Public Site &rarr;
            </Link>
            <div className="flex items-center gap-2">
              <div
                title={user.email}
                className="w-8 h-8 rounded-full bg-[#8C5E42] flex items-center justify-center text-xs font-bold text-white shadow-xs"
              >
                {initial}
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <div className="flex-grow">{children}</div>
    </div>
  );
}
