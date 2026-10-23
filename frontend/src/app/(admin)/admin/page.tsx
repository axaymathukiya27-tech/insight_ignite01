"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api-client";
import { adminNav, navForRole } from "@/config/portal-nav";

interface Overview {
  users: { total: number; byRole: Record<string, number> };
  courses: { total: number; published: number };
  enrollments: number;
  completedAssessments: number;
  activeAssessments: number;
  newInquiries: number;
}

const SECTION_TEXT: Record<string, string> = {
  "/admin/assessments": "Author assessments, dimensions, questions, scoring and course mappings.",
  "/admin/courses": "Create, edit, publish and unpublish courses.",
  "/admin/lessons": "Review every course's lessons and their availability.",
  "/admin/users": "See registered accounts and their roles.",
  "/admin/enrollments": "See which learners are enrolled in which course.",
  "/admin/orders": "Payments and orders, once payments are switched on.",
  "/admin/contact-inquiries": "Read and respond to messages from the contact form.",
};

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "restricted" | "error">("loading");
  const isPlatformAdmin = user?.role === "PLATFORM_ADMIN";

  useEffect(() => {
    if (!isPlatformAdmin) return;
    let active = true;
    apiFetch<{ overview: Overview }>("/admin/platform/overview")
      .then((res) => {
        if (!active) return;
        setData(res.overview);
        setState("ready");
      })
      .catch(() => active && setState("error"));
    return () => {
      active = false;
    };
  }, [isPlatformAdmin]);

  // School administrators do not have access to platform-wide figures
  const view = isPlatformAdmin ? state : "restricted";
  const sections = navForRole(adminNav, user?.role).filter((i) => i.href !== "/admin");
  const stats = data
    ? [
        { label: "Registered accounts", value: data.users.total, note: `${data.users.byRole.PLATFORM_ADMIN ?? 0} platform admin(s)` },
        { label: "Courses", value: data.courses.total, note: `${data.courses.published} published` },
        { label: "Enrollments", value: data.enrollments, note: "Across all courses" },
        { label: "Completed assessments", value: data.completedAssessments, note: `${data.activeAssessments} assessment(s) live` },
        { label: "New inquiries", value: data.newInquiries, note: "Not yet handled" },
      ]
    : [];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D241E]">
          Welcome{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-[#5C4D42]">Here is what is happening on Insight Ignite today.</p>
      </div>

      {view === "loading" && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white border border-[#E3D8CC] animate-pulse" />
          ))}
        </div>
      )}
      {view === "error" && (
        <p role="alert" className="text-sm text-[#9F1239]">
          The overview figures could not be loaded. Please refresh the page.
        </p>
      )}
      {view === "ready" && (
        <dl className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-[#E3D8CC] shadow-sm">
              <dt className="text-[11px] uppercase text-[#8A796E] font-semibold tracking-wider">{s.label}</dt>
              <dd className="text-3xl font-serif font-bold text-[#2D241E]">{s.value}</dd>
              <dd className="text-xs text-[#6B5A4E]">{s.note}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group bg-white rounded-2xl p-5 border border-[#E3D8CC] shadow-sm hover:shadow-md hover:border-[#C9B8A6] transition-all"
          >
            <h2 className="font-serif font-bold text-lg text-[#2D241E] group-hover:text-[#8C5E42]">{s.label} &rarr;</h2>
            <p className="text-xs text-[#5C4D42] leading-relaxed mt-1">{SECTION_TEXT[s.href]}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
