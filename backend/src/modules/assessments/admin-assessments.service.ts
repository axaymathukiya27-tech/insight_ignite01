import {
  prisma,
  User,
  AssessmentStatus,
  CourseStatus,
} from "@insight-ignite/database";
import {
  CreateAssessmentInstrumentInput,
  CreateAssessmentVersionInput,
  UpdateAssessmentVersionMetadataInput,
  CreateAssessmentFactorInput,
  UpdateAssessmentFactorInput,
  CreateAssessmentItemInput,
  UpdateAssessmentItemInput,
  CreateCourseMappingBody,
  AdminAssessmentInstrumentSummary,
  AdminAssessmentInstrumentDetail,
  AdminAssessmentVersionDetail,
  AdminAssessmentFactorDto,
  AdminAssessmentItemDto,
  AdminAssessmentCourseMappingDto,
  AdminAssessmentOptionDto,
  AssessmentActivationReadinessReport,
  AssessmentValidationCheck,
} from "@insight-ignite/shared";
import {
  AssessmentError,
  ApprovedScoringConfigSchema,
  ApprovedScoringConfig,
  RawOptionWithWeight,
} from "./scoring.service";

/**
 * Lists all assessment instruments with version summaries.
 */
export async function listAdminInstruments(): Promise<
  AdminAssessmentInstrumentSummary[]
> {
  const instruments = await prisma.assessmentInstrument.findMany({
    include: {
      versions: {
        select: {
          id: true,
          versionNumber: true,
          status: true,
        },
        orderBy: { versionNumber: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return instruments.map((inst) => {
    const activeVersion = inst.versions.find(
      (v) => v.status === AssessmentStatus.ACTIVE
    );

    return {
      id: inst.id,
      slug: inst.slug,
      title: inst.title,
      subtitle: inst.subtitle,
      category: inst.category,
      status: inst.status as "DRAFT" | "ACTIVE" | "RETIRED",
      activeVersionNumber: activeVersion ? activeVersion.versionNumber : null,
      totalVersions: inst.versions.length,
      createdAt: inst.createdAt.toISOString(),
      updatedAt: inst.updatedAt.toISOString(),
    };
  });
}

/**
 * Creates a new draft assessment instrument and its initial draft Version 1.
 * Audited atomically.
 */
export async function createDraftInstrument(
  input: CreateAssessmentInstrumentInput,
  actor: User
): Promise<AdminAssessmentInstrumentDetail> {
  const existing = await prisma.assessmentInstrument.findUnique({
    where: { slug: input.slug },
  });

  if (existing) {
    throw new AssessmentError(
      `An assessment instrument with slug '${input.slug}' already exists.`,
      400,
      "SLUG_ALREADY_EXISTS"
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const instrument = await tx.assessmentInstrument.create({
      data: {
        slug: input.slug,
        title: input.title,
        subtitle: input.subtitle || null,
        description: input.description,
        category: input.category || "parenting",
        intendedAudience: input.intendedAudience || null,
        status: AssessmentStatus.DRAFT,
      },
    });

    const initialVersion = await tx.assessmentVersion.create({
      data: {
        instrumentId: instrument.id,
        versionNumber: 1,
        status: AssessmentStatus.DRAFT,
        disclaimerText:
          "This self-assessment is an educational self-reflection tool, not a diagnostic or clinical evaluation.",
        instructionsText:
          "Please answer each reflective prompt honestly based on your typical reactions in daily parenting interactions.",
      },
    });

    const auditLog = await tx.assessmentAuditLog.create({
      data: {
        instrumentId: instrument.id,
        versionId: initialVersion.id,
        actorUserId: actor.id,
        actorEmail: actor.email,
        action: "INSTRUMENT_CREATED",
        metadata: {
          slug: instrument.slug,
          title: instrument.title,
          initialVersionNumber: 1,
        },
      },
    });

    return { instrument, initialVersion, auditLog };
  });

  return getInstrumentDetail(result.instrument.id);
}

/**
 * Retrieves full instrument details, version timeline, and audit history.
 */
export async function getInstrumentDetail(
  id: string
): Promise<AdminAssessmentInstrumentDetail> {
  const instrument = await prisma.assessmentInstrument.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
    include: {
      versions: {
        include: {
          factors: { select: { id: true } },
          items: { select: { id: true } },
        },
        orderBy: { versionNumber: "desc" },
      },
      auditLogs: {
        orderBy: { timestamp: "desc" },
        take: 50,
      },
    },
  });

  if (!instrument) {
    throw new AssessmentError(
      `Assessment instrument '${id}' not found.`,
      404,
      "INSTRUMENT_NOT_FOUND"
    );
  }

  return {
    id: instrument.id,
    slug: instrument.slug,
    title: instrument.title,
    subtitle: instrument.subtitle,
    description: instrument.description,
    category: instrument.category,
    intendedAudience: instrument.intendedAudience,
    status: instrument.status as "DRAFT" | "ACTIVE" | "RETIRED",
    approvedBy: instrument.approvedBy,
    approvedAt: instrument.approvedAt ? instrument.approvedAt.toISOString() : null,
    versions: instrument.versions.map((v) => ({
      id: v.id,
      versionNumber: v.versionNumber,
      status: v.status as "DRAFT" | "ACTIVE" | "RETIRED",
      factorsCount: v.factors.length,
      itemsCount: v.items.length,
      publishedAt: v.publishedAt ? v.publishedAt.toISOString() : null,
      approvedBy: v.approvedBy,
      createdAt: v.createdAt.toISOString(),
    })),
    auditLogs: instrument.auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      actorEmail: log.actorEmail,
      actorUserId: log.actorUserId,
      timestamp: log.timestamp.toISOString(),
      metadata: log.metadata,
    })),
    createdAt: instrument.createdAt.toISOString(),
    updatedAt: instrument.updatedAt.toISOString(),
  };
}

/**
 * Creates a new incremental draft version for an existing instrument.
 */
export async function createDraftVersion(
  instrumentId: string,
  input: CreateAssessmentVersionInput,
  actor: User
): Promise<AdminAssessmentVersionDetail> {
  const instrument = await prisma.assessmentInstrument.findUnique({
    where: { id: instrumentId },
    include: {
      versions: {
        select: { versionNumber: true },
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
    },
  });

  if (!instrument) {
    throw new AssessmentError(
      `Assessment instrument '${instrumentId}' not found.`,
      404,
      "INSTRUMENT_NOT_FOUND"
    );
  }

  const latestVersionNumber =
    instrument.versions.length > 0 ? instrument.versions[0].versionNumber : 0;
  const newVersionNumber = latestVersionNumber + 1;

  // The new draft starts as a copy of the latest version (factors, questions, scoring
  // configuration and course mappings), so a correction does not mean re-typing every
  // question. The earlier version itself is never modified.
  const source =
    instrument.versions.length > 0
      ? await prisma.assessmentVersion.findUnique({
          where: {
            instrumentId_versionNumber: { instrumentId: instrument.id, versionNumber: latestVersionNumber },
          },
          include: { factors: true, items: true, courseMappings: true },
        })
      : null;

  const result = await prisma.$transaction(async (tx) => {
    const version = await tx.assessmentVersion.create({
      data: {
        instrumentId: instrument.id,
        versionNumber: newVersionNumber,
        status: AssessmentStatus.DRAFT,
        scoringConfig: (source?.scoringConfig ?? undefined) as object | undefined,
        disclaimerText:
          input.disclaimerText ||
          source?.disclaimerText ||
          "This self-assessment is an educational self-reflection tool, not a diagnostic or clinical evaluation.",
        instructionsText:
          input.instructionsText ||
          source?.instructionsText ||
          "Please answer each reflective prompt honestly based on your typical reactions in daily parenting interactions.",
      },
    });

    if (source) {
      const factorIdMap = new Map<string, string>();
      for (const f of source.factors) {
        const copy = await tx.assessmentFactorDefinition.create({
          data: {
            versionId: version.id,
            code: f.code,
            name: f.name,
            tagline: f.tagline,
            description: f.description,
            orderIndex: f.orderIndex,
          },
        });
        factorIdMap.set(f.id, copy.id);
      }
      for (const it of source.items) {
        await tx.assessmentItem.create({
          data: {
            versionId: version.id,
            factorId: factorIdMap.get(it.factorId)!,
            itemKey: it.itemKey,
            orderIndex: it.orderIndex,
            prompt: it.prompt,
            contextPrompt: it.contextPrompt,
            responseType: it.responseType,
            options: it.options as object,
            isRequired: it.isRequired,
          },
        });
      }
      for (const m of source.courseMappings) {
        await tx.assessmentCourseMapping.create({
          data: {
            versionId: version.id,
            factorId: factorIdMap.get(m.factorId)!,
            courseId: m.courseId,
            triggerCondition: m.triggerCondition,
            displayOrder: m.displayOrder,
            customGuidance: m.customGuidance,
          },
        });
      }
    }

    await tx.assessmentAuditLog.create({
      data: {
        instrumentId: instrument.id,
        versionId: version.id,
        actorUserId: actor.id,
        actorEmail: actor.email,
        action: "VERSION_CREATED",
        metadata: {
          versionNumber: newVersionNumber,
          status: AssessmentStatus.DRAFT,
          copiedFromVersion: source ? source.versionNumber : null,
        },
      },
    });

    return version;
  });

  return getAdminVersionDetail(result.id);
}

/**
 * Retrieves full authoring spec for an assessment version (factors, items, mappings, config, audit logs).
 */
export async function getAdminVersionDetail(
  versionId: string
): Promise<AdminAssessmentVersionDetail> {
  const version = await prisma.assessmentVersion.findUnique({
    where: { id: versionId },
    include: {
      instrument: true,
      factors: {
        include: {
          items: { select: { id: true } },
        },
        orderBy: { orderIndex: "asc" },
      },
      items: {
        include: { factor: true },
        orderBy: { orderIndex: "asc" },
      },
      courseMappings: {
        include: {
          factor: true,
          course: true,
        },
        orderBy: { displayOrder: "asc" },
      },
      auditLogs: {
        orderBy: { timestamp: "desc" },
        take: 50,
      },
    },
  });

  if (!version) {
    throw new AssessmentError(
      `Assessment version '${versionId}' not found.`,
      404,
      "VERSION_NOT_FOUND"
    );
  }

  const factors: AdminAssessmentFactorDto[] = version.factors.map((f) => ({
    id: f.id,
    versionId: f.versionId,
    code: f.code,
    name: f.name,
    tagline: f.tagline,
    description: f.description,
    orderIndex: f.orderIndex,
    itemsCount: f.items.length,
  }));

  const items: AdminAssessmentItemDto[] = version.items.map((item) => {
    const rawOpts = (item.options as unknown as RawOptionWithWeight[]) || [];
    const options: AdminAssessmentOptionDto[] = rawOpts.map((opt) => ({
      id: opt.id,
      label: opt.label,
      orderIndex: opt.orderIndex,
      value: opt.value,
    }));

    return {
      id: item.id,
      versionId: item.versionId,
      factorId: item.factorId,
      factorCode: item.factor.code,
      factorName: item.factor.name,
      itemKey: item.itemKey,
      orderIndex: item.orderIndex,
      prompt: item.prompt,
      contextPrompt: item.contextPrompt,
      responseType: item.responseType,
      options,
      isRequired: item.isRequired,
    };
  });

  const courseMappings: AdminAssessmentCourseMappingDto[] =
    version.courseMappings.map((m) => ({
      id: m.id,
      versionId: m.versionId,
      factorId: m.factorId,
      factorCode: m.factor.code,
      factorName: m.factor.name,
      courseId: m.courseId,
      courseSlug: m.course.slug,
      courseTitle: m.course.title,
      courseStatus: m.course.status,
      triggerCondition: m.triggerCondition,
      displayOrder: m.displayOrder,
      customGuidance: m.customGuidance,
    }));

  return {
    id: version.id,
    instrumentId: version.instrument.id,
    instrumentTitle: version.instrument.title,
    instrumentSlug: version.instrument.slug,
    versionNumber: version.versionNumber,
    status: version.status as "DRAFT" | "ACTIVE" | "RETIRED",
    disclaimerText: version.disclaimerText,
    instructionsText: version.instructionsText,
    scoringConfig: version.scoringConfig,
    factorsCount: version.factors.length,
    itemsCount: version.items.length,
    factors,
    items,
    courseMappings,
    publishedAt: version.publishedAt ? version.publishedAt.toISOString() : null,
    retiredAt: version.retiredAt ? version.retiredAt.toISOString() : null,
    approvedBy: version.approvedBy,
    approvedAt: version.approvedAt ? version.approvedAt.toISOString() : null,
    createdAt: version.createdAt.toISOString(),
    updatedAt: version.updatedAt.toISOString(),
    auditLogs: version.auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      actorEmail: log.actorEmail,
      actorUserId: log.actorUserId,
      timestamp: log.timestamp.toISOString(),
      metadata: log.metadata,
    })),
  };
}

/**
 * Updates metadata for a DRAFT version.
 */
export async function updateDraftVersionMetadata(
  versionId: string,
  input: UpdateAssessmentVersionMetadataInput,
  actor: User
): Promise<AdminAssessmentVersionDetail> {
  const version = await prisma.assessmentVersion.findUnique({
    where: { id: versionId },
  });

  if (!version) {
    throw new AssessmentError(
      `Assessment version '${versionId}' not found.`,
      404,
      "VERSION_NOT_FOUND"
    );
  }

  assertVersionIsDraft(version.status, version.versionNumber);

  await prisma.$transaction(async (tx) => {
    await tx.assessmentVersion.update({
      where: { id: versionId },
      data: {
        disclaimerText:
          input.disclaimerText !== undefined
            ? input.disclaimerText
            : version.disclaimerText,
        instructionsText:
          input.instructionsText !== undefined
            ? input.instructionsText
            : version.instructionsText,
      },
    });

    await tx.assessmentAuditLog.create({
      data: {
        instrumentId: version.instrumentId,
        versionId: version.id,
        actorUserId: actor.id,
        actorEmail: actor.email,
        action: "VERSION_METADATA_UPDATED",
        metadata: {
          versionNumber: version.versionNumber,
          disclaimerChanged: input.disclaimerText !== undefined,
          instructionsChanged: input.instructionsText !== undefined,
        },
      },
    });
  });

  return getAdminVersionDetail(version.id);
}

// ---------------------------------------------------------------------------
// 1. Draft Factor Operations
// ---------------------------------------------------------------------------

export async function createAssessmentFactor(
  versionId: string,
  input: CreateAssessmentFactorInput,
  actor: User
): Promise<AdminAssessmentFactorDto> {
  const version = await prisma.assessmentVersion.findUnique({
    where: { id: versionId },
  });

  if (!version) {
    throw new AssessmentError(
      `Assessment version '${versionId}' not found.`,
      404,
      "VERSION_NOT_FOUND"
    );
  }

  assertVersionIsDraft(version.status, version.versionNumber);

  // Check code uniqueness within version
  const existingCode = await prisma.assessmentFactorDefinition.findUnique({
    where: {
      versionId_code: { versionId, code: input.code },
    },
  });

  if (existingCode) {
    throw new AssessmentError(
      `Factor code '${input.code}' already exists in this assessment version.`,
      400,
      "FACTOR_CODE_EXISTS"
    );
  }

  // Check orderIndex uniqueness within version
  const existingOrder = await prisma.assessmentFactorDefinition.findUnique({
    where: {
      versionId_orderIndex: { versionId, orderIndex: input.orderIndex },
    },
  });

  if (existingOrder) {
    throw new AssessmentError(
      `Order index ${input.orderIndex} is already occupied by factor '${existingOrder.name}'.`,
      400,
      "ORDER_INDEX_CONFLICT"
    );
  }

  const factor = await prisma.$transaction(async (tx) => {
    const created = await tx.assessmentFactorDefinition.create({
      data: {
        versionId,
        code: input.code,
        name: input.name,
        tagline: input.tagline || null,
        description: input.description || null,
        orderIndex: input.orderIndex,
      },
    });

    await tx.assessmentAuditLog.create({
      data: {
        instrumentId: version.instrumentId,
        versionId: version.id,
        actorUserId: actor.id,
        actorEmail: actor.email,
        action: "FACTOR_CREATED",
        metadata: {
          factorId: created.id,
          code: created.code,
          name: created.name,
          orderIndex: created.orderIndex,
        },
      },
    });

    return created;
  });

  return {
    id: factor.id,
    versionId: factor.versionId,
    code: factor.code,
    name: factor.name,
    tagline: factor.tagline,
    description: factor.description,
    orderIndex: factor.orderIndex,
    itemsCount: 0,
  };
}

export async function updateAssessmentFactor(
  factorId: string,
  input: UpdateAssessmentFactorInput,
  actor: User
): Promise<AdminAssessmentFactorDto> {
  const factor = await prisma.assessmentFactorDefinition.findUnique({
    where: { id: factorId },
    include: {
      version: true,
      items: { select: { id: true } },
    },
  });

  if (!factor) {
    throw new AssessmentError(
      `Assessment factor '${factorId}' not found.`,
      404,
      "FACTOR_NOT_FOUND"
    );
  }

  assertVersionIsDraft(factor.version.status, factor.version.versionNumber);

  // If orderIndex is changing, check uniqueness
  if (
    input.orderIndex !== undefined &&
    input.orderIndex !== factor.orderIndex
  ) {
    const conflict = await prisma.assessmentFactorDefinition.findUnique({
      where: {
        versionId_orderIndex: {
          versionId: factor.versionId,
          orderIndex: input.orderIndex,
        },
      },
    });

    if (conflict) {
      throw new AssessmentError(
        `Order index ${input.orderIndex} is already occupied by factor '${conflict.name}'.`,
        400,
        "ORDER_INDEX_CONFLICT"
      );
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.assessmentFactorDefinition.update({
      where: { id: factorId },
      data: {
        name: input.name !== undefined ? input.name : factor.name,
        tagline: input.tagline !== undefined ? input.tagline : factor.tagline,
        description:
          input.description !== undefined ? input.description : factor.description,
        orderIndex:
          input.orderIndex !== undefined ? input.orderIndex : factor.orderIndex,
      },
    });

    await tx.assessmentAuditLog.create({
      data: {
        instrumentId: factor.version.instrumentId,
        versionId: factor.versionId,
        actorUserId: actor.id,
        actorEmail: actor.email,
        action: "FACTOR_UPDATED",
        metadata: {
          factorId: res.id,
          code: res.code,
          name: res.name,
          orderIndex: res.orderIndex,
        },
      },
    });

    return res;
  });

  return {
    id: updated.id,
    versionId: updated.versionId,
    code: updated.code,
    name: updated.name,
    tagline: updated.tagline,
    description: updated.description,
    orderIndex: updated.orderIndex,
    itemsCount: factor.items.length,
  };
}

export async function deleteAssessmentFactor(
  factorId: string,
  actor: User
): Promise<{ success: boolean; message: string }> {
  const factor = await prisma.assessmentFactorDefinition.findUnique({
    where: { id: factorId },
    include: {
      version: true,
      items: { select: { id: true } },
    },
  });

  if (!factor) {
    throw new AssessmentError(
      `Assessment factor '${factorId}' not found.`,
      404,
      "FACTOR_NOT_FOUND"
    );
  }

  assertVersionIsDraft(factor.version.status, factor.version.versionNumber);

  if (factor.items.length > 0) {
    throw new AssessmentError(
      `Cannot delete factor '${factor.name}' because ${factor.items.length} question(s) reference it. Delete or reassign items first.`,
      400,
      "FACTOR_IN_USE"
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.assessmentFactorDefinition.delete({
      where: { id: factorId },
    });

    await tx.assessmentAuditLog.create({
      data: {
        instrumentId: factor.version.instrumentId,
        versionId: factor.versionId,
        actorUserId: actor.id,
        actorEmail: actor.email,
        action: "FACTOR_DELETED",
        metadata: {
          factorId: factor.id,
          code: factor.code,
          name: factor.name,
        },
      },
    });
  });

  return {
    success: true,
    message: `Factor '${factor.name}' (${factor.code}) was deleted successfully.`,
  };
}

// ---------------------------------------------------------------------------
// 2. Draft Question Item Operations
// ---------------------------------------------------------------------------

export async function createAssessmentItem(
  versionId: string,
  input: CreateAssessmentItemInput,
  actor: User
): Promise<AdminAssessmentItemDto> {
  const version = await prisma.assessmentVersion.findUnique({
    where: { id: versionId },
  });

  if (!version) {
    throw new AssessmentError(
      `Assessment version '${versionId}' not found.`,
      404,
      "VERSION_NOT_FOUND"
    );
  }

  assertVersionIsDraft(version.status, version.versionNumber);

  // Validate factor existence and enforce strict cross-version parent isolation
  const factor = await prisma.assessmentFactorDefinition.findUnique({
    where: { id: input.factorId },
  });

  if (!factor) {
    throw new AssessmentError(
      `Referenced factor '${input.factorId}' does not exist.`,
      400,
      "FACTOR_NOT_FOUND"
    );
  }

  if (factor.versionId !== versionId) {
    throw new AssessmentError(
      `Cross-version violation: Factor '${factor.code}' belongs to version ${factor.versionId}, not this version (${versionId}).`,
      400,
      "CROSS_VERSION_REFERENCE"
    );
  }

  // Check itemKey uniqueness within version
  const existingKey = await prisma.assessmentItem.findUnique({
    where: {
      versionId_itemKey: { versionId, itemKey: input.itemKey },
    },
  });

  if (existingKey) {
    throw new AssessmentError(
      `Item key '${input.itemKey}' already exists in this assessment version.`,
      400,
      "ITEM_KEY_EXISTS"
    );
  }

  // Check orderIndex uniqueness within version
  const existingOrder = await prisma.assessmentItem.findUnique({
    where: {
      versionId_orderIndex: { versionId, orderIndex: input.orderIndex },
    },
  });

  if (existingOrder) {
    throw new AssessmentError(
      `Order index ${input.orderIndex} is already occupied by item '${existingOrder.itemKey}'.`,
      400,
      "ORDER_INDEX_CONFLICT"
    );
  }

  validateOptionsIntegrity(input.options as unknown as RawOptionWithWeight[]);

  const item = await prisma.$transaction(async (tx) => {
    const created = await tx.assessmentItem.create({
      data: {
        versionId,
        factorId: input.factorId,
        itemKey: input.itemKey,
        orderIndex: input.orderIndex,
        prompt: input.prompt,
        contextPrompt: input.contextPrompt || null,
        responseType: input.responseType || "SINGLE_CHOICE",
        options: input.options as unknown as object,
        isRequired: input.isRequired !== undefined ? input.isRequired : true,
      },
      include: { factor: true },
    });

    await tx.assessmentAuditLog.create({
      data: {
        instrumentId: version.instrumentId,
        versionId: version.id,
        actorUserId: actor.id,
        actorEmail: actor.email,
        action: "ITEM_CREATED",
        metadata: {
          itemId: created.id,
          itemKey: created.itemKey,
          factorCode: created.factor.code,
          orderIndex: created.orderIndex,
        },
      },
    });

    return created;
  });

  const rawOpts = (item.options as unknown as RawOptionWithWeight[]) || [];
  return {
    id: item.id,
    versionId: item.versionId,
    factorId: item.factorId,
    factorCode: item.factor.code,
    factorName: item.factor.name,
    itemKey: item.itemKey,
    orderIndex: item.orderIndex,
    prompt: item.prompt,
    contextPrompt: item.contextPrompt,
    responseType: item.responseType,
    options: rawOpts.map((o) => ({
      id: o.id,
      label: o.label,
      orderIndex: o.orderIndex,
      value: o.value,
    })),
    isRequired: item.isRequired,
  };
}

export async function updateAssessmentItem(
  itemId: string,
  input: UpdateAssessmentItemInput,
  actor: User
): Promise<AdminAssessmentItemDto> {
  const item = await prisma.assessmentItem.findUnique({
    where: { id: itemId },
    include: { version: true, factor: true },
  });

  if (!item) {
    throw new AssessmentError(
      `Assessment item '${itemId}' not found.`,
      404,
      "ITEM_NOT_FOUND"
    );
  }

  assertVersionIsDraft(item.version.status, item.version.versionNumber);

  // If factorId is changing, ensure new factor belongs to the same version
  let targetFactor = item.factor;
  if (input.factorId && input.factorId !== item.factorId) {
    const newFactor = await prisma.assessmentFactorDefinition.findUnique({
      where: { id: input.factorId },
    });

    if (!newFactor) {
      throw new AssessmentError(
        `Referenced factor '${input.factorId}' does not exist.`,
        400,
        "FACTOR_NOT_FOUND"
      );
    }

    if (newFactor.versionId !== item.versionId) {
      throw new AssessmentError(
        `Cross-version violation: Factor '${newFactor.code}' does not belong to version ${item.versionId}.`,
        400,
        "CROSS_VERSION_REFERENCE"
      );
    }
    targetFactor = newFactor;
  }

  // If orderIndex changing, check uniqueness
  if (
    input.orderIndex !== undefined &&
    input.orderIndex !== item.orderIndex
  ) {
    const conflict = await prisma.assessmentItem.findUnique({
      where: {
        versionId_orderIndex: {
          versionId: item.versionId,
          orderIndex: input.orderIndex,
        },
      },
    });

    if (conflict) {
      throw new AssessmentError(
        `Order index ${input.orderIndex} is already occupied by item '${conflict.itemKey}'.`,
        400,
        "ORDER_INDEX_CONFLICT"
      );
    }
  }

  if (input.options) {
    validateOptionsIntegrity(input.options as unknown as RawOptionWithWeight[]);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.assessmentItem.update({
      where: { id: itemId },
      data: {
        factorId: input.factorId !== undefined ? input.factorId : item.factorId,
        orderIndex:
          input.orderIndex !== undefined ? input.orderIndex : item.orderIndex,
        prompt: input.prompt !== undefined ? input.prompt : item.prompt,
        contextPrompt:
          input.contextPrompt !== undefined
            ? input.contextPrompt
            : item.contextPrompt,
        responseType:
          input.responseType !== undefined
            ? input.responseType
            : item.responseType,
        options:
          input.options !== undefined
            ? (input.options as any)
            : undefined,
        isRequired:
          input.isRequired !== undefined ? input.isRequired : item.isRequired,
      },
      include: { factor: true },
    });

    await tx.assessmentAuditLog.create({
      data: {
        instrumentId: item.version.instrumentId,
        versionId: item.versionId,
        actorUserId: actor.id,
        actorEmail: actor.email,
        action: "ITEM_UPDATED",
        metadata: {
          itemId: res.id,
          itemKey: res.itemKey,
          factorCode: targetFactor.code,
          orderIndex: res.orderIndex,
        },
      },
    });

    return res;
  });

  const rawOpts = (updated.options as unknown as RawOptionWithWeight[]) || [];
  return {
    id: updated.id,
    versionId: updated.versionId,
    factorId: updated.factorId,
    factorCode: updated.factor.code,
    factorName: updated.factor.name,
    itemKey: updated.itemKey,
    orderIndex: updated.orderIndex,
    prompt: updated.prompt,
    contextPrompt: updated.contextPrompt,
    responseType: updated.responseType,
    options: rawOpts.map((o) => ({
      id: o.id,
      label: o.label,
      orderIndex: o.orderIndex,
      value: o.value,
    })),
    isRequired: updated.isRequired,
  };
}

export async function deleteAssessmentItem(
  itemId: string,
  actor: User
): Promise<{ success: boolean; message: string }> {
  const item = await prisma.assessmentItem.findUnique({
    where: { id: itemId },
    include: { version: true },
  });

  if (!item) {
    throw new AssessmentError(
      `Assessment item '${itemId}' not found.`,
      404,
      "ITEM_NOT_FOUND"
    );
  }

  assertVersionIsDraft(item.version.status, item.version.versionNumber);

  await prisma.$transaction(async (tx) => {
    await tx.assessmentItem.delete({
      where: { id: itemId },
    });

    await tx.assessmentAuditLog.create({
      data: {
        instrumentId: item.version.instrumentId,
        versionId: item.versionId,
        actorUserId: actor.id,
        actorEmail: actor.email,
        action: "ITEM_DELETED",
        metadata: {
          itemId: item.id,
          itemKey: item.itemKey,
        },
      },
    });
  });

  return {
    success: true,
    message: `Question item '${item.itemKey}' was deleted successfully.`,
  };
}

// ---------------------------------------------------------------------------
// 3. Scoring Configuration Editing & Strict Schema Validation
// ---------------------------------------------------------------------------

export async function updateVersionScoringConfig(
  versionId: string,
  rawConfig: unknown,
  actor: User
): Promise<{ success: boolean; scoringConfig: ApprovedScoringConfig; message: string }> {
  const version = await prisma.assessmentVersion.findUnique({
    where: { id: versionId },
    include: {
      factors: { select: { code: true } },
    },
  });

  if (!version) {
    throw new AssessmentError(
      `Assessment version '${versionId}' not found.`,
      404,
      "VERSION_NOT_FOUND"
    );
  }

  assertVersionIsDraft(version.status, version.versionNumber);

  // Validate strict schema conformance
  const parseResult = ApprovedScoringConfigSchema.safeParse(rawConfig);
  if (!parseResult.success) {
    const errorDetails = parseResult.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    throw new AssessmentError(
      "Scoring configuration failed validation against ApprovedScoringConfigSchema.",
      400,
      "SCORING_CONFIG_INVALID",
      errorDetails
    );
  }

  const validConfig = parseResult.data;

  // Consistency Validation: ensure guidance templates reference defined factors
  const definedCodes = new Set(version.factors.map((f) => f.code));
  if (validConfig.guidanceTemplates) {
    for (const factorCode of Object.keys(validConfig.guidanceTemplates)) {
      if (!definedCodes.has(factorCode)) {
        throw new AssessmentError(
          `Guidance template references factor code '${factorCode}' which is not defined in this version. Defined factors: [${Array.from(definedCodes).join(", ")}]`,
          400,
          "SCORING_CONFIG_INCONSISTENT"
        );
      }
    }
  }
  for (const factorCode of validConfig.reverseScoredFactors) {
    if (!definedCodes.has(factorCode)) {
      throw new AssessmentError(
        `reverseScoredFactors references factor code '${factorCode}' which is not defined in this version. Defined factors: [${Array.from(definedCodes).join(", ")}]`,
        400,
        "SCORING_CONFIG_INCONSISTENT"
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.assessmentVersion.update({
      where: { id: versionId },
      data: {
        scoringConfig: validConfig as unknown as object,
      },
    });

    await tx.assessmentAuditLog.create({
      data: {
        instrumentId: version.instrumentId,
        versionId: version.id,
        actorUserId: actor.id,
        actorEmail: actor.email,
        action: "SCORING_CONFIG_UPDATED",
        metadata: {
          formula: validConfig.formula,
          bandsCount: validConfig.bands.length,
          strengthsThresholdPct: validConfig.strengthsThresholdPct,
          growthThresholdPct: validConfig.growthThresholdPct,
        },
      },
    });
  });

  return {
    success: true,
    scoringConfig: validConfig,
    message: "Approved scoring configuration validated and saved successfully.",
  };
}

// ---------------------------------------------------------------------------
// 4. Published Course Recommendation Mappings
// ---------------------------------------------------------------------------

export async function createCourseMapping(
  versionId: string,
  input: CreateCourseMappingBody,
  actor: User
): Promise<AdminAssessmentCourseMappingDto> {
  const version = await prisma.assessmentVersion.findUnique({
    where: { id: versionId },
  });

  if (!version) {
    throw new AssessmentError(
      `Assessment version '${versionId}' not found.`,
      404,
      "VERSION_NOT_FOUND"
    );
  }

  assertVersionIsDraft(version.status, version.versionNumber);

  // Validate factor belongs to this version
  const factor = await prisma.assessmentFactorDefinition.findUnique({
    where: { id: input.factorId },
  });

  if (!factor) {
    throw new AssessmentError(
      `Referenced factor '${input.factorId}' does not exist.`,
      400,
      "FACTOR_NOT_FOUND"
    );
  }

  if (factor.versionId !== versionId) {
    throw new AssessmentError(
      `Cross-version violation: Factor '${factor.code}' does not belong to version ${versionId}.`,
      400,
      "CROSS_VERSION_REFERENCE"
    );
  }

  // Validate course exists and verify PUBLISHED status
  const course = await prisma.course.findUnique({
    where: { id: input.courseId },
  });

  if (!course) {
    throw new AssessmentError(
      `Referenced course '${input.courseId}' does not exist.`,
      404,
      "COURSE_NOT_FOUND"
    );
  }

  if (course.status !== CourseStatus.PUBLISHED) {
    throw new AssessmentError(
      `Cannot map unpublished course '${course.title}' (current status: ${course.status}). Only courses in PUBLISHED status may be recommended to assessment participants.`,
      400,
      "COURSE_NOT_PUBLISHED"
    );
  }

  // Check unique mapping constraint
  const existingMapping = await prisma.assessmentCourseMapping.findUnique({
    where: {
      versionId_factorId_courseId: {
        versionId,
        factorId: input.factorId,
        courseId: input.courseId,
      },
    },
  });

  if (existingMapping) {
    throw new AssessmentError(
      `Course '${course.title}' is already mapped to factor '${factor.name}'.`,
      400,
      "MAPPING_ALREADY_EXISTS"
    );
  }

  const mapping = await prisma.$transaction(async (tx) => {
    const created = await tx.assessmentCourseMapping.create({
      data: {
        versionId,
        factorId: input.factorId,
        courseId: input.courseId,
        triggerCondition: input.triggerCondition || "GROWTH_OPPORTUNITY",
        displayOrder: input.displayOrder || 1,
        customGuidance: input.customGuidance || null,
      },
      include: {
        factor: true,
        course: true,
      },
    });

    await tx.assessmentAuditLog.create({
      data: {
        instrumentId: version.instrumentId,
        versionId: version.id,
        actorUserId: actor.id,
        actorEmail: actor.email,
        action: "COURSE_MAPPING_CREATED",
        metadata: {
          mappingId: created.id,
          factorCode: created.factor.code,
          courseId: created.courseId,
          courseTitle: created.course.title,
        },
      },
    });

    return created;
  });

  return {
    id: mapping.id,
    versionId: mapping.versionId,
    factorId: mapping.factorId,
    factorCode: mapping.factor.code,
    factorName: mapping.factor.name,
    courseId: mapping.courseId,
    courseSlug: mapping.course.slug,
    courseTitle: mapping.course.title,
    courseStatus: mapping.course.status,
    triggerCondition: mapping.triggerCondition,
    displayOrder: mapping.displayOrder,
    customGuidance: mapping.customGuidance,
  };
}

export async function deleteCourseMapping(
  mappingId: string,
  actor: User
): Promise<{ success: boolean; message: string }> {
  const mapping = await prisma.assessmentCourseMapping.findUnique({
    where: { id: mappingId },
    include: {
      version: true,
      factor: true,
      course: true,
    },
  });

  if (!mapping) {
    throw new AssessmentError(
      `Course mapping '${mappingId}' not found.`,
      404,
      "MAPPING_NOT_FOUND"
    );
  }

  assertVersionIsDraft(mapping.version.status, mapping.version.versionNumber);

  await prisma.$transaction(async (tx) => {
    await tx.assessmentCourseMapping.delete({
      where: { id: mappingId },
    });

    await tx.assessmentAuditLog.create({
      data: {
        instrumentId: mapping.version.instrumentId,
        versionId: mapping.versionId,
        actorUserId: actor.id,
        actorEmail: actor.email,
        action: "COURSE_MAPPING_DELETED",
        metadata: {
          mappingId: mapping.id,
          factorCode: mapping.factor.code,
          courseTitle: mapping.course.title,
        },
      },
    });
  });

  return {
    success: true,
    message: `Mapping for course '${mapping.course.title}' removed successfully.`,
  };
}

// ---------------------------------------------------------------------------
// 5. Activation Readiness Validation Service (Read-Only)
// ---------------------------------------------------------------------------

export async function checkActivationReadiness(
  versionId: string
): Promise<AssessmentActivationReadinessReport> {
  const version = await prisma.assessmentVersion.findUnique({
    where: { id: versionId },
    include: {
      instrument: true,
      factors: {
        include: {
          items: true,
        },
      },
      items: true,
      courseMappings: {
        include: { course: true, factor: true },
      },
    },
  });

  if (!version) {
    throw new AssessmentError(
      `Assessment version '${versionId}' not found.`,
      404,
      "VERSION_NOT_FOUND"
    );
  }

  const checks: AssessmentValidationCheck[] = [];
  const missingRequirements: string[] = [];

  // Check 1: Factors exist
  const hasFactors = version.factors.length > 0;
  checks.push({
    id: "FACTORS_EXIST",
    category: "FACTORS",
    title: "Factor Definitions Registered",
    passed: hasFactors,
    message: hasFactors
      ? `${version.factors.length} factor definition(s) registered.`
      : "No factor definitions registered. At least one factor is required.",
    details: { count: version.factors.length },
  });
  if (!hasFactors) {
    missingRequirements.push("Register at least one factor definition.");
  }

  // Check 2: Factor coverage (every factor has at least 1 question)
  const uncoveredFactors = version.factors.filter((f) => f.items.length === 0);
  const factorCoveragePassed = hasFactors && uncoveredFactors.length === 0;
  checks.push({
    id: "FACTOR_COVERAGE",
    category: "ITEMS",
    title: "Factor Question Coverage",
    passed: factorCoveragePassed,
    message: factorCoveragePassed
      ? "All factor definitions have associated question items."
      : uncoveredFactors.length > 0
      ? `Factor(s) without questions: [${uncoveredFactors.map((f) => f.code).join(", ")}]. Every factor requires at least one question.`
      : "No factors or items defined.",
    details: { uncoveredFactorCodes: uncoveredFactors.map((f) => f.code) },
  });
  if (!factorCoveragePassed) {
    missingRequirements.push("Add at least one question item to each factor definition.");
  }

  // Check 3: Items structure & options integrity
  let itemsIntegrityPassed = version.items.length > 0;
  const itemIssues: string[] = [];
  for (const item of version.items) {
    const rawOpts = (item.options as unknown as RawOptionWithWeight[]) || [];
    if (rawOpts.length < 2) {
      itemsIntegrityPassed = false;
      itemIssues.push(`Item '${item.itemKey}' has fewer than 2 response options.`);
    }
    for (const opt of rawOpts) {
      if (typeof opt.value !== "number" || isNaN(opt.value)) {
        itemsIntegrityPassed = false;
        itemIssues.push(`Item '${item.itemKey}' option '${opt.id}' lacks a valid numeric score weight.`);
      }
    }
  }

  checks.push({
    id: "ITEMS_OPTIONS_VALIDITY",
    category: "ITEMS",
    title: "Question Options & Score Weights",
    passed: itemsIntegrityPassed,
    message: itemsIntegrityPassed
      ? `All ${version.items.length} question(s) meet structural option and weighting requirements.`
      : itemIssues.join(" ") || "No question items defined.",
    details: { issues: itemIssues },
  });
  if (!itemsIntegrityPassed) {
    missingRequirements.push("Ensure all questions have ≥2 options with valid numeric weights.");
  }

  // Check 4: Scoring Configuration Schema Conformance
  let scoringConfigPassed = false;
  let scoringMessage = "";
  if (version.scoringConfig) {
    const parsed = ApprovedScoringConfigSchema.safeParse(version.scoringConfig);
    if (parsed.success) {
      scoringConfigPassed = true;
      scoringMessage = `Valid approved scoring configuration defined (${parsed.data.bands.length} score bands, formula: ${parsed.data.formula}).`;
    } else {
      scoringMessage = "Scoring configuration failed ApprovedScoringConfigSchema validation.";
    }
  } else {
    scoringMessage = "No scoring configuration has been uploaded. An approved configuration is required.";
  }

  checks.push({
    id: "SCORING_CONFIG_SCHEMA",
    category: "SCORING",
    title: "Approved Scoring Configuration",
    passed: scoringConfigPassed,
    message: scoringMessage,
  });
  if (!scoringConfigPassed) {
    missingRequirements.push("Upload and validate an approved scoring configuration.");
  }

  // Check 5: Scoring Guidance Consistency
  let guidanceConsistent = true;
  let guidanceMessage = "Guidance templates consistent with defined factors.";
  if (scoringConfigPassed && version.scoringConfig) {
    const config = version.scoringConfig as unknown as ApprovedScoringConfig;
    if (config.guidanceTemplates) {
      const definedCodes = new Set(version.factors.map((f) => f.code));
      const missingInFactors = Object.keys(config.guidanceTemplates).filter(
        (code) => !definedCodes.has(code)
      );
      if (missingInFactors.length > 0) {
        guidanceConsistent = false;
        guidanceMessage = `Guidance templates reference unknown factor(s): [${missingInFactors.join(", ")}].`;
      }
    }
    const definedForReverse = new Set(version.factors.map((f) => f.code));
    const unknownReverse = (config.reverseScoredFactors || []).filter((code) => !definedForReverse.has(code));
    if (unknownReverse.length > 0) {
      guidanceConsistent = false;
      guidanceMessage = `reverseScoredFactors reference unknown factor(s): [${unknownReverse.join(", ")}].`;
    }
  }

  checks.push({
    id: "SCORING_GUIDANCE_CONSISTENT",
    category: "SCORING",
    title: "Guidance & Factor Consistency",
    passed: guidanceConsistent,
    message: guidanceMessage,
  });
  if (!guidanceConsistent) {
    missingRequirements.push("Align guidance templates in scoring config with defined factor codes.");
  }

  // Check 6: Course Mappings Publish Status
  let courseMappingsPassed = true;
  const unpublishedCourses: string[] = [];
  for (const mapping of version.courseMappings) {
    if (mapping.course.status !== CourseStatus.PUBLISHED) {
      courseMappingsPassed = false;
      unpublishedCourses.push(`'${mapping.course.title}' (${mapping.course.status})`);
    }
  }

  checks.push({
    id: "COURSE_MAPPINGS_PUBLISHED",
    category: "COURSES",
    title: "Course Recommendation Status",
    passed: courseMappingsPassed,
    message: courseMappingsPassed
      ? version.courseMappings.length > 0
        ? `All ${version.courseMappings.length} mapped course(s) are in PUBLISHED status.`
        : "No course mappings configured (optional)."
      : `Unpublished courses mapped: [${unpublishedCourses.join(", ")}]. Only PUBLISHED courses are permitted.`,
    details: { totalMappings: version.courseMappings.length, unpublished: unpublishedCourses },
  });
  if (!courseMappingsPassed) {
    missingRequirements.push("Remove or publish courses that are currently in draft/archived status.");
  }

  // Check 7: Clinical / Professional Approval Recorded
  const isApproved = Boolean(version.approvedBy && version.approvedAt);
  checks.push({
    id: "PROFESSIONAL_APPROVAL",
    category: "APPROVAL",
    title: "Clinical & Professional Governance Approval",
    passed: isApproved,
    message: isApproved
      ? `Formally approved by ${version.approvedBy} on ${new Date(version.approvedAt!).toLocaleDateString("en-US")}.`
      : "Clinical approval has not yet been recorded by Dr. Nivedita Ganguli.",
    details: { approvedBy: version.approvedBy, approvedAt: version.approvedAt },
  });
  if (!isApproved) {
    missingRequirements.push("Record formal clinical approval by Dr. Nivedita Ganguli.");
  }

  const isReadyForActivation =
    hasFactors &&
    factorCoveragePassed &&
    itemsIntegrityPassed &&
    scoringConfigPassed &&
    guidanceConsistent &&
    courseMappingsPassed &&
    isApproved;

  return {
    versionId: version.id,
    versionNumber: version.versionNumber,
    status: version.status as "DRAFT" | "ACTIVE" | "RETIRED",
    isReadyForActivation,
    checks,
    missingRequirements,
  };
}

// ---------------------------------------------------------------------------
// 6. Professional Approval & Activation (Publishing)
// ---------------------------------------------------------------------------

/**
 * Records the professional sign-off for a draft version. The approver's name
 * is typed by the admin so the record shows who reviewed the content.
 */
export async function approveDraftVersion(
  versionId: string,
  approverName: string,
  actor: User
): Promise<{ success: boolean; message: string }> {
  const version = await prisma.assessmentVersion.findUnique({
    where: { id: versionId },
  });

  if (!version) {
    throw new AssessmentError(`Assessment version '${versionId}' not found.`, 404, "VERSION_NOT_FOUND");
  }

  assertVersionIsDraft(version.status, version.versionNumber);

  const name = approverName.trim();
  if (name.length < 2) {
    throw new AssessmentError("Enter the name of the person approving this version.", 400, "APPROVER_REQUIRED");
  }

  const approvedAt = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.assessmentVersion.update({
      where: { id: versionId },
      data: { approvedBy: name, approvedAt },
    });

    await tx.assessmentAuditLog.create({
      data: {
        instrumentId: version.instrumentId,
        versionId: version.id,
        actorUserId: actor.id,
        actorEmail: actor.email,
        action: "VERSION_APPROVED",
        metadata: { approvedBy: name, approvedAt: approvedAt.toISOString() },
      },
    });
  });

  return {
    success: true,
    message: `Version ${version.versionNumber} approved by ${name}.`,
  };
}

/**
 * Publishes a draft version so participants can take it. Every readiness
 * check must pass. Any previously active version of the same instrument is
 * retired in the same transaction, so exactly one version is live.
 */
export async function activateVersion(
  versionId: string,
  actor: User
): Promise<{ success: boolean; message: string }> {
  const report = await checkActivationReadiness(versionId);

  if (report.status !== "DRAFT") {
    throw new AssessmentError(
      `Version ${report.versionNumber} is ${report.status} and cannot be published again.`,
      400,
      "VERSION_NOT_DRAFT"
    );
  }

  if (!report.isReadyForActivation) {
    throw new AssessmentError(
      "This version is not ready to publish yet.",
      400,
      "NOT_READY_FOR_ACTIVATION",
      report.missingRequirements
    );
  }

  const version = await prisma.assessmentVersion.findUniqueOrThrow({
    where: { id: versionId },
  });
  const now = new Date();

  const retired = await prisma.$transaction(async (tx) => {
    const previouslyActive = await tx.assessmentVersion.findMany({
      where: { instrumentId: version.instrumentId, status: AssessmentStatus.ACTIVE },
      select: { id: true, versionNumber: true },
    });

    if (previouslyActive.length > 0) {
      await tx.assessmentVersion.updateMany({
        where: { id: { in: previouslyActive.map((v) => v.id) } },
        data: { status: AssessmentStatus.RETIRED, retiredAt: now },
      });
    }

    await tx.assessmentVersion.update({
      where: { id: versionId },
      data: { status: AssessmentStatus.ACTIVE, publishedAt: now },
    });

    await tx.assessmentInstrument.update({
      where: { id: version.instrumentId },
      data: {
        status: AssessmentStatus.ACTIVE,
        approvedBy: version.approvedBy,
        approvedAt: version.approvedAt,
      },
    });

    await tx.assessmentAuditLog.create({
      data: {
        instrumentId: version.instrumentId,
        versionId: version.id,
        actorUserId: actor.id,
        actorEmail: actor.email,
        action: "VERSION_ACTIVATED",
        metadata: {
          versionNumber: version.versionNumber,
          retiredVersionNumbers: previouslyActive.map((v) => v.versionNumber),
        },
      },
    });

    return previouslyActive;
  });

  return {
    success: true,
    message:
      retired.length > 0
        ? `Version ${version.versionNumber} is now live. Version ${retired.map((v) => v.versionNumber).join(", ")} was retired.`
        : `Version ${version.versionNumber} is now live.`,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function assertVersionIsDraft(status: AssessmentStatus, versionNumber: number) {
  if (status !== AssessmentStatus.DRAFT) {
    throw new AssessmentError(
      `Assessment version ${versionNumber} is ${status} and cannot be modified. Published and retired versions are immutable. Create a new draft version to make changes.`,
      403,
      "VERSION_IMMUTABLE"
    );
  }
}

function validateOptionsIntegrity(options: RawOptionWithWeight[]) {
  if (!Array.isArray(options) || options.length < 2) {
    throw new AssessmentError(
      "Question must contain at least two response options.",
      400,
      "INVALID_OPTIONS_COUNT"
    );
  }

  const seenIds = new Set<string>();
  const seenOrders = new Set<number>();

  for (const opt of options) {
    if (!opt.id || opt.id.trim() === "") {
      throw new AssessmentError(
        "Every response option must have a unique identifier string.",
        400,
        "INVALID_OPTION_ID"
      );
    }
    if (seenIds.has(opt.id)) {
      throw new AssessmentError(
        `Duplicate option ID '${opt.id}' within question.`,
        400,
        "DUPLICATE_OPTION_ID"
      );
    }
    seenIds.add(opt.id);

    if (!opt.label || opt.label.trim() === "") {
      throw new AssessmentError(
        `Option '${opt.id}' lacks a display label.`,
        400,
        "INVALID_OPTION_LABEL"
      );
    }

    if (typeof opt.value !== "number" || isNaN(opt.value)) {
      throw new AssessmentError(
        `Option '${opt.id}' must have a numeric score weight value.`,
        400,
        "INVALID_OPTION_VALUE"
      );
    }

    if (seenOrders.has(opt.orderIndex)) {
      throw new AssessmentError(
        `Duplicate option order index ${opt.orderIndex} within question.`,
        400,
        "DUPLICATE_OPTION_ORDER"
      );
    }
    seenOrders.add(opt.orderIndex);
  }
}
