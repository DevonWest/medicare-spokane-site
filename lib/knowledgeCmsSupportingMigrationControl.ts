import { createHash } from "node:crypto";
import {
  KNOWLEDGE_CMS_COLLECTIONS,
  KNOWLEDGE_CMS_SCHEMA_VERSION,
  parseKnowledgeCmsRecord,
  validateKnowledgeCmsRecord,
  type KnowledgeCmsFaq,
  type KnowledgeCmsRecord,
  type KnowledgeCmsRelationships,
  type KnowledgeCmsSource,
  type KnowledgeCmsTopic,
} from "./knowledgeCms";

export const KNOWLEDGE_CMS_SUPPORTING_MIGRATION_CONTROL_VERSION = 1 as const;
export const KNOWLEDGE_CMS_SUPPORTING_MIGRATION_CONTROL_WRITE_COUNT = 0 as const;
export const KNOWLEDGE_CMS_SUPPORTING_MIGRATION_CONTROL_HASH_ALGORITHM =
  "sha256" as const;
export const KNOWLEDGE_CMS_SUPPORTING_MIGRATION_CONTROL_CANONICALIZATION =
  "recursive_sorted_keys" as const;

export type KnowledgeCmsSupportingMigrationKind = "topic" | "faq";

interface KnowledgeCmsSupportingMigrationTargetBase {
  id: string;
  kind: KnowledgeCmsSupportingMigrationKind;
  slug: string;
  searchTerms: string[];
  relationships: KnowledgeCmsRelationships;
  sources: KnowledgeCmsSource[];
  canonicalPath?: string;
}

export interface KnowledgeCmsSupportingTopicMigrationTarget
  extends KnowledgeCmsSupportingMigrationTargetBase {
  kind: "topic";
  title: string;
  description: string;
  order: number;
  parentTopicId?: string;
}

export interface KnowledgeCmsSupportingFaqMigrationTarget
  extends KnowledgeCmsSupportingMigrationTargetBase {
  kind: "faq";
  question: string;
  answer: string;
  categoryId: string;
  factIds: string[];
  schemaEligible: boolean;
}

export type KnowledgeCmsSupportingMigrationTarget =
  | KnowledgeCmsSupportingTopicMigrationTarget
  | KnowledgeCmsSupportingFaqMigrationTarget;

export interface KnowledgeCmsSupportingMigrationOrigin {
  kind: "resource_category" | "resource_topic" | "resource_faq";
  id: string;
  path?: string;
}

type KnowledgeCmsSupportingMigrationDraftPayload =
  | Omit<
      KnowledgeCmsTopic,
      "ownerId" | "audit" | "review" | "publication" | "changeRequest"
    >
  | Omit<
      KnowledgeCmsFaq,
      "ownerId" | "audit" | "review" | "publication" | "changeRequest"
    >;

export interface KnowledgeCmsSupportingMigrationControlRecord {
  version: typeof KNOWLEDGE_CMS_SUPPORTING_MIGRATION_CONTROL_VERSION;
  mode: "control_only";
  controlId: string;
  operation: "create_private_draft";
  origin: KnowledgeCmsSupportingMigrationOrigin;
  target: {
    collection:
      | typeof KNOWLEDGE_CMS_COLLECTIONS.topic
      | typeof KNOWLEDGE_CMS_COLLECTIONS.faq;
    expectedRevision: null;
    conflictPolicy: "fail_if_present";
    payload: KnowledgeCmsSupportingMigrationDraftPayload;
    serverMaterialization: {
      recordIdSource: "control_record";
      ownerIdSource: "authenticated_actor";
      auditSource: "server_clock";
    };
  };
  provenance: {
    source: "governed_static_registry";
    publicSource: "existing_static_experience";
  };
  execution: {
    status: "disabled";
    readyToExecute: false;
    writeCount: typeof KNOWLEDGE_CMS_SUPPORTING_MIGRATION_CONTROL_WRITE_COUNT;
    reason: "control_record_is_not_execution_authority";
  };
  rollout: {
    publicSource: "existing_static_experience";
    cmsRecordPubliclyRendered: false;
    indexing: "blocked";
    cutoverEligible: false;
  };
  fingerprint: {
    algorithm: typeof KNOWLEDGE_CMS_SUPPORTING_MIGRATION_CONTROL_HASH_ALGORITHM;
    canonicalization:
      typeof KNOWLEDGE_CMS_SUPPORTING_MIGRATION_CONTROL_CANONICALIZATION;
    value: string;
  };
}

type UnsignedControl = Omit<
  KnowledgeCmsSupportingMigrationControlRecord,
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
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
    .join(",")}}`;
}

function fingerprint(value: unknown): string {
  return createHash(
    KNOWLEDGE_CMS_SUPPORTING_MIGRATION_CONTROL_HASH_ALGORITHM,
  )
    .update(canonicalJson(value))
    .digest("hex");
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

function cloneRelationships(
  value: KnowledgeCmsRelationships,
): KnowledgeCmsRelationships {
  return {
    articleIds: [...value.articleIds],
    topicIds: [...value.topicIds],
    faqIds: [...value.faqIds],
    citySlugs: [...value.citySlugs],
    agentSlugs: [...value.agentSlugs],
    carrierNames: [...value.carrierNames],
    existingPaths: [...value.existingPaths],
  };
}

function commonPayload(target: KnowledgeCmsSupportingMigrationTarget) {
  return {
    schemaVersion: KNOWLEDGE_CMS_SCHEMA_VERSION,
    id: target.id,
    kind: target.kind,
    slug: target.slug,
    status: "draft" as const,
    searchTerms: [...target.searchTerms],
    relationships: cloneRelationships(target.relationships),
    sources: target.sources.map((source) => ({ ...source })),
    discoverability: {
      ...(target.canonicalPath
        ? { canonicalPath: target.canonicalPath }
        : {}),
      indexing: "blocked" as const,
    },
  };
}

function buildPayload(
  target: KnowledgeCmsSupportingMigrationTarget,
): KnowledgeCmsSupportingMigrationDraftPayload {
  if (target.kind === "topic") {
    return {
      ...commonPayload(target),
      kind: "topic",
      title: target.title,
      description: target.description,
      order: target.order,
      ...(target.parentTopicId
        ? { parentTopicId: target.parentTopicId }
        : {}),
    };
  }
  return {
    ...commonPayload(target),
    kind: "faq",
    question: target.question,
    answer: target.answer,
    categoryId: target.categoryId,
    factIds: [...target.factIds],
    schemaEligible: target.schemaEligible,
  };
}

function buildUnsignedControl(input: {
  origin: KnowledgeCmsSupportingMigrationOrigin;
  target: KnowledgeCmsSupportingMigrationTarget;
}): UnsignedControl {
  if (
    (input.target.kind === "topic" &&
      !["resource_category", "resource_topic"].includes(input.origin.kind)) ||
    (input.target.kind === "faq" && input.origin.kind !== "resource_faq")
  ) {
    throw new Error("The supporting migration origin does not match its target kind.");
  }
  return {
    version: KNOWLEDGE_CMS_SUPPORTING_MIGRATION_CONTROL_VERSION,
    mode: "control_only",
    controlId: `resource-library-${input.target.kind}-control--${input.target.id}`,
    operation: "create_private_draft",
    origin: { ...input.origin },
    target: {
      collection: KNOWLEDGE_CMS_COLLECTIONS[input.target.kind],
      expectedRevision: null,
      conflictPolicy: "fail_if_present",
      payload: buildPayload(input.target),
      serverMaterialization: {
        recordIdSource: "control_record",
        ownerIdSource: "authenticated_actor",
        auditSource: "server_clock",
      },
    },
    provenance: {
      source: "governed_static_registry",
      publicSource: "existing_static_experience",
    },
    execution: {
      status: "disabled",
      readyToExecute: false,
      writeCount: KNOWLEDGE_CMS_SUPPORTING_MIGRATION_CONTROL_WRITE_COUNT,
      reason: "control_record_is_not_execution_authority",
    },
    rollout: {
      publicSource: "existing_static_experience",
      cmsRecordPubliclyRendered: false,
      indexing: "blocked",
      cutoverEligible: false,
    },
  };
}

export function buildKnowledgeCmsSupportingMigrationControl(input: {
  origin: KnowledgeCmsSupportingMigrationOrigin;
  target: KnowledgeCmsSupportingMigrationTarget;
}): KnowledgeCmsSupportingMigrationControlRecord {
  const unsigned = buildUnsignedControl(input);
  return deepFreeze({
    ...unsigned,
    fingerprint: {
      algorithm: KNOWLEDGE_CMS_SUPPORTING_MIGRATION_CONTROL_HASH_ALGORITHM,
      canonicalization:
        KNOWLEDGE_CMS_SUPPORTING_MIGRATION_CONTROL_CANONICALIZATION,
      value: fingerprint(unsigned),
    },
  });
}

export function validateKnowledgeCmsSupportingMigrationControl(
  control: KnowledgeCmsSupportingMigrationControlRecord,
  input: {
    origin: KnowledgeCmsSupportingMigrationOrigin;
    target: KnowledgeCmsSupportingMigrationTarget;
  },
): string[] {
  const errors: string[] = [];
  let expected: KnowledgeCmsSupportingMigrationControlRecord | undefined;
  try {
    expected = buildKnowledgeCmsSupportingMigrationControl(input);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "The control input is invalid.");
  }
  if (expected && canonicalJson(expected) !== canonicalJson(control)) {
    errors.push(`Supporting migration control "${control.controlId}" changed from its governed source.`);
  }
  const payload = control.target.payload;
  if (
    "ownerId" in payload ||
    "audit" in payload ||
    "review" in payload ||
    "publication" in payload ||
    "changeRequest" in payload
  ) {
    errors.push(`Supporting migration control "${control.controlId}" contains server-owned fields.`);
  }
  const projected = {
    ...payload,
    ownerId: "supporting-migration-validation",
    audit: {
      revision: 1,
      createdAt: "2000-01-01T00:00:00.000Z",
      createdBy: "supporting-migration-validation",
      updatedAt: "2000-01-01T00:00:00.000Z",
      updatedBy: "supporting-migration-validation",
    },
  };
  for (const message of validateKnowledgeCmsRecord(projected)) {
    errors.push(`Supporting migration control "${control.controlId}" has an invalid payload: ${message}`);
  }
  if (
    control.execution.status !== "disabled" ||
    control.execution.readyToExecute ||
    control.execution.writeCount !== 0 ||
    control.target.expectedRevision !== null ||
    control.target.conflictPolicy !== "fail_if_present" ||
    control.rollout.cmsRecordPubliclyRendered ||
    control.rollout.indexing !== "blocked" ||
    control.rollout.cutoverEligible
  ) {
    errors.push(`Supporting migration control "${control.controlId}" must remain private, disabled, zero-write, create-only, and fail-if-present.`);
  }
  const unsigned = Object.fromEntries(
    Object.entries(control).filter(([key]) => key !== "fingerprint"),
  ) as UnsignedControl;
  if (
    control.fingerprint.algorithm !==
      KNOWLEDGE_CMS_SUPPORTING_MIGRATION_CONTROL_HASH_ALGORITHM ||
    control.fingerprint.canonicalization !==
      KNOWLEDGE_CMS_SUPPORTING_MIGRATION_CONTROL_CANONICALIZATION ||
    !/^[a-f0-9]{64}$/.test(control.fingerprint.value) ||
    fingerprint(unsigned) !== control.fingerprint.value
  ) {
    errors.push(`Supporting migration control "${control.controlId}" fingerprint is invalid.`);
  }
  return [...new Set(errors)];
}

export function materializeKnowledgeCmsSupportingMigrationRecord(
  control: KnowledgeCmsSupportingMigrationControlRecord,
  actorId: string,
  serverTimestamp: string,
): KnowledgeCmsTopic | KnowledgeCmsFaq {
  const record = parseKnowledgeCmsRecord({
    ...control.target.payload,
    ownerId: actorId,
    audit: {
      revision: 1,
      createdAt: serverTimestamp,
      createdBy: actorId,
      updatedAt: serverTimestamp,
      updatedBy: actorId,
    },
  });
  if (record.kind !== "topic" && record.kind !== "faq") {
    throw new Error("The supporting migration control produced an unsupported record kind.");
  }
  return record;
}

export function fingerprintKnowledgeCmsSupportingMigrationRecord(
  record: KnowledgeCmsRecord,
): string {
  return fingerprint(record);
}
