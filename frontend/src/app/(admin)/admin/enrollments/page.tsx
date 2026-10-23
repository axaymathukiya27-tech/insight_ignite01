"use client";

import React from "react";
import Link from "next/link";
import AdminRecordsTable, { formatDay } from "@/features/admin/AdminRecordsTable";

interface AdminEnrollmentRow {
  id: string;
  learnerName: string;
  learnerEmail: string;
  courseTitle: string;
  courseSlug: string;
  progressPct: number;
  enrolledAt: string;
  completedAt: string | null;
}

export default function AdminEnrollmentsPage() {
  return (
    <AdminRecordsTable<AdminEnrollmentRow>
      title="Enrollments"
      description="Every course enrollment, newest first."
      endpoint="/admin/platform/enrollments"
      dataKey="enrollments"
      rowKey={(e) => e.id}
      emptyMessage="No one is enrolled in a course yet."
      columns={[
        {
          header: "Learner",
          cell: (e) => (
            <div>
              <p className="font-semibold text-[#2D241E]">{e.learnerName}</p>
              <p className="text-[#7A6A5F] break-all">{e.learnerEmail}</p>
            </div>
          ),
        },
        {
          header: "Course",
          cell: (e) => (
            <Link href={`/courses/${e.courseSlug}`} className="text-[#8C5E42] hover:underline">
              {e.courseTitle}
            </Link>
          ),
        },
        { header: "Progress", cell: (e) => `${e.progressPct}%` },
        { header: "Enrolled", cell: (e) => formatDay(e.enrolledAt), className: "whitespace-nowrap" },
        { header: "Completed", cell: (e) => formatDay(e.completedAt), className: "whitespace-nowrap" },
      ]}
    />
  );
}
