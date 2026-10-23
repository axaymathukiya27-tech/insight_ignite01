import React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";

/**
 * Homepage spotlight for the inaugural course. The six powers, outcomes and
 * syllabus are covered on the course page itself, so this stays brief.
 */
export default function FeaturedCourse() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-[#F8F5F0] border-b border-[#E8DFD3]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-[#E3D8CC] shadow-md overflow-hidden grid grid-cols-1 md:grid-cols-12">
          <div className="md:col-span-5 bg-gradient-to-br from-[#8C5E42] via-[#7B4E35] to-[#5C3925] p-8 sm:p-10 text-[#FDFBF7] flex flex-col justify-between gap-8">
            <div className="space-y-3">
              <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wide">
                Featured Course
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold leading-tight">
                The 6 Powers of Conscious Parenting
              </h2>
            </div>
            <dl className="space-y-2 text-xs text-white/80">
              <div className="flex justify-between gap-4">
                <dt>Instructor</dt>
                <dd className="font-semibold text-white">{siteConfig.author}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Format</dt>
                <dd className="font-semibold text-white">Online, self-paced</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>For</dt>
                <dd className="font-semibold text-white">Parents, guardians & educators</dd>
              </div>
            </dl>
          </div>

          <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center gap-6">
            <p className="text-base text-[#5C4D42] leading-relaxed">
              A structured learning journey that turns conscious parenting ideas into everyday
              habits: staying present, setting calm limits, co-regulating big emotions, and
              repairing after conflict.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={siteConfig.links.exploreCourse}
                className="text-center px-6 py-3 text-sm font-semibold text-[#FDFBF7] bg-[#8C5E42] hover:bg-[#724B34] rounded-full shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#8C5E42]"
              >
                View the course &rarr;
              </Link>
              <Link
                href="/courses"
                className="text-center px-6 py-3 text-sm font-semibold text-[#4A3C32] border border-[#D5C6B5] hover:bg-[#F2ECE4] rounded-full transition-colors"
              >
                All courses
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
