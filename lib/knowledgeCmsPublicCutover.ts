import "server-only";

import { createHash } from "node:crypto";
import {
  assertKnowledgeCmsActionAllowed,
  type KnowledgeCmsActor,
} from "./knowledgeCms";
import {
  validateKnowledgeCmsOperationalReadinessReport,
  type KnowledgeCmsOperationalReadinessReport,
} from "./knowledgeCmsOperationalReadiness";
import {
  validateKnowledgeCmsShadowPreview,
  type KnowledgeCmsShadowPreview,
} from "./knowledgeCmsShadowRenderer";
import {
  KNOWLEDGE_CMS_RENDERER_CONTRACT_VERSION,
  knowledgeCmsRendererContracts,
  knowledgeCmsRendererRollbackPlan,
} from "./knowledgeCmsRendererContract";

export const KNOWLEDGE_CMS_PUBLIC_CUTOVER_VERSION = 2 as const;
export const KNOWLEDGE_CMS_PUBLIC_CUTOVER_PREVIEW_WRITE_COUNT = 0 as const;
export const KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_WRITE_COUNT = 2 as const;
export const KNOWLEDGE_CMS_PUBLIC_CUTOVER_EVIDENCE_MAX_AGE_MS =
  5 * 60 * 1_000;
export const KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_LIFETIME_MS =
  7 * 24 * 60 * 60 * 1_000;
export const KNOWLEDGE_CMS_PUBLIC_CUTOVER_CONFIRMATION_PREFIX =
  "CREATE GUARDED PUBLIC CUTOVER APPROVAL" as const;

type JsonObject = Record<string, unknown>;

export type KnowledgeCmsPublicCutoverCheckStatus = "blocked" | "pass";

export interface KnowledgeCmsPublicCutoverRouteEvidence {
  entryId: string;
  path: string;
  articleId: string;
  articleRevision: number;
  representationId: string;
  representationFingerprint: string;
  renderedBodySha256: string;
  canonicalUrl: string;
}

export interface KnowledgeCmsPublicCutoverApprovalControl {
  version: typeof KNOWLEDGE_CMS_PUBLIC_CUTOVER_VERSION;
  mode: "control_only";
  operation: "create_guarded_public_cutover_approval";
  id: string;
  validity: {
    validFrom: string;
    expiresAt: string;
    lifetimeMilliseconds: typeof KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_LIFETIME_MS;
  };
  evidence: {
    operationalReadinessVersion: number;
    operationalReadinessFingerprint: string;
    shadowPreviewVersion: number;
    shadowParityFingerprint: string;
    rendererContractVersion: number;
    recordsVerified: number;
    routesVerified: number;
  };
  routes: KnowledgeCmsPublicCutoverRouteEvidence[];
  execution: {
    status: "disabled";
    readyToExecute: false;
    writeCount: typeof KNOWLEDGE_CMS_PUBLIC_CUTOVER_PREVIEW_WRITE_COUNT;
    reason: "control_is_not_execution_authority";
  };
  rollout: {
    productionRouteBatchesRequired: true;
    productionNoTrafficDeploymentRequired: true;
    perRequestRevalidation: true;
    perRequestStaticFallback: true;
    rollbackMode: "static";
    preservesCmsRecords: true;
    dataMutationOnRollback: "none";
  };
  fingerprint: {
    algorithm: "sha256";
    canonicalization: "recursive_sorted_keys";
    value: string;
  };
}

export interface KnowledgeCmsPublicCutoverApproval {
  version: typeof KNOWLEDGE_CMS_PUBLIC_CUTOVER_VERSION;
  id: string;
  status: "approved";
  control: KnowledgeCmsPublicCutoverApprovalControl;
  audit: {
    approvedAt: string;
    approvedBy: string;
  };
  rollout: {
    trafficMoved: false;
    deploymentStarted: false;
    executionAuthority: false;
    publicRoutingAuthority: "requires_matching_runtime_receipt";
  };
  fingerprint: {
    algorithm: "sha256";
    canonicalization: "recursive_sorted_keys";
    value: string;
  };
}

export interface KnowledgeCmsPublicCutoverCheck {
  code:
    | "all_records_complete"
    | "approval_window"
    | "execution_gates_disabled"
    | "operational_readiness"
    | "protected_static_rollback"
    | "renderer_shadow_state"
    | "route_evidence"
    | "shadow_parity"
    | "zero_mutation_preview";
  status: KnowledgeCmsPublicCutoverCheckStatus;
  detail: string;
}

export interface KnowledgeCmsPublicCutoverPreview {
  version: typeof KNOWLEDGE_CMS_PUBLIC_CUTOVER_VERSION;
  mode: "read_only_public_cutover_preview";
  observedAt: string;
  eligibility: "blocked" | "ready_for_admin_approval";
  checks: KnowledgeCmsPublicCutoverCheck[];
  approvalControl: KnowledgeCmsPublicCutoverApprovalControl;
  activation: {
    previewOnly: true;
    variablesChanged: false;
    deploymentStarted: false;
    trafficMoved: false;
    productionRouteBatchesRequired: true;
    productionNoTrafficDeploymentRequired: true;
    variables: readonly [
      "KNOWLEDGE_CMS_ENABLED=true",
      "KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED=false",
      "KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED=false",
      "KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED=false",
      "KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_EXECUTION_ENABLED=false",
      "KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE=cutover",
      "KNOWLEDGE_CMS_PUBLIC_CUTOVER_ENABLED=true",
      string,
      "KNOWLEDGE_CMS_PUBLIC_CUTOVER_ROUTES=<one-or-more-governed-entry-ids>",
    ];
  };
  rollback: {
    immediateValue: "KNOWLEDGE_CMS_PUBLIC_CUTOVER_ENABLED=false";
    rendererValue: "KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE=static";
    trafficAction: "route_traffic_to_previous_static_revision";
    preservesCmsRecords: true;
    deletesCmsRecords: false;
    writeCount: 0;
    triggers: readonly string[];
    verification: readonly string[];
  };
  monitoring: {
    structuredLogEvent: "knowledge_cms_public_renderer";
    outcomes: readonly ["cms_candidate", "static_fallback"];
    protectedPaths: readonly ["/", "/medicare-spokane", "/resources"];
    routeCount: 22;
    approvalAutoExpires: true;
  };
  mutationBoundary: {
    writeCount: typeof KNOWLEDGE_CMS_PUBLIC_CUTOVER_PREVIEW_WRITE_COUNT;
    approvalCreated: false;
    deploymentStarted: false;
    trafficMoved: false;
    recordsChanged: false;
  };
  fingerprint: {
    algorithm: "sha256";
    canonicalization: "recursive_sorted_keys";
    value: string;
  };
}

type UnsignedControl = Omit<
  KnowledgeCmsPublicCutoverApprovalControl,
  "fingerprint"
>;
type UnsignedApproval = Omit<KnowledgeCmsPublicCutoverApproval, "fingerprint">;

const sha256Pattern = /^[a-f0-9]{64}$/;
const identifierPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  const entries = Object.entries(value as JsonObject)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) =>
      left < right ? -1 : left > right ? 1 : 0,
    );
  return `{${entries
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
    .join(",")}}`;
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const item of Object.values(value as JsonObject)) {
      deepFreeze(item);
    }
    Object.freeze(value);
  }
  return value;
}

function check(
  code: KnowledgeCmsPublicCutoverCheck["code"],
  status: KnowledgeCmsPublicCutoverCheckStatus,
  detail: string,
): KnowledgeCmsPublicCutoverCheck {
  return { code, status, detail };
}

function evidenceAge(observedAt: string, now: Date): number | null {
  const parsed = new Date(observedAt);
  return Number.isNaN(parsed.getTime())
    ? null
    : now.getTime() - parsed.getTime();
}

function ageIsFresh(age: number | null): boolean {
  return Boolean(
    age !== null &&
      age >= 0 &&
      age <= KNOWLEDGE_CMS_PUBLIC_CUTOVER_EVIDENCE_MAX_AGE_MS,
  );
}

function routeEvidence(
  shadow: KnowledgeCmsShadowPreview,
): KnowledgeCmsPublicCutoverRouteEvidence[] {
  return shadow.results.flatMap((result) => {
    const contract = knowledgeCmsRendererContracts.find(
      (candidate) => candidate.entryId === result.entryId,
    );
    if (
      !contract ||
      result.status !== "parity_passed" ||
      !result.recordRevision ||
      !result.representationArtifact ||
      !result.artifact
    ) {
      return [];
    }
    return [
      {
        entryId: result.entryId,
        path: result.path,
        articleId: result.recordId,
        articleRevision: result.recordRevision,
        representationId: result.representationArtifact.id,
        representationFingerprint:
          result.representationArtifact.fingerprint.value,
        renderedBodySha256: result.artifact.renderedBody.sha256,
        canonicalUrl: result.artifact.metadata.canonicalUrl,
      },
    ];
  });
}

export function buildKnowledgeCmsPublicCutoverApprovalControl(input: {
  readiness: KnowledgeCmsOperationalReadinessReport;
  shadow: KnowledgeCmsShadowPreview;
  observedAt: Date;
}): KnowledgeCmsPublicCutoverApprovalControl {
  const routes = routeEvidence(input.shadow);
  const artifactCreatedAt = input.shadow.results.flatMap((result) =>
    result.status === "parity_passed" && result.representationArtifact
      ? [new Date(result.representationArtifact.audit.createdAt).getTime()]
      : [],
  );
  const latestArtifactCreatedAt =
    routes.length > 0 &&
    artifactCreatedAt.length === routes.length &&
    artifactCreatedAt.every((value) => Number.isFinite(value))
      ? Math.max(...artifactCreatedAt)
      : input.observedAt.getTime();
  const validFrom = new Date(latestArtifactCreatedAt).toISOString();
  const expiresAt = new Date(
    latestArtifactCreatedAt +
      KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_LIFETIME_MS,
  ).toISOString();
  const unsigned: UnsignedControl = {
    version: KNOWLEDGE_CMS_PUBLIC_CUTOVER_VERSION,
    mode: "control_only",
    operation: "create_guarded_public_cutover_approval",
    id: "pending_fingerprint",
    validity: {
      validFrom,
      expiresAt,
      lifetimeMilliseconds:
        KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_LIFETIME_MS,
    },
    evidence: {
      operationalReadinessVersion: input.readiness.version,
      operationalReadinessFingerprint:
        input.readiness.fingerprint.value,
      shadowPreviewVersion: input.shadow.version,
      shadowParityFingerprint:
        input.shadow.betaParityApproval.fingerprint,
      rendererContractVersion:
        KNOWLEDGE_CMS_RENDERER_CONTRACT_VERSION,
      recordsVerified:
        input.readiness.migration.targets.verifiedPrivateDrafts +
        input.readiness.migration.targets.verifiedAdvancedRecords,
      routesVerified: routes.length,
    },
    routes,
    execution: {
      status: "disabled",
      readyToExecute: false,
      writeCount: KNOWLEDGE_CMS_PUBLIC_CUTOVER_PREVIEW_WRITE_COUNT,
      reason: "control_is_not_execution_authority",
    },
    rollout: {
      productionRouteBatchesRequired: true,
      productionNoTrafficDeploymentRequired: true,
      perRequestRevalidation: true,
      perRequestStaticFallback: true,
      rollbackMode: "static",
      preservesCmsRecords: true,
      dataMutationOnRollback: "none",
    },
  };
  const receipt = fingerprint(unsigned);
  const identified: UnsignedControl = {
    ...unsigned,
    id: `public-cutover--${receipt}`,
  };
  return deepFreeze({
    ...identified,
    fingerprint: {
      algorithm: "sha256",
      canonicalization: "recursive_sorted_keys",
      value: fingerprint(identified),
    },
  });
}

export function getKnowledgeCmsPublicCutoverConfirmationPhrase(
  receipt: string,
): string {
  return `${KNOWLEDGE_CMS_PUBLIC_CUTOVER_CONFIRMATION_PREFIX} ${receipt}`;
}

export function getKnowledgeCmsPublicCutoverReceipt(
  control: KnowledgeCmsPublicCutoverApprovalControl,
): string {
  return control.id.startsWith("public-cutover--")
    ? control.id.slice("public-cutover--".length)
    : "";
}

export function buildKnowledgeCmsPublicCutoverPreview(input: {
  actor: KnowledgeCmsActor;
  readiness: KnowledgeCmsOperationalReadinessReport;
  shadow: KnowledgeCmsShadowPreview;
  observedAt: Date;
}): KnowledgeCmsPublicCutoverPreview {
  assertKnowledgeCmsActionAllowed(input.actor, "preview_public_cutover");
  if (Number.isNaN(input.observedAt.getTime())) {
    throw new Error("Public cutover preview requires a valid server clock.");
  }
  const readinessErrors = validateKnowledgeCmsOperationalReadinessReport(
    input.readiness,
  );
  const shadowErrors = validateKnowledgeCmsShadowPreview(input.shadow);
  const readinessAge = evidenceAge(
    input.readiness.observedAt,
    input.observedAt,
  );
  const shadowAge = evidenceAge(input.shadow.asOf, input.observedAt);
  const allRecordsComplete = Boolean(
      input.readiness.migration.status === "available" &&
      input.readiness.migration.targets.total === 45 &&
      input.readiness.migration.targets.verifiedPrivateDrafts +
        input.readiness.migration.targets.verifiedAdvancedRecords ===
        45 &&
      input.readiness.migration.targets.preparedAbsent === 0 &&
      input.readiness.migration.targets.blocked === 0 &&
      input.readiness.migration.completion.status === "complete" &&
      input.readiness.capabilities.allRecordsMigration === "complete" &&
      input.readiness.capabilities.singleRecordArticleMigration ===
        "complete" &&
      input.readiness.capabilities.singleRecordSupportingMigration ===
        "complete",
  );
  const executionGatesDisabled = Boolean(
    input.readiness.configuration.articleMigrationExecutionGate ===
      "disabled" &&
      input.readiness.configuration.supportingMigrationExecutionGate ===
        "disabled" &&
      input.readiness.configuration.nativeRepresentationExecutionGate ===
        "disabled",
  );
  const rendererShadow = Boolean(
    input.readiness.configuration.renderer.requestedMode === "shadow" &&
      input.readiness.configuration.renderer.effectiveMode === "static" &&
      input.readiness.configuration.renderer.privateShadowEnabled &&
      !input.readiness.configuration.renderer.activationAllowed,
  );
  const shadowVerified = Boolean(
    shadowErrors.length === 0 &&
      input.shadow.betaParityApproval.status === "verified" &&
      input.shadow.betaParityApproval.exactPasses === 22 &&
      input.shadow.betaParityApproval.routeCount === 22 &&
      input.shadow.betaParityApproval.unexpectedRepresentationIds.length ===
        0,
  );
  const routes = routeEvidence(input.shadow);
  const routesVerified = Boolean(
    routes.length === 22 &&
      new Set(routes.map((route) => route.entryId)).size === 22 &&
      new Set(routes.map((route) => route.path)).size === 22 &&
      new Set(routes.map((route) => route.representationId)).size === 22,
  );
  const rollbackVerified = Boolean(
    knowledgeCmsRendererRollbackPlan.routeCount === 22 &&
      knowledgeCmsRendererRollbackPlan.rollbackValue === "static" &&
      knowledgeCmsRendererRollbackPlan.dataMutation === "none" &&
      knowledgeCmsRendererRollbackPlan.preservesCmsRecords,
  );
  const readinessValid = Boolean(
    readinessErrors.length === 0 &&
      input.readiness.overall ===
        "ready_for_guarded_private_operations",
  );
  const evidenceFresh =
    ageIsFresh(readinessAge) && ageIsFresh(shadowAge);
  const checks: KnowledgeCmsPublicCutoverCheck[] = [
    check(
      "operational_readiness",
      readinessValid ? "pass" : "blocked",
      readinessValid
        ? "The fresh zero-write operational receipt is valid."
        : "Operational readiness is invalid or blocked.",
    ),
    check(
      "approval_window",
      evidenceFresh ? "pass" : "blocked",
      evidenceFresh
        ? "Readiness and shadow evidence are both within five minutes."
        : "Readiness or shadow evidence is stale, future-dated, or invalid.",
    ),
    check(
      "all_records_complete",
      allRecordsComplete ? "pass" : "blocked",
      allRecordsComplete
        ? "All 45 article, topic, and FAQ targets have verified completion evidence."
        : "The 45-record migration is incomplete or contains blocked evidence.",
    ),
    check(
      "execution_gates_disabled",
      executionGatesDisabled ? "pass" : "blocked",
      executionGatesDisabled
        ? "Every migration and rendering-artifact execution gate is disabled."
        : "All three record/artifact execution gates must be disabled before approval.",
    ),
    check(
      "renderer_shadow_state",
      rendererShadow ? "pass" : "blocked",
      rendererShadow
        ? "The current public renderer remains static while exact private shadow is active."
        : "Approval must be created from exact private shadow mode with public static output.",
    ),
    check(
      "shadow_parity",
      shadowVerified ? "pass" : "blocked",
      shadowVerified
        ? "All 22 current revision artifacts pass exact lossless shadow parity."
        : "All 22 current revision artifacts must pass exact shadow parity with no unexpected documents.",
    ),
    check(
      "route_evidence",
      routesVerified ? "pass" : "blocked",
      routesVerified
        ? "The approval binds 22 unique paths, article revisions, artifacts, hashes, and canonicals."
        : "Route-specific article or artifact evidence is incomplete or ambiguous.",
    ),
    check(
      "protected_static_rollback",
      rollbackVerified ? "pass" : "blocked",
      rollbackVerified
        ? "Static rollback covers every governed route and preserves CMS records."
        : "The no-write static rollback contract is incomplete.",
    ),
    check(
      "zero_mutation_preview",
      "pass",
      "This preview creates no approval, deployment, traffic change, record mutation, or write.",
    ),
  ];
  const eligibility = checks.every((item) => item.status === "pass")
    ? "ready_for_admin_approval" as const
    : "blocked" as const;
  const approvalControl = buildKnowledgeCmsPublicCutoverApprovalControl({
    readiness: input.readiness,
    shadow: input.shadow,
    observedAt: input.observedAt,
  });
  const receipt = getKnowledgeCmsPublicCutoverReceipt(approvalControl);
  const receiptVariable =
    `KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_RECEIPT=${receipt}` as const;
  const unsigned = {
    version: KNOWLEDGE_CMS_PUBLIC_CUTOVER_VERSION,
    mode: "read_only_public_cutover_preview" as const,
    observedAt: input.observedAt.toISOString(),
    eligibility,
    checks,
    approvalControl,
    activation: {
      previewOnly: true as const,
      variablesChanged: false as const,
      deploymentStarted: false as const,
      trafficMoved: false as const,
      productionRouteBatchesRequired: true as const,
      productionNoTrafficDeploymentRequired: true as const,
      variables: [
        "KNOWLEDGE_CMS_ENABLED=true",
        "KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED=false",
        "KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED=false",
        "KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED=false",
        "KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_EXECUTION_ENABLED=false",
        "KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE=cutover",
        "KNOWLEDGE_CMS_PUBLIC_CUTOVER_ENABLED=true",
        receiptVariable,
        "KNOWLEDGE_CMS_PUBLIC_CUTOVER_ROUTES=<one-or-more-governed-entry-ids>",
      ] as KnowledgeCmsPublicCutoverPreview["activation"]["variables"],
    },
    rollback: {
      immediateValue:
        "KNOWLEDGE_CMS_PUBLIC_CUTOVER_ENABLED=false" as const,
      rendererValue:
        "KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE=static" as const,
      trafficAction:
        "route_traffic_to_previous_static_revision" as const,
      preservesCmsRecords: true as const,
      deletesCmsRecords: false as const,
      writeCount: 0 as const,
      triggers: [
        "Any CMS candidate falls back during a production route batch.",
        "A governed route returns a non-200 response or exceeds the latency budget.",
        "HTML, metadata, canonical, schema, form, FAQ, or indexing evidence drifts.",
        "The approval expires or no longer matches the current article revision and artifact.",
        "The homepage, /medicare-spokane, /resources, sitemap, robots, or redirects change unexpectedly.",
      ],
      verification: [
        "Route production traffic back to the previous verified static revision first.",
        "Set the cutover gate false and renderer mode static before the next deployment.",
        "Verify all 22 governed routes against immutable static parity snapshots.",
        "Verify the protected homepage, /medicare-spokane, and /resources remain unchanged.",
        "Preserve every CMS record, lock, rendering artifact, approval, and audit event.",
      ],
    },
    monitoring: {
      structuredLogEvent: "knowledge_cms_public_renderer" as const,
      outcomes: ["cms_candidate", "static_fallback"] as const,
      protectedPaths: ["/", "/medicare-spokane", "/resources"] as const,
      routeCount: 22 as const,
      approvalAutoExpires: true as const,
    },
    mutationBoundary: {
      writeCount: KNOWLEDGE_CMS_PUBLIC_CUTOVER_PREVIEW_WRITE_COUNT,
      approvalCreated: false as const,
      deploymentStarted: false as const,
      trafficMoved: false as const,
      recordsChanged: false as const,
    },
  };
  return deepFreeze({
    ...unsigned,
    fingerprint: {
      algorithm: "sha256" as const,
      canonicalization: "recursive_sorted_keys" as const,
      value: fingerprint(unsigned),
    },
  });
}

export function validateKnowledgeCmsPublicCutoverApprovalControl(
  control: KnowledgeCmsPublicCutoverApprovalControl,
  now?: Date,
): string[] {
  const errors: string[] = [];
  const validFrom = new Date(control.validity.validFrom);
  const expiresAt = new Date(control.validity.expiresAt);
  const routeIds = control.routes.map((route) => route.entryId);
  const routePaths = control.routes.map((route) => route.path);
  if (
    control.version !== KNOWLEDGE_CMS_PUBLIC_CUTOVER_VERSION ||
    control.mode !== "control_only" ||
    control.operation !== "create_guarded_public_cutover_approval" ||
    control.execution.status !== "disabled" ||
    control.execution.readyToExecute ||
    control.execution.writeCount !== 0 ||
    !control.rollout.productionRouteBatchesRequired ||
    !control.rollout.productionNoTrafficDeploymentRequired ||
    !control.rollout.perRequestRevalidation ||
    !control.rollout.perRequestStaticFallback ||
    control.rollout.rollbackMode !== "static" ||
    !control.rollout.preservesCmsRecords ||
    control.rollout.dataMutationOnRollback !== "none"
  ) {
    errors.push("The public cutover control violates its guarded rollout contract.");
  }
  if (
    Number.isNaN(validFrom.getTime()) ||
    Number.isNaN(expiresAt.getTime()) ||
    expiresAt.getTime() - validFrom.getTime() !==
      KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_LIFETIME_MS ||
    control.validity.lifetimeMilliseconds !==
      KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_LIFETIME_MS
  ) {
    errors.push("The public cutover approval window is invalid.");
  }
  if (
    !Number.isInteger(control.evidence.recordsVerified) ||
    control.evidence.recordsVerified < 0 ||
    control.evidence.recordsVerified > 45 ||
    !Number.isInteger(control.evidence.routesVerified) ||
    control.evidence.routesVerified !== control.routes.length ||
    control.evidence.routesVerified < 0 ||
    control.evidence.routesVerified > 22 ||
    control.evidence.rendererContractVersion !==
      KNOWLEDGE_CMS_RENDERER_CONTRACT_VERSION ||
    !sha256Pattern.test(
      control.evidence.operationalReadinessFingerprint,
    ) ||
    !sha256Pattern.test(control.evidence.shadowParityFingerprint) ||
    new Set(routeIds).size !== control.routes.length ||
    new Set(routePaths).size !== control.routes.length
  ) {
    errors.push("The public cutover evidence does not bind all governed records and routes.");
  }
  const contractById = new Map(
    knowledgeCmsRendererContracts.map((contract) => [
      contract.entryId,
      contract,
    ]),
  );
  for (const route of control.routes) {
    const contract = contractById.get(route.entryId);
    if (
      !contract ||
      route.path !== contract.path ||
      route.articleId !== contract.record.id ||
      !Number.isInteger(route.articleRevision) ||
      route.articleRevision < 1 ||
      !route.representationId ||
      !sha256Pattern.test(route.representationFingerprint) ||
      !sha256Pattern.test(route.renderedBodySha256) ||
      route.canonicalUrl !== contract.legacy.canonicalUrl
    ) {
      errors.push(`The public cutover route evidence for "${route.entryId}" is invalid.`);
    }
  }
  const unsigned = Object.fromEntries(
    Object.entries(control).filter(([key]) => key !== "fingerprint"),
  ) as UnsignedControl;
  if (
    control.fingerprint.algorithm !== "sha256" ||
    control.fingerprint.canonicalization !== "recursive_sorted_keys" ||
    !sha256Pattern.test(control.fingerprint.value) ||
    fingerprint(unsigned) !== control.fingerprint.value ||
    control.id !== `public-cutover--${fingerprint({ ...unsigned, id: "pending_fingerprint" })}`
  ) {
    errors.push("The public cutover control fingerprint or identifier is invalid.");
  }
  if (now) {
    if (
      Number.isNaN(now.getTime()) ||
      now.getTime() < validFrom.getTime() ||
      now.getTime() > expiresAt.getTime()
    ) {
      errors.push("The public cutover approval is not inside its validity window.");
    }
  }
  return [...new Set(errors)];
}

export function validateKnowledgeCmsPublicCutoverPreview(
  preview: KnowledgeCmsPublicCutoverPreview,
): string[] {
  const errors: string[] = [];
  const unsigned = Object.fromEntries(
    Object.entries(preview).filter(([key]) => key !== "fingerprint"),
  );
  if (
    preview.version !== KNOWLEDGE_CMS_PUBLIC_CUTOVER_VERSION ||
    preview.mode !== "read_only_public_cutover_preview" ||
    preview.mutationBoundary.writeCount !== 0 ||
    preview.mutationBoundary.approvalCreated ||
    preview.mutationBoundary.deploymentStarted ||
    preview.mutationBoundary.trafficMoved ||
    preview.mutationBoundary.recordsChanged ||
    !preview.activation.previewOnly ||
    preview.activation.variablesChanged ||
    preview.activation.deploymentStarted ||
    preview.activation.trafficMoved ||
    !preview.activation.productionRouteBatchesRequired ||
    !preview.activation.productionNoTrafficDeploymentRequired ||
    preview.rollback.writeCount !== 0 ||
    preview.rollback.deletesCmsRecords ||
    !preview.rollback.preservesCmsRecords
  ) {
    errors.push("Public cutover preview must remain zero-mutation and production-route-gated.");
  }
  if (
    preview.fingerprint.algorithm !== "sha256" ||
    preview.fingerprint.canonicalization !== "recursive_sorted_keys" ||
    fingerprint(unsigned) !== preview.fingerprint.value
  ) {
    errors.push("The public cutover preview fingerprint is invalid.");
  }
  errors.push(
    ...validateKnowledgeCmsPublicCutoverApprovalControl(
      preview.approvalControl,
    ),
  );
  const internallyReady = preview.checks.every(
    (item) => item.status === "pass",
  );
  if (
    preview.eligibility !==
    (internallyReady ? "ready_for_admin_approval" : "blocked")
  ) {
    errors.push("Public cutover eligibility does not match its checks.");
  }
  const receiptVariable = preview.activation.variables.find((value) =>
    value.startsWith(
      "KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_RECEIPT=",
    ),
  );
  const routeVariable = preview.activation.variables.find((value) =>
    value.startsWith("KNOWLEDGE_CMS_PUBLIC_CUTOVER_ROUTES="),
  );
  if (
    preview.activation.variables.length !== 9 ||
    receiptVariable !==
      `KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_RECEIPT=${getKnowledgeCmsPublicCutoverReceipt(preview.approvalControl)}` ||
    routeVariable !==
      "KNOWLEDGE_CMS_PUBLIC_CUTOVER_ROUTES=<one-or-more-governed-entry-ids>" ||
    preview.monitoring.routeCount !== 22 ||
    preview.monitoring.outcomes.join(",") !==
      "cms_candidate,static_fallback"
  ) {
    errors.push("The public cutover activation or monitoring plan is incomplete.");
  }
  return [...new Set(errors)];
}

export function buildKnowledgeCmsPublicCutoverApproval(input: {
  actor: KnowledgeCmsActor;
  control: KnowledgeCmsPublicCutoverApprovalControl;
  approvedAt: Date;
}): KnowledgeCmsPublicCutoverApproval {
  assertKnowledgeCmsActionAllowed(input.actor, "approve_public_cutover");
  const controlErrors = validateKnowledgeCmsPublicCutoverApprovalControl(
    input.control,
    input.approvedAt,
  );
  if (
    controlErrors.length > 0 ||
    input.control.evidence.recordsVerified !== 45 ||
    input.control.evidence.routesVerified !== 22 ||
    input.control.routes.length !== 22 ||
    !identifierPattern.test(input.actor.id)
  ) {
    throw new Error(
      controlErrors.join(" ") || "Public cutover approval actor is invalid.",
    );
  }
  const unsigned: UnsignedApproval = {
    version: KNOWLEDGE_CMS_PUBLIC_CUTOVER_VERSION,
    id: input.control.id,
    status: "approved",
    control: input.control,
    audit: {
      approvedAt: input.approvedAt.toISOString(),
      approvedBy: input.actor.id,
    },
    rollout: {
      trafficMoved: false,
      deploymentStarted: false,
      executionAuthority: false,
      publicRoutingAuthority: "requires_matching_runtime_receipt",
    },
  };
  return deepFreeze({
    ...unsigned,
    fingerprint: {
      algorithm: "sha256",
      canonicalization: "recursive_sorted_keys",
      value: fingerprint(unsigned),
    },
  });
}

export function validateKnowledgeCmsPublicCutoverApproval(
  approval: KnowledgeCmsPublicCutoverApproval,
  receipt: string,
  now: Date,
): string[] {
  const errors = validateKnowledgeCmsPublicCutoverApprovalControl(
    approval.control,
    now,
  );
  const unsigned = Object.fromEntries(
    Object.entries(approval).filter(([key]) => key !== "fingerprint"),
  ) as UnsignedApproval;
  if (
    approval.version !== KNOWLEDGE_CMS_PUBLIC_CUTOVER_VERSION ||
    approval.id !== approval.control.id ||
    approval.status !== "approved" ||
    approval.id !== `public-cutover--${receipt}` ||
    approval.control.evidence.recordsVerified !== 45 ||
    approval.control.evidence.routesVerified !== 22 ||
    approval.control.routes.length !== 22 ||
    approval.rollout.trafficMoved ||
    approval.rollout.deploymentStarted ||
    approval.rollout.executionAuthority ||
    approval.rollout.publicRoutingAuthority !==
      "requires_matching_runtime_receipt" ||
    !identifierPattern.test(approval.audit.approvedBy) ||
    Number.isNaN(new Date(approval.audit.approvedAt).getTime()) ||
    approval.fingerprint.algorithm !== "sha256" ||
    approval.fingerprint.canonicalization !== "recursive_sorted_keys" ||
    fingerprint(unsigned) !== approval.fingerprint.value
  ) {
    errors.push("The stored public cutover approval is invalid or does not match the runtime receipt.");
  }
  return [...new Set(errors)];
}

export function parseKnowledgeCmsPublicCutoverApproval(
  value: unknown,
  receipt: string,
  now: Date,
): KnowledgeCmsPublicCutoverApproval {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Stored public cutover approval is invalid.");
  }
  const approval = value as KnowledgeCmsPublicCutoverApproval;
  const errors = validateKnowledgeCmsPublicCutoverApproval(
    approval,
    receipt,
    now,
  );
  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }
  return deepFreeze(structuredClone(approval));
}
