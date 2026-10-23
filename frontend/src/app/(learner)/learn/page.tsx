"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MyEnrollmentDto } from "@insight-ignite/shared";
import { useAuth } from "@/context/AuthContext";
import AssessmentHistoryList from "@/features/assessments/components/AssessmentHistoryList";
import AssessmentCatalogCards from "@/features/assessments/components/AssessmentCatalogCards";
import { listActiveAssessments, ActiveAssessmentSummary, getMyEnrollments } from "@/features/assessments/api";

export default function LearnerDashboardPage() {
  const { user } = useAuth();
  const firstName = user?.fullName?.trim().split(" ")[0];
  const [assessments, setAssessments] = useState<ActiveAssessmentSummary[] | null>(null);
  const [enrollments, setEnrollments] = useState<MyEnrollmentDto[] | null>(null);
  const [enrollError, setEnrollError] = useState(false);

  useEffect(() => {
    let active = true;
    listActiveAssessments()
      .then((list) => active && setAssessments(list))
      .catch(() => active && setAssessments([]));
    getMyEnrollments()
      .then((list) => active && setEnrollments(list))
      .catch(() => {
        if (!active) return;
        setEnrollError(true);
        setEnrollments([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="bg-gradient-to-r from-[#8C5E42] to-[#633F2B] rounded-3xl p-8 sm:p-10 text-white shadow-md space-y-2">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold">Welcome back{firstName ? `, ${firstName}` : ""}</h1>
        <p className="text-sm text-white/85 max-w-xl">
          Pick up where you left off: your assessment reports, practice plans and courses are all here.
        </p>
      </div>

      {/* Assessments */}
      <section className="space-y-4" aria-labelledby="dash-assessments">
        <div className="flex items-center justify-between gap-3">
          <h2 id="dash-assessments" className="font-serif text-xl font-bold text-[#2D241E]">
            My assessments
          </h2>
          <Link href="/learn/assessments" className="text-xs font-semibold text-[#8C5E42] hover:text-[#724B34]">
            All attempts &rarr;
          </Link>
        </div>
        <AssessmentHistoryList />

        {assessments === null ? (
          <div className="h-24 rounded-3xl bg-white border border-[#E3D8CC] animate-pulse" aria-hidden="true" />
        ) : assessments.length > 0 ? (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C4D42]">Available to take</h3>
            <AssessmentCatalogCards assessments={assessments} compact />
          </div>
        ) : null}
      </section>

      {/* Courses (real enrollments only) */}
      <section className="space-y-4 pt-6 border-t border-[#EFE8DF]" aria-labelledby="dash-courses">
        <div className="flex items-center justify-between gap-3">
          <h2 id="dash-courses" className="font-serif text-xl font-bold text-[#2D241E]">
            My courses
          </h2>
          <Link href="/courses" className="text-xs font-semibold text-[#8C5E42] hover:text-[#724B34]">
            Browse courses &rarr;
          </Link>
        </div>
        {enrollments === null ? (
          <div className="h-24 rounded-3xl bg-white border border-[#E3D8CC] animate-pulse" aria-hidden="true" />
        ) : enrollError ? (
          <p role="alert" className="text-xs text-[#991B1B]">Your courses could not be loaded. Please refresh the page.</p>
        ) : enrollments.length === 0 ? (
          <p className="p-6 rounded-2xl bg-white border border-[#E3D8CC] text-sm text-[#5C4D42]">
            You are not enrolled in a course yet. Courses you join will appear here.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enrollments.map((e) => (
              <div key={e.courseId} className="bg-white rounded-2xl p-5 border border-[#E3D8CC] shadow-sm space-y-3">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#2D241E]">{e.title}</h3>
                  <p className="text-xs text-[#6B5A4E]">
                    {e.instructor} · {e.lessonCount} lesson{e.lessonCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="h-2 bg-[#E5DCD1] rounded-full overflow-hidden" role="progressbar" aria-valuenow={e.progressPct} aria-valuemin={0} aria-valuemax={100} aria-label={`${e.title} progress`}>
                  <div className="h-full bg-[#8C5E42] rounded-full" style={{ width: `${e.progressPct}%` }} />
                </div>
                <p className="text-xs text-[#5C4D42]">{e.completedAt ? "Completed" : `${e.progressPct}% complete`}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
