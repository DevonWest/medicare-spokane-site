import "server-only";

import {
  assertKnowledgeCmsActionAllowed,
  type KnowledgeCmsActor,
  type KnowledgeCmsArticle,
} from "./knowledgeCms";
import {
  buildKnowledgeCmsNativeRepresentationArtifact,
  knowledgeCmsNativeRepresentationControls,
  validateKnowledgeCmsNativeRepresentationArtifact,
  validateKnowledgeCmsNativeRepresentationControls,
  type KnowledgeCmsNativeRepresentationArtifact,
  type KnowledgeCmsNativeRepresentationControl,
} from "./knowledgeCmsNativeRepresentation";
import { getKnowledgeCmsRendererContract } from "./knowledgeCmsRendererContract";
import {
  isKnowledgeCmsPrivateShadowEnabled,
  validateKnowledgeCmsShadowRecord,
} from "./knowledgeCmsShadowRenderer";

export const KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED_ENV =
  "KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED" as const;
export const KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_VERSION =
  1 as const;
export const KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_WRITE_COUNT =
  2 as const;
export const KNOWLEDGE_CMS_NATIVE_REPRESENTATION_CONFIRMATION_PREFIX =
  "CREATE PRIVATE RENDERING" as const;

const controlIdPattern =
  /^resource-library-rendering-control--[a-z0-9]+(?:-[a-z0-9]+)*$/;
const fingerprintPattern = /^[a-f0-9]{64}$/;

export type KnowledgeCmsNativeRepresentationExecutionErrorReason =
  | "article_not_eligible"
  | "confirmation_mismatch"
  | "control_fingerprint_changed"
  | "control_invalid"
  | "control_not_found"
  | "execution_disabled"
  | "invalid_request";

export class KnowledgeCmsNativeRepresentationExecutionError extends Error {
  readonly code = "knowledge_cms_native_representation_execution";

  constructor(
    readonly reason: KnowledgeCmsNativeRepresentationExecutionErrorReason,
    message: string,
  ) {
    super(message);
    this.name = "KnowledgeCmsNativeRepresentationExecutionError";
  }
}

export interface KnowledgeCmsNativeRepresentationExecutionRequest {
  controlId: string;
  controlFingerprint: string;
  expectedArticleRevision: number;
  confirmation: string;
}

export interface KnowledgeCmsNativeRepresentationExecutionPlan {
  version: typeof KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_VERSION;
  mode: "single_article_private_rendering";
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
    collection: "knowledge_cms_article_renderings";
    id: string;
    articleId: string;
    articleRevision: number;
    expectedRevision: null;
    conflictPolicy: "fail_if_present";
  };
  confirmation: {
    expected: string;
    matched: true;
  };
  artifact: KnowledgeCmsNativeRepresentationArtifact;
  transaction: {
    serverTimestamp: string;
    timestampSource: "transaction_server_clock";
    writeCount: typeof KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_WRITE_COUNT;
    createsOneRenderingArtifact: true;
    rechecks: readonly [
      "authenticated_actor",
      "control_fingerprint",
      "published_article_revision",
      "article_governance",
      "expected_absent_representation",
      "expected_absent_audit_event",
    ];
  };
  rollout: {
    publicSource: "verified_static_route";
    privateShadowOnly: true;
    indexing: "blocked";
    cutoverEligible: false;
    bulkExecution: false;
  };
}

export function isKnowledgeCmsNativeRepresentationExecutionEnabled(
  value: string | undefined =
    process.env[
      KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED_ENV
    ],
): boolean {
  return value === "true";
}

export function assertKnowledgeCmsNativeRepresentationExecutionEnabled(
  value: string | undefined =
    process.env[
      KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED_ENV
    ],
): void {
  if (!isKnowledgeCmsNativeRepresentationExecutionEnabled(value)) {
    throw new KnowledgeCmsNativeRepresentationExecutionError(
      "execution_disabled",
      "Knowledge CMS native rendering artifact execution is disabled.",
    );
  }
}

export function getKnowledgeCmsNativeRepresentationConfirmationPhrase(
  slug: string,
): string {
  return `${KNOWLEDGE_CMS_NATIVE_REPRESENTATION_CONFIRMATION_PREFIX} ${slug}`;
}

export function getKnowledgeCmsNativeRepresentationAuditDocumentId(
  representationId: string,
): string {
  return `article-rendering--${representationId}`;
}

function controlForRequest(
  request: KnowledgeCmsNativeRepresentationExecutionRequest,
): KnowledgeCmsNativeRepresentationControl {
  const control = knowledgeCmsNativeRepresentationControls.find(
    (candidate) => candidate.controlId === request.controlId,
  );
  if (!control) {
    throw new KnowledgeCmsNativeRepresentationExecutionError(
      "control_not_found",
      "The requested CMS-native rendering control was not found.",
    );
  }
  return control;
}

function assertValidRequest(
  request: KnowledgeCmsNativeRepresentationExecutionRequest,
): void {
  if (
    !controlIdPattern.test(request.controlId) ||
    !fingerprintPattern.test(request.controlFingerprint) ||
    !Number.isInteger(request.expectedArticleRevision) ||
    request.expectedArticleRevision < 1 ||
    request.confirmation.length > 300
  ) {
    throw new KnowledgeCmsNativeRepresentationExecutionError(
      "invalid_request",
      "The CMS-native rendering execution request is invalid.",
    );
  }
}

export function buildKnowledgeCmsNativeRepresentationExecutionPlan(input: {
  actor: KnowledgeCmsActor;
  request: KnowledgeCmsNativeRepresentationExecutionRequest;
  article: KnowledgeCmsArticle;
  now: Date;
}): KnowledgeCmsNativeRepresentationExecutionPlan {
  assertKnowledgeCmsNativeRepresentationExecutionEnabled();
  if (!isKnowledgeCmsPrivateShadowEnabled()) {
    throw new KnowledgeCmsNativeRepresentationExecutionError(
      "execution_disabled",
      "CMS-native rendering execution requires exact private shadow mode.",
    );
  }
  assertKnowledgeCmsActionAllowed(
    input.actor,
    "execute_article_rendering",
  );
  assertValidRequest(input.request);
  if (Number.isNaN(input.now.getTime())) {
    throw new KnowledgeCmsNativeRepresentationExecutionError(
      "invalid_request",
      "CMS-native rendering execution requires a valid server clock.",
    );
  }
  const control = controlForRequest(input.request);
  const controlErrors = validateKnowledgeCmsNativeRepresentationControls();
  if (controlErrors.length > 0) {
    throw new KnowledgeCmsNativeRepresentationExecutionError(
      "control_invalid",
      controlErrors.join(" "),
    );
  }
  if (control.fingerprint.value !== input.request.controlFingerprint) {
    throw new KnowledgeCmsNativeRepresentationExecutionError(
      "control_fingerprint_changed",
      "The CMS-native rendering control changed. Reload the shadow workspace before continuing.",
    );
  }
  if (
    input.article.id !== control.target.articleId ||
    input.article.audit.revision !==
      input.request.expectedArticleRevision ||
    input.article.status !== "published"
  ) {
    throw new KnowledgeCmsNativeRepresentationExecutionError(
      "article_not_eligible",
      "The article is missing, unpublished, or no longer at the confirmed revision.",
    );
  }
  const contract = getKnowledgeCmsRendererContract(
    control.origin.entryId,
  );
  const recordErrors = contract
    ? validateKnowledgeCmsShadowRecord(contract, input.article, input.now)
    : ["The CMS-native rendering control has no renderer contract."];
  if (recordErrors.length > 0) {
    throw new KnowledgeCmsNativeRepresentationExecutionError(
      "article_not_eligible",
      recordErrors.join(" "),
    );
  }
  const expectedConfirmation =
    getKnowledgeCmsNativeRepresentationConfirmationPhrase(
      input.article.slug,
    );
  if (input.request.confirmation !== expectedConfirmation) {
    throw new KnowledgeCmsNativeRepresentationExecutionError(
      "confirmation_mismatch",
      "The CMS-native rendering confirmation phrase does not match the selected article.",
    );
  }
  const serverTimestamp = input.now.toISOString();
  const artifact = buildKnowledgeCmsNativeRepresentationArtifact({
    control,
    article: input.article,
    actorId: input.actor.id,
    createdAt: serverTimestamp,
  });
  const artifactErrors = validateKnowledgeCmsNativeRepresentationArtifact(
    artifact,
    input.article,
  );
  if (artifactErrors.length > 0) {
    throw new KnowledgeCmsNativeRepresentationExecutionError(
      "control_invalid",
      artifactErrors.join(" "),
    );
  }
  return {
    version: KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_VERSION,
    mode: "single_article_private_rendering",
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
      collection: "knowledge_cms_article_renderings",
      id: artifact.id,
      articleId: input.article.id,
      articleRevision: input.article.audit.revision,
      expectedRevision: null,
      conflictPolicy: "fail_if_present",
    },
    confirmation: {
      expected: expectedConfirmation,
      matched: true,
    },
    artifact,
    transaction: {
      serverTimestamp,
      timestampSource: "transaction_server_clock",
      writeCount:
        KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_WRITE_COUNT,
      createsOneRenderingArtifact: true,
      rechecks: [
        "authenticated_actor",
        "control_fingerprint",
        "published_article_revision",
        "article_governance",
        "expected_absent_representation",
        "expected_absent_audit_event",
      ],
    },
    rollout: {
      publicSource: "verified_static_route",
      privateShadowOnly: true,
      indexing: "blocked",
      cutoverEligible: false,
      bulkExecution: false,
    },
  };
}
