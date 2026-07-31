import "server-only";

import { createHash } from "node:crypto";
import {
  editorialReviewerVerifications,
  resolveCurrentEditorialReviewerVerification,
  type EditorialReviewerVerification,
} from "./editorial";
import {
  assertKnowledgeCmsActionAllowed,
  type KnowledgeCmsActor,
  type KnowledgeCmsRole,
} from "./knowledgeCms";
import { resolveKnowledgeCmsActor } from "./knowledgeCmsAdminAuth";
import type { KnowledgeCmsMigrationWorkspacePreview } from "./knowledgeCmsMigrationDal";
import type {
  KnowledgeCmsArticleMigrationPostCreateVerification,
} from "./knowledgeCmsArticleMigrationVerification";
import type { KnowledgeCmsRendererModeResolution } from "./knowledgeCmsRendererContract";

export const KNOWLEDGE_CMS_OPERATIONAL_READINESS_VERSION = 1 as const;
export const KNOWLEDGE_CMS_OPERATIONAL_READINESS_WRITE_COUNT = 0 as const;
export const KNOWLEDGE_CMS_ROLE_DIRECTORY_PAGE_SIZE = 1_000 as const;
export const KNOWLEDGE_CMS_ROLE_DIRECTORY_MAX_PAGES = 100 as const;

const cmsRoles: readonly KnowledgeCmsRole[] = [
  "author",
  "editor",
  "reviewer",
  "publisher",
  "admin",
];
const intentionalPublicCutoverBlocker =
  "article_body_representation_blocked";

type JsonObject = Record<string, unknown>;

export type KnowledgeCmsBooleanGateState =
  | "disabled"
  | "enabled"
  | "invalid";

export interface KnowledgeCmsOperationalConfiguration {
  cmsGate: KnowledgeCmsBooleanGateState;
  articleMigrationExecutionGate: KnowledgeCmsBooleanGateState;
  renderer: KnowledgeCmsRendererModeResolution;
  firebase: {
    adminConfigured: boolean;
    browserAuthConfigured: boolean;
    projectAlignment: "matched" | "mismatch" | "unverifiable";
  };
}

export interface KnowledgeCmsRoleDirectoryUser {
  uid: string;
  emailVerified: boolean;
  disabled: boolean;
  customClaims?: Record<string, unknown>;
}

export interface KnowledgeCmsRoleDirectoryPage {
  users: ReadonlyArray<KnowledgeCmsRoleDirectoryUser>;
  pageToken?: string;
}

export interface KnowledgeCmsRoleDirectoryProvider {
  listUsers(
    maxResults?: number,
    pageToken?: string,
  ): Promise<KnowledgeCmsRoleDirectoryPage>;
}

export interface KnowledgeCmsRoleDirectorySnapshot {
  status: "complete" | "unavailable";
  failureReason?:
    | "directory_read_failed"
    | "duplicate_user"
    | "invalid_pagination"
    | "page_limit_exceeded";
  pagesRead: number;
  accountsScanned: number;
  accountsWithCmsClaims: number;
  activeRoleAccounts: number;
  invalidClaimAccounts: number;
  disabledClaimAccounts: number;
  unverifiedClaimAccounts: number;
  roleCounts: Record<KnowledgeCmsRole, number>;
  capabilities: {
    authoringAccounts: number;
    reviewerClaimAccounts: number;
    verifiedReviewerAccounts: number;
    publisherAccounts: number;
    reviewerPublisherSeparationReady: boolean;
  };
  writeCount: 0;
}

export interface KnowledgeCmsOperationalVerificationRead {
  recordId: string;
  status: "available" | "missing" | "unavailable";
  result?: KnowledgeCmsArticleMigrationPostCreateVerification;
}

export type KnowledgeCmsOperationalWorkspaceEvidence =
  | {
      status: "available";
      workspace: KnowledgeCmsMigrationWorkspacePreview;
      verifications: KnowledgeCmsOperationalVerificationRead[];
    }
  | {
      status: "unavailable";
      reason: "firestore_inventory_unavailable";
    };

export type KnowledgeCmsOperationalCheckStatus =
  | "blocked"
  | "not_applicable"
  | "pass"
  | "warning";

export interface KnowledgeCmsOperationalReadinessCheck {
  code:
    | "article_controls"
    | "article_execution_gate"
    | "article_migration_evidence"
    | "cms_feature_gate"
    | "current_operator"
    | "editorial_role_coverage"
    | "firebase_admin"
    | "firebase_browser_auth"
    | "firebase_project_alignment"
    | "post_create_verification"
    | "public_cutover_guard"
    | "renderer_configuration"
    | "role_claim_integrity"
    | "role_directory"
    | "source_and_route_evidence"
    | "zero_write_boundary";
  area: "authentication" | "configuration" | "migration" | "public_safety";
  status: KnowledgeCmsOperationalCheckStatus;
  detail: string;
}

export type KnowledgeCmsOperationalTargetStatus =
  | "blocked"
  | "prepared_absent"
  | "verified_advanced_record"
  | "verified_private_draft";

export interface KnowledgeCmsOperationalTargetEvidence {
  id: string;
  slug: string;
  title: string;
  status: KnowledgeCmsOperationalTargetStatus;
  detail: string;
}

export interface KnowledgeCmsOperationalMigrationSummary {
  status: "available" | "unavailable";
  inventory: {
    total: number;
    articles: number;
    topics: number;
    faqs: number;
  };
  controls: {
    defined: number;
    verified: number;
    fingerprinted: number;
    integrityReady: boolean;
  };
  targets: {
    total: number;
    preparedAbsent: number;
    verifiedPrivateDrafts: number;
    verifiedAdvancedRecords: number;
    blocked: number;
  };
  history: {
    eventsObserved: number;
    validEvents: number;
    invalidEvents: number;
    controlsMismatched: number;
    truncated: boolean;
    duplicateRecordEvents: number;
    unexpectedRecordEvents: number;
  };
  verifications: {
    requested: number;
    available: number;
    missing: number;
    unavailable: number;
    passed: number;
    failed: number;
  };
  evidence: {
    sourceOrRouteBlockers: number;
    publicRepresentationBlockers: number;
    legacyReviewWarnings: number;
    otherWarnings: number;
    ready: boolean;
  };
  targetEvidence: KnowledgeCmsOperationalTargetEvidence[];
}

export interface KnowledgeCmsOperationalReadinessReport {
  version: typeof KNOWLEDGE_CMS_OPERATIONAL_READINESS_VERSION;
  mode: "read_only_operational_readiness";
  observedAt: string;
  overall: "blocked" | "ready_for_guarded_private_operations";
  capabilities: {
    privateWorkspace: "blocked" | "ready";
    editorialWorkflow: "blocked" | "ready";
    singleRecordArticleMigration: "blocked" | "complete" | "ready";
    privateShadow: "available" | "blocked" | "disabled";
    publicCutover: "prohibited";
  };
  configuration: KnowledgeCmsOperationalConfiguration;
  authorization: {
    currentActorRoles: KnowledgeCmsRole[];
    roleDirectory: KnowledgeCmsRoleDirectorySnapshot;
  };
  migration: KnowledgeCmsOperationalMigrationSummary;
  checks: KnowledgeCmsOperationalReadinessCheck[];
  readBoundary: {
    authorizationBeforeReads: true;
    authDirectoryPages: number;
    firestoreInventoryCollectionReads: number;
    firestoreHistoryCollectionReads: number;
    verificationTransactions: number;
    verifiedArtifactReads: number;
    maximumVerificationArtifactReads: number;
    writeCount: typeof KNOWLEDGE_CMS_OPERATIONAL_READINESS_WRITE_COUNT;
    repairAttempted: false;
  };
  publicSafety: {
    publicSource: "verified_static_route";
    effectiveRendererMode: "static";
    cmsBodyPubliclyRendered: false;
    indexingChanged: false;
    sitemapChanged: false;
    bulkExecutionAvailable: false;
    publicCutoverEligible: false;
  };
  fingerprint: {
    algorithm: "sha256";
    canonicalization: "recursive_sorted_keys";
    value: string;
  };
}

function emptyRoleCounts(): Record<KnowledgeCmsRole, number> {
  return {
    author: 0,
    editor: 0,
    reviewer: 0,
    publisher: 0,
    admin: 0,
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

function hasCmsClaims(user: KnowledgeCmsRoleDirectoryUser): boolean {
  return Boolean(
    user.customClaims &&
      (Object.prototype.hasOwnProperty.call(
        user.customClaims,
        "knowledgeCmsRoles",
      ) ||
        Object.prototype.hasOwnProperty.call(
          user.customClaims,
          "knowledgeCmsAgentSlug",
        )),
  );
}

function unavailableRoleDirectory(
  current: Omit<KnowledgeCmsRoleDirectorySnapshot, "status" | "failureReason">,
  failureReason: NonNullable<KnowledgeCmsRoleDirectorySnapshot["failureReason"]>,
): KnowledgeCmsRoleDirectorySnapshot {
  return deepFreeze({
    ...current,
    status: "unavailable",
    failureReason,
  });
}

export async function scanKnowledgeCmsRoleDirectory(
  provider: KnowledgeCmsRoleDirectoryProvider,
  asOf: Date = new Date(),
  reviewerVerifications: EditorialReviewerVerification[] =
    editorialReviewerVerifications,
): Promise<KnowledgeCmsRoleDirectorySnapshot> {
  if (Number.isNaN(asOf.getTime())) {
    throw new Error("Knowledge CMS role readiness requires a valid server clock.");
  }

  const roleCounts = emptyRoleCounts();
  const activeActors: KnowledgeCmsActor[] = [];
  const verifiedReviewers: KnowledgeCmsActor[] = [];
  const publishers: KnowledgeCmsActor[] = [];
  const seenUserIds = new Set<string>();
  const seenPageTokens = new Set<string>();
  let pageToken: string | undefined;
  let pagesRead = 0;
  let accountsScanned = 0;
  let accountsWithCmsClaims = 0;
  let invalidClaimAccounts = 0;
  let disabledClaimAccounts = 0;
  let unverifiedClaimAccounts = 0;

  const current = () => ({
    pagesRead,
    accountsScanned,
    accountsWithCmsClaims,
    activeRoleAccounts: activeActors.length,
    invalidClaimAccounts,
    disabledClaimAccounts,
    unverifiedClaimAccounts,
    roleCounts,
    capabilities: {
      authoringAccounts: activeActors.filter((actor) =>
        actor.roles.some((role) => ["author", "editor", "admin"].includes(role)),
      ).length,
      reviewerClaimAccounts: activeActors.filter((actor) =>
        actor.roles.some((role) => ["reviewer", "admin"].includes(role)),
      ).length,
      verifiedReviewerAccounts: verifiedReviewers.length,
      publisherAccounts: publishers.length,
      reviewerPublisherSeparationReady: verifiedReviewers.some((reviewer) =>
        publishers.some(
          (publisher) =>
            publisher.id !== reviewer.id &&
            (reviewer.agentSlug === undefined ||
              publisher.agentSlug === undefined ||
              publisher.agentSlug !== reviewer.agentSlug),
        ),
      ),
    },
    writeCount: 0 as const,
  });

  for (let pageIndex = 0; pageIndex < KNOWLEDGE_CMS_ROLE_DIRECTORY_MAX_PAGES; pageIndex += 1) {
    let page: KnowledgeCmsRoleDirectoryPage;
    try {
      page = await provider.listUsers(
        KNOWLEDGE_CMS_ROLE_DIRECTORY_PAGE_SIZE,
        pageToken,
      );
    } catch {
      return unavailableRoleDirectory(current(), "directory_read_failed");
    }
    pagesRead += 1;
    if (!Array.isArray(page.users)) {
      return unavailableRoleDirectory(current(), "invalid_pagination");
    }

    for (const user of page.users) {
      if (
        typeof user.uid !== "string" ||
        !user.uid ||
        seenUserIds.has(user.uid)
      ) {
        return unavailableRoleDirectory(current(), "duplicate_user");
      }
      seenUserIds.add(user.uid);
      accountsScanned += 1;
      if (!hasCmsClaims(user)) {
        continue;
      }
      accountsWithCmsClaims += 1;
      if (user.disabled) {
        disabledClaimAccounts += 1;
        continue;
      }
      if (!user.emailVerified) {
        unverifiedClaimAccounts += 1;
        continue;
      }

      let actor: KnowledgeCmsActor;
      try {
        actor = resolveKnowledgeCmsActor(user);
      } catch {
        invalidClaimAccounts += 1;
        continue;
      }
      activeActors.push(actor);
      for (const role of actor.roles) {
        roleCounts[role] += 1;
      }
      if (actor.roles.some((role) => ["publisher", "admin"].includes(role))) {
        publishers.push(actor);
      }
      if (
        actor.agentSlug &&
        actor.roles.some((role) => ["reviewer", "admin"].includes(role)) &&
        resolveCurrentEditorialReviewerVerification(
          actor.agentSlug,
          asOf,
          reviewerVerifications,
        )
      ) {
        verifiedReviewers.push(actor);
      }
    }

    if (page.pageToken === undefined) {
      return deepFreeze({
        ...current(),
        status: "complete" as const,
      });
    }
    if (
      typeof page.pageToken !== "string" ||
      !page.pageToken ||
      seenPageTokens.has(page.pageToken)
    ) {
      return unavailableRoleDirectory(current(), "invalid_pagination");
    }
    seenPageTokens.add(page.pageToken);
    pageToken = page.pageToken;
  }

  return unavailableRoleDirectory(current(), "page_limit_exceeded");
}

function check(
  code: KnowledgeCmsOperationalReadinessCheck["code"],
  area: KnowledgeCmsOperationalReadinessCheck["area"],
  status: KnowledgeCmsOperationalCheckStatus,
  detail: string,
): KnowledgeCmsOperationalReadinessCheck {
  return { code, area, status, detail };
}

function emptyMigrationSummary(): KnowledgeCmsOperationalMigrationSummary {
  return {
    status: "unavailable",
    inventory: { total: 0, articles: 0, topics: 0, faqs: 0 },
    controls: {
      defined: 0,
      verified: 0,
      fingerprinted: 0,
      integrityReady: false,
    },
    targets: {
      total: 0,
      preparedAbsent: 0,
      verifiedPrivateDrafts: 0,
      verifiedAdvancedRecords: 0,
      blocked: 0,
    },
    history: {
      eventsObserved: 0,
      validEvents: 0,
      invalidEvents: 0,
      controlsMismatched: 0,
      truncated: false,
      duplicateRecordEvents: 0,
      unexpectedRecordEvents: 0,
    },
    verifications: {
      requested: 0,
      available: 0,
      missing: 0,
      unavailable: 0,
      passed: 0,
      failed: 0,
    },
    evidence: {
      sourceOrRouteBlockers: 0,
      publicRepresentationBlockers: 0,
      legacyReviewWarnings: 0,
      otherWarnings: 0,
      ready: false,
    },
    targetEvidence: [],
  };
}

function summarizeMigrationEvidence(
  evidence: KnowledgeCmsOperationalWorkspaceEvidence,
): KnowledgeCmsOperationalMigrationSummary {
  if (evidence.status === "unavailable") {
    return emptyMigrationSummary();
  }

  const { preview, articleMaterializationDryRun, executionHistory } =
    evidence.workspace;
  const articleCandidates = preview.candidates.filter(
    (candidate) => candidate.target.kind === "article",
  );
  const candidateById = new Map(
    articleCandidates.map((candidate) => [candidate.target.id, candidate]),
  );
  const historiesByRecordId = new Map<
    string,
    typeof executionHistory.entries
  >();
  for (const entry of executionHistory.entries) {
    historiesByRecordId.set(entry.recordId, [
      ...(historiesByRecordId.get(entry.recordId) ?? []),
      entry,
    ]);
  }
  const verificationByRecordId = new Map<
    string,
    KnowledgeCmsOperationalVerificationRead[]
  >();
  for (const verification of evidence.verifications) {
    verificationByRecordId.set(verification.recordId, [
      ...(verificationByRecordId.get(verification.recordId) ?? []),
      verification,
    ]);
  }

  const targetIds = new Set(
    articleMaterializationDryRun.receipts.map((receipt) => receipt.target.id),
  );
  const duplicateRecordEvents = [...historiesByRecordId.values()].filter(
    (entries) => entries.length !== 1,
  ).length;
  const unexpectedRecordEvents = executionHistory.entries.filter(
    (entry) => !targetIds.has(entry.recordId),
  ).length;
  const targetEvidence: KnowledgeCmsOperationalTargetEvidence[] = [];

  for (const receipt of articleMaterializationDryRun.receipts) {
    const candidate = candidateById.get(receipt.target.id);
    const histories = historiesByRecordId.get(receipt.target.id) ?? [];
    const verificationReads =
      verificationByRecordId.get(receipt.target.id) ?? [];
    const unexpectedBlockers = (candidate?.issues ?? []).filter(
      (item) =>
        item.severity === "blocker" &&
        item.code !== intentionalPublicCutoverBlocker,
    );
    const base = {
      id: receipt.target.id,
      slug: receipt.target.slug,
      title: candidate?.target.title ?? receipt.target.id,
    };

    if (receipt.target.observedState === "absent") {
      const prepared = Boolean(
        candidate &&
          histories.length === 0 &&
          receipt.control.validation === "verified" &&
          receipt.materialization.status === "verified_in_memory" &&
          receipt.target.conflictCodes.length === 0 &&
          unexpectedBlockers.length === 0,
      );
      targetEvidence.push({
        ...base,
        status: prepared ? "prepared_absent" : "blocked",
        detail: prepared
          ? "The deterministic control and in-memory private draft are verified against a currently absent target."
          : "The absent target has conflicting, stale, duplicate, or incomplete migration evidence.",
      });
      continue;
    }

    const history = histories.length === 1 ? histories[0] : undefined;
    const verificationRead =
      verificationReads.length === 1 ? verificationReads[0] : undefined;
    const verification =
      verificationRead?.status === "available"
        ? verificationRead.result
        : undefined;
    const verified = Boolean(
      candidate &&
        history?.control.validation === "verified" &&
        receipt.control.validation === "verified" &&
        history.control.id === receipt.control.id &&
        history.control.fingerprint === receipt.control.fingerprint &&
        verification &&
        verification.recordId === receipt.target.id &&
        verification.status !== "failed" &&
        verification.artifacts.readCount === 5 &&
        verification.artifacts.writeCount === 0 &&
        !verification.artifacts.repairAttempted &&
        !verification.rollout.cmsBodyPubliclyRendered &&
        !verification.rollout.indexingChanged &&
        !verification.rollout.cutoverEligible &&
        unexpectedBlockers.length === 0,
    );
    targetEvidence.push({
      ...base,
      status: !verified
        ? "blocked"
        : verification?.status === "record_advanced"
          ? "verified_advanced_record"
          : "verified_private_draft",
      detail: !verified
        ? "The present target is missing one exact execution event or a current five-artifact verification failed."
        : verification?.status === "record_advanced"
          ? "The migration creation evidence and current advanced record state are internally consistent."
          : "The revision-one private draft, both locks, audit event, and absent search projection are verified.",
    });
  }

  const sourceOrRouteBlockers = [
    ...preview.issues,
    ...articleCandidates.flatMap((candidate) => candidate.issues),
  ].filter(
    (item) =>
      item.severity === "blocker" &&
      item.code !== intentionalPublicCutoverBlocker,
  ).length;
  const publicRepresentationBlockers = articleCandidates
    .flatMap((candidate) => candidate.issues)
    .filter(
      (item) =>
        item.severity === "blocker" &&
        item.code === intentionalPublicCutoverBlocker,
    ).length;
  const warnings = [
    ...preview.issues,
    ...articleCandidates.flatMap((candidate) => candidate.issues),
  ].filter((item) => item.severity === "warning");
  const legacyReviewWarnings = warnings.filter(
    (item) => item.code === "legacy_review_required",
  ).length;
  const verificationAvailable = evidence.verifications.filter(
    (item) => item.status === "available" && item.result,
  );
  const controls = preview.summary.articleControls;
  const controlsVerified = articleMaterializationDryRun.summary.controlsVerified;
  const controlsIntegrityReady = Boolean(
    articleCandidates.length > 0 &&
      controls.controlsDefined === articleCandidates.length &&
      controls.fingerprinted === articleCandidates.length &&
      controls.privateDrafts === articleCandidates.length &&
      controls.executionEligible === 0 &&
      controls.writeCount === 0 &&
      articleMaterializationDryRun.summary.controls === articleCandidates.length &&
      controlsVerified === articleCandidates.length &&
      articleMaterializationDryRun.summary.receiptsVerified ===
        articleCandidates.length &&
      new Set(
        articleMaterializationDryRun.receipts.map(
          (receipt) => receipt.target.id,
        ),
      ).size === articleCandidates.length,
  );
  const blockedTargets = targetEvidence.filter(
    (target) => target.status === "blocked",
  ).length;
  const evidenceReady = Boolean(
    controlsIntegrityReady &&
      sourceOrRouteBlockers === 0 &&
      publicRepresentationBlockers === articleCandidates.length &&
      executionHistory.summary.invalidEvents === 0 &&
      executionHistory.summary.controlsMismatched === 0 &&
      !executionHistory.summary.truncated &&
      duplicateRecordEvents === 0 &&
      unexpectedRecordEvents === 0 &&
      evidence.verifications.every(
        (item) => item.status === "available" && item.result?.status !== "failed",
      ) &&
      blockedTargets === 0,
  );

  return deepFreeze({
    status: "available" as const,
    inventory: {
      total: preview.summary.total,
      articles: preview.summary.byKind.article.total,
      topics: preview.summary.byKind.topic.total,
      faqs: preview.summary.byKind.faq.total,
    },
    controls: {
      defined: controls.controlsDefined,
      verified: controlsVerified,
      fingerprinted: controls.fingerprinted,
      integrityReady: controlsIntegrityReady,
    },
    targets: {
      total: targetEvidence.length,
      preparedAbsent: targetEvidence.filter(
        (target) => target.status === "prepared_absent",
      ).length,
      verifiedPrivateDrafts: targetEvidence.filter(
        (target) => target.status === "verified_private_draft",
      ).length,
      verifiedAdvancedRecords: targetEvidence.filter(
        (target) => target.status === "verified_advanced_record",
      ).length,
      blocked: blockedTargets,
    },
    history: {
      eventsObserved: executionHistory.summary.eventsObserved,
      validEvents: executionHistory.summary.validEvents,
      invalidEvents: executionHistory.summary.invalidEvents,
      controlsMismatched: executionHistory.summary.controlsMismatched,
      truncated: executionHistory.summary.truncated,
      duplicateRecordEvents,
      unexpectedRecordEvents,
    },
    verifications: {
      requested: evidence.verifications.length,
      available: verificationAvailable.length,
      missing: evidence.verifications.filter(
        (item) => item.status === "missing",
      ).length,
      unavailable: evidence.verifications.filter(
        (item) => item.status === "unavailable",
      ).length,
      passed: verificationAvailable.filter(
        (item) => item.result?.status !== "failed",
      ).length,
      failed: verificationAvailable.filter(
        (item) => item.result?.status === "failed",
      ).length,
    },
    evidence: {
      sourceOrRouteBlockers,
      publicRepresentationBlockers,
      legacyReviewWarnings,
      otherWarnings: warnings.length - legacyReviewWarnings,
      ready: evidenceReady,
    },
    targetEvidence,
  });
}

export function buildKnowledgeCmsOperationalReadinessReport(input: {
  actor: KnowledgeCmsActor;
  observedAt: Date;
  configuration: KnowledgeCmsOperationalConfiguration;
  roleDirectory: KnowledgeCmsRoleDirectorySnapshot;
  workspaceEvidence: KnowledgeCmsOperationalWorkspaceEvidence;
}): KnowledgeCmsOperationalReadinessReport {
  assertKnowledgeCmsActionAllowed(input.actor, "preview_migration");
  if (Number.isNaN(input.observedAt.getTime())) {
    throw new Error("Knowledge CMS readiness requires a valid server clock.");
  }

  const migration = summarizeMigrationEvidence(input.workspaceEvidence);
  const roleDirectoryReady = input.roleDirectory.status === "complete";
  const currentOperatorReady = input.actor.roles.some((role) =>
    ["publisher", "admin"].includes(role),
  );
  const workspaceReady = Boolean(
    input.configuration.cmsGate === "enabled" &&
      input.configuration.firebase.adminConfigured &&
      input.configuration.firebase.browserAuthConfigured &&
      input.configuration.firebase.projectAlignment === "matched" &&
      roleDirectoryReady &&
      currentOperatorReady,
  );
  const editorialReady = Boolean(
    workspaceReady &&
      input.roleDirectory.invalidClaimAccounts === 0 &&
      input.roleDirectory.capabilities.authoringAccounts > 0 &&
      input.roleDirectory.capabilities.verifiedReviewerAccounts > 0 &&
      input.roleDirectory.capabilities.publisherAccounts > 0 &&
      input.roleDirectory.capabilities.reviewerPublisherSeparationReady,
  );
  const allArticleTargetsVerified = Boolean(
    migration.targets.total > 0 &&
      migration.targets.preparedAbsent === 0 &&
      migration.targets.blocked === 0 &&
      migration.targets.verifiedPrivateDrafts +
          migration.targets.verifiedAdvancedRecords ===
        migration.targets.total,
  );
  const articleMigration: KnowledgeCmsOperationalReadinessReport["capabilities"]["singleRecordArticleMigration"] = allArticleTargetsVerified && migration.evidence.ready
    ? "complete"
    : workspaceReady &&
        migration.evidence.ready &&
        input.configuration.articleMigrationExecutionGate === "enabled"
      ? "ready"
      : "blocked";
  const rendererSafe = Boolean(
    input.configuration.renderer.configurationValid &&
      ["static", "shadow"].includes(
        input.configuration.renderer.requestedMode,
      ) &&
      input.configuration.renderer.effectiveMode === "static" &&
      !input.configuration.renderer.activationAllowed,
  );
  const privateShadow: KnowledgeCmsOperationalReadinessReport["capabilities"]["privateShadow"] = !workspaceReady || !rendererSafe
    ? "blocked"
    : input.configuration.renderer.privateShadowEnabled
      ? "available"
      : "disabled";
  const overall: KnowledgeCmsOperationalReadinessReport["overall"] = workspaceReady &&
    editorialReady &&
    rendererSafe &&
    migration.evidence.ready &&
    articleMigration !== "blocked"
    ? "ready_for_guarded_private_operations"
    : "blocked";

  const checks: KnowledgeCmsOperationalReadinessCheck[] = [
    check(
      "cms_feature_gate",
      "configuration",
      input.configuration.cmsGate === "enabled" ? "pass" : "blocked",
      input.configuration.cmsGate === "enabled"
        ? "The private CMS feature gate is exact true."
        : `The private CMS feature gate is ${input.configuration.cmsGate}.`,
    ),
    check(
      "firebase_admin",
      "configuration",
      input.configuration.firebase.adminConfigured ? "pass" : "blocked",
      input.configuration.firebase.adminConfigured
        ? "Firebase Admin credentials or Application Default Credentials are configured."
        : "Firebase Admin credentials cannot be resolved for this deployment.",
    ),
    check(
      "firebase_browser_auth",
      "configuration",
      input.configuration.firebase.browserAuthConfigured ? "pass" : "blocked",
      input.configuration.firebase.browserAuthConfigured
        ? "All three Firebase browser authentication identifiers are configured."
        : "Firebase browser authentication identifiers are incomplete.",
    ),
    check(
      "firebase_project_alignment",
      "configuration",
      input.configuration.firebase.projectAlignment === "matched"
        ? "pass"
        : "blocked",
      input.configuration.firebase.projectAlignment === "matched"
        ? "Browser and server Firebase project identifiers match."
        : `Browser and server Firebase project alignment is ${input.configuration.firebase.projectAlignment}.`,
    ),
    check(
      "current_operator",
      "authentication",
      currentOperatorReady ? "pass" : "blocked",
      currentOperatorReady
        ? "The server-refreshed current actor has publisher or admin authority."
        : "The current actor does not have publisher or admin authority.",
    ),
    check(
      "role_directory",
      "authentication",
      roleDirectoryReady ? "pass" : "blocked",
      roleDirectoryReady
        ? `The read-only Auth directory scan completed across ${input.roleDirectory.pagesRead} page(s).`
        : `The Auth directory scan is unavailable (${input.roleDirectory.failureReason ?? "unknown"}).`,
    ),
    check(
      "role_claim_integrity",
      "authentication",
      input.roleDirectory.invalidClaimAccounts > 0
        ? "blocked"
        : input.roleDirectory.disabledClaimAccounts > 0 ||
            input.roleDirectory.unverifiedClaimAccounts > 0
          ? "warning"
          : "pass",
      `${input.roleDirectory.invalidClaimAccounts} invalid, ${input.roleDirectory.disabledClaimAccounts} disabled, and ${input.roleDirectory.unverifiedClaimAccounts} unverified account(s) carry CMS claims.`,
    ),
    check(
      "editorial_role_coverage",
      "authentication",
      editorialReady ? "pass" : "blocked",
      editorialReady
        ? "Authoring, currently verified review, publishing, and reviewer-publisher separation coverage are present."
        : "The role directory does not yet prove complete authoring, verified review, publishing, and reviewer-publisher separation coverage.",
    ),
    check(
      "article_execution_gate",
      "configuration",
      allArticleTargetsVerified
        ? "not_applicable"
        : input.configuration.articleMigrationExecutionGate === "enabled"
          ? "pass"
          : "blocked",
      allArticleTargetsVerified
        ? "All article migration targets already have verified creation evidence; the execution gate is no longer required for completion."
        : `The one-record article migration execution gate is ${input.configuration.articleMigrationExecutionGate}.`,
    ),
    check(
      "renderer_configuration",
      "public_safety",
      rendererSafe ? "pass" : "blocked",
      rendererSafe
        ? `Requested renderer mode is ${input.configuration.renderer.requestedMode}; effective public mode remains static.`
        : "Renderer configuration is invalid or does not preserve the hard static public mode.",
    ),
    check(
      "article_controls",
      "migration",
      migration.controls.integrityReady ? "pass" : "blocked",
      migration.controls.integrityReady
        ? `All ${migration.controls.verified} article controls and fingerprints are deterministic, private, and zero-write.`
        : "Article control coverage or fingerprint integrity is incomplete.",
    ),
    check(
      "source_and_route_evidence",
      "migration",
      migration.status === "available" &&
        migration.evidence.sourceOrRouteBlockers === 0
        ? "pass"
        : "blocked",
      migration.status === "available"
        ? `${migration.evidence.sourceOrRouteBlockers} non-cutover source or route blocker(s); ${migration.evidence.publicRepresentationBlockers} intentional public-body blocker(s).`
        : "Firestore inventory and route evidence could not be read.",
    ),
    check(
      "article_migration_evidence",
      "migration",
      migration.evidence.ready ? "pass" : "blocked",
      migration.evidence.ready
        ? `${migration.targets.preparedAbsent} target(s) are prepared and ${migration.targets.verifiedPrivateDrafts + migration.targets.verifiedAdvancedRecords} have verified creation evidence.`
        : "One or more article targets, history events, controls, or current artifacts are incomplete or contradictory.",
    ),
    check(
      "post_create_verification",
      "migration",
      migration.history.validEvents === 0
        ? "not_applicable"
        : migration.verifications.failed === 0 &&
            migration.verifications.missing === 0 &&
            migration.verifications.unavailable === 0 &&
            migration.verifications.available === migration.history.validEvents
          ? "pass"
          : "blocked",
      migration.history.validEvents === 0
        ? "No article migration execution has occurred; there are no stored artifacts to verify."
        : `${migration.verifications.passed} of ${migration.history.validEvents} execution event(s) have a current passing five-artifact receipt.`,
    ),
    check(
      "public_cutover_guard",
      "public_safety",
      rendererSafe &&
        migration.status === "available" &&
        migration.inventory.articles > 0 &&
        migration.evidence.publicRepresentationBlockers ===
          migration.inventory.articles
        ? "pass"
        : "blocked",
      "Public cutover remains prohibited; every article retains the CMS-native-body blocker and verified static rollback.",
    ),
    check(
      "zero_write_boundary",
      "public_safety",
      "pass",
      "The readiness report, role scan, inventory, history, and artifact verification paths perform zero writes and no repair.",
    ),
  ];

  const verificationResults = input.workspaceEvidence.status === "available"
    ? input.workspaceEvidence.verifications
        .map((item) => item.result)
        .filter(
          (item): item is KnowledgeCmsArticleMigrationPostCreateVerification =>
            Boolean(item),
        )
    : [];
  const unsigned = {
    version: KNOWLEDGE_CMS_OPERATIONAL_READINESS_VERSION,
    mode: "read_only_operational_readiness" as const,
    observedAt: input.observedAt.toISOString(),
    overall,
    capabilities: {
      privateWorkspace: workspaceReady ? "ready" as const : "blocked" as const,
      editorialWorkflow: editorialReady ? "ready" as const : "blocked" as const,
      singleRecordArticleMigration: articleMigration,
      privateShadow,
      publicCutover: "prohibited" as const,
    },
    configuration: input.configuration,
    authorization: {
      currentActorRoles: cmsRoles.filter((role) =>
        input.actor.roles.includes(role),
      ),
      roleDirectory: input.roleDirectory,
    },
    migration,
    checks,
    readBoundary: {
      authorizationBeforeReads: true as const,
      authDirectoryPages: input.roleDirectory.pagesRead,
      firestoreInventoryCollectionReads:
        input.workspaceEvidence.status === "available" ? 3 : 0,
      firestoreHistoryCollectionReads:
        input.workspaceEvidence.status === "available" ? 1 : 0,
      verificationTransactions:
        input.workspaceEvidence.status === "available"
          ? input.workspaceEvidence.verifications.length
          : 0,
      verifiedArtifactReads: verificationResults.reduce(
        (total, result) => total + result.artifacts.readCount,
        0,
      ),
      maximumVerificationArtifactReads:
        (input.workspaceEvidence.status === "available"
          ? input.workspaceEvidence.verifications.length
          : 0) * 5,
      writeCount: KNOWLEDGE_CMS_OPERATIONAL_READINESS_WRITE_COUNT,
      repairAttempted: false as const,
    },
    publicSafety: {
      publicSource: "verified_static_route" as const,
      effectiveRendererMode: "static" as const,
      cmsBodyPubliclyRendered: false as const,
      indexingChanged: false as const,
      sitemapChanged: false as const,
      bulkExecutionAvailable: false as const,
      publicCutoverEligible: false as const,
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

export function validateKnowledgeCmsOperationalReadinessReport(
  report: KnowledgeCmsOperationalReadinessReport,
): string[] {
  const errors: string[] = [];
  const unsigned = Object.fromEntries(
    Object.entries(report).filter(([key]) => key !== "fingerprint"),
  );
  if (
    report.fingerprint.algorithm !== "sha256" ||
    report.fingerprint.canonicalization !== "recursive_sorted_keys" ||
    !/^[a-f0-9]{64}$/.test(report.fingerprint.value) ||
    fingerprint(unsigned) !== report.fingerprint.value
  ) {
    errors.push("The operational readiness fingerprint is invalid.");
  }
  if (
    report.mode !== "read_only_operational_readiness" ||
    report.readBoundary.writeCount !== 0 ||
    report.readBoundary.repairAttempted ||
    report.publicSafety.cmsBodyPubliclyRendered ||
    report.publicSafety.indexingChanged ||
    report.publicSafety.sitemapChanged ||
    report.publicSafety.bulkExecutionAvailable ||
    report.publicSafety.publicCutoverEligible ||
    report.publicSafety.effectiveRendererMode !== "static" ||
    report.capabilities.publicCutover !== "prohibited" ||
    !report.configuration.renderer.configurationValid ||
    !["static", "shadow"].includes(
      report.configuration.renderer.requestedMode,
    )
  ) {
    errors.push(
      "Operational readiness must remain zero-write, static-public, non-indexing, non-bulk, and ineligible for cutover.",
    );
  }
  return errors;
}
