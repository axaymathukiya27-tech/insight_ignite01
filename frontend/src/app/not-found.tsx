import React from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2D241E]">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-[#E3D8CC] shadow-md text-center space-y-5">
          <span className="inline-block px-3 py-1 rounded-full bg-[#FAF5EE] text-[#8C5E42] text-xs font-semibold uppercase tracking-wider">
            404 Error
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#2D241E]">
            Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-[#6B5A4E] leading-relaxed">
            The page you are looking for might have been moved, renamed, or is currently in development under our phased platform roadmap.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-semibold text-xs hover:bg-[#724B34] transition-colors"
            >
              Back to Home
            </Link>
            <Link
              href="/courses"
              className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-[#D5C6B5] text-[#4A3C32] font-semibold text-xs hover:bg-[#F2ECE4] transition-colors"
            >
              Browse Courses
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
