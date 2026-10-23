import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeading from "@/components/ui/SectionHeading";

export const metadata = {
  title: "Privacy Policy & Child Data Protection",
  description:
    "Data privacy policy and child safety governance for the Insight Ignite developmental platform.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2D241E]">
      <Navbar />

      <main className="flex-grow">
        {/* Header */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-[#F3EDE6] to-[#FAF8F5] border-b border-[#E6DCD1]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <SectionHeading
              badge="Platform Governance"
              title="Privacy Policy & Child Data Protection"
              subtitle="Our commitment to safeguarding learner privacy, parental consent, and ethical data governance across all Insight Ignite programs."
            />
          </div>
        </section>

        {/* Policy Content */}
        <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E3D8CC] shadow-sm space-y-8 text-sm sm:text-base text-[#57483D] leading-relaxed">
            <div className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-[#2D241E]">
                1. Ethical Data Governance Principles
              </h2>
              <p>
                Insight Ignite is founded on trust, human connection, and confidentiality. We treat all personal information—particularly any records relating to children, adolescents, or family dynamics—with the highest degree of care and discretion.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-[#2D241E]">
                2. Information We Collect
              </h2>
              <p>
                When you register for our courses, create an account, or submit an inquiry, we collect information strictly necessary to deliver the educational services:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>Account identifiers (full name, email address, password hash).</li>
                <li>Enrollment data and course progression records.</li>
                <li>Voluntary reflective responses and self-assessment journal entries.</li>
                <li>Transactional payment metadata (handled securely through compliant payment gateways; we never store full payment card numbers).</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-[#2D241E]">
                3. Protection of Child & Minor Data
              </h2>
              <p>
                We do not solicit personal identifiers directly from children without verified parent or legal guardian consent. In future phases involving adolescent assessments or school cohorts:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>All student participation requires explicit parent/guardian or school authorization.</li>
                <li>Assessment data is anonymized in aggregate reporting and never commercialized.</li>
                <li>Under no circumstances is student or parent data shared with advertisers or third-party data brokers.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-[#2D241E]">
                4. Data Security and Retention
              </h2>
              <p>
                We employ standard encryption in transit (TLS/HTTPS) and at rest. Account data is retained only as long as you maintain an active learner profile or as required by applicable educational compliance laws. You may request account deletion at any time by contacting our secretariat.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-[#2D241E]">
                5. Contacting the Privacy Officer
              </h2>
              <p>
                For questions regarding this policy or to exercise your rights of data access, correction, or deletion, please write to: <strong className="text-[#2D241E]">info@insightignite.org</strong>.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
