"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AssessmentReportView from "@/features/assessments/components/AssessmentReportView";
import { getAssessmentResult } from "@/features/assessments/api";
import { AssessmentResultDto } from "@insight-ignite/shared";
import { ApiError } from "@/lib/api-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default function AssessmentResultDetailPage({ params }: Props) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [result, setResult] = useState<AssessmentResultDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function fetchResult() {
      setLoading(true);
      setErrorStatus(null);
      setErrorMessage(null);
      try {
        const data = await getAssessmentResult(id);
        if (!isCancelled) {
          setResult(data);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          if (err instanceof ApiError) {
            setErrorStatus(err.status);
            setErrorMessage(err.message);
          } else {
            setErrorStatus(500);
            setErrorMessage("Failed to load your assessment result.");
          }
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    fetchResult();

    return () => {
      isCancelled = true;
    };
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2D241E]">
      <Navbar />

      <main className="flex-grow py-8 sm:py-12">
        {loading && (
          <div className="max-w-2xl mx-auto my-20 px-4 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full border-3 border-[#8C5E42] border-t-transparent animate-spin" />
            <p className="text-sm text-[#6B5A4E]">
              Loading assessment reflection...
            </p>
          </div>
        )}

        {!loading && errorStatus === 410 && (
          <div className="max-w-2xl mx-auto my-16 px-4">
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E3D8CC] text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#FEF6EC] text-[#B45309] flex items-center justify-center font-serif text-2xl font-bold">
                ⌛
              </div>
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#B45309] uppercase tracking-wide">
                  Session Expired
                </span>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D241E]">
                  Anonymous Assessment Session Expired
                </h1>
                <p className="text-sm text-[#5C4D42] max-w-md mx-auto leading-relaxed">
                  Under our 30-day guest retention policy, unclaimed anonymous assessment reports are retired after 30 days to protect your privacy.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/assessments"
                  className="inline-block px-7 py-3 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-semibold text-xs hover:bg-[#724B34] transition-colors"
                >
                  Retake Reflection &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}

        {!loading && errorStatus && errorStatus !== 410 && (
          <div className="max-w-2xl mx-auto my-16 px-4">
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E3D8CC] text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center font-serif text-2xl font-bold">
                ✕
              </div>
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#DC2626] uppercase tracking-wide">
                  Access Restricted
                </span>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D241E]">
                  Unable to Display Report
                </h1>
                <p className="text-sm text-[#5C4D42] max-w-md mx-auto leading-relaxed">
                  {errorMessage ||
                    "You do not have permission to view this report or the session credential has expired."}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <Link
                  href="/assessments"
                  className="px-6 py-2.5 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-semibold text-xs hover:bg-[#724B34] transition-colors"
                >
                  Return to Assessments
                </Link>
                <Link
                  href="/login"
                  className="px-6 py-2.5 rounded-full border border-[#D5C7B8] text-[#5C4D42] font-semibold text-xs hover:bg-[#FAF8F5] transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        )}

        {!loading && result && (
          <AssessmentReportView result={result} />
        )}
      </main>

      <Footer />
    </div>
  );
}
