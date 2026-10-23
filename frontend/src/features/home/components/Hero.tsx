import React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF8F5] via-[#F4EFEB] to-[#FAF8F5] py-16 sm:py-20 lg:py-24 border-b border-[#EAE2D8]">
      {/* Subtle organic background glow accents matching warm brown and pale blue tone */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-[#8C5E42]/5 via-[#4E768C]/5 to-transparent blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline and Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Platform Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EFE7DE] border border-[#DFCFC0] text-xs font-semibold text-[#66422D]">
              <span className="w-2 h-2 rounded-full bg-[#8C5E42] animate-pulse" aria-hidden="true" />
              <span>Educational & Developmental Mentorship • Dr. Nivedita Ganguli</span>
            </div>

            {/* Main Headline with Serif Typography */}
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-[#2D241E] leading-[1.15]">
              Nurturing Resilience, <br />
              <span className="text-[#8C5E42] italic font-normal">
                Presence & Clarity
              </span>{" "}
              Across Life&apos;s Stages
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-[#5F5146] max-w-2xl mx-auto lg:mx-0 leading-relaxed font-sans">
              Insight Ignite provides evidence-informed mentorship frameworks across conscious parenting, adolescent self-regulation, educator capacity building, and organizational resilience. Guided by {siteConfig.author}.
            </p>

            {/* Call to Actions */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                href={siteConfig.links.parentAssessment}
                className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 text-base font-semibold text-[#FDFBF7] bg-[#8C5E42] hover:bg-[#724B34] active:bg-[#5C3C29] rounded-full shadow-md hover:shadow-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#8C5E42]"
              >
                Take the Parent Self-Assessment
                <svg className="w-5 h-5 ml-2 -mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>

              <Link
                href={siteConfig.links.exploreCourse}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-[#4A3C32] bg-white hover:bg-[#F2ECE4] border border-[#D8CCBD] rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5E42]"
              >
                Explore The 6 Powers Course
              </Link>
            </div>

            {/* Note on Educational Scope */}
            <p className="text-[12px] text-[#86766B] pt-2">
              * Educational and developmental mentorship; not an emergency psychiatric service or clinical diagnosis.
            </p>
          </div>

          {/* Right Column: Hero Parent–Child Visual Showcase */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md lg:max-w-none">
              {/* Outer decorative card frame with warm stitch style */}
              <div className="relative rounded-3xl bg-white/90 p-4 sm:p-6 shadow-xl border border-[#E5DDD2] backdrop-blur-xs">
                {/* Visual Artwork representing warm Parent-Child connection */}
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-[#EFE6DC] via-[#FAF4ED] to-[#E3ECF1] flex flex-col items-center justify-center p-6 border border-[#E3D9CC]">
                  {/* Stylized warm SVG art of mindful parent and child connection */}
                  <svg
                    className="w-40 h-40 text-[#8C5E42] drop-shadow-sm transition-transform hover:scale-105 duration-300"
                    viewBox="0 0 200 200"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-label="Illustration depicting warm, mindful parent and child bond"
                    role="img"
                  >
                    {/* Parent Head & Body */}
                    <circle cx="85" cy="65" r="24" fill="#8C5E42" fillOpacity="0.85" />
                    <path
                      d="M45 155C45 118 62 102 85 102C108 102 125 118 125 155"
                      stroke="#8C5E42"
                      strokeWidth="16"
                      strokeLinecap="round"
                    />
                    {/* Child Head & Body */}
                    <circle cx="135" cy="95" r="17" fill="#B38467" />
                    <path
                      d="M108 160C108 132 120 120 135 120C150 120 162 132 162 160"
                      stroke="#B38467"
                      strokeWidth="12"
                      strokeLinecap="round"
                    />
                    {/* Connecting Heart / Resonance Wave */}
                    <path
                      d="M100 82C100 82 108 72 118 78C128 84 116 98 100 110C84 98 72 84 82 78C92 72 100 82 100 82Z"
                      fill="#C58564"
                      fillOpacity="0.8"
                    />
                    {/* Grounding Horizon Arc */}
                    <path
                      d="M20 175C70 165 130 165 180 175"
                      stroke="#4E768C"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray="6 6"
                      strokeOpacity="0.4"
                    />
                  </svg>

                  <div className="mt-3 text-center">
                    <span className="font-serif text-sm font-semibold text-[#4A3A2F]">
                      Attuned Parent–Child Bond
                    </span>
                    <p className="text-[11px] text-[#78695E] mt-0.5">
                      Grounding emotional presence across everyday family moments
                    </p>
                  </div>
                </div>

                {/* Floating pill badge 1: Core pillar */}
                <div className="absolute -top-3 -right-2 sm:-right-4 bg-white/95 border border-[#DFCFC0] px-3.5 py-1.5 rounded-full shadow-md text-xs font-medium text-[#594233] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#3F7C5D]" aria-hidden="true" />
                  <span>The 6 Powers Approach</span>
                </div>

                {/* Floating pill badge 2: Educational tone */}
                <div className="mt-4 pt-3 border-t border-[#EDE4D9] flex items-center justify-between text-xs text-[#716053]">
                  <span className="flex items-center gap-1 font-medium">
                    <svg className="w-3.5 h-3.5 text-[#8C5E42]" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Calm, Refined Curriculum
                  </span>
                  <span className="text-[#8B7869] italic">Online Self-Paced</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
