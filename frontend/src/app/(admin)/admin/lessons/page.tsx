"use client";

import React from "react";
import AdminRecordsTable from "@/features/admin/AdminRecordsTable";

interface AdminLessonRow {
  id: string;
  courseTitle: string;
  courseStatus: string;
  orderIndex: number;
  title: string;
  durationMin: number | null;
  isFreePreview: boolean;
  hasVideo: boolean;
}

export default function AdminLessonsPage() {
  return (
    <AdminRecordsTable<AdminLessonRow>
      title="Lessons"
      description="All lessons, grouped by course."
      endpoint="/admin/platform/lessons"
      dataKey="lessons"
      rowKey={(l) => l.id}
      emptyMessage="No lessons have been added to any course yet."
      columns={[
        {
          header: "Course",
          cell: (l) => (
            <div>
              <p className="font-semibold text-[#2D241E]">{l.courseTitle}</p>
              <p className="text-[#7A6A5F]">{l.courseStatus.replace(/_/g, " ").toLowerCase()}</p>
            </div>
          ),
        },
        { header: "#", cell: (l) => l.orderIndex },
        { header: "Lesson", cell: (l) => l.title },
        { header: "Duration", cell: (l) => (l.durationMin ? `${l.durationMin} min` : "–") },
        { header: "Video", cell: (l) => (l.hasVideo ? "Added" : "Not added") },
        { header: "Free preview", cell: (l) => (l.isFreePreview ? "Yes" : "No") },
      ]}
    />
  );
}
