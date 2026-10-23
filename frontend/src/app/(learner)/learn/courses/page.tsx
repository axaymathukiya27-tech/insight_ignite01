"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MyEnrollmentDto } from "@insight-ignite/shared";
import { getMyEnrollments } from "@/features/assessments/api";

export default function MyCoursesPage() {
  const [enrollments, setEnrollments] = useState<MyEnrollmentDto[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getMyEnrollments()
      .then((list) => active && setEnrollments(list))
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D241E]">My Courses</h1>
          <p className="text-sm text-[#5C4D42]">Courses you are enrolled in.</p>
        </div>
        <Link href="/courses" className="text-xs font-semibold text-[#8C5E42] hover:text-[#724B34] shrink-0">
          Browse courses &rarr;
        </Link>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-[#991B1B]">Your courses could not be loaded. Please refresh the page.</p>
      ) : enrollments === null ? (
        <div className="h-28 rounded-2xl bg-white border border-[#E3D8CC] animate-pulse" role="status" aria-label="Loading" />
      ) : enrollments.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white border border-[#E3D8CC] text-center space-y-3">
          <h2 className="font-serif text-lg font-bold text-[#2D241E]">You are not enrolled in a course yet</h2>
          <p className="text-xs text-[#6B5A4E]">When you join a course, it will appear here with your progress.</p>
          <Link href="/courses" className="inline-block px-5 py-2.5 rounded-full bg-[#8C5E42] text-[#FDFBF7] font-semibold text-xs hover:bg-[#724B34]">
            Browse courses
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {enrollments.map((e) => (
            <li key={e.courseId} className="bg-white rounded-2xl p-5 border border-[#E3D8CC] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <h2 className="font-serif text-lg font-bold text-[#2D241E]">{e.title}</h2>
                {e.subtitle && <p className="text-xs text-[#6B5A4E]">{e.subtitle}</p>}
                <p className="text-xs text-[#5C4D42]">
                  {e.lessonCount} lesson{e.lessonCount === 1 ? "" : "s"} · {e.completedAt ? "Completed" : `${e.progressPct}% complete`}
                </p>
              </div>
              <Link href={`/courses/${e.slug}`} className="shrink-0 px-5 py-2 rounded-full border border-[#8C5E42] text-[#8C5E42] text-xs font-semibold hover:bg-[#FAF5EE]">
                Course details
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
