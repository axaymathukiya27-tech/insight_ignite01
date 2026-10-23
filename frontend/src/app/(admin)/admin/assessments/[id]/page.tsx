"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AdminAssessmentInstrumentDetail,
  AdminAssessmentVersionDetail,
  AdminAssessmentFactorDto,
  AdminAssessmentItemDto,
  AdminAssessmentCourseMappingDto,
  AssessmentActivationReadinessReport,
  AdminCourseSummary,
  CreateAssessmentFactorInput,
  CreateCourseMappingBody,
} from "@insight-ignite/shared";
import {
  getInstrumentDetail,
  getAdminVersionDetail,
  createDraftVersion,
  updateDraftVersionMetadata,
  createAssessmentFactor,
  updateAssessmentFactor,
  deleteAssessmentFactor,
  createAssessmentItem,
  updateAssessmentItem,
  deleteAssessmentItem,
  updateVersionScoringConfig,
  createCourseMapping,
  deleteCourseMapping,
  checkActivationReadiness,
  listAdminCourses,
  approveVersion,
  activateVersion,
} from "@/features/assessments/admin-api";
import { ApiError } from "@/lib/api-client";
import Button from "@/components/ui/Button";

// Default five-point answer scale for new questions
const DEFAULT_ITEM_OPTIONS = [
  { id: "opt_1", label: "Never", orderIndex: 1, value: 1 },
  { id: "opt_2", label: "Rarely", orderIndex: 2, value: 2 },
  { id: "opt_3", label: "Sometimes", orderIndex: 3, value: 3 },
  { id: "opt_4", label: "Often", orderIndex: 4, value: 4 },
  { id: "opt_5", label: "Almost Always", orderIndex: 5, value: 5 },
];

type AuthoringTab =
  | "metadata"
  | "factors"
  | "questions"
  | "scoring"
  | "courses"
  | "readiness"
  | "audit";

export default function AdminAssessmentWorkspacePage() {
  const params = useParams();
  const instrumentId = params?.id as string;

  // Instrument & Versions State
  const [instrument, setInstrument] =
    useState<AdminAssessmentInstrumentDetail | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null
  );
  const [versionDetail, setVersionDetail] =
    useState<AdminAssessmentVersionDetail | null>(null);

  // Courses for mapping selection
  const [availableCourses, setAvailableCourses] = useState<AdminCourseSummary[]>(
    []
  );

  // Page Level UI state
  const [loading, setLoading] = useState(true);
  const [versionLoading, setVersionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Active Authoring Tab
  const [activeTab, setActiveTab] = useState<AuthoringTab>("readiness");

  // Readiness Report
  const [readinessReport, setReadinessReport] =
    useState<AssessmentActivationReadinessReport | null>(null);
  const [readinessLoading, setReadinessLoading] = useState(false);

  // Approval & Publishing
  const [approverName, setApproverName] = useState("Dr. Nivedita Ganguli");
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const [publishSubmitting, setPublishSubmitting] = useState(false);

  // ---------------------------------------------------------------------------
  // Modal States
  // ---------------------------------------------------------------------------

  // Create Version Modal
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [versionSubmitting, setVersionSubmitting] = useState(false);

  // Factor Modal
  const [isFactorModalOpen, setIsFactorModalOpen] = useState(false);
  const [editingFactor, setEditingFactor] =
    useState<AdminAssessmentFactorDto | null>(null);
  const [factorForm, setFactorForm] = useState<CreateAssessmentFactorInput>({
    code: "",
    name: "",
    tagline: "",
    description: "",
    orderIndex: 1,
  });
  const [factorSubmitting, setFactorSubmitting] = useState(false);
  const [factorError, setFactorError] = useState<string | null>(null);

  // Question Modal
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] =
    useState<AdminAssessmentItemDto | null>(null);
  const [itemForm, setItemForm] = useState<{
    factorId: string;
    itemKey: string;
    orderIndex: number;
    prompt: string;
    contextPrompt: string;
    responseType: string;
    isRequired: boolean;
    options: Array<{
      id: string;
      label: string;
      orderIndex: number;
      value: number;
    }>;
  }>({
    factorId: "",
    itemKey: "",
    orderIndex: 1,
    prompt: "",
    contextPrompt: "",
    responseType: "SINGLE_CHOICE",
    isRequired: true,
    options: DEFAULT_ITEM_OPTIONS.map((o) => ({ ...o })),
  });
  const [lastFactorId, setLastFactorId] = useState<string | null>(null);
  const [itemSubmitting, setItemSubmitting] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);

  // Scoring Modal / Form State
  const [scoringJson, setScoringJson] = useState<string>("");
  const [scoringSubmitting, setScoringSubmitting] = useState(false);
  const [scoringError, setScoringError] = useState<string | null>(null);

  // Course Mapping Modal
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [mappingForm, setMappingForm] = useState<CreateCourseMappingBody>({
    factorId: "",
    courseId: "",
    triggerCondition: "GROWTH_OPPORTUNITY",
    displayOrder: 1,
    customGuidance: "",
  });
  const [mappingSubmitting, setMappingSubmitting] = useState(false);
  const [mappingError, setMappingError] = useState<string | null>(null);

  // Metadata Edit Form State
  const [metadataForm, setMetadataForm] = useState({
    disclaimerText: "",
    instructionsText: "",
  });
  const [metadataSubmitting, setMetadataSubmitting] = useState(false);

  // ---------------------------------------------------------------------------
  // Data Loaders
  // ---------------------------------------------------------------------------

  const loadInstrument = useCallback(async () => {
    try {
      const data = await getInstrumentDetail(instrumentId);
      setInstrument(data);

      // Select latest version or first version
      if (data.versions.length > 0 && !selectedVersionId) {
        setSelectedVersionId(data.versions[0].id);
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load instrument."
      );
    }
  }, [instrumentId, selectedVersionId]);

  const loadVersion = useCallback(async (versionId: string) => {
    setVersionLoading(true);
    try {
      const ver = await getAdminVersionDetail(versionId);
      setVersionDetail(ver);
      setMetadataForm({
        disclaimerText: ver.disclaimerText || "",
        instructionsText: ver.instructionsText || "",
      });
      setScoringJson(
        ver.scoringConfig ? JSON.stringify(ver.scoringConfig, null, 2) : ""
      );
    } catch (err) {
      setNotification({
        type: "error",
        message:
          err instanceof ApiError
            ? err.message
            : "Failed to load version details.",
      });
    } finally {
      setVersionLoading(false);
    }
  }, []);

  const loadReadiness = useCallback(async (versionId: string) => {
    setReadinessLoading(true);
    try {
      const rep = await checkActivationReadiness(versionId);
      setReadinessReport(rep);
    } catch {
      // Best effort
    } finally {
      setReadinessLoading(false);
    }
  }, []);

  const loadCourses = useCallback(async () => {
    try {
      const list = await listAdminCourses();
      setAvailableCourses(list);
    } catch {
      // Best effort
    }
  }, []);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        await Promise.all([loadInstrument(), loadCourses()]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [loadInstrument, loadCourses]);

  // Load version detail when selectedVersionId changes
  useEffect(() => {
    if (!selectedVersionId) return;
    let isMounted = true;

    async function fetchVersionData() {
      try {
        const [ver, rep] = await Promise.all([
          getAdminVersionDetail(selectedVersionId!),
          checkActivationReadiness(selectedVersionId!),
        ]);
        if (isMounted) {
          setVersionDetail(ver);
          setMetadataForm({
            disclaimerText: ver.disclaimerText || "",
            instructionsText: ver.instructionsText || "",
          });
          setScoringJson(
            ver.scoringConfig ? JSON.stringify(ver.scoringConfig, null, 2) : ""
          );
          setReadinessReport(rep);
          setVersionLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setNotification({
            type: "error",
            message:
              err instanceof ApiError
                ? err.message
                : "Failed to load version details.",
          });
          setVersionLoading(false);
        }
      }
    }

    fetchVersionData();
    return () => {
      isMounted = false;
    };
  }, [selectedVersionId]);

  const isVersionDraft = versionDetail?.status === "DRAFT";

  // ---------------------------------------------------------------------------
  // Actions: Version Creation & Metadata
  // ---------------------------------------------------------------------------

  const handleCreateNewDraftVersion = async () => {
    setVersionSubmitting(true);
    try {
      const newVer = await createDraftVersion(instrumentId, {
        disclaimerText:
          versionDetail?.disclaimerText ||
          "This self-assessment is an educational self-reflection tool, not a diagnostic or clinical evaluation.",
        instructionsText:
          versionDetail?.instructionsText ||
          "Please answer each reflective prompt honestly based on your typical reactions in daily parenting interactions.",
      });
      setNotification({
        type: "success",
        message: `Draft Version ${newVer.versionNumber} created successfully.`,
      });
      setIsVersionModalOpen(false);
      await loadInstrument();
      setSelectedVersionId(newVer.id);
    } catch (err) {
      setNotification({
        type: "error",
        message:
          err instanceof ApiError ? err.message : "Failed to create draft version.",
      });
    } finally {
      setVersionSubmitting(false);
    }
  };

  const handleUpdateMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVersionId || !isVersionDraft) return;
    setMetadataSubmitting(true);
    try {
      await updateDraftVersionMetadata(selectedVersionId, metadataForm);
      setNotification({
        type: "success",
        message: "Version instructions and disclaimer saved.",
      });
      await loadVersion(selectedVersionId);
    } catch (err) {
      setNotification({
        type: "error",
        message:
          err instanceof ApiError
            ? err.message
            : "Failed to update version metadata.",
      });
    } finally {
      setMetadataSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Actions: Factor Authoring
  // ---------------------------------------------------------------------------

  const openCreateFactorModal = () => {
    setEditingFactor(null);
    setFactorForm({
      code: "",
      name: "",
      tagline: "",
      description: "",
      orderIndex: (versionDetail?.factors?.length || 0) + 1,
    });
    setFactorError(null);
    setIsFactorModalOpen(true);
  };

  const openEditFactorModal = (f: AdminAssessmentFactorDto) => {
    setEditingFactor(f);
    setFactorForm({
      code: f.code,
      name: f.name,
      tagline: f.tagline || "",
      description: f.description || "",
      orderIndex: f.orderIndex,
    });
    setFactorError(null);
    setIsFactorModalOpen(true);
  };

  const handleFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVersionId || !isVersionDraft) return;
    setFactorSubmitting(true);
    setFactorError(null);

    try {
      if (editingFactor) {
        await updateAssessmentFactor(editingFactor.id, {
          name: factorForm.name,
          tagline: factorForm.tagline,
          description: factorForm.description,
          orderIndex: factorForm.orderIndex,
        });
        setNotification({
          type: "success",
          message: `Factor '${factorForm.name}' updated successfully.`,
        });
      } else {
        await createAssessmentFactor(selectedVersionId, factorForm);
        setNotification({
          type: "success",
          message: `Factor '${factorForm.name}' (${factorForm.code}) created successfully.`,
        });
      }
      setIsFactorModalOpen(false);
      await loadVersion(selectedVersionId);
      await loadReadiness(selectedVersionId);
    } catch (err) {
      setFactorError(
        err instanceof ApiError ? err.message : "Failed to save factor definition."
      );
    } finally {
      setFactorSubmitting(false);
    }
  };

  const handleDeleteFactor = async (factor: AdminAssessmentFactorDto) => {
    if (!isVersionDraft) return;
    if (
      !confirm(
        `Are you sure you want to delete factor '${factor.name}' (${factor.code})?`
      )
    ) {
      return;
    }
    try {
      await deleteAssessmentFactor(factor.id);
      setNotification({
        type: "success",
        message: `Factor '${factor.name}' deleted successfully.`,
      });
      await loadVersion(selectedVersionId!);
      await loadReadiness(selectedVersionId!);
    } catch (err) {
      setNotification({
        type: "error",
        message:
          err instanceof ApiError ? err.message : "Failed to delete factor.",
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Actions: Question Authoring
  // ---------------------------------------------------------------------------

  const openCreateItemModal = () => {
    if (!versionDetail?.factors || versionDetail.factors.length === 0) {
      alert("Please define at least one factor definition before adding questions.");
      return;
    }
    setEditingItem(null);
    // Keep the factor chosen for the previous question, if it still exists
    const factorId = versionDetail.factors.some((f) => f.id === lastFactorId)
      ? lastFactorId!
      : versionDetail.factors[0].id;
    setItemForm({
      factorId,
      itemKey: `Q_${(versionDetail.items?.length || 0) + 1}`,
      orderIndex: (versionDetail.items?.length || 0) + 1,
      prompt: "",
      contextPrompt: "",
      responseType: "SINGLE_CHOICE",
      isRequired: true,
      options: DEFAULT_ITEM_OPTIONS.map((o) => ({ ...o })),
    });
    setItemError(null);
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (item: AdminAssessmentItemDto) => {
    setEditingItem(item);
    setItemForm({
      factorId: item.factorId,
      itemKey: item.itemKey,
      orderIndex: item.orderIndex,
      prompt: item.prompt,
      contextPrompt: item.contextPrompt || "",
      responseType: item.responseType,
      isRequired: item.isRequired,
      options: item.options.map((o) => ({
        id: o.id,
        label: o.label,
        orderIndex: o.orderIndex,
        value: o.value,
      })),
    });
    setItemError(null);
    setIsItemModalOpen(true);
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVersionId || !isVersionDraft) return;
    setItemSubmitting(true);
    setItemError(null);

    try {
      if (editingItem) {
        await updateAssessmentItem(editingItem.id, {
          factorId: itemForm.factorId,
          orderIndex: itemForm.orderIndex,
          prompt: itemForm.prompt,
          contextPrompt: itemForm.contextPrompt || null,
          responseType: "SINGLE_CHOICE",
          isRequired: itemForm.isRequired,
          options: itemForm.options,
        });
        setNotification({
          type: "success",
          message: `Question '${itemForm.itemKey}' updated successfully.`,
        });
      } else {
        await createAssessmentItem(selectedVersionId, {
          factorId: itemForm.factorId,
          itemKey: itemForm.itemKey,
          orderIndex: itemForm.orderIndex,
          prompt: itemForm.prompt,
          contextPrompt: itemForm.contextPrompt || null,
          responseType: "SINGLE_CHOICE",
          isRequired: itemForm.isRequired,
          options: itemForm.options,
        });
        setLastFactorId(itemForm.factorId);
        setNotification({
          type: "success",
          message: `Question '${itemForm.itemKey}' created successfully.`,
        });
      }
      setIsItemModalOpen(false);
      await loadVersion(selectedVersionId);
      await loadReadiness(selectedVersionId);
    } catch (err) {
      setItemError(
        err instanceof ApiError ? err.message : "Failed to save question item."
      );
    } finally {
      setItemSubmitting(false);
    }
  };

  const handleDeleteItem = async (item: AdminAssessmentItemDto) => {
    if (!isVersionDraft) return;
    if (
      !confirm(
        `Are you sure you want to delete question item '${item.itemKey}'?`
      )
    ) {
      return;
    }
    try {
      await deleteAssessmentItem(item.id);
      setNotification({
        type: "success",
        message: `Question '${item.itemKey}' deleted successfully.`,
      });
      await loadVersion(selectedVersionId!);
      await loadReadiness(selectedVersionId!);
    } catch (err) {
      setNotification({
        type: "error",
        message:
          err instanceof ApiError ? err.message : "Failed to delete question.",
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Actions: Approval & Publishing
  // ---------------------------------------------------------------------------

  const handleApprove = async () => {
    if (!selectedVersionId) return;
    setPublishSubmitting(true);
    try {
      const res = await approveVersion(selectedVersionId, approverName);
      setNotification({ type: "success", message: res.message });
      setApprovalConfirmed(false);
      await loadVersion(selectedVersionId);
      await loadReadiness(selectedVersionId);
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof ApiError ? err.message : "Failed to record approval.",
      });
    } finally {
      setPublishSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedVersionId) return;
    if (
      !window.confirm(
        "Publish this version? Parents will be able to take it right away, and its questions can no longer be edited."
      )
    ) {
      return;
    }
    setPublishSubmitting(true);
    try {
      const res = await activateVersion(selectedVersionId);
      setNotification({ type: "success", message: res.message });
      await loadInstrument();
      await loadVersion(selectedVersionId);
      await loadReadiness(selectedVersionId);
    } catch (err) {
      setNotification({
        type: "error",
        message:
          err instanceof ApiError
            ? Array.isArray(err.details)
              ? `${err.message} ${(err.details as string[]).join(" ")}`
              : err.message
            : "Failed to publish this version.",
      });
    } finally {
      setPublishSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Actions: Scoring Configuration
  // ---------------------------------------------------------------------------

  const handleSaveScoringConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVersionId || !isVersionDraft) return;
    setScoringSubmitting(true);
    setScoringError(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(scoringJson);
    } catch {
      setScoringError("Invalid JSON syntax in scoring configuration.");
      setScoringSubmitting(false);
      return;
    }

    try {
      await updateVersionScoringConfig(selectedVersionId, parsed);
      setNotification({
        type: "success",
        message: "Approved scoring configuration validated and saved.",
      });
      await loadVersion(selectedVersionId);
      await loadReadiness(selectedVersionId);
    } catch (err) {
      if (err instanceof ApiError) {
        setScoringError(
          err.details
            ? `${err.message} Details: ${JSON.stringify(err.details)}`
            : err.message
        );
      } else {
        setScoringError("Failed to update scoring configuration.");
      }
    } finally {
      setScoringSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Actions: Course Mappings
  // ---------------------------------------------------------------------------

  const openCreateMappingModal = () => {
    if (!versionDetail?.factors || versionDetail.factors.length === 0) {
      alert("Please define factor definitions first.");
      return;
    }
    const publishedList = availableCourses.filter(
      (c) => c.status === "PUBLISHED"
    );
    if (publishedList.length === 0) {
      alert(
        "No published courses are available. Only courses in PUBLISHED status can be mapped."
      );
      return;
    }

    setMappingForm({
      factorId: versionDetail.factors[0].id,
      courseId: publishedList[0].id,
      triggerCondition: "GROWTH_OPPORTUNITY",
      displayOrder: 1,
      customGuidance: "",
    });
    setMappingError(null);
    setIsMappingModalOpen(true);
  };

  const handleCreateMappingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVersionId || !isVersionDraft) return;
    setMappingSubmitting(true);
    setMappingError(null);

    try {
      await createCourseMapping(selectedVersionId, mappingForm);
      setNotification({
        type: "success",
        message: "Course recommendation mapping created successfully.",
      });
      setIsMappingModalOpen(false);
      await loadVersion(selectedVersionId);
      await loadReadiness(selectedVersionId);
    } catch (err) {
      setMappingError(
        err instanceof ApiError ? err.message : "Failed to create course mapping."
      );
    } finally {
      setMappingSubmitting(false);
    }
  };

  const handleDeleteMapping = async (mapping: AdminAssessmentCourseMappingDto) => {
    if (!isVersionDraft) return;
    if (
      !confirm(
        `Remove course mapping for '${mapping.courseTitle}' (${mapping.factorCode})?`
      )
    ) {
      return;
    }
    try {
      await deleteCourseMapping(mapping.id);
      setNotification({
        type: "success",
        message: "Course recommendation mapping removed successfully.",
      });
      await loadVersion(selectedVersionId!);
      await loadReadiness(selectedVersionId!);
    } catch (err) {
      setNotification({
        type: "error",
        message:
          err instanceof ApiError ? err.message : "Failed to delete mapping.",
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Render: Loading & Error
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-3">
        <div className="w-10 h-10 border-2 border-[#8C5E42] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs uppercase tracking-wider text-[#8A796E] font-semibold">
          Loading Authoring Studio...
        </p>
      </main>
    );
  }

  if (error || !instrument) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-50 text-red-700 flex items-center justify-center font-bold">
          !
        </div>
        <div className="space-y-1">
          <h2 className="font-serif text-xl font-bold text-red-800">
            Instrument Not Found
          </h2>
          <p className="text-xs text-red-600">
            {error || "The requested assessment instrument does not exist."}
          </p>
        </div>
        <Link href="/admin/assessments">
          <Button variant="outline" size="sm">
            &larr; Return to Instruments Directory
          </Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8A796E]">
        <Link href="/admin" className="hover:text-[#2D241E] transition-colors">
          Admin Console
        </Link>
        <span>/</span>
        <Link
          href="/admin/assessments"
          className="hover:text-[#2D241E] transition-colors"
        >
          Assessments
        </Link>
        <span>/</span>
        <span className="text-[#8C5E42]">{instrument.title}</span>
      </div>

      {/* Workspace Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E3D8CC] shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D241E]">
                {instrument.title}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF5EE] text-[#8C5E42] border border-[#E3D8CC]">
                {instrument.category}
              </span>
            </div>
            <p className="text-xs text-[#5C4D42] max-w-3xl leading-relaxed">
              {instrument.description}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8A796E] pt-1">
              <span>
                Slug:{" "}
                <code className="text-[#2D241E] font-mono bg-[#EAE3D9] px-1 py-0.5 rounded">
                  {instrument.slug}
                </code>
              </span>
              <span>•</span>
              <span>Audience: {instrument.intendedAudience || "General"}</span>
              <span>•</span>
              <span>
                Created:{" "}
                {new Date(instrument.createdAt).toLocaleDateString("en-US")}
              </span>
            </div>
          </div>

          <Button
            onClick={() => setIsVersionModalOpen(true)}
            variant="outline"
            size="sm"
            className="self-start lg:self-auto flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>+</span>
            <span>New Draft Version</span>
          </Button>
        </div>

        {/* Version Selector Carousel */}
        <div className="pt-4 border-t border-[#EAE3D9]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
              Select Assessment Version
            </span>
            <span className="text-xs text-[#8A796E]">
              {instrument.versions.length} version(s) in repository
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {instrument.versions.map((v) => {
              const isSelected = v.id === selectedVersionId;
              const statusColors = {
                ACTIVE: "bg-emerald-100 text-emerald-800",
                DRAFT: "bg-amber-100 text-amber-800",
                RETIRED: "bg-stone-200 text-stone-700",
              };

              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVersionId(v.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer border ${
                    isSelected
                      ? "bg-[#2D241E] text-white border-[#2D241E] shadow-sm"
                      : "bg-[#FAF8F5] text-[#5C4D42] border-[#E3D8CC] hover:bg-white"
                  }`}
                >
                  <span>Version {v.versionNumber}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : statusColors[v.status]
                    }`}
                  >
                    {v.status}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Global Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border flex items-start justify-between text-xs font-medium ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{notification.type === "success" ? "✓" : "⚠️"}</span>
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Selected Version Authoring Workspace */}
      {versionLoading ? (
        <div className="bg-white rounded-3xl p-16 border border-[#E3D8CC] text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#8C5E42] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-wider text-[#8A796E] font-semibold">
            Loading Version Spec...
          </p>
        </div>
      ) : versionDetail ? (
        <div className="space-y-6">
          {/* Version Status & Immutability Alert */}
          {!isVersionDraft && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs leading-relaxed flex items-start gap-3">
              <span className="text-base">🔒</span>
              <div className="space-y-0.5">
                <p className="font-bold">
                  Version {versionDetail.versionNumber} is {versionDetail.status}{" "}
                  (Immutable)
                </p>
                <p className="text-amber-900">
                  Published and retired versions cannot be edited, reweighted, or deleted to protect historical participant results. To make modifications, create a new draft version using the button above.
                </p>
              </div>
            </div>
          )}

          {/* Authoring Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[#E3D8CC] pb-2">
            {[
              { id: "readiness", label: "Activation Readiness", icon: "📋" },
              { id: "factors", label: `Factors (${versionDetail.factors?.length || 0})`, icon: "🧩" },
              { id: "questions", label: `Questions (${versionDetail.items?.length || 0})`, icon: "❓" },
              { id: "scoring", label: "Scoring Model", icon: "⚖️" },
              { id: "courses", label: `Course Mappings (${versionDetail.courseMappings?.length || 0})`, icon: "🎓" },
              { id: "metadata", label: "Disclaimer & Text", icon: "📄" },
              { id: "audit", label: `Audit Log (${versionDetail.auditLogs?.length || 0})`, icon: "📜" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AuthoringTab)}
                className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#8C5E42] text-white shadow-xs"
                    : "text-[#5C4D42] hover:bg-[#FAF8F5] hover:text-[#2D241E]"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* --------------------------------------------------------------- */}
          {/* TAB 1: Activation Readiness Audit Checklist                     */}
          {/* --------------------------------------------------------------- */}
          {activeTab === "readiness" && (
            <div className="bg-white rounded-3xl border border-[#E3D8CC] shadow-xs overflow-hidden space-y-6 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE3D9]">
                <div>
                  <h2 className="font-serif font-bold text-xl text-[#2D241E]">
                    Pre-Activation Readiness Audit
                  </h2>
                  <p className="text-xs text-[#5C4D42] mt-0.5">
                    Server-side read-only validation of psychometric structure, scoring schema, and course boundaries.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadReadiness(selectedVersionId!)}
                    disabled={readinessLoading}
                  >
                    {readinessLoading ? "Re-checking..." : "Re-run Validation"}
                  </Button>
                </div>
              </div>

              {readinessLoading ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-8 h-8 border-2 border-[#8C5E42] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-[#8A796E]">
                    Evaluating 7 governance checks...
                  </p>
                </div>
              ) : readinessReport ? (
                <div className="space-y-6">
                  {/* Overall Readiness Status Banner */}
                  <div
                    className={`p-5 rounded-2xl border flex items-start gap-4 ${
                      readinessReport.isReadyForActivation
                        ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                        : "bg-red-50 border-red-200 text-red-950"
                    }`}
                  >
                    <span className="text-2xl">
                      {readinessReport.isReadyForActivation ? "✅" : "⚠️"}
                    </span>
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm">
                        {readinessReport.isReadyForActivation
                          ? "Version Meets All Technical & Governance Prerequisites"
                          : "Prerequisites Incomplete — Activation Blocked"}
                      </h3>
                      <p className="text-xs leading-relaxed">
                        {readinessReport.isReadyForActivation
                          ? "All factor definitions, question coverage, scoring schemas, and published course mappings meet platform standards."
                          : `Identified ${readinessReport.missingRequirements.length} missing or incomplete prerequisite(s) before this version can be published.`}
                      </p>
                    </div>
                  </div>

                  {/* Missing Requirements List */}
                  {readinessReport.missingRequirements.length > 0 && (
                    <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-red-800">
                        Missing Requirements:
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-xs text-[#5C4D42]">
                        {readinessReport.missingRequirements.map((req, idx) => (
                          <li key={idx} className="font-medium text-red-700">
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 7 Diagnostic Checks */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
                      Governance Diagnostic Checklist
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {readinessReport.checks.map((check) => (
                        <div
                          key={check.id}
                          className={`p-4 rounded-2xl border transition-colors flex items-start justify-between gap-4 ${
                            check.passed
                              ? "bg-white border-[#E3D8CC]"
                              : "bg-red-50/50 border-red-200"
                          }`}
                        >
                          <div className="space-y-1 max-w-3xl">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                {check.passed ? "🟢" : "🔴"}
                              </span>
                              <h4 className="font-bold text-xs text-[#2D241E]">
                                {check.title}
                              </h4>
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FAF5EE] text-[#8C5E42] border border-[#E3D8CC]">
                                {check.category}
                              </span>
                            </div>
                            <p className="text-xs text-[#5C4D42] pl-6">
                              {check.message}
                            </p>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                              check.passed
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-red-100 text-red-800 border border-red-300"
                            }`}
                          >
                            {check.passed ? "Passed" : "Action Required"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Approval & Publishing */}
                  {readinessReport.status === "ACTIVE" ? (
                    <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900">
                      <strong>This version is live.</strong> Parents can take it at{" "}
                      <Link href="/assessments" className="underline font-semibold" target="_blank">
                        /assessments
                      </Link>
                      . To change questions, create a new draft version.
                    </div>
                  ) : readinessReport.status === "DRAFT" ? (
                    <div className="p-5 rounded-2xl bg-[#FAF5EE] border border-[#E3D8CC] space-y-5">
                      <div>
                        <h3 className="font-serif font-bold text-lg text-[#2D241E]">
                          Approve &amp; Publish
                        </h3>
                        <p className="text-xs text-[#5C4D42] mt-1">
                          Step 1: record who reviewed and approved the questions and scoring.
                          Step 2: once every check above is green, publish it for parents.
                        </p>
                      </div>

                      {!versionDetail?.approvedAt ? (
                        <div className="space-y-3">
                          <label className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
                            Approved by
                          </label>
                          <input
                            type="text"
                            value={approverName}
                            onChange={(e) => setApproverName(e.target.value)}
                            className="w-full sm:max-w-sm px-4 py-2.5 rounded-xl border border-[#DCD0C4] bg-white text-sm text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]/50"
                          />
                          <label className="flex items-start gap-2 text-xs text-[#5C4D42]">
                            <input
                              type="checkbox"
                              checked={approvalConfirmed}
                              onChange={(e) => setApprovalConfirmed(e.target.checked)}
                              className="mt-0.5"
                            />
                            <span>
                              I confirm this person has reviewed every question, answer option and
                              scoring rule in this version and approves them for use.
                            </span>
                          </label>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleApprove}
                            disabled={publishSubmitting || !approvalConfirmed || approverName.trim().length < 2}
                          >
                            {publishSubmitting ? "Saving..." : "Record Approval"}
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-emerald-800 font-semibold">
                          ✓ Approved by {versionDetail.approvedBy} on{" "}
                          {new Date(versionDetail.approvedAt).toLocaleDateString()}
                        </p>
                      )}

                      <div className="pt-4 border-t border-[#E3D8CC]">
                        <Button
                          variant="primary"
                          onClick={handlePublish}
                          disabled={publishSubmitting || !readinessReport.isReadyForActivation}
                        >
                          {publishSubmitting ? "Publishing..." : "Publish to Parents"}
                        </Button>
                        {!readinessReport.isReadyForActivation && (
                          <p className="text-xs text-[#8A796E] mt-2">
                            Complete the missing requirements above to enable publishing.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* TAB 2: Factors Management                                       */}
          {/* --------------------------------------------------------------- */}
          {activeTab === "factors" && (
            <div className="bg-white rounded-3xl border border-[#E3D8CC] shadow-xs overflow-hidden p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE3D9]">
                <div>
                  <h2 className="font-serif font-bold text-xl text-[#2D241E]">
                    Factor Definitions (Domains)
                  </h2>
                  <p className="text-xs text-[#5C4D42] mt-0.5">
                    Defines the core psychological dimensions measured by this instrument.
                  </p>
                </div>
                {isVersionDraft && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={openCreateFactorModal}
                  >
                    + Add Factor Definition
                  </Button>
                )}
              </div>

              {(!versionDetail.factors || versionDetail.factors.length === 0) ? (
                <div className="py-12 text-center space-y-3">
                  <p className="text-sm font-serif font-bold text-[#2D241E]">
                    No factor definitions registered
                  </p>
                  <p className="text-xs text-[#5C4D42]">
                    Register at least one factor before adding question items.
                  </p>
                  {isVersionDraft && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={openCreateFactorModal}
                    >
                      Add First Factor
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-[#EAE3D9]">
                  {versionDetail.factors.map((f) => (
                    <div
                      key={f.id}
                      className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#FAF5EE] border border-[#E3D8CC] text-[#8C5E42] flex items-center justify-center text-xs font-bold">
                            {f.orderIndex}
                          </span>
                          <h3 className="font-bold text-sm text-[#2D241E]">
                            {f.name}
                          </h3>
                          <code className="text-xs font-mono bg-[#EAE3D9] text-[#2D241E] px-1.5 py-0.5 rounded">
                            {f.code}
                          </code>
                          <span className="text-xs text-[#8A796E]">
                            ({f.itemsCount} question{f.itemsCount === 1 ? "" : "s"})
                          </span>
                        </div>
                        {f.tagline && (
                          <p className="text-xs font-medium text-[#78543B] pl-8">
                            {f.tagline}
                          </p>
                        )}
                        {f.description && (
                          <p className="text-xs text-[#5C4D42] pl-8 leading-relaxed max-w-2xl">
                            {f.description}
                          </p>
                        )}
                      </div>

                      {isVersionDraft && (
                        <div className="flex items-center gap-2 pl-8 md:pl-0 self-start md:self-center">
                          <button
                            onClick={() => openEditFactorModal(f)}
                            className="px-3 py-1.5 rounded-lg border border-[#D5C6B5] hover:bg-[#FAF8F5] text-xs font-semibold text-[#5C4D42] cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteFactor(f)}
                            className="px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-xs font-semibold text-red-700 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* TAB 3: Question Items & Options                                 */}
          {/* --------------------------------------------------------------- */}
          {activeTab === "questions" && (
            <div className="bg-white rounded-3xl border border-[#E3D8CC] shadow-xs overflow-hidden p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE3D9]">
                <div>
                  <h2 className="font-serif font-bold text-xl text-[#2D241E]">
                    Question Items & Weighted Options
                  </h2>
                  <p className="text-xs text-[#5C4D42] mt-0.5">
                    Reflective prompts presented to participants with strictly calibrated response values.
                  </p>
                </div>
                {isVersionDraft && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={openCreateItemModal}
                  >
                    + Add Question Item
                  </Button>
                )}
              </div>

              {(!versionDetail.items || versionDetail.items.length === 0) ? (
                <div className="py-12 text-center space-y-3">
                  <p className="text-sm font-serif font-bold text-[#2D241E]">
                    No question items defined
                  </p>
                  <p className="text-xs text-[#5C4D42]">
                    Each factor requires at least one question item to pass activation checks.
                  </p>
                  {isVersionDraft && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={openCreateItemModal}
                    >
                      Add First Question
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {versionDetail.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl border border-[#E3D8CC] bg-[#FAF8F5]/50 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#8C5E42] text-white flex items-center justify-center text-xs font-bold">
                              {item.orderIndex}
                            </span>
                            <code className="text-xs font-mono font-bold text-[#2D241E] bg-[#EAE3D9] px-1.5 py-0.5 rounded">
                              {item.itemKey}
                            </code>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FAF5EE] text-[#8C5E42] border border-[#E3D8CC]">
                              Factor: {item.factorName} ({item.factorCode})
                            </span>
                          </div>
                          <p className="font-serif font-bold text-base text-[#2D241E] pt-1">
                            &ldquo;{item.prompt}&rdquo;
                          </p>
                          {item.contextPrompt && (
                            <p className="text-xs text-[#78543B] italic">
                              Context: {item.contextPrompt}
                            </p>
                          )}
                        </div>

                        {isVersionDraft && (
                          <div className="flex items-center gap-2 self-start">
                            <button
                              onClick={() => openEditItemModal(item)}
                              className="px-3 py-1 rounded-lg border border-[#D5C6B5] hover:bg-white text-xs font-semibold text-[#5C4D42] cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item)}
                              className="px-3 py-1 rounded-lg border border-red-200 hover:bg-red-50 text-xs font-semibold text-red-700 cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Options Grid */}
                      <div className="pt-2 border-t border-[#EAE3D9]/60">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A796E]">
                          Response Options ({item.options.length}):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mt-1.5">
                          {item.options.map((opt) => (
                            <div
                              key={opt.id}
                              className="p-2.5 rounded-xl bg-white border border-[#E3D8CC] flex items-center justify-between text-xs"
                            >
                              <span className="text-[#2D241E] font-medium truncate pr-1">
                                {opt.label}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-[#FAF5EE] text-[#8C5E42] font-mono font-bold text-[10px]">
                                wt: {opt.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* TAB 4: Scoring Configuration                                    */}
          {/* --------------------------------------------------------------- */}
          {activeTab === "scoring" && (
            <div className="bg-white rounded-3xl border border-[#E3D8CC] shadow-xs overflow-hidden p-6 sm:p-8 space-y-6">
              <div className="pb-4 border-b border-[#EAE3D9]">
                <h2 className="font-serif font-bold text-xl text-[#2D241E]">
                  Approved Scoring Configuration
                </h2>
                <p className="text-xs text-[#5C4D42] mt-0.5">
                  Strict schema defining aggregation formula, classification score bands, and factor guidance templates.
                </p>
              </div>

              {scoringError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                  {scoringError}
                </div>
              )}

              <form onSubmit={handleSaveScoringConfig} className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
                      Scoring Configuration JSON
                    </label>
                    <span className="text-xs text-[#8A796E]">
                      Validated against ApprovedScoringConfigSchema
                    </span>
                  </div>
                  <textarea
                    rows={16}
                    value={scoringJson}
                    onChange={(e) => setScoringJson(e.target.value)}
                    disabled={!isVersionDraft || scoringSubmitting}
                    className="w-full p-4 rounded-2xl border border-[#D5C6B5] bg-[#1E1B18] text-[#FDFBF7] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#8C5E42] leading-relaxed disabled:opacity-60"
                  />
                </div>

                {isVersionDraft && (
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        // Generate starter template matching defined factors
                        const definedCodes =
                          versionDetail.factors?.map((f) => f.code) || [];
                        const templateGuidance: Record<string, unknown> = {};
                        definedCodes.forEach((code) => {
                          templateGuidance[code] = {
                            strengthTitle: `Strength in ${code}`,
                            strengthHabit: "Maintain consistency in daily habits.",
                            growthTitle: `Growth Focus for ${code}`,
                            growthHabit: "Practice reflective pausing.",
                          };
                        });
                        const starter = {
                          formula: "SUM_OF_WEIGHTS",
                          bands: [
                            {
                              name: "Developing",
                              minPercentage: 0,
                              maxPercentage: 49,
                              classification: "GROWTH_OPPORTUNITY",
                              description: "Opportunities for structured growth",
                            },
                            {
                              name: "Steady",
                              minPercentage: 50,
                              maxPercentage: 74,
                              classification: "STEADY",
                              description: "Emerging reflective consistency",
                            },
                            {
                              name: "Strengths",
                              minPercentage: 75,
                              maxPercentage: 100,
                              classification: "STRENGTH",
                              description: "Established core strength",
                            },
                          ],
                          strengthsThresholdPct: 75,
                          growthThresholdPct: 50,
                          guidanceTemplates: templateGuidance,
                        };
                        setScoringJson(JSON.stringify(starter, null, 2));
                      }}
                      className="text-xs text-[#8C5E42] hover:underline font-semibold cursor-pointer"
                    >
                      Fill Starter Config from Defined Factors
                    </button>

                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={scoringSubmitting}
                    >
                      {scoringSubmitting
                        ? "Validating & Saving..."
                        : "Validate & Save Scoring Config"}
                    </Button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* TAB 5: Course Recommendation Mappings                           */}
          {/* --------------------------------------------------------------- */}
          {activeTab === "courses" && (
            <div className="bg-white rounded-3xl border border-[#E3D8CC] shadow-xs overflow-hidden p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE3D9]">
                <div>
                  <h2 className="font-serif font-bold text-xl text-[#2D241E]">
                    Course Recommendation Mappings
                  </h2>
                  <p className="text-xs text-[#5C4D42] mt-0.5">
                    Maps identified growth opportunities to published Insight Ignite curriculum courses.
                  </p>
                </div>
                {isVersionDraft && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={openCreateMappingModal}
                  >
                    + Map Published Course
                  </Button>
                )}
              </div>

              {(!versionDetail.courseMappings ||
              versionDetail.courseMappings.length === 0) ? (
                <div className="py-12 text-center space-y-3">
                  <p className="text-sm font-serif font-bold text-[#2D241E]">
                    No course mappings configured
                  </p>
                  <p className="text-xs text-[#5C4D42]">
                    Connect participant growth areas with published pedagogical modules.
                  </p>
                  {isVersionDraft && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={openCreateMappingModal}
                    >
                      Create First Course Mapping
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-[#EAE3D9]">
                  {versionDetail.courseMappings.map((m) => (
                    <div
                      key={m.id}
                      className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FAF5EE] text-[#8C5E42] border border-[#E3D8CC]">
                            Factor: {m.factorName} ({m.factorCode})
                          </span>
                          <span className="text-xs font-bold text-[#2D241E]">
                            &rarr; {m.courseTitle}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              m.courseStatus === "PUBLISHED"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-red-50 text-red-800 border border-red-200"
                            }`}
                          >
                            Course Status: {m.courseStatus}
                          </span>
                        </div>
                        <p className="text-xs text-[#8A796E]">
                          Trigger Condition:{" "}
                          <strong className="text-[#2D241E]">
                            {m.triggerCondition}
                          </strong>{" "}
                          • Display Order: {m.displayOrder}
                        </p>
                        {m.customGuidance && (
                          <p className="text-xs text-[#5C4D42] italic">
                            &ldquo;{m.customGuidance}&rdquo;
                          </p>
                        )}
                      </div>

                      {isVersionDraft && (
                        <button
                          onClick={() => handleDeleteMapping(m)}
                          className="px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-xs font-semibold text-red-700 cursor-pointer self-start md:self-center"
                        >
                          Remove Mapping
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* TAB 6: Metadata & Instructions                                  */}
          {/* --------------------------------------------------------------- */}
          {activeTab === "metadata" && (
            <div className="bg-white rounded-3xl border border-[#E3D8CC] shadow-xs overflow-hidden p-6 sm:p-8 space-y-6">
              <div className="pb-4 border-b border-[#EAE3D9]">
                <h2 className="font-serif font-bold text-xl text-[#2D241E]">
                  Instructions & Legal Disclaimer
                </h2>
                <p className="text-xs text-[#5C4D42] mt-0.5">
                  Educational reflection disclaimer and guidance displayed to participants.
                </p>
              </div>

              <form onSubmit={handleUpdateMetadata} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
                    Educational Self-Reflection Disclaimer
                  </label>
                  <textarea
                    rows={3}
                    value={metadataForm.disclaimerText}
                    onChange={(e) =>
                      setMetadataForm({
                        ...metadataForm,
                        disclaimerText: e.target.value,
                      })
                    }
                    disabled={!isVersionDraft || metadataSubmitting}
                    className="w-full p-3.5 rounded-xl border border-[#D5C6B5] bg-[#FDFBF7] text-xs text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42] disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
                    Participant Assessment Instructions
                  </label>
                  <textarea
                    rows={4}
                    value={metadataForm.instructionsText}
                    onChange={(e) =>
                      setMetadataForm({
                        ...metadataForm,
                        instructionsText: e.target.value,
                      })
                    }
                    disabled={!isVersionDraft || metadataSubmitting}
                    className="w-full p-3.5 rounded-xl border border-[#D5C6B5] bg-[#FDFBF7] text-xs text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42] disabled:opacity-60"
                  />
                </div>

                {isVersionDraft && (
                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={metadataSubmitting}
                    >
                      {metadataSubmitting ? "Saving..." : "Save Metadata"}
                    </Button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* TAB 7: Version Audit Trail                                      */}
          {/* --------------------------------------------------------------- */}
          {activeTab === "audit" && (
            <div className="bg-white rounded-3xl border border-[#E3D8CC] shadow-xs overflow-hidden p-6 sm:p-8 space-y-6">
              <div className="pb-4 border-b border-[#EAE3D9]">
                <h2 className="font-serif font-bold text-xl text-[#2D241E]">
                  Version Audit Trail
                </h2>
                <p className="text-xs text-[#5C4D42] mt-0.5">
                  Immutable record of every administrative mutation performed on this version.
                </p>
              </div>

              {(!versionDetail.auditLogs || versionDetail.auditLogs.length === 0) ? (
                <div className="py-12 text-center text-xs text-[#8A796E]">
                  No audit log records for this version.
                </div>
              ) : (
                <div className="divide-y divide-[#EAE3D9]">
                  {versionDetail.auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <code className="font-mono font-bold text-[#8C5E42]">
                            {log.action}
                          </code>
                          <span className="text-[#8A796E]">•</span>
                          <span className="text-[#5C4D42]">
                            Actor: {log.actorEmail || log.actorUserId || "System"}
                          </span>
                        </div>
                        {Boolean(log.metadata) && (
                          <pre className="text-[10px] text-[#8A796E] font-mono bg-[#FAF8F5] p-1.5 rounded overflow-x-auto max-w-xl">
                            {JSON.stringify(log.metadata)}
                          </pre>
                        )}
                      </div>
                      <span className="text-[#8A796E] whitespace-nowrap self-start sm:self-center">
                        {new Date(log.timestamp).toLocaleString("en-US")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* ------------------------------------------------------------------- */}
      {/* MODALS                                                              */}
      {/* ------------------------------------------------------------------- */}

      {/* Create Factor Modal */}
      {isFactorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#E3D8CC] shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-[#E3D8CC] flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-[#2D241E]">
                {editingFactor ? "Edit Factor Definition" : "Add Factor Definition"}
              </h3>
              <button
                onClick={() => setIsFactorModalOpen(false)}
                className="text-[#8A796E] hover:text-[#2D241E] text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleFactorSubmit} className="p-6 space-y-4">
              {factorError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                  {factorError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
                    Factor Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingFactor)}
                    value={factorForm.code}
                    onChange={(e) =>
                      setFactorForm({
                        ...factorForm,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="e.g., EMOTIONAL_REGULATION"
                    className="w-full px-3 py-2 rounded-xl border border-[#D5C6B5] bg-[#FDFBF7] text-xs font-mono text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42] disabled:opacity-60"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
                    Order Index <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={factorForm.orderIndex}
                    onChange={(e) =>
                      setFactorForm({
                        ...factorForm,
                        orderIndex: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D5C6B5] bg-[#FDFBF7] text-xs text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
                  Factor Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={factorForm.name}
                  onChange={(e) =>
                    setFactorForm({ ...factorForm, name: e.target.value })
                  }
                  placeholder="e.g., Emotional Regulation & Composure"
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C6B5] bg-[#FDFBF7] text-xs text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
                  Tagline (Optional)
                </label>
                <input
                  type="text"
                  value={factorForm.tagline || ""}
                  onChange={(e) =>
                    setFactorForm({ ...factorForm, tagline: e.target.value })
                  }
                  placeholder="e.g., Awareness and composure under emotional stress"
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C6B5] bg-[#FDFBF7] text-xs text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
                  Clinical & Educational Description
                </label>
                <textarea
                  rows={3}
                  value={factorForm.description || ""}
                  onChange={(e) =>
                    setFactorForm({
                      ...factorForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Detailed description of what this factor evaluates..."
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C6B5] bg-[#FDFBF7] text-xs text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]"
                />
              </div>

              <div className="pt-4 border-t border-[#EAE3D9] flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFactorModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={factorSubmitting}
                >
                  {factorSubmitting ? "Saving..." : "Save Factor"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Question Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#E3D8CC] shadow-2xl overflow-hidden my-8">
            <div className="p-6 border-b border-[#E3D8CC] flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-[#2D241E]">
                {editingItem ? "Edit Question Item" : "Add Question Item"}
              </h3>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="text-[#8A796E] hover:text-[#2D241E] text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleItemSubmit} className="p-6 space-y-4">
              {itemError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                  {itemError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
                    Factor <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={itemForm.factorId}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, factorId: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D5C6B5] bg-[#FDFBF7] text-xs text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]"
                  >
                    {(versionDetail?.factors || []).map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
                    Item Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingItem)}
                    value={itemForm.itemKey}
                    onChange={(e) =>
                      setItemForm({ ...itemForm, itemKey: e.target.value })
                    }
                    placeholder="e.g., EQ_01"
                    className="w-full px-3 py-2 rounded-xl border border-[#D5C6B5] bg-[#FDFBF7] text-xs font-mono text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42] disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
                    Order Index <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={itemForm.orderIndex}
                    onChange={(e) =>
                      setItemForm({
                        ...itemForm,
                        orderIndex: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D5C6B5] bg-[#FDFBF7] text-xs text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
                  Question Reflective Prompt <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={itemForm.prompt}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, prompt: e.target.value })
                  }
                  placeholder="e.g., When my child is having an intense meltdown, I pause before responding."
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C6B5] bg-[#FDFBF7] text-xs text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
                  Context Prompt (Optional)
                </label>
                <input
                  type="text"
                  value={itemForm.contextPrompt}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, contextPrompt: e.target.value })
                  }
                  placeholder="e.g., Think about bedtime transitions or public tantrums"
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C6B5] bg-[#FDFBF7] text-xs text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]"
                />
              </div>

              {/* Dynamic Answer Options */}
              <div className="space-y-2 pt-2 border-t border-[#EAE3D9]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
                    Answer Options & Score Weights (≥ 2 required)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextIdx = itemForm.options.length + 1;
                      setItemForm({
                        ...itemForm,
                        options: [
                          ...itemForm.options,
                          {
                            id: `opt_${nextIdx}`,
                            label: `Option ${nextIdx}`,
                            orderIndex: nextIdx,
                            value: nextIdx,
                          },
                        ],
                      });
                    }}
                    className="text-xs text-[#8C5E42] hover:underline font-semibold cursor-pointer"
                  >
                    + Add Option
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {itemForm.options.map((opt, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E3D8CC]"
                    >
                      <div className="col-span-3">
                        <input
                          type="text"
                          required
                          value={opt.id}
                          onChange={(e) => {
                            const copy = [...itemForm.options];
                            copy[idx].id = e.target.value;
                            setItemForm({ ...itemForm, options: copy });
                          }}
                          placeholder="ID"
                          className="w-full px-2 py-1 rounded-lg border border-[#D5C6B5] bg-white text-[11px] font-mono"
                        />
                      </div>
                      <div className="col-span-5">
                        <input
                          type="text"
                          required
                          value={opt.label}
                          onChange={(e) => {
                            const copy = [...itemForm.options];
                            copy[idx].label = e.target.value;
                            setItemForm({ ...itemForm, options: copy });
                          }}
                          placeholder="Display Label"
                          className="w-full px-2 py-1 rounded-lg border border-[#D5C6B5] bg-white text-[11px]"
                        />
                      </div>
                      <div className="col-span-3 flex items-center gap-1">
                        <span className="text-[10px] text-[#8A796E]">wt:</span>
                        <input
                          type="number"
                          required
                          value={opt.value}
                          onChange={(e) => {
                            const copy = [...itemForm.options];
                            copy[idx].value = parseFloat(e.target.value) || 0;
                            setItemForm({ ...itemForm, options: copy });
                          }}
                          className="w-full px-2 py-1 rounded-lg border border-[#D5C6B5] bg-white text-[11px] font-mono text-center"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        {itemForm.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const copy = itemForm.options.filter(
                                (_, i) => i !== idx
                              );
                              setItemForm({ ...itemForm, options: copy });
                            }}
                            className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#EAE3D9] flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsItemModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={itemSubmitting}
                >
                  {itemSubmitting ? "Saving..." : "Save Question Item"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Course Mapping Modal */}
      {isMappingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#E3D8CC] shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-[#E3D8CC] flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-[#2D241E]">
                Map Course Recommendation
              </h3>
              <button
                onClick={() => setIsMappingModalOpen(false)}
                className="text-[#8A796E] hover:text-[#2D241E] text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateMappingSubmit} className="p-6 space-y-4">
              {mappingError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                  {mappingError}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
                  Target Factor <span className="text-red-500">*</span>
                </label>
                <select
                  value={mappingForm.factorId}
                  onChange={(e) =>
                    setMappingForm({ ...mappingForm, factorId: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C6B5] bg-[#FDFBF7] text-xs text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]"
                >
                  {(versionDetail?.factors || []).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
                  Published Curriculum Course <span className="text-red-500">*</span>
                </label>
                <select
                  value={mappingForm.courseId}
                  onChange={(e) =>
                    setMappingForm({ ...mappingForm, courseId: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C6B5] bg-[#FDFBF7] text-xs text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]"
                >
                  {availableCourses
                    .filter((c) => c.status === "PUBLISHED")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} (PUBLISHED)
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-[#8A796E]">
                  Only courses in PUBLISHED status can be mapped to assessment participants.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
                    Trigger Condition
                  </label>
                  <select
                    value={mappingForm.triggerCondition}
                    onChange={(e) =>
                      setMappingForm({
                        ...mappingForm,
                        triggerCondition: e.target.value as
                          | "GROWTH_OPPORTUNITY"
                          | "GENERAL_RECOMMENDATION",
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D5C6B5] bg-[#FDFBF7] text-xs text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]"
                  >
                    <option value="GROWTH_OPPORTUNITY">Growth Opportunity</option>
                    <option value="GENERAL_RECOMMENDATION">General Recommendation</option>
                    <option value="ALWAYS">Always Recommend</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={mappingForm.displayOrder}
                    onChange={(e) =>
                      setMappingForm({
                        ...mappingForm,
                        displayOrder: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#D5C6B5] bg-[#FDFBF7] text-xs text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C4D42]">
                  Custom Pedagogical Guidance (Optional)
                </label>
                <textarea
                  rows={2}
                  value={mappingForm.customGuidance || ""}
                  onChange={(e) =>
                    setMappingForm({
                      ...mappingForm,
                      customGuidance: e.target.value,
                    })
                  }
                  placeholder="e.g., Recommended to deepen emotional co-regulation and presence skills."
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C6B5] bg-[#FDFBF7] text-xs text-[#2D241E] focus:outline-none focus:ring-2 focus:ring-[#8C5E42]"
                />
              </div>

              <div className="pt-4 border-t border-[#EAE3D9] flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMappingModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={mappingSubmitting}
                >
                  {mappingSubmitting ? "Mapping..." : "Save Course Mapping"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Draft Version Modal */}
      {isVersionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#E3D8CC] shadow-2xl overflow-hidden p-6 space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#2D241E]">
              Create New Draft Version
            </h3>
            <p className="text-xs text-[#5C4D42] leading-relaxed">
              This will create Version {(instrument?.versions?.length || 0) + 1}{" "}
              in <strong>DRAFT</strong> status for incremental factor, question, and scoring edits.
            </p>
            <div className="pt-4 border-t border-[#EAE3D9] flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsVersionModalOpen(false)}
                disabled={versionSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateNewDraftVersion}
                disabled={versionSubmitting}
              >
                {versionSubmitting
                  ? "Creating Version..."
                  : `Initialize Version ${(instrument?.versions?.length || 0) + 1}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
