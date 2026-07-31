import "server-only";

import {
  assertKnowledgeCmsActionAllowed,
  type KnowledgeCmsActor,
  type KnowledgeCmsFaq,
  type KnowledgeCmsTopic,
} from "./knowledgeCms";
import {
  buildKnowledgeCmsMigrationPreview,
  type KnowledgeCmsMigrationCandidate,
  type KnowledgeCmsMigrationFaqTarget,
  type KnowledgeCmsMigrationTopicTarget,
} from "./knowledgeCmsMigration";
import {
  materializeKnowledgeCmsSupportingMigrationRecord,
  validateKnowledgeCmsSupportingMigrationControl,
  type KnowledgeCmsSupportingMigrationControlRecord,
  type KnowledgeCmsSupportingMigrationKind,
  type KnowledgeCmsSupportingMigrationOrigin,
  type KnowledgeCmsSupportingMigrationTarget,
} from "./knowledgeCmsSupportingMigrationControl";

export const KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED_ENV =
  "KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED" as const;
export const KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_VERSION = 1 as const;
export const KNOWLEDGE_CMS_SUPPORTING_MIGRATION_CONFIRMATION_PREFIX =
  "CREATE PRIVATE" as const;

const controlIdPattern =
  /^resource-library-(topic|faq)-control--[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const fingerprintPattern = /^[a-f0-9]{64}$/;

export type KnowledgeCmsSupportingMigrationExecutionErrorReason =
  | "execution_disabled"
  | "invalid_request"
  | "control_not_found"
  | "control_ambiguous"
  | "control_fingerprint_changed"
  | "control_invalid"
  | "confirmation_mismatch"
  | "unsafe_materialization";

export class KnowledgeCmsSupportingMigrationExecutionError extends Error {
  readonly code = "knowledge_cms_supporting_migration_execution";

  constructor(
    readonly reason: KnowledgeCmsSupportingMigrationExecutionErrorReason,
    message: string,
  ) {
    super(message);
    this.name = "KnowledgeCmsSupportingMigrationExecutionError";
  }
}

export interface KnowledgeCmsSupportingMigrationExecutionRequest {
  kind: KnowledgeCmsSupportingMigrationKind;
  controlId: string;
  controlFingerprint: string;
  confirmation: string;
}

export interface KnowledgeCmsSupportingMigrationExecutionPlan {
  version: typeof KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_VERSION;
  mode: "single_supporting_private_draft";
  control: {
    id: string;
    fingerprint: string;
    validation: "verified";
  };
  actor: {
    id: string;
    source: "authenticated_server_session";
  };
  target: {
    kind: KnowledgeCmsSupportingMigrationKind;
    collection: "knowledge_topics" | "knowledge_faqs";
    id: string;
    slug: string;
    canonicalPath?: string;
    expectedRevision: null;
    conflictPolicy: "fail_if_present";
  };
  confirmation: {
    expected: string;
    matched: true;
  };
  record: KnowledgeCmsTopic | KnowledgeCmsFaq;
  transaction: {
    serverTimestamp: string;
    timestampSource: "transaction_server_clock";
    writeCount: 3 | 4;
    createsOneCmsRecord: true;
    rechecks: readonly [
      "authenticated_actor",
      "control_fingerprint",
      "expected_absent_document",
      "slug_lock_and_legacy_owner",
      "optional_canonical_lock_and_legacy_owner",
      "search_projection_absence",
      "revision_one_audit_absence",
    ];
  };
  rollout: {
    publicSource: "existing_static_experience";
    cmsRecordPubliclyRendered: false;
    indexing: "blocked";
    cutoverEligible: false;
    bulkExecution: false;
  };
}

type SupportingCandidate = KnowledgeCmsMigrationCandidate & {
  target: KnowledgeCmsMigrationTopicTarget | KnowledgeCmsMigrationFaqTarget;
};

export function isKnowledgeCmsSupportingMigrationExecutionEnabled(
  value: string | undefined =
    process.env[KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED_ENV],
): boolean {
  return value === "true";
}

export function assertKnowledgeCmsSupportingMigrationExecutionEnabled(
  value: string | undefined =
    process.env[KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED_ENV],
): void {
  if (!isKnowledgeCmsSupportingMigrationExecutionEnabled(value)) {
    throw new KnowledgeCmsSupportingMigrationExecutionError(
      "execution_disabled",
      "Knowledge CMS topic and FAQ migration execution is disabled.",
    );
  }
}

export function getKnowledgeCmsSupportingMigrationConfirmationPhrase(
  kind: KnowledgeCmsSupportingMigrationKind,
  slug: string,
): string {
  return `${KNOWLEDGE_CMS_SUPPORTING_MIGRATION_CONFIRMATION_PREFIX} ${kind.toUpperCase()} DRAFT ${slug}`;
}

function assertValidRequest(
  request: KnowledgeCmsSupportingMigrationExecutionRequest,
): void {
  if (
    !["topic", "faq"].includes(request.kind) ||
    !controlIdPattern.test(request.controlId) ||
    !request.controlId.startsWith(
      `resource-library-${request.kind}-control--`,
    ) ||
    !fingerprintPattern.test(request.controlFingerprint) ||
    request.confirmation.length > 300
  ) {
    throw new KnowledgeCmsSupportingMigrationExecutionError(
      "invalid_request",
      "The topic or FAQ migration execution request is invalid.",
    );
  }
}

export function getKnowledgeCmsSupportingMigrationControlInput(
  candidate: SupportingCandidate,
): {
  origin: KnowledgeCmsSupportingMigrationOrigin;
  target: KnowledgeCmsSupportingMigrationTarget;
} {
  const target = candidate.target;
  return {
    origin: candidate.origin as KnowledgeCmsSupportingMigrationOrigin,
    target:
      target.kind === "topic"
        ? {
            id: target.id,
            kind: "topic",
            slug: target.slug,
            title: target.title,
            description: target.description,
            order: target.order,
            ...(target.parentTopicId
              ? { parentTopicId: target.parentTopicId }
              : {}),
            searchTerms: [...target.searchTerms],
            relationships: target.relationships,
            sources: target.sources,
            ...(target.canonicalPath
              ? { canonicalPath: target.canonicalPath }
              : {}),
          }
        : {
            id: target.id,
            kind: "faq",
            slug: target.slug,
            question: target.question,
            answer: target.answer,
            categoryId: target.categoryId,
            factIds: [...target.factIds],
            schemaEligible: target.schemaEligible,
            searchTerms: [...target.searchTerms],
            relationships: target.relationships,
            sources: target.sources,
            ...(target.canonicalPath
              ? { canonicalPath: target.canonicalPath }
              : {}),
          },
  };
}

function candidateForRequest(
  request: KnowledgeCmsSupportingMigrationExecutionRequest,
  now: Date,
): SupportingCandidate {
  const matches = buildKnowledgeCmsMigrationPreview({
    asOf: now,
    rendererMode: "static",
  }).candidates.filter(
    (candidate): candidate is SupportingCandidate =>
      candidate.target.kind === request.kind &&
      candidate.target.controlRecord?.controlId === request.controlId,
  );
  if (matches.length === 0) {
    throw new KnowledgeCmsSupportingMigrationExecutionError(
      "control_not_found",
      "The requested deterministic topic or FAQ control was not found.",
    );
  }
  if (matches.length !== 1) {
    throw new KnowledgeCmsSupportingMigrationExecutionError(
      "control_ambiguous",
      "The requested topic or FAQ control is not unique.",
    );
  }
  return matches[0];
}

export function buildKnowledgeCmsSupportingMigrationExecutionPlan(input: {
  actor: KnowledgeCmsActor;
  request: KnowledgeCmsSupportingMigrationExecutionRequest;
  now: Date;
}): KnowledgeCmsSupportingMigrationExecutionPlan {
  assertKnowledgeCmsSupportingMigrationExecutionEnabled();
  assertKnowledgeCmsActionAllowed(input.actor, "execute_supporting_migration");
  assertValidRequest(input.request);
  if (Number.isNaN(input.now.getTime())) {
    throw new KnowledgeCmsSupportingMigrationExecutionError(
      "invalid_request",
      "Topic or FAQ migration execution requires a valid transaction server clock.",
    );
  }
  const candidate = candidateForRequest(input.request, input.now);
  const control: KnowledgeCmsSupportingMigrationControlRecord | undefined =
    candidate.target.controlRecord;
  if (!control) {
    throw new KnowledgeCmsSupportingMigrationExecutionError(
      "control_invalid",
      "The deterministic topic or FAQ control is incomplete.",
    );
  }
  if (control.fingerprint.value !== input.request.controlFingerprint) {
    throw new KnowledgeCmsSupportingMigrationExecutionError(
      "control_fingerprint_changed",
      "The topic or FAQ migration control changed. Reload the preview before continuing.",
    );
  }
  const controlErrors = validateKnowledgeCmsSupportingMigrationControl(
    control,
    getKnowledgeCmsSupportingMigrationControlInput(candidate),
  );
  if (controlErrors.length > 0 || candidate.state === "blocked") {
    throw new KnowledgeCmsSupportingMigrationExecutionError(
      "control_invalid",
      controlErrors.join(" ") || "The governed migration candidate is blocked.",
    );
  }
  const expectedConfirmation =
    getKnowledgeCmsSupportingMigrationConfirmationPhrase(
      candidate.target.kind,
      candidate.target.slug,
    );
  if (input.request.confirmation !== expectedConfirmation) {
    throw new KnowledgeCmsSupportingMigrationExecutionError(
      "confirmation_mismatch",
      "The private-draft confirmation phrase does not match the selected control.",
    );
  }
  const serverTimestamp = input.now.toISOString();
  const record = materializeKnowledgeCmsSupportingMigrationRecord(
    control,
    input.actor.id,
    serverTimestamp,
  );
  if (
    record.kind !== input.request.kind ||
    record.status !== "draft" ||
    record.discoverability.indexing !== "blocked" ||
    record.review !== undefined ||
    record.publication !== undefined
  ) {
    throw new KnowledgeCmsSupportingMigrationExecutionError(
      "unsafe_materialization",
      "The topic or FAQ control did not materialize a private, indexing-blocked draft.",
    );
  }
  return {
    version: KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_VERSION,
    mode: "single_supporting_private_draft",
    control: {
      id: control.controlId,
      fingerprint: control.fingerprint.value,
      validation: "verified",
    },
    actor: { id: input.actor.id, source: "authenticated_server_session" },
    target: {
      kind: record.kind,
      collection: control.target.collection,
      id: record.id,
      slug: record.slug,
      ...(record.discoverability.canonicalPath
        ? { canonicalPath: record.discoverability.canonicalPath }
        : {}),
      expectedRevision: null,
      conflictPolicy: "fail_if_present",
    },
    confirmation: { expected: expectedConfirmation, matched: true },
    record,
    transaction: {
      serverTimestamp,
      timestampSource: "transaction_server_clock",
      writeCount: record.discoverability.canonicalPath ? 4 : 3,
      createsOneCmsRecord: true,
      rechecks: [
        "authenticated_actor",
        "control_fingerprint",
        "expected_absent_document",
        "slug_lock_and_legacy_owner",
        "optional_canonical_lock_and_legacy_owner",
        "search_projection_absence",
        "revision_one_audit_absence",
      ],
    },
    rollout: {
      publicSource: "existing_static_experience",
      cmsRecordPubliclyRendered: false,
      indexing: "blocked",
      cutoverEligible: false,
      bulkExecution: false,
    },
  };
}
