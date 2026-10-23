import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeading from "@/components/ui/SectionHeading";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { siteConfig } from "@/config/site";

interface ProgramPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProgramPageProps) {
  const { slug } = await params;
  const program = siteConfig.programs.find((p) => p.slug === slug);
  if (!program) return { title: "Program Not Found" };
  return {
    title: `${program.title}`,
    description: program.description,
  };
}

export default async function ProgramDetailPage({ params }: ProgramPageProps) {
  const { slug } = await params;
  const program = siteConfig.programs.find((p) => p.slug === slug);

  if (!program) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2D241E]">
      <Navbar />

      <main className="flex-grow">
        {/* Breadcrumb Bar */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Breadcrumbs
            items={[
              { label: "Programs", href: "/programs" },
              { label: program.title },
            ]}
          />
        </div>

        {/* Header Banner */}
        <section className="py-12 sm:py-16 bg-gradient-to-b from-[#F5EFE8] to-[#FAF8F5] border-b border-[#E7DFD4]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Link
              href="/programs"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C5E42] uppercase tracking-wider mb-4 hover:underline"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to All Programs</span>
            </Link>

            <SectionHeading
              badge={program.subtitle}
              title={program.title}
              subtitle={program.tagline}
            />
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 sm:py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Overview */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E3D8CC] shadow-xs space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-serif text-2xl font-bold text-[#2D241E]">
                Overview & Mentorship Focus
              </h2>
              <Badge variant="default">Institutional Offering</Badge>
            </div>
            <p className="text-sm sm:text-base text-[#5C4D42] leading-relaxed">
              {program.description}
            </p>
          </div>

          {/* Target Audience & Focus Areas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-[#E3D8CC] shadow-xs space-y-4">
              <span className="text-xs font-bold text-[#8C5E42] uppercase tracking-wider">
                Intended Participants
              </span>
              <h3 className="font-serif text-xl font-bold text-[#2D241E]">
                Who This Program Serves
              </h3>
              <p className="text-sm text-[#5C4D42] leading-relaxed">
                {program.targetAudience}
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-[#E3D8CC] shadow-xs space-y-4">
              <span className="text-xs font-bold text-[#8C5E42] uppercase tracking-wider">
                Core Competencies
              </span>
              <h3 className="font-serif text-xl font-bold text-[#2D241E]">
                Key Focus Areas
              </h3>
              <ul className="space-y-2 text-sm text-[#5C4D42]">
                {program.focusAreas.map((area, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#8C5E42] font-bold">•</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Callout */}
          <div className="bg-[#FAF5EE] rounded-3xl p-8 sm:p-10 border border-[#E3D8CC] text-center space-y-6">
            <div className="max-w-xl mx-auto space-y-2">
              <h3 className="font-serif text-2xl font-bold text-[#2D241E]">
                Interested in {program.title}?
              </h3>
              <p className="text-sm text-[#5C4D42]">
                Inquire directly with Dr. Nivedita Ganguli&apos;s team to schedule a cohort, seminar, or institutional consultation.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/contact"
                className="w-full sm:w-auto px-8 py-3 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-semibold text-sm hover:bg-[#724B34] transition-colors"
              >
                Inquire About This Program
              </Link>
              {program.slug === "parenting-families" && (
                <Link
                  href="/courses/the-6-powers-of-conscious-parenting"
                  className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#D5C6B5] text-[#4A3C32] font-semibold text-sm hover:bg-[#F2ECE4] transition-colors"
                >
                  View 6 Powers Course
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
