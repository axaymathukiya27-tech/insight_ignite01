import React from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeading from "@/components/ui/SectionHeading";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "About Dr. Nivedita Ganguli & Insight Ignite",
  description:
    "Learn about Insight Ignite, an educational and developmental institution founded by Dr. Nivedita Ganguli, bridging family mentorship, adolescent guidance, educator capacity building, and corporate wellbeing.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2D241E]">
      <Navbar />

      <main className="flex-grow">
        {/* About Header */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-[#F5EFE8] to-[#FAF8F5] border-b border-[#E7DFD4]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <SectionHeading
              badge="About Us"
              title="About Insight Ignite"
              subtitle="An integrated educational platform advancing compassionate mentorship, mindful parenting, and institutional emotional intelligence."
            />
          </div>
        </section>

        {/* Founder & Mission Detail */}
        <section className="py-16 sm:py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Portrait Frame Column */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm rounded-3xl bg-white p-4 shadow-md border border-[#E0D4C5]">
                <div className="aspect-[4/5] rounded-2xl bg-gradient-to-b from-[#ECE3D8] to-[#DDD2C4] border border-[#D5C6B5] flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-24 h-24 rounded-full bg-[#8C5E42] text-[#FDFBF7] flex items-center justify-center font-serif text-3xl font-bold shadow-md mb-4">
                    NG
                  </div>
                  <span className="font-serif text-lg font-bold text-[#3B2E24]">{siteConfig.author}</span>
                  <span className="text-xs text-[#6F5F53] mt-1 font-medium">{siteConfig.authorTitle}</span>
                </div>
              </div>
            </div>

            {/* Narrative Column */}
            <div className="lg:col-span-7 space-y-6 text-[#524338] leading-relaxed">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D241E]">
                Leadership & Vision
              </h2>
              <p>
                {siteConfig.author} founded {siteConfig.name} to address the growing need for grounded,
                psychologically conscious, and non-punitive mentorship across all stages of human development.
              </p>
              <p>
                While the platform&apos;s inaugural online course, <em>The 6 Powers of Conscious Parenting</em>,
                provides a transformative roadmap for families, {siteConfig.name}&apos;s holistic mandate encompasses
                student resilience workshops, educator pedagogical training, and corporate emotional intelligence.
              </p>

              <p>
                Her work centers on conscious parenting, empathetic teacher-parent collaboration, and
                emotionally attuned classroom practice, always as educational mentorship rather than
                clinical treatment.
              </p>

              <div className="pt-2 flex flex-wrap gap-4">
                <Link
                  href="/programs"
                  className="px-6 py-3 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-semibold text-sm hover:bg-[#724B34] transition-colors"
                >
                  Explore All Programs
                </Link>
                <Link
                  href="/contact"
                  className="px-6 py-3 rounded-full border border-[#D5C6B5] text-[#4A3C32] font-semibold text-sm hover:bg-[#F2ECE4] transition-colors"
                >
                  Contact & Inquiries
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
