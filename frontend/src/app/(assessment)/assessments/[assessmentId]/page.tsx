import React from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AssessmentRunner from "@/features/assessments/components/AssessmentRunner";
import AssessmentUnavailable from "@/features/assessments/components/AssessmentUnavailable";
import { getActiveAssessment } from "@/features/assessments/api";

interface Props {
  // The route segment is the assessment's slug, e.g. /assessments/parent-style-questionnaire
  params: Promise<{ assessmentId: string }>;
}

export default async function AssessmentRunPage({ params }: Props) {
  const { assessmentId: slug } = await params;

  let instrument = null;
  let loadFailed = false;
  try {
    instrument = await getActiveAssessment(slug);
  } catch {
    loadFailed = true;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2D241E]">
      <Navbar />

      <main className="flex-grow py-8 sm:py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Link href="/assessments" className="text-xs font-semibold text-[#8C5E42] hover:underline">
            &larr; All assessments
          </Link>
        </div>
        {instrument ? (
          <AssessmentRunner instrument={instrument} />
        ) : (
          <AssessmentUnavailable
            {...(loadFailed
              ? { title: "Assessment Temporarily Unavailable", message: "We couldn't load this assessment right now. Please refresh the page in a moment." }
              : { title: "Assessment Not Available", message: "This assessment isn't published right now. Please choose another one from the list." })}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
