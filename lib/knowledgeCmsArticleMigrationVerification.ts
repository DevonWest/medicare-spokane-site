import "server-only";

import { createHash } from "node:crypto";
import {
  buildKnowledgeCmsSearchDocument,
  parseKnowledgeCmsRecord,
  type KnowledgeCmsArticle,
} from "./knowledgeCms";
import {
  getKnowledgeCmsArticleMigrationControlInput,
  materializeKnowledgeCmsArticleMigrationRecord,
} from "./knowledgeCmsArticleMigrationDryRun";
import {
  validateKnowledgeCmsArticleMigrationControl,
} from "./knowledgeCmsArticleMigrationControl";
import {
  buildKnowledgeCmsMigrationPreview,
  type KnowledgeCmsMigrationArticleTarget,
} from "./knowledgeCmsMigration";

export const KNOWLEDGE_CMS_ARTICLE_MIGRATION_VERIFICATION_VERSION =
  1 as const;
export const KNOWLEDGE_CMS_ARTICLE_MIGRATION_HISTORY_LIMIT = 100 as const;
export const KNOWLEDGE_CMS_ARTICLE_MIGRATION_VERIFICATION_READ_COUNT =
  5 as const;
export const KNOWLEDGE_CMS_ARTICLE_MIGRATION_VERIFICATION_WRITE_COUNT =
  0 as const;

const identifierPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const controlIdPattern =
  /^resource-library-article-control--[a-z0-9]+(?:-[a-z0-9]+)*$/;
const fingerprintPattern = /^[a-f0-9]{64}$/;
const canonicalPathPattern = /^\/[A-Za-z0-9][A-Za-z0-9/_-]{0,499}$/;

type EvidenceObject = Record<string, unknown>;

export interface KnowledgeCmsArticleMigrationAuditEvidence {
  documentId: string;
  event: "migration_create_private_draft";
  actorId: string;
  kind: "article";
  recordId: string;
  revision: 1;
  status: "draft";
  slug: string;
  occurredAt: string;
  migrationControlId: string;
  migrationControlFingerprint: string;
  publicSource: "verified_static_route";
  evidenceSchema: "execution_v1" | "legacy_pr100";
  canonicalPath?: string;
  migrationExecutionVersion?: 1;
  migrationWriteCount?: 4;
  migrationRecordFingerprint?: string;
}

export interface KnowledgeCmsArticleMigrationHistoryEntry {
  auditEventId: string;
  recordId: string;
  slug: string;
  title?: string;
  canonicalPath?: string;
  occurredAt: string;
  actorId: string;
  control: {
    id: string;
    fingerprint: string;
    validation: "verified" | "mismatch";
  };
  transaction: {
    evidenceSchema: KnowledgeCmsArticleMigrationAuditEvidence["evidenceSchema"];
    executionVersion: 1;
    writeCount: 4;
    createsOnePrivateDraft: true;
  };
  publicSource: "verified_static_route";
  evidenceFingerprint: string;
}

export interface KnowledgeCmsArticleMigrationExecutionHistory {
  version: typeof KNOWLEDGE_CMS_ARTICLE_MIGRATION_VERIFICATION_VERSION;
  mode: "authenticated_execution_history";
  entries: KnowledgeCmsArticleMigrationHistoryEntry[];
  summary: {
    eventsObserved: number;
    validEvents: number;
    invalidEvents: number;
    controlsVerified: number;
    controlsMismatched: number;
    returned: number;
    truncated: boolean;
    collectionReads: 1;
    writeCount: 0;
  };
}

export type KnowledgeCmsArticleMigrationVerificationCheckCode =
  | "audit_event"
  | "deterministic_control"
  | "record_fingerprint"
  | "article_record"
  | "slug_lock"
  | "canonical_lock"
  | "search_projection";

export interface KnowledgeCmsArticleMigrationVerificationCheck {
  code: KnowledgeCmsArticleMigrationVerificationCheckCode;
  status: "verified" | "failed" | "not_applicable";
  detail: string;
}

export interface KnowledgeCmsArticleMigrationPostCreateVerification {
  version: typeof KNOWLEDGE_CMS_ARTICLE_MIGRATION_VERIFICATION_VERSION;
  mode: "post_create_read_only_verification";
  recordId: string;
  observedAt: string;
  status: "verified_private_draft" | "record_advanced" | "failed";
  history?: KnowledgeCmsArticleMigrationHistoryEntry;
  currentRevision?: number;
  checks: KnowledgeCmsArticleMigrationVerificationCheck[];
  artifacts: {
    snapshotSource: "firestore_read_only_transaction";
    readCount: typeof KNOWLEDGE_CMS_ARTICLE_MIGRATION_VERIFICATION_READ_COUNT;
    writeCount: typeof KNOWLEDGE_CMS_ARTICLE_MIGRATION_VERIFICATION_WRITE_COUNT;
    repairAttempted: false;
  };
  rollout: {
    publicSource: "verified_static_route";
    cmsBodyPubliclyRendered: false;
    indexingChanged: false;
    cutoverEligible: false;
  };
  fingerprint: {
    algorithm: "sha256";
    canonicalization: "recursive_sorted_keys";
    value: string;
  };
}

export interface KnowledgeCmsArticleMigrationVerificationArtifacts {
  auditDocumentId: string;
  auditData: unknown;
  recordData: unknown;
  slugLockData: unknown;
  canonicalLockData: unknown;
  searchData: unknown;
  observedAt: Date;
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }

  const entries = Object.entries(value as EvidenceObject)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) =>
      left < right ? -1 : left > right ? 1 : 0,
    );
  return `{${entries
    .map(
      ([key, item]) =>
        `${JSON.stringify(key)}:${canonicalJson(item)}`,
    )
    .join(",")}}`;
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const item of Object.values(value as EvidenceObject)) {
      deepFreeze(item);
    }
    Object.freeze(value);
  }
  return value;
}

function isObject(value: unknown): value is EvidenceObject {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isExactIsoDateTime(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

function isCanonicalPath(value: unknown): value is string {
  return typeof value === "string" && canonicalPathPattern.test(value);
}

function hasCurrentAuditEvidence(value: EvidenceObject): boolean {
  const fields = [
    value.canonicalPath,
    value.migrationExecutionVersion,
    value.migrationWriteCount,
    value.migrationRecordFingerprint,
  ];
  return fields.every((item) => item !== undefined);
}

function hasPartialCurrentAuditEvidence(value: EvidenceObject): boolean {
  const fields = [
    value.canonicalPath,
    value.migrationExecutionVersion,
    value.migrationWriteCount,
    value.migrationRecordFingerprint,
  ];
  return fields.some((item) => item !== undefined) &&
    !fields.every((item) => item !== undefined);
}

export function getKnowledgeCmsArticleMigrationAuditDocumentId(
  recordId: string,
): string {
  return `article--${recordId}--0000000001`;
}

export function fingerprintKnowledgeCmsArticleMigrationRecord(
  record: KnowledgeCmsArticle,
): string {
  return fingerprint(parseKnowledgeCmsRecord(record));
}

export function parseKnowledgeCmsArticleMigrationAuditEvidence(
  documentId: string,
  value: unknown,
): KnowledgeCmsArticleMigrationAuditEvidence | undefined {
  if (!isObject(value)) {
    return undefined;
  }
  if (
    value.event !== "migration_create_private_draft" ||
    value.kind !== "article" ||
    value.revision !== 1 ||
    value.status !== "draft" ||
    value.publicSource !== "verified_static_route" ||
    typeof value.actorId !== "string" ||
    !identifierPattern.test(value.actorId) ||
    typeof value.recordId !== "string" ||
    !identifierPattern.test(value.recordId) ||
    typeof value.slug !== "string" ||
    !slugPattern.test(value.slug) ||
    !isExactIsoDateTime(value.occurredAt) ||
    typeof value.migrationControlId !== "string" ||
    !controlIdPattern.test(value.migrationControlId) ||
    typeof value.migrationControlFingerprint !== "string" ||
    !fingerprintPattern.test(value.migrationControlFingerprint) ||
    documentId !==
      getKnowledgeCmsArticleMigrationAuditDocumentId(value.recordId) ||
    hasPartialCurrentAuditEvidence(value)
  ) {
    return undefined;
  }

  if (hasCurrentAuditEvidence(value)) {
    if (
      !isCanonicalPath(value.canonicalPath) ||
      value.migrationExecutionVersion !== 1 ||
      value.migrationWriteCount !== 4 ||
      typeof value.migrationRecordFingerprint !== "string" ||
      !fingerprintPattern.test(value.migrationRecordFingerprint)
    ) {
      return undefined;
    }
    return {
      documentId,
      event: "migration_create_private_draft",
      actorId: value.actorId,
      kind: "article",
      recordId: value.recordId,
      revision: 1,
      status: "draft",
      slug: value.slug,
      occurredAt: value.occurredAt,
      migrationControlId: value.migrationControlId,
      migrationControlFingerprint: value.migrationControlFingerprint,
      publicSource: "verified_static_route",
      evidenceSchema: "execution_v1",
      canonicalPath: value.canonicalPath,
      migrationExecutionVersion: 1,
      migrationWriteCount: 4,
      migrationRecordFingerprint: value.migrationRecordFingerprint,
    };
  }

  return {
    documentId,
    event: "migration_create_private_draft",
    actorId: value.actorId,
    kind: "article",
    recordId: value.recordId,
    revision: 1,
    status: "draft",
    slug: value.slug,
    occurredAt: value.occurredAt,
    migrationControlId: value.migrationControlId,
    migrationControlFingerprint: value.migrationControlFingerprint,
    publicSource: "verified_static_route",
    evidenceSchema: "legacy_pr100",
  };
}

function resolveControlTarget(
  evidence: KnowledgeCmsArticleMigrationAuditEvidence,
): KnowledgeCmsMigrationArticleTarget | undefined {
  const preview = buildKnowledgeCmsMigrationPreview({
    asOf: new Date(evidence.occurredAt),
    rendererMode: "static",
  });
  const matches = preview.candidates.filter(
    (
      candidate,
    ): candidate is typeof candidate & {
      target: KnowledgeCmsMigrationArticleTarget;
    } =>
      candidate.target.kind === "article" &&
      candidate.target.controlRecord?.controlId ===
        evidence.migrationControlId,
  );
  if (matches.length !== 1) {
    return undefined;
  }

  const target = matches[0].target;
  const control = target.controlRecord;
  const input = getKnowledgeCmsArticleMigrationControlInput(target);
  if (
    !control ||
    !input ||
    control.fingerprint.value !== evidence.migrationControlFingerprint ||
    validateKnowledgeCmsArticleMigrationControl(control, input).length > 0 ||
    target.id !== evidence.recordId ||
    target.slug !== evidence.slug ||
    (evidence.canonicalPath !== undefined &&
      target.canonicalPath !== evidence.canonicalPath)
  ) {
    return undefined;
  }
  return target;
}

function historyEntryFromEvidence(
  evidence: KnowledgeCmsArticleMigrationAuditEvidence,
): KnowledgeCmsArticleMigrationHistoryEntry {
  const target = resolveControlTarget(evidence);
  const stableEvidence = {
    ...evidence,
    evidenceSchema: evidence.evidenceSchema,
  };
  return {
    auditEventId: evidence.documentId,
    recordId: evidence.recordId,
    slug: evidence.slug,
    ...(target?.title ? { title: target.title } : {}),
    ...(target?.canonicalPath || evidence.canonicalPath
      ? {
          canonicalPath:
            target?.canonicalPath ?? evidence.canonicalPath,
        }
      : {}),
    occurredAt: evidence.occurredAt,
    actorId: evidence.actorId,
    control: {
      id: evidence.migrationControlId,
      fingerprint: evidence.migrationControlFingerprint,
      validation: target ? "verified" : "mismatch",
    },
    transaction: {
      evidenceSchema: evidence.evidenceSchema,
      executionVersion: 1,
      writeCount: 4,
      createsOnePrivateDraft: true,
    },
    publicSource: "verified_static_route",
    evidenceFingerprint: fingerprint(stableEvidence),
  };
}

export function buildKnowledgeCmsArticleMigrationExecutionHistory(
  documents: ReadonlyArray<{ id: string; data: unknown }>,
): KnowledgeCmsArticleMigrationExecutionHistory {
  const entries: KnowledgeCmsArticleMigrationHistoryEntry[] = [];
  let invalidEvents = 0;

  for (const document of documents) {
    const evidence = parseKnowledgeCmsArticleMigrationAuditEvidence(
      document.id,
      document.data,
    );
    if (!evidence) {
      invalidEvents += 1;
      continue;
    }
    entries.push(historyEntryFromEvidence(evidence));
  }

  entries.sort((left, right) =>
    right.occurredAt.localeCompare(left.occurredAt),
  );
  const truncated = entries.length >
    KNOWLEDGE_CMS_ARTICLE_MIGRATION_HISTORY_LIMIT;
  const returned = entries.slice(
    0,
    KNOWLEDGE_CMS_ARTICLE_MIGRATION_HISTORY_LIMIT,
  );

  return deepFreeze({
    version: KNOWLEDGE_CMS_ARTICLE_MIGRATION_VERIFICATION_VERSION,
    mode: "authenticated_execution_history",
    entries: returned,
    summary: {
      eventsObserved: documents.length,
      validEvents: entries.length,
      invalidEvents,
      controlsVerified: entries.filter(
        (entry) => entry.control.validation === "verified",
      ).length,
      controlsMismatched: entries.filter(
        (entry) => entry.control.validation === "mismatch",
      ).length,
      returned: returned.length,
      truncated,
      collectionReads: 1,
      writeCount: 0,
    },
  });
}

function isExactLock(
  value: unknown,
  expected: EvidenceObject,
): boolean {
  return isObject(value) && canonicalJson(value) === canonicalJson(expected);
}

function check(
  code: KnowledgeCmsArticleMigrationVerificationCheckCode,
  status: KnowledgeCmsArticleMigrationVerificationCheck["status"],
  detail: string,
): KnowledgeCmsArticleMigrationVerificationCheck {
  return { code, status, detail };
}

export function buildKnowledgeCmsArticleMigrationPostCreateVerification(
  input: KnowledgeCmsArticleMigrationVerificationArtifacts,
): KnowledgeCmsArticleMigrationPostCreateVerification {
  const recordIdFromDocument = input.auditDocumentId.match(
    /^article--(.+)--0000000001$/,
  )?.[1] ?? "invalid-record";
  const checks: KnowledgeCmsArticleMigrationVerificationCheck[] = [];
  const evidence = parseKnowledgeCmsArticleMigrationAuditEvidence(
    input.auditDocumentId,
    input.auditData,
  );
  checks.push(
    check(
      "audit_event",
      evidence ? "verified" : "failed",
      evidence
        ? "The append-only revision-one migration audit event is structurally valid."
        : "The revision-one migration audit event is missing or invalid.",
    ),
  );

  const target = evidence ? resolveControlTarget(evidence) : undefined;
  checks.push(
    check(
      "deterministic_control",
      target ? "verified" : "failed",
      target
        ? "The stored control ID and fingerprint still resolve to one deterministic article target."
        : "The stored migration control is missing, ambiguous, or no longer matches its deterministic target.",
    ),
  );

  let record: KnowledgeCmsArticle | undefined;
  try {
    const parsed = parseKnowledgeCmsRecord(input.recordData);
    if (parsed.kind === "article") {
      record = parsed;
    }
  } catch {
    record = undefined;
  }

  const expectedRecord =
    evidence && target
      ? materializeKnowledgeCmsArticleMigrationRecord(
          target,
          evidence.actorId,
          evidence.occurredAt,
        )
      : undefined;
  const expectedFingerprint = expectedRecord
    ? fingerprintKnowledgeCmsArticleMigrationRecord(expectedRecord)
    : undefined;
  if (evidence?.migrationRecordFingerprint) {
    checks.push(
      check(
        "record_fingerprint",
        expectedFingerprint === evidence.migrationRecordFingerprint
          ? "verified"
          : "failed",
        expectedFingerprint === evidence.migrationRecordFingerprint
          ? "The immutable audit fingerprint matches the server-materialized private draft."
          : "The immutable audit fingerprint does not match the deterministic private draft.",
      ),
    );
  } else {
    checks.push(
      check(
        "record_fingerprint",
        "not_applicable",
        "This execution predates stored record fingerprints; the current artifacts are still checked directly.",
      ),
    );
  }

  const initialRecordMatches = Boolean(
    record &&
      expectedRecord &&
      record.audit.revision === 1 &&
      fingerprintKnowledgeCmsArticleMigrationRecord(record) ===
        fingerprintKnowledgeCmsArticleMigrationRecord(expectedRecord),
  );
  const advancedRecordMatches = Boolean(
    record &&
      evidence &&
      record.audit.revision > 1 &&
      record.id === evidence.recordId &&
      record.audit.createdAt === evidence.occurredAt &&
      record.audit.createdBy === evidence.actorId,
  );
  const recordMatches = initialRecordMatches || advancedRecordMatches;
  checks.push(
    check(
      "article_record",
      recordMatches ? "verified" : "failed",
      initialRecordMatches
        ? "The current revision-one article exactly matches the server-materialized private draft."
        : advancedRecordMatches
          ? "The article has valid later revisions while retaining its migration creation provenance."
          : "The article is missing or does not match the migration creation evidence.",
    ),
  );

  const slugLockMatches = Boolean(
    record &&
      isExactLock(input.slugLockData, {
        kind: "article",
        recordId: record.id,
        slug: record.slug,
        updatedAt: record.audit.updatedAt,
      }),
  );
  checks.push(
    check(
      "slug_lock",
      slugLockMatches ? "verified" : "failed",
      slugLockMatches
        ? "The current article slug is owned by the expected lock."
        : "The article slug lock is missing or contradicts the current record.",
    ),
  );

  const canonicalPath = record?.discoverability.canonicalPath;
  const canonicalLockMatches = Boolean(
    record &&
      canonicalPath &&
      isExactLock(input.canonicalLockData, {
        canonicalPath,
        kind: "article",
        recordId: record.id,
        updatedAt: record.audit.updatedAt,
      }),
  );
  checks.push(
    check(
      "canonical_lock",
      canonicalLockMatches ? "verified" : "failed",
      canonicalLockMatches
        ? "The current canonical path is owned by the expected cross-kind lock."
        : "The canonical-path lock is missing or contradicts the current record.",
    ),
  );

  const expectedSearch = record
    ? buildKnowledgeCmsSearchDocument(record)
    : undefined;
  const searchMatches = expectedSearch
    ? canonicalJson(input.searchData) === canonicalJson(expectedSearch)
    : input.searchData === undefined;
  checks.push(
    check(
      "search_projection",
      searchMatches ? "verified" : "failed",
      searchMatches
        ? expectedSearch
          ? "The current published search projection matches the advanced record."
          : "No search projection exists for the private, indexing-blocked record."
        : "The search projection does not match the current record state.",
    ),
  );

  const failed = checks.some((item) => item.status === "failed");
  const status: KnowledgeCmsArticleMigrationPostCreateVerification["status"] = failed
    ? "failed"
    : record && record.audit.revision > 1
      ? "record_advanced"
      : "verified_private_draft";
  const unsigned = {
    version: KNOWLEDGE_CMS_ARTICLE_MIGRATION_VERIFICATION_VERSION,
    mode: "post_create_read_only_verification" as const,
    recordId: evidence?.recordId ?? recordIdFromDocument,
    observedAt: input.observedAt.toISOString(),
    status,
    ...(evidence
      ? { history: historyEntryFromEvidence(evidence) }
      : {}),
    ...(record ? { currentRevision: record.audit.revision } : {}),
    checks,
    artifacts: {
      snapshotSource: "firestore_read_only_transaction" as const,
      readCount:
        KNOWLEDGE_CMS_ARTICLE_MIGRATION_VERIFICATION_READ_COUNT,
      writeCount:
        KNOWLEDGE_CMS_ARTICLE_MIGRATION_VERIFICATION_WRITE_COUNT,
      repairAttempted: false as const,
    },
    rollout: {
      publicSource: "verified_static_route" as const,
      cmsBodyPubliclyRendered: false as const,
      indexingChanged: false as const,
      cutoverEligible: false as const,
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
