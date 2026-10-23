"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api-client";
import { AdminCourseSummary, CreateCourseInput, UpdateCourseInput } from "@insight-ignite/shared";
import Button from "@/components/ui/Button";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<AdminCourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<AdminCourseSummary | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
  const [formData, setFormData] = useState<CreateCourseInput>({
    title: "",
    slug: "",
    subtitle: "",
    description: "",
    instructor: "Dr. Nivedita Ganguli",
    status: "DRAFT",
  });

  const reloadCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ courses: AdminCourseSummary[] }>("/courses/admin/all");
      setCourses(res.courses || []);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to load administrative courses list.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadInitial() {
      try {
        const res = await apiFetch<{ courses: AdminCourseSummary[] }>("/courses/admin/all");
        if (isMounted) {
          setCourses(res.courses || []);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof ApiError ? err.message : "Unable to load administrative courses list."
          );
          setLoading(false);
        }
      }
    }

    loadInitial();
    return () => {
      isMounted = false;
    };
  }, []);

  const openCreateModal = () => {
    setEditingCourse(null);
    setFormData({
      title: "",
      slug: "",
      subtitle: "",
      description: "",
      instructor: "Dr. Nivedita Ganguli",
      status: "DRAFT",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (course: AdminCourseSummary) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      slug: course.slug,
      subtitle: course.subtitle || "",
      description: course.description,
      instructor: course.instructor,
      status: course.status as "DRAFT" | "PUBLISHED" | "DEVELOPMENT_PREVIEW" | "ARCHIVED",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleTogglePublish = async (course: AdminCourseSummary) => {
    setActionSuccess(null);
    const endpoint =
      course.status === "PUBLISHED"
        ? `/courses/admin/${course.id}/unpublish`
        : `/courses/admin/${course.id}/publish`;

    try {
      await apiFetch(endpoint, { method: "PATCH" });
      setActionSuccess(
        course.status === "PUBLISHED"
          ? `Course "${course.title}" set to Draft.`
          : `Course "${course.title}" successfully published!`
      );
      await reloadCourses();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to update course status.");
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitting(true);

    try {
      if (editingCourse) {
        // Edit existing course
        const updatePayload: UpdateCourseInput = {
          title: formData.title,
          slug: formData.slug,
          subtitle: formData.subtitle || undefined,
          description: formData.description,
          instructor: formData.instructor,
          status: formData.status,
        };
        await apiFetch(`/courses/admin/${editingCourse.id}`, {
          method: "PATCH",
          body: JSON.stringify(updatePayload),
        });
        setActionSuccess(`Course "${formData.title}" updated successfully.`);
      } else {
        // Create new course
        await apiFetch("/courses/admin", {
          method: "POST",
          body: JSON.stringify(formData),
        });
        setActionSuccess(`New course "${formData.title}" created successfully.`);
      }

      setIsModalOpen(false);
      await reloadCourses();
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError("Operation failed. Please check inputs.");
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D241E]">
            Course Management
          </h1>
          <p className="text-sm text-[#5C4D42]">
            Monitor masterclass modules, syllabus configurations, and publication states.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={openCreateModal} variant="primary" className="text-xs">
            + Create New Course
          </Button>
          <Link
            href="/courses"
            target="_blank"
            className="px-4 py-2.5 rounded-full border border-[#D5C6B5] text-[#4A3C32] text-xs font-semibold hover:bg-[#F2ECE4] transition-colors"
          >
            View Public Catalog &rarr;
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between"
        >
          <span>✓ {actionSuccess}</span>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-700 hover:font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between"
        >
          <span>! {error}</span>
          <button onClick={() => setError(null)} className="text-red-700 hover:font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-3xl border border-[#E3D8CC] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#7A6A5E] animate-pulse">
            Loading courses from database...
          </div>
        ) : courses.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#6B5A4E] space-y-3">
            <p className="font-bold text-sm text-[#2D241E]">No courses found in database.</p>
            <p>Click &ldquo;+ Create New Course&rdquo; above to publish your first masterclass.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF5EE] border-b border-[#E3D8CC] text-[#6B5A4E] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-4 px-6">Course Name & Slug</th>
                  <th className="py-4 px-6">Instructor</th>
                  <th className="py-4 px-6">Lessons</th>
                  <th className="py-4 px-6">Publication Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE8DF] text-[#3D3127]">
                {courses.map((c) => {
                  const isPublished = c.status === "PUBLISHED";
                  return (
                    <tr key={c.id} className="hover:bg-[#FAF8F5]">
                      <td className="py-4 px-6 space-y-0.5">
                        <div className="font-semibold text-sm text-[#2D241E]">{c.title}</div>
                        <div className="text-[11px] text-[#8A796E] font-mono">/{c.slug}</div>
                      </td>
                      <td className="py-4 px-6 text-[#5C4D42]">{c.instructor}</td>
                      <td className="py-4 px-6 font-semibold">{c.lessonCount} Modules</td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider border ${
                            isPublished
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : c.status === "DRAFT"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-sky-50 text-sky-800 border-sky-200"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleTogglePublish(c)}
                          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                            isPublished
                              ? "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                              : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                          }`}
                        >
                          {isPublished ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          onClick={() => openEditModal(c)}
                          className="px-3 py-1.5 rounded-lg bg-[#FAF5EE] text-[#5C4D42] hover:bg-[#EFE8DF] border border-[#E3D8CC] font-semibold transition-colors"
                        >
                          Edit
                        </button>
                        {isPublished && (
                          <Link
                            href={`/courses/${c.slug}`}
                            target="_blank"
                            className="text-[#8C5E42] font-semibold hover:underline inline-block ml-1"
                          >
                            Preview &rarr;
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Course Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-[#E3D8CC] shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EFE8DF] pb-4">
              <h3 className="font-serif text-xl font-bold text-[#2D241E]">
                {editingCourse ? "Edit Course Information" : "Create New Masterclass"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#8A796E] hover:text-[#2D241E] font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#4A3C32] mb-1">
                  Course Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      title: newTitle,
                      // Auto-derive slug if creating new
                      slug: !editingCourse
                        ? newTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
                        : prev.slug,
                    }));
                  }}
                  placeholder="e.g., The 6 Powers of Conscious Parenting"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD0C4] bg-[#FAF8F5] text-sm text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]/50"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A3C32] mb-1">
                  URL Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="e.g., the-6-powers-of-conscious-parenting"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD0C4] bg-[#FAF8F5] text-sm font-mono text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]/50"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A3C32] mb-1">Subtitle</label>
                <input
                  type="text"
                  value={formData.subtitle || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="e.g., Presence, Attunement, Clarity, Co-Regulation, Repair & Autonomy"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD0C4] bg-[#FAF8F5] text-sm text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]/50"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A3C32] mb-1">Instructor</label>
                <input
                  type="text"
                  value={formData.instructor}
                  onChange={(e) => setFormData((prev) => ({ ...prev, instructor: e.target.value }))}
                  placeholder="Dr. Nivedita Ganguli"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD0C4] bg-[#FAF8F5] text-sm text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]/50"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A3C32] mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide comprehensive, evidence-informed course overview..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD0C4] bg-[#FAF8F5] text-sm text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]/50"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A3C32] mb-1">Publication Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: e.target.value as "DRAFT" | "PUBLISHED" | "DEVELOPMENT_PREVIEW" | "ARCHIVED",
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD0C4] bg-[#FAF8F5] text-sm text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]/50"
                >
                  <option value="DRAFT">DRAFT (Hidden from public catalog)</option>
                  <option value="PUBLISHED">PUBLISHED (Live on public website)</option>
                  <option value="DEVELOPMENT_PREVIEW">DEVELOPMENT_PREVIEW (Internal review only)</option>
                  <option value="ARCHIVED">ARCHIVED (Discontinued)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EFE8DF]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#D5C6B5] text-[#5C4D42] font-semibold hover:bg-[#F2ECE4] transition-colors"
                >
                  Cancel
                </button>
                <Button type="submit" variant="primary" disabled={formSubmitting}>
                  {formSubmitting ? "Saving..." : editingCourse ? "Save Changes" : "Create Course"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
