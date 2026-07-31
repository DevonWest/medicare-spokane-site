import {
  KNOWLEDGE_CMS_ROUTE_PARITY_VERSION,
  getKnowledgeCmsRouteParity,
  knowledgeCmsRouteParityManifest,
  type KnowledgeCmsRouteParityManifestEntry,
  type KnowledgeCmsRoutePreservationRequirement,
  type KnowledgeCmsRouteSchemaType,
} from "./knowledgeCmsRouteParity";

export const KNOWLEDGE_CMS_RENDERER_CONTRACT_VERSION = 4 as const;
export const KNOWLEDGE_CMS_RENDERER_CONTRACT_STATE =
  "cms_native_guarded_public_cutover_implemented" as const;
export const KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE_ENV =
  "KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE" as const;
export const KNOWLEDGE_CMS_PUBLIC_RENDERER_DEFAULT_MODE =
  "static" as const;
export const KNOWLEDGE_CMS_PUBLIC_RENDERER_ACTIVATION_ALLOWED =
  false as const;
export const KNOWLEDGE_CMS_PRIVATE_SHADOW_ACTIVATION_ALLOWED =
  true as const;

export type KnowledgeCmsPublicRendererMode =
  | "static"
  | "shadow"
  | "cutover";

export type KnowledgeCmsRendererEvidenceKind =
  | "candidate_record_published"
  | "canonical_url_match"
  | "faq_disclosure_count_match"
  | "form_count_match"
  | "h1_match"
  | "metadata_match"
  | "preservation_requirements_satisfied"
  | "protected_routes_unchanged"
  | "rendered_body_sha256_match"
  | "rendered_byte_count_match"
  | "rollback_static_snapshot_verified"
  | "schema_types_match"
  | "shadow_comparison_verified";

export type KnowledgeCmsRendererBlockerCode =
  | "cms_native_artifact_not_verified"
  | "candidate_snapshot_missing"
  | "guarded_approval_missing"
  | "migration_not_executed"
  | "protected_route_verification_missing"
  | "runtime_route_revalidation_missing"
  | "shadow_comparison_missing";

export type KnowledgeCmsRendererRollbackTrigger =
  | "candidate_record_unavailable"
  | "candidate_render_error"
  | "canonical_mismatch"
  | "capability_mismatch"
  | "metadata_mismatch"
  | "parity_mismatch"
  | "protected_route_drift";

export interface KnowledgeCmsRendererCapabilityContract {
  requirement: KnowledgeCmsRoutePreservationRequirement;
  requiredAdapter: string;
  sourceFiles: readonly string[];
  evidence: readonly KnowledgeCmsRendererEvidenceKind[];
  implementationStatus: "implemented_cms_native_private_shadow";
}

export interface KnowledgeCmsRendererContractEntry {
  version: typeof KNOWLEDGE_CMS_RENDERER_CONTRACT_VERSION;
  state: typeof KNOWLEDGE_CMS_RENDERER_CONTRACT_STATE;
  entryId: string;
  path: string;
  record: {
    kind: "article";
    id: string;
    bodyFormat: "markdown";
    statusRequired: "published";
  };
  legacy: {
    source: "static_route";
    sourceFile: string;
    parityVersion: typeof KNOWLEDGE_CMS_ROUTE_PARITY_VERSION;
    canonicalUrl: string;
    renderedSha256: string;
  };
  candidate: {
    source: "knowledge_cms";
    implementationStatus: "cms_native_private_shadow";
    bodySource: "cms_native_lossless_artifact";
    cmsBodyPubliclyRendered: false;
    capabilities: readonly KnowledgeCmsRendererCapabilityContract[];
    requiredEvidence: readonly KnowledgeCmsRendererEvidenceKind[];
  };
  rollout: {
    shadowEligible: true;
    cutoverImplementationAvailable: true;
    cutoverEligible: false;
    blockers: readonly KnowledgeCmsRendererBlockerCode[];
  };
  rollback: {
    status: "contract_defined";
    mode: "static";
    source: "static_route";
    sourceFile: string;
    canonicalUrl: string;
    renderedSha256: string;
    preservesCmsRecords: true;
    dataMutation: "none";
  };
}

export interface KnowledgeCmsRendererArtifact {
  entryId: string;
  path: string;
  record: {
    kind: "article";
    id: string;
    revision: number;
    status: "published";
  };
  rendering: {
    mode: "private_shadow";
    bodySource: "cms_native_lossless_artifact";
    cmsBodyPubliclyRendered: false;
  };
  metadata: {
    pageTitle: string;
    description: string;
    canonicalUrl: string;
    openGraphTitle: string;
    openGraphDescription: string;
    openGraphUrl: string;
  };
  renderedBody: {
    sha256: string;
    bytes: number;
    h1: string;
    h1Count: number;
    schemaTypes: readonly KnowledgeCmsRouteSchemaType[];
    formCount: number;
    faqDisclosureCount: number;
  };
  satisfiedRequirements: readonly KnowledgeCmsRoutePreservationRequirement[];
}

export interface KnowledgeCmsRendererModeResolution {
  configuredValue: string | undefined;
  requestedMode: KnowledgeCmsPublicRendererMode | "invalid";
  effectiveMode: "static";
  configurationValid: boolean;
  activationAllowed: false;
  privateShadowEnabled: boolean;
  reason:
    | "cutover_requires_runtime_approval"
    | "default_static"
    | "explicit_static"
    | "invalid_value"
    | "private_shadow";
}

const requiredEvidence: readonly KnowledgeCmsRendererEvidenceKind[] =
  Object.freeze([
    "candidate_record_published",
    "canonical_url_match",
    "faq_disclosure_count_match",
    "form_count_match",
    "h1_match",
    "metadata_match",
    "preservation_requirements_satisfied",
    "protected_routes_unchanged",
    "rendered_body_sha256_match",
    "rendered_byte_count_match",
    "rollback_static_snapshot_verified",
    "schema_types_match",
    "shadow_comparison_verified",
  ]);

const rolloutBlockers: readonly KnowledgeCmsRendererBlockerCode[] =
  Object.freeze([
    "cms_native_artifact_not_verified",
    "candidate_snapshot_missing",
    "guarded_approval_missing",
    "migration_not_executed",
    "protected_route_verification_missing",
    "runtime_route_revalidation_missing",
    "shadow_comparison_missing",
  ]);

const capabilityContracts: Readonly<
  Record<
    KnowledgeCmsRoutePreservationRequirement,
    Omit<KnowledgeCmsRendererCapabilityContract, "requirement">
  >
> = Object.freeze({
  faq_disclosures: Object.freeze({
    requiredAdapter: "governed_faq_disclosure_renderer",
    sourceFiles: Object.freeze(["components/FAQ.tsx"]),
    evidence: Object.freeze(
      [
        "faq_disclosure_count_match",
        "rendered_body_sha256_match",
      ] satisfies KnowledgeCmsRendererEvidenceKind[],
    ),
    implementationStatus: "implemented_cms_native_private_shadow",
  }),
  governed_faq_registry: Object.freeze({
    requiredAdapter: "governed_faq_registry_resolver",
    sourceFiles: Object.freeze([
      "lib/knowledgeRecords.ts",
      "lib/knowledgeCenter.ts",
    ]),
    evidence: Object.freeze(
      [
        "preservation_requirements_satisfied",
        "rendered_body_sha256_match",
        "schema_types_match",
      ] satisfies KnowledgeCmsRendererEvidenceKind[],
    ),
    implementationStatus: "implemented_cms_native_private_shadow",
  }),
  lead_form: Object.freeze({
    requiredAdapter: "lead_form_component_adapter",
    sourceFiles: Object.freeze([
      "components/LeadForm.tsx",
      "lib/leadSources.ts",
    ]),
    evidence: Object.freeze(
      [
        "form_count_match",
        "rendered_body_sha256_match",
      ] satisfies KnowledgeCmsRendererEvidenceKind[],
    ),
    implementationStatus: "implemented_cms_native_private_shadow",
  }),
  react_component_tree: Object.freeze({
    requiredAdapter: "cms_lossless_html_to_react_renderer",
    sourceFiles: Object.freeze([
      "lib/knowledgeCmsNativeRepresentationRenderer.tsx",
    ]),
    evidence: Object.freeze(
      [
        "h1_match",
        "rendered_body_sha256_match",
        "rendered_byte_count_match",
      ] satisfies KnowledgeCmsRendererEvidenceKind[],
    ),
    implementationStatus: "implemented_cms_native_private_shadow",
  }),
  related_content: Object.freeze({
    requiredAdapter: "governed_related_content_renderer",
    sourceFiles: Object.freeze([
      "components/RelatedKnowledge.tsx",
      "lib/knowledgeCenter.ts",
    ]),
    evidence: Object.freeze(
      [
        "preservation_requirements_satisfied",
        "rendered_body_sha256_match",
      ] satisfies KnowledgeCmsRendererEvidenceKind[],
    ),
    implementationStatus: "implemented_cms_native_private_shadow",
  }),
  represented_carrier_registry: Object.freeze({
    requiredAdapter: "represented_carrier_registry_resolver",
    sourceFiles: Object.freeze(["lib/carriers.ts"]),
    evidence: Object.freeze(
      [
        "preservation_requirements_satisfied",
        "rendered_body_sha256_match",
      ] satisfies KnowledgeCmsRendererEvidenceKind[],
    ),
    implementationStatus: "implemented_cms_native_private_shadow",
  }),
  structured_data: Object.freeze({
    requiredAdapter: "governed_structured_data_renderer",
    sourceFiles: Object.freeze([
      "components/KnowledgePageSchema.tsx",
      "components/FAQ.tsx",
    ]),
    evidence: Object.freeze(
      [
        "schema_types_match",
        "rendered_body_sha256_match",
      ] satisfies KnowledgeCmsRendererEvidenceKind[],
    ),
    implementationStatus: "implemented_cms_native_private_shadow",
  }),
});

function migrationArticleId(entryId: string): string {
  return `resource-entry--${entryId}`;
}

function freezeCapability(
  requirement: KnowledgeCmsRoutePreservationRequirement,
  routeSourceFile: string,
): KnowledgeCmsRendererCapabilityContract {
  const capability = capabilityContracts[requirement];
  return Object.freeze({
    requirement,
    requiredAdapter: capability.requiredAdapter,
    sourceFiles: Object.freeze([
      ...new Set([...capability.sourceFiles, routeSourceFile]),
    ]),
    evidence: capability.evidence,
    implementationStatus: capability.implementationStatus,
  });
}

function freezeRendererContract(
  parity: KnowledgeCmsRouteParityManifestEntry,
): KnowledgeCmsRendererContractEntry {
  const capabilities = Object.freeze(
    parity.cmsRepresentation.preservationRequirements.map(
      (requirement) => freezeCapability(requirement, parity.sourceFile),
    ),
  );
  const record = Object.freeze({
    kind: "article" as const,
    id: migrationArticleId(parity.entryId),
    bodyFormat: "markdown" as const,
    statusRequired: "published" as const,
  });
  const legacy = Object.freeze({
    source: "static_route" as const,
    sourceFile: parity.sourceFile,
    parityVersion: KNOWLEDGE_CMS_ROUTE_PARITY_VERSION,
    canonicalUrl: parity.metadata.canonicalUrl,
    renderedSha256: parity.renderedBody.sha256,
  });
  const candidate = Object.freeze({
    source: "knowledge_cms" as const,
    implementationStatus: "cms_native_private_shadow" as const,
    bodySource: "cms_native_lossless_artifact" as const,
    cmsBodyPubliclyRendered: false as const,
    capabilities,
    requiredEvidence,
  });
  const rollout = Object.freeze({
    shadowEligible: true as const,
    cutoverImplementationAvailable: true as const,
    cutoverEligible: false as const,
    blockers: rolloutBlockers,
  });
  const rollback = Object.freeze({
    status: "contract_defined" as const,
    mode: "static" as const,
    source: "static_route" as const,
    sourceFile: parity.sourceFile,
    canonicalUrl: parity.metadata.canonicalUrl,
    renderedSha256: parity.renderedBody.sha256,
    preservesCmsRecords: true as const,
    dataMutation: "none" as const,
  });

  return Object.freeze({
    version: KNOWLEDGE_CMS_RENDERER_CONTRACT_VERSION,
    state: KNOWLEDGE_CMS_RENDERER_CONTRACT_STATE,
    entryId: parity.entryId,
    path: parity.path,
    record,
    legacy,
    candidate,
    rollout,
    rollback,
  });
}

export const knowledgeCmsRendererContracts: ReadonlyArray<KnowledgeCmsRendererContractEntry> =
  Object.freeze(
    knowledgeCmsRouteParityManifest.map(freezeRendererContract),
  );

export const knowledgeCmsRendererRollbackPlan = Object.freeze({
  version: KNOWLEDGE_CMS_RENDERER_CONTRACT_VERSION,
  status: "guarded_public_cutover_available" as const,
  environmentVariable: KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE_ENV,
  rollbackValue: KNOWLEDGE_CMS_PUBLIC_RENDERER_DEFAULT_MODE,
  requiredAction: "serve_verified_static_routes" as const,
  triggers: Object.freeze([
    "candidate_record_unavailable",
    "candidate_render_error",
    "canonical_mismatch",
    "capability_mismatch",
    "metadata_mismatch",
    "parity_mismatch",
    "protected_route_drift",
  ] satisfies KnowledgeCmsRendererRollbackTrigger[]),
  routeCount: knowledgeCmsRendererContracts.length,
  protectedPaths: Object.freeze(["/", "/medicare-spokane"]),
  preservesCmsRecords: true as const,
  dataMutation: "none" as const,
});

export function getKnowledgeCmsRendererContract(
  entryId: string,
): KnowledgeCmsRendererContractEntry | undefined {
  return knowledgeCmsRendererContracts.find(
    (entry) => entry.entryId === entryId,
  );
}

export function resolveKnowledgeCmsPublicRendererMode(
  value?: string,
): KnowledgeCmsRendererModeResolution {
  if (value === undefined) {
    return {
      configuredValue: undefined,
      requestedMode: "static",
      effectiveMode: "static",
      configurationValid: true,
      activationAllowed: false,
      privateShadowEnabled: false,
      reason: "default_static",
    };
  }
  if (value === "static") {
    return {
      configuredValue: value,
      requestedMode: "static",
      effectiveMode: "static",
      configurationValid: true,
      activationAllowed: false,
      privateShadowEnabled: false,
      reason: "explicit_static",
    };
  }
  if (value === "shadow") {
    return {
      configuredValue: value,
      requestedMode: value,
      effectiveMode: "static",
      configurationValid: true,
      activationAllowed: false,
      privateShadowEnabled: true,
      reason: "private_shadow",
    };
  }
  if (value === "cutover") {
    return {
      configuredValue: value,
      requestedMode: value,
      effectiveMode: "static",
      configurationValid: true,
      activationAllowed: false,
      privateShadowEnabled: false,
      reason: "cutover_requires_runtime_approval",
    };
  }
  return {
    configuredValue: value,
    requestedMode: "invalid",
    effectiveMode: "static",
    configurationValid: false,
    activationAllowed: false,
    privateShadowEnabled: false,
    reason: "invalid_value",
  };
}

function arraysEqual<T>(
  left: readonly T[],
  right: readonly T[],
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

export function verifyKnowledgeCmsRendererArtifact(
  contract: KnowledgeCmsRendererContractEntry,
  artifact: KnowledgeCmsRendererArtifact,
): string[] {
  const errors: string[] = [];
  const parity = getKnowledgeCmsRouteParity(contract.entryId);
  if (!parity) {
    return [
      `Renderer contract "${contract.entryId}" has no route parity manifest entry.`,
    ];
  }

  if (artifact.entryId !== contract.entryId) {
    errors.push("Candidate entry ID does not match the renderer contract.");
  }
  if (artifact.path !== contract.path) {
    errors.push("Candidate path does not match the renderer contract.");
  }
  if (
    artifact.record.kind !== contract.record.kind ||
    artifact.record.id !== contract.record.id ||
    artifact.record.status !== contract.record.statusRequired ||
    !Number.isInteger(artifact.record.revision) ||
    artifact.record.revision < 1
  ) {
    errors.push(
      "Candidate record must be the matching published article at a positive revision.",
    );
  }
  if (
    artifact.rendering.mode !== "private_shadow" ||
    artifact.rendering.bodySource !== contract.candidate.bodySource ||
    artifact.rendering.cmsBodyPubliclyRendered ||
    contract.candidate.cmsBodyPubliclyRendered
  ) {
    errors.push(
      "Candidate rendering must remain private and use the CMS-native lossless artifact.",
    );
  }
  if (
    artifact.metadata.pageTitle !== parity.metadata.pageTitle ||
    artifact.metadata.description !== parity.metadata.description ||
    artifact.metadata.openGraphTitle !==
      parity.metadata.openGraphTitle ||
    artifact.metadata.openGraphDescription !==
      parity.metadata.openGraphDescription
  ) {
    errors.push("Candidate page metadata does not match the verified route.");
  }
  if (
    artifact.metadata.canonicalUrl !== parity.metadata.canonicalUrl ||
    artifact.metadata.openGraphUrl !== parity.metadata.openGraphUrl
  ) {
    errors.push(
      "Candidate canonical or Open Graph URL does not match the verified route.",
    );
  }
  if (
    artifact.renderedBody.sha256 !== parity.renderedBody.sha256 ||
    artifact.renderedBody.bytes !== parity.renderedBody.bytes
  ) {
    errors.push(
      "Candidate rendered body does not match the verified SHA-256 and byte count.",
    );
  }
  if (
    artifact.renderedBody.h1 !== parity.renderedBody.h1 ||
    artifact.renderedBody.h1Count !== parity.renderedBody.h1Count
  ) {
    errors.push("Candidate H1 does not match the verified route.");
  }
  if (
    !arraysEqual(
      artifact.renderedBody.schemaTypes,
      parity.renderedBody.schemaTypes,
    )
  ) {
    errors.push(
      "Candidate structured-data types do not match the verified route.",
    );
  }
  if (artifact.renderedBody.formCount !== parity.renderedBody.formCount) {
    errors.push("Candidate lead-form count does not match the verified route.");
  }
  if (
    artifact.renderedBody.faqDisclosureCount !==
    parity.renderedBody.faqDisclosureCount
  ) {
    errors.push(
      "Candidate FAQ disclosure count does not match the verified route.",
    );
  }
  const satisfied = new Set(artifact.satisfiedRequirements);
  for (const requirement of
    parity.cmsRepresentation.preservationRequirements) {
    if (!satisfied.has(requirement)) {
      errors.push(
        `Candidate renderer did not satisfy "${requirement}".`,
      );
    }
  }

  return errors;
}

export function validateKnowledgeCmsRendererContracts(): string[] {
  const errors: string[] = [];
  const parityById = new Map(
    knowledgeCmsRouteParityManifest.map((entry) => [entry.entryId, entry]),
  );
  const seenIds = new Set<string>();
  const seenPaths = new Set<string>();

  if (
    knowledgeCmsRendererContracts.length !==
    knowledgeCmsRouteParityManifest.length
  ) {
    errors.push(
      "Renderer contract count must match the route parity manifest count.",
    );
  }

  for (const contract of knowledgeCmsRendererContracts) {
    const parity = parityById.get(contract.entryId);
    if (!parity) {
      errors.push(
        `Renderer contract "${contract.entryId}" has no parity entry.`,
      );
      continue;
    }
    if (seenIds.has(contract.entryId)) {
      errors.push(`Renderer contract "${contract.entryId}" is duplicated.`);
    }
    if (seenPaths.has(contract.path)) {
      errors.push(`Renderer contract path "${contract.path}" is duplicated.`);
    }
    seenIds.add(contract.entryId);
    seenPaths.add(contract.path);

    if (
      contract.path !== parity.path ||
      contract.legacy.sourceFile !== parity.sourceFile ||
      contract.legacy.canonicalUrl !== parity.metadata.canonicalUrl ||
      contract.legacy.renderedSha256 !== parity.renderedBody.sha256 ||
      contract.rollback.sourceFile !== parity.sourceFile ||
      contract.rollback.canonicalUrl !== parity.metadata.canonicalUrl ||
      contract.rollback.renderedSha256 !== parity.renderedBody.sha256
    ) {
      errors.push(
        `Renderer contract "${contract.entryId}" does not preserve its verified static fallback.`,
      );
    }
    if (
      contract.record.id !== migrationArticleId(contract.entryId) ||
      contract.candidate.implementationStatus !==
        "cms_native_private_shadow" ||
      contract.candidate.bodySource !==
        "cms_native_lossless_artifact" ||
      contract.candidate.cmsBodyPubliclyRendered ||
      !contract.rollout.shadowEligible ||
      !contract.rollout.cutoverImplementationAvailable ||
      contract.rollout.cutoverEligible ||
      !contract.rollout.blockers.includes(
        "cms_native_artifact_not_verified",
      ) ||
      !contract.rollout.blockers.includes(
        "guarded_approval_missing",
      ) ||
      !contract.rollout.blockers.includes(
        "runtime_route_revalidation_missing",
      ) ||
      contract.rollback.mode !== "static" ||
      contract.rollback.dataMutation !== "none"
    ) {
      errors.push(
        `Renderer contract "${contract.entryId}" must allow private shadow comparison while keeping public activation blocked with a no-write static rollback.`,
      );
    }
    const contractRequirements = contract.candidate.capabilities.map(
      (capability) => capability.requirement,
    );
    if (
      !arraysEqual(
        contractRequirements,
        parity.cmsRepresentation.preservationRequirements,
      )
    ) {
      errors.push(
        `Renderer contract "${contract.entryId}" does not cover every preservation requirement.`,
      );
    }
    for (const capability of contract.candidate.capabilities) {
      if (
        capability.implementationStatus !==
          "implemented_cms_native_private_shadow" ||
        !capability.requiredAdapter ||
        capability.evidence.length === 0
      ) {
        errors.push(
          `Renderer contract "${contract.entryId}" has an invalid "${capability.requirement}" capability.`,
        );
      }
    }
  }

  for (const parity of knowledgeCmsRouteParityManifest) {
    if (!seenIds.has(parity.entryId)) {
      errors.push(
        `Route parity entry "${parity.entryId}" has no renderer contract.`,
      );
    }
  }
  for (const protectedPath of knowledgeCmsRendererRollbackPlan.protectedPaths) {
    if (seenPaths.has(protectedPath)) {
      errors.push(
        `Protected ranking path "${protectedPath}" must not have a CMS renderer contract.`,
      );
    }
  }
  if (
    knowledgeCmsRendererRollbackPlan.routeCount !==
      knowledgeCmsRendererContracts.length ||
    knowledgeCmsRendererRollbackPlan.rollbackValue !== "static" ||
    knowledgeCmsRendererRollbackPlan.dataMutation !== "none"
  ) {
    errors.push(
      "Global renderer rollback must cover every contract and preserve CMS data.",
    );
  }

  return errors;
}
