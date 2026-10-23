import React from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function SchoolTeachersPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2D241E]">
      <Navbar />
      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
        <Link href="/school" className="text-xs font-semibold text-[#8C5E42] hover:underline">
          &larr; Back to School Portal
        </Link>
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E3D8CC] shadow-sm space-y-4">
          <span className="px-3 py-1 rounded-full bg-[#FAF5EE] text-[#8C5E42] text-xs font-semibold">
            Phase 3 Module
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#2D241E]">
            Teacher Mentorship & Faculty Wellbeing
          </h1>
          <p className="text-sm text-[#5C4D42] leading-relaxed">
            Faculty members can access Dr. Nivedita Ganguli&apos;s classroom observation feedback, self-attunement reflections, and restorative conflict resolution guides.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
