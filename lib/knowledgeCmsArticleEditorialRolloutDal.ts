import "server-only";

import {
  getEditorialReviewerVerificationValidThrough,
  resolveCurrentEditorialReviewerVerification,
} from "./editorial";
import {
  KnowledgeCmsAuthorizationError,
  KnowledgeCmsValidationError,
  resolveKnowledgeCmsApprovalDueAt,
  validateKnowledgeCmsPublishReadiness,
  type KnowledgeCmsActor,
  type KnowledgeCmsArticle,
} from "./knowledgeCms";
import {
  validateKnowledgeCmsPublicationDecision,
} from "./knowledgeCmsAdmin";
import { requireKnowledgeCmsActor } from "./knowledgeCmsAdminAuth";
import {
  buildKnowledgeCmsArticleEditorialRolloutPreview,
  type KnowledgeCmsArticleEditorialRolloutPreview,
  type KnowledgeCmsArticleEditorialRolloutRequest,
} from "./knowledgeCmsArticleEditorialRollout";
import {
  KnowledgeCmsConflictError,
  KnowledgeCmsNotFoundError,
  createKnowledgeCmsRepository,
  type KnowledgeCmsRepository,
} from "./knowledgeCmsRepository";
import {
  KnowledgeCmsReviewerVerificationError,
  KnowledgeCmsWorkflow,
} from "./knowledgeCmsWorkflow";

export type KnowledgeCmsArticleEditorialRolloutErrorReason =
  | "already_complete"
  | "inventory_blocked"
  | "target_changed";

export class KnowledgeCmsArticleEditorialRolloutError extends Error {
  readonly code = "knowledge_cms_article_editorial_rollout";

  constructor(
    readonly reason: KnowledgeCmsArticleEditorialRolloutErrorReason,
  ) {
    super(`Knowledge CMS article editorial rollout failed (${reason}).`);
    this.name = "KnowledgeCmsArticleEditorialRolloutError";
  }
}

export interface KnowledgeCmsArticleEditorialRolloutDependencies {
  actor: KnowledgeCmsActor;
  repository: KnowledgeCmsRepository;
  now?: () => Date;
}

function assertAdmin(actor: KnowledgeCmsActor): void {
  if (!actor.roles.includes("admin")) {
    throw new KnowledgeCmsAuthorizationError(
      "preview_migration",
      "role_required",
    );
  }
}

async function loadPreview(
  dependencies: KnowledgeCmsArticleEditorialRolloutDependencies,
  now: Date,
): Promise<KnowledgeCmsArticleEditorialRolloutPreview> {
  assertAdmin(dependencies.actor);
  const records = await new KnowledgeCmsWorkflow(
    dependencies.repository,
    { now: () => now },
  ).list({ kind: "article" }, dependencies.actor);
  return buildKnowledgeCmsArticleEditorialRolloutPreview(
    records as KnowledgeCmsArticle[],
    now,
  );
}

export async function getKnowledgeCmsArticleEditorialRolloutPreviewWith(
  dependencies: KnowledgeCmsArticleEditorialRolloutDependencies,
): Promise<KnowledgeCmsArticleEditorialRolloutPreview> {
  return loadPreview(
    dependencies,
    dependencies.now?.() ?? new Date(),
  );
}

function preflightPublishReadiness(
  current: KnowledgeCmsArticle,
  actor: KnowledgeCmsActor,
  reviewerVerificationId: string,
  reviewDueAt: string,
  now: Date,
): void {
  const candidate: KnowledgeCmsArticle =
    current.status === "approved"
      ? current
      : {
          ...current,
          status: "approved",
          review: {
            reviewerAgentSlug: actor.agentSlug!,
            reviewerVerificationId,
            reviewedBy: actor.id,
            reviewedAt: now.toISOString(),
            reviewDueAt,
            decisionNote: "Preflight only.",
          },
        };
  const errors = [
    ...validateKnowledgeCmsPublishReadiness(candidate, now),
    ...validateKnowledgeCmsPublicationDecision(candidate, {
      indexing: "blocked",
    }),
  ];
  if (errors.length > 0) {
    throw new KnowledgeCmsValidationError(errors);
  }
}

export async function executeKnowledgeCmsArticleEditorialRolloutWith(
  request: KnowledgeCmsArticleEditorialRolloutRequest,
  dependencies: KnowledgeCmsArticleEditorialRolloutDependencies,
): Promise<{ id: string; revision: number; status: "published" }> {
  const now = dependencies.now?.() ?? new Date();
  const preview = await loadPreview(dependencies, now);
  if (preview.summary.blocked > 0) {
    throw new KnowledgeCmsArticleEditorialRolloutError(
      "inventory_blocked",
    );
  }
  if (!preview.next) {
    throw new KnowledgeCmsArticleEditorialRolloutError(
      "already_complete",
    );
  }
  if (
    preview.next.id !== request.id ||
    preview.next.revision !== request.expectedRevision
  ) {
    throw new KnowledgeCmsArticleEditorialRolloutError("target_changed");
  }
  if (!request.attested) {
    throw new KnowledgeCmsValidationError([
      "The record-specific review attestation is required.",
    ]);
  }

  const verification = dependencies.actor.agentSlug
    ? resolveCurrentEditorialReviewerVerification(
        dependencies.actor.agentSlug,
        now,
      )
    : undefined;
  const verificationValidThrough = verification
    ? getEditorialReviewerVerificationValidThrough(verification)
    : undefined;
  if (!verification || !verificationValidThrough) {
    throw new KnowledgeCmsReviewerVerificationError();
  }

  let transitionOffsetMs = 0;
  const workflow = new KnowledgeCmsWorkflow(dependencies.repository, {
    now: () => new Date(now.getTime() + transitionOffsetMs++),
  });
  let current = await workflow.get(
    "article",
    request.id,
    dependencies.actor,
  );
  if (!current || current.kind !== "article") {
    throw new KnowledgeCmsNotFoundError("article", request.id);
  }
  if (current.audit.revision !== request.expectedRevision) {
    throw new KnowledgeCmsConflictError(
      `Knowledge CMS revision changed (expected ${request.expectedRevision}, found ${current.audit.revision}).`,
    );
  }
  if (
    current.status !== "draft" &&
    current.status !== "in_review" &&
    current.status !== "approved"
  ) {
    throw new KnowledgeCmsArticleEditorialRolloutError("target_changed");
  }

  const reviewDueAt = resolveKnowledgeCmsApprovalDueAt(
    now,
    verificationValidThrough,
    current.sources,
  );
  preflightPublishReadiness(
    current,
    dependencies.actor,
    verification.id,
    reviewDueAt,
    now,
  );

  if (current.status === "draft") {
    current = await workflow.transition(
      "article",
      current.id,
      {
        action: "submit_for_review",
        expectedRevision: current.audit.revision,
      },
      dependencies.actor,
    ) as KnowledgeCmsArticle;
  }
  if (current.status === "in_review") {
    current = await workflow.transition(
      "article",
      current.id,
      {
        action: "approve",
        expectedRevision: current.audit.revision,
        reviewerVerificationId: verification.id,
        reviewDueAt,
        decisionNote: request.approvalNote,
      },
      dependencies.actor,
    ) as KnowledgeCmsArticle;
  }
  if (current.status === "approved") {
    current = await workflow.transition(
      "article",
      current.id,
      {
        action: "publish",
        expectedRevision: current.audit.revision,
        indexing: "blocked",
        decisionNote: request.publicationNote,
      },
      dependencies.actor,
    ) as KnowledgeCmsArticle;
  }
  if (current.status !== "published") {
    throw new KnowledgeCmsArticleEditorialRolloutError("target_changed");
  }

  return {
    id: current.id,
    revision: current.audit.revision,
    status: "published",
  };
}

export async function getKnowledgeCmsArticleEditorialRolloutPreview(): Promise<KnowledgeCmsArticleEditorialRolloutPreview> {
  return getKnowledgeCmsArticleEditorialRolloutPreviewWith({
    actor: await requireKnowledgeCmsActor(),
    repository: createKnowledgeCmsRepository(),
  });
}

export async function executeKnowledgeCmsArticleEditorialRollout(
  request: KnowledgeCmsArticleEditorialRolloutRequest,
): Promise<{ id: string; revision: number; status: "published" }> {
  return executeKnowledgeCmsArticleEditorialRolloutWith(request, {
    actor: await requireKnowledgeCmsActor(),
    repository: createKnowledgeCmsRepository(),
  });
}
