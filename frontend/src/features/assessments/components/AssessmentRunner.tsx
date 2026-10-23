"use client";

import React, { useState } from "react";
import {
  PublicAssessmentInstrument,
  AssessmentResultDto,
} from "@insight-ignite/shared";
import AssessmentIntro from "./AssessmentIntro";
import ProgressBar from "./ProgressBar";
import QuestionCard from "./QuestionCard";
import AssessmentReportView from "./AssessmentReportView";
import ClaimModal from "./ClaimModal";
import { submitAssessment } from "../api";

interface Props {
  instrument: PublicAssessmentInstrument;
}

type Stage = "INTRO" | "QUESTIONS" | "SUBMITTING" | "RESULT";

export default function AssessmentRunner({ instrument }: Props) {
  const [stage, setStage] = useState<Stage>("INTRO");
  const [consentNoticeVersion, setConsentNoticeVersion] = useState<string>("");

  // In-memory answer map: itemId -> selectedOptionId
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // Unanswered questions flagged after a submit attempt
  const [missingIds, setMissingIds] = useState<Set<string>>(new Set());

  // Result state
  const [result, setResult] = useState<AssessmentResultDto | null>(null);
  const [claimToken, setClaimToken] = useState<string | undefined>(undefined);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  // Sorted items
  const items = [...instrument.items].sort((a, b) => a.orderIndex - b.orderIndex);
  const answeredCount = items.filter((item) => answers[item.id]).length;

  const handleConsentGiven = (noticeVersion: string) => {
    setConsentNoticeVersion(noticeVersion);
    setStage("QUESTIONS");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectOption = (itemId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [itemId]: optionId,
    }));
    setMissingIds((prev) => {
      if (!prev.has(itemId)) return prev;
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  };

  const handleSubmit = async () => {
    const missing = items.filter((item) => item.isRequired && !answers[item.id]);
    if (missing.length > 0) {
      setMissingIds(new Set(missing.map((item) => item.id)));
      // Scroll after React has re-rendered the highlighted questions
      requestAnimationFrame(() => {
        document
          .getElementById(`question-${missing[0].id}`)
          ?.scrollIntoView({ block: "center" });
      });
      return;
    }
    await executeSubmission();
  };

  const executeSubmission = async () => {
    setStage("SUBMITTING");
    setSubmitError(null);

    const payload = {
      versionId: instrument.versionId,
      consentGiven: true as const,
      consentNoticeVersion,
      answers: items.map((item) => ({
        itemId: item.id,
        selectedOptionId: answers[item.id] || "",
      })),
    };

    try {
      const response = await submitAssessment(payload);
      setResult(response.result);
      if (response.claimToken) {
        setClaimToken(response.claimToken);
      }
      setStage("RESULT");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      setStage("QUESTIONS");
      const msg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while scoring your reflection. Please retry.";
      setSubmitError(msg);
    }
  };

  if (stage === "INTRO") {
    return (
      <AssessmentIntro
        instrument={instrument}
        onConsentGiven={handleConsentGiven}
      />
    );
  }

  if (stage === "SUBMITTING") {
    return (
      <div className="max-w-2xl mx-auto my-20 px-4 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF5EE] border border-[#E3D8CC] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#8C5E42] border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-bold text-[#2D241E]">
            Calculating Your Parenting Reflection
          </h2>
          <p className="text-sm text-[#6B5A4E] max-w-md mx-auto">
            Your responses are being analyzed securely server-side against Dr. Nivedita Ganguli&apos;s approved scoring models...
          </p>
        </div>
      </div>
    );
  }

  if (stage === "RESULT" && result) {
    return (
      <>
        <AssessmentReportView
          result={result}
          onOpenClaimModal={() => setIsClaimModalOpen(true)}
        />
        {claimToken && (
          <ClaimModal
            claimToken={claimToken}
            isOpen={isClaimModalOpen}
            onClose={() => setIsClaimModalOpen(false)}
            onClaimSuccess={() => {
              setResult((prev) => (prev ? { ...prev, isAnonymous: false } : prev));
              setClaimToken(undefined);
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="max-w-3xl mx-auto my-8 px-4 sm:px-6 space-y-8">
      {/* Top Navigation & Progress (stays visible while scrolling) */}
      <div className="sticky top-20 z-30 bg-[#FAF8F5]/95 backdrop-blur-sm py-3 space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStage("INTRO")}
            className="text-xs font-semibold text-[#8C5E42] hover:text-[#724B34] flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5E42] p-1 rounded-md"
          >
            ← Back to Overview
          </button>
          <span className="text-xs text-[#8A796E]">
            {instrument.title}
          </span>
        </div>

        <ProgressBar current={answeredCount} total={items.length} label="answered" />
      </div>

      {/* Submission Error Banner */}
      {submitError && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FCA5A5] text-xs text-[#991B1B] flex items-start gap-2.5"
        >
          <svg
            className="w-5 h-5 shrink-0 mt-0.5 text-[#DC2626]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="space-y-1">
            <span className="font-bold">Submission Error:</span> {submitError}
            <p className="text-[11px] text-[#7F1D1D]">
              Your previous selections are safely preserved. Please try submitting again.
            </p>
          </div>
        </div>
      )}

      {/* All questions, listed in order */}
      <ol className="space-y-6">
        {items.map((item, idx) => (
          <li
            key={item.id}
            id={`question-${item.id}`}
            className={`bg-white rounded-3xl p-5 sm:p-8 border shadow-sm scroll-mt-40 ${
              missingIds.has(item.id) ? "border-[#FCA5A5]" : "border-[#E3D8CC]"
            }`}
          >
            <QuestionCard
              item={item}
              number={idx + 1}
              selectedOptionId={answers[item.id]}
              onSelectOption={(optionId) => handleSelectOption(item.id, optionId)}
              error={missingIds.has(item.id) ? "Please choose an answer for this question." : undefined}
            />
          </li>
        ))}
      </ol>

      {/* Submit */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E3D8CC] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-[#5C4D42]">
          {answeredCount === items.length
            ? "All questions answered. You're ready to see your reflection."
            : `${items.length - answeredCount} question${items.length - answeredCount === 1 ? "" : "s"} still to answer.`}
        </p>
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-semibold text-sm hover:bg-[#724B34] transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5E42]"
        >
          Submit &amp; See My Reflection →
        </button>
      </div>
    </div>
  );
}
