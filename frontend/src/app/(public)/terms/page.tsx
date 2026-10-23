import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeading from "@/components/ui/SectionHeading";

export const metadata = {
  title: "Terms of Service & Platform Governance",
  description:
    "Terms of service, intellectual property guidelines, and code of conduct for Insight Ignite.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2D241E]">
      <Navbar />

      <main className="flex-grow">
        {/* Header */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-[#F3EDE6] to-[#FAF8F5] border-b border-[#E6DCD1]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <SectionHeading
              badge="Platform Governance"
              title="Terms of Service"
              subtitle="Guidelines and mutual commitments governing your access to Insight Ignite online courses, resources, and community forums."
            />
          </div>
        </section>

        {/* Content */}
        <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E3D8CC] shadow-sm space-y-8 text-sm sm:text-base text-[#57483D] leading-relaxed">
            <div className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-[#2D241E]">
                1. Acceptance of Terms
              </h2>
              <p>
                By creating an account, enrolling in a course, or using the Insight Ignite platform, you agree to comply with and be bound by these Terms of Service. If you do not agree, please refrain from using our educational portal.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-[#2D241E]">
                2. Educational Nature of Services
              </h2>
              <p>
                Insight Ignite courses, masterclasses, and written guides led by Dr. Nivedita Ganguli are intended strictly for educational, developmental, and reflective purposes. They do not constitute clinical psychiatric treatment, medical therapy, or emergency intervention.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-[#2D241E]">
                3. Intellectual Property Rights
              </h2>
              <p>
                All course curriculum, videos, lesson modules, reflection worksheets, rubrics, and brand elements are the exclusive intellectual property of Dr. Nivedita Ganguli and Insight Ignite. Your enrollment grants you a personal, non-transferable license for self-paced study. You may not distribute, reproduce, or resell course content without express written authorization.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-[#2D241E]">
                4. Community Conduct & Respectful Engagement
              </h2>
              <p>
                Our study spaces, peer discussions, and cohort forums are safe environments for vulnerable reflection. Harassment, derogatory commentary, hate speech, or breach of another participant&apos;s privacy will result in immediate termination of platform access without refund.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-[#2D241E]">
                5. Governing Law & Inquiries
              </h2>
              <p>
                These terms are governed by applicable educational and commercial statutes. For questions or institutional partnership clarifications, reach out to our team at: <strong className="text-[#2D241E]">info@insightignite.org</strong>.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
