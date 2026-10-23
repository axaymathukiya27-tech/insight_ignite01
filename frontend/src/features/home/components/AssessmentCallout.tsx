import React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";

const steps = [
  { title: "Reflect", text: "Answer short questions about everyday moments with your child." },
  { title: "See your profile", text: "Get a private summary of your strengths and growth areas." },
  { title: "Take the next step", text: "Receive course suggestions matched to your results." },
];

/**
 * Homepage entry point for the Parent Growth Self-Assessment (phase one).
 */
export default function AssessmentCallout() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-[#FAF8F5] border-b border-[#E8DFD3]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-5 text-center lg:text-left">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#E3ECF1] text-[#2D4558] text-xs font-semibold tracking-wide uppercase">
              Free · Private
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2D241E] tracking-tight">
              Parent Growth Self-Assessment
            </h2>
            <p className="text-base text-[#5C4D42] leading-relaxed">
              A gentle, private reflection on how you show up for your child. It is an educational
              tool, not a diagnosis, and you can take it without creating an account.
            </p>
            <Link
              href={siteConfig.links.parentAssessment}
              className="inline-flex items-center justify-center px-7 py-3.5 text-base font-semibold text-[#FDFBF7] bg-[#8C5E42] hover:bg-[#724B34] rounded-full shadow-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#8C5E42]"
            >
              Start the assessment &rarr;
            </Link>
          </div>

          <ol className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {steps.map((step, idx) => (
              <li key={step.title} className="bg-white rounded-2xl border border-[#E3D8CC] p-6 shadow-xs">
                <span className="w-9 h-9 rounded-full bg-[#F2EBE1] text-[#8C5E42] flex items-center justify-center font-bold text-sm mb-4">
                  {idx + 1}
                </span>
                <h3 className="font-serif text-lg font-bold text-[#2D241E] mb-1.5">{step.title}</h3>
                <p className="text-sm text-[#6B5A4E] leading-relaxed">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
