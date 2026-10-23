import React from "react";
import Link from "next/link";

export default function LearnerCoursesPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="space-y-1">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D241E]">
          My Enrolled Courses
        </h1>
        <p className="text-sm text-[#5C4D42]">
          Manage and access all masterclasses you have registered for on Insight Ignite.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E3D8CC] shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <span className="inline-block px-3 py-1 rounded-full bg-[#FAF5EE] text-[#8C5E42] text-xs font-semibold">
              In Progress
            </span>
            <h2 className="font-serif text-xl font-bold text-[#2D241E]">
              The 6 Powers of Conscious Parenting
            </h2>
            <p className="text-xs text-[#5C4D42] leading-relaxed">
              Dr. Nivedita Ganguli&apos;s foundational program covering presence, attunement, clarity, co-regulation, repair, and autonomy.
            </p>
            <div className="pt-2 text-xs text-[#7B6A5F]">
              Status: Module 1 ready &bull; 6 total modules
            </div>
          </div>

          <div className="pt-4 border-t border-[#EFE8DF] flex items-center justify-between">
            <Link
              href="/learn/courses/the-6-powers-of-conscious-parenting"
              className="px-5 py-2 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-semibold text-xs hover:bg-[#724B34] transition-colors"
            >
              Enter Classroom
            </Link>
            <Link
              href="/courses/the-6-powers-of-conscious-parenting"
              className="text-xs text-[#8C5E42] font-semibold hover:underline"
            >
              View Syllabus
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
