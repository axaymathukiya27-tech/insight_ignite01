import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeading from "@/components/ui/SectionHeading";
import AssessmentUnavailable from "@/features/assessments/components/AssessmentUnavailable";
import AssessmentCatalogCards from "@/features/assessments/components/AssessmentCatalogCards";
import { listActiveAssessments, ActiveAssessmentSummary } from "@/features/assessments/api";

export const metadata = {
  title: "Parent Self-Assessments",
  description:
    "Reflective self-assessments for parents and caregivers, created by Dr. Nivedita Ganguli.",
};

export default async function AssessmentsPage() {
  let assessments: ActiveAssessmentSummary[] = [];
  let loadFailed = false;

  try {
    assessments = await listActiveAssessments();
  } catch {
    loadFailed = true;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2D241E]">
      <Navbar />

      <main className="flex-grow py-8 sm:py-12">
        {loadFailed ? (
          <AssessmentUnavailable
            title="Assessments Temporarily Unavailable"
            message="We couldn't load the assessments right now. Please refresh the page in a moment."
          />
        ) : assessments.length === 0 ? (
          <AssessmentUnavailable />
        ) : (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <SectionHeading
              badge="Free · Private"
              title="Parent Self-Assessments"
              subtitle="Choose a reflection to begin. Each one is an educational tool, not a diagnosis, and you can take it without creating an account."
            />
            <AssessmentCatalogCards assessments={assessments} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
