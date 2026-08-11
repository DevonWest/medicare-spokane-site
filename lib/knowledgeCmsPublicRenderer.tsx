import "server-only";

import { getFirestoreAdmin } from "./firebase-admin";
import {
  KNOWLEDGE_CMS_COLLECTIONS,
  parseKnowledgeCmsRecord,
  type KnowledgeCmsArticle,
} from "./knowledgeCms";
import {
  parseKnowledgeCmsPublicCutoverApproval,
  type KnowledgeCmsPublicCutoverApproval,
} from "./knowledgeCmsPublicCutover";
import {
  getKnowledgeCmsPublicPathForEntryId,
  isKnowledgeCmsPublicRouteEnabled,
  resolveKnowledgeCmsPublicRouting,
  type KnowledgeCmsPublicRoutingEnvironment,
} from "./knowledgeCmsPublicRouting";
import type { KnowledgeCmsNativeRepresentationArtifact } from "./knowledgeCmsNativeRepresentation";
import { getKnowledgeCmsRendererContract } from "./knowledgeCmsRendererContract";
import { compareKnowledgeCmsShadowCandidate } from "./knowledgeCmsShadowRenderer";

export const KNOWLEDGE_CMS_PUBLIC_RENDER_TIMEOUT_MS = 1_500 as const;

export type KnowledgeCmsPublicRendererFallbackReason =
  | "approval_invalid"
  | "approval_missing"
  | "article_invalid"
  | "article_missing"
  | "artifact_invalid"
  | "artifact_missing"
  | "evidence_mismatch"
  | "invalid_route"
  | "read_error"
  | "routing_disabled"
  | "timeout";

export type KnowledgeCmsPublicRendererResult =
  | {
      outcome: "cms_candidate";
      entryId: string;
      path: string;
      approval: KnowledgeCmsPublicCutoverApproval;
      article: KnowledgeCmsArticle;
      artifact: KnowledgeCmsNativeRepresentationArtifact;
      elapsedMilliseconds: number;
    }
  | {
      outcome: "static_fallback";
      entryId: string;
      path: string;
      reason: KnowledgeCmsPublicRendererFallbackReason;
      elapsedMilliseconds: number;
    };

export interface KnowledgeCmsPublicRendererProvider {
  getApproval(id: string): Promise<unknown | undefined>;
  getArticle(id: string): Promise<unknown | undefined>;
  getRepresentation(id: string): Promise<unknown | undefined>;
}

function firestoreProvider(): KnowledgeCmsPublicRendererProvider {
  const db = getFirestoreAdmin();
  const read = async (collection: string, id: string) => {
    const snapshot = await db.collection(collection).doc(id).get();
    return snapshot.exists ? snapshot.data() : undefined;
  };
  return {
    getApproval: (id) =>
      read(KNOWLEDGE_CMS_COLLECTIONS.cutoverApprovals, id),
    getArticle: (id) => read(KNOWLEDGE_CMS_COLLECTIONS.article, id),
    getRepresentation: (id) =>
      read(KNOWLEDGE_CMS_COLLECTIONS.articleRenderings, id),
  };
}

class PublicRendererTimeoutError extends Error {}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMilliseconds: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new PublicRendererTimeoutError()),
          timeoutMilliseconds,
        );
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

function fallback(
  entryId: string,
  path: string,
  reason: KnowledgeCmsPublicRendererFallbackReason,
  startedAt: number,
): KnowledgeCmsPublicRendererResult {
  return {
    outcome: "static_fallback",
    entryId,
    path,
    reason,
    elapsedMilliseconds: Date.now() - startedAt,
  };
}

async function loadKnowledgeCmsPublicRouteUnsafe(input: {
  entryId: string;
  now: Date;
  provider: KnowledgeCmsPublicRendererProvider;
  environment?: KnowledgeCmsPublicRoutingEnvironment;
  startedAt: number;
}): Promise<KnowledgeCmsPublicRendererResult> {
  const path = getKnowledgeCmsPublicPathForEntryId(input.entryId) ?? "";
  const contract = getKnowledgeCmsRendererContract(input.entryId);
  if (!path || !contract) {
    return fallback(input.entryId, path, "invalid_route", input.startedAt);
  }
  const routing = resolveKnowledgeCmsPublicRouting(input.environment);
  const receipt = routing.approvalReceipt;
  if (
    !routing.routingEnabled ||
    !isKnowledgeCmsPublicRouteEnabled(input.entryId, routing) ||
    !receipt
  ) {
    return fallback(input.entryId, path, "routing_disabled", input.startedAt);
  }
  const approvalData = await input.provider.getApproval(
    `public-cutover--${receipt}`,
  );
  if (!approvalData) {
    return fallback(input.entryId, path, "approval_missing", input.startedAt);
  }
  let approval: KnowledgeCmsPublicCutoverApproval;
  try {
    approval = parseKnowledgeCmsPublicCutoverApproval(
      approvalData,
      receipt,
      input.now,
    );
  } catch {
    return fallback(input.entryId, path, "approval_invalid", input.startedAt);
  }
  const route = approval.control.routes.find(
    (candidate) => candidate.entryId === input.entryId,
  );
  if (!route || route.path !== path) {
    return fallback(input.entryId, path, "evidence_mismatch", input.startedAt);
  }
  const [articleData, representationData] = await Promise.all([
    input.provider.getArticle(route.articleId),
    input.provider.getRepresentation(route.representationId),
  ]);
  if (!articleData) {
    return fallback(input.entryId, path, "article_missing", input.startedAt);
  }
  if (!representationData) {
    return fallback(input.entryId, path, "artifact_missing", input.startedAt);
  }
  let article: KnowledgeCmsArticle;
  try {
    const record = parseKnowledgeCmsRecord(articleData);
    if (record.kind !== "article") {
      return fallback(input.entryId, path, "article_invalid", input.startedAt);
    }
    article = record;
  } catch {
    return fallback(input.entryId, path, "article_invalid", input.startedAt);
  }
  const comparison = compareKnowledgeCmsShadowCandidate(
    contract,
    article,
    [{ id: route.representationId, data: representationData }],
    input.now,
  );
  if (
    comparison.status !== "parity_passed" ||
    !comparison.representationArtifact ||
    comparison.recordRevision !== route.articleRevision
  ) {
    return fallback(
      input.entryId,
      path,
      comparison.status === "representation_invalid"
        ? "artifact_invalid"
        : "evidence_mismatch",
      input.startedAt,
    );
  }
  const artifact = comparison.representationArtifact;
  if (
    artifact.id !== route.representationId ||
    artifact.fingerprint.value !== route.representationFingerprint ||
    artifact.body.renderedBodySha256 !== route.renderedBodySha256 ||
    artifact.metadata.canonicalUrl !== route.canonicalUrl
  ) {
    return fallback(input.entryId, path, "evidence_mismatch", input.startedAt);
  }
  return {
    outcome: "cms_candidate",
    entryId: input.entryId,
    path,
    approval,
    article,
    artifact,
    elapsedMilliseconds: Date.now() - input.startedAt,
  };
}

export async function loadKnowledgeCmsPublicRoute(input: {
  entryId: string;
  now?: Date;
  provider?: KnowledgeCmsPublicRendererProvider;
  environment?: KnowledgeCmsPublicRoutingEnvironment;
  timeoutMilliseconds?: number;
}): Promise<KnowledgeCmsPublicRendererResult> {
  const startedAt = Date.now();
  const path = getKnowledgeCmsPublicPathForEntryId(input.entryId) ?? "";
  const now = input.now ?? new Date();
  if (Number.isNaN(now.getTime())) {
    return fallback(input.entryId, path, "read_error", startedAt);
  }
  try {
    return await withTimeout(
      loadKnowledgeCmsPublicRouteUnsafe({
        entryId: input.entryId,
        now,
        provider: input.provider ?? firestoreProvider(),
        environment: input.environment,
        startedAt,
      }),
      input.timeoutMilliseconds ?? KNOWLEDGE_CMS_PUBLIC_RENDER_TIMEOUT_MS,
    );
  } catch (error) {
    return fallback(
      input.entryId,
      path,
      error instanceof PublicRendererTimeoutError ? "timeout" : "read_error",
      startedAt,
    );
  }
}

export function emitKnowledgeCmsPublicRendererEvent(
  result: KnowledgeCmsPublicRendererResult,
): void {
  const event = {
    event: "knowledge_cms_public_renderer",
    entryId: result.entryId,
    path: result.path,
    outcome: result.outcome,
    reason:
      result.outcome === "static_fallback" ? result.reason : "verified",
    elapsedMilliseconds: result.elapsedMilliseconds,
    ...(result.outcome === "cms_candidate"
      ? {
          articleRevision: result.article.audit.revision,
          representationId: result.artifact.id,
        }
      : {}),
  };
  if (result.outcome === "cms_candidate") {
    console.info("[knowledge-cms-public-renderer]", event);
  } else {
    console.warn("[knowledge-cms-public-renderer]", event);
  }
}
