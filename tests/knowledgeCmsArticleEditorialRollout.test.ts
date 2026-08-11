import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { afterEach, test } from "node:test";
import {
  resolveKnowledgeCmsApprovalDueAt,
  type KnowledgeCmsActor,
  type KnowledgeCmsArticle,
  type KnowledgeCmsRecord,
  type KnowledgeCmsRecordKind,
} from "../lib/knowledgeCms";
import {
  buildKnowledgeCmsArticleEditorialRolloutPreview,
  KNOWLEDGE_CMS_ARTICLE_EDITORIAL_APPROVAL_NOTE,
  KNOWLEDGE_CMS_ARTICLE_EDITORIAL_PUBLICATION_NOTE,
} from "../lib/knowledgeCmsArticleEditorialRollout";
import { buildKnowledgeCmsMigrationPreview } from "../lib/knowledgeCmsMigration";
import { knowledgeCmsRouteParityManifest } from "../lib/knowledgeCmsRouteParity";
import type {
  KnowledgeCmsListQuery,
  KnowledgeCmsRepository,
  KnowledgeCmsSaveOptions,
} from "../lib/knowledgeCmsRepository";

const require = createRequire(import.meta.url);
const NOW = new Date("2026-08-01T12:00:00.000Z");
const DEVON: KnowledgeCmsActor = {
  id: "devon-google-account",
  roles: ["admin"],
  agentSlug: "devon-west",
};

function mockServerOnlyModule() {
  const serverOnlyPath = require.resolve("server-only");
  require.cache[serverOnlyPath] = {
    exports: {},
    filename: serverOnlyPath,
    id: serverOnlyPath,
    loaded: true,
  } as never;
}

function governedArticleDrafts(): KnowledgeCmsArticle[] {
  return buildKnowledgeCmsMigrationPreview({
    asOf: NOW,
    rendererMode: "static",
  }).candidates
    .filter(
      (
        candidate,
      ): candidate is typeof candidate & {
        target: Extract<typeof candidate.target, { kind: "article" }>;
      } => candidate.target.kind === "article",
    )
    .map((candidate) => {
      const payload = candidate.target.controlRecord?.target.payload;
      assert.ok(payload);
      return {
        ...payload,
        ownerId: DEVON.id,
        audit: {
          revision: 1,
          createdAt: NOW.toISOString(),
          createdBy: DEVON.id,
          updatedAt: NOW.toISOString(),
          updatedBy: DEVON.id,
        },
      };
    });
}

function publishRecord(record: KnowledgeCmsArticle): KnowledgeCmsArticle {
  const reviewDueAt = resolveKnowledgeCmsApprovalDueAt(
    NOW,
    "2027-07-31",
    record.sources,
  );
  return {
    ...record,
    status: "published",
    review: {
      reviewerAgentSlug: "devon-west",
      reviewerVerificationId: "devon-west-wa-oic-2026-07-31",
      reviewedBy: DEVON.id,
      reviewedAt: NOW.toISOString(),
      reviewDueAt,
      decisionNote: KNOWLEDGE_CMS_ARTICLE_EDITORIAL_APPROVAL_NOTE,
    },
    publication: {
      publishedAt: NOW.toISOString(),
      publishedBy: DEVON.id,
    },
    audit: {
      ...record.audit,
      revision: 4,
      updatedAt: NOW.toISOString(),
      updatedBy: DEVON.id,
    },
  };
}

class MemoryKnowledgeCmsRepository implements KnowledgeCmsRepository {
  readonly events: Array<KnowledgeCmsSaveOptions & { id: string }> = [];
  private readonly records = new Map<string, KnowledgeCmsRecord>();

  seed(records: KnowledgeCmsRecord[]) {
    for (const record of records) {
      this.records.set(
        `${record.kind}:${record.id}`,
        structuredClone(record),
      );
    }
  }

  async get(kind: KnowledgeCmsRecordKind, id: string) {
    const record = this.records.get(`${kind}:${id}`);
    return record ? structuredClone(record) : undefined;
  }

  async list(query: KnowledgeCmsListQuery) {
    const statuses = query.statuses ? new Set(query.statuses) : undefined;
    return [...this.records.values()]
      .filter(
        (record) =>
          record.kind === query.kind &&
          (!statuses || statuses.has(record.status)),
      )
      .map((record) => structuredClone(record));
  }

  async save(record: KnowledgeCmsRecord, options: KnowledgeCmsSaveOptions) {
    const key = `${record.kind}:${record.id}`;
    const current = this.records.get(key);
    assert.equal(current?.audit.revision ?? null, options.expectedRevision);
    assert.equal(
      record.audit.revision,
      (current?.audit.revision ?? 0) + 1,
    );
    this.records.set(key, structuredClone(record));
    this.events.push({ ...options, id: record.id });
  }
}

afterEach(() => {
  delete process.env.KNOWLEDGE_CMS_ENABLED;
});

test("the rollout preview recognizes one published proof record and queues the other 21", () => {
  const drafts = governedArticleDrafts();
  const proofId = "resource-entry--annual-plan-review";
  const records = drafts.map((record) =>
    record.id === proofId ? publishRecord(record) : record,
  );
  const preview = buildKnowledgeCmsArticleEditorialRolloutPreview(
    records,
    NOW,
  );

  assert.equal(preview.summary.total, 22);
  assert.equal(preview.summary.published, 1);
  assert.equal(preview.summary.remaining, 21);
  assert.equal(preview.summary.blocked, 0);
  assert.ok(preview.next);
  assert.equal(preview.next.status, "draft");
  assert.equal(preview.next.action, "submit_approve_publish");
  assert.deepEqual(preview.publicSafety, {
    indexing: "blocked",
    publicRenderer: "unchanged",
    publicCutoverAuthorized: false,
    bulkExecutionAvailable: false,
  });
});

test("a legitimate edited draft remains eligible for the deterministic queue", () => {
  const records = governedArticleDrafts();
  records[0] = {
    ...records[0],
    title: "Updated editorial title",
    summary: "Updated editorial summary with current Spokane guidance.",
    body: `${records[0].body}\n\nA reviewed editorial improvement.`,
    searchTerms: [...records[0].searchTerms, "updated search term"],
    audit: {
      ...records[0].audit,
      revision: 2,
      updatedAt: "2026-08-01T12:05:00.000Z",
    },
  };
  const preview = buildKnowledgeCmsArticleEditorialRolloutPreview(
    records,
    NOW,
  );

  assert.equal(preview.summary.blocked, 0);
  const edited = preview.targets.find(
    (target) => target.id === records[0].id,
  );
  assert.ok(edited);
  assert.deepEqual(edited.issues, []);
  assert.equal(edited.revision, 2);
  assert.equal(edited.action, "submit_approve_publish");
});

test("route identity drift still blocks the deterministic queue", () => {
  const records = governedArticleDrafts();
  records[0] = {
    ...records[0],
    slug: `${records[0].slug}-moved`,
    discoverability: {
      ...records[0].discoverability,
      canonicalPath: `${records[0].discoverability.canonicalPath}-moved`,
    },
    audit: {
      ...records[0].audit,
      revision: 2,
      updatedAt: "2026-08-01T12:05:00.000Z",
    },
  };
  const preview = buildKnowledgeCmsArticleEditorialRolloutPreview(records, NOW);

  assert.equal(preview.summary.blocked, 1);
  assert.equal(preview.next, undefined);
  const blocked = preview.targets.find((target) => target.id === records[0].id);
  assert.ok(blocked);
  assert.match(
    blocked.issues.join(" "),
    /immutable route identity/i,
  );
});

test("one attested action produces separate submit, approve, and publish revisions", async () => {
  process.env.KNOWLEDGE_CMS_ENABLED = "true";
  mockServerOnlyModule();
  const { executeKnowledgeCmsArticleEditorialRolloutWith } = await import(
    "../lib/knowledgeCmsArticleEditorialRolloutDal"
  );
  const drafts = governedArticleDrafts();
  const firstId = `resource-entry--${knowledgeCmsRouteParityManifest[0].entryId}`;
  const repository = new MemoryKnowledgeCmsRepository();
  repository.seed(
    drafts.map((record) =>
      record.id === firstId ? record : publishRecord(record),
    ),
  );

  const result = await executeKnowledgeCmsArticleEditorialRolloutWith(
    {
      id: firstId,
      expectedRevision: 1,
      attested: true,
      approvalNote: KNOWLEDGE_CMS_ARTICLE_EDITORIAL_APPROVAL_NOTE,
      publicationNote: KNOWLEDGE_CMS_ARTICLE_EDITORIAL_PUBLICATION_NOTE,
    },
    { actor: DEVON, repository, now: () => NOW },
  );

  assert.deepEqual(result, {
    id: firstId,
    revision: 4,
    status: "published",
  });
  assert.deepEqual(
    repository.events.map((event) => event.event),
    ["submit_for_review", "approve", "publish"],
  );
  assert.deepEqual(
    repository.events.map((event) => event.expectedRevision),
    [1, 2, 3],
  );
  assert.equal(
    repository.events.find((event) => event.event === "approve")?.note,
    KNOWLEDGE_CMS_ARTICLE_EDITORIAL_APPROVAL_NOTE,
  );
  assert.equal(
    repository.events.find((event) => event.event === "publish")?.note,
    KNOWLEDGE_CMS_ARTICLE_EDITORIAL_PUBLICATION_NOTE,
  );
  const published = await repository.get("article", firstId);
  assert.equal(published?.status, "published");
  assert.equal(published?.discoverability.indexing, "blocked");
});
