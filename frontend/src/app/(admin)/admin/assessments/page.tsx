"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AdminAssessmentInstrumentSummary,
  CreateAssessmentInstrumentInput,
} from "@insight-ignite/shared";
import {
  listAdminInstruments,
  createDraftInstrument,
} from "@/features/assessments/admin-api";
import { ApiError } from "@/lib/api-client";
import Button from "@/components/ui/Button";

export default function AdminAssessmentsPage() {
  const [instruments, setInstruments] = useState<
    AdminAssessmentInstrumentSummary[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form State
  const [formData, setFormData] = useState<CreateAssessmentInstrumentInput>({
    title: "",
    slug: "",
    subtitle: "",
    description: "",
    category: "PARENTING",
    intendedAudience: "Parents and primary caregivers",
  });

  const loadInstruments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminInstruments();
      setInstruments(data);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to load assessment instruments."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchInitial() {
      try {
        const data = await listAdminInstruments();
        if (isMounted) {
          setInstruments(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Unable to load assessment instruments."
          );
          setLoading(false);
        }
      }
    }
    fetchInitial();
    return () => {
      isMounted = false;
    };
  }, []);

  const openCreateModal = () => {
    setFormData({
      title: "",
      slug: "",
      subtitle: "",
      description: "",
      category: "PARENTING",
      intendedAudience: "Parents and primary caregivers",
    });
    setFormError(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleSlugAutoGenerate = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      slug:
        prev.slug === "" || prev.slug === handleSlugAutoGenerate(prev.title)
          ? handleSlugAutoGenerate(title)
          : prev.slug,
    }));
  };

  const validateClientSide = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.title || formData.title.trim().length < 3) {
      errors.title = "Title must be at least 3 characters.";
    }
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!formData.slug || !slugRegex.test(formData.slug)) {
      errors.slug =
        "Slug must contain only lowercase letters, numbers, and single hyphens.";
    }
    if (!formData.description || formData.description.trim().length < 10) {
      errors.description = "Description must be at least 10 characters.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    if (!validateClientSide()) {
      return;
    }

    setFormSubmitting(true);
    try {
      const created = await createDraftInstrument(formData);
      setIsModalOpen(false);
      setSuccessMessage(
        `Instrument '${created.title}' created with initial Version 1 (DRAFT).`
      );
      await loadInstruments();
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
        if (Array.isArray(err.details)) {
          const mapped: Record<string, string> = {};
          err.details.forEach((d: { field?: string; message?: string }) => {
            if (d.field && d.message) mapped[d.field] = d.message;
          });
          setFieldErrors(mapped);
        }
      } else {
        setFormError("Failed to create assessment instrument. Please try again.");
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  // Metrics
  const totalInstruments = instruments.length;
  const activeInstruments = instruments.filter(
    (i) => i.status === "ACTIVE"
  ).length;
  const draftInstruments = instruments.filter(
    (i) => i.status === "DRAFT"
  ).length;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Breadcrumb */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8A796E]">
          <Link href="/admin" className="hover:text-[#2D241E] transition-colors">
            Admin Console
          </Link>
          <span>/</span>
          <span className="text-[#8C5E42]">Assessment Governance</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#2D241E]">
              Assessment Instruments & Versions
            </h1>
            <p className="text-sm text-[#5C4D42] mt-1">
              Author reflective psychometric instruments, factor definitions, question items, scoring models, and course mappings.
            </p>
          </div>
          <Button
            onClick={openCreateModal}
            variant="primary"
            className="self-start sm:self-auto flex items-center gap-2 shadow-xs"
          >
            <span className="text-base leading-none">+</span>
            <span>New Assessment Instrument</span>
          </Button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span>✓</span>
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-[#E3D8CC] shadow-xs space-y-2">
          <span className="text-xs uppercase text-[#8A796E] font-medium tracking-wider">
            Total Instruments
          </span>
          <div className="text-3xl font-serif font-bold text-[#2D241E]">
            {loading ? "..." : totalInstruments}
          </div>
          <p className="text-xs text-[#5C4D42]">
            Configured assessment instruments
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#E3D8CC] shadow-xs space-y-2">
          <span className="text-xs uppercase text-[#8A796E] font-medium tracking-wider">
            Published Active Instruments
          </span>
          <div className="text-3xl font-serif font-bold text-emerald-700">
            {loading ? "..." : activeInstruments}
          </div>
          <p className="text-xs text-[#5C4D42]">
            Available on the learner self-reflection portal
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#E3D8CC] shadow-xs space-y-2">
          <span className="text-xs uppercase text-[#8A796E] font-medium tracking-wider">
            Drafts in Authoring
          </span>
          <div className="text-3xl font-serif font-bold text-amber-700">
            {loading ? "..." : draftInstruments}
          </div>
          <p className="text-xs text-[#5C4D42]">
            Pending factor coverage, scoring, or clinical sign-off
          </p>
        </div>
      </div>

      {/* Governance Notice Banner */}
      <div className="p-4 rounded-2xl bg-[#FAF5EE] border border-[#E3D8CC] text-[#5C4D42] text-xs leading-relaxed space-y-1">
        <div className="font-bold text-[#2D241E] flex items-center gap-1.5">
          <span>🛡️</span>
          <span>Psychometric Governance & Immutability Rules</span>
        </div>
        <p>
          Mutations are restricted strictly to <strong>DRAFT</strong> versions. Once an assessment version is approved and activated, all factor weights, questions, and scoring bands become immutable to safeguard participant reflection integrity. Technical readiness validation does not substitute formal clinical sign-off by Dr. Nivedita Ganguli.
        </p>
      </div>

      {/* Instruments List */}
      <div className="bg-white rounded-3xl border border-[#E3D8CC] shadow-xs overflow-hidden">
        <div className="p-6 border-b border-[#E3D8CC] flex items-center justify-between">
          <h2 className="font-serif font-bold text-lg text-[#2D241E]">
            Instruments Directory
          </h2>
          <span className="text-xs text-[#8A796E] font-medium">
            {instruments.length} registered
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#8C5E42] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#8A796E] uppercase tracking-wider font-semibold">
              Loading assessment instruments...
            </p>
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-50 text-red-700 flex items-center justify-center font-bold">
              !
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-red-800">
                Failed to load instruments
              </p>
              <p className="text-xs text-red-600">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadInstruments}>
              Retry Connection
            </Button>
          </div>
        ) : instruments.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF5EE] border border-[#E3D8CC] flex items-center justify-center text-2xl text-[#8C5E42]">
              📝
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="font-serif font-bold text-lg text-[#2D241E]">
                No assessment instruments defined
              </h3>
              <p className="text-xs text-[#5C4D42] leading-relaxed">
                Begin by creating your first assessment instrument. An initial Version 1 (DRAFT) will be automatically initialized for factor and item authoring.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={openCreateModal}>
              Create Initial Instrument
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-[#EAE3D9]">
            {instruments.map((inst) => {
              const statusColors = {
                ACTIVE:
                  "bg-emerald-50 text-emerald-800 border-emerald-200",
                DRAFT: "bg-amber-50 text-amber-800 border-amber-200",
                RETIRED: "bg-stone-100 text-stone-700 border-stone-200",
              };

              return (
                <div
                  key={inst.id}
                  className="p-6 hover:bg-[#FAF8F5] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-serif font-bold text-lg text-[#2D241E]">
                        {inst.title}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                          statusColors[inst.status]
                        }`}
                      >
                        {inst.status}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF5EE] text-[#8C5E42] border border-[#E3D8CC]">
                        {inst.category}
                      </span>
                    </div>

                    {inst.subtitle && (
                      <p className="text-xs font-medium text-[#78543B]">
                        {inst.subtitle}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8A796E]">
                      <span>
                        Slug:{" "}
                        <code className="text-[#2D241E] font-mono bg-[#EAE3D9] px-1 py-0.5 rounded">
                          {inst.slug}
                        </code>
                      </span>
                      <span>•</span>
                      <span>
                        Total Versions:{" "}
                        <strong className="text-[#2D241E]">
                          {inst.totalVersions}
                        </strong>
                      </span>
                      {inst.activeVersionNumber ? (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 font-medium">
                            Active Version: v{inst.activeVersionNumber}
                          </span>
                        </>
                      ) : (
                        <>
                          <span>•</span>
                          <span className="text-amber-700 font-medium">
                            No Active Version (Unpublished)
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span>
                        Created:{" "}
                        {new Date(inst.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-center">
                    <Link href={`/admin/assessments/${inst.id}`}>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <span>Open Authoring Studio</span>
                        <span>&rarr;</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Instrument Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-[#E3D8CC] shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="p-6 border-b border-[#E3D8CC] flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-xl text-[#2D241E]">
                  Create Assessment Instrument
                </h3>
                <p className="text-xs text-[#5C4D42] mt-0.5">
                  Initializes the parent instrument container and draft Version 1.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#8A796E] hover:text-[#2D241E] text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
                  Instrument Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={handleTitleChange}
                  placeholder="e.g., Parent Growth Self-Assessment"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C6B5] bg-[#FDFBF7] text-sm text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]"
                />
                {fieldErrors.title && (
                  <p className="text-[11px] text-red-600 font-medium">
                    {fieldErrors.title}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
                  URL Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value.toLowerCase() })
                  }
                  placeholder="e.g., parent-growth-self-assessment"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C6B5] bg-[#FDFBF7] text-sm font-mono text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]"
                />
                <p className="text-[11px] text-[#8A796E]">
                  Only lowercase letters, numbers, and single hyphens. Used in API and public routes.
                </p>
                {fieldErrors.slug && (
                  <p className="text-[11px] text-red-600 font-medium">
                    {fieldErrors.slug}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C6B5] bg-[#FDFBF7] text-sm text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]"
                  >
                    <option value="PARENTING">Parenting</option>
                    <option value="EDUCATOR_COACHING">Educator Coaching</option>
                    <option value="MINDFUL_WELLNESS">Mindful Wellness</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
                    Intended Audience
                  </label>
                  <input
                    type="text"
                    value={formData.intendedAudience || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        intendedAudience: e.target.value,
                      })
                    }
                    placeholder="e.g., Parents of children aged 2-10"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C6B5] bg-[#FDFBF7] text-sm text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
                  Subtitle (Optional)
                </label>
                <input
                  type="text"
                  value={formData.subtitle || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, subtitle: e.target.value })
                  }
                  placeholder="e.g., A reflective psychometric exploration of parenting habits"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C6B5] bg-[#FDFBF7] text-sm text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
                  Clinical & Educational Description{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Detailed rationale and intended reflective scope..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C6B5] bg-[#FDFBF7] text-sm text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]"
                />
                {fieldErrors.description && (
                  <p className="text-[11px] text-red-600 font-medium">
                    {fieldErrors.description}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-[#EAE3D9] flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={formSubmitting}
                >
                  {formSubmitting
                    ? "Creating Instrument..."
                    : "Create Instrument & v1 Draft"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
