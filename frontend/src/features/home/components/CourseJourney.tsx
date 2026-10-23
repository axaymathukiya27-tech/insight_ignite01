import React from "react";
import SectionHeading from "@/components/ui/SectionHeading";

const steps = [
  {
    step: "01",
    title: "Grounding & Self-Awareness",
    description:
      "Begin by observing your own stress responses, recognizing triggers, and cultivating unhurried presence before reacting to family conflict.",
  },
  {
    step: "02",
    title: "Deep Emotional Attunement",
    description:
      "Learn to look beyond surface-level defiance or withdrawal, recognizing and validating your child's internal needs and developmental cues.",
  },
  {
    step: "03",
    title: "Clear Boundaries & Co-Regulation",
    description:
      "Establish compassionate, consistent family guidelines while serving as a steady nervous-system anchor during moments of high dysregulation.",
  },
  {
    step: "04",
    title: "Restorative Repair & Autonomy",
    description:
      "Master the art of proactive apology, rebuilding trust after ruptures, and fostering your child's independent problem-solving confidence.",
  },
];

export default function CourseJourney() {
  return (
    <section id="journey" className="py-16 sm:py-20 lg:py-24 bg-white border-b border-[#E8DFD3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Reusable Section Header Primitive */}
        <SectionHeading
          badge="Path to Connection"
          title="The Course Learning Journey"
          subtitle="A structured, 4-phase sequence designed to transform conscious parenting theory into dependable daily habits."
          className="mb-12 sm:mb-16"
        />

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((item, idx) => (
            <div
              key={idx}
              className="relative bg-[#FAF8F5] p-7 rounded-2xl border border-[#EBE3D9] flex flex-col justify-between group hover:border-[#8C5E42]/50 hover:shadow-md transition-all duration-200"
            >
              <div>
                {/* Step Pill */}
                <div className="w-10 h-10 rounded-full bg-[#EFE7DE] text-[#8C5E42] font-mono font-bold text-sm flex items-center justify-center mb-6 group-hover:bg-[#8C5E42] group-hover:text-white transition-colors">
                  {item.step}
                </div>

                <h3 className="font-serif text-lg font-bold text-[#2D241E] mb-2 group-hover:text-[#8C5E42] transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-[#5B4C41] leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#F0E8DE] text-xs font-semibold text-[#8C5E42]">
                Stage {idx + 1} of 4
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
