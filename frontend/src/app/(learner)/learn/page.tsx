"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import AssessmentHistoryList from "@/features/assessments/components/AssessmentHistoryList";
import AssessmentCatalogCards from "@/features/assessments/components/AssessmentCatalogCards";
import { listActiveAssessments, ActiveAssessmentSummary } from "@/features/assessments/api";

export default function LearnerDashboardPage() {
  const { user } = useAuth();
  const displayName = user?.fullName ? `, ${user.fullName}` : "";
  const [assessments, setAssessments] = useState<ActiveAssessmentSummary[] | null>(null);

  useEffect(() => {
    let active = true;
    listActiveAssessments()
      .then((list) => { if (active) setAssessments(list); })
      .catch(() => { if (active) setAssessments([]); });
    return () => { active = false; };
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#8C5E42] to-[#633F2B] rounded-3xl p-8 sm:p-10 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-semibold">
            Welcome to Your Study Space
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold">
            Welcome back{displayName}
          </h1>
          <p className="text-sm text-white/85 max-w-xl">
            Cultivate calm, presence, and relational repair at your own pace through structured lesson reflections.
          </p>
        </div>

        <Link
          href="/courses/the-6-powers-of-conscious-parenting"
          className="inline-block px-6 py-3 rounded-full bg-white text-[#633F2B] font-bold text-sm hover:bg-[#F5EFE8] transition-colors whitespace-nowrap self-start md:self-auto"
        >
          View Masterclass &rarr;
        </Link>
      </div>

      {/* Progress & Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-[#E3D8CC] shadow-sm space-y-2">
          <span className="text-xs uppercase text-[#8A796E] font-medium tracking-wider">
            Active Enrollments
          </span>
          <div className="text-2xl font-bold font-serif text-[#2D241E]">1 Masterclass</div>
          <p className="text-xs text-[#6B5A4E]">
            The 6 Powers of Conscious Parenting
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#E3D8CC] shadow-sm space-y-2">
          <span className="text-xs uppercase text-[#8A796E] font-medium tracking-wider">
            Curriculum Modules
          </span>
          <div className="text-2xl font-bold font-serif text-[#2D241E]">6 Modules</div>
          <p className="text-xs text-[#6B5A4E]">
            Self-paced video teachings & journal prompts
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#E3D8CC] shadow-sm space-y-2">
          <span className="text-xs uppercase text-[#8A796E] font-medium tracking-wider">
            Account Status
          </span>
          <div className="text-2xl font-bold font-serif text-[#8C5E42]">
            {user?.emailVerified ? "Verified Active" : "Verification Pending"}
          </div>
          <p className="text-xs text-[#6B5A4E]">
            Role: {user?.role || "LEARNER"}
          </p>
        </div>
      </div>

      {/* Enrolled Courses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-[#2D241E]">
            My Current Courses
          </h2>
          <Link
            href="/courses"
            className="text-xs font-semibold text-[#8C5E42] hover:text-[#724B34]"
          >
            Browse Catalogue &rarr;
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#E3D8CC] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#8C5E42] uppercase tracking-wider">
                Foundational Masterclass
              </span>
              <h3 className="font-serif text-lg font-bold text-[#2D241E]">
                The 6 Powers of Conscious Parenting
              </h3>
              <p className="text-xs text-[#5C4D42]">
                Instructor: Dr. Nivedita Ganguli &bull; 6 Core Powers &bull; Self-paced
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/courses/the-6-powers-of-conscious-parenting"
                className="px-5 py-2 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-semibold text-xs hover:bg-[#724B34] transition-colors"
              >
                Open Course Room
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Self-Assessments Section */}
      <div className="space-y-4 pt-4 border-t border-[#EFE8DF]">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="font-serif text-xl font-bold text-[#2D241E]">
              My Growth Self-Assessments
            </h2>
            <p className="text-xs text-[#6B5A4E]">
              Review your past reflections and track your co-regulation progress.
            </p>
          </div>

          <Link
            href="/assessments"
            className="text-xs font-semibold text-[#8C5E42] hover:text-[#724B34]"
          >
            All assessments &rarr;
          </Link>
        </div>

        {assessments === null ? (
          <div className="h-24 rounded-3xl bg-white border border-[#E3D8CC] animate-pulse" aria-hidden="true" />
        ) : assessments.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
              Available to take
            </h3>
            <AssessmentCatalogCards assessments={assessments} compact />
          </div>
        ) : null}

        <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C4D42] pt-2">
          My past results
        </h3>
        <AssessmentHistoryList />
      </div>
    </main>
  );
}
