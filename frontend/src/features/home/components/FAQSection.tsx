"use client";

import React, { useState } from "react";
import SectionHeading from "@/components/ui/SectionHeading";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "Who is 'The 6 Powers of Conscious Parenting' course designed for?",
    answer:
      "This course is created for parents, guardians, educators, and mentors seeking a mindful, non-punitive approach to child rearing. It is suitable for families with children of all developmental ages who wish to deepen communication and reduce household friction.",
  },
  {
    question: "When will course pricing and enrollment be announced?",
    answer:
      "Course pricing, module schedules, and enrollment windows are currently in the Phase 1 development phase. Once approved by Dr. Nivedita Ganguli, clear and confirmed registration details will be published directly on this website.",
  },
  {
    question: "What format does the course take?",
    answer:
      "The masterclass will be delivered as an online, self-paced learning program consisting of structured conceptual modules, guided reflective exercises, and real-world parent-child conversation frameworks.",
  },
  {
    question: "Does this course offer psychiatric, medical, or clinical diagnostic services?",
    answer:
      "No. Insight Ignite courses are strictly educational in nature. They provide developmental frameworks and parenting mentorship. They do not diagnose mental health conditions or replace individualized clinical evaluations by qualified healthcare professionals.",
  },
  {
    question: "How does conscious parenting differ from traditional discipline?",
    answer:
      "Traditional discipline often relies on external compliance through rewards or punitive consequences. Conscious parenting looks at the internal state of the child and the parent, prioritizing nervous system co-regulation, emotional connection, and compassionate boundaries that encourage intrinsic self-discipline.",
  },
  {
    question: "What is the refund policy for Insight Ignite courses?",
    answer:
      "Insight Ignite will offer a clearly stated refund policy compliant with Indian e-commerce consumer guidelines, detailed in our official terms upon checkout activation. Please consult the provisional Refund Policy link in the footer for our baseline governance framework.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faqs" className="py-16 sm:py-20 lg:py-24 bg-[#FAF7F2] border-b border-[#E8DFD3]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Reusable Section Header Primitive */}
        <SectionHeading
          badge="Frequently Asked Questions"
          title="Common Inquiries"
          subtitle="Transparent answers regarding course scope, enrollment status, and educational philosophy."
          className="mb-12 sm:mb-16"
        />

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            const controlId = `faq-answer-${idx}`;
            const buttonId = `faq-button-${idx}`;

            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-[#E3D8CC] shadow-xs overflow-hidden transition-all duration-200"
              >
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    onClick={() => toggleFAQ(idx)}
                    aria-expanded={isOpen}
                    aria-controls={controlId}
                    className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 font-serif text-lg sm:text-xl font-bold text-[#2D241E] hover:text-[#8C5E42] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8C5E42] focus-visible:ring-offset-2"
                  >
                    <span>{faq.question}</span>
                    <span
                      className={`flex-shrink-0 w-8 h-8 rounded-full bg-[#FAF6F1] flex items-center justify-center text-[#8C5E42] transition-transform duration-200 ${
                        isOpen ? "rotate-180 bg-[#8C5E42] text-white" : ""
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>
                </h3>

                {isOpen && (
                  <div
                    id={controlId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="px-6 pb-6 pt-1 text-sm sm:text-base text-[#56483E] leading-relaxed border-t border-[#F2ECE4] animate-in fade-in-50 duration-200"
                  >
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
