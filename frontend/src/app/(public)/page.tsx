import React from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/features/home/components/Hero";
import AssessmentCallout from "@/features/home/components/AssessmentCallout";
import PillarsSection from "@/features/home/components/PillarsSection";
import Biography from "@/features/home/components/Biography";
import FeaturedCourse from "@/features/courses/components/FeaturedCourse";
import FAQSection from "@/features/home/components/FAQSection";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2D241E] antialiased selection:bg-[#8C5E42] selection:text-white">
      {/* Accessible Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-[#8C5E42] text-white rounded-md shadow-lg outline-none ring-2 ring-white"
      >
        Skip to main content
      </a>

      <Navbar />

      <main id="main-content" className="flex-grow">
        <Hero />

        {/* Phase one: Parent Growth Self-Assessment */}
        <AssessmentCallout />

        <PillarsSection />

        <FeaturedCourse />

        <Biography />

        <FAQSection />

        {/* Closing inquiry call to action */}
        <section className="py-16 sm:py-20 bg-gradient-to-br from-[#8C5E42] to-[#5C3925] text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight">
              Work With Dr. Nivedita Ganguli
            </h2>
            <p className="text-sm sm:text-base text-white/90 max-w-2xl mx-auto leading-relaxed">
              Parents, schools, and organizations are welcome to get in touch about mentorship,
              workshops, and collaborations.
            </p>
            <Link
              href="/contact"
              className="inline-block px-8 py-3.5 rounded-full bg-white text-[#5C3925] font-bold text-sm hover:bg-[#F5EFE8] transition-colors shadow-md"
            >
              Get in touch &rarr;
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
