import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeading from "@/components/ui/SectionHeading";

export const metadata = {
  title: "Refund & Cancellation Policy",
  description:
    "Refund and cancellation policies for digital courses and institutional programs at Insight Ignite.",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2D241E]">
      <Navbar />

      <main className="flex-grow">
        {/* Header */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-[#F3EDE6] to-[#FAF8F5] border-b border-[#E6DCD1]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <SectionHeading
              badge="Platform Governance"
              title="Refund & Cancellation Policy"
              subtitle="Clear and fair enrollment policies designed to give you peace of mind when joining Insight Ignite courses."
            />
          </div>
        </section>

        {/* Content */}
        <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E3D8CC] shadow-sm space-y-8 text-sm sm:text-base text-[#57483D] leading-relaxed">
            <div className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-[#2D241E]">
                1. Digital Masterclass Guarantee
              </h2>
              <p>
                We want you to experience genuine value from our programs. For self-paced digital courses such as <em>&ldquo;The 6 Powers of Conscious Parenting,&rdquo;</em> learners may request a refund within <strong>7 calendar days</strong> of enrollment, provided no more than 25% of the course modules have been completed.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-[#2D241E]">
                2. Live Cohorts & Interactive Workshops
              </h2>
              <p>
                For cohort-based masterclasses with limited seats:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
                <li>Cancellations requested at least 48 hours before the cohort start date will receive a full refund.</li>
                <li>Cancellations made after the cohort has commenced are non-refundable, though credit towards future cohorts may be granted upon review.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-[#2D241E]">
                3. School & Institutional Engagements
              </h2>
              <p>
                Institutional partnerships, school classroom observation programs, and customized corporate workshops are governed by the specific terms set out in their institutional service agreement.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-[#2D241E]">
                4. Refund Processing Procedure
              </h2>
              <p>
                To request a refund under the terms above, please email <strong className="text-[#2D241E]">info@insightignite.org</strong> with your registered account email, course name, and enrollment date. Once approved, refunds are credited back to the original payment source within 5–7 business days.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
