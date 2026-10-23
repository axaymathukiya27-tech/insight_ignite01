import React from "react";
import { PowerModule } from "../types";

const powers: PowerModule[] = [
  {
    id: "presence",
    number: "01",
    title: "Presence",
    tagline: "Grounded, unhurried awareness",
    description:
      "Cultivating the capacity to be fully present with your child in the moment, moving beyond digital distractions, mental fatigue, and anxiety to offer attentive warmth.",
    reflectionQuestion: "Can I bring gentle attention to my child without immediately trying to correct or rush them?",
    iconSvg: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    id: "attunement",
    number: "02",
    title: "Attunement",
    tagline: "Honoring the internal emotional state",
    description:
      "Listening beneath words and overt behavior to sense what your child is genuinely experiencing, feeling, and needing from a developmental standpoint.",
    reflectionQuestion: "What emotion is my child experiencing beneath this challenging behavior?",
    iconSvg: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    id: "clarity",
    number: "03",
    title: "Clarity",
    tagline: "Compassionate, predictable boundaries",
    description:
      "Setting non-negotiable household limits and safety boundaries with kindness, stability, and mutual respect, eliminating the need for punitive shaming or shouting.",
    reflectionQuestion: "Am I communicating expectations with calm conviction rather than reactive frustration?",
    iconSvg: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    id: "co-regulation",
    number: "04",
    title: "Co-Regulation",
    tagline: "Nervous-system anchor during distress",
    description:
      "Lending your regulated nervous system to soothe a child who is emotionally dysregulated, overwhelmed, or in fight-or-flight distress.",
    reflectionQuestion: "Can I remain the calm harbor when my child is caught in an emotional storm?",
    iconSvg: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: "repair",
    number: "05",
    title: "Repair",
    tagline: "Rebuilding connection following rupture",
    description:
      "The humble and restorative practice of acknowledging emotional ruptures, offering sincere apologies, and re-establishing felt safety after conflict.",
    reflectionQuestion: "How quickly and warmly do I step forward to reconnect after a disagreement?",
    iconSvg: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    id: "autonomy",
    number: "06",
    title: "Autonomy",
    tagline: "Fostering developmental agency & trust",
    description:
      "Nurturing your child's age-appropriate independence, problem-solving confidence, and self-advocacy within a steady, supportive container.",
    reflectionQuestion: "Am I stepping back enough to allow my child to experience capable self-efficacy?",
    iconSvg: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
];

export default function SixPowers() {
  return (
    <section id="six-powers" className="py-16 sm:py-20 lg:py-24 bg-[#F5EFE8]/50 border-b border-[#E7DFD4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          {/* Explicit Provisional Notice Banner as mandated by content policy */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EADCCF] text-[#593E2D] text-xs font-semibold tracking-wide uppercase mb-4 border border-[#D9C4B3]">
            <svg className="w-3.5 h-3.5 text-[#8C5E42]" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Provisional Curriculum • Awaiting Final Approval</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2D241E] tracking-tight">
            The 6 Powers Framework
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#66564B] leading-relaxed">
            These six interconnected pillars structure our conscious parenting methodology.
            Presented here as provisional preview content pending stakeholder verification.
          </p>
        </div>

        {/* 6 Powers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {powers.map((power) => (
            <div
              key={power.id}
              className="bg-white rounded-2xl p-7 border border-[#E4DACF] shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group hover:border-[#8C5E42]/40"
            >
              <div>
                {/* Header with Number and Icon */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-[#FAF6F2] border border-[#E9DFC3]/60 text-[#8C5E42] flex items-center justify-center group-hover:bg-[#8C5E42] group-hover:text-white transition-colors">
                    {power.iconSvg}
                  </div>
                  <span className="font-mono text-sm font-semibold text-[#8C5E42] bg-[#F7F2EC] px-2.5 py-1 rounded-md border border-[#EAE0D4]">
                    Power {power.number}
                  </span>
                </div>

                {/* Title & Tagline */}
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#2D241E] mb-1 group-hover:text-[#8C5E42] transition-colors">
                  {power.title}
                </h3>
                <p className="text-xs font-medium text-[#7D6B5E] mb-3">
                  {power.tagline}
                </p>

                {/* Description */}
                <p className="text-sm text-[#5B4C41] leading-relaxed">
                  {power.description}
                </p>
              </div>

              {/* Reflective Inquiry Prompt */}
              <div className="mt-6 pt-4 border-t border-[#F0E8DE] bg-[#FAF8F5] -mx-7 -mb-7 p-5 rounded-b-2xl">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#796758] mb-1">
                  Reflective Practice:
                </span>
                <p className="text-xs italic text-[#4D3F35] leading-normal">
                  &ldquo;{power.reflectionQuestion}&rdquo;
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Governance note at section base */}
        <div className="mt-12 text-center">
          <p className="text-xs text-[#7A6B5F] max-w-2xl mx-auto">
            * Content Notice: Detailed module syllabi, video lessons, and parenting exercises for The 6 Powers are in active review and will be formally published upon author sign-off.
          </p>
        </div>
      </div>
    </section>
  );
}
