"use client";

import React from "react";
import Link from "next/link";
import AssessmentHistoryList from "@/features/assessments/components/AssessmentHistoryList";

export default function MyAssessmentsPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D241E]">My Assessments</h1>
          <p className="text-sm text-[#5C4D42]">
            Every assessment you have completed, with each report kept separately. Open an assessment to compare your
            attempts over time.
          </p>
        </div>
        <Link href="/assessments" className="text-xs font-semibold text-[#8C5E42] hover:text-[#724B34] shrink-0">
          Browse assessments &rarr;
        </Link>
      </div>
      <AssessmentHistoryList variant="full" />
    </main>
  );
}
