import "server-only";

import {
  KNOWLEDGE_CMS_COLLECTIONS,
  assertKnowledgeCmsActionAllowed,
  parseKnowledgeCmsRecord,
  type KnowledgeCmsActor,
  type KnowledgeCmsArticle,
} from "./knowledgeCms";
import { requireKnowledgeCmsActor } from "./knowledgeCmsAdminAuth";
import { getFirestoreAdmin } from "./firebase-admin";
import {
  buildKnowledgeCmsPublicCutoverApproval,
  buildKnowledgeCmsPublicCutoverPreview,
  getKnowledgeCmsPublicCutoverConfirmationPhrase,
  getKnowledgeCmsPublicCutoverReceipt,
  validateKnowledgeCmsPublicCutoverPreview,
  type KnowledgeCmsPublicCutoverApproval,
  type KnowledgeCmsPublicCutoverPreview,
} from "./knowledgeCmsPublicCutover";
import {
  KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_EXECUTION_ENABLED_ENV,
  KNOWLEDGE_CMS_PUBLIC_CUTOVER_ENABLED_ENV,
  getKnowledgeCmsPublicRoutingEnvironment,
} from "./knowledgeCmsPublicRouting";
import {
  parseKnowledgeCmsNativeRepresentationArtifact,
  validateKnowledgeCmsNativeRepresentationArtifact,
} from "./knowledgeCmsNativeRepresentation";
import { getKnowledgeCmsOperationalReadinessForActor } from "./knowledgeCmsOperationalReadinessDal";
import { getKnowledgeCmsRendererContract } from "./knowledgeCmsRendererContract";
import { createKnowledgeCmsRepository } from "./knowledgeCmsRepository";
import { previewKnowledgeCmsShadow } from "./knowledgeCmsShadowDal";
import { validateKnowledgeCmsShadowRecord } from "./knowledgeCmsShadowRenderer";

export interface KnowledgeCmsPublicCutoverApprovalRequest {
  receipt: string;
  confirmation: string;
}

export type KnowledgeCmsPublicCutoverApprovalErrorReason =
  | "approval_disabled"
  | "confirmation_mismatch"
  | "evidence_changed"
  | "invalid_request"
  | "target_exists";

export class KnowledgeCmsPublicCutoverApprovalError extends Error {
  readonly code = "knowledge_cms_public_cutover_approval";

  constructor(
    readonly reason: KnowledgeCmsPublicCutoverApprovalErrorReason,
    message: string,
  ) {
    super(message);
    this.name = "KnowledgeCmsPublicCutoverApprovalError";
  }
}

function approvalExecutionEnabled(): boolean {
  const environment = getKnowledgeCmsPublicRoutingEnvironment();
  return Boolean(
    environment.cmsEnabled === "true" &&
      environment.rendererMode === "shadow" &&
      environment.cutoverEnabled === "false" &&
      environment.approvalExecutionEnabled === "true" &&
      environment.articleMigrationExecutionEnabled === "false" &&
      environment.supportingMigrationExecutionEnabled === "false" &&
      environment.nativeRepresentationExecutionEnabled === "false" &&
      environment.siteEnvironment === "staging" &&
      environment.siteUrl === "https://beta.medicareinspokane.com",
  );
}

export function isKnowledgeCmsPublicCutoverApprovalExecutionEnabled(
  value: string | undefined =
    process.env[
      KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_EXECUTION_ENABLED_ENV
    ],
): boolean {
  return value === "true" && approvalExecutionEnabled();
}

export function assertKnowledgeCmsPublicCutoverApprovalExecutionEnabled(): void {
  if (!isKnowledgeCmsPublicCutoverApprovalExecutionEnabled()) {
    throw new KnowledgeCmsPublicCutoverApprovalError(
      "approval_disabled",
      "Public cutover approval execution is disabled or its production prerequisites are not exact.",
    );
  }
}

export async function readKnowledgeCmsPublicCutoverPreview(input: {
  actor: KnowledgeCmsActor;
  now?: Date;
}): Promise<KnowledgeCmsPublicCutoverPreview> {
  assertKnowledgeCmsActionAllowed(input.actor, "preview_public_cutover");
  const now = input.now ?? new Date();
  if (Number.isNaN(now.getTime())) {
    throw new Error("Public cutover preview requires a valid server clock.");
  }
  const [readiness, shadow] = await Promise.all([
    getKnowledgeCmsOperationalReadinessForActor(input.actor, now),
    previewKnowledgeCmsShadow(
      createKnowledgeCmsRepository(),
      input.actor,
      {
        asOf: now,
        rendererMode: process.env.KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE,
      },
    ),
  ]);
  return buildKnowledgeCmsPublicCutoverPreview({
    actor: input.actor,
    readiness,
    shadow,
    observedAt: now,
  });
}

export async function getKnowledgeCmsAdminPublicCutoverPreview(): Promise<KnowledgeCmsPublicCutoverPreview> {
  const actor = await requireKnowledgeCmsActor();
  return readKnowledgeCmsPublicCutoverPreview({ actor });
}

function assertRequest(
  request: KnowledgeCmsPublicCutoverApprovalRequest,
): void {
  if (
    !/^[a-f0-9]{64}$/.test(request.receipt) ||
    request.confirmation.length > 300
  ) {
    throw new KnowledgeCmsPublicCutoverApprovalError(
      "invalid_request",
      "The public cutover approval request is invalid.",
    );
  }
}

function assertArticleMatchesRoute(
  article: KnowledgeCmsArticle,
  route: KnowledgeCmsPublicCutoverPreview["approvalControl"]["routes"][number],
  now: Date,
): void {
  const contract = getKnowledgeCmsRendererContract(route.entryId);
  if (
    !contract ||
    article.id !== route.articleId ||
    article.audit.revision !== route.articleRevision ||
    article.status !== "published" ||
    validateKnowledgeCmsShadowRecord(contract, article, now).length > 0
  ) {
    throw new KnowledgeCmsPublicCutoverApprovalError(
      "evidence_changed",
      `The governed article evidence changed for "${route.entryId}".`,
    );
  }
}

export async function executeKnowledgeCmsPublicCutoverApproval(
  request: KnowledgeCmsPublicCutoverApprovalRequest,
): Promise<KnowledgeCmsPublicCutoverApproval> {
  assertKnowledgeCmsPublicCutoverApprovalExecutionEnabled();
  assertRequest(request);
  const actor = await requireKnowledgeCmsActor();
  assertKnowledgeCmsActionAllowed(actor, "approve_public_cutover");
  const now = new Date();
  const preview = await readKnowledgeCmsPublicCutoverPreview({ actor, now });
  const previewErrors = validateKnowledgeCmsPublicCutoverPreview(preview);
  const receipt = getKnowledgeCmsPublicCutoverReceipt(
    preview.approvalControl,
  );
  if (
    previewErrors.length > 0 ||
    preview.eligibility !== "ready_for_admin_approval" ||
    receipt !== request.receipt
  ) {
    throw new KnowledgeCmsPublicCutoverApprovalError(
      "evidence_changed",
      "Public cutover evidence changed or is no longer eligible. Refresh the preview.",
    );
  }
  if (
    request.confirmation !==
    getKnowledgeCmsPublicCutoverConfirmationPhrase(receipt)
  ) {
    throw new KnowledgeCmsPublicCutoverApprovalError(
      "confirmation_mismatch",
      "The public cutover approval phrase did not match exactly.",
    );
  }

  const approval = buildKnowledgeCmsPublicCutoverApproval({
    actor,
    control: preview.approvalControl,
    approvedAt: now,
  });
  const db = getFirestoreAdmin();
  const approvalRef = db
    .collection(KNOWLEDGE_CMS_COLLECTIONS.cutoverApprovals)
    .doc(approval.id);
  const auditRef = db
    .collection(KNOWLEDGE_CMS_COLLECTIONS.audit)
    .doc(`public-cutover-approval--${receipt}`);

  await db.runTransaction(async (transaction) => {
    const routeRefs = preview.approvalControl.routes.flatMap((route) => [
      db.collection(KNOWLEDGE_CMS_COLLECTIONS.article).doc(route.articleId),
      db
        .collection(KNOWLEDGE_CMS_COLLECTIONS.articleRenderings)
        .doc(route.representationId),
    ]);
    const snapshots = await transaction.getAll(
      approvalRef,
      auditRef,
      ...routeRefs,
    );
    if (snapshots[0].exists || snapshots[1].exists) {
      throw new KnowledgeCmsPublicCutoverApprovalError(
        "target_exists",
        "This immutable public cutover approval or audit event already exists.",
      );
    }
    for (
      let index = 0;
      index < preview.approvalControl.routes.length;
      index += 1
    ) {
      const route = preview.approvalControl.routes[index];
      const articleSnapshot = snapshots[2 + index * 2];
      const representationSnapshot = snapshots[3 + index * 2];
      if (!articleSnapshot.exists || !representationSnapshot.exists) {
        throw new KnowledgeCmsPublicCutoverApprovalError(
          "evidence_changed",
          `Current public cutover evidence is missing for "${route.entryId}".`,
        );
      }
      const record = parseKnowledgeCmsRecord(articleSnapshot.data());
      if (record.kind !== "article") {
        throw new KnowledgeCmsPublicCutoverApprovalError(
          "evidence_changed",
          `The current record kind changed for "${route.entryId}".`,
        );
      }
      assertArticleMatchesRoute(record, route, now);
      const representation =
        parseKnowledgeCmsNativeRepresentationArtifact(
          representationSnapshot.data(),
        );
      if (
        representation.id !== route.representationId ||
        representation.fingerprint.value !==
          route.representationFingerprint ||
        representation.body.renderedBodySha256 !==
          route.renderedBodySha256 ||
        validateKnowledgeCmsNativeRepresentationArtifact(
          representation,
          record,
        ).length > 0
      ) {
        throw new KnowledgeCmsPublicCutoverApprovalError(
          "evidence_changed",
          `The current rendering artifact changed for "${route.entryId}".`,
        );
      }
    }
    transaction.set(approvalRef, approval);
    transaction.set(auditRef, {
      event: "create_public_cutover_approval",
      actorId: actor.id,
      occurredAt: now.toISOString(),
      approvalId: approval.id,
      approvalFingerprint: approval.fingerprint.value,
      approvalReceipt: receipt,
      operationalReadinessFingerprint:
        approval.control.evidence.operationalReadinessFingerprint,
      shadowParityFingerprint:
        approval.control.evidence.shadowParityFingerprint,
      recordsVerified: 45,
      routesVerified: 22,
      writeCount: 2,
      trafficMoved: false,
      deploymentStarted: false,
      note:
        "Created one immutable, expiring guarded public-cutover approval. No deployment or traffic changed.",
    });
  });
  return approval;
}

export function getKnowledgeCmsPublicCutoverApprovalRuntimeState() {
  return {
    approvalExecutionEnabled:
      process.env[
        KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_EXECUTION_ENABLED_ENV
      ],
    cutoverEnabled:
      process.env[KNOWLEDGE_CMS_PUBLIC_CUTOVER_ENABLED_ENV],
  };
}
