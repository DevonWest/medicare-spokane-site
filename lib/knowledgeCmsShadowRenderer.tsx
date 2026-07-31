import "server-only";

import { createHash } from "node:crypto";
import {
  knowledgeEntries,
  knowledgeSources,
  type KnowledgeEntry,
} from "./knowledgeCenter";
import {
  validateKnowledgeCmsPublishReadiness,
  type KnowledgeCmsArticle,
} from "./knowledgeCms";
import {
  decodeKnowledgeCmsNativeRepresentationBody,
  getKnowledgeCmsNativeRepresentationArtifactId,
  getKnowledgeCmsNativeRepresentationControl,
  isKnowledgeCmsNativeRepresentationArtifactId,
  parseKnowledgeCmsNativeRepresentationArtifact,
  validateKnowledgeCmsNativeRepresentationArtifact,
  validateKnowledgeCmsNativeRepresentationControls,
  type KnowledgeCmsNativeRepresentationArtifact,
} from "./knowledgeCmsNativeRepresentation";
import {
  getKnowledgeCmsRendererContract,
  knowledgeCmsRendererContracts,
  resolveKnowledgeCmsPublicRendererMode,
  verifyKnowledgeCmsRendererArtifact,
  type KnowledgeCmsRendererArtifact,
  type KnowledgeCmsRendererContractEntry,
  type KnowledgeCmsRendererModeResolution,
} from "./knowledgeCmsRendererContract";

export const KNOWLEDGE_CMS_SHADOW_PREVIEW_VERSION = 2 as const;
export const KNOWLEDGE_CMS_SHADOW_WRITE_COUNT = 0 as const;

export type KnowledgeCmsShadowResultStatus =
  | "candidate_missing"
  | "candidate_not_published"
  | "parity_failed"
  | "parity_passed"
  | "record_contract_mismatch"
  | "representation_control_invalid"
  | "representation_invalid"
  | "representation_missing"
  | "representation_stale";

export interface KnowledgeCmsNativeRepresentationDocument {
  id: string;
  data: unknown;
}

export interface KnowledgeCmsShadowResult {
  entryId: string;
  path: string;
  sourceFile: string;
  recordId: string;
  title: string;
  status: KnowledgeCmsShadowResultStatus;
  recordRevision?: number;
  representationId?: string;
  representationArtifact?: KnowledgeCmsNativeRepresentationArtifact;
  artifact?: KnowledgeCmsRendererArtifact;
  errors: string[];
  publicSource: "verified_static_route";
  bodySource: "cms_native_lossless_artifact";
  cmsBodyPubliclyRendered: false;
  cutoverEligible: false;
}

export interface KnowledgeCmsShadowPreview {
  version: typeof KNOWLEDGE_CMS_SHADOW_PREVIEW_VERSION;
  mode: "private_shadow";
  asOf: string;
  writeCount: typeof KNOWLEDGE_CMS_SHADOW_WRITE_COUNT;
  rendererMode: KnowledgeCmsRendererModeResolution;
  publicSource: "verified_static_route";
  bodySource: "cms_native_lossless_artifact";
  cmsBodyPubliclyRendered: false;
  cutoverEligible: false;
  betaParityApproval: {
    status: "blocked" | "verified";
    routeCount: number;
    exactPasses: number;
    unexpectedRepresentationIds: string[];
    fingerprint: string;
    executionAuthority: false;
    publicCutoverAuthority: false;
  };
  summary: {
    total: number;
    controlsReady: number;
    candidatesPresent: number;
    representationsPresent: number;
    unexpectedRepresentations: number;
    compared: number;
    passed: number;
    blocked: number;
  };
  results: KnowledgeCmsShadowResult[];
}

function uniqueErrors(errors: string[]): string[] {
  return [...new Set(errors)];
}

function arraysEqual<T>(left: T[], right: T[]): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) =>
      left < right ? -1 : left > right ? 1 : 0,
    );
  return `{${entries
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
    .join(",")}}`;
}

function expectedArticleRelationships(entry: KnowledgeEntry) {
  return {
    articleIds: (entry.relationships?.entryPaths ?? []).flatMap((path) => {
      const related = knowledgeEntries.find(
        (candidate) => candidate.path === path,
      );
      return related ? [`resource-entry--${related.id}`] : [];
    }),
    topicIds: [
      `resource-category--${entry.categoryId}`,
      ...entry.topicSlugs.map((slug) => `resource-topic--${slug}`),
    ],
    faqIds: (entry.relationships?.faqIds ?? []).map(
      (id) => `resource-faq--${id}`,
    ),
    citySlugs: [...(entry.relationships?.citySlugs ?? [])],
    agentSlugs: [...(entry.relationships?.agentSlugs ?? [])],
    carrierNames: [...(entry.relationships?.carrierNames ?? [])],
    existingPaths: [entry.path],
  };
}

export function isKnowledgeCmsPrivateShadowEnabled(
  value: string | undefined = process.env
    .KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE,
): boolean {
  return resolveKnowledgeCmsPublicRendererMode(value).privateShadowEnabled;
}

export function validateKnowledgeCmsShadowRenderer(): string[] {
  return validateKnowledgeCmsNativeRepresentationControls();
}

export function validateKnowledgeCmsShadowRecord(
  contract: KnowledgeCmsRendererContractEntry,
  record: KnowledgeCmsArticle,
  asOf: Date,
): string[] {
  const errors: string[] = [];
  const entry = knowledgeEntries.find(
    (candidate) => candidate.id === contract.entryId,
  );
  const control = getKnowledgeCmsNativeRepresentationControl(
    contract.entryId,
  );
  if (!entry || !control) {
    return ["The renderer contract has no governed CMS-native mapping."];
  }
  if (
    record.id !== contract.record.id ||
    record.kind !== contract.record.kind ||
    record.bodyFormat !== contract.record.bodyFormat ||
    record.slug !== contract.path.slice(1)
  ) {
    errors.push(
      "The candidate record identity, slug, or editorial body format does not match the renderer contract.",
    );
  }
  if (record.status !== "published") {
    errors.push("The candidate record is not published.");
  }
  if (record.title !== entry.title || record.summary !== entry.summary) {
    errors.push(
      "The candidate title or summary does not match the governed Resource Library entry.",
    );
  }
  if (
    record.discoverability.pageTitle !== control.target.metadata.pageTitle ||
    record.discoverability.description !== control.target.metadata.description
  ) {
    errors.push(
      "The candidate page title or description does not match the CMS-native representation.",
    );
  }
  if (
    record.discoverability.canonicalPath !== contract.path ||
    !record.relationships.existingPaths.includes(contract.path)
  ) {
    errors.push(
      "The candidate canonical path and existing-route relationship must match the renderer contract.",
    );
  }
  const expectedSearchTerms = [
    ...new Set([...entry.tags, ...entry.topicSlugs]),
  ];
  if (!arraysEqual(record.searchTerms, expectedSearchTerms)) {
    errors.push(
      "The candidate search terms do not match the governed Resource Library entry.",
    );
  }
  const expectedRelationships = expectedArticleRelationships(entry);
  for (const key of Object.keys(
    expectedRelationships,
  ) as Array<keyof typeof expectedRelationships>) {
    if (!arraysEqual(record.relationships[key], expectedRelationships[key])) {
      errors.push(
        `The candidate ${key} relationships do not match the governed Resource Library entry.`,
      );
    }
  }
  const expectedSourceIds = entry.sourceIds ?? [];
  if (!arraysEqual(record.sources.map((source) => source.id), expectedSourceIds)) {
    errors.push(
      "The candidate source lineage does not match the governed Resource Library entry.",
    );
  } else {
    for (const source of record.sources) {
      const expected = knowledgeSources.find(
        (candidate) => candidate.id === source.id,
      );
      if (
        !expected ||
        source.kind !== "official" ||
        source.title !== expected.title ||
        source.publisher !== expected.publisher ||
        source.url !== expected.url
      ) {
        errors.push(
          `The candidate source "${source.id}" does not match the governed source registry.`,
        );
      }
    }
  }
  if (
    record.review?.reviewedBy &&
    record.publication?.publishedBy === record.review.reviewedBy
  ) {
    errors.push(
      "The candidate reviewer and publisher must remain different authenticated users.",
    );
  }
  errors.push(...validateKnowledgeCmsPublishReadiness(record, asOf));
  return uniqueErrors(errors);
}

function buildArtifact(
  contract: KnowledgeCmsRendererContractEntry,
  record: KnowledgeCmsArticle,
  representation: KnowledgeCmsNativeRepresentationArtifact,
): KnowledgeCmsRendererArtifact {
  const rendered = decodeKnowledgeCmsNativeRepresentationBody(
    representation.body,
  );
  return {
    entryId: contract.entryId,
    path: representation.path,
    record: {
      kind: "article",
      id: record.id,
      revision: record.audit.revision,
      status: "published",
    },
    rendering: {
      mode: "private_shadow",
      bodySource: "cms_native_lossless_artifact",
      cmsBodyPubliclyRendered: false,
    },
    metadata: { ...representation.metadata },
    renderedBody: {
      sha256: rendered.sha256,
      bytes: rendered.bytes,
      h1: rendered.h1,
      h1Count: rendered.h1Count,
      schemaTypes: [...rendered.schemaTypes],
      formCount: rendered.formCount,
      faqDisclosureCount: rendered.faqDisclosureCount,
    },
    satisfiedRequirements: [
      ...representation.renderer.preservationRequirements,
    ],
  };
}

function baseResult(
  contract: KnowledgeCmsRendererContractEntry,
): Omit<KnowledgeCmsShadowResult, "status" | "errors"> {
  const entry = knowledgeEntries.find(
    (candidate) => candidate.id === contract.entryId,
  );
  return {
    entryId: contract.entryId,
    path: contract.path,
    sourceFile: contract.legacy.sourceFile,
    recordId: contract.record.id,
    title: entry?.title ?? contract.entryId,
    publicSource: "verified_static_route",
    bodySource: "cms_native_lossless_artifact",
    cmsBodyPubliclyRendered: false,
    cutoverEligible: false,
  };
}

export function compareKnowledgeCmsShadowCandidate(
  contract: KnowledgeCmsRendererContractEntry,
  record: KnowledgeCmsArticle | undefined,
  representationDocuments: KnowledgeCmsNativeRepresentationDocument[],
  asOf: Date = new Date(),
): KnowledgeCmsShadowResult {
  const base = baseResult(contract);
  const controlErrors = validateKnowledgeCmsShadowRenderer();
  if (controlErrors.length > 0) {
    return {
      ...base,
      status: "representation_control_invalid",
      errors: controlErrors,
    };
  }
  if (!record) {
    return {
      ...base,
      status: "candidate_missing",
      errors: ["No matching Knowledge CMS article record exists."],
    };
  }
  if (record.status !== "published") {
    return {
      ...base,
      status: "candidate_not_published",
      recordRevision: record.audit.revision,
      errors: ["The matching Knowledge CMS article is not published."],
    };
  }
  const recordErrors = validateKnowledgeCmsShadowRecord(
    contract,
    record,
    asOf,
  );
  if (recordErrors.length > 0) {
    return {
      ...base,
      status: "record_contract_mismatch",
      recordRevision: record.audit.revision,
      errors: recordErrors,
    };
  }

  const control = getKnowledgeCmsNativeRepresentationControl(
    contract.entryId,
  );
  if (!control) {
    return {
      ...base,
      status: "representation_control_invalid",
      recordRevision: record.audit.revision,
      errors: ["No CMS-native representation control exists."],
    };
  }
  const expectedRepresentationId =
    getKnowledgeCmsNativeRepresentationArtifactId(
      contract.entryId,
      record.audit.revision,
    );
  const matches = representationDocuments.filter(
    (document) => document.id === expectedRepresentationId,
  );
  if (matches.length === 0) {
    const historicalArtifactPresent = representationDocuments.some(
      (document) =>
        document.id.startsWith(control.target.idPrefix) &&
        document.id !== expectedRepresentationId,
    );
    return {
      ...base,
      status: historicalArtifactPresent
        ? "representation_stale"
        : "representation_missing",
      recordRevision: record.audit.revision,
      representationId: expectedRepresentationId,
      errors: [
        historicalArtifactPresent
          ? "A historical immutable rendering exists, but the current published article revision has no matching artifact."
          : "No matching immutable CMS-native representation artifact exists.",
      ],
    };
  }
  if (matches.length !== 1) {
    return {
      ...base,
      status: "representation_invalid",
      recordRevision: record.audit.revision,
      representationId: expectedRepresentationId,
      errors: ["The CMS-native representation target is ambiguous."],
    };
  }
  let representation: KnowledgeCmsNativeRepresentationArtifact;
  try {
    representation = parseKnowledgeCmsNativeRepresentationArtifact(
      matches[0].data,
    );
  } catch (error) {
    return {
      ...base,
      status: "representation_invalid",
      recordRevision: record.audit.revision,
      representationId: expectedRepresentationId,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
  if (representation.id !== matches[0].id) {
    return {
      ...base,
      status: "representation_invalid",
      recordRevision: record.audit.revision,
      representationId: expectedRepresentationId,
      errors: [
        "The CMS-native representation document ID does not match its payload.",
      ],
    };
  }
  const representationErrors =
    validateKnowledgeCmsNativeRepresentationArtifact(
      representation,
      record,
    );
  if (representationErrors.length > 0) {
    return {
      ...base,
      status: representationErrors.some((error) => /stale/i.test(error))
        ? "representation_stale"
        : "representation_invalid",
      recordRevision: record.audit.revision,
      representationId: representation.id,
      errors: representationErrors,
    };
  }

  const artifact = buildArtifact(contract, record, representation);
  const parityErrors = verifyKnowledgeCmsRendererArtifact(
    contract,
    artifact,
  );
  if (parityErrors.length > 0) {
    return {
      ...base,
      status: "parity_failed",
      recordRevision: record.audit.revision,
      representationId: representation.id,
      representationArtifact: representation,
      artifact,
      errors: parityErrors,
    };
  }
  return {
    ...base,
    status: "parity_passed",
    recordRevision: record.audit.revision,
    representationId: representation.id,
    representationArtifact: representation,
    artifact,
    errors: [],
  };
}

export function buildKnowledgeCmsShadowPreview(
  records: KnowledgeCmsArticle[],
  representationDocuments: KnowledgeCmsNativeRepresentationDocument[],
  options: {
    asOf?: Date;
    rendererMode?: string;
  } = {},
): KnowledgeCmsShadowPreview {
  const asOf = options.asOf ?? new Date();
  if (Number.isNaN(asOf.getTime())) {
    throw new Error("Private shadow preview requires a valid date.");
  }
  const rendererMode = resolveKnowledgeCmsPublicRendererMode(
    options.rendererMode,
  );
  const recordById = new Map(records.map((record) => [record.id, record]));
  const results = knowledgeCmsRendererContracts.map((contract) =>
    compareKnowledgeCmsShadowCandidate(
      contract,
      recordById.get(contract.record.id),
      representationDocuments,
      asOf,
    ),
  );
  const compared = results.filter((result) =>
    ["parity_failed", "parity_passed"].includes(result.status),
  ).length;
  const passed = results.filter(
    (result) => result.status === "parity_passed",
  ).length;
  const unexpectedRepresentationIds = representationDocuments
    .map((document) => document.id)
    .filter((id) => !isKnowledgeCmsNativeRepresentationArtifactId(id))
    .sort();
  const approvalEvidence = {
    version: KNOWLEDGE_CMS_SHADOW_PREVIEW_VERSION,
    asOf: asOf.toISOString(),
    rendererMode: rendererMode.requestedMode,
    routes: results.map((result) => ({
      entryId: result.entryId,
      status: result.status,
      recordRevision: result.recordRevision ?? null,
      representationFingerprint:
        result.representationArtifact?.fingerprint.value ?? null,
      renderedBodySha256: result.artifact?.renderedBody.sha256 ?? null,
    })),
    unexpectedRepresentationIds,
  };
  const approvalFingerprint = createHash("sha256")
    .update(canonicalJson(approvalEvidence))
    .digest("hex");

  return {
    version: KNOWLEDGE_CMS_SHADOW_PREVIEW_VERSION,
    mode: "private_shadow",
    asOf: asOf.toISOString(),
    writeCount: KNOWLEDGE_CMS_SHADOW_WRITE_COUNT,
    rendererMode,
    publicSource: "verified_static_route",
    bodySource: "cms_native_lossless_artifact",
    cmsBodyPubliclyRendered: false,
    cutoverEligible: false,
    betaParityApproval: {
      status:
        rendererMode.requestedMode === "shadow" &&
        rendererMode.privateShadowEnabled &&
        unexpectedRepresentationIds.length === 0 &&
        passed === knowledgeCmsRendererContracts.length
          ? "verified"
          : "blocked",
      routeCount: knowledgeCmsRendererContracts.length,
      exactPasses: passed,
      unexpectedRepresentationIds,
      fingerprint: approvalFingerprint,
      executionAuthority: false,
      publicCutoverAuthority: false,
    },
    summary: {
      total: results.length,
      controlsReady:
        validateKnowledgeCmsShadowRenderer().length === 0
          ? results.length
          : 0,
      candidatesPresent: results.filter(
        (result) => result.status !== "candidate_missing",
      ).length,
      representationsPresent: results.filter(
        (result) =>
          ![
            "candidate_missing",
            "candidate_not_published",
            "record_contract_mismatch",
            "representation_control_invalid",
            "representation_missing",
          ].includes(result.status),
      ).length,
      unexpectedRepresentations: unexpectedRepresentationIds.length,
      compared,
      passed,
      blocked: results.length - passed,
    },
    results,
  };
}

export function validateKnowledgeCmsShadowPreview(
  preview: KnowledgeCmsShadowPreview,
): string[] {
  const errors: string[] = [];
  const expectedEntryIds = knowledgeCmsRendererContracts.map(
    (contract) => contract.entryId,
  );
  const actualEntryIds = preview.results.map((result) => result.entryId);
  const passed = preview.results.filter(
    (result) => result.status === "parity_passed",
  ).length;
  const compared = preview.results.filter((result) =>
    ["parity_failed", "parity_passed"].includes(result.status),
  ).length;
  const unexpectedRepresentationIds =
    preview.betaParityApproval.unexpectedRepresentationIds;
  const approvalEvidence = {
    version: preview.version,
    asOf: preview.asOf,
    rendererMode: preview.rendererMode.requestedMode,
    routes: preview.results.map((result) => ({
      entryId: result.entryId,
      status: result.status,
      recordRevision: result.recordRevision ?? null,
      representationFingerprint:
        result.representationArtifact?.fingerprint.value ?? null,
      renderedBodySha256: result.artifact?.renderedBody.sha256 ?? null,
    })),
    unexpectedRepresentationIds,
  };
  const hasUnexpectedIds = unexpectedRepresentationIds.length > 0;
  const expectedApprovalFingerprint = createHash("sha256")
    .update(canonicalJson(approvalEvidence))
    .digest("hex");

  if (
    preview.version !== KNOWLEDGE_CMS_SHADOW_PREVIEW_VERSION ||
    preview.mode !== "private_shadow" ||
    preview.writeCount !== KNOWLEDGE_CMS_SHADOW_WRITE_COUNT ||
    preview.publicSource !== "verified_static_route" ||
    preview.bodySource !== "cms_native_lossless_artifact" ||
    preview.cmsBodyPubliclyRendered ||
    preview.cutoverEligible ||
    Number.isNaN(new Date(preview.asOf).getTime())
  ) {
    errors.push(
      "Private shadow evidence must remain zero-write, non-public, and cutover-ineligible.",
    );
  }
  if (!arraysEqual(actualEntryIds, expectedEntryIds)) {
    errors.push("Private shadow evidence does not cover the governed routes in order.");
  }
  if (
    preview.summary.total !== preview.results.length ||
    preview.summary.compared !== compared ||
    preview.summary.passed !== passed ||
    preview.summary.blocked !== preview.results.length - passed ||
    preview.summary.unexpectedRepresentations !==
      unexpectedRepresentationIds.length ||
    preview.betaParityApproval.routeCount !== preview.results.length ||
    preview.betaParityApproval.exactPasses !== passed ||
    preview.betaParityApproval.executionAuthority ||
    preview.betaParityApproval.publicCutoverAuthority
  ) {
    errors.push("Private shadow summary or authority evidence is inconsistent.");
  }
  const expectedApprovalStatus =
    preview.rendererMode.requestedMode === "shadow" &&
    preview.rendererMode.privateShadowEnabled &&
    passed === preview.results.length &&
    !hasUnexpectedIds
      ? "verified"
      : "blocked";
  if (preview.betaParityApproval.status !== expectedApprovalStatus) {
    errors.push("Verified shadow parity is not supported by all 22 exact routes.");
  }
  if (
    preview.betaParityApproval.fingerprint !==
    expectedApprovalFingerprint
  ) {
    errors.push("Private shadow approval fingerprint is invalid.");
  }
  if (hasUnexpectedIds && preview.betaParityApproval.status === "verified") {
    errors.push("Unexpected rendering documents must block shadow approval.");
  }
  for (const result of preview.results) {
    if (result.status !== "parity_passed") {
      continue;
    }
    const contract = getKnowledgeCmsRendererContract(result.entryId);
    if (
      !contract ||
      !result.artifact ||
      !result.representationArtifact ||
      result.errors.length > 0 ||
      verifyKnowledgeCmsRendererArtifact(contract, result.artifact).length > 0 ||
      validateKnowledgeCmsNativeRepresentationArtifact(
        result.representationArtifact,
      ).length > 0
    ) {
      errors.push(
        `Private shadow result "${result.entryId}" does not retain exact verified evidence.`,
      );
    }
  }
  return uniqueErrors(errors);
}
