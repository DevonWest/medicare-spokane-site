import assert from "node:assert/strict";
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
  const [repository, workflow] = await Promise.all([
    import("../lib/knowledgeCmsRepository"),
    import("../lib/knowledgeCmsWorkflow"),
  ]);
  return { ...repository, ...workflow };
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

class FakeFirestore {
  readonly documents = new Map<string, Record<string, unknown>>();

  collection(name: string) {
    return {
      doc: (id: string) => new FakeDocumentReference(`${name}/${id}`),
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
        reference: FakeDocumentReference,
      ) => Promise<{
        exists: boolean;
        data: () => Record<string, unknown> | undefined;
      }>;
      set: (
        reference: FakeDocumentReference,
        data: Record<string, unknown>,
      ) => void;
      delete: (reference: FakeDocumentReference) => void;
    }) => Promise<T>,
  ): Promise<T> {
    const writes = new Map<string, Record<string, unknown> | null>();
    const transaction = {
      get: async (reference: FakeDocumentReference) => {
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
});

test("CMS collection names preserve the promised article, topic, and FAQ objects", () => {
  assert.equal(KNOWLEDGE_CMS_COLLECTIONS.article, "knowledge_articles");
  assert.equal(KNOWLEDGE_CMS_COLLECTIONS.topic, "knowledge_topics");
  assert.equal(KNOWLEDGE_CMS_COLLECTIONS.faq, "knowledge_faqs");
  assert.equal(
    KNOWLEDGE_CMS_COLLECTIONS.search,
    "knowledge_search_documents",
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
  assert.equal(
    approved.review?.decisionNote,
    "Official enrollment source checked.",
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

  const published = await workflow.transition(
    "article",
    created.id,
    {
      action: "publish",
      expectedRevision: 3,
      indexing: "eligible",
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
    },
    publisher,
  );
  const unpublished = await workflow.transition(
    "article",
    draft.id,
    {
      action: "unpublish",
      expectedRevision: published.audit.revision,
    },
    publisher,
  );

  assert.equal(unpublished.status, "draft");
  assert.equal(unpublished.discoverability.indexing, "blocked");
  assert.equal(unpublished.review, undefined);
  assert.equal(unpublished.publication, undefined);
  assert.equal(buildKnowledgeCmsSearchDocument(unpublished), undefined);
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
    },
    publisher,
  );
  await storage.save(published, {
    expectedRevision: 3,
    event: "publish",
    actorId: publisher.id,
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
