"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AssessmentSubmissionHistoryItem } from "@insight-ignite/shared";
import { getMyAssessmentHistory } from "../api";

export default function AssessmentHistoryList() {
  const [history, setHistory] = useState<AssessmentSubmissionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadHistory() {
      setLoading(true);
      setError(null);
      try {
        const items = await getMyAssessmentHistory();
        if (!isCancelled) {
          setHistory(items);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load assessment history.";
          setError(msg);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      isCancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-[#E3D8CC]">
        <div className="inline-block w-6 h-6 border-2 border-[#8C5E42] border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs text-[#8A796E]">Loading your reflection history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-[#FEF2F2] rounded-2xl border border-[#FCA5A5] text-xs text-[#991B1B] space-y-2">
        <p className="font-semibold">Unable to load reflection history</p>
        <p>{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-[#E3D8CC] text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF5EE] text-[#8C5E42] flex items-center justify-center font-serif text-lg font-bold">
          ✦
        </div>
        <h3 className="font-serif text-lg font-bold text-[#2D241E]">
          No Self-Assessments Recorded Yet
        </h3>
        <p className="text-xs text-[#6B5A4E] max-w-sm mx-auto">
          Complete the Parent Growth Self-Assessment to identify your co-regulation strengths and receive curated guidance habits.
        </p>
        <div className="pt-2">
          <Link
            href="/assessments"
            className="inline-block px-5 py-2.5 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-semibold text-xs hover:bg-[#724B34] transition-colors"
          >
            Take Self-Assessment &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((item) => {
        const completedDate = new Date(item.completedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        return (
          <div
            key={item.submissionId}
            className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E3D8CC] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-[#8C5E42] transition-colors"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#8C5E42] uppercase tracking-wide">
                  Version {item.versionNumber}
                </span>
                <span className="text-xs text-[#8A796E]">• {completedDate}</span>
              </div>
              <h4 className="font-serif font-bold text-lg text-[#2D241E]">
                {item.instrumentTitle}
              </h4>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                {item.topStrength && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EBF5EE] text-[#1E562F] font-medium border border-[#C8E6D0]">
                    Strength: {item.topStrength}
                  </span>
                )}
                {item.topGrowthArea && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FFF9F2] text-[#8C3D04] font-medium border border-[#F3DFC9]">
                    Focus: {item.topGrowthArea}
                  </span>
                )}
              </div>
            </div>

            <Link
              href={`/assessments/results/${item.submissionId}`}
              className="px-4 py-2 rounded-full border border-[#8C5E42] text-[#8C5E42] text-xs font-semibold hover:bg-[#8C5E42] hover:text-white transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5E42]"
            >
              View Report &rarr;
            </Link>
          </div>
        );
      })}
    </div>
  );
}
