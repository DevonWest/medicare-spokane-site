import {
  validateKnowledgeCmsPublishReadiness,
  validateKnowledgeCmsSubmissionReadiness,
  type KnowledgeCmsArticle,
  type KnowledgeCmsStatus,
} from "./knowledgeCms";
import {
  buildKnowledgeCmsMigrationPreview,
  type KnowledgeCmsMigrationArticleTarget,
} from "./knowledgeCmsMigration";
import { knowledgeCmsRouteParityManifest } from "./knowledgeCmsRouteParity";

export const KNOWLEDGE_CMS_ARTICLE_EDITORIAL_ROLLOUT_VERSION = 2 as const;
export const KNOWLEDGE_CMS_ARTICLE_EDITORIAL_ROLLOUT_PATH =
  "/admin/knowledge/article-review-queue" as const;
export const KNOWLEDGE_CMS_ARTICLE_EDITORIAL_ROLLOUT_TOTAL = 22 as const;

export const KNOWLEDGE_CMS_ARTICLE_EDITORIAL_APPROVAL_NOTE =
  "Compared the governed migration record with its current sources, metadata, and pinned static-route parity evidence.";
export const KNOWLEDGE_CMS_ARTICLE_EDITORIAL_PUBLICATION_NOTE =
  "Published to the private CMS for shadow-parity testing with indexing blocked. Public rendering remains static.";

export type KnowledgeCmsArticleEditorialRolloutStatus =
  | KnowledgeCmsStatus
  | "missing";

export type KnowledgeCmsArticleEditorialRolloutAction =
  | "submit_approve_publish"
  | "approve_publish"
  | "publish";

export interface KnowledgeCmsArticleEditorialRolloutTarget {
  id: string;
  slug: string;
  title: string;
  canonicalPath: string;
  status: KnowledgeCmsArticleEditorialRolloutStatus;
  revision?: number;
  sourceCount: number;
  issues: string[];
  action?: KnowledgeCmsArticleEditorialRolloutAction;
}

export interface KnowledgeCmsArticleEditorialRolloutPreview {
  version: typeof KNOWLEDGE_CMS_ARTICLE_EDITORIAL_ROLLOUT_VERSION;
  asOf: string;
  mode: "one_record_at_a_time";
  writeCount: 0;
  targets: KnowledgeCmsArticleEditorialRolloutTarget[];
  next?: KnowledgeCmsArticleEditorialRolloutTarget;
  summary: {
    total: number;
    published: number;
    remaining: number;
    blocked: number;
  };
  publicSafety: {
    indexing: "blocked";
    publicRenderer: "unchanged";
    publicCutoverAuthorized: false;
    bulkExecutionAvailable: false;
  };
}

export interface KnowledgeCmsArticleEditorialRolloutRequest {
  id: string;
  expectedRevision: number;
  attested: true;
  approvalNote: string;
  publicationNote: string;
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
    .sort(([left], [right]) => left.localeCompare(right));
  return `{${entries
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
    .join(",")}}`;
}

function migrationIdentity(
  record: Pick<
    KnowledgeCmsArticle,
    "bodyFormat" | "discoverability" | "id" | "kind" | "schemaVersion" | "slug"
  >,
) {
  return {
    schemaVersion: record.schemaVersion,
    id: record.id,
    kind: record.kind,
    slug: record.slug,
    bodyFormat: record.bodyFormat,
    canonicalPath: record.discoverability.canonicalPath,
  };
}

function actionForStatus(
  status: KnowledgeCmsArticleEditorialRolloutStatus,
): KnowledgeCmsArticleEditorialRolloutAction | undefined {
  if (status === "draft") {
    return "submit_approve_publish";
  }
  if (status === "in_review") {
    return "approve_publish";
  }
  if (status === "approved") {
    return "publish";
  }
  return undefined;
}

function migrationArticleCandidates(
  asOf: Date,
): Array<{
  target: KnowledgeCmsMigrationArticleTarget;
  order: number;
}> {
  const routeOrder = new Map(
    knowledgeCmsRouteParityManifest.map((entry, index) => [
      entry.entryId,
      index,
    ]),
  );
  return buildKnowledgeCmsMigrationPreview({
    asOf,
    rendererMode: "static",
  }).candidates
    .filter(
      (
        candidate,
      ): candidate is typeof candidate & {
        target: KnowledgeCmsMigrationArticleTarget;
      } => candidate.target.kind === "article",
    )
    .map((candidate) => ({
      target: candidate.target,
      order: routeOrder.get(candidate.origin.id) ?? Number.MAX_SAFE_INTEGER,
    }))
    .sort(
      (left, right) =>
        left.order - right.order ||
        left.target.id.localeCompare(right.target.id),
    );
}

function globalControlIssues(
  candidates: ReturnType<typeof migrationArticleCandidates>,
): string[] {
  const issues: string[] = [];
  if (
    candidates.length !== KNOWLEDGE_CMS_ARTICLE_EDITORIAL_ROLLOUT_TOTAL ||
    knowledgeCmsRouteParityManifest.length !==
      KNOWLEDGE_CMS_ARTICLE_EDITORIAL_ROLLOUT_TOTAL
  ) {
    issues.push(
      `The governed article inventory must contain exactly ${KNOWLEDGE_CMS_ARTICLE_EDITORIAL_ROLLOUT_TOTAL} records.`,
    );
  }
  if (
    candidates.some(
      ({ target }) =>
        !target.controlRecord ||
        !/^[a-f0-9]{64}$/.test(
          target.controlRecord.fingerprint.value,
        ) ||
        target.bodyStatus !== "snapshot_verified" ||
        target.routeParity?.metadata.status !== "verified",
    )
  ) {
    issues.push(
      "Every governed article requires a fingerprinted migration control and verified static-route parity evidence.",
    );
  }
  return issues;
}

function validateTarget(
  target: KnowledgeCmsMigrationArticleTarget,
  record: KnowledgeCmsArticle | undefined,
  asOf: Date,
  globalIssues: string[],
): string[] {
  const issues = [...globalIssues];
  const control = target.controlRecord;
  if (!control) {
    issues.push("The deterministic article migration control is missing.");
    return issues;
  }
  if (!record) {
    issues.push("The migrated private CMS article is missing.");
    return issues;
  }
  if (
    canonicalJson(migrationIdentity(record)) !==
    canonicalJson(migrationIdentity(control.target.payload))
  ) {
    issues.push(
      "The CMS article no longer matches the immutable route identity in its governed migration control.",
    );
  }
  if (record.changeRequest) {
    issues.push(
      "The article has an unresolved change request and cannot use the rollout queue.",
    );
  }
  if (
    record.status !== "draft" &&
    record.status !== "in_review" &&
    record.status !== "approved" &&
    record.status !== "published"
  ) {
    issues.push(
      `The article status ${record.status} is outside the private publication queue.`,
    );
  }

  const readinessErrors =
    record.status === "approved" || record.status === "published"
      ? validateKnowledgeCmsPublishReadiness(record, asOf)
      : validateKnowledgeCmsSubmissionReadiness(record, asOf);
  for (const error of readinessErrors) {
    issues.push(error);
  }
  return [...new Set(issues)];
}

export function buildKnowledgeCmsArticleEditorialRolloutPreview(
  records: ReadonlyArray<KnowledgeCmsArticle>,
  asOf: Date = new Date(),
): KnowledgeCmsArticleEditorialRolloutPreview {
  const candidates = migrationArticleCandidates(asOf);
  const globalIssues = globalControlIssues(candidates);
  const recordsById = new Map(records.map((record) => [record.id, record]));
  const targets = candidates.map(({ target }) => {
    const record = recordsById.get(target.id);
    const status = record?.status ?? "missing";
    const issues = validateTarget(
      target,
      record,
      asOf,
      globalIssues,
    );
    const action = issues.length === 0 ? actionForStatus(status) : undefined;
    return {
      id: target.id,
      slug: target.slug,
      title: target.title,
      canonicalPath: target.canonicalPath ?? "",
      status,
      ...(record ? { revision: record.audit.revision } : {}),
      sourceCount: target.sources.length,
      issues,
      ...(action ? { action } : {}),
    } satisfies KnowledgeCmsArticleEditorialRolloutTarget;
  });
  const blocked = targets.filter((target) => target.issues.length > 0).length;
  const published = targets.filter(
    (target) => target.status === "published" && target.issues.length === 0,
  ).length;
  const next =
    blocked === 0
      ? targets.find((target) => target.action !== undefined)
      : undefined;

  return {
    version: KNOWLEDGE_CMS_ARTICLE_EDITORIAL_ROLLOUT_VERSION,
    asOf: asOf.toISOString(),
    mode: "one_record_at_a_time",
    writeCount: 0,
    targets,
    ...(next ? { next } : {}),
    summary: {
      total: targets.length,
      published,
      remaining: targets.length - published,
      blocked,
    },
    publicSafety: {
      indexing: "blocked",
      publicRenderer: "unchanged",
      publicCutoverAuthorized: false,
      bulkExecutionAvailable: false,
    },
  };
}
