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
  type KnowledgeCmsRecordKind,
  type KnowledgeCmsRole,
} from "./knowledgeCms";
import { resolveKnowledgeCmsActor } from "./knowledgeCmsAdminAuth";
import type { KnowledgeCmsMigrationIssue } from "./knowledgeCmsMigration";
import type { KnowledgeCmsMigrationWorkspacePreview } from "./knowledgeCmsMigrationDal";
import type {
  KnowledgeCmsArticleMigrationPostCreateVerification,
} from "./knowledgeCmsArticleMigrationVerification";
import {
  validateKnowledgeCmsSupportingMigrationControl,
  type KnowledgeCmsSupportingMigrationKind,
} from "./knowledgeCmsSupportingMigrationControl";
import { getKnowledgeCmsSupportingMigrationControlInput } from "./knowledgeCmsSupportingMigrationExecution";
import type {
  KnowledgeCmsSupportingMigrationPostCreateVerification,
} from "./knowledgeCmsSupportingMigrationVerification";
import type { KnowledgeCmsRendererModeResolution } from "./knowledgeCmsRendererContract";

export const KNOWLEDGE_CMS_OPERATIONAL_READINESS_VERSION = 3 as const;
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
  supportingMigrationExecutionGate: KnowledgeCmsBooleanGateState;
  nativeRepresentationExecutionGate: KnowledgeCmsBooleanGateState;
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
    reviewerPublisherCoverageReady: boolean;
  };
  writeCount: 0;
}

export interface KnowledgeCmsOperationalVerificationRead {
  recordId: string;
  status: "available" | "missing" | "unavailable";
  result?: KnowledgeCmsArticleMigrationPostCreateVerification;
}

export interface KnowledgeCmsOperationalSupportingVerificationRead {
  kind: KnowledgeCmsSupportingMigrationKind;
  recordId: string;
  status: "available" | "missing" | "unavailable";
  result?: KnowledgeCmsSupportingMigrationPostCreateVerification;
}

export type KnowledgeCmsOperationalWorkspaceEvidence =
  | {
      status: "available";
      workspace: KnowledgeCmsMigrationWorkspacePreview;
      articleVerifications: KnowledgeCmsOperationalVerificationRead[];
      supportingVerifications: KnowledgeCmsOperationalSupportingVerificationRead[];
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
    | "supporting_controls"
    | "supporting_execution_gate"
    | "native_representation_execution_gate"
    | "supporting_migration_evidence"
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
  kind: KnowledgeCmsRecordKind;
  slug: string;
  title: string;
  status: KnowledgeCmsOperationalTargetStatus;
  detail: string;
}

export interface KnowledgeCmsOperationalMigrationStep {
  order: number;
  kind: KnowledgeCmsRecordKind;
  id: string;
  slug: string;
  title: string;
  targetStatus: KnowledgeCmsOperationalTargetStatus;
  action: "blocked" | "create_one_private_draft" | "verify_only";
  executionGate:
    | "KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED"
    | "KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED";
  expectedAtomicWrites: 0 | 3 | 4;
  refreshRequired: true;
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
    total: number;
    defined: number;
    verified: number;
    fingerprinted: number;
    integrityReady: boolean;
    articles: {
      total: number;
      defined: number;
      verified: number;
      fingerprinted: number;
    };
    supporting: {
      total: number;
      defined: number;
      verified: number;
      fingerprinted: number;
    };
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
    duplicateRecordReads: number;
    unexpectedRecordReads: number;
  };
  evidence: {
    sourceOrRouteBlockers: number;
    publicRepresentationBlockers: number;
    legacyReviewWarnings: number;
    otherWarnings: number;
    ready: boolean;
  };
  completion: {
    status: "blocked" | "complete" | "ready_for_one_record_execution";
    nextStep: number | null;
    prepared: number;
    verified: number;
    bulkExecution: false;
    executionAuthorized: false;
    refreshAfterEveryExecution: true;
    writeCount: 0;
    steps: KnowledgeCmsOperationalMigrationStep[];
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
    singleRecordSupportingMigration: "blocked" | "complete" | "ready";
    allRecordsMigration: "blocked" | "complete" | "ready";
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
      reviewerPublisherCoverageReady:
        verifiedReviewers.length > 0 && publishers.length > 0,
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
      total: 0,
      defined: 0,
      verified: 0,
      fingerprinted: 0,
      integrityReady: false,
      articles: { total: 0, defined: 0, verified: 0, fingerprinted: 0 },
      supporting: { total: 0, defined: 0, verified: 0, fingerprinted: 0 },
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
      duplicateRecordReads: 0,
      unexpectedRecordReads: 0,
    },
    evidence: {
      sourceOrRouteBlockers: 0,
      publicRepresentationBlockers: 0,
      legacyReviewWarnings: 0,
      otherWarnings: 0,
      ready: false,
    },
    completion: {
      status: "blocked",
      nextStep: null,
      prepared: 0,
      verified: 0,
      bulkExecution: false,
      executionAuthorized: false,
      refreshAfterEveryExecution: true,
      writeCount: 0,
      steps: [],
    },
    targetEvidence: [],
  };
}

function isCompatibleLegacyArticleVerification(
  verification:
    | KnowledgeCmsArticleMigrationPostCreateVerification
    | KnowledgeCmsSupportingMigrationPostCreateVerification
    | undefined,
): verification is KnowledgeCmsArticleMigrationPostCreateVerification {
  if (
    !verification ||
    !("cmsBodyPubliclyRendered" in verification.rollout) ||
    verification.status !== "failed" ||
    (verification.currentRevision ?? 0) <= 1
  ) {
    return false;
  }
  const failedCodes = verification.checks
    .filter((item) => item.status === "failed")
    .map((item) => item.code)
    .sort();
  return (
    failedCodes.length === 2 &&
    failedCodes[0] === "deterministic_control" &&
    failedCodes[1] === "record_fingerprint"
  );
}

function summarizeMigrationEvidence(
  evidence: KnowledgeCmsOperationalWorkspaceEvidence,
): KnowledgeCmsOperationalMigrationSummary {
  if (evidence.status === "unavailable") {
    return emptyMigrationSummary();
  }

  const {
    preview,
    articleMaterializationDryRun,
    executionHistory,
    supportingExecutionHistory,
  } = evidence.workspace;
  const articleCandidates = preview.candidates.filter(
    (
      candidate,
    ): candidate is typeof candidate & {
      target: Extract<typeof candidate.target, { kind: "article" }>;
    } => candidate.target.kind === "article",
  );
  const supportingCandidates = preview.candidates.filter(
    (
      candidate,
    ): candidate is typeof candidate & {
      target: Extract<typeof candidate.target, { kind: "topic" | "faq" }>;
    } => candidate.target.kind === "topic" || candidate.target.kind === "faq",
  );
  const keyFor = (kind: KnowledgeCmsRecordKind, id: string) => `${kind}:${id}`;
  const orderedCandidates = [...preview.candidates].sort((left, right) => {
    const kindOrder: Record<KnowledgeCmsRecordKind, number> = {
      topic: 0,
      faq: 1,
      article: 2,
    };
    const leftOrder = left.target.kind === "topic" ? left.target.order : 0;
    const rightOrder = right.target.kind === "topic" ? right.target.order : 0;
    return (
      kindOrder[left.target.kind] - kindOrder[right.target.kind] ||
      leftOrder - rightOrder ||
      left.target.title.localeCompare(right.target.title) ||
      left.target.id.localeCompare(right.target.id)
    );
  });
  const candidateByKey = new Map(
    orderedCandidates.map((candidate) => [
      keyFor(candidate.target.kind, candidate.target.id),
      candidate,
    ]),
  );
  const receiptById = new Map(
    articleMaterializationDryRun.receipts.map((receipt) => [
      receipt.target.id,
      receipt,
    ]),
  );
  const supportingControlValidByKey = new Map<string, boolean>();
  for (const candidate of supportingCandidates) {
    const control = candidate.target.controlRecord;
    supportingControlValidByKey.set(
      keyFor(candidate.target.kind, candidate.target.id),
      Boolean(
        control &&
          validateKnowledgeCmsSupportingMigrationControl(
            control,
            getKnowledgeCmsSupportingMigrationControlInput(candidate),
          ).length === 0,
      ),
    );
  }

  interface NormalizedHistory {
    kind: KnowledgeCmsRecordKind;
    recordId: string;
    controlId: string;
    controlFingerprint: string;
    controlVerified: boolean;
  }
  const normalizedHistory: NormalizedHistory[] = [
    ...executionHistory.entries.map((entry) => ({
      kind: "article" as const,
      recordId: entry.recordId,
      controlId: entry.control.id,
      controlFingerprint: entry.control.fingerprint,
      controlVerified: entry.control.validation === "verified",
    })),
    ...(supportingExecutionHistory?.entries ?? []).map((entry) => ({
      kind: entry.kind,
      recordId: entry.recordId,
      controlId: entry.controlId,
      controlFingerprint: entry.controlFingerprint,
      controlVerified: entry.controlValidation === "verified",
    })),
  ];
  const historiesByKey = new Map<string, NormalizedHistory[]>();
  for (const entry of normalizedHistory) {
    const key = keyFor(entry.kind, entry.recordId);
    historiesByKey.set(key, [...(historiesByKey.get(key) ?? []), entry]);
  }

  type NormalizedVerification =
    | (KnowledgeCmsOperationalVerificationRead & { kind: "article" })
    | KnowledgeCmsOperationalSupportingVerificationRead;
  const normalizedVerifications: NormalizedVerification[] = [
    ...evidence.articleVerifications.map((item) => ({
      ...item,
      kind: "article" as const,
    })),
    ...evidence.supportingVerifications,
  ];
  const verificationsByKey = new Map<string, NormalizedVerification[]>();
  for (const verification of normalizedVerifications) {
    const key = keyFor(verification.kind, verification.recordId);
    verificationsByKey.set(key, [
      ...(verificationsByKey.get(key) ?? []),
      verification,
    ]);
  }
  const duplicateVerificationReads = [...verificationsByKey.values()].filter(
    (reads) => reads.length !== 1,
  ).length;

  const targetKeys = new Set(candidateByKey.keys());
  const duplicateRecordEvents = [...historiesByKey.values()].filter(
    (entries) => entries.length !== 1,
  ).length;
  const unexpectedRecordEvents = normalizedHistory.filter(
    (entry) => !targetKeys.has(keyFor(entry.kind, entry.recordId)),
  ).length;
  const unexpectedVerificationReads = normalizedVerifications.filter(
    (item) => !targetKeys.has(keyFor(item.kind, item.recordId)),
  ).length;
  const targetEvidence: KnowledgeCmsOperationalTargetEvidence[] = [];
  const compatibleLegacyKeys = new Set<string>();

  for (const candidate of orderedCandidates) {
    const target = candidate.target;
    const key = keyFor(target.kind, target.id);
    const receipt = target.kind === "article"
      ? receiptById.get(target.id)
      : undefined;
    const histories = historiesByKey.get(key) ?? [];
    const verificationReads = verificationsByKey.get(key) ?? [];
    const unexpectedBlockers = candidate.issues.filter(
      (item) =>
        item.severity === "blocker" &&
        !(
          target.kind === "article" &&
          item.code === intentionalPublicCutoverBlocker
        ),
    );
    const base = {
      id: target.id,
      kind: target.kind,
      slug: target.slug,
      title: target.title,
    };
    const control = target.controlRecord;
    const controlVerified = target.kind === "article"
      ? Boolean(
          control &&
            receipt?.control.validation === "verified" &&
            receipt.control.id === control.controlId &&
            receipt.control.fingerprint === control.fingerprint.value,
        )
      : supportingControlValidByKey.get(key) === true;
    const observedAbsent = target.kind === "article"
      ? receipt?.target.observedState === "absent"
      : candidate.state === "ready";
    const observedPresent = target.kind === "article"
      ? receipt?.target.observedState === "present"
      : candidate.state === "already_present";

    if (observedAbsent) {
      const prepared = Boolean(
        control &&
          controlVerified &&
          histories.length === 0 &&
          verificationReads.length === 0 &&
          (target.kind !== "article" ||
            (receipt?.materialization.status === "verified_in_memory" &&
              receipt.target.conflictCodes.length === 0)) &&
          unexpectedBlockers.length === 0,
      );
      targetEvidence.push({
        ...base,
        status: prepared ? "prepared_absent" : "blocked",
        detail: prepared
          ? "The deterministic private-draft control is verified against a currently absent target with no execution history."
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
    const historyMatches = Boolean(
      control &&
        history?.controlVerified &&
        history.controlId === control.controlId &&
        history.controlFingerprint === control.fingerprint.value,
    );
    const articleVerificationMatches = Boolean(
      target.kind === "article" &&
        verificationRead?.kind === "article" &&
        verification &&
        "rollout" in verification &&
        "cmsBodyPubliclyRendered" in verification.rollout &&
        verification.recordId === target.id &&
        (verification.status !== "failed" ||
          isCompatibleLegacyArticleVerification(verification)) &&
        verification.artifacts.readCount === 5 &&
        verification.artifacts.writeCount === 0 &&
        !verification.artifacts.repairAttempted &&
        !verification.rollout.cmsBodyPubliclyRendered &&
        !verification.rollout.indexingChanged &&
        !verification.rollout.cutoverEligible,
    );
    const supportingVerificationMatches = Boolean(
      target.kind !== "article" &&
        verificationRead?.kind === target.kind &&
        verification &&
        "kind" in verification &&
        "cmsRecordPubliclyRendered" in verification.rollout &&
        verification.kind === target.kind &&
        verification.recordId === target.id &&
        verification.status !== "failed" &&
        verification.artifacts.readCount ===
          (target.canonicalPath ? 5 : 4) &&
        verification.artifacts.writeCount === 0 &&
        !verification.artifacts.repairAttempted &&
        !verification.rollout.cmsRecordPubliclyRendered &&
        !verification.rollout.indexingChanged &&
        !verification.rollout.cutoverEligible,
    );
    const legacyAdvancedEvidence = Boolean(
      (verification?.status === "record_advanced" ||
        isCompatibleLegacyArticleVerification(verification)) &&
        (articleVerificationMatches || supportingVerificationMatches) &&
        histories.length <= 1,
    );
    if (legacyAdvancedEvidence) compatibleLegacyKeys.add(key);
    const incompatibleBlockers = unexpectedBlockers.filter(
      (item) =>
        !(
          legacyAdvancedEvidence &&
          item.code === "existing_content_conflict"
        ),
    );
    const verified = Boolean(
      (observedPresent || legacyAdvancedEvidence) &&
        (controlVerified || legacyAdvancedEvidence) &&
        (historyMatches || legacyAdvancedEvidence) &&
        (articleVerificationMatches || supportingVerificationMatches) &&
        incompatibleBlockers.length === 0,
    );
    targetEvidence.push({
      ...base,
      status: !verified
        ? "blocked"
        : legacyAdvancedEvidence || verification?.status === "record_advanced"
          ? "verified_advanced_record"
          : "verified_private_draft",
      detail: !verified
        ? "The present target is missing one exact execution event or a current artifact verification failed."
        : legacyAdvancedEvidence && !historyMatches
          ? "The advanced legacy record predates the current deterministic creation control, but its immutable identity, locks, current record verification, review state, and zero-write public-safety evidence agree."
        : legacyAdvancedEvidence
          ? "The advanced record retains valid creation evidence and immutable identity while its current editorial revision, locks, review state, and zero-write public-safety evidence agree."
        : verification?.status === "record_advanced"
          ? "The migration creation evidence and current advanced record state are internally consistent."
          : "The revision-one private draft, required locks, audit event, and search evidence are verified.",
    });
  }

  const migrationIssues: Array<{
    item: KnowledgeCmsMigrationIssue;
    candidateKey?: string;
  }> = [
    ...preview.issues.map((item) => ({ item })),
    ...preview.candidates.flatMap((candidate) =>
      candidate.issues.map((item) => ({
        item,
        candidateKey: keyFor(candidate.target.kind, candidate.target.id),
      })),
    ),
  ];
  const sourceOrRouteBlockers = migrationIssues.filter(({ item, candidateKey }) =>
    item.severity === "blocker" &&
    item.code !== intentionalPublicCutoverBlocker &&
    !(
      item.code === "existing_content_conflict" &&
      candidateKey &&
      compatibleLegacyKeys.has(candidateKey)
    )
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
    ...preview.candidates.flatMap((candidate) => candidate.issues),
  ].filter((item) => item.severity === "warning");
  const legacyReviewWarnings = warnings.filter(
    (item) => item.code === "legacy_review_required",
  ).length;
  const verificationAvailable = normalizedVerifications.filter(
    (item) => item.status === "available" && item.result,
  );
  const articleControls = preview.summary.articleControls;
  const supportingControls = preview.summary.supportingControls;
  const articleControlsVerified =
    articleMaterializationDryRun.summary.controlsVerified;
  const supportingControlsVerified = [...supportingControlValidByKey.values()]
    .filter(Boolean).length;
  const controlsIntegrityReady = Boolean(
    articleCandidates.length === 22 &&
      supportingCandidates.length === 23 &&
      articleControls.controlsDefined === articleCandidates.length &&
      articleControls.fingerprinted === articleCandidates.length &&
      articleControls.privateDrafts === articleCandidates.length &&
      articleControls.executionEligible === 0 &&
      articleControls.writeCount === 0 &&
      articleMaterializationDryRun.summary.controls === articleCandidates.length &&
      articleControlsVerified === articleCandidates.length &&
      articleMaterializationDryRun.summary.receiptsVerified ===
        articleCandidates.length &&
      new Set(
        articleMaterializationDryRun.receipts.map(
          (receipt) => receipt.target.id,
        ),
      ).size === articleCandidates.length &&
      supportingControls.total === supportingCandidates.length &&
      supportingControls.controlsDefined === supportingCandidates.length &&
      supportingControls.fingerprinted === supportingCandidates.length &&
      supportingControls.privateDrafts === supportingCandidates.length &&
      supportingControls.executionEligible === 0 &&
      supportingControls.writeCount === 0 &&
      supportingControlsVerified === supportingCandidates.length,
  );
  const incompatibleControlMismatches = [
    ...executionHistory.entries.map((entry) => ({
      key: keyFor("article", entry.recordId),
      mismatch: entry.control.validation === "mismatch",
    })),
    ...(supportingExecutionHistory?.entries ?? []).map((entry) => ({
      key: keyFor(entry.kind, entry.recordId),
      mismatch: entry.controlValidation === "mismatch",
    })),
  ].filter(
    (entry) => entry.mismatch && !compatibleLegacyKeys.has(entry.key),
  ).length;
  const blockedTargets = targetEvidence.filter(
    (target) => target.status === "blocked",
  ).length;
  const evidenceReady = Boolean(
    controlsIntegrityReady &&
      sourceOrRouteBlockers === 0 &&
      publicRepresentationBlockers === articleCandidates.length &&
      supportingExecutionHistory !== undefined &&
      executionHistory.summary.invalidEvents +
          supportingExecutionHistory.summary.invalidEvents ===
        0 &&
      incompatibleControlMismatches === 0 &&
      !executionHistory.summary.truncated &&
      !supportingExecutionHistory.summary.truncated &&
      duplicateRecordEvents === 0 &&
      unexpectedRecordEvents === 0 &&
      duplicateVerificationReads === 0 &&
      unexpectedVerificationReads === 0 &&
      normalizedVerifications.every(
        (item) =>
          item.status === "available" &&
          (item.result?.status !== "failed" ||
            isCompatibleLegacyArticleVerification(item.result)),
      ) &&
      blockedTargets === 0 &&
      targetEvidence.length === preview.summary.total &&
      new Set(
        targetEvidence.map((target) => keyFor(target.kind, target.id)),
      ).size === preview.summary.total,
  );
  const preparedTargets = targetEvidence.filter(
    (target) => target.status === "prepared_absent",
  ).length;
  const verifiedTargets = targetEvidence.filter(
    (target) =>
      target.status === "verified_private_draft" ||
      target.status === "verified_advanced_record",
  ).length;
  const steps: KnowledgeCmsOperationalMigrationStep[] = targetEvidence.map(
    (target, index) => {
      const candidate = candidateByKey.get(keyFor(target.kind, target.id));
      const action = target.status === "blocked"
        ? "blocked" as const
        : target.status === "prepared_absent"
          ? "create_one_private_draft" as const
          : "verify_only" as const;
      return {
        order: index + 1,
        kind: target.kind,
        id: target.id,
        slug: target.slug,
        title: target.title,
        targetStatus: target.status,
        action,
        executionGate: target.kind === "article"
          ? "KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED" as const
          : "KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED" as const,
        expectedAtomicWrites: action !== "create_one_private_draft"
          ? 0 as const
          : target.kind === "article" || candidate?.target.canonicalPath
            ? 4 as const
            : 3 as const,
        refreshRequired: true as const,
      };
    },
  );
  const completionStatus = !evidenceReady
    ? "blocked" as const
    : preparedTargets > 0
      ? "ready_for_one_record_execution" as const
      : "complete" as const;
  const nextStep = completionStatus === "ready_for_one_record_execution"
    ? steps.find((step) => step.action === "create_one_private_draft")?.order ?? null
    : null;

  return deepFreeze({
    status: "available" as const,
    inventory: {
      total: preview.summary.total,
      articles: preview.summary.byKind.article.total,
      topics: preview.summary.byKind.topic.total,
      faqs: preview.summary.byKind.faq.total,
    },
    controls: {
      total: articleCandidates.length + supportingCandidates.length,
      defined:
        articleControls.controlsDefined + supportingControls.controlsDefined,
      verified: articleControlsVerified + supportingControlsVerified,
      fingerprinted:
        articleControls.fingerprinted + supportingControls.fingerprinted,
      integrityReady: controlsIntegrityReady,
      articles: {
        total: articleCandidates.length,
        defined: articleControls.controlsDefined,
        verified: articleControlsVerified,
        fingerprinted: articleControls.fingerprinted,
      },
      supporting: {
        total: supportingCandidates.length,
        defined: supportingControls.controlsDefined,
        verified: supportingControlsVerified,
        fingerprinted: supportingControls.fingerprinted,
      },
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
      eventsObserved:
        executionHistory.summary.eventsObserved +
        (supportingExecutionHistory?.summary.eventsObserved ?? 0),
      validEvents:
        executionHistory.summary.validEvents +
        (supportingExecutionHistory?.summary.validEvents ?? 0),
      invalidEvents:
        executionHistory.summary.invalidEvents +
        (supportingExecutionHistory?.summary.invalidEvents ?? 0),
      controlsMismatched:
        executionHistory.summary.controlsMismatched +
        (supportingExecutionHistory?.summary.controlsMismatched ?? 0),
      truncated: Boolean(
        executionHistory.summary.truncated ||
          supportingExecutionHistory?.summary.truncated,
      ),
      duplicateRecordEvents,
      unexpectedRecordEvents,
    },
    verifications: {
      requested: normalizedVerifications.length,
      available: verificationAvailable.length,
      missing: normalizedVerifications.filter(
        (item) => item.status === "missing",
      ).length,
      unavailable: normalizedVerifications.filter(
        (item) => item.status === "unavailable",
      ).length,
      passed: verificationAvailable.filter(
        (item) =>
          item.result?.status !== "failed" ||
          isCompatibleLegacyArticleVerification(item.result),
      ).length,
      failed: verificationAvailable.filter(
        (item) =>
          item.result?.status === "failed" &&
          !isCompatibleLegacyArticleVerification(item.result),
      ).length,
      duplicateRecordReads: duplicateVerificationReads,
      unexpectedRecordReads: unexpectedVerificationReads,
    },
    evidence: {
      sourceOrRouteBlockers,
      publicRepresentationBlockers,
      legacyReviewWarnings,
      otherWarnings: warnings.length - legacyReviewWarnings,
      ready: evidenceReady,
    },
    completion: {
      status: completionStatus,
      nextStep,
      prepared: preparedTargets,
      verified: verifiedTargets,
      bulkExecution: false as const,
      executionAuthorized: false as const,
      refreshAfterEveryExecution: true as const,
      writeCount: 0 as const,
      steps,
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
      input.roleDirectory.capabilities.reviewerPublisherCoverageReady,
  );
  const articleTargetEvidence = migration.targetEvidence.filter(
    (target) => target.kind === "article",
  );
  const supportingTargetEvidence = migration.targetEvidence.filter(
    (target) => target.kind === "topic" || target.kind === "faq",
  );
  const allVerified = (
    targets: KnowledgeCmsOperationalTargetEvidence[],
  ): boolean => Boolean(
    targets.length > 0 &&
      targets.every(
        (target) =>
          target.status === "verified_private_draft" ||
          target.status === "verified_advanced_record",
      ),
  );
  const allArticleTargetsVerified = allVerified(articleTargetEvidence);
  const allSupportingTargetsVerified = allVerified(supportingTargetEvidence);
  const articleMigration: KnowledgeCmsOperationalReadinessReport["capabilities"]["singleRecordArticleMigration"] = allArticleTargetsVerified
    ? "complete"
    : workspaceReady &&
        migration.evidence.ready &&
        input.configuration.articleMigrationExecutionGate === "enabled"
      ? "ready"
      : "blocked";
  const supportingMigration: KnowledgeCmsOperationalReadinessReport["capabilities"]["singleRecordSupportingMigration"] = allSupportingTargetsVerified
    ? "complete"
    : workspaceReady &&
        migration.evidence.ready &&
        input.configuration.supportingMigrationExecutionGate === "enabled"
      ? "ready"
      : "blocked";
  const allRecordsMigration: KnowledgeCmsOperationalReadinessReport["capabilities"]["allRecordsMigration"] = migration.completion.status === "complete"
    ? "complete"
    : migration.completion.status === "ready_for_one_record_execution" &&
        articleMigration !== "blocked" &&
        supportingMigration !== "blocked"
      ? "ready"
      : "blocked";
  const rendererSafe = Boolean(
    input.configuration.renderer.configurationValid &&
      ["static", "shadow"].includes(
        input.configuration.renderer.requestedMode,
      ) &&
      input.configuration.renderer.effectiveMode === "static" &&
      !input.configuration.renderer.activationAllowed &&
      input.configuration.nativeRepresentationExecutionGate !== "invalid" &&
      (input.configuration.nativeRepresentationExecutionGate !== "enabled" ||
        input.configuration.renderer.requestedMode === "shadow"),
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
    articleMigration !== "blocked" &&
    supportingMigration !== "blocked" &&
    allRecordsMigration !== "blocked"
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
        ? "Authoring, currently verified review, and publishing coverage are present. One verified account may perform separately audited review and publication actions."
        : "The role directory does not yet prove complete authoring, verified review, and publishing coverage.",
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
      "supporting_execution_gate",
      "configuration",
      allSupportingTargetsVerified
        ? "not_applicable"
        : input.configuration.supportingMigrationExecutionGate === "enabled"
          ? "pass"
          : "blocked",
      allSupportingTargetsVerified
        ? "All topic and FAQ targets already have verified creation evidence; the supporting execution gate is no longer required for completion."
        : `The one-record topic/FAQ migration execution gate is ${input.configuration.supportingMigrationExecutionGate}.`,
    ),
    check(
      "native_representation_execution_gate",
      "configuration",
      input.configuration.nativeRepresentationExecutionGate === "invalid"
        ? "blocked"
        : input.configuration.nativeRepresentationExecutionGate === "enabled"
          ? "pass"
          : "not_applicable",
      input.configuration.nativeRepresentationExecutionGate === "enabled"
        ? "The one-artifact CMS-native rendering gate is enabled only with private shadow mode."
        : `The one-artifact CMS-native rendering gate is ${input.configuration.nativeRepresentationExecutionGate}.`,
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
      migration.controls.integrityReady &&
        migration.controls.articles.verified ===
          migration.controls.articles.total
        ? "pass"
        : "blocked",
      migration.controls.articles.verified ===
      migration.controls.articles.total
        ? `All ${migration.controls.articles.verified} article controls and fingerprints are deterministic, private, and zero-write.`
        : "Article control coverage or fingerprint integrity is incomplete.",
    ),
    check(
      "supporting_controls",
      "migration",
      migration.controls.integrityReady &&
        migration.controls.supporting.verified ===
          migration.controls.supporting.total
        ? "pass"
        : "blocked",
      migration.controls.supporting.verified ===
      migration.controls.supporting.total
        ? `All ${migration.controls.supporting.verified} topic and FAQ controls and fingerprints are deterministic, private, and zero-write.`
        : "Topic/FAQ control coverage or fingerprint integrity is incomplete.",
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
      migration.evidence.ready &&
        articleTargetEvidence.every((target) => target.status !== "blocked")
        ? "pass"
        : "blocked",
      `${articleTargetEvidence.filter((target) => target.status === "prepared_absent").length} article target(s) are prepared and ${articleTargetEvidence.filter((target) => target.status === "verified_private_draft" || target.status === "verified_advanced_record").length} have verified creation evidence.`,
    ),
    check(
      "supporting_migration_evidence",
      "migration",
      migration.evidence.ready &&
        supportingTargetEvidence.every((target) => target.status !== "blocked")
        ? "pass"
        : "blocked",
      `${supportingTargetEvidence.filter((target) => target.status === "prepared_absent").length} topic/FAQ target(s) are prepared and ${supportingTargetEvidence.filter((target) => target.status === "verified_private_draft" || target.status === "verified_advanced_record").length} have verified creation evidence.`,
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
        ? "No governed migration execution has occurred; there are no stored artifacts to verify."
        : `${migration.verifications.passed} of ${migration.history.validEvents} execution event(s) have a current passing four- or five-artifact receipt.`,
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

  const verificationResults: Array<
    | KnowledgeCmsArticleMigrationPostCreateVerification
    | KnowledgeCmsSupportingMigrationPostCreateVerification
  > = input.workspaceEvidence.status === "available"
    ? [
        ...input.workspaceEvidence.articleVerifications,
        ...input.workspaceEvidence.supportingVerifications,
      ]
        .map((item) => item.result)
        .filter(
          (
            item,
          ): item is
            | KnowledgeCmsArticleMigrationPostCreateVerification
            | KnowledgeCmsSupportingMigrationPostCreateVerification =>
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
      singleRecordSupportingMigration: supportingMigration,
      allRecordsMigration,
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
        input.workspaceEvidence.status === "available" ? 2 : 0,
      verificationTransactions:
        input.workspaceEvidence.status === "available"
          ? input.workspaceEvidence.articleVerifications.length +
            input.workspaceEvidence.supportingVerifications.length
          : 0,
      verifiedArtifactReads: verificationResults.reduce(
        (total, result) => total + result.artifacts.readCount,
        0,
      ),
      maximumVerificationArtifactReads:
        (input.workspaceEvidence.status === "available"
          ? input.workspaceEvidence.articleVerifications.length +
            input.workspaceEvidence.supportingVerifications.length
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
    report.version !== KNOWLEDGE_CMS_OPERATIONAL_READINESS_VERSION ||
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
    report.configuration.nativeRepresentationExecutionGate === "invalid" ||
    !["static", "shadow"].includes(
      report.configuration.renderer.requestedMode,
    )
  ) {
    errors.push(
      "Operational readiness must remain zero-write, static-public, non-indexing, non-bulk, and ineligible for cutover.",
    );
  }
  const migration = report.migration;
  const migrationAvailable = migration.status === "available";
  const expectedCompletion = !migration.evidence.ready
    ? "blocked"
    : migration.targets.preparedAbsent > 0
      ? "ready_for_one_record_execution"
      : "complete";
  const firstCreateStep = migration.completion.steps.find(
    (step) => step.action === "create_one_private_draft",
  )?.order ?? null;
  const uniqueTargets = new Set(
    migration.targetEvidence.map((target) => `${target.kind}:${target.id}`),
  );
  const uniqueSteps = new Set(
    migration.completion.steps.map((step) => `${step.kind}:${step.id}`),
  );
  const targetByKey = new Map(
    migration.targetEvidence.map((target) => [
      `${target.kind}:${target.id}`,
      target,
    ]),
  );
  const kindOrder: Record<KnowledgeCmsRecordKind, number> = {
    topic: 0,
    faq: 1,
    article: 2,
  };
  const orderedSteps = migration.completion.steps.every(
    (step, index, steps) =>
      step.order === index + 1 &&
      (index === 0 ||
        kindOrder[steps[index - 1].kind] <= kindOrder[step.kind]),
  );
  if (
    migration.completion.bulkExecution ||
    migration.completion.executionAuthorized ||
    !migration.completion.refreshAfterEveryExecution ||
    migration.completion.writeCount !== 0 ||
    migration.completion.status !== expectedCompletion ||
    migration.completion.nextStep !==
      (expectedCompletion === "ready_for_one_record_execution"
        ? firstCreateStep
        : null) ||
    migration.targets.preparedAbsent +
        migration.targets.verifiedPrivateDrafts +
        migration.targets.verifiedAdvancedRecords +
        migration.targets.blocked !==
      migration.targets.total ||
    migration.completion.prepared !== migration.targets.preparedAbsent ||
    migration.completion.verified !==
      migration.targets.verifiedPrivateDrafts +
        migration.targets.verifiedAdvancedRecords ||
    migration.completion.steps.length !== migration.targets.total ||
    migration.targetEvidence.length !== migration.targets.total ||
    uniqueTargets.size !== migration.targets.total ||
    uniqueSteps.size !== migration.targets.total ||
    !orderedSteps ||
    migration.completion.steps.some(
      (step) => {
        const target = targetByKey.get(`${step.kind}:${step.id}`);
        const expectedAction = target?.status === "blocked"
          ? "blocked"
          : target?.status === "prepared_absent"
            ? "create_one_private_draft"
            : "verify_only";
        return (
        !target ||
        step.slug !== target.slug ||
        step.title !== target.title ||
        step.targetStatus !== target.status ||
        step.action !== expectedAction ||
        !step.refreshRequired ||
        step.executionGate !==
          (step.kind === "article"
            ? "KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED"
            : "KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED") ||
        (step.action !== "create_one_private_draft" &&
          step.expectedAtomicWrites !== 0) ||
        (step.kind === "article" &&
          step.action === "create_one_private_draft" &&
          step.expectedAtomicWrites !== 4)
        );
      },
    )
  ) {
    errors.push(
      "The migration completion plan is inconsistent, mutable, bulk-capable, or not a deterministic one-record sequence.",
    );
  }
  if (
    migrationAvailable &&
    (migration.inventory.total !== 45 ||
      migration.inventory.articles !== 22 ||
      migration.inventory.topics !== 12 ||
      migration.inventory.faqs !== 11 ||
      migration.targets.total !== 45 ||
      migration.controls.total !== 45 ||
      migration.controls.articles.total !== 22 ||
      migration.controls.supporting.total !== 23 ||
      report.readBoundary.firestoreInventoryCollectionReads !== 3 ||
      report.readBoundary.firestoreHistoryCollectionReads !== 2)
  ) {
    errors.push(
      "The operational report does not cover the exact 22-article, 12-topic, 11-FAQ inventory and its two history streams.",
    );
  }
  return errors;
}
