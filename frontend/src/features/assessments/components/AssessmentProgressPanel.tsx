"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AssessmentProgressDto } from "@insight-ignite/shared";
import { getAssessmentProgress } from "../api";

interface Props {
  slug: string;
  // "report": shown inside a report; renders only when there is more than one attempt.
  // "page": shown on the assessment page for signed-in parents, including the empty state.
  variant: "report" | "page";
  currentSubmissionId?: string;
  // Lets a page render the panel with data it already has (and tests render it statically)
  initial?: AssessmentProgressDto | null;
}

function formatDate(iso?: string) {
  return iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
}

function signed(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

export function ProgressComparison({ progress }: { progress: AssessmentProgressDto }) {
  const c = progress.comparison;
  if (!c.available) {
    return <p className="text-sm text-[#6B5A4E]">{c.reason}</p>;
  }
  const comparable = progress.attempts.filter((a) => a.comparable).slice().reverse(); // oldest first
  return (
    <div className="space-y-5" data-section="progress-comparison">
      <p className="text-xs sm:text-sm text-[#5C4D42] leading-relaxed">
        Comparing your first comparable attempt ({formatDate(c.firstCompletedAt)}) with your latest (
        {formatDate(c.latestCompletedAt)}), across {c.comparedAttempts} attempts. Differences are in percentage points.
        These are self-reported answers, so a change reflects how you answered at the time; it does not measure
        parenting ability, and it may also reflect circumstances during this period.
      </p>

      <div className="space-y-3">
        {c.rows.map((r) => (
          <div key={r.factorCode} data-progress-dimension={r.factorCode} className="report-card rounded-2xl border border-[#EBE2D7] bg-[#FAF8F5] p-4 space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-serif font-bold text-sm text-[#2D241E]">{r.factorName}</span>
              <span className="text-xs font-bold text-[#2D241E]">
                {r.earlier}% → {r.latest}% ({signed(r.difference)} points)
              </span>
            </div>
            {[
              { label: `Earlier · ${r.earlierLabel}`, value: r.earlier, cls: "bg-[#C9B8A6]" },
              { label: `Latest · ${r.latestLabel}`, value: r.latest, cls: "bg-[#8C5E42]" },
            ].map((b) => (
              <div key={b.label} className="grid grid-cols-[7.5rem_1fr_2.5rem] sm:grid-cols-[10rem_1fr_2.5rem] items-center gap-2 text-[11px] text-[#6B5A4E]">
                <span className="truncate">{b.label}</span>
                <div className="h-2 bg-[#E5DCD1] rounded-full overflow-hidden" aria-hidden="true">
                  <div className={`h-full rounded-full ${b.cls}`} style={{ width: `${b.value}%` }} />
                </div>
                <span className="text-right font-semibold">{b.value}%</span>
              </div>
            ))}
            {r.direction === "HIGHER_IS_CONCERN" && (
              <p className="text-[11px] text-[#8A796E]">On this dimension a lower score is the positive direction.</p>
            )}
            <p className="text-xs text-[#3E3127] leading-relaxed">{r.meaning}</p>
          </div>
        ))}
      </div>

      {comparable.length > 2 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[28rem]">
            <caption className="text-left text-[11px] font-bold uppercase tracking-wider text-[#5C4D42] pb-2">
              Attempt by attempt
            </caption>
            <thead>
              <tr className="border-b border-[#EBE2D7] text-[#8A796E]">
                <th className="py-2 pr-3 font-semibold">Dimension</th>
                {comparable.map((a) => (
                  <th key={a.submissionId} className="py-2 px-2 font-semibold text-right">
                    #{a.attemptNumber}
                    <span className="block font-normal">{formatDate(a.completedAt)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {c.rows.map((r) => (
                <tr key={r.factorCode} className="border-b border-[#F2ECE4]">
                  <td className="py-2 pr-3 text-[#2D241E]">{r.factorName}</td>
                  {comparable.map((a) => (
                    <td key={a.submissionId} className="py-2 px-2 text-right text-[#3E3127]">
                      {a.scores.find((s) => s.factorCode === r.factorCode)?.percentage ?? "–"}%
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AttemptHistoryTable({ progress, currentSubmissionId }: { progress: AssessmentProgressDto; currentSubmissionId?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left border-collapse min-w-[26rem]" data-section="attempt-history">
        <thead>
          <tr className="border-b border-[#EBE2D7] text-[#8A796E]">
            <th className="py-2 pr-3 font-semibold">Attempt</th>
            <th className="py-2 pr-3 font-semibold">Completed</th>
            <th className="py-2 pr-3 font-semibold">Practice plan</th>
            <th className="py-2 font-semibold text-right">Report</th>
          </tr>
        </thead>
        <tbody>
          {progress.attempts.map((a) => (
            <tr key={a.submissionId} className="border-b border-[#F2ECE4]">
              <td className="py-2.5 pr-3 font-semibold text-[#2D241E]">
                Attempt {a.attemptNumber}
                {a.submissionId === currentSubmissionId && <span className="ml-1 font-normal text-[#8A796E]">(this report)</span>}
              </td>
              <td className="py-2.5 pr-3 text-[#3E3127]">{formatDate(a.completedAt)}</td>
              <td className="py-2.5 pr-3 text-[#3E3127]">
                {a.practiceStarted ? `${a.practiceCompletedDays} of 7 days` : "Not started"}
              </td>
              <td className="py-2.5 text-right">
                {a.submissionId === currentSubmissionId ? (
                  <span className="text-[#8A796E]">Viewing</span>
                ) : (
                  <Link href={`/assessments/results/${a.submissionId}`} className="font-semibold text-[#8C5E42] hover:underline">
                    View report
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AssessmentProgressPanel({ slug, variant, currentSubmissionId, initial }: Props) {
  const [progress, setProgress] = useState<AssessmentProgressDto | null>(initial ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (initial !== undefined) return;
    let active = true;
    getAssessmentProgress(slug)
      .then((p) => active && setProgress(p))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [slug, initial]);

  if (variant === "report") {
    if (!progress || progress.attempts.length < 2) return null;
    return (
      <section className="report-section space-y-4 pt-4 border-t border-[#EFE8DF]" aria-labelledby="progress-heading">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8C5E42]">Your assessment history</span>
          <h2 id="progress-heading" className="font-serif text-2xl font-bold text-[#2D241E]">
            Your Progress Over Time
          </h2>
        </div>
        <ProgressComparison progress={progress} />
        <AttemptHistoryTable progress={progress} currentSubmissionId={currentSubmissionId} />
      </section>
    );
  }

  if (failed) {
    return <p className="text-xs text-[#6B5A4E]">Your previous attempts could not be loaded right now. Please refresh the page.</p>;
  }
  if (!progress) {
    return <div className="h-20 rounded-2xl bg-white border border-[#E3D8CC] animate-pulse" aria-hidden="true" />;
  }
  if (progress.attempts.length === 0) {
    return (
      <p className="text-sm text-[#6B5A4E]" data-section="attempt-history-empty">
        You have not completed this assessment yet. When you do, your reports will be saved here so you can compare
        future attempts.
      </p>
    );
  }
  return (
    <div className="space-y-5">
      <p className="text-sm text-[#3E3127]">
        You have completed this assessment {progress.attempts.length === 1 ? "once" : `${progress.attempts.length} times`}.
        Your latest attempt was on {formatDate(progress.attempts[0].completedAt)}.
      </p>
      <AttemptHistoryTable progress={progress} />
      {progress.attempts.length > 1 && (
        <div className="space-y-2">
          <h3 className="font-serif font-bold text-lg text-[#2D241E]">Your Progress Over Time</h3>
          <ProgressComparison progress={progress} />
        </div>
      )}
    </div>
  );
}
