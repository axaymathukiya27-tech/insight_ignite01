"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PracticePlanDayTemplateDto, PracticePlanDto } from "@insight-ignite/shared";
import { getPracticePlan, startPracticePlan, updatePracticeDay } from "../api";
import { ApiError } from "@/lib/api-client";

interface Props {
  submissionId: string;
  template: PracticePlanDayTemplateDto[];
  // True when the result belongs to a signed-in account (progress can be saved)
  canTrack: boolean;
  onOpenClaimModal?: () => void;
}

function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";
}

/**
 * The seven-day plan. Everyone sees the plan itself (it is part of the report and is
 * printed); signed-in owners can start it, tick off days and save short reflections.
 */
export default function PracticePlanSection({ submissionId, template, canTrack, onOpenClaimModal }: Props) {
  const [plan, setPlan] = useState<PracticePlanDto | null>(null);
  const [busyDay, setBusyDay] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [savedNote, setSavedNote] = useState<number | null>(null);

  useEffect(() => {
    if (!canTrack) return;
    let active = true;
    getPracticePlan(submissionId)
      .then((p) => {
        if (!active) return;
        setPlan(p);
        setNotes(Object.fromEntries(p.days.map((d) => [d.day, d.note || ""])));
      })
      .catch(() => {
        // Not signed in as the owner: the plan still shows, read-only
      });
    return () => {
      active = false;
    };
  }, [submissionId, canTrack]);

  const days = plan?.days ?? template.map((t) => ({ ...t, completedAt: null as string | null, note: null as string | null }));
  const started = Boolean(plan?.started);
  const completedCount = plan?.completedCount ?? 0;
  const pct = plan?.completionPct ?? 0;

  const handleError = (err: unknown) =>
    setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");

  const start = async () => {
    setStarting(true);
    setError(null);
    try {
      setPlan(await startPracticePlan(submissionId));
    } catch (err) {
      handleError(err);
    } finally {
      setStarting(false);
    }
  };

  const toggle = async (day: number, completed: boolean) => {
    if (busyDay !== null) return; // ignore repeated clicks while saving
    setBusyDay(day);
    setError(null);
    try {
      setPlan(await updatePracticeDay(submissionId, day, { completed, note: notes[day] ?? null }));
    } catch (err) {
      handleError(err);
    } finally {
      setBusyDay(null);
    }
  };

  const saveNote = async (day: number, completed: boolean) => {
    if (busyDay !== null) return;
    setBusyDay(day);
    setError(null);
    try {
      setPlan(await updatePracticeDay(submissionId, day, { completed, note: notes[day] ?? "" }));
      setSavedNote(day);
    } catch (err) {
      handleError(err);
    } finally {
      setBusyDay(null);
    }
  };

  if (days.length === 0) {
    return (
      <p className="text-sm text-[#6B5A4E]">
        A practice plan is not available for this report because it was calculated before personalized plans were
        introduced. Retake the assessment to receive a seven-day plan based on your current answers.
      </p>
    );
  }

  return (
    <div className="space-y-4" data-section="practice-plan">
      <div className="print:hidden rounded-2xl bg-[#FAF8F5] border border-[#EBE2D7] p-4 sm:p-5 space-y-3">
        {started ? (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-[#5C4D42]">
              <span>
                Started {formatDate(plan!.startedAt)}
                {plan!.completedAt ? ` · Completed ${formatDate(plan!.completedAt)}` : ""}
              </span>
              <span className="font-semibold text-[#2D241E]">
                {completedCount} of {days.length} days complete ({pct}%)
              </span>
            </div>
            <div
              className="h-2 w-full bg-[#E5DCD1] rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Practice plan progress"
            >
              <div className="h-full bg-[#2E6F40] rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </>
        ) : canTrack ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-[#5C4D42]">
              Start the plan to tick off each day, save short reflections, and come back to it later.
            </p>
            <button
              type="button"
              onClick={start}
              disabled={starting}
              className="shrink-0 px-5 py-2.5 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-semibold text-xs hover:bg-[#724B34] disabled:opacity-60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5E42]"
            >
              {starting ? "Starting..." : "Start my seven-day plan"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-[#5C4D42]">
              Save this report to a free account to track your progress through the plan day by day.
            </p>
            {onOpenClaimModal ? (
              <button
                type="button"
                onClick={onOpenClaimModal}
                className="shrink-0 px-5 py-2.5 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-semibold text-xs hover:bg-[#724B34] transition-colors"
              >
                Save to profile
              </button>
            ) : (
              <Link href="/login" className="shrink-0 px-5 py-2.5 rounded-full border border-[#D5C7B8] text-[#5C4D42] font-semibold text-xs hover:bg-white">
                Sign in
              </Link>
            )}
          </div>
        )}
        {error && (
          <p role="alert" className="text-xs text-[#B91C1C]">
            {error}
          </p>
        )}
      </div>

      <ol className="space-y-3">
        {days.map((d) => {
          const done = Boolean(d.completedAt);
          return (
            <li
              key={d.day}
              data-plan-day={d.day}
              className={`report-card rounded-2xl border p-4 sm:p-5 space-y-2 ${done ? "bg-[#F6FAF7] border-[#D5EAD9]" : "bg-white border-[#EBE2D7]"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C5E42]">
                    Day {d.day} · about {d.minutes} minutes
                  </p>
                  <h3 className="font-serif font-bold text-base text-[#2D241E]">{d.title}</h3>
                  <p className="text-xs text-[#8A796E]">Focus: {d.factorNames.join(" and ")}</p>
                </div>
                {started && (
                  <label className="print:hidden shrink-0 inline-flex items-center gap-2 text-xs font-semibold text-[#2D241E] cursor-pointer min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={done}
                      disabled={busyDay !== null}
                      onChange={(e) => toggle(d.day, e.target.checked)}
                      className="w-5 h-5 accent-[#2E6F40]"
                    />
                    {done ? "Done" : "Mark done"}
                  </label>
                )}
              </div>
              <p className="text-xs sm:text-sm text-[#3E3127] leading-relaxed">
                <span className="font-semibold">Goal: </span>
                {d.objective}
              </p>
              <p className="text-xs sm:text-sm text-[#3E3127] leading-relaxed">
                <span className="font-semibold">Today&apos;s practice: </span>
                {d.exercise}
              </p>
              <p className="text-xs text-[#6B5A4E] leading-relaxed">
                <span className="font-semibold">For example: </span>
                {d.example}
              </p>
              <p className="text-xs text-[#6B5A4E] leading-relaxed italic">
                <span className="font-semibold not-italic">Reflect: </span>
                {d.reflection}
              </p>
              {started && (
                <div className="print:hidden space-y-1.5 pt-1">
                  <label htmlFor={`note-${d.day}`} className="text-[11px] font-semibold text-[#5C4D42]">
                    Your note (optional, only you can see it)
                  </label>
                  <textarea
                    id={`note-${d.day}`}
                    rows={2}
                    maxLength={1000}
                    value={notes[d.day] ?? ""}
                    onChange={(e) => {
                      setNotes((n) => ({ ...n, [d.day]: e.target.value }));
                      setSavedNote(null);
                    }}
                    className="w-full rounded-xl border border-[#E3D8CC] bg-white px-3 py-2 text-xs text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={busyDay !== null}
                      onClick={() => saveNote(d.day, done)}
                      className="px-4 py-1.5 rounded-full border border-[#D5C7B8] text-[#5C4D42] text-xs font-semibold hover:bg-[#FAF8F5] disabled:opacity-60"
                    >
                      Save note
                    </button>
                    {savedNote === d.day && <span className="text-[11px] text-[#2E6F40]">Saved</span>}
                  </div>
                </div>
              )}
              {d.note && <p className="hidden print:block text-xs text-[#5C4D42]">Your note: {d.note}</p>}
            </li>
          );
        })}
      </ol>

      {plan?.completedAt && (
        <div role="status" className="rounded-2xl bg-[#F6FAF7] border border-[#D5EAD9] p-4 sm:p-5 text-sm text-[#1E562F] leading-relaxed">
          You have spent seven days practising small changes in your everyday parenting. You can now repeat this
          assessment to reflect on how your responses compare with your previous results.
        </div>
      )}
    </div>
  );
}
