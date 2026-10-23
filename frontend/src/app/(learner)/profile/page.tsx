"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2D241E]">
        <Navbar />
        <main className="flex-grow flex items-center justify-center py-20">
          <p className="text-sm text-[#7A6A5E] animate-pulse">Loading profile...</p>
        </main>
        <Footer />
      </div>
    );
  }

  const initial = user?.fullName?.charAt(0).toUpperCase() || "L";
  const memberDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "October 2026";

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2D241E]">
      <Navbar />

      <main className="flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <nav aria-label="Breadcrumb" className="text-xs text-[#7A6A5E]">
            <Link href="/" className="hover:text-[#2D241E] transition-colors">
              Home
            </Link>{" "}
            &rarr;{" "}
            <Link href="/learn" className="hover:text-[#2D241E] transition-colors">
              Learner Portal
            </Link>{" "}
            &rarr;{" "}
            <span className="font-semibold text-[#2D241E]">Profile & Settings</span>
          </nav>

          <Link
            href="/learn"
            className="text-xs font-semibold text-[#8C5E42] hover:text-[#724B34] transition-colors"
          >
            &larr; Return to Study Space
          </Link>
        </div>

        {/* Profile Card Header */}
        <Card className="p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-[#8C5E42] text-[#FDFBF7] flex items-center justify-center font-serif text-2xl font-bold shadow-xs">
              {initial}
            </div>
            <div className="space-y-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FAF5EE] text-[#8C5E42] text-[10px] font-bold uppercase tracking-wider border border-[#E3D8CC]">
                {user?.role || "Learner"} Profile
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D241E]">
                {user?.fullName || "Active Learner"}
              </h1>
              <p className="text-xs sm:text-sm text-[#6B5A4E]">
                {user?.email || "learner@insightignite.org"} • Member since {memberDate}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </Card>

        {/* Account Details & Preferences Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 sm:p-8 space-y-4">
            <h2 className="font-serif text-lg font-bold text-[#2D241E] border-b border-[#EFE8DF] pb-3">
              Account Attributes
            </h2>
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between py-1 border-b border-[#F5EFE8]">
                <span className="text-[#7A6A5E] font-medium">Full Name</span>
                <span className="text-[#2D241E] font-semibold">{user?.fullName || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F5EFE8]">
                <span className="text-[#7A6A5E] font-medium">Registered Email</span>
                <span className="text-[#2D241E] font-semibold">{user?.email || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F5EFE8]">
                <span className="text-[#7A6A5E] font-medium">Platform Role</span>
                <span className="text-[#8C5E42] font-semibold uppercase text-xs">{user?.role || "LEARNER"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F5EFE8]">
                <span className="text-[#7A6A5E] font-medium">Email Verification</span>
                <span className={user?.emailVerified ? "text-emerald-700 font-semibold text-xs" : "text-amber-700 font-semibold text-xs"}>
                  {user?.emailVerified ? "Verified" : "Pending Verification"}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6 sm:p-8 space-y-4">
            <h2 className="font-serif text-lg font-bold text-[#2D241E] border-b border-[#EFE8DF] pb-3">
              Course Enrollments
            </h2>
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E7DFD5] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#2D241E]">
                    The 6 Powers of Conscious Parenting
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF5EE] text-[#8C5E42]">
                    Available
                  </span>
                </div>
                <p className="text-xs text-[#7A6A5E]">
                  Inaugural Masterclass • 6 Modules • Self-Paced Reflective Curriculum
                </p>
                <div className="pt-2">
                  <Link
                    href="/courses/the-6-powers-of-conscious-parenting"
                    className="text-xs font-semibold text-[#8C5E42] hover:underline"
                  >
                    View Course Details &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Security & Password Reset Action */}
        <Card className="p-6 sm:p-8 space-y-4">
          <h2 className="font-serif text-lg font-bold text-[#2D241E] border-b border-[#EFE8DF] pb-3">
            Security & Session Management
          </h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[#2D241E]">
                Password & Authentication
              </h3>
              <p className="text-xs text-[#7A6A5E]">
                Update your account password or initiate an email-verified recovery flow.
              </p>
            </div>
            <Link href="/reset-password">
              <Button variant="secondary" size="sm">
                Change Password
              </Button>
            </Link>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
