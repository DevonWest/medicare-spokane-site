import { createHash } from "node:crypto";
import {
  assertKnowledgeCmsActionAllowed,
  parseKnowledgeCmsRecord,
  type KnowledgeCmsActor,
  type KnowledgeCmsArticle,
  type KnowledgeCmsRecord,
} from "./knowledgeCms";
import {
  validateKnowledgeCmsArticleMigrationControl,
  type KnowledgeCmsArticleMigrationControlInput,
} from "./knowledgeCmsArticleMigrationControl";
import type {
  KnowledgeCmsMigrationArticleTarget,
  KnowledgeCmsMigrationIssueCode,
  KnowledgeCmsMigrationPreview,
} from "./knowledgeCmsMigration";

export const KNOWLEDGE_CMS_ARTICLE_MATERIALIZATION_DRY_RUN_VERSION =
  1 as const;
export const KNOWLEDGE_CMS_ARTICLE_MATERIALIZATION_DRY_RUN_WRITE_COUNT =
  0 as const;
export const KNOWLEDGE_CMS_ARTICLE_MATERIALIZATION_DRY_RUN_HASH_ALGORITHM =
  "sha256" as const;
export const KNOWLEDGE_CMS_ARTICLE_MATERIALIZATION_DRY_RUN_CANONICALIZATION =
  "recursive_sorted_keys" as const;

const existingConflictCodes = new Set<KnowledgeCmsMigrationIssueCode>([
  "existing_canonical_conflict",
  "existing_content_conflict",
  "existing_id_conflict",
  "existing_record_requires_content_comparison",
  "existing_slug_conflict",
]);

export interface KnowledgeCmsArticleMaterializationReceipt {
  version: typeof KNOWLEDGE_CMS_ARTICLE_MATERIALIZATION_DRY_RUN_VERSION;
  mode: "materialization_dry_run";
  control: {
    id: string | null;
    fingerprint: string | null;
    validation: "verified" | "blocked";
  };
  target: {
    collection: "knowledge_articles";
    id: string;
    slug: string;
    canonicalPath?: string;
    expectedState: "absent";
    observedState: "absent" | "present";
    observedRevision?: number;
    observationSource: "current_firestore_collection_inventory";
    conflictCodes: KnowledgeCmsMigrationIssueCode[];
  };
  binding: {
    actorId: string;
    actorSource: "authenticated_server_session";
    serverTimestamp: string;
    timestampSource: "server_clock";
    ownerMatchesActor: boolean;
    auditMatchesServerClock: boolean;
  };
  materialization: {
    status: "verified_in_memory" | "blocked";
    record?: KnowledgeCmsArticle;
    findings: string[];
  };
  execution: {
    status: "disabled";
    readyToExecute: false;
    writeCount:
      typeof KNOWLEDGE_CMS_ARTICLE_MATERIALIZATION_DRY_RUN_WRITE_COUNT;
    reason: "dry_run_receipt_is_not_execution_authority";
    transactionalRecheckRequired: true;
  };
  rollout: {
    publicSource: "verified_static_route";
    cmsBodyPubliclyRendered: false;
    indexing: "blocked";
    cutoverEligible: false;
  };
  fingerprint: {
    algorithm:
      typeof KNOWLEDGE_CMS_ARTICLE_MATERIALIZATION_DRY_RUN_HASH_ALGORITHM;
    canonicalization:
      typeof KNOWLEDGE_CMS_ARTICLE_MATERIALIZATION_DRY_RUN_CANONICALIZATION;
    value: string;
  };
}

export interface KnowledgeCmsArticleMaterializationDryRun {
  version: typeof KNOWLEDGE_CMS_ARTICLE_MATERIALIZATION_DRY_RUN_VERSION;
  mode: "materialization_dry_run";
  generatedAt: string;
  actor: {
    id: string;
    source: "authenticated_server_session";
  };
  inventory: {
    source: "current_firestore_collection_inventory";
    collectionReads: 3;
    recordsObserved: number;
  };
  summary: {
    controls: number;
    controlsVerified: number;
    expectedAbsentConfirmed: number;
    targetsPresent: number;
    recordsMaterializedInMemory: number;
    receiptsVerified: number;
    blocked: number;
    executionEligible: 0;
    writeCount:
      typeof KNOWLEDGE_CMS_ARTICLE_MATERIALIZATION_DRY_RUN_WRITE_COUNT;
  };
  readyToExecute: false;
  receipts: KnowledgeCmsArticleMaterializationReceipt[];
  fingerprint: {
    algorithm:
      typeof KNOWLEDGE_CMS_ARTICLE_MATERIALIZATION_DRY_RUN_HASH_ALGORITHM;
    canonicalization:
      typeof KNOWLEDGE_CMS_ARTICLE_MATERIALIZATION_DRY_RUN_CANONICALIZATION;
    value: string;
  };
}

export interface BuildKnowledgeCmsArticleMaterializationDryRunInput {
  preview: KnowledgeCmsMigrationPreview;
  existingRecords: ReadonlyArray<KnowledgeCmsRecord>;
  actor: KnowledgeCmsActor;
  now: Date;
}

type UnsignedReceipt = Omit<
  KnowledgeCmsArticleMaterializationReceipt,
  "fingerprint"
>;
type UnsignedDryRun = Omit<
  KnowledgeCmsArticleMaterializationDryRun,
  "fingerprint"
>;

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
    .map(
      ([key, item]) =>
        `${JSON.stringify(key)}:${canonicalJson(item)}`,
    )
    .join(",")}}`;
}

function fingerprint(value: unknown): string {
  return createHash(
    KNOWLEDGE_CMS_ARTICLE_MATERIALIZATION_DRY_RUN_HASH_ALGORITHM,
  )
    .update(canonicalJson(value))
    .digest("hex");
}

function deepFreeze<T>(value: T): T {
  if (
    value &&
    typeof value === "object" &&
    !Object.isFrozen(value)
  ) {
    for (const item of Object.values(value as Record<string, unknown>)) {
      deepFreeze(item);
    }
    Object.freeze(value);
  }
  return value;
}

function controlInputForTarget(
  target: KnowledgeCmsMigrationArticleTarget,
): KnowledgeCmsArticleMigrationControlInput | undefined {
  if (
    !target.routeParity ||
    !target.rendererContract ||
    !target.canonicalPath ||
    !target.pageTitle ||
    !target.description
  ) {
    return undefined;
  }

  return {
    target: {
      id: target.id,
      kind: "article",
      slug: target.slug,
      title: target.title,
      summary: target.summary,
      searchTerms: [...target.searchTerms],
      relationships: target.relationships,
      sources: target.sources,
      canonicalPath: target.canonicalPath,
      pageTitle: target.pageTitle,
      description: target.description,
    },
    routeParity: target.routeParity,
    rendererContract: target.rendererContract,
  };
}

function materializeRecord(
  target: KnowledgeCmsMigrationArticleTarget,
  actorId: string,
  serverTimestamp: string,
): KnowledgeCmsArticle {
  if (!target.controlRecord) {
    throw new Error("The deterministic article control is missing.");
  }

  const record = parseKnowledgeCmsRecord({
    ...target.controlRecord.target.payload,
    ownerId: actorId,
    audit: {
      revision: 1,
      createdAt: serverTimestamp,
      createdBy: actorId,
      updatedAt: serverTimestamp,
      updatedBy: actorId,
    },
  });
  if (record.kind !== "article") {
    throw new Error("The materialized control did not produce an article.");
  }
  return record;
}

function currentInventoryConflictCodes(
  target: KnowledgeCmsMigrationArticleTarget,
  existingRecords: ReadonlyArray<KnowledgeCmsRecord>,
): KnowledgeCmsMigrationIssueCode[] {
  const codes = new Set<KnowledgeCmsMigrationIssueCode>();
  const sameId = existingRecords.find(
    (record) => record.kind === "article" && record.id === target.id,
  );
  if (sameId) {
    if (
      sameId.slug !== target.slug ||
      sameId.discoverability.canonicalPath !== target.canonicalPath
    ) {
      codes.add("existing_id_conflict");
    } else {
      codes.add("existing_record_requires_content_comparison");
    }
  }
  if (
    existingRecords.some(
      (record) =>
        record.kind === "article" &&
        record.slug === target.slug &&
        record.id !== target.id,
    )
  ) {
    codes.add("existing_slug_conflict");
  }
  if (
    target.canonicalPath &&
    existingRecords.some(
      (record) =>
        record.discoverability.canonicalPath === target.canonicalPath &&
        (record.kind !== "article" || record.id !== target.id),
    )
  ) {
    codes.add("existing_canonical_conflict");
  }
  return [...codes].sort();
}

function buildReceipt(
  target: KnowledgeCmsMigrationArticleTarget,
  conflictCodes: KnowledgeCmsMigrationIssueCode[],
  existingRecord: KnowledgeCmsRecord | undefined,
  actorId: string,
  serverTimestamp: string,
): KnowledgeCmsArticleMaterializationReceipt {
  const findings: string[] = [];
  const controlFindings: string[] = [];
  const controlInput = controlInputForTarget(target);
  if (!target.controlRecord || !controlInput) {
    controlFindings.push(
      "The deterministic control, route parity, or renderer contract is missing.",
    );
  } else {
    controlFindings.push(
      ...validateKnowledgeCmsArticleMigrationControl(
        target.controlRecord,
        controlInput,
      ),
    );
  }
  findings.push(...controlFindings);
  if (existingRecord) {
    findings.push(
      `The expected-absent target exists at revision ${existingRecord.audit.revision}.`,
    );
  }
  if (conflictCodes.length > 0) {
    findings.push(
      `Current Firestore inventory has creation conflicts: ${conflictCodes.join(", ")}.`,
    );
  }

  let record: KnowledgeCmsArticle | undefined;
  if (findings.length === 0) {
    try {
      record = materializeRecord(target, actorId, serverTimestamp);
    } catch (error) {
      findings.push(
        error instanceof Error
          ? error.message
          : "The private draft could not be materialized in memory.",
      );
    }
  }

  const unsigned: UnsignedReceipt = {
    version: KNOWLEDGE_CMS_ARTICLE_MATERIALIZATION_DRY_RUN_VERSION,
    mode: "materialization_dry_run",
    control: {
      id: target.controlRecord?.controlId ?? null,
      fingerprint: target.controlRecord?.fingerprint.value ?? null,
      validation:
        target.controlRecord &&
        controlInput &&
        controlFindings.length === 0
          ? "verified"
          : "blocked",
    },
    target: {
      collection: "knowledge_articles",
      id: target.id,
      slug: target.slug,
      ...(target.canonicalPath
        ? { canonicalPath: target.canonicalPath }
        : {}),
      expectedState: "absent",
      observedState: existingRecord ? "present" : "absent",
      ...(existingRecord
        ? { observedRevision: existingRecord.audit.revision }
        : {}),
      observationSource: "current_firestore_collection_inventory",
      conflictCodes: [...conflictCodes],
    },
    binding: {
      actorId,
      actorSource: "authenticated_server_session",
      serverTimestamp,
      timestampSource: "server_clock",
      ownerMatchesActor: record?.ownerId === actorId,
      auditMatchesServerClock: Boolean(
        record &&
          record.audit.createdAt === serverTimestamp &&
          record.audit.updatedAt === serverTimestamp &&
          record.audit.createdBy === actorId &&
          record.audit.updatedBy === actorId,
      ),
    },
    materialization: {
      status: record ? "verified_in_memory" : "blocked",
      ...(record ? { record } : {}),
      findings: [...new Set(findings)],
    },
    execution: {
      status: "disabled",
      readyToExecute: false,
      writeCount:
        KNOWLEDGE_CMS_ARTICLE_MATERIALIZATION_DRY_RUN_WRITE_COUNT,
      reason: "dry_run_receipt_is_not_execution_authority",
      transactionalRecheckRequired: true,
    },
    rollout: {
      publicSource: "verified_static_route",
      cmsBodyPubliclyRendered: false,
      indexing: "blocked",
      cutoverEligible: false,
    },
  };

  return deepFreeze({
    ...unsigned,
    fingerprint: {
      algorithm:
        KNOWLEDGE_CMS_ARTICLE_MATERIALIZATION_DRY_RUN_HASH_ALGORITHM,
      canonicalization:
        KNOWLEDGE_CMS_ARTICLE_MATERIALIZATION_DRY_RUN_CANONICALIZATION,
      value: fingerprint(unsigned),
    },
  });
}

export function buildKnowledgeCmsArticleMaterializationDryRun(
  input: BuildKnowledgeCmsArticleMaterializationDryRunInput,
): KnowledgeCmsArticleMaterializationDryRun {
  assertKnowledgeCmsActionAllowed(input.actor, "preview_migration");
  if (Number.isNaN(input.now.getTime())) {
    throw new Error(
      "Knowledge CMS article materialization dry run requires a valid server clock.",
    );
  }
  const generatedAt = input.now.toISOString();
  const articleCandidates = input.preview.candidates.filter(
    (
      candidate,
    ): candidate is typeof candidate & {
      target: KnowledgeCmsMigrationArticleTarget;
    } => candidate.target.kind === "article",
  );

  const receipts = articleCandidates.map((candidate) => {
    const existingRecord = input.existingRecords.find(
      (record) =>
        record.kind === "article" &&
        record.id === candidate.target.id,
    );
    const conflictCodes = [
      ...new Set([
        ...currentInventoryConflictCodes(
          candidate.target,
          input.existingRecords,
        ),
        ...candidate.issues
          .map((item) => item.code)
          .filter((code) => existingConflictCodes.has(code)),
      ]),
    ].sort();
    return buildReceipt(
      candidate.target,
      conflictCodes,
      existingRecord,
      input.actor.id,
      generatedAt,
    );
  });
  const controlsVerified = receipts.filter(
    (receipt) => receipt.control.validation === "verified",
  ).length;
  const recordsMaterializedInMemory = receipts.filter(
    (receipt) =>
      receipt.materialization.status === "verified_in_memory",
  ).length;
  const unsigned: UnsignedDryRun = {
    version: KNOWLEDGE_CMS_ARTICLE_MATERIALIZATION_DRY_RUN_VERSION,
    mode: "materialization_dry_run",
    generatedAt,
    actor: {
      id: input.actor.id,
      source: "authenticated_server_session",
    },
    inventory: {
      source: "current_firestore_collection_inventory",
      collectionReads: 3,
      recordsObserved: input.existingRecords.length,
    },
    summary: {
      controls: receipts.length,
      controlsVerified,
      expectedAbsentConfirmed: receipts.filter(
        (receipt) => receipt.target.observedState === "absent",
      ).length,
      targetsPresent: receipts.filter(
        (receipt) => receipt.target.observedState === "present",
      ).length,
      recordsMaterializedInMemory,
      receiptsVerified: receipts.filter(
        (receipt) => /^[a-f0-9]{64}$/.test(receipt.fingerprint.value),
      ).length,
      blocked: receipts.length - recordsMaterializedInMemory,
      executionEligible: 0,
      writeCount:
        KNOWLEDGE_CMS_ARTICLE_MATERIALIZATION_DRY_RUN_WRITE_COUNT,
    },
    readyToExecute: false,
    receipts,
  };

  return deepFreeze({
    ...unsigned,
    fingerprint: {
      algorithm:
        KNOWLEDGE_CMS_ARTICLE_MATERIALIZATION_DRY_RUN_HASH_ALGORITHM,
      canonicalization:
        KNOWLEDGE_CMS_ARTICLE_MATERIALIZATION_DRY_RUN_CANONICALIZATION,
      value: fingerprint(unsigned),
    },
  });
}

export function validateKnowledgeCmsArticleMaterializationDryRun(
  dryRun: KnowledgeCmsArticleMaterializationDryRun,
  input: BuildKnowledgeCmsArticleMaterializationDryRunInput,
): string[] {
  const errors: string[] = [];
  let expected: KnowledgeCmsArticleMaterializationDryRun | undefined;
  try {
    expected = buildKnowledgeCmsArticleMaterializationDryRun(input);
  } catch (error) {
    errors.push(
      error instanceof Error
        ? error.message
        : "The materialization dry-run input is invalid.",
    );
  }
  if (expected && canonicalJson(dryRun) !== canonicalJson(expected)) {
    errors.push(
      "The article materialization dry run does not match its server inputs.",
    );
  }

  for (const receipt of dryRun.receipts) {
    const unsigned = Object.fromEntries(
      Object.entries(receipt).filter(([key]) => key !== "fingerprint"),
    ) as UnsignedReceipt;
    if (fingerprint(unsigned) !== receipt.fingerprint.value) {
      errors.push(
        `Materialization receipt for "${receipt.target.id}" has an invalid fingerprint.`,
      );
    }
    if (
      receipt.execution.status !== "disabled" ||
      receipt.execution.readyToExecute ||
      receipt.execution.writeCount !== 0 ||
      !receipt.execution.transactionalRecheckRequired ||
      receipt.rollout.cmsBodyPubliclyRendered ||
      receipt.rollout.indexing !== "blocked" ||
      receipt.rollout.cutoverEligible
    ) {
      errors.push(
        `Materialization receipt for "${receipt.target.id}" must remain zero-write, non-executable, private, and transactionally rechecked.`,
      );
    }
  }
  const unsigned = Object.fromEntries(
    Object.entries(dryRun).filter(([key]) => key !== "fingerprint"),
  ) as UnsignedDryRun;
  if (fingerprint(unsigned) !== dryRun.fingerprint.value) {
    errors.push("The materialization dry-run batch fingerprint is invalid.");
  }
  if (
    dryRun.readyToExecute ||
    dryRun.summary.executionEligible !== 0 ||
    dryRun.summary.writeCount !== 0
  ) {
    errors.push(
      "The article materialization dry run must remain non-executable and zero-write.",
    );
  }

  return [...new Set(errors)];
}
