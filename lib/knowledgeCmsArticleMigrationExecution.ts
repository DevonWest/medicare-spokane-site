import "server-only";

import {
  assertKnowledgeCmsActionAllowed,
  type KnowledgeCmsActor,
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

export const KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED_ENV =
  "KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED" as const;
export const KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_VERSION = 1 as const;
export const KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_WRITE_COUNT =
  4 as const;
export const KNOWLEDGE_CMS_ARTICLE_MIGRATION_CONFIRMATION_PREFIX =
  "CREATE PRIVATE DRAFT" as const;

const controlIdPattern =
  /^resource-library-article-control--[a-z0-9]+(?:-[a-z0-9]+)*$/;
const fingerprintPattern = /^[a-f0-9]{64}$/;

export type KnowledgeCmsArticleMigrationExecutionErrorReason =
  | "execution_disabled"
  | "invalid_request"
  | "control_not_found"
  | "control_ambiguous"
  | "control_fingerprint_changed"
  | "control_invalid"
  | "confirmation_mismatch"
  | "unsafe_materialization";

export class KnowledgeCmsArticleMigrationExecutionError extends Error {
  readonly code = "knowledge_cms_article_migration_execution";

  constructor(
    readonly reason: KnowledgeCmsArticleMigrationExecutionErrorReason,
    message: string,
  ) {
    super(message);
    this.name = "KnowledgeCmsArticleMigrationExecutionError";
  }
}

export interface KnowledgeCmsArticleMigrationExecutionRequest {
  controlId: string;
  controlFingerprint: string;
  confirmation: string;
}

export interface KnowledgeCmsArticleMigrationExecutionPlan {
  version: typeof KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_VERSION;
  mode: "single_article_private_draft";
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
    collection: "knowledge_articles";
    id: string;
    slug: string;
    canonicalPath: string;
    expectedRevision: null;
    conflictPolicy: "fail_if_present";
  };
  confirmation: {
    expected: string;
    matched: true;
  };
  record: KnowledgeCmsArticle;
  transaction: {
    serverTimestamp: string;
    timestampSource: "transaction_server_clock";
    writeCount:
      typeof KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_WRITE_COUNT;
    createsOneCmsRecord: true;
    rechecks: readonly [
      "authenticated_actor",
      "control_fingerprint",
      "expected_absent_document",
      "slug_lock_and_legacy_owner",
      "canonical_lock_and_legacy_owner",
      "search_projection_absence",
      "revision_one_audit_absence",
    ];
  };
  rollout: {
    publicSource: "verified_static_route";
    cmsBodyPubliclyRendered: false;
    indexing: "blocked";
    cutoverEligible: false;
    bulkExecution: false;
  };
}

export function isKnowledgeCmsArticleMigrationExecutionEnabled(
  value: string | undefined =
    process.env[KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED_ENV],
): boolean {
  return value === "true";
}

export function assertKnowledgeCmsArticleMigrationExecutionEnabled(
  value: string | undefined =
    process.env[KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED_ENV],
): void {
  if (!isKnowledgeCmsArticleMigrationExecutionEnabled(value)) {
    throw new KnowledgeCmsArticleMigrationExecutionError(
      "execution_disabled",
      "Knowledge CMS article migration execution is disabled.",
    );
  }
}

export function getKnowledgeCmsArticleMigrationConfirmationPhrase(
  slug: string,
): string {
  return `${KNOWLEDGE_CMS_ARTICLE_MIGRATION_CONFIRMATION_PREFIX} ${slug}`;
}

function assertValidRequest(
  request: KnowledgeCmsArticleMigrationExecutionRequest,
): void {
  if (
    !controlIdPattern.test(request.controlId) ||
    !fingerprintPattern.test(request.controlFingerprint) ||
    request.confirmation.length > 300
  ) {
    throw new KnowledgeCmsArticleMigrationExecutionError(
      "invalid_request",
      "The article migration execution request is invalid.",
    );
  }
}

function articleTargetForRequest(
  request: KnowledgeCmsArticleMigrationExecutionRequest,
  now: Date,
): KnowledgeCmsMigrationArticleTarget {
  const preview = buildKnowledgeCmsMigrationPreview({
    asOf: now,
    rendererMode: "static",
  });
  const matches = preview.candidates.filter(
    (
      candidate,
    ): candidate is typeof candidate & {
      target: KnowledgeCmsMigrationArticleTarget;
    } =>
      candidate.target.kind === "article" &&
      candidate.target.controlRecord?.controlId === request.controlId,
  );

  if (matches.length === 0) {
    throw new KnowledgeCmsArticleMigrationExecutionError(
      "control_not_found",
      "The requested deterministic article migration control was not found.",
    );
  }
  if (matches.length !== 1) {
    throw new KnowledgeCmsArticleMigrationExecutionError(
      "control_ambiguous",
      "The requested article migration control is not unique.",
    );
  }
  return matches[0].target;
}

export function buildKnowledgeCmsArticleMigrationExecutionPlan(input: {
  actor: KnowledgeCmsActor;
  request: KnowledgeCmsArticleMigrationExecutionRequest;
  now: Date;
}): KnowledgeCmsArticleMigrationExecutionPlan {
  assertKnowledgeCmsArticleMigrationExecutionEnabled();
  assertKnowledgeCmsActionAllowed(
    input.actor,
    "execute_article_migration",
  );
  assertValidRequest(input.request);
  if (Number.isNaN(input.now.getTime())) {
    throw new KnowledgeCmsArticleMigrationExecutionError(
      "invalid_request",
      "Article migration execution requires a valid transaction server clock.",
    );
  }

  const target = articleTargetForRequest(input.request, input.now);
  const control = target.controlRecord;
  const controlInput = getKnowledgeCmsArticleMigrationControlInput(target);
  if (!control || !controlInput) {
    throw new KnowledgeCmsArticleMigrationExecutionError(
      "control_invalid",
      "The deterministic article migration control is incomplete.",
    );
  }
  if (control.fingerprint.value !== input.request.controlFingerprint) {
    throw new KnowledgeCmsArticleMigrationExecutionError(
      "control_fingerprint_changed",
      "The article migration control changed. Reload the preview before continuing.",
    );
  }
  const controlErrors = validateKnowledgeCmsArticleMigrationControl(
    control,
    controlInput,
  );
  if (controlErrors.length > 0) {
    throw new KnowledgeCmsArticleMigrationExecutionError(
      "control_invalid",
      controlErrors.join(" "),
    );
  }

  const expectedConfirmation =
    getKnowledgeCmsArticleMigrationConfirmationPhrase(target.slug);
  if (input.request.confirmation !== expectedConfirmation) {
    throw new KnowledgeCmsArticleMigrationExecutionError(
      "confirmation_mismatch",
      "The private-draft confirmation phrase does not match the selected control.",
    );
  }

  const serverTimestamp = input.now.toISOString();
  const record = materializeKnowledgeCmsArticleMigrationRecord(
    target,
    input.actor.id,
    serverTimestamp,
  );
  if (
    record.status !== "draft" ||
    record.discoverability.indexing !== "blocked" ||
    record.review !== undefined ||
    record.publication !== undefined ||
    !record.discoverability.canonicalPath ||
    !record.body.includes("It is not the public page body")
  ) {
    throw new KnowledgeCmsArticleMigrationExecutionError(
      "unsafe_materialization",
      "The article migration control did not materialize a private, indexing-blocked draft.",
    );
  }

  return {
    version: KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_VERSION,
    mode: "single_article_private_draft",
    control: {
      id: control.controlId,
      fingerprint: control.fingerprint.value,
      validation: "verified",
    },
    actor: {
      id: input.actor.id,
      source: "authenticated_server_session",
    },
    target: {
      collection: "knowledge_articles",
      id: record.id,
      slug: record.slug,
      canonicalPath: record.discoverability.canonicalPath,
      expectedRevision: null,
      conflictPolicy: "fail_if_present",
    },
    confirmation: {
      expected: expectedConfirmation,
      matched: true,
    },
    record,
    transaction: {
      serverTimestamp,
      timestampSource: "transaction_server_clock",
      writeCount:
        KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_WRITE_COUNT,
      createsOneCmsRecord: true,
      rechecks: [
        "authenticated_actor",
        "control_fingerprint",
        "expected_absent_document",
        "slug_lock_and_legacy_owner",
        "canonical_lock_and_legacy_owner",
        "search_projection_absence",
        "revision_one_audit_absence",
      ],
    },
    rollout: {
      publicSource: "verified_static_route",
      cmsBodyPubliclyRendered: false,
      indexing: "blocked",
      cutoverEligible: false,
      bulkExecution: false,
    },
  };
}
