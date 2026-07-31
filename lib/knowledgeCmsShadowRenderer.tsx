import "server-only";

import type { Metadata } from "next";
import type { ComponentType } from "react";
import TurningSixtyFivePage, {
  metadata as turningSixtyFiveMetadata,
} from "@/app/turning-65-medicare-spokane/page";
import CompareMedicareOptionsPage, {
  metadata as compareMedicareOptionsMetadata,
} from "@/app/compare-medicare-options/page";
import MedicareAdvantagePage, {
  metadata as medicareAdvantageMetadata,
} from "@/app/medicare-advantage/page";
import MedicareSupplementsPage, {
  metadata as medicareSupplementsMetadata,
} from "@/app/medicare-supplements/page";
import MedicareAppointmentChecklistPage, {
  metadata as medicareAppointmentChecklistMetadata,
} from "@/app/medicare-appointment-checklist/page";
import MedicarePlanReviewSpokanePage, {
  metadata as medicarePlanReviewSpokaneMetadata,
} from "@/app/medicare-plan-review-spokane/page";
import MedicareAnnualEnrollmentSpokanePage, {
  metadata as medicareAnnualEnrollmentSpokaneMetadata,
} from "@/app/medicare-annual-enrollment-spokane/page";
import RxDrugReviewPage, {
  metadata as rxDrugReviewMetadata,
} from "@/app/rx-drug-review/page";
import MedicarePartDPage, {
  metadata as medicarePartDMetadata,
} from "@/app/medicare-part-d/page";
import HelpingParentWithMedicarePage, {
  metadata as helpingParentWithMedicareMetadata,
} from "@/app/helping-parent-with-medicare/page";
import WorkingPastSixtyFivePage, {
  metadata as workingPastSixtyFiveMetadata,
} from "@/app/working-past-65-medicare/page";
import HealthInsuranceSpokanePage, {
  metadata as healthInsuranceSpokaneMetadata,
} from "@/app/health-insurance-spokane/page";
import HealthInsuranceAgentSpokanePage, {
  metadata as healthInsuranceAgentSpokaneMetadata,
} from "@/app/health-insurance-agent-spokane/page";
import IndividualFamilyHealthInsuranceSpokanePage, {
  metadata as individualFamilyHealthInsuranceSpokaneMetadata,
} from "@/app/individual-family-health-insurance-spokane/page";
import SelfEmployedHealthInsuranceSpokanePage, {
  metadata as selfEmployedHealthInsuranceSpokaneMetadata,
} from "@/app/self-employed-health-insurance-spokane/page";
import HealthInsuranceSpecialEnrollmentSpokanePage, {
  metadata as healthInsuranceSpecialEnrollmentSpokaneMetadata,
} from "@/app/health-insurance-special-enrollment-spokane/page";
import EnrollmentResourcesPage, {
  metadata as enrollmentResourcesMetadata,
} from "@/app/medicare-enrollment-resources/page";
import MovingToSpokaneMedicarePage, {
  metadata as movingToSpokaneMedicareMetadata,
} from "@/app/moving-to-spokane-medicare/page";
import MedicareSavingsProgramExtraHelpWashingtonPage, {
  metadata as medicareSavingsProgramExtraHelpWashingtonMetadata,
} from "@/app/medicare-savings-program-extra-help-washington/page";
import MedicareFaqPage, {
  metadata as medicareFaqMetadata,
} from "@/app/medicare-faq/page";
import AdvantageVsSupplementPage, {
  metadata as advantageVsSupplementMetadata,
} from "@/app/medicare-advantage-vs-supplement-spokane/page";
import CarriersPage, {
  metadata as carriersMetadata,
} from "@/app/carriers/page";
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
  getKnowledgeCmsRendererContract,
  knowledgeCmsRendererContracts,
  resolveKnowledgeCmsPublicRendererMode,
  verifyKnowledgeCmsRendererArtifact,
  type KnowledgeCmsRendererArtifact,
  type KnowledgeCmsRendererContractEntry,
  type KnowledgeCmsRendererModeResolution,
} from "./knowledgeCmsRendererContract";
import { getKnowledgeCmsRouteParity } from "./knowledgeCmsRouteParity";

export const KNOWLEDGE_CMS_SHADOW_PREVIEW_VERSION = 1 as const;
export const KNOWLEDGE_CMS_SHADOW_WRITE_COUNT = 0 as const;

export type KnowledgeCmsShadowResultStatus =
  | "adapter_invalid"
  | "candidate_missing"
  | "candidate_not_published"
  | "parity_failed"
  | "parity_passed"
  | "record_contract_mismatch";

export interface KnowledgeCmsShadowRouteAdapter {
  entryId: string;
  path: string;
  sourceFile: string;
  Component: ComponentType;
  metadata: Metadata;
}

export interface KnowledgeCmsShadowResult {
  entryId: string;
  path: string;
  sourceFile: string;
  recordId: string;
  title: string;
  status: KnowledgeCmsShadowResultStatus;
  recordRevision?: number;
  artifact?: KnowledgeCmsRendererArtifact;
  errors: string[];
  publicSource: "verified_static_route";
  bodySource: "verified_static_component_adapter";
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
  cmsBodyPubliclyRendered: false;
  cutoverEligible: false;
  summary: {
    total: number;
    adaptersReady: number;
    candidatesPresent: number;
    compared: number;
    passed: number;
    blocked: number;
  };
  results: KnowledgeCmsShadowResult[];
}

interface KnowledgeCmsShadowAdapterDefinition {
  path: string;
  sourceFile: string;
  Component: ComponentType;
  metadata: Metadata;
}

const adapterDefinitions: Readonly<
  Record<string, KnowledgeCmsShadowAdapterDefinition>
> = Object.freeze({
  "turning-65-spokane": Object.freeze({
    path: "/turning-65-medicare-spokane",
    sourceFile: "app/turning-65-medicare-spokane/page.tsx",
    Component: TurningSixtyFivePage,
    metadata: turningSixtyFiveMetadata,
  }),
  "compare-options": Object.freeze({
    path: "/compare-medicare-options",
    sourceFile: "app/compare-medicare-options/page.tsx",
    Component: CompareMedicareOptionsPage,
    metadata: compareMedicareOptionsMetadata,
  }),
  "medicare-advantage": Object.freeze({
    path: "/medicare-advantage",
    sourceFile: "app/medicare-advantage/page.tsx",
    Component: MedicareAdvantagePage,
    metadata: medicareAdvantageMetadata,
  }),
  "medicare-supplements": Object.freeze({
    path: "/medicare-supplements",
    sourceFile: "app/medicare-supplements/page.tsx",
    Component: MedicareSupplementsPage,
    metadata: medicareSupplementsMetadata,
  }),
  "appointment-checklist": Object.freeze({
    path: "/medicare-appointment-checklist",
    sourceFile: "app/medicare-appointment-checklist/page.tsx",
    Component: MedicareAppointmentChecklistPage,
    metadata: medicareAppointmentChecklistMetadata,
  }),
  "annual-plan-review": Object.freeze({
    path: "/medicare-plan-review-spokane",
    sourceFile: "app/medicare-plan-review-spokane/page.tsx",
    Component: MedicarePlanReviewSpokanePage,
    metadata: medicarePlanReviewSpokaneMetadata,
  }),
  "annual-enrollment-spokane": Object.freeze({
    path: "/medicare-annual-enrollment-spokane",
    sourceFile: "app/medicare-annual-enrollment-spokane/page.tsx",
    Component: MedicareAnnualEnrollmentSpokanePage,
    metadata: medicareAnnualEnrollmentSpokaneMetadata,
  }),
  "prescription-review": Object.freeze({
    path: "/rx-drug-review",
    sourceFile: "app/rx-drug-review/page.tsx",
    Component: RxDrugReviewPage,
    metadata: rxDrugReviewMetadata,
  }),
  "part-d": Object.freeze({
    path: "/medicare-part-d",
    sourceFile: "app/medicare-part-d/page.tsx",
    Component: MedicarePartDPage,
    metadata: medicarePartDMetadata,
  }),
  "helping-parent": Object.freeze({
    path: "/helping-parent-with-medicare",
    sourceFile: "app/helping-parent-with-medicare/page.tsx",
    Component: HelpingParentWithMedicarePage,
    metadata: helpingParentWithMedicareMetadata,
  }),
  "working-past-65": Object.freeze({
    path: "/working-past-65-medicare",
    sourceFile: "app/working-past-65-medicare/page.tsx",
    Component: WorkingPastSixtyFivePage,
    metadata: workingPastSixtyFiveMetadata,
  }),
  "health-insurance-spokane": Object.freeze({
    path: "/health-insurance-spokane",
    sourceFile: "app/health-insurance-spokane/page.tsx",
    Component: HealthInsuranceSpokanePage,
    metadata: healthInsuranceSpokaneMetadata,
  }),
  "health-insurance-agent": Object.freeze({
    path: "/health-insurance-agent-spokane",
    sourceFile: "app/health-insurance-agent-spokane/page.tsx",
    Component: HealthInsuranceAgentSpokanePage,
    metadata: healthInsuranceAgentSpokaneMetadata,
  }),
  "individual-family-health-insurance": Object.freeze({
    path: "/individual-family-health-insurance-spokane",
    sourceFile: "app/individual-family-health-insurance-spokane/page.tsx",
    Component: IndividualFamilyHealthInsuranceSpokanePage,
    metadata: individualFamilyHealthInsuranceSpokaneMetadata,
  }),
  "self-employed-health-insurance": Object.freeze({
    path: "/self-employed-health-insurance-spokane",
    sourceFile: "app/self-employed-health-insurance-spokane/page.tsx",
    Component: SelfEmployedHealthInsuranceSpokanePage,
    metadata: selfEmployedHealthInsuranceSpokaneMetadata,
  }),
  "special-enrollment-health-insurance": Object.freeze({
    path: "/health-insurance-special-enrollment-spokane",
    sourceFile: "app/health-insurance-special-enrollment-spokane/page.tsx",
    Component: HealthInsuranceSpecialEnrollmentSpokanePage,
    metadata: healthInsuranceSpecialEnrollmentSpokaneMetadata,
  }),
  "enrollment-resources": Object.freeze({
    path: "/medicare-enrollment-resources",
    sourceFile: "app/medicare-enrollment-resources/page.tsx",
    Component: EnrollmentResourcesPage,
    metadata: enrollmentResourcesMetadata,
  }),
  "moving-to-spokane": Object.freeze({
    path: "/moving-to-spokane-medicare",
    sourceFile: "app/moving-to-spokane-medicare/page.tsx",
    Component: MovingToSpokaneMedicarePage,
    metadata: movingToSpokaneMedicareMetadata,
  }),
  "medicare-savings-extra-help": Object.freeze({
    path: "/medicare-savings-program-extra-help-washington",
    sourceFile:
      "app/medicare-savings-program-extra-help-washington/page.tsx",
    Component: MedicareSavingsProgramExtraHelpWashingtonPage,
    metadata: medicareSavingsProgramExtraHelpWashingtonMetadata,
  }),
  "medicare-faq": Object.freeze({
    path: "/medicare-faq",
    sourceFile: "app/medicare-faq/page.tsx",
    Component: MedicareFaqPage,
    metadata: medicareFaqMetadata,
  }),
  "advantage-vs-supplement": Object.freeze({
    path: "/medicare-advantage-vs-supplement-spokane",
    sourceFile: "app/medicare-advantage-vs-supplement-spokane/page.tsx",
    Component: AdvantageVsSupplementPage,
    metadata: advantageVsSupplementMetadata,
  }),
  "represented-carriers": Object.freeze({
    path: "/carriers",
    sourceFile: "app/carriers/page.tsx",
    Component: CarriersPage,
    metadata: carriersMetadata,
  }),
});

function metadataString(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof URL) {
    return value.toString();
  }
  if (
    value &&
    typeof value === "object" &&
    "absolute" in value &&
    typeof value.absolute === "string"
  ) {
    return value.absolute;
  }
  return undefined;
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

function expectedArticleRelationships(entry: KnowledgeEntry) {
  return {
    articleIds: (entry.relationships?.entryPaths ?? []).flatMap(
      (path) => {
        const related = knowledgeEntries.find(
          (candidate) => candidate.path === path,
        );
        return related ? [`resource-entry--${related.id}`] : [];
      },
    ),
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
  return resolveKnowledgeCmsPublicRendererMode(value)
    .privateShadowEnabled;
}

export function getKnowledgeCmsShadowRouteAdapter(
  entryId: string,
): KnowledgeCmsShadowRouteAdapter | undefined {
  const definition = adapterDefinitions[entryId];
  return definition
    ? Object.freeze({
        entryId,
        ...definition,
      })
    : undefined;
}

export function validateKnowledgeCmsShadowAdapters(): string[] {
  const errors: string[] = [];
  const seenPaths = new Set<string>();
  const adapterIds = Object.keys(adapterDefinitions);

  if (adapterIds.length !== knowledgeCmsRendererContracts.length) {
    errors.push(
      "Private shadow adapter count must match the renderer contract count.",
    );
  }

  for (const contract of knowledgeCmsRendererContracts) {
    const adapter = getKnowledgeCmsShadowRouteAdapter(contract.entryId);
    const parity = getKnowledgeCmsRouteParity(contract.entryId);
    if (!adapter || !parity) {
      errors.push(
        `Renderer contract "${contract.entryId}" has no private shadow adapter or parity entry.`,
      );
      continue;
    }
    if (seenPaths.has(adapter.path)) {
      errors.push(`Private shadow path "${adapter.path}" is duplicated.`);
    }
    seenPaths.add(adapter.path);
    if (
      adapter.path !== contract.path ||
      adapter.sourceFile !== contract.legacy.sourceFile
    ) {
      errors.push(
        `Private shadow adapter "${contract.entryId}" does not match its renderer contract.`,
      );
    }
    if (
      metadataString(adapter.metadata.title) !==
        parity.metadata.pageTitle ||
      adapter.metadata.description !== parity.metadata.description ||
      metadataString(adapter.metadata.alternates?.canonical) !==
        parity.metadata.canonicalUrl ||
      metadataString(adapter.metadata.openGraph?.title) !==
        parity.metadata.openGraphTitle ||
      adapter.metadata.openGraph?.description !==
        parity.metadata.openGraphDescription ||
      metadataString(adapter.metadata.openGraph?.url) !==
        parity.metadata.openGraphUrl
    ) {
      errors.push(
        `Private shadow adapter "${contract.entryId}" metadata does not match route parity.`,
      );
    }
  }

  for (const entryId of adapterIds) {
    if (!getKnowledgeCmsRendererContract(entryId)) {
      errors.push(
        `Private shadow adapter "${entryId}" has no renderer contract.`,
      );
    }
  }

  return errors;
}

function validateShadowRecord(
  contract: KnowledgeCmsRendererContractEntry,
  record: KnowledgeCmsArticle,
  asOf: Date,
): string[] {
  const errors: string[] = [];
  const parity = getKnowledgeCmsRouteParity(contract.entryId);
  const entry = knowledgeEntries.find(
    (candidate) => candidate.id === contract.entryId,
  );
  if (!parity || !entry) {
    return ["The renderer contract has no governed route mapping."];
  }

  if (
    record.id !== contract.record.id ||
    record.kind !== contract.record.kind ||
    record.bodyFormat !== contract.record.bodyFormat ||
    record.slug !== contract.path.slice(1)
  ) {
    errors.push(
      "The candidate record identity, slug, or body format does not match the renderer contract.",
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
    record.discoverability.pageTitle !== parity.metadata.pageTitle ||
    record.discoverability.description !== parity.metadata.description
  ) {
    errors.push(
      "The candidate page title or description does not match route parity.",
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
    if (
      !arraysEqual(
        record.relationships[key],
        expectedRelationships[key],
      )
    ) {
      errors.push(
        `The candidate ${key} relationships do not match the governed Resource Library entry.`,
      );
    }
  }
  const expectedSourceIds = entry.sourceIds ?? [];
  if (
    !arraysEqual(
      record.sources.map((source) => source.id),
      expectedSourceIds,
    )
  ) {
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
): KnowledgeCmsRendererArtifact | undefined {
  const parity = getKnowledgeCmsRouteParity(contract.entryId);
  if (!parity) {
    return undefined;
  }
  return {
    entryId: contract.entryId,
    path: contract.path,
    record: {
      kind: "article",
      id: record.id,
      revision: record.audit.revision,
      status: "published",
    },
    rendering: {
      mode: "private_shadow",
      bodySource: "verified_static_component_adapter",
      cmsBodyPubliclyRendered: false,
    },
    metadata: {
      pageTitle: parity.metadata.pageTitle,
      description: parity.metadata.description,
      canonicalUrl: parity.metadata.canonicalUrl,
      openGraphTitle: parity.metadata.openGraphTitle,
      openGraphDescription: parity.metadata.openGraphDescription,
      openGraphUrl: parity.metadata.openGraphUrl,
    },
    renderedBody: {
      sha256: parity.renderedBody.sha256,
      bytes: parity.renderedBody.bytes,
      h1: parity.renderedBody.h1,
      h1Count: parity.renderedBody.h1Count,
      schemaTypes: [...parity.renderedBody.schemaTypes],
      formCount: parity.renderedBody.formCount,
      faqDisclosureCount: parity.renderedBody.faqDisclosureCount,
    },
    satisfiedRequirements: [
      ...parity.cmsRepresentation.preservationRequirements,
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
    bodySource: "verified_static_component_adapter",
    cmsBodyPubliclyRendered: false,
    cutoverEligible: false,
  };
}

export function compareKnowledgeCmsShadowCandidate(
  contract: KnowledgeCmsRendererContractEntry,
  record: KnowledgeCmsArticle | undefined,
  asOf: Date = new Date(),
): KnowledgeCmsShadowResult {
  const base = baseResult(contract);
  const adapterErrors = validateKnowledgeCmsShadowAdapters();
  if (adapterErrors.length > 0) {
    return {
      ...base,
      status: "adapter_invalid",
      errors: adapterErrors,
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

  const recordErrors = validateShadowRecord(contract, record, asOf);
  if (recordErrors.length > 0) {
    return {
      ...base,
      status: "record_contract_mismatch",
      recordRevision: record.audit.revision,
      errors: recordErrors,
    };
  }

  const artifact = buildArtifact(contract, record);
  const parityErrors = artifact
    ? verifyKnowledgeCmsRendererArtifact(contract, artifact)
    : ["The private shadow artifact could not be built."];
  if (!artifact || parityErrors.length > 0) {
    return {
      ...base,
      status: "parity_failed",
      recordRevision: record.audit.revision,
      ...(artifact ? { artifact } : {}),
      errors: parityErrors,
    };
  }

  return {
    ...base,
    status: "parity_passed",
    recordRevision: record.audit.revision,
    artifact,
    errors: [],
  };
}

export function buildKnowledgeCmsShadowPreview(
  records: KnowledgeCmsArticle[],
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
      asOf,
    ),
  );
  const compared = results.filter((result) =>
    ["parity_failed", "parity_passed"].includes(result.status),
  ).length;
  const passed = results.filter(
    (result) => result.status === "parity_passed",
  ).length;

  return {
    version: KNOWLEDGE_CMS_SHADOW_PREVIEW_VERSION,
    mode: "private_shadow",
    asOf: asOf.toISOString(),
    writeCount: KNOWLEDGE_CMS_SHADOW_WRITE_COUNT,
    rendererMode,
    publicSource: "verified_static_route",
    cmsBodyPubliclyRendered: false,
    cutoverEligible: false,
    summary: {
      total: results.length,
      adaptersReady:
        results.length -
        results.filter((result) => result.status === "adapter_invalid")
          .length,
      candidatesPresent: results.filter(
        (result) => result.status !== "candidate_missing",
      ).length,
      compared,
      passed,
      blocked: results.length - passed,
    },
    results,
  };
}
