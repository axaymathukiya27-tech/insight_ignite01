"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AssessmentSubmissionHistoryItem } from "@insight-ignite/shared";
import { getMyAssessmentHistory } from "../api";

interface Group {
  slug?: string;
  title: string;
  attempts: AssessmentSubmissionHistoryItem[]; // newest first
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Groups completed attempts by assessment, newest attempt first in each group. */
export function groupHistory(history: AssessmentSubmissionHistoryItem[]): Group[] {
  const groups = new Map<string, Group>();
  for (const item of history) {
    const key = item.instrumentSlug || item.instrumentTitle;
    const g = groups.get(key) || { slug: item.instrumentSlug, title: item.instrumentTitle, attempts: [] };
    g.attempts.push(item);
    groups.set(key, g);
  }
  return [...groups.values()]
    .map((g) => ({ ...g, attempts: [...g.attempts].sort((a, b) => b.completedAt.localeCompare(a.completedAt)) }))
    .sort((a, b) => b.attempts[0].completedAt.localeCompare(a.attempts[0].completedAt));
}

/**
 * The parent's completed assessments across the platform.
 * "summary": one card per assessment (latest report, attempt count, plan progress).
 * "full": the same, plus every attempt with a link to its report.
 */
export default function AssessmentHistoryList({ variant = "summary" }: { variant?: "summary" | "full" }) {
  const [history, setHistory] = useState<AssessmentSubmissionHistoryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getMyAssessmentHistory()
      .then((items) => {
        if (active) setHistory(items);
      })
      .catch(() => {
        if (active) setError("Your assessment history could not be loaded. Please refresh the page.");
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <p role="alert" className="p-5 bg-[#FEF2F2] rounded-2xl border border-[#FCA5A5] text-xs text-[#991B1B]">
        {error}
      </p>
    );
  }

  if (history === null) {
    return <div className="h-28 rounded-2xl bg-white border border-[#E3D8CC] animate-pulse" role="status" aria-label="Loading" />;
  }

  if (history.length === 0) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-[#E3D8CC] text-center space-y-3">
        <h3 className="font-serif text-lg font-bold text-[#2D241E]">No completed assessments yet</h3>
        <p className="text-xs text-[#6B5A4E] max-w-sm mx-auto">
          When you complete an assessment while signed in, your report is saved here so you can return to it and
          compare future attempts.
        </p>
        <Link
          href="/assessments"
          className="inline-block px-5 py-2.5 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-semibold text-xs hover:bg-[#724B34] transition-colors"
        >
          Choose an assessment &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-section="assessment-history">
      {groupHistory(history).map((g) => {
        const latest = g.attempts[0];
        return (
          <div key={g.slug || g.title} className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E3D8CC] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <h3 className="font-serif font-bold text-lg text-[#2D241E]">{g.title}</h3>
                <p className="text-xs text-[#6B5A4E]">
                  Completed {g.attempts.length === 1 ? "once" : `${g.attempts.length} times`} · Latest on {formatDate(latest.completedAt)}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {latest.topStrength && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EBF5EE] text-[#1E562F] font-medium border border-[#C8E6D0]">
                      ✓ Strength: {latest.topStrength}
                    </span>
                  )}
                  {latest.topGrowthArea && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FFF9F2] text-[#8C3D04] font-medium border border-[#F3DFC9]">
                      ↑ Focus: {latest.topGrowthArea}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FAF5EE] text-[#5C4D42] border border-[#E8DFD5]">
                    Practice plan: {latest.practiceStarted ? `${latest.practiceCompletedDays ?? 0} of 7 days` : "not started"}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Link
                  href={`/assessments/results/${latest.submissionId}`}
                  className="px-4 py-2 rounded-full bg-[#8C5E42] text-[#FDFBF7] text-xs font-semibold hover:bg-[#724B34] transition-colors"
                >
                  Latest report
                </Link>
                {g.slug && (
                  <Link
                    href={`/assessments/${g.slug}`}
                    className="px-4 py-2 rounded-full border border-[#8C5E42] text-[#8C5E42] text-xs font-semibold hover:bg-[#FAF5EE] transition-colors"
                  >
                    {g.attempts.length > 1 ? "Progress & retake" : "Retake"}
                  </Link>
                )}
              </div>
            </div>

            {variant === "full" && (
              <ul className="divide-y divide-[#F2ECE4] border-t border-[#F2ECE4] text-xs">
                {g.attempts.map((a) => (
                  <li key={a.submissionId} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="text-[#2D241E]">
                      <span className="font-semibold">Attempt {a.attemptNumber ?? "–"}</span> · {formatDate(a.completedAt)} · version {a.versionNumber}
                    </span>
                    <Link href={`/assessments/results/${a.submissionId}`} className="font-semibold text-[#8C5E42] hover:underline shrink-0">
                      View report
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
