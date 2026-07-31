import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import { afterEach, test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  KNOWLEDGE_CMS_COLLECTIONS,
  KnowledgeCmsAuthorizationError,
  KnowledgeCmsValidationError,
  buildKnowledgeCmsSearchDocument,
  generateKnowledgeCmsSlug,
  getKnowledgeCmsAuthorizationDecision,
  isKnowledgeCmsSourceExpired,
  parseKnowledgeCmsRecord,
  resolveKnowledgeCmsApprovalDueAt,
  validateKnowledgeCmsPublishReadiness,
  validateKnowledgeCmsRecord,
  type KnowledgeCmsActor,
  type KnowledgeCmsArticleInput,
  type KnowledgeCmsRecord,
  type KnowledgeCmsRecordKind,
  type KnowledgeCmsSource,
} from "../lib/knowledgeCms";
import type {
  KnowledgeCmsListQuery,
  KnowledgeCmsRepository,
  KnowledgeCmsSaveOptions,
} from "../lib/knowledgeCmsRepository";
import { buildKnowledgeCmsMigrationPreview } from "../lib/knowledgeCmsMigration";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const NOW = new Date("2026-07-30T18:00:00.000Z");

function mockServerOnlyModule() {
  const serverOnlyPath = require.resolve("server-only");
  require.cache[serverOnlyPath] = {
    exports: {},
    filename: serverOnlyPath,
    id: serverOnlyPath,
    loaded: true,
  } as never;
}

function enableKnowledgeCmsForTest() {
  process.env.KNOWLEDGE_CMS_ENABLED = "true";
}

async function loadServerModules() {
  mockServerOnlyModule();
  const [repository, workflow, migrationExecution, supportingExecution] = await Promise.all([
    import("../lib/knowledgeCmsRepository"),
    import("../lib/knowledgeCmsWorkflow"),
    import("../lib/knowledgeCmsArticleMigrationExecution"),
    import("../lib/knowledgeCmsSupportingMigrationExecution"),
  ]);
  return {
    ...repository,
    ...workflow,
    ...migrationExecution,
    ...supportingExecution,
  };
}

class MemoryKnowledgeCmsRepository implements KnowledgeCmsRepository {
  readonly events: Array<KnowledgeCmsSaveOptions & { id: string }> = [];
  private readonly records = new Map<string, KnowledgeCmsRecord>();
  private readonly slugs = new Map<string, string>();

  private key(kind: KnowledgeCmsRecordKind, id: string) {
    return `${kind}:${id}`;
  }

  async get(
    kind: KnowledgeCmsRecordKind,
    id: string,
  ): Promise<KnowledgeCmsRecord | undefined> {
    const record = this.records.get(this.key(kind, id));
    return record
      ? (JSON.parse(JSON.stringify(record)) as KnowledgeCmsRecord)
      : undefined;
  }

  async list(query: KnowledgeCmsListQuery): Promise<KnowledgeCmsRecord[]> {
    const statuses = query.statuses ? new Set(query.statuses) : undefined;
    return [...this.records.values()]
      .filter(
        (record) =>
          record.kind === query.kind &&
          (!statuses || statuses.has(record.status)),
      )
      .map(
        (record) =>
          JSON.parse(JSON.stringify(record)) as KnowledgeCmsRecord,
      );
  }

  async save(
    record: KnowledgeCmsRecord,
    options: KnowledgeCmsSaveOptions,
  ): Promise<void> {
    const key = this.key(record.kind, record.id);
    const current = this.records.get(key);
    const actualRevision = current?.audit.revision ?? null;
    assert.equal(actualRevision, options.expectedRevision);
    assert.equal(record.audit.revision, (actualRevision ?? 0) + 1);

    const slugKey = `${record.kind}:${record.slug}`;
    const slugOwner = this.slugs.get(slugKey);
    if (slugOwner && slugOwner !== record.id) {
      throw new Error(`Slug "${record.slug}" is already assigned.`);
    }

    if (current && current.slug !== record.slug) {
      this.slugs.delete(`${current.kind}:${current.slug}`);
    }
    this.slugs.set(slugKey, record.id);
    this.records.set(
      key,
      JSON.parse(JSON.stringify(record)) as KnowledgeCmsRecord,
    );
    this.events.push({ ...options, id: record.id });
  }
}

class FakeDocumentReference {
  constructor(readonly path: string) {}
}

class FakeQuery {
  constructor(
    readonly collectionName: string,
    readonly fieldPath: string,
    readonly value: unknown,
    private readonly documents: Map<
      string,
      Record<string, unknown>
    >,
  ) {}

  async get() {
    return {
      docs: [...this.documents.entries()]
        .filter(
          ([path, data]) =>
            path.startsWith(`${this.collectionName}/`) &&
            readFakeField(data, this.fieldPath) === this.value,
        )
        .map(([path, data]) => ({
          id: path.slice(this.collectionName.length + 1),
          exists: true,
          data: () => JSON.parse(JSON.stringify(data)),
        })),
    };
  }
}

function readFakeField(
  value: Record<string, unknown>,
  fieldPath: string,
): unknown {
  return fieldPath.split(".").reduce<unknown>((current, field) => {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }
    return (current as Record<string, unknown>)[field];
  }, value);
}

class FakeFirestore {
  readonly documents = new Map<string, Record<string, unknown>>();

  collection(name: string) {
    return {
      doc: (id: string) => new FakeDocumentReference(`${name}/${id}`),
      where: (fieldPath: string, operator: string, value: unknown) => {
        assert.equal(operator, "==");
        return new FakeQuery(name, fieldPath, value, this.documents);
      },
      get: async () => ({
        docs: [...this.documents.entries()]
          .filter(([path]) => path.startsWith(`${name}/`))
          .map(([path, data]) => ({
            id: path.slice(name.length + 1),
            exists: true,
            data: () => JSON.parse(JSON.stringify(data)),
          })),
      }),
    };
  }

  async runTransaction<T>(
    callback: (transaction: {
      get: (
        reference: FakeDocumentReference | FakeQuery,
      ) => Promise<unknown>;
      set: (
        reference: FakeDocumentReference,
        data: Record<string, unknown>,
      ) => void;
      delete: (reference: FakeDocumentReference) => void;
    }) => Promise<T>,
  ): Promise<T> {
    const writes = new Map<string, Record<string, unknown> | null>();
    const transaction = {
      get: async (reference: FakeDocumentReference | FakeQuery) => {
        if (reference instanceof FakeQuery) {
          return {
            docs: [...this.documents.entries()]
              .filter(
                ([path, data]) =>
                  path.startsWith(`${reference.collectionName}/`) &&
                  readFakeField(data, reference.fieldPath) ===
                    reference.value,
              )
              .map(([path, data]) => ({
                id: path.slice(reference.collectionName.length + 1),
                exists: true,
                data: () =>
                  JSON.parse(JSON.stringify(data)) as Record<
                    string,
                    unknown
                  >,
              })),
          };
        }
        const data = this.documents.get(reference.path);
        return {
          exists: Boolean(data),
          data: () =>
            data
              ? (JSON.parse(JSON.stringify(data)) as Record<string, unknown>)
              : undefined,
        };
      },
      set: (
        reference: FakeDocumentReference,
        data: Record<string, unknown>,
      ) => {
        writes.set(
          reference.path,
          JSON.parse(JSON.stringify(data)) as Record<string, unknown>,
        );
      },
      delete: (reference: FakeDocumentReference) => {
        writes.set(reference.path, null);
      },
    };

    const result = await callback(transaction);
    for (const [path, data] of writes) {
      if (data) {
        this.documents.set(path, data);
      } else {
        this.documents.delete(path);
      }
    }
    return result;
  }
}

function officialSource(
  overrides: Partial<KnowledgeCmsSource> = {},
): KnowledgeCmsSource {
  return {
    id: "medicare-enrollment",
    kind: "official",
    title: "When can I sign up for Medicare?",
    publisher: "Medicare.gov",
    url: "https://www.medicare.gov/basics/get-started-with-medicare/sign-up",
    checkedAt: "2026-07-30",
    reviewDueAt: "2027-01-26",
    ...overrides,
  };
}

function articleInput(
  overrides: Partial<KnowledgeCmsArticleInput> = {},
): KnowledgeCmsArticleInput {
  return {
    kind: "article",
    title: "Medicare Enrollment in Spokane",
    summary: "A practical guide to Medicare enrollment timing.",
    body: "Use official Medicare enrollment dates and verify how coverage coordinates before making a decision.",
    searchTerms: ["Medicare enrollment", "Spokane"],
    relationships: {
      topicIds: ["medicare-enrollment"],
      citySlugs: ["spokane"],
      agentSlugs: ["lynn-wold"],
    },
    sources: [officialSource()],
    discoverability: {
      pageTitle: "Medicare Enrollment in Spokane",
      description: "Review Medicare enrollment timing in Spokane.",
      canonicalPath: "/resources/medicare-enrollment-in-spokane",
    },
    ...overrides,
  };
}

const author: KnowledgeCmsActor = {
  id: "author-user",
  roles: ["author"],
  agentSlug: "devon-west",
};
const editor: KnowledgeCmsActor = {
  id: "editor-user",
  roles: ["editor"],
};
const reviewer: KnowledgeCmsActor = {
  id: "reviewer-user",
  roles: ["reviewer"],
  agentSlug: "lynn-wold",
};
const publisher: KnowledgeCmsActor = {
  id: "publisher-user",
  roles: ["publisher"],
};

afterEach(() => {
  delete process.env.KNOWLEDGE_CMS_ENABLED;
  delete process.env.KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED;
  delete process.env.KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED;
});

test("CMS collection names preserve the promised article, topic, and FAQ objects", () => {
  assert.equal(KNOWLEDGE_CMS_COLLECTIONS.article, "knowledge_articles");
  assert.equal(KNOWLEDGE_CMS_COLLECTIONS.topic, "knowledge_topics");
  assert.equal(KNOWLEDGE_CMS_COLLECTIONS.faq, "knowledge_faqs");
  assert.equal(
    KNOWLEDGE_CMS_COLLECTIONS.search,
    "knowledge_search_documents",
  );
  assert.equal(
    KNOWLEDGE_CMS_COLLECTIONS.canonicalPaths,
    "knowledge_cms_canonical_paths",
  );
});

test("slug generation is deterministic and safe for public paths", () => {
  assert.equal(
    generateKnowledgeCmsSlug("  Medicare & IRMAA: A Spouse’s Guide  "),
    "medicare-and-irmaa-a-spouses-guide",
  );
  assert.equal(
    generateKnowledgeCmsSlug("Médicare — Spokane"),
    "medicare-spokane",
  );
  assert.throws(
    () => generateKnowledgeCmsSlug("$$$"),
    KnowledgeCmsValidationError,
  );
});

test("the server-side feature flag is disabled unless explicitly true", async () => {
  const {
    FirestoreKnowledgeCmsRepository,
    KnowledgeCmsWorkflow,
    isKnowledgeCmsEnabled,
    assertKnowledgeCmsEnabled,
  } = await loadServerModules();

  assert.equal(isKnowledgeCmsEnabled(undefined), false);
  assert.equal(isKnowledgeCmsEnabled("false"), false);
  assert.equal(isKnowledgeCmsEnabled("1"), false);
  assert.equal(isKnowledgeCmsEnabled(" TRUE "), false);
  assert.equal(isKnowledgeCmsEnabled(" true "), false);
  assert.throws(() => assertKnowledgeCmsEnabled(undefined), {
    code: "knowledge_cms_disabled",
  });
  assert.throws(
    () =>
      new FirestoreKnowledgeCmsRepository({
        db: {} as never,
      }),
    { code: "knowledge_cms_disabled" },
  );
  assert.throws(
    () => new KnowledgeCmsWorkflow(new MemoryKnowledgeCmsRepository()),
    { code: "knowledge_cms_disabled" },
  );
});

test("authorization separates authoring, review, and publishing duties", () => {
  const draft = {
    ownerId: author.id,
    status: "draft",
  } as KnowledgeCmsRecord;

  assert.equal(
    getKnowledgeCmsAuthorizationDecision(author, "update", draft).allowed,
    true,
  );
  assert.deepEqual(
    getKnowledgeCmsAuthorizationDecision(
      { ...author, id: "another-author" },
      "update",
      draft,
    ),
    { allowed: false, reason: "owner_required" },
  );
  assert.equal(
    getKnowledgeCmsAuthorizationDecision(editor, "update", draft).allowed,
    true,
  );
  assert.equal(
    getKnowledgeCmsAuthorizationDecision(reviewer, "publish", draft).allowed,
    false,
  );
  assert.deepEqual(
    getKnowledgeCmsAuthorizationDecision(
      { ...reviewer, id: author.id },
      "approve",
      draft,
    ),
    { allowed: false, reason: "self_review_forbidden" },
  );
  assert.deepEqual(
    getKnowledgeCmsAuthorizationDecision(
      { ...reviewer, id: author.id },
      "request_changes",
      draft,
    ),
    { allowed: false, reason: "self_review_forbidden" },
  );
});

test("source expiration remains valid through the final UTC calendar day", () => {
  const source = officialSource({ reviewDueAt: "2026-07-30" });
  assert.equal(
    isKnowledgeCmsSourceExpired(
      source,
      "2026-07-30T23:59:59.999Z",
    ),
    false,
  );
  assert.equal(
    isKnowledgeCmsSourceExpired(source, "2026-07-31T00:00:00.000Z"),
    true,
  );
});

test("approval dates cannot outlive policy, reviewer, or source evidence", () => {
  assert.equal(
    resolveKnowledgeCmsApprovalDueAt(
      NOW,
      "2027-07-30",
      [officialSource({ reviewDueAt: "2026-12-30" })],
    ),
    "2026-12-30",
  );
  assert.equal(
    resolveKnowledgeCmsApprovalDueAt(
      NOW,
      "2026-11-15",
      [],
    ),
    "2026-11-15",
  );
  assert.equal(
    resolveKnowledgeCmsApprovalDueAt(
      NOW,
      "2028-07-30",
      [],
    ),
    "2027-07-30",
  );
  assert.throws(
    () =>
      resolveKnowledgeCmsApprovalDueAt(
        NOW,
        "2026-07-29",
        [],
      ),
    /expired reviewer or source/i,
  );
});

test("record validation rejects stale schedules and malformed stored data", () => {
  const malformed = {
    kind: "article",
    slug: "../unsafe",
    status: "published",
  };
  assert.ok(validateKnowledgeCmsRecord(malformed).length > 5);
  assert.throws(
    () => parseKnowledgeCmsRecord(malformed),
    KnowledgeCmsValidationError,
  );

  const source = officialSource({ reviewDueAt: "2027-07-30" });
  assert.match(
    validateKnowledgeCmsRecord({
      sources: [source],
    }).join(" "),
    /180 days/,
  );
});

test("creating a record produces a private draft with immutable audit fields", async () => {
  const { KnowledgeCmsWorkflow } = await loadServerModules();
  const repository = new MemoryKnowledgeCmsRepository();
  enableKnowledgeCmsForTest();
  const workflow = new KnowledgeCmsWorkflow(repository, {
    now: () => NOW,
    idFactory: () => "article-1",
  });

  const record = await workflow.create(articleInput(), author);
  assert.equal(record.id, "article-1");
  assert.equal(record.slug, "medicare-enrollment-in-spokane");
  assert.equal(record.status, "draft");
  assert.equal(record.discoverability.indexing, "blocked");
  assert.equal(record.audit.revision, 1);
  assert.equal(record.audit.createdBy, author.id);
  assert.deepEqual(validateKnowledgeCmsRecord(record), []);
  assert.deepEqual(repository.events.map((event) => event.event), ["create"]);
});

test("authors can update their own drafts while optimistic revisions protect edits", async () => {
  const { KnowledgeCmsWorkflow } = await loadServerModules();
  const repository = new MemoryKnowledgeCmsRepository();
  enableKnowledgeCmsForTest();
  let currentNow = NOW;
  const workflow = new KnowledgeCmsWorkflow(repository, {
    now: () => currentNow,
    idFactory: () => "article-1",
  });
  const created = await workflow.create(articleInput(), author);

  await assert.rejects(
    workflow.update(
      "article",
      created.id,
      { kind: "article", summary: "Unauthorized change." },
      1,
      { id: "other-author", roles: ["author"] },
    ),
    (error: unknown) =>
      error instanceof KnowledgeCmsAuthorizationError &&
      error.reason === "owner_required",
  );

  currentNow = new Date("2026-07-30T19:00:00.000Z");
  const updated = await workflow.update(
    "article",
    created.id,
    {
      kind: "article",
      title: "Updated Medicare Enrollment Guide",
      slug: "Updated Medicare Enrollment Guide",
    },
    1,
    author,
  );
  assert.equal(updated.slug, "updated-medicare-enrollment-guide");
  assert.equal(updated.audit.revision, 2);
  assert.equal(updated.audit.createdAt, created.audit.createdAt);

  await assert.rejects(
    workflow.update(
      "article",
      created.id,
      { kind: "article", summary: "Stale edit." },
      1,
      author,
    ),
    /revision changed/i,
  );
});

test("the workflow requires a different verified reviewer before publishing", async () => {
  const {
    KnowledgeCmsReviewerVerificationError,
    KnowledgeCmsWorkflow,
  } = await loadServerModules();
  const repository = new MemoryKnowledgeCmsRepository();
  enableKnowledgeCmsForTest();
  const workflow = new KnowledgeCmsWorkflow(repository, {
    now: () => NOW,
    idFactory: () => "article-1",
    reviewerVerifier: (agentSlug, verificationId) =>
      agentSlug === "lynn-wold" && verificationId === "wa-license-check-1",
  });

  const created = await workflow.create(articleInput(), author);
  const submitted = await workflow.transition(
    "article",
    created.id,
    { action: "submit_for_review", expectedRevision: 1 },
    author,
  );
  assert.equal(submitted.status, "in_review");

  await assert.rejects(
    workflow.transition(
      "article",
      created.id,
      {
        action: "approve",
        expectedRevision: 2,
        reviewerVerificationId: "wa-license-check-1",
        reviewDueAt: "2027-07-30",
      },
      { id: author.id, roles: ["reviewer"], agentSlug: "devon-west" },
    ),
    (error: unknown) =>
      error instanceof KnowledgeCmsAuthorizationError &&
      error.reason === "self_review_forbidden",
  );

  await assert.rejects(
    workflow.transition(
      "article",
      created.id,
      {
        action: "approve",
        expectedRevision: 2,
        reviewerVerificationId: "wrong-check",
        reviewDueAt: "2027-07-30",
      },
      reviewer,
    ),
    KnowledgeCmsReviewerVerificationError,
  );

  await assert.rejects(
    workflow.transition(
      "article",
      created.id,
      {
        action: "approve",
        expectedRevision: 2,
        reviewerVerificationId: "wa-license-check-1",
        reviewDueAt: "2027-07-30",
      },
      reviewer,
    ),
    /approval decision note is required/i,
  );

  const approved = await workflow.transition(
    "article",
    created.id,
    {
      action: "approve",
      expectedRevision: 2,
      reviewerVerificationId: "wa-license-check-1",
      reviewDueAt: "2027-07-30",
      decisionNote: "Official enrollment source checked.",
    },
    reviewer,
  );
  assert.equal(approved.status, "approved");
  assert.equal(approved.review?.reviewerAgentSlug, "lynn-wold");
  assert.equal(approved.review?.reviewedBy, reviewer.id);
  assert.equal(
    approved.review?.decisionNote,
    "Official enrollment source checked.",
  );
  const legacyApproval = structuredClone(approved);
  if (legacyApproval.review) {
    delete legacyApproval.review.reviewedBy;
  }
  assert.deepEqual(validateKnowledgeCmsRecord(legacyApproval), []);
  assert.match(
    validateKnowledgeCmsPublishReadiness(legacyApproval, NOW).join(" "),
    /server-recorded reviewer user identity/i,
  );

  await assert.rejects(
    workflow.transition(
      "article",
      created.id,
      { action: "publish", expectedRevision: 3 },
      editor,
    ),
    KnowledgeCmsAuthorizationError,
  );

  await assert.rejects(
    workflow.transition(
      "article",
      created.id,
      {
        action: "publish",
        expectedRevision: 3,
        decisionNote: "Reviewer must not publish their own approval.",
      },
      { ...reviewer, roles: ["reviewer", "publisher"] },
    ),
    (error: unknown) =>
      error instanceof KnowledgeCmsAuthorizationError &&
      error.reason === "reviewer_publisher_separation_required",
  );
  await assert.rejects(
    workflow.transition(
      "article",
      created.id,
      {
        action: "publish",
        expectedRevision: 3,
        decisionNote: "A second account cannot reuse the reviewer identity.",
      },
      {
        id: "second-reviewer-account",
        roles: ["publisher"],
        agentSlug: "lynn-wold",
      },
    ),
    (error: unknown) =>
      error instanceof KnowledgeCmsAuthorizationError &&
      error.reason === "reviewer_publisher_separation_required",
  );
  await assert.rejects(
    workflow.transition(
      "article",
      created.id,
      {
        action: "publish",
        expectedRevision: 3,
        decisionNote: "An indexing decision was not supplied.",
      },
      publisher,
    ),
    /explicit blocked or eligible indexing decision is required/i,
  );
  await assert.rejects(
    workflow.transition(
      "article",
      created.id,
      {
        action: "publish",
        expectedRevision: 3,
        indexing: "eligible",
      },
      publisher,
    ),
    /publication decision note is required/i,
  );

  const published = await workflow.transition(
    "article",
    created.id,
    {
      action: "publish",
      expectedRevision: 3,
      indexing: "eligible",
      decisionNote: "Approved canonical and indexing decision verified.",
    },
    publisher,
  );
  assert.equal(published.status, "published");
  assert.equal(published.discoverability.indexing, "eligible");
  assert.equal(published.publication?.publishedBy, publisher.id);

  const searchDocument = buildKnowledgeCmsSearchDocument(published);
  assert.ok(searchDocument);
  assert.equal(searchDocument.canonicalPath, published.discoverability.canonicalPath);
  searchDocument.topicIds.push("mutated");
  assert.deepEqual(published.relationships.topicIds, ["medicare-enrollment"]);
  assert.deepEqual(
    repository.events.map((event) => event.event),
    ["create", "submit_for_review", "approve", "publish"],
  );
  assert.equal(
    repository.events.find((event) => event.event === "approve")?.note,
    "Official enrollment source checked.",
  );
  assert.equal(
    repository.events.find((event) => event.event === "publish")?.note,
    "Approved canonical and indexing decision verified.",
  );
});

test("requesting changes requires verified feedback and returns an actionable draft", async () => {
  const {
    KnowledgeCmsReviewerVerificationError,
    KnowledgeCmsWorkflow,
  } = await loadServerModules();
  const repository = new MemoryKnowledgeCmsRepository();
  enableKnowledgeCmsForTest();
  const workflow = new KnowledgeCmsWorkflow(repository, {
    now: () => NOW,
    idFactory: () => "article-1",
    reviewerVerifier: (agentSlug, verificationId) =>
      agentSlug === "lynn-wold" && verificationId === "wa-license-check-1",
  });

  const created = await workflow.create(articleInput(), author);
  await workflow.transition(
    "article",
    created.id,
    { action: "submit_for_review", expectedRevision: 1 },
    author,
  );

  await assert.rejects(
    workflow.transition(
      "article",
      created.id,
      {
        action: "request_changes",
        expectedRevision: 2,
        reviewerVerificationId: "wa-license-check-1",
      },
      reviewer,
    ),
    /feedback is required/i,
  );
  await assert.rejects(
    workflow.transition(
      "article",
      created.id,
      {
        action: "request_changes",
        expectedRevision: 2,
        reviewerVerificationId: "wrong-check",
        decisionNote: "Clarify the enrollment timing example.",
      },
      reviewer,
    ),
    KnowledgeCmsReviewerVerificationError,
  );

  const returned = await workflow.transition(
    "article",
    created.id,
    {
      action: "request_changes",
      expectedRevision: 2,
      reviewerVerificationId: "wa-license-check-1",
      decisionNote: " Clarify the enrollment timing example. ",
    },
    reviewer,
  );
  assert.equal(returned.status, "draft");
  assert.deepEqual(returned.changeRequest, {
    requestedByAgentSlug: "lynn-wold",
    reviewerVerificationId: "wa-license-check-1",
    requestedAt: NOW.toISOString(),
    feedback: "Clarify the enrollment timing example.",
  });
  assert.deepEqual(validateKnowledgeCmsRecord(returned), []);
  assert.equal(repository.events.at(-1)?.event, "request_changes");
  assert.equal(
    repository.events.at(-1)?.note,
    "Clarify the enrollment timing example.",
  );
  await assert.rejects(
    workflow.transition(
      "article",
      created.id,
      {
        action: "request_changes",
        expectedRevision: 2,
        reviewerVerificationId: "wa-license-check-1",
        decisionNote: "A stale reviewer tab must not overwrite the draft.",
      },
      reviewer,
    ),
    /revision changed/i,
  );

  const revised = await workflow.update(
    "article",
    created.id,
    {
      kind: "article",
      summary: "A clearer guide to Medicare enrollment timing.",
    },
    3,
    author,
  );
  assert.equal(
    revised.changeRequest?.feedback,
    "Clarify the enrollment timing example.",
  );

  const resubmitted = await workflow.transition(
    "article",
    created.id,
    { action: "submit_for_review", expectedRevision: 4 },
    author,
  );
  assert.equal(resubmitted.status, "in_review");
  assert.equal(resubmitted.changeRequest, undefined);
});

test("drafts do not produce search documents and unpublishing blocks indexing", async () => {
  const { KnowledgeCmsWorkflow } = await loadServerModules();
  const repository = new MemoryKnowledgeCmsRepository();
  enableKnowledgeCmsForTest();
  const workflow = new KnowledgeCmsWorkflow(repository, {
    now: () => NOW,
    idFactory: () => "article-1",
    reviewerVerifier: () => true,
  });
  const draft = await workflow.create(articleInput(), author);
  assert.equal(buildKnowledgeCmsSearchDocument(draft), undefined);

  const submitted = await workflow.transition(
    "article",
    draft.id,
    { action: "submit_for_review", expectedRevision: 1 },
    author,
  );
  const approved = await workflow.transition(
    "article",
    draft.id,
    {
      action: "approve",
      expectedRevision: submitted.audit.revision,
      reviewerVerificationId: "verification-1",
      reviewDueAt: "2027-07-30",
      decisionNote: "Current source evidence verified.",
    },
    reviewer,
  );
  const published = await workflow.transition(
    "article",
    draft.id,
    {
      action: "publish",
      expectedRevision: approved.audit.revision,
      indexing: "eligible",
      decisionNote: "Approved canonical and sources rechecked.",
    },
    publisher,
  );
  await assert.rejects(
    workflow.transition(
      "article",
      draft.id,
      {
        action: "unpublish",
        expectedRevision: published.audit.revision,
      },
      publisher,
    ),
    /unpublish reason is required/i,
  );
  const unpublished = await workflow.transition(
    "article",
    draft.id,
    {
      action: "unpublish",
      expectedRevision: published.audit.revision,
      decisionNote: "Withdraw while source guidance is rechecked.",
    },
    publisher,
  );

  assert.equal(unpublished.status, "draft");
  assert.equal(unpublished.discoverability.indexing, "blocked");
  assert.equal(unpublished.review, undefined);
  assert.equal(unpublished.publication, undefined);
  assert.equal(buildKnowledgeCmsSearchDocument(unpublished), undefined);
  assert.equal(
    repository.events.find((event) => event.event === "unpublish")?.note,
    "Withdraw while source guidance is rechecked.",
  );
});

test("submission blocks missing and expired evidence without blocking valid topics", async () => {
  const { KnowledgeCmsWorkflow } = await loadServerModules();
  const repository = new MemoryKnowledgeCmsRepository();
  enableKnowledgeCmsForTest();
  let nextId = 0;
  const workflow = new KnowledgeCmsWorkflow(repository, {
    now: () => NOW,
    idFactory: () => `record-${++nextId}`,
  });

  const article = await workflow.create(
    articleInput({ sources: [] }),
    author,
  );
  await assert.rejects(
    workflow.transition(
      "article",
      article.id,
      { action: "submit_for_review", expectedRevision: 1 },
      author,
    ),
    /at least one source/i,
  );

  const topic = await workflow.create(
    {
      kind: "topic",
      title: "Medicare Enrollment",
      description: "Enrollment timing and coordination topics.",
    },
    editor,
  );
  const submittedTopic = await workflow.transition(
    "topic",
    topic.id,
    { action: "submit_for_review", expectedRevision: 1 },
    editor,
  );
  assert.equal(submittedTopic.status, "in_review");
});

test("FAQ records preserve governed categories, facts, sources, and relationships", async () => {
  const { KnowledgeCmsWorkflow } = await loadServerModules();
  const repository = new MemoryKnowledgeCmsRepository();
  enableKnowledgeCmsForTest();
  const workflow = new KnowledgeCmsWorkflow(repository, {
    now: () => NOW,
    idFactory: () => "faq-1",
  });

  const faq = await workflow.create(
    {
      kind: "faq",
      question: "When can I enroll in Medicare?",
      answer:
        "For most people first eligible at 65, the Initial Enrollment Period lasts seven months.",
      categoryId: "enrollment",
      factIds: ["initial-enrollment-period"],
      schemaEligible: true,
      relationships: {
        topicIds: ["medicare-enrollment"],
        existingPaths: ["/medicare-faq"],
      },
      sources: [officialSource()],
    },
    editor,
  );

  assert.equal(faq.kind, "faq");
  assert.deepEqual(faq.factIds, ["initial-enrollment-period"]);
  assert.deepEqual(faq.relationships.existingPaths, ["/medicare-faq"]);
  assert.equal(faq.schemaEligible, true);
  assert.equal(faq.discoverability.indexing, "blocked");
  assert.deepEqual(validateKnowledgeCmsRecord(faq), []);
});

test("slug locks prevent two records of the same kind from colliding", async () => {
  const { KnowledgeCmsWorkflow } = await loadServerModules();
  const repository = new MemoryKnowledgeCmsRepository();
  enableKnowledgeCmsForTest();
  let nextId = 0;
  const workflow = new KnowledgeCmsWorkflow(repository, {
    now: () => NOW,
    idFactory: () => `article-${++nextId}`,
  });

  await workflow.create(articleInput(), author);
  await assert.rejects(
    workflow.create(articleInput(), editor),
    /already assigned/i,
  );
});

test("the Firestore adapter commits records, slug locks, search, and audit atomically", async () => {
  const {
    FirestoreKnowledgeCmsRepository,
    KnowledgeCmsWorkflow,
  } = await loadServerModules();
  enableKnowledgeCmsForTest();

  const workflowRepository = new MemoryKnowledgeCmsRepository();
  const workflow = new KnowledgeCmsWorkflow(workflowRepository, {
    now: () => NOW,
    idFactory: () => "article-1",
    reviewerVerifier: () => true,
  });
  const firestore = new FakeFirestore();
  const storage = new FirestoreKnowledgeCmsRepository({
    db: firestore as never,
  });

  const draft = await workflow.create(articleInput(), author);
  await storage.save(draft, {
    expectedRevision: null,
    event: "create",
    actorId: author.id,
  });
  assert.ok(
    firestore.documents.has("knowledge_articles/article-1"),
  );
  assert.ok(
    firestore.documents.has(
      "knowledge_cms_slugs/article--medicare-enrollment-in-spokane",
    ),
  );
  assert.equal(
    [...firestore.documents.keys()].filter((path) =>
      path.startsWith("knowledge_cms_canonical_paths/"),
    ).length,
    1,
  );
  assert.equal(
    firestore.documents.has(
      "knowledge_search_documents/article--article-1",
    ),
    false,
  );

  const submitted = await workflow.transition(
    "article",
    draft.id,
    { action: "submit_for_review", expectedRevision: 1 },
    author,
  );
  await storage.save(submitted, {
    expectedRevision: 1,
    event: "submit_for_review",
    actorId: author.id,
  });
  const approved = await workflow.transition(
    "article",
    draft.id,
    {
      action: "approve",
      expectedRevision: 2,
      reviewerVerificationId: "verification-1",
      reviewDueAt: "2027-07-30",
      decisionNote: "Current source evidence verified.",
    },
    reviewer,
  );
  await storage.save(approved, {
    expectedRevision: 2,
    event: "approve",
    actorId: reviewer.id,
  });
  const published = await workflow.transition(
    "article",
    draft.id,
    {
      action: "publish",
      expectedRevision: 3,
      indexing: "eligible",
      decisionNote: "Approved canonical and sources rechecked.",
    },
    publisher,
  );
  await storage.save(published, {
    expectedRevision: 3,
    event: "publish",
    actorId: publisher.id,
    note: "Approved canonical and sources rechecked.",
  });

  const storedSearch = firestore.documents.get(
    "knowledge_search_documents/article--article-1",
  );
  assert.equal(storedSearch?.indexing, "eligible");
  assert.equal(storedSearch?.canonicalPath, "/resources/medicare-enrollment-in-spokane");
  assert.equal(
    [...firestore.documents.keys()].filter((path) =>
      path.startsWith("knowledge_cms_audit_events/"),
    ).length,
    4,
  );

  await assert.rejects(
    storage.save(
      {
        ...published,
        audit: {
          ...published.audit,
          revision: 5,
          updatedBy: "different-user",
        },
      },
      {
        expectedRevision: 4,
        event: "update",
        actorId: publisher.id,
      },
    ),
    /audit actor/i,
  );

  const unpublished = await workflow.transition(
    "article",
    draft.id,
    {
      action: "unpublish",
      expectedRevision: 4,
      decisionNote: "Withdraw while source evidence is rechecked.",
    },
    publisher,
  );
  await storage.save(unpublished, {
    expectedRevision: 4,
    event: "unpublish",
    actorId: publisher.id,
    note: "Withdraw while source evidence is rechecked.",
  });
  assert.equal(
    firestore.documents.has(
      "knowledge_search_documents/article--article-1",
    ),
    false,
  );
  assert.equal(
    firestore.documents.get(
      "knowledge_cms_audit_events/article--article-1--0000000005",
    )?.note,
    "Withdraw while source evidence is rechecked.",
  );
});

test("canonical locks reject legacy cross-kind ownership without overwriting", async () => {
  const {
    FirestoreKnowledgeCmsRepository,
    KnowledgeCmsWorkflow,
  } = await loadServerModules();
  enableKnowledgeCmsForTest();
  const canonicalPath = "/resources/medicare-enrollment-in-spokane";
  const memory = new MemoryKnowledgeCmsRepository();
  const topicWorkflow = new KnowledgeCmsWorkflow(memory, {
    now: () => NOW,
    idFactory: () => "legacy-topic",
  });
  const topic = await topicWorkflow.create(
    {
      kind: "topic",
      title: "Legacy enrollment topic",
      description: "A pre-lock topic record.",
      discoverability: { canonicalPath },
    },
    editor,
  );
  const articleWorkflow = new KnowledgeCmsWorkflow(
    new MemoryKnowledgeCmsRepository(),
    {
      now: () => NOW,
      idFactory: () => "new-article",
    },
  );
  const article = await articleWorkflow.create(
    articleInput({
      discoverability: {
        pageTitle: "Medicare Enrollment in Spokane",
        description: "Review Medicare enrollment timing in Spokane.",
        canonicalPath,
      },
    }),
    author,
  );
  const firestore = new FakeFirestore();
  firestore.documents.set(
    "knowledge_topics/legacy-topic",
    JSON.parse(JSON.stringify(topic)) as Record<string, unknown>,
  );
  const storage = new FirestoreKnowledgeCmsRepository({
    db: firestore as never,
  });

  await assert.rejects(
    storage.save(article, {
      expectedRevision: null,
      event: "create",
      actorId: author.id,
    }),
    /canonical path.*legacy-topic/i,
  );
  assert.equal(
    firestore.documents.has("knowledge_articles/new-article"),
    false,
  );
});

test("one confirmed article control creates one private draft transaction", async () => {
  const {
    FirestoreKnowledgeCmsRepository,
    getKnowledgeCmsArticleMigrationConfirmationPhrase,
  } = await loadServerModules();
  enableKnowledgeCmsForTest();
  process.env.KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED = "true";
  const preview = buildKnowledgeCmsMigrationPreview({ asOf: NOW });
  const candidate = preview.candidates.find(
    (item) =>
      item.target.kind === "article" &&
      item.target.controlRecord,
  );
  assert.ok(candidate?.target.kind === "article");
  const control = candidate.target.controlRecord;
  assert.ok(control);
  const firestore = new FakeFirestore();
  const storage = new FirestoreKnowledgeCmsRepository({
    db: firestore as never,
    now: () => NOW,
  });

  const created = await storage.createArticleMigrationDraft(
    publisher,
    {
      controlId: control.controlId,
      controlFingerprint: control.fingerprint.value,
      confirmation:
        getKnowledgeCmsArticleMigrationConfirmationPhrase(
          candidate.target.slug,
        ),
    },
  );

  assert.equal(created.status, "draft");
  assert.equal(created.ownerId, publisher.id);
  assert.equal(created.audit.createdAt, NOW.toISOString());
  assert.equal(created.discoverability.indexing, "blocked");
  assert.equal(
    firestore.documents.has(`knowledge_articles/${created.id}`),
    true,
  );
  assert.equal(
    firestore.documents.has(
      `knowledge_cms_slugs/article--${created.slug}`,
    ),
    true,
  );
  assert.equal(
    [...firestore.documents.keys()].filter((path) =>
      path.startsWith("knowledge_cms_canonical_paths/"),
    ).length,
    1,
  );
  assert.equal(
    firestore.documents.has(
      `knowledge_search_documents/article--${created.id}`,
    ),
    false,
  );
  const audit = firestore.documents.get(
    `knowledge_cms_audit_events/article--${created.id}--0000000001`,
  );
  assert.equal(audit?.event, "migration_create_private_draft");
  assert.equal(audit?.migrationControlId, control.controlId);
  assert.equal(audit?.migrationControlFingerprint, control.fingerprint.value);
  assert.equal(audit?.migrationExecutionVersion, 1);
  assert.equal(audit?.migrationWriteCount, 4);
  assert.equal(audit?.canonicalPath, candidate.target.canonicalPath);
  assert.match(
    String(audit?.migrationRecordFingerprint),
    /^[a-f0-9]{64}$/,
  );
  assert.equal(firestore.documents.size, 4);

  const history = await storage.listArticleMigrationExecutions(publisher);
  assert.equal(history.summary.validEvents, 1);
  assert.equal(history.summary.controlsVerified, 1);
  assert.equal(history.entries[0].recordId, created.id);
  const verification =
    await storage.verifyArticleMigrationExecution(
      publisher,
      created.id,
    );
  assert.equal(verification?.status, "verified_private_draft");
  assert.equal(verification?.artifacts.readCount, 5);
  assert.equal(verification?.artifacts.writeCount, 0);
  assert.equal(firestore.documents.size, 4);
  await assert.rejects(
    storage.listArticleMigrationExecutions(editor),
    /preview_migration.*role_required/i,
  );
  await assert.rejects(
    storage.verifyArticleMigrationExecution(editor, created.id),
    /preview_migration.*role_required/i,
  );

  await assert.rejects(
    storage.createArticleMigrationDraft(publisher, {
      controlId: control.controlId,
      controlFingerprint: control.fingerprint.value,
      confirmation:
        getKnowledgeCmsArticleMigrationConfirmationPhrase(
          candidate.target.slug,
        ),
    }),
    /target already exists/i,
  );
  assert.equal(firestore.documents.size, 4);
});

test("one confirmed topic or FAQ control creates and verifies only its private draft", async () => {
  const {
    FirestoreKnowledgeCmsRepository,
    getKnowledgeCmsSupportingMigrationConfirmationPhrase,
  } = await loadServerModules();
  enableKnowledgeCmsForTest();
  process.env.KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED = "true";
  const candidates = buildKnowledgeCmsMigrationPreview({ asOf: NOW }).candidates
    .filter(
      (candidate) =>
        (candidate.target.kind === "topic" ||
          candidate.target.kind === "faq") &&
        candidate.target.controlRecord,
    );
  const selected = [
    candidates.find(
      (candidate) =>
        candidate.target.kind === "topic" &&
        Boolean(candidate.target.canonicalPath),
    ),
    candidates.find((candidate) => candidate.target.kind === "faq"),
  ];
  assert.ok(selected.every(Boolean));

  for (const candidate of selected) {
    assert.ok(
      candidate &&
        (candidate.target.kind === "topic" ||
          candidate.target.kind === "faq"),
    );
    const control = candidate.target.controlRecord;
    assert.ok(control);
    const firestore = new FakeFirestore();
    const storage = new FirestoreKnowledgeCmsRepository({
      db: firestore as never,
      now: () => NOW,
    });
    const created = await storage.createSupportingMigrationDraft(publisher, {
      kind: candidate.target.kind,
      controlId: control.controlId,
      controlFingerprint: control.fingerprint.value,
      confirmation: getKnowledgeCmsSupportingMigrationConfirmationPhrase(
        candidate.target.kind,
        candidate.target.slug,
      ),
    });

    assert.equal(created.kind, candidate.target.kind);
    assert.equal(created.status, "draft");
    assert.equal(created.discoverability.indexing, "blocked");
    assert.equal(
      firestore.documents.has(
        `${KNOWLEDGE_CMS_COLLECTIONS[created.kind]}/${created.id}`,
      ),
      true,
    );
    assert.equal(
      firestore.documents.has(
        `knowledge_cms_slugs/${created.kind}--${created.slug}`,
      ),
      true,
    );
    assert.equal(
      firestore.documents.has(
        `knowledge_search_documents/${created.kind}--${created.id}`,
      ),
      false,
    );
    const audit = firestore.documents.get(
      `knowledge_cms_audit_events/${created.kind}--${created.id}--0000000001`,
    );
    assert.equal(
      audit?.event,
      "migration_create_private_supporting_draft",
    );
    assert.equal(
      audit?.migrationWriteCount,
      created.discoverability.canonicalPath ? 4 : 3,
    );
    assert.equal(
      firestore.documents.size,
      created.discoverability.canonicalPath ? 4 : 3,
    );

    const history = await storage.listSupportingMigrationExecutions(publisher);
    assert.equal(history.summary.validEvents, 1);
    assert.equal(history.summary.controlsVerified, 1);
    const verification = await storage.verifySupportingMigrationExecution(
      publisher,
      created.kind,
      created.id,
    );
    assert.equal(verification?.status, "verified_private_draft");
    assert.equal(
      verification?.artifacts.readCount,
      created.discoverability.canonicalPath ? 5 : 4,
    );
    assert.equal(verification?.artifacts.writeCount, 0);
    await assert.rejects(
      storage.createSupportingMigrationDraft(publisher, {
        kind: candidate.target.kind,
        controlId: control.controlId,
        controlFingerprint: control.fingerprint.value,
        confirmation: getKnowledgeCmsSupportingMigrationConfirmationPhrase(
          candidate.target.kind,
          candidate.target.slug,
        ),
      }),
      /target already exists/i,
    );
  }
});

test("migration execution fails closed on every orphaned transactional artifact", async () => {
  const {
    FirestoreKnowledgeCmsRepository,
    getKnowledgeCmsArticleMigrationConfirmationPhrase,
  } = await loadServerModules();
  enableKnowledgeCmsForTest();
  process.env.KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED = "true";
  const preview = buildKnowledgeCmsMigrationPreview({ asOf: NOW });
  const candidate = preview.candidates.find(
    (item) =>
      item.target.kind === "article" &&
      item.target.controlRecord,
  );
  assert.ok(candidate?.target.kind === "article");
  const control = candidate.target.controlRecord;
  const canonicalPath = candidate.target.canonicalPath;
  assert.ok(control && canonicalPath);
  const request = {
    controlId: control.controlId,
    controlFingerprint: control.fingerprint.value,
    confirmation:
      getKnowledgeCmsArticleMigrationConfirmationPhrase(
        candidate.target.slug,
      ),
  };
  const conflicts = [
    {
      path: `knowledge_cms_slugs/article--${candidate.target.slug}`,
      pattern: /slug.*no longer available/i,
    },
    {
      path: `knowledge_cms_canonical_paths/${createHash("sha256").update(canonicalPath).digest("hex")}`,
      pattern: /canonical path.*no longer available/i,
    },
    {
      path: `knowledge_search_documents/article--${candidate.target.id}`,
      pattern: /unexpected private search projection/i,
    },
    {
      path: `knowledge_cms_audit_events/article--${candidate.target.id}--0000000001`,
      pattern: /unexpected revision-one audit event/i,
    },
  ];

  for (const conflict of conflicts) {
    const firestore = new FakeFirestore();
    firestore.documents.set(conflict.path, { orphaned: true });
    const storage = new FirestoreKnowledgeCmsRepository({
      db: firestore as never,
      now: () => NOW,
    });
    await assert.rejects(
      storage.createArticleMigrationDraft(publisher, request),
      conflict.pattern,
    );
    assert.equal(firestore.documents.size, 1);
    assert.equal(
      firestore.documents.has(
        `knowledge_articles/${candidate.target.id}`,
      ),
      false,
    );
  }
});

function listTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      return listTypeScriptFiles(path);
    }
    return /\.(ts|tsx)$/.test(path) ? [path] : [];
  });
}

test("the CMS remains isolated from every public route and component", () => {
  const publicFiles = [
    ...listTypeScriptFiles(join(root, "app")),
    ...listTypeScriptFiles(join(root, "components")),
  ].filter(
    (path) =>
      !relative(root, path).startsWith(`${join("app", "admin")}${"/"}`),
  );
  const imports = publicFiles
    .filter((path) => /\bknowledgeCms\b/.test(readFileSync(path, "utf8")))
    .map((path) => relative(root, path));

  assert.deepEqual(imports, []);
});
