"use client";

import React from "react";
import AdminRecordsTable, { formatDay } from "@/features/admin/AdminRecordsTable";
import { ROLE_LABEL } from "@/config/portal-nav";

interface AdminUserRow {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  enrollmentCount: number;
  assessmentCount: number;
}

export default function AdminUsersPage() {
  return (
    <AdminRecordsTable<AdminUserRow>
      title="Users"
      description="Registered accounts, newest first. Assessment answers are never shown here."
      endpoint="/admin/platform/users"
      dataKey="users"
      rowKey={(u) => u.id}
      emptyMessage="No accounts have been registered yet."
      columns={[
        { header: "Name", cell: (u) => <span className="font-semibold text-[#2D241E]">{u.fullName}</span> },
        { header: "Email", cell: (u) => u.email, className: "break-all" },
        {
          header: "Role",
          cell: (u) => (
            <span className="px-2.5 py-1 rounded-full bg-[#FAF5EE] text-[#8C5E42] font-semibold border border-[#E4D8CB] whitespace-nowrap">
              {ROLE_LABEL[u.role] || u.role}
            </span>
          ),
        },
        { header: "Status", cell: (u) => (u.isActive ? (u.emailVerified ? "Active" : "Email not verified") : "Deactivated") },
        { header: "Enrollments", cell: (u) => u.enrollmentCount },
        { header: "Assessments", cell: (u) => u.assessmentCount },
        { header: "Joined", cell: (u) => formatDay(u.createdAt), className: "whitespace-nowrap" },
      ]}
    />
  );
}
