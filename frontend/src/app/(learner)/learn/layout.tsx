import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Learner Portal",
};

export default function LearnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2D241E]">
      {/* Learner Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E3D8CC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="font-serif text-lg font-bold text-[#2D241E] group-hover:text-[#8C5E42] transition-colors">
                Insight Ignite
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#FAF5EE] text-[#8C5E42] text-[10px] font-bold uppercase tracking-wider border border-[#E3D8CC]">
                Learner Portal
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-4 text-xs font-semibold">
              <Link
                href="/learn"
                className="px-3 py-1.5 rounded-lg text-[#5C4D42] hover:text-[#2D241E] hover:bg-[#FAF5EE] transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/learn/courses"
                className="px-3 py-1.5 rounded-lg text-[#5C4D42] hover:text-[#2D241E] hover:bg-[#FAF5EE] transition-colors"
              >
                My Courses
              </Link>
              <Link
                href="/profile"
                className="px-3 py-1.5 rounded-lg text-[#5C4D42] hover:text-[#2D241E] hover:bg-[#FAF5EE] transition-colors"
              >
                Profile & Settings
              </Link>
              <Link
                href="/resources"
                className="px-3 py-1.5 rounded-lg text-[#5C4D42] hover:text-[#2D241E] hover:bg-[#FAF5EE] transition-colors"
              >
                Toolkits & Guides
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-medium text-[#7A6A5E] hover:text-[#2D241E] transition-colors hidden sm:inline"
            >
              &larr; Exit to Public Site
            </Link>
            <div className="w-8 h-8 rounded-full bg-[#E8DDD2] flex items-center justify-center text-xs font-bold text-[#6D4C37]">
              L
            </div>
          </div>
        </div>
      </header>

      {/* Main Learner Content */}
      <div className="flex-grow">{children}</div>
    </div>
  );
}
