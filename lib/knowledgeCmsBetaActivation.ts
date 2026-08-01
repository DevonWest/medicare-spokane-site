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
import { resolveKnowledgeCmsPublicRendererMode } from "./knowledgeCmsRendererContract";

export const KNOWLEDGE_CMS_BETA_ACTIVATION_PREVIEW_VERSION = 3 as const;
export const KNOWLEDGE_CMS_BETA_ACTIVATION_WRITE_COUNT = 0 as const;
export const KNOWLEDGE_CMS_BETA_READINESS_MAX_AGE_MS = 5 * 60 * 1_000;
export const KNOWLEDGE_CMS_BETA_SITE_ENVIRONMENT = "staging" as const;
export const KNOWLEDGE_CMS_BETA_SITE_ORIGIN =
  "https://beta.medicareinspokane.com" as const;

type JsonObject = Record<string, unknown>;

export interface KnowledgeCmsBetaDeploymentInput {
  siteEnvironment?: string;
  siteUrl?: string;
}

export type KnowledgeCmsBetaActivationCheckStatus = "blocked" | "pass";

export interface KnowledgeCmsBetaActivationCheck {
  code:
    | "beta_environment"
    | "beta_origin"
    | "migration_scope"
    | "operational_readiness"
    | "public_static_guard"
    | "readiness_fingerprint"
    | "readiness_freshness"
    | "rollback_contract"
    | "shadow_target"
    | "zero_mutation_boundary";
  area:
    | "activation"
    | "environment"
    | "readiness"
    | "rollback"
    | "safety";
  status: KnowledgeCmsBetaActivationCheckStatus;
  detail: string;
}

export interface KnowledgeCmsBetaActivationVariablePlan {
  name:
    | "KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED"
    | "KNOWLEDGE_CMS_ENABLED"
    | "KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED"
    | "KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE"
    | "KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED";
  current:
    | "cutover"
    | "false"
    | "invalid"
    | "shadow"
    | "static"
    | "true";
  proposed: "false" | "shadow" | "true";
  changeRequired: boolean;
  scope: "beta_only";
  effect: string;
}

export interface KnowledgeCmsBetaActivationStep {
  order: number;
  code:
    | "capture_fresh_receipts"
    | "configure_beta_only"
    | "deploy_isolated_beta_revision"
    | "verify_private_boundaries"
    | "verify_public_static_parity";
  action: string;
  expectedEvidence: string;
}

export interface KnowledgeCmsBetaRollbackStep {
  order: number;
  code:
    | "disable_article_execution"
    | "disable_private_shadow"
    | "deploy_beta_rollback_configuration"
    | "disable_private_cms_if_needed"
    | "restore_known_good_beta_revision";
  action: string;
  expectedEvidence: string;
}

export interface KnowledgeCmsBetaActivationPreview {
  version: typeof KNOWLEDGE_CMS_BETA_ACTIVATION_PREVIEW_VERSION;
  mode: "read_only_beta_activation_preview";
  observedAt: string;
  eligibility: "blocked" | "ready_for_private_beta_activation";
  environment: {
    target: "beta";
    expectedSiteEnvironment: typeof KNOWLEDGE_CMS_BETA_SITE_ENVIRONMENT;
    expectedSiteOrigin: typeof KNOWLEDGE_CMS_BETA_SITE_ORIGIN;
    observedSiteEnvironment:
      | "other_or_missing"
      | "production"
      | "staging";
    observedSiteOrigin:
      | "beta"
      | "other_or_invalid"
      | "production";
    verified: boolean;
  };
  readinessBinding: {
    version: number;
    observedAt: string;
    ageMilliseconds: number | null;
    maximumAgeMilliseconds: typeof KNOWLEDGE_CMS_BETA_READINESS_MAX_AGE_MS;
    overall: KnowledgeCmsOperationalReadinessReport["overall"];
    fingerprint: string;
    valid: boolean;
    fresh: boolean;
  };
  checks: KnowledgeCmsBetaActivationCheck[];
  activation: {
    type: "preview_only";
    target: "beta";
    variables: KnowledgeCmsBetaActivationVariablePlan[];
    steps: KnowledgeCmsBetaActivationStep[];
    changesRequired: number;
    deploymentStarted: false;
    variablesChanged: false;
    executionAuthorized: false;
    productionAuthorized: false;
  };
  rollback: {
    status: "contract_defined";
    target: "beta";
    triggers: ReadonlyArray<{
      code:
        | "authorization_failure"
        | "evidence_drift"
        | "migration_boundary_violation"
        | "private_shadow_mismatch"
        | "public_route_drift"
        | "seo_boundary_change";
      detail: string;
    }>;
    steps: KnowledgeCmsBetaRollbackStep[];
    verification: readonly string[];
    preservesCmsRecords: true;
    deletesCmsRecords: false;
    publicSource: "verified_static_route";
    writeCount: typeof KNOWLEDGE_CMS_BETA_ACTIVATION_WRITE_COUNT;
    executed: false;
  };
  publicSafety: {
    effectiveRendererMode: "static";
    cmsBodyPubliclyRendered: false;
    indexingChanged: false;
    sitemapChanged: false;
    publicRoutesChanged: false;
    publicCutoverEligible: false;
  };
  mutationBoundary: {
    additionalReads: 0;
    writeCount: typeof KNOWLEDGE_CMS_BETA_ACTIVATION_WRITE_COUNT;
    rolesChanged: false;
    cmsRecordsChanged: false;
    deploymentVariablesChanged: false;
    deploymentStarted: false;
    trafficChanged: false;
  };
  fingerprint: {
    algorithm: "sha256";
    canonicalization: "recursive_sorted_keys";
    value: string;
  };
}

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
  code: KnowledgeCmsBetaActivationCheck["code"],
  area: KnowledgeCmsBetaActivationCheck["area"],
  status: KnowledgeCmsBetaActivationCheckStatus,
  detail: string,
): KnowledgeCmsBetaActivationCheck {
  return { code, area, status, detail };
}

function classifySiteEnvironment(
  value: string | undefined,
): KnowledgeCmsBetaActivationPreview["environment"]["observedSiteEnvironment"] {
  if (value === KNOWLEDGE_CMS_BETA_SITE_ENVIRONMENT) {
    return "staging";
  }
  return value === "production" ? "production" : "other_or_missing";
}

function classifySiteOrigin(
  value: string | undefined,
): KnowledgeCmsBetaActivationPreview["environment"]["observedSiteOrigin"] {
  if (!value) {
    return "other_or_invalid";
  }
  try {
    const parsed = new URL(value);
    const cleanOrigin = Boolean(
      parsed.protocol === "https:" &&
        parsed.username === "" &&
        parsed.password === "" &&
        parsed.pathname === "/" &&
        parsed.search === "" &&
        parsed.hash === "",
    );
    if (!cleanOrigin) {
      return "other_or_invalid";
    }
    if (parsed.origin === KNOWLEDGE_CMS_BETA_SITE_ORIGIN) {
      return "beta";
    }
    if (
      parsed.origin === "https://www.medicareinspokane.com" ||
      parsed.origin === "https://medicareinspokane.com"
    ) {
      return "production";
    }
    return "other_or_invalid";
  } catch {
    return "other_or_invalid";
  }
}

function gateValue(
  state: KnowledgeCmsOperationalReadinessReport["configuration"]["cmsGate"],
): "false" | "invalid" | "true" {
  return state === "enabled"
    ? "true"
    : state === "disabled"
      ? "false"
      : "invalid";
}

const activationSteps: KnowledgeCmsBetaActivationStep[] = [
  {
    order: 1,
    code: "capture_fresh_receipts",
    action:
      "Refresh the operational-readiness report and this preview immediately before the change; require both newly issued receipts to remain ready and record their SHA-256 values.",
    expectedEvidence:
      "Fresh, valid readiness and beta-preview receipts with no blocked checks.",
  },
  {
    order: 2,
    code: "configure_beta_only",
    action:
      "Apply only the proposed Knowledge CMS values to the beta deployment configuration; do not edit production variables.",
    expectedEvidence:
      "The proposed beta configuration has exact true/false values and private shadow while the effective public renderer remains static.",
  },
  {
    order: 3,
    code: "deploy_isolated_beta_revision",
    action:
      "Deploy one new beta Cloud Run revision without routing production traffic or changing production configuration.",
    expectedEvidence:
      "Only beta.medicareinspokane.com serves the new revision; the production service and traffic remain untouched.",
  },
  {
    order: 4,
    code: "verify_private_boundaries",
    action:
      "Verify publisher/admin authentication, the readiness page, one-record execution controls when required, and the private shadow workspace.",
    expectedEvidence:
      "Unauthorized access fails closed, permitted private routes are noindex/no-store, and the private workflow exposes no bulk or public action.",
  },
  {
    order: 5,
    code: "verify_public_static_parity",
    action:
      "Verify all 22 governed Resource Library routes plus the protected homepage and /medicare-spokane against their static parity evidence.",
    expectedEvidence:
      "Public HTML, metadata, canonicals, schema, forms, FAQ disclosures, sitemap, and beta robots policy remain unchanged.",
  },
];

const rollbackTriggers: KnowledgeCmsBetaActivationPreview["rollback"]["triggers"] = [
  {
    code: "evidence_drift",
    detail:
      "A readiness, control, source, review, lock, audit, or verification receipt becomes blocked, stale, malformed, or unavailable.",
  },
  {
    code: "authorization_failure",
    detail:
      "Reviewer verification, Firebase project alignment, session refresh, or least-privilege access fails.",
  },
  {
    code: "private_shadow_mismatch",
    detail:
      "Any private candidate differs in rendered body, metadata, canonical, schema, form, FAQ, or capability evidence.",
  },
  {
    code: "migration_boundary_violation",
    detail:
      "A migration attempt exceeds one explicitly confirmed private draft or produces an unexpected artifact.",
  },
  {
    code: "public_route_drift",
    detail:
      "Any governed or protected public route differs from its verified static source.",
  },
  {
    code: "seo_boundary_change",
    detail:
      "Indexing, robots, sitemap, canonical, redirect, or public CMS-body behavior changes.",
  },
];

const rollbackSteps: KnowledgeCmsBetaRollbackStep[] = [
  {
    order: 1,
    code: "disable_article_execution",
    action:
      "Set KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED=false, KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED=false, and KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED=false in beta so no further migration draft or rendering artifact can be created.",
    expectedEvidence:
      "Migration preview remains readable to authorized operators, but every execution control is absent.",
  },
  {
    order: 2,
    code: "disable_private_shadow",
    action:
      "Set KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE=static in beta while preserving all CMS records for diagnosis.",
    expectedEvidence:
      "The private shadow route is unavailable and every public route continues from the verified static source.",
  },
  {
    order: 3,
    code: "deploy_beta_rollback_configuration",
    action:
      "Deploy the rollback configuration to the beta service only and keep production traffic untouched.",
    expectedEvidence:
      "A beta revision reports exact static mode, execution disabled, zero public-renderer change, and no record deletion.",
  },
  {
    order: 4,
    code: "disable_private_cms_if_needed",
    action:
      "If authentication, authorization, or the broader private workspace remains unsafe, set KNOWLEDGE_CMS_ENABLED=false in beta and redeploy.",
    expectedEvidence:
      "All /admin/knowledge routes return quiet 404 responses while public routes remain available.",
  },
  {
    order: 5,
    code: "restore_known_good_beta_revision",
    action:
      "If the configuration rollback is insufficient, route beta traffic to the last known-good beta Cloud Run revision; never select a production revision or service.",
    expectedEvidence:
      "Beta health, security headers, noindex policy, and protected static routes match the last accepted beta evidence.",
  },
];

const rollbackVerification = Object.freeze([
  "KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED is exact false.",
  "KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED is exact false.",
  "KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE is exact static.",
  "All 22 governed routes still match their verified static rendering, metadata, and indexing evidence.",
  "The homepage, /medicare-spokane, /resources, redirects, sitemap, and beta robots policy are unchanged.",
  "CMS records, locks, audit history, and source evidence remain preserved; rollback performs no data deletion.",
  "If the full CMS gate is disabled, every /admin/knowledge route is a quiet noindex/no-store 404.",
]);

export function buildKnowledgeCmsBetaActivationPreview(input: {
  actor: KnowledgeCmsActor;
  readiness: KnowledgeCmsOperationalReadinessReport;
  deployment: KnowledgeCmsBetaDeploymentInput;
  observedAt: Date;
}): KnowledgeCmsBetaActivationPreview {
  assertKnowledgeCmsActionAllowed(input.actor, "preview_migration");
  if (Number.isNaN(input.observedAt.getTime())) {
    throw new Error("Knowledge CMS beta activation preview requires a valid server clock.");
  }

  const observedSiteEnvironment = classifySiteEnvironment(
    input.deployment.siteEnvironment,
  );
  const observedSiteOrigin = classifySiteOrigin(input.deployment.siteUrl);
  const environmentVerified = Boolean(
    observedSiteEnvironment === "staging" && observedSiteOrigin === "beta",
  );
  const readinessErrors = validateKnowledgeCmsOperationalReadinessReport(
    input.readiness,
  );
  const readinessObservedAt = new Date(input.readiness.observedAt);
  const ageMilliseconds = Number.isNaN(readinessObservedAt.getTime())
    ? null
    : input.observedAt.getTime() - readinessObservedAt.getTime();
  const readinessFresh = Boolean(
    ageMilliseconds !== null &&
      ageMilliseconds >= 0 &&
      ageMilliseconds <= KNOWLEDGE_CMS_BETA_READINESS_MAX_AGE_MS,
  );
  const readinessValid = readinessErrors.length === 0;
  const readinessReady =
    input.readiness.overall === "ready_for_guarded_private_operations";
  const migrationReady = Boolean(
    input.readiness.migration.status === "available" &&
      input.readiness.migration.targets.total === 45 &&
      input.readiness.migration.inventory.articles === 22 &&
      input.readiness.migration.inventory.topics === 12 &&
      input.readiness.migration.inventory.faqs === 11 &&
      input.readiness.migration.targets.blocked === 0 &&
      input.readiness.migration.evidence.ready &&
      input.readiness.capabilities.allRecordsMigration !== "blocked" &&
      input.readiness.capabilities.singleRecordArticleMigration !== "blocked" &&
      input.readiness.capabilities.singleRecordSupportingMigration !== "blocked",
  );
  const targetRenderer = resolveKnowledgeCmsPublicRendererMode("shadow");
  const shadowTargetSafe = Boolean(
    targetRenderer.configurationValid &&
      targetRenderer.requestedMode === "shadow" &&
      targetRenderer.privateShadowEnabled &&
      targetRenderer.effectiveMode === "static" &&
      !targetRenderer.activationAllowed,
  );
  const currentRendererAllowed = ["static", "shadow"].includes(
    input.readiness.configuration.renderer.requestedMode,
  );
  const publicStaticSafe = Boolean(
    currentRendererAllowed &&
      input.readiness.publicSafety.effectiveRendererMode === "static" &&
      !input.readiness.publicSafety.cmsBodyPubliclyRendered &&
      !input.readiness.publicSafety.indexingChanged &&
      !input.readiness.publicSafety.sitemapChanged &&
      !input.readiness.publicSafety.publicCutoverEligible &&
      input.readiness.capabilities.publicCutover === "prohibited",
  );
  const rollbackContractReady = Boolean(
    rollbackSteps.length === 5 &&
      rollbackTriggers.length === 6 &&
      rollbackVerification.length === 7,
  );

  const checks: KnowledgeCmsBetaActivationCheck[] = [
    check(
      "beta_environment",
      "environment",
      observedSiteEnvironment === "staging" ? "pass" : "blocked",
      observedSiteEnvironment === "staging"
        ? "The deployment reports the exact staging site environment required for beta."
        : "Activation preview is blocked outside the exact staging site environment.",
    ),
    check(
      "beta_origin",
      "environment",
      observedSiteOrigin === "beta" ? "pass" : "blocked",
      observedSiteOrigin === "beta"
        ? `The deployment origin is exactly ${KNOWLEDGE_CMS_BETA_SITE_ORIGIN}.`
        : "Activation preview is blocked outside the canonical beta origin.",
    ),
    check(
      "readiness_fingerprint",
      "readiness",
      readinessValid ? "pass" : "blocked",
      readinessValid
        ? "The bound operational-readiness SHA-256 and zero-write invariants are valid."
        : "The bound operational-readiness receipt is invalid or violates its safety contract.",
    ),
    check(
      "readiness_freshness",
      "readiness",
      readinessFresh ? "pass" : "blocked",
      readinessFresh
        ? `The readiness receipt is ${ageMilliseconds} ms old and within the five-minute activation window.`
        : "The readiness receipt is stale, future-dated, or has an invalid server timestamp.",
    ),
    check(
      "operational_readiness",
      "readiness",
      readinessReady ? "pass" : "blocked",
      readinessReady
        ? "Operational readiness permits guarded private operations only."
        : "Operational readiness contains one or more blocking findings.",
    ),
    check(
      "migration_scope",
      "readiness",
      migrationReady ? "pass" : "blocked",
      migrationReady
        ? "All 45 governed targets have prepared or verified one-record migration evidence with no blocked target."
        : "Article, topic, or FAQ inventory, evidence, or one-record execution boundaries are incomplete.",
    ),
    check(
      "shadow_target",
      "activation",
      shadowTargetSafe ? "pass" : "blocked",
      shadowTargetSafe
        ? "The proposed shadow value enables only private comparison; the effective public renderer remains static."
        : "The proposed renderer configuration does not preserve the private-only shadow contract.",
    ),
    check(
      "public_static_guard",
      "safety",
      publicStaticSafe ? "pass" : "blocked",
      publicStaticSafe
        ? "The current receipt preserves the static public source, indexing, sitemap, and cutover prohibitions."
        : "Current renderer or public-safety evidence is invalid, cutover-requested, or incomplete.",
    ),
    check(
      "rollback_contract",
      "rollback",
      rollbackContractReady ? "pass" : "blocked",
      rollbackContractReady
        ? "The ordered beta-only rollback includes execution stop, static fallback, full private disable, known-good revision recovery, and verification."
        : "The deterministic rollback checklist is incomplete.",
    ),
    check(
      "zero_mutation_boundary",
      "safety",
      "pass",
      "This preview performs no additional read, write, role, record, variable, deployment, traffic, indexing, or public-route mutation.",
    ),
  ];
  const eligibility: KnowledgeCmsBetaActivationPreview["eligibility"] =
    environmentVerified && checks.every((item) => item.status === "pass")
      ? "ready_for_private_beta_activation"
      : "blocked";

  const articleExecutionProposed =
    input.readiness.capabilities.singleRecordArticleMigration === "complete"
      ? "false" as const
      : "true" as const;
  const supportingExecutionProposed =
    input.readiness.capabilities.singleRecordSupportingMigration === "complete"
      ? "false" as const
      : "true" as const;
  const variables: KnowledgeCmsBetaActivationVariablePlan[] = [
    {
      name: "KNOWLEDGE_CMS_ENABLED",
      current: gateValue(input.readiness.configuration.cmsGate),
      proposed: "true",
      changeRequired:
        gateValue(input.readiness.configuration.cmsGate) !== "true",
      scope: "beta_only",
      effect: "Keep the authenticated private workspace available on beta only.",
    },
    {
      name: "KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED",
      current: gateValue(
        input.readiness.configuration.articleMigrationExecutionGate,
      ),
      proposed: articleExecutionProposed,
      changeRequired:
        gateValue(
          input.readiness.configuration.articleMigrationExecutionGate,
        ) !== articleExecutionProposed,
      scope: "beta_only",
      effect:
        articleExecutionProposed === "true"
          ? "Permit only the existing explicitly confirmed, one-record private-draft transaction."
          : "Keep article migration execution disabled because every target is already verified.",
    },
    {
      name: "KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED",
      current: gateValue(
        input.readiness.configuration.supportingMigrationExecutionGate,
      ),
      proposed: supportingExecutionProposed,
      changeRequired:
        gateValue(
          input.readiness.configuration.supportingMigrationExecutionGate,
        ) !== supportingExecutionProposed,
      scope: "beta_only",
      effect:
        supportingExecutionProposed === "true"
          ? "Permit only the explicitly confirmed, one-record topic or FAQ private-draft transaction."
          : "Keep topic and FAQ migration execution disabled because every supporting target is already verified.",
    },
    {
      name: "KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED",
      current: gateValue(
        input.readiness.configuration.nativeRepresentationExecutionGate,
      ),
      proposed: "true",
      changeRequired:
        gateValue(
          input.readiness.configuration.nativeRepresentationExecutionGate,
        ) !== "true",
      scope: "beta_only",
      effect:
        "Permit only one explicitly confirmed, immutable private rendering artifact for a matching published article revision.",
    },
    {
      name: "KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE",
      current: input.readiness.configuration.renderer.requestedMode,
      proposed: "shadow",
      changeRequired:
        input.readiness.configuration.renderer.requestedMode !== "shadow",
      scope: "beta_only",
      effect:
        "Expose authenticated private comparison only; the effective public renderer remains static.",
    },
  ];

  const unsigned = {
    version: KNOWLEDGE_CMS_BETA_ACTIVATION_PREVIEW_VERSION,
    mode: "read_only_beta_activation_preview" as const,
    observedAt: input.observedAt.toISOString(),
    eligibility,
    environment: {
      target: "beta" as const,
      expectedSiteEnvironment: KNOWLEDGE_CMS_BETA_SITE_ENVIRONMENT,
      expectedSiteOrigin: KNOWLEDGE_CMS_BETA_SITE_ORIGIN,
      observedSiteEnvironment,
      observedSiteOrigin,
      verified: environmentVerified,
    },
    readinessBinding: {
      version: input.readiness.version,
      observedAt: input.readiness.observedAt,
      ageMilliseconds,
      maximumAgeMilliseconds: KNOWLEDGE_CMS_BETA_READINESS_MAX_AGE_MS,
      overall: input.readiness.overall,
      fingerprint: input.readiness.fingerprint.value,
      valid: readinessValid,
      fresh: readinessFresh,
    },
    checks,
    activation: {
      type: "preview_only" as const,
      target: "beta" as const,
      variables,
      steps: activationSteps,
      changesRequired: variables.filter((item) => item.changeRequired).length,
      deploymentStarted: false as const,
      variablesChanged: false as const,
      executionAuthorized: false as const,
      productionAuthorized: false as const,
    },
    rollback: {
      status: "contract_defined" as const,
      target: "beta" as const,
      triggers: rollbackTriggers,
      steps: rollbackSteps,
      verification: rollbackVerification,
      preservesCmsRecords: true as const,
      deletesCmsRecords: false as const,
      publicSource: "verified_static_route" as const,
      writeCount: KNOWLEDGE_CMS_BETA_ACTIVATION_WRITE_COUNT,
      executed: false as const,
    },
    publicSafety: {
      effectiveRendererMode: "static" as const,
      cmsBodyPubliclyRendered: false as const,
      indexingChanged: false as const,
      sitemapChanged: false as const,
      publicRoutesChanged: false as const,
      publicCutoverEligible: false as const,
    },
    mutationBoundary: {
      additionalReads: 0 as const,
      writeCount: KNOWLEDGE_CMS_BETA_ACTIVATION_WRITE_COUNT,
      rolesChanged: false as const,
      cmsRecordsChanged: false as const,
      deploymentVariablesChanged: false as const,
      deploymentStarted: false as const,
      trafficChanged: false as const,
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

export function validateKnowledgeCmsBetaActivationPreview(
  preview: KnowledgeCmsBetaActivationPreview,
  readiness?: KnowledgeCmsOperationalReadinessReport,
): string[] {
  const errors: string[] = [];
  const unsigned = Object.fromEntries(
    Object.entries(preview).filter(([key]) => key !== "fingerprint"),
  );
  if (
    preview.fingerprint.algorithm !== "sha256" ||
    preview.fingerprint.canonicalization !== "recursive_sorted_keys" ||
    !/^[a-f0-9]{64}$/.test(preview.fingerprint.value) ||
    fingerprint(unsigned) !== preview.fingerprint.value
  ) {
    errors.push("The beta activation preview fingerprint is invalid.");
  }
  if (
    preview.version !== KNOWLEDGE_CMS_BETA_ACTIVATION_PREVIEW_VERSION ||
    preview.mode !== "read_only_beta_activation_preview" ||
    preview.environment.target !== "beta" ||
    preview.activation.type !== "preview_only" ||
    preview.activation.target !== "beta" ||
    preview.activation.deploymentStarted ||
    preview.activation.variablesChanged ||
    preview.activation.executionAuthorized ||
    preview.activation.productionAuthorized ||
    preview.rollback.target !== "beta" ||
    preview.rollback.executed ||
    preview.rollback.writeCount !== 0 ||
    preview.rollback.deletesCmsRecords ||
    !preview.rollback.preservesCmsRecords ||
    preview.mutationBoundary.additionalReads !== 0 ||
    preview.mutationBoundary.writeCount !== 0 ||
    preview.mutationBoundary.rolesChanged ||
    preview.mutationBoundary.cmsRecordsChanged ||
    preview.mutationBoundary.deploymentVariablesChanged ||
    preview.mutationBoundary.deploymentStarted ||
    preview.mutationBoundary.trafficChanged ||
    preview.publicSafety.effectiveRendererMode !== "static" ||
    preview.publicSafety.cmsBodyPubliclyRendered ||
    preview.publicSafety.indexingChanged ||
    preview.publicSafety.sitemapChanged ||
    preview.publicSafety.publicRoutesChanged ||
    preview.publicSafety.publicCutoverEligible
  ) {
    errors.push(
      "Beta activation preview must remain beta-only, preview-only, zero-mutation, static-public, non-indexing, and ineligible for cutover.",
    );
  }
  if (
    preview.environment.expectedSiteEnvironment !==
      KNOWLEDGE_CMS_BETA_SITE_ENVIRONMENT ||
    preview.environment.expectedSiteOrigin !== KNOWLEDGE_CMS_BETA_SITE_ORIGIN ||
    preview.environment.verified !==
      (preview.environment.observedSiteEnvironment === "staging" &&
        preview.environment.observedSiteOrigin === "beta")
  ) {
    errors.push(
      "The beta activation environment binding is internally inconsistent.",
    );
  }
  const internallyReady = Boolean(
    preview.environment.verified &&
      preview.readinessBinding.valid &&
      preview.readinessBinding.fresh &&
      preview.readinessBinding.overall ===
        "ready_for_guarded_private_operations" &&
      preview.checks.every((item) => item.status === "pass"),
  );
  if (
    preview.eligibility !==
    (internallyReady ? "ready_for_private_beta_activation" : "blocked")
  ) {
    errors.push(
      "Beta activation eligibility does not match the environment, readiness, and check evidence.",
    );
  }
  if (readiness) {
    if (
      validateKnowledgeCmsOperationalReadinessReport(readiness).length > 0 ||
      preview.readinessBinding.version !== readiness.version ||
      preview.readinessBinding.observedAt !== readiness.observedAt ||
      preview.readinessBinding.overall !== readiness.overall ||
      preview.readinessBinding.fingerprint !== readiness.fingerprint.value
    ) {
      errors.push(
        "The beta activation preview is not bound to the supplied operational-readiness receipt.",
      );
    }
    if (
      preview.activation.variables.find(
        (item) =>
          item.name ===
          "KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED",
      )?.proposed !==
        (readiness.capabilities.singleRecordArticleMigration === "complete"
          ? "false"
          : "true") ||
      preview.activation.variables.find(
        (item) =>
          item.name ===
          "KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED",
      )?.proposed !==
        (readiness.capabilities.singleRecordSupportingMigration === "complete"
          ? "false"
          : "true")
    ) {
      errors.push(
        "The beta activation execution gates do not match the bound 45-record completion state.",
      );
    }
  }
  const variableNames = preview.activation.variables.map((item) => item.name);
  if (
    new Set(variableNames).size !== 5 ||
    !variableNames.includes("KNOWLEDGE_CMS_ENABLED") ||
    !variableNames.includes(
      "KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED",
    ) ||
    !variableNames.includes(
      "KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED",
    ) ||
    !variableNames.includes(
      "KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED",
    ) ||
    !variableNames.includes("KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE") ||
    preview.activation.variables.some((item) => item.scope !== "beta_only") ||
    preview.activation.variables.find(
      (item) => item.name === "KNOWLEDGE_CMS_ENABLED",
    )?.proposed !== "true" ||
    preview.activation.variables.find(
      (item) => item.name === "KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE",
    )?.proposed !== "shadow" ||
    preview.activation.variables.find(
      (item) =>
        item.name ===
        "KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED",
    )?.proposed !== "true" ||
    !["true", "false"].includes(
      preview.activation.variables.find(
        (item) =>
          item.name ===
          "KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED",
      )?.proposed ?? "",
    ) ||
    !["true", "false"].includes(
      preview.activation.variables.find(
        (item) =>
          item.name ===
          "KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED",
      )?.proposed ?? "",
    )
  ) {
    errors.push("The beta-only activation variable plan is incomplete.");
  }
  const rollbackCodes = new Set(preview.rollback.steps.map((item) => item.code));
  if (
    preview.rollback.steps.length !== 5 ||
    !rollbackCodes.has("disable_article_execution") ||
    !rollbackCodes.has("disable_private_shadow") ||
    !rollbackCodes.has("deploy_beta_rollback_configuration") ||
    !rollbackCodes.has("disable_private_cms_if_needed") ||
    !rollbackCodes.has("restore_known_good_beta_revision") ||
    preview.rollback.verification.length !== 7
  ) {
    errors.push("The beta rollback contract is incomplete.");
  }
  return errors;
}
