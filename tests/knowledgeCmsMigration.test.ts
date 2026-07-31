import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  getKnowledgeCmsAuthorizationDecision,
  type KnowledgeCmsActor,
  type KnowledgeCmsRecord,
  type KnowledgeCmsTopic,
} from "../lib/knowledgeCms";
import {
  buildKnowledgeCmsMigrationPreview,
  type KnowledgeCmsMigrationCandidate,
  type KnowledgeCmsMigrationTopicTarget,
} from "../lib/knowledgeCmsMigration";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const AS_OF = "2026-07-30";

function mockServerOnlyModule() {
  const serverOnlyPath = require.resolve("server-only");
  require.cache[serverOnlyPath] = {
    exports: {},
    filename: serverOnlyPath,
    id: serverOnlyPath,
    loaded: true,
  } as never;
}

async function loadMigrationDal() {
  mockServerOnlyModule();
  return import("../lib/knowledgeCmsMigrationDal");
}

function actor(
  roles: KnowledgeCmsActor["roles"],
): KnowledgeCmsActor {
  return {
    id: "migration-operator",
    roles,
  };
}

function findCandidate(
  key: string,
  existingRecords: KnowledgeCmsRecord[] = [],
): KnowledgeCmsMigrationCandidate {
  const candidate = buildKnowledgeCmsMigrationPreview({
    asOf: AS_OF,
    existingRecords,
  }).candidates.find((item) => item.key === key);
  assert.ok(candidate, `Expected migration candidate ${key}.`);
  return candidate;
}

function topicRecordFromCandidate(
  candidate: KnowledgeCmsMigrationCandidate,
): KnowledgeCmsTopic {
  assert.equal(candidate.target.kind, "topic");
  const target = candidate.target as KnowledgeCmsMigrationTopicTarget;
  return {
    schemaVersion: 1,
    id: target.id,
    kind: "topic",
    slug: target.slug,
    status: "draft",
    ownerId: "migration-operator",
    title: target.title,
    description: target.description,
    order: target.order,
    ...(target.parentTopicId
      ? { parentTopicId: target.parentTopicId }
      : {}),
    searchTerms: [...target.searchTerms],
    relationships: {
      articleIds: [...target.relationships.articleIds],
      topicIds: [...target.relationships.topicIds],
      faqIds: [...target.relationships.faqIds],
      citySlugs: [...target.relationships.citySlugs],
      agentSlugs: [...target.relationships.agentSlugs],
      carrierNames: [...target.relationships.carrierNames],
      existingPaths: [...target.relationships.existingPaths],
    },
    sources: target.sources.map((source) => ({ ...source })),
    discoverability: {
      indexing: "blocked",
      ...(target.canonicalPath
        ? { canonicalPath: target.canonicalPath }
        : {}),
    },
    audit: {
      revision: 1,
      createdAt: "2026-07-30T20:00:00.000Z",
      createdBy: "migration-operator",
      updatedAt: "2026-07-30T20:00:00.000Z",
      updatedBy: "migration-operator",
    },
  };
}

test("migration preview deterministically inventories the complete static registry", () => {
  const preview = buildKnowledgeCmsMigrationPreview({ asOf: AS_OF });

  assert.equal(preview.version, 1);
  assert.equal(preview.mode, "read_only");
  assert.equal(preview.writeCount, 0);
  assert.equal(preview.readyToExecute, false);
  assert.deepEqual(preview.issues, []);
  assert.deepEqual(preview.summary.byKind, {
    article: {
      total: 22,
      ready: 0,
      blocked: 22,
      alreadyPresent: 0,
    },
    topic: {
      total: 12,
      ready: 12,
      blocked: 0,
      alreadyPresent: 0,
    },
    faq: {
      total: 11,
      ready: 11,
      blocked: 0,
      alreadyPresent: 0,
    },
  });
  assert.equal(preview.summary.total, 45);
  assert.equal(preview.summary.ready, 23);
  assert.equal(preview.summary.blocked, 22);
  assert.equal(preview.summary.alreadyPresent, 0);
  assert.equal(preview.summary.sourceRecords, 28);
});

test("every proposed record remains a private indexing-blocked target", () => {
  const preview = buildKnowledgeCmsMigrationPreview({ asOf: AS_OF });

  assert.ok(
    preview.candidates.every(
      (candidate) =>
        candidate.target.status === "draft" &&
        candidate.target.indexing === "blocked",
    ),
  );
  assert.equal(
    new Set(preview.candidates.map((candidate) => candidate.key)).size,
    preview.candidates.length,
  );
  assert.equal(
    new Set(
      preview.candidates.map(
        (candidate) =>
          `${candidate.target.kind}:${candidate.target.id}`,
      ),
    ).size,
    preview.candidates.length,
  );
});

test("public entries preserve canonical paths, governed entities, and source dates", () => {
  const candidate = findCandidate(
    "article:resource-entry--turning-65-spokane",
  );

  assert.equal(candidate.target.kind, "article");
  assert.equal(
    candidate.target.canonicalPath,
    "/turning-65-medicare-spokane",
  );
  assert.equal(candidate.target.slug, "turning-65-medicare-spokane");
  assert.deepEqual(candidate.target.relationships.articleIds, [
    "resource-entry--compare-options",
    "resource-entry--medicare-advantage",
    "resource-entry--medicare-supplements",
    "resource-entry--part-d",
    "resource-entry--prescription-review",
  ]);
  assert.deepEqual(candidate.target.relationships.topicIds, [
    "resource-category--getting-started",
    "resource-topic--medicare-enrollment",
    "resource-topic--medicare-for-seniors",
  ]);
  assert.deepEqual(
    candidate.target.sources.map((source) => ({
      id: source.id,
      checkedAt: source.checkedAt,
      reviewDueAt: source.reviewDueAt,
    })),
    [
      {
        id: "medicare-get-started",
        checkedAt: "2026-07-30",
        reviewDueAt: "2027-01-26",
      },
      {
        id: "medicare-sign-up",
        checkedAt: "2026-07-30",
        reviewDueAt: "2027-01-26",
      },
    ],
  );
});

test("article candidates fail closed until body and metadata parity are mapped", () => {
  const preview = buildKnowledgeCmsMigrationPreview({ asOf: AS_OF });
  const articles = preview.candidates.filter(
    (candidate) => candidate.target.kind === "article",
  );

  assert.equal(articles.length, 22);
  assert.ok(articles.every((candidate) => candidate.state === "blocked"));
  assert.ok(
    articles.every((candidate) =>
      candidate.issues.some(
        (item) =>
          item.code === "article_body_unmapped" &&
          item.severity === "blocker",
      ),
    ),
  );
  assert.ok(
    articles.every((candidate) =>
      candidate.issues.some(
        (item) => item.code === "metadata_parity_unverified",
      ),
    ),
  );
});

test("FAQ candidates preserve factual lineage and first-party disclosures", () => {
  const candidate = findCandidate(
    "faq:resource-faq--government-affiliation",
  );

  assert.equal(candidate.target.kind, "faq");
  assert.deepEqual(candidate.target.factIds, [
    "agency-government-non-affiliation",
  ]);
  assert.deepEqual(
    candidate.target.sources.map((source) => ({
      id: source.id,
      kind: source.kind,
      url: source.url,
    })),
    [
      {
        id: "first-party--health-insurance-options-llc",
        kind: "first_party",
        url: "https://www.medicareinspokane.com/about",
      },
    ],
  );
  assert.ok(
    candidate.issues.some(
      (item) => item.code === "static_fact_reference_preserved",
    ),
  );
  assert.equal(candidate.state, "ready");
});

test("expired static evidence and invalid preview dates fail closed", () => {
  const expired = buildKnowledgeCmsMigrationPreview({
    asOf: "2027-01-27",
  });

  assert.ok(
    expired.issues.some(
      (item) =>
        item.code === "static_registry_invalid" &&
        item.severity === "blocker",
    ),
  );
  assert.ok(
    expired.candidates
      .filter((candidate) => candidate.target.kind === "faq")
      .every(
        (candidate) =>
          candidate.state === "blocked" &&
          candidate.issues.some(
            (item) => item.code === "source_due_for_review",
          ),
      ),
  );
  assert.throws(
    () =>
      buildKnowledgeCmsMigrationPreview({
        asOf: "2026-02-31",
      }),
    /valid UTC date/i,
  );
  assert.throws(
    () =>
      buildKnowledgeCmsMigrationPreview({
        asOf: new Date(Number.NaN),
      }),
    /valid UTC date/i,
  );
});

test("equivalent existing topic records are recognized without proposing overwrite", () => {
  const candidate = findCandidate(
    "topic:resource-category--getting-started",
  );
  const record = topicRecordFromCandidate(candidate);
  const compared = findCandidate(candidate.key, [record]);

  assert.equal(compared.state, "already_present");
  assert.ok(
    compared.issues.some((item) => item.code === "existing_match"),
  );
});

test("existing slug and canonical conflicts fail closed", () => {
  const category = findCandidate(
    "topic:resource-category--getting-started",
  );
  const categoryRecord = topicRecordFromCandidate(category);
  categoryRecord.id = "another-topic";
  const topicConflict = findCandidate(category.key, [categoryRecord]);

  assert.equal(topicConflict.state, "blocked");
  assert.ok(
    topicConflict.issues.some(
      (item) => item.code === "existing_slug_conflict",
    ),
  );

  const article = findCandidate(
    "article:resource-entry--represented-carriers",
  );
  const canonicalConflict: KnowledgeCmsTopic = {
    ...categoryRecord,
    id: "canonical-owner",
    slug: "canonical-owner",
    discoverability: {
      indexing: "blocked",
      canonicalPath: article.target.canonicalPath,
    },
  };
  const articleConflict = findCandidate(article.key, [canonicalConflict]);
  assert.ok(
    articleConflict.issues.some(
      (item) => item.code === "existing_canonical_conflict",
    ),
  );
});

test("migration inventory performs only the three collection reads", async () => {
  const { previewKnowledgeCmsMigration } = await loadMigrationDal();
  const kinds: string[] = [];
  const preview = await previewKnowledgeCmsMigration(
    {
      list: async ({ kind }) => {
        kinds.push(kind);
        return [];
      },
    },
    actor(["publisher"]),
    new Date("2026-07-30T22:00:00.000Z"),
  );

  assert.deepEqual(kinds.sort(), ["article", "faq", "topic"]);
  assert.equal(preview.writeCount, 0);
});

test("migration preview requires publisher or admin authority", async () => {
  const { previewKnowledgeCmsMigration } = await loadMigrationDal();
  let reads = 0;

  await assert.rejects(
    previewKnowledgeCmsMigration(
      {
        list: async () => {
          reads += 1;
          return [];
        },
      },
      actor(["editor"]),
      new Date("2026-07-30T22:00:00.000Z"),
    ),
    /preview_migration.*role_required/i,
  );
  assert.equal(reads, 0);
  assert.equal(
    getKnowledgeCmsAuthorizationDecision(
      actor(["publisher"]),
      "preview_migration",
    ).allowed,
    true,
  );
  assert.equal(
    getKnowledgeCmsAuthorizationDecision(
      actor(["admin"]),
      "preview_migration",
    ).allowed,
    true,
  );
});

test("admin preview route is feature-gated, authenticated, and contains no mutation action", () => {
  const page = readFileSync(
    join(
      root,
      "app/admin/knowledge/migration-preview/page.tsx",
    ),
    "utf8",
  );
  const dataAccess = readFileSync(
    join(root, "lib/knowledgeCmsMigrationDal.ts"),
    "utf8",
  );

  assert.match(page, /isKnowledgeCmsEnabled/);
  assert.match(page, /getCurrentKnowledgeCmsActor/);
  assert.match(page, /publisher/);
  assert.match(page, /admin/);
  assert.doesNotMatch(page, /["']use client["']/);
  assert.doesNotMatch(dataAccess, /\.save\s*\(/);
  assert.doesNotMatch(dataAccess, /\.transition\s*\(/);
  assert.doesNotMatch(dataAccess, /\.create\s*\(/);
});
