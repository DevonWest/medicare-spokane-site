import "server-only";

import { createHash } from "node:crypto";
import {
  buildKnowledgeCmsSearchDocument,
  parseKnowledgeCmsRecord,
  type KnowledgeCmsRecord,
} from "./knowledgeCms";
import {
  buildKnowledgeCmsMigrationPreview,
  type KnowledgeCmsMigrationCandidate,
  type KnowledgeCmsMigrationFaqTarget,
  type KnowledgeCmsMigrationTopicTarget,
} from "./knowledgeCmsMigration";
import {
  fingerprintKnowledgeCmsSupportingMigrationRecord,
  materializeKnowledgeCmsSupportingMigrationRecord,
  validateKnowledgeCmsSupportingMigrationControl,
  type KnowledgeCmsSupportingMigrationKind,
} from "./knowledgeCmsSupportingMigrationControl";
import { getKnowledgeCmsSupportingMigrationControlInput } from "./knowledgeCmsSupportingMigrationExecution";

export const KNOWLEDGE_CMS_SUPPORTING_MIGRATION_VERIFICATION_VERSION = 1 as const;
export const KNOWLEDGE_CMS_SUPPORTING_MIGRATION_HISTORY_LIMIT = 100 as const;
export const KNOWLEDGE_CMS_SUPPORTING_MIGRATION_VERIFICATION_WRITE_COUNT = 0 as const;

const idPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const hashPattern = /^[a-f0-9]{64}$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const canonicalPathPattern = /^\/[A-Za-z0-9][A-Za-z0-9/_-]{0,499}$/;
const controlIdPattern =
  /^resource-library-(topic|faq)-control--[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;

type SupportingCandidate = KnowledgeCmsMigrationCandidate & {
  target: KnowledgeCmsMigrationTopicTarget | KnowledgeCmsMigrationFaqTarget;
};

export interface KnowledgeCmsSupportingMigrationAuditEvidence {
  auditEventId: string;
  actorId: string;
  kind: KnowledgeCmsSupportingMigrationKind;
  recordId: string;
  slug: string;
  canonicalPath?: string;
  occurredAt: string;
  controlId: string;
  controlFingerprint: string;
  executionVersion: number;
  writeCount: number;
  recordFingerprint: string;
}

export interface KnowledgeCmsSupportingMigrationHistoryEntry
  extends KnowledgeCmsSupportingMigrationAuditEvidence {
  title?: string;
  controlValidation: "verified" | "mismatch";
  evidenceFingerprint: string;
}

export interface KnowledgeCmsSupportingMigrationExecutionHistory {
  mode: "authenticated_supporting_execution_history";
  summary: {
    eventsObserved: number;
    validEvents: number;
    invalidEvents: number;
    controlsVerified: number;
    controlsMismatched: number;
    truncated: boolean;
    collectionReads: 1;
    writeCount: typeof KNOWLEDGE_CMS_SUPPORTING_MIGRATION_VERIFICATION_WRITE_COUNT;
  };
  entries: KnowledgeCmsSupportingMigrationHistoryEntry[];
}

export type KnowledgeCmsSupportingMigrationVerificationCheckCode =
  | "audit_evidence"
  | "control_fingerprint"
  | "record_snapshot"
  | "record_fingerprint"
  | "slug_lock"
  | "canonical_lock"
  | "search_projection";

export interface KnowledgeCmsSupportingMigrationVerificationCheck {
  code: KnowledgeCmsSupportingMigrationVerificationCheckCode;
  status: "verified" | "failed" | "not_applicable";
  detail: string;
}

export interface KnowledgeCmsSupportingMigrationPostCreateVerification {
  version: typeof KNOWLEDGE_CMS_SUPPORTING_MIGRATION_VERIFICATION_VERSION;
  mode: "post_create_read_only_verification";
  status: "verified_private_draft" | "record_advanced" | "failed";
  kind: KnowledgeCmsSupportingMigrationKind;
  recordId: string;
  observedAt: string;
  currentRevision?: number;
  history?: KnowledgeCmsSupportingMigrationHistoryEntry;
  checks: KnowledgeCmsSupportingMigrationVerificationCheck[];
  artifacts: {
    readCount: 4 | 5;
    writeCount: typeof KNOWLEDGE_CMS_SUPPORTING_MIGRATION_VERIFICATION_WRITE_COUNT;
    repairAttempted: false;
  };
  rollout: {
    publicSource: "existing_static_experience";
    cmsRecordPubliclyRendered: false;
    indexingChanged: false;
    cutoverEligible: false;
  };
  fingerprint: { algorithm: "sha256"; value: string };
}

export interface KnowledgeCmsSupportingMigrationVerificationArtifacts {
  kind: KnowledgeCmsSupportingMigrationKind;
  auditDocumentId: string;
  auditData: unknown;
  recordData: unknown;
  slugLockData: unknown;
  canonicalLockData?: unknown;
  searchData?: unknown;
  observedAt: Date;
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

function fingerprint(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const item of Object.values(value as Record<string, unknown>)) {
      deepFreeze(item);
    }
    Object.freeze(value);
  }
  return value;
}

function asObject(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function isIsoDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    !Number.isNaN(new Date(value).getTime()) &&
    new Date(value).toISOString() === value
  );
}

export function getKnowledgeCmsSupportingMigrationAuditDocumentId(
  kind: KnowledgeCmsSupportingMigrationKind,
  recordId: string,
): string {
  return `${kind}--${recordId}--0000000001`;
}

export function parseKnowledgeCmsSupportingMigrationAuditEvidence(
  auditEventId: string,
  value: unknown,
): KnowledgeCmsSupportingMigrationAuditEvidence | undefined {
  const data = asObject(value);
  if (!data || data.event !== "migration_create_private_supporting_draft") {
    return undefined;
  }
  const kind = data.kind;
  const canonicalPath = data.canonicalPath;
  if (
    (kind !== "topic" && kind !== "faq") ||
    typeof data.recordId !== "string" ||
    !idPattern.test(data.recordId) ||
    auditEventId !==
      getKnowledgeCmsSupportingMigrationAuditDocumentId(kind, data.recordId) ||
    typeof data.actorId !== "string" ||
    !idPattern.test(data.actorId) ||
    typeof data.slug !== "string" ||
    !slugPattern.test(data.slug) ||
    !isIsoDate(data.occurredAt) ||
    typeof data.migrationControlId !== "string" ||
    !controlIdPattern.test(data.migrationControlId) ||
    !data.migrationControlId.startsWith(
      `resource-library-${kind}-control--`,
    ) ||
    typeof data.migrationControlFingerprint !== "string" ||
    !hashPattern.test(data.migrationControlFingerprint) ||
    data.revision !== 1 ||
    data.status !== "draft" ||
    data.publicSource !== "existing_static_experience" ||
    data.migrationExecutionVersion !== 1 ||
    typeof data.migrationRecordFingerprint !== "string" ||
    !hashPattern.test(data.migrationRecordFingerprint) ||
    (canonicalPath !== undefined &&
      (typeof canonicalPath !== "string" ||
        !canonicalPathPattern.test(canonicalPath))) ||
    data.migrationWriteCount !== (canonicalPath === undefined ? 3 : 4)
  ) {
    return undefined;
  }
  return {
    auditEventId,
    actorId: data.actorId,
    kind,
    recordId: data.recordId,
    slug: data.slug,
    ...(typeof canonicalPath === "string" ? { canonicalPath } : {}),
    occurredAt: data.occurredAt,
    controlId: data.migrationControlId,
    controlFingerprint: data.migrationControlFingerprint,
    executionVersion: 1,
    writeCount: data.migrationWriteCount as 3 | 4,
    recordFingerprint: data.migrationRecordFingerprint,
  };
}

function resolveControl(evidence: KnowledgeCmsSupportingMigrationAuditEvidence) {
  const matches = buildKnowledgeCmsMigrationPreview({
    asOf: new Date(evidence.occurredAt),
    rendererMode: "static",
  }).candidates.filter(
    (item): item is SupportingCandidate =>
      item.target.kind === evidence.kind &&
      item.target.controlRecord?.controlId === evidence.controlId,
  );
  const candidate = matches.length === 1 ? matches[0] : undefined;
  const control =
    candidate?.target.kind === "topic" || candidate?.target.kind === "faq"
      ? candidate.target.controlRecord
      : undefined;
  const controlInput =
    candidate?.target.kind === "topic" || candidate?.target.kind === "faq"
      ? getKnowledgeCmsSupportingMigrationControlInput(candidate)
      : undefined;
  return {
    candidate,
    control,
    verified: Boolean(
      control &&
        controlInput &&
        control.controlId === evidence.controlId &&
        control.fingerprint.value === evidence.controlFingerprint &&
        validateKnowledgeCmsSupportingMigrationControl(
          control,
          controlInput,
        ).length === 0 &&
        candidate?.target.id === evidence.recordId &&
        candidate.target.slug === evidence.slug &&
        candidate.target.canonicalPath === evidence.canonicalPath,
    ),
  };
}

function historyEntry(
  evidence: KnowledgeCmsSupportingMigrationAuditEvidence,
): KnowledgeCmsSupportingMigrationHistoryEntry {
  const resolved = resolveControl(evidence);
  const title = resolved.candidate?.target.title;
  const unsigned = {
    ...evidence,
    ...(title ? { title } : {}),
    controlValidation: resolved.verified ? "verified" : "mismatch",
  } as const;
  return deepFreeze({
    ...unsigned,
    evidenceFingerprint: fingerprint(unsigned),
  });
}

export function buildKnowledgeCmsSupportingMigrationExecutionHistory(
  documents: ReadonlyArray<{ id: string; data: unknown }>,
): KnowledgeCmsSupportingMigrationExecutionHistory {
  const parsed = documents.map((document) =>
    parseKnowledgeCmsSupportingMigrationAuditEvidence(
      document.id,
      document.data,
    ),
  );
  const valid = parsed.filter(
    (item): item is KnowledgeCmsSupportingMigrationAuditEvidence => Boolean(item),
  );
  const entries = valid
    .map(historyEntry)
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
    .slice(0, KNOWLEDGE_CMS_SUPPORTING_MIGRATION_HISTORY_LIMIT);
  return deepFreeze({
    mode: "authenticated_supporting_execution_history" as const,
    summary: {
      eventsObserved: documents.length,
      validEvents: valid.length,
      invalidEvents: documents.length - valid.length,
      controlsVerified: entries.filter(
        (entry) => entry.controlValidation === "verified",
      ).length,
      controlsMismatched: entries.filter(
        (entry) => entry.controlValidation === "mismatch",
      ).length,
      truncated: valid.length > KNOWLEDGE_CMS_SUPPORTING_MIGRATION_HISTORY_LIMIT,
      collectionReads: 1 as const,
      writeCount: KNOWLEDGE_CMS_SUPPORTING_MIGRATION_VERIFICATION_WRITE_COUNT,
    },
    entries,
  });
}

function check(
  code: KnowledgeCmsSupportingMigrationVerificationCheckCode,
  status: KnowledgeCmsSupportingMigrationVerificationCheck["status"],
  detail: string,
): KnowledgeCmsSupportingMigrationVerificationCheck {
  return { code, status, detail };
}

function isExactArtifact(
  value: unknown,
  expected: Record<string, unknown>,
): boolean {
  return Boolean(
    asObject(value) && canonicalJson(value) === canonicalJson(expected),
  );
}

export function buildKnowledgeCmsSupportingMigrationPostCreateVerification(
  artifacts: KnowledgeCmsSupportingMigrationVerificationArtifacts,
): KnowledgeCmsSupportingMigrationPostCreateVerification {
  if (Number.isNaN(artifacts.observedAt.getTime())) {
    throw new Error("Supporting migration verification requires a valid server clock.");
  }
  const evidence = parseKnowledgeCmsSupportingMigrationAuditEvidence(
    artifacts.auditDocumentId,
    artifacts.auditData,
  );
  const checks: KnowledgeCmsSupportingMigrationVerificationCheck[] = [];
  checks.push(
    check(
      "audit_evidence",
      evidence && evidence.kind === artifacts.kind ? "verified" : "failed",
      evidence
        ? "The append-only revision-one migration audit event is structurally valid."
        : "The revision-one migration audit event is missing or invalid.",
    ),
  );
  const resolved = evidence ? resolveControl(evidence) : undefined;
  checks.push(
    check(
      "control_fingerprint",
      resolved?.verified ? "verified" : "failed",
      resolved?.verified
        ? "The stored control ID and SHA-256 match the current governed registry."
        : "The stored control evidence does not match the current governed registry.",
    ),
  );

  const expectedRecord =
    evidence && resolved?.verified && resolved.control
      ? materializeKnowledgeCmsSupportingMigrationRecord(
          resolved.control,
          evidence.actorId,
          evidence.occurredAt,
        )
      : undefined;
  const expectedRecordFingerprint = expectedRecord
    ? fingerprintKnowledgeCmsSupportingMigrationRecord(expectedRecord)
    : undefined;
  const fingerprintVerified = Boolean(
    evidence &&
      expectedRecordFingerprint &&
      evidence.recordFingerprint === expectedRecordFingerprint,
  );
  checks.push(
    check(
      "record_fingerprint",
      fingerprintVerified ? "verified" : "failed",
      fingerprintVerified
        ? "The immutable audit fingerprint matches the server-reconstructed private draft."
        : "The immutable audit fingerprint does not match the governed private draft.",
    ),
  );

  let record: KnowledgeCmsRecord | undefined;
  try {
    const parsed = artifacts.recordData
      ? parseKnowledgeCmsRecord(artifacts.recordData)
      : undefined;
    record = parsed?.kind === "topic" || parsed?.kind === "faq"
      ? parsed
      : undefined;
  } catch {
    record = undefined;
  }
  const initialRecordMatches = Boolean(
    record &&
      expectedRecord &&
      record.audit.revision === 1 &&
      fingerprintKnowledgeCmsSupportingMigrationRecord(record) ===
        fingerprintKnowledgeCmsSupportingMigrationRecord(expectedRecord),
  );
  const advancedRecordMatches = Boolean(
    record &&
      evidence &&
      record.audit.revision > 1 &&
      record.kind === evidence.kind &&
      record.id === evidence.recordId &&
      record.audit.createdAt === evidence.occurredAt &&
      record.audit.createdBy === evidence.actorId,
  );
  const recordValid = initialRecordMatches || advancedRecordMatches;
  checks.push(
    check(
      "record_snapshot",
      recordValid ? "verified" : "failed",
      initialRecordMatches
        ? "The revision-one record exactly matches the server-reconstructed private draft."
        : advancedRecordMatches
          ? "The record has valid later revisions while retaining its migration creation provenance."
          : "The current record is missing or contradicts its migration creation evidence.",
    ),
  );

  const slugVerified = Boolean(
    record &&
      isExactArtifact(artifacts.slugLockData, {
        kind: record.kind,
        recordId: record.id,
        slug: record.slug,
        updatedAt: record.audit.updatedAt,
      }),
  );
  checks.push(
    check(
      "slug_lock",
      slugVerified ? "verified" : "failed",
      slugVerified
        ? "The current slug is owned by the exact expected lock."
        : "The current slug lock is missing or contradictory.",
    ),
  );
  const canonicalPath = record?.discoverability.canonicalPath;
  const canonicalStatus = !record
    ? "failed"
    : !canonicalPath
      ? artifacts.canonicalLockData === undefined
        ? "not_applicable"
        : "failed"
      : isExactArtifact(artifacts.canonicalLockData, {
            kind: record.kind,
            recordId: record.id,
            canonicalPath,
            updatedAt: record.audit.updatedAt,
          })
        ? "verified"
        : "failed";
  checks.push(
    check(
      "canonical_lock",
      canonicalStatus,
      canonicalStatus === "verified"
        ? "The current canonical path is owned by the exact expected lock."
        : canonicalStatus === "not_applicable"
          ? "This record has no canonical path and requires no canonical lock."
          : "The canonical-path lock is missing, unexpected, or contradictory.",
    ),
  );
  const expectedSearch = record
    ? buildKnowledgeCmsSearchDocument(record)
    : undefined;
  const searchVerified = expectedSearch
    ? canonicalJson(artifacts.searchData) === canonicalJson(expectedSearch)
    : artifacts.searchData === undefined;
  checks.push(
    check(
      "search_projection",
      searchVerified ? "verified" : "failed",
      searchVerified
        ? expectedSearch
          ? "The current published search projection matches the advanced record."
          : "No search projection exists for the private record."
        : "The search projection is missing, unexpected, or contradicts the current record.",
    ),
  );
  const failed = checks.some((item) => item.status === "failed");
  const status: KnowledgeCmsSupportingMigrationPostCreateVerification["status"] = failed
    ? "failed"
    : record && record.audit.revision > 1
      ? "record_advanced"
      : "verified_private_draft";
  const history = evidence ? historyEntry(evidence) : undefined;
  const unsigned = {
    version: KNOWLEDGE_CMS_SUPPORTING_MIGRATION_VERIFICATION_VERSION,
    mode: "post_create_read_only_verification" as const,
    status,
    kind: artifacts.kind,
    recordId: evidence?.recordId ?? "invalid",
    observedAt: artifacts.observedAt.toISOString(),
    ...(record ? { currentRevision: record.audit.revision } : {}),
    ...(history ? { history } : {}),
    checks,
    artifacts: {
      readCount: (canonicalPath ? 5 : 4) as 4 | 5,
      writeCount: KNOWLEDGE_CMS_SUPPORTING_MIGRATION_VERIFICATION_WRITE_COUNT,
      repairAttempted: false as const,
    },
    rollout: {
      publicSource: "existing_static_experience" as const,
      cmsRecordPubliclyRendered: false as const,
      indexingChanged: false as const,
      cutoverEligible: false as const,
    },
  };
  return deepFreeze({
    ...unsigned,
    fingerprint: { algorithm: "sha256", value: fingerprint(unsigned) },
  });
}
