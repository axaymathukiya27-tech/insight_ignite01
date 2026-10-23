"use client";

import React from "react";
import { useOptionalAuth } from "@/context/AuthContext";
import AssessmentProgressPanel from "./AssessmentProgressPanel";

/**
 * Shown on an assessment's page: the signed-in parent's earlier attempts of this
 * assessment, links to each report, and a comparison when attempts are comparable.
 * Guests see nothing here (their reports are reached through their own link).
 */
export default function MyAttemptsCard({ slug }: { slug: string }) {
  const auth = useOptionalAuth();
  if (!auth || auth.loading || !auth.user) return null;
  return (
    <section
      aria-labelledby="my-attempts-heading"
      className="max-w-3xl mx-auto my-6 px-4 sm:px-6"
    >
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E3D8CC] shadow-sm space-y-4">
        <h2 id="my-attempts-heading" className="font-serif text-xl font-bold text-[#2D241E]">
          Your attempts at this assessment
        </h2>
        <AssessmentProgressPanel slug={slug} variant="page" />
        <p className="text-xs text-[#6B5A4E]">
          Starting below creates a new attempt. Your earlier reports are kept and stay available here.
        </p>
      </div>
    </section>
  );
}
