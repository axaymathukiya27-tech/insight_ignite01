import React from "react";
import SectionHeading from "@/components/ui/SectionHeading";

const outcomes = [
  {
    title: "Mindful Emotional Self-Regulation",
    description:
      "Recognize internal stress triggers before reacting, allowing you to respond with calm discernment rather than spontaneous frustration or exhaustion.",
  },
  {
    title: "Understanding Nervous System Cues",
    description:
      "Learn to interpret children's behavioral outbursts, defiance, or withdrawal as non-verbal expressions of dysregulation and emotional need.",
  },
  {
    title: "Clear, Shame-Free Limit Setting",
    description:
      "Establish and hold consistent everyday family boundaries with quiet confidence, eliminating the cycle of shouting, bribing, and post-conflict guilt.",
  },
  {
    title: "Structured Restorative Repair",
    description:
      "Master practical steps to reconnect warmly after parent-child arguments, demonstrating accountability and teaching children that relationships can heal.",
  },
  {
    title: "Encouraging Capable Independence",
    description:
      "Support your child's age-appropriate agency and problem-solving abilities without anxious over-parenting or disengaged permissiveness.",
  },
  {
    title: "Daily Connection Rituals",
    description:
      "Implement simple 5-to-10 minute intentional connection rituals into busy mornings and bedtimes to build enduring emotional safety.",
  },
];

export default function LearningOutcomes() {
  return (
    <section id="outcomes">
      <div>
        {/* Reusable Section Header Primitive */}
        <SectionHeading
          badge="Educational Objectives"
          title="What You Will Cultivate"
          subtitle="Practical, restorative parental skills developed to support daily family life with compassion, emotional clarity, and mutual respect."
          className="mb-12 sm:mb-16"
        />

        {/* Outcomes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {outcomes.map((item, idx) => (
            <div
              key={idx}
              className="p-7 rounded-2xl bg-white border border-[#E9E1D7] hover:border-[#8C5E42]/40 transition-colors duration-200 flex flex-col justify-start"
            >
              <div className="w-9 h-9 rounded-full bg-[#EFE7DE] text-[#8C5E42] flex items-center justify-center font-bold text-sm mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-serif text-lg font-bold text-[#2D241E] mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-[#5C4D42] leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Realistic Outcome Statement */}
        <div className="mt-12 p-6 rounded-2xl bg-[#FAF5EE] border border-[#E4D8CB] max-w-4xl mx-auto text-center">
          <p className="text-xs sm:text-sm text-[#665548] leading-relaxed">
            <span className="font-semibold text-[#3D2F25]">Ethical Learning Commitment:</span> Insight Ignite courses provide educational frameworks and guided parental practices. Course progress is personal and self-paced; we do not claim automatic or guaranteed clinical outcomes.
          </p>
        </div>
      </div>
    </section>
  );
}
