import React from "react";
import Link from "next/link";

export default function AdminOverviewPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D241E]">
            Platform Administration
          </h1>
          <p className="text-sm text-[#5C4D42]">
            Phase 1 Administrative overview of courses, user accounts, and platform health.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#EAE3D9] text-[#78543B] text-xs font-semibold">
            System Status: Operational
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-[#E3D8CC] shadow-sm space-y-2">
          <span className="text-xs uppercase text-[#8A796E] font-medium tracking-wider">
            Total Courses
          </span>
          <div className="text-3xl font-serif font-bold text-[#2D241E]">1</div>
          <p className="text-xs text-[#5C4D42]">
            The 6 Powers of Conscious Parenting
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#E3D8CC] shadow-sm space-y-2">
          <span className="text-xs uppercase text-[#8A796E] font-medium tracking-wider">
            Curriculum Modules
          </span>
          <div className="text-3xl font-serif font-bold text-[#2D241E]">6</div>
          <p className="text-xs text-[#5C4D42]">
            Core powers with downloadable worksheets
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#E3D8CC] shadow-sm space-y-2">
          <span className="text-xs uppercase text-[#8A796E] font-medium tracking-wider">
            Learner Inquiries
          </span>
          <div className="text-3xl font-serif font-bold text-[#8C5E42]">Active</div>
          <p className="text-xs text-[#5C4D42]">
            Contact & pre-registration queues open
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#E3D8CC] shadow-sm space-y-2">
          <span className="text-xs uppercase text-[#8A796E] font-medium tracking-wider">
            Architecture Version
          </span>
          <div className="text-3xl font-serif font-bold text-[#2D241E]">v1.0</div>
          <p className="text-xs text-[#5C4D42]">
            Next.js App Router Monorepo
          </p>
        </div>
      </div>

      {/* Quick Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-[#E3D8CC] shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-lg text-[#2D241E]">
            Assessment Governance
          </h3>
          <p className="text-xs text-[#5C4D42] leading-relaxed">
            Author reflective psychometric instruments, factor definitions, questions, scoring models, and course mappings.
          </p>
          <Link
            href="/admin/assessments"
            className="inline-block px-4 py-2 rounded-full bg-[#8C5E42] text-[#FDFBF7] text-xs font-semibold hover:bg-[#724B34] transition-colors"
          >
            Author Assessments &rarr;
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#E3D8CC] shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-lg text-[#2D241E]">
            Course Management
          </h3>
          <p className="text-xs text-[#5C4D42] leading-relaxed">
            Review course syllabus, lesson descriptions, module publishing status, and cohort access.
          </p>
          <Link
            href="/admin/courses"
            className="inline-block px-4 py-2 rounded-full bg-[#8C5E42] text-[#FDFBF7] text-xs font-semibold hover:bg-[#724B34] transition-colors"
          >
            Manage Courses &rarr;
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#E3D8CC] shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-lg text-[#2D241E]">
            User & Learner Profiles
          </h3>
          <p className="text-xs text-[#5C4D42] leading-relaxed">
            Manage registered accounts across roles: parents, educators, school coordinators, and system administrators.
          </p>
          <Link
            href="/admin/users"
            className="inline-block px-4 py-2 rounded-full bg-[#8C5E42] text-[#FDFBF7] text-xs font-semibold hover:bg-[#724B34] transition-colors"
          >
            Manage Users &rarr;
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#E3D8CC] shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-lg text-[#2D241E]">
            Orders & Enrollments
          </h3>
          <p className="text-xs text-[#5C4D42] leading-relaxed">
            Track course registrations, cohort payments, and refund processing records.
          </p>
          <Link
            href="/admin/orders"
            className="inline-block px-4 py-2 rounded-full bg-[#8C5E42] text-[#FDFBF7] text-xs font-semibold hover:bg-[#724B34] transition-colors"
          >
            View Orders &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}
