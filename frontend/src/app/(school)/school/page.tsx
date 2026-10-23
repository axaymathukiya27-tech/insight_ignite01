import React from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeading from "@/components/ui/SectionHeading";

export const metadata = {
  title: "School & Institutional Portal",
};

export default function SchoolPortalPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2D241E]">
      <Navbar />

      <main className="flex-grow">
        <section className="py-16 sm:py-20 bg-gradient-to-b from-[#F3EDE6] to-[#FAF8F5] border-b border-[#E6DCD1]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <SectionHeading
              badge="Phase 3 Roadmap"
              title="School & Institutional Management"
              subtitle="Coordinated support systems, teacher observation workflows, and multi-tiered student intervention tracking."
            />
          </div>
        </section>

        <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-[#E3D8CC] shadow-sm space-y-3">
              <h3 className="font-serif font-bold text-lg text-[#2D241E]">
                Student Management
              </h3>
              <p className="text-xs text-[#5C4D42] leading-relaxed">
                Roster management, parent communication logs, and confidential classroom behavioral notes.
              </p>
              <Link
                href="/school/students"
                className="inline-block text-xs font-semibold text-[#8C5E42] hover:underline"
              >
                View Roster Module &rarr;
              </Link>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#E3D8CC] shadow-sm space-y-3">
              <h3 className="font-serif font-bold text-lg text-[#2D241E]">
                Teacher Collaboration
              </h3>
              <p className="text-xs text-[#5C4D42] leading-relaxed">
                Peer observation protocols, professional mentorship resources, and teacher wellbeing checks.
              </p>
              <Link
                href="/school/teachers"
                className="inline-block text-xs font-semibold text-[#8C5E42] hover:underline"
              >
                View Faculty Module &rarr;
              </Link>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#E3D8CC] shadow-sm space-y-3">
              <h3 className="font-serif font-bold text-lg text-[#2D241E]">
                Institutional Reports
              </h3>
              <p className="text-xs text-[#5C4D42] leading-relaxed">
                Anonymized school-wide psychological safety trends, academic resilience data, and governance reports.
              </p>
              <Link
                href="/school/reports"
                className="inline-block text-xs font-semibold text-[#8C5E42] hover:underline"
              >
                View Analytics Module &rarr;
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
