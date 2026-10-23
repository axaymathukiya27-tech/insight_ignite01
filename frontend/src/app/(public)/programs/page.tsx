import React from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeading from "@/components/ui/SectionHeading";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Developmental Programs",
  description:
    "Explore the 5 foundational developmental programs of Insight Ignite: Parenting & Families, Students & Adolescents, Educators & Schools, Corporate Training, and Educational Resources.",
};

export default function ProgramsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2D241E]">
      <Navbar />

      <main className="flex-grow">
        {/* Header */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-[#F5EFE8] to-[#FAF8F5] border-b border-[#E7DFD4]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <SectionHeading
              badge="Areas of Practice"
              title="Educational & Developmental Programs"
              subtitle="Structured mentorship initiatives, capacity-building workshops, and online learning modules tailored for families, educators, and organizations."
            />
          </div>
        </section>

        {/* Programs Listing */}
        <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {siteConfig.programs.map((prog, idx) => (
              <div
                key={prog.slug}
                className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E3D8CC] shadow-xs hover:shadow-md transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
              >
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[#8C5E42] bg-[#FAF5EF] px-3 py-1 rounded-md border border-[#EADBCE]">
                      Program 0{idx + 1}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#7A6B5F]">
                      {prog.subtitle}
                    </span>
                  </div>

                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D241E]">
                    {prog.title}
                  </h2>
                  <p className="text-sm font-medium text-[#7A6B5F] italic">
                    {prog.tagline}
                  </p>
                  <p className="text-base text-[#56473C] leading-relaxed">
                    {prog.description}
                  </p>

                  <div className="pt-2">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-[#796758] mb-2">
                      Target Audience: <strong className="text-[#3D3026] normal-case font-medium">{prog.targetAudience}</strong>
                    </span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {prog.focusAreas.map((area, aIdx) => (
                        <span
                          key={aIdx}
                          className="text-xs font-medium px-3 py-1 rounded-md bg-[#FAF6F1] border border-[#EBE1D6] text-[#55453A]"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 flex flex-col justify-center items-start lg:items-end gap-4 border-t lg:border-t-0 lg:border-l border-[#F0E7DD] pt-6 lg:pt-0 lg:pl-8">
                  <Link
                    href={`/programs/${prog.slug}`}
                    className="w-full sm:w-auto text-center px-6 py-3 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-semibold text-sm hover:bg-[#724B34] transition-colors"
                  >
                    View Program Details
                  </Link>
                  <Link
                    href="/contact"
                    className="w-full sm:w-auto text-center px-6 py-3 rounded-full border border-[#D5C6B5] text-[#4A3C32] font-semibold text-sm hover:bg-[#F2ECE4] transition-colors"
                  >
                    Inquire About Sessions
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
