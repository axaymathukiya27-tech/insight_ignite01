import React from "react";
import Link from "next/link";
import SectionHeading from "@/components/ui/SectionHeading";
import { siteConfig } from "@/config/site";

/**
 * Compact overview of the five program areas. Full descriptions and focus
 * areas live on /programs, so this section only teases each one.
 */
export default function PillarsSection() {
  return (
    <section id="pillars" className="py-16 sm:py-20 lg:py-24 bg-[#F8F5F0] border-b border-[#E8DFD3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="What We Do"
          title="Five Areas of Developmental Work"
          subtitle="Mentorship and resources for families, young people, schools, and organizations."
          className="mb-12 sm:mb-14"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {siteConfig.programs.map((prog, idx) => (
            <Link
              key={prog.slug}
              href={`/programs/${prog.slug}`}
              className="group bg-white rounded-2xl p-6 border border-[#E3D8CC] shadow-xs hover:shadow-md hover:border-[#8C5E42]/50 transition-all duration-300 flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5E42]"
            >
              <span className="font-mono text-xs font-bold text-[#8C5E42] mb-4">
                0{idx + 1}
              </span>
              <h3 className="font-serif text-lg font-bold text-[#2D241E] leading-snug mb-2 group-hover:text-[#8C5E42] transition-colors">
                {prog.title}
              </h3>
              <p className="text-sm text-[#6B5A4E] leading-relaxed flex-grow">
                {prog.tagline}
              </p>
              <span className="mt-5 inline-flex items-center text-sm font-semibold text-[#8C5E42]">
                Learn more
                <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
