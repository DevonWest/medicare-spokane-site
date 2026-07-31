import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { afterEach, beforeEach, test } from "node:test";
import { knowledgeEntries, knowledgeSources } from "../lib/knowledgeCenter";
import type {
  KnowledgeCmsActor,
  KnowledgeCmsArticle,
} from "../lib/knowledgeCms";
import { knowledgeCmsRendererContracts } from "../lib/knowledgeCmsRendererContract";
import { getKnowledgeCmsRouteParity } from "../lib/knowledgeCmsRouteParity";

const require = createRequire(import.meta.url);
const NOW = new Date("2026-07-30T22:00:00.000Z");

function mockServerOnlyModule() {
  const serverOnlyPath = require.resolve("server-only");
  require.cache[serverOnlyPath] = {
    exports: {},
    filename: serverOnlyPath,
    id: serverOnlyPath,
    loaded: true,
  } as never;
}

async function loadModules() {
  mockServerOnlyModule();
  return Promise.all([
    import("../lib/knowledgeCmsNativeRepresentation"),
    import("../lib/knowledgeCmsNativeRepresentationExecution"),
    import("../lib/knowledgeCmsRepository"),
  ]);
}

function actor(
  roles: KnowledgeCmsActor["roles"] = ["publisher"],
): KnowledgeCmsActor {
  return { id: "rendering-publisher", roles };
}

function articleRecord(entryId = "turning-65-spokane"): KnowledgeCmsArticle {
  const contract = knowledgeCmsRendererContracts.find(
    (candidate) => candidate.entryId === entryId,
  );
  const parity = getKnowledgeCmsRouteParity(entryId);
  const entry = knowledgeEntries.find((candidate) => candidate.id === entryId);
  assert.ok(contract);
  assert.ok(parity);
  assert.ok(entry);
  return {
    schemaVersion: 1,
    id: contract.record.id,
    kind: "article",
    slug: contract.path.slice(1),
    status: "published",
    ownerId: "article-author",
    title: entry.title,
    summary: entry.summary,
    body: "Private governed editorial record.",
    bodyFormat: "markdown",
    searchTerms: [...new Set([...entry.tags, ...entry.topicSlugs])],
    relationships: {
      articleIds: (entry.relationships?.entryPaths ?? []).flatMap((path) => {
        const related = knowledgeEntries.find(
          (candidate) => candidate.path === path,
        );
        return related ? [`resource-entry--${related.id}`] : [];
      }),
      topicIds: [
        `resource-category--${entry.categoryId}`,
        ...entry.topicSlugs.map((slug) => `resource-topic--${slug}`),
      ],
      faqIds: (entry.relationships?.faqIds ?? []).map(
        (id) => `resource-faq--${id}`,
      ),
      citySlugs: [...(entry.relationships?.citySlugs ?? [])],
      agentSlugs: [...(entry.relationships?.agentSlugs ?? [])],
      carrierNames: [...(entry.relationships?.carrierNames ?? [])],
      existingPaths: [contract.path],
    },
    sources: (entry.sourceIds ?? []).map((sourceId) => {
      const source = knowledgeSources.find(
        (candidate) => candidate.id === sourceId,
      );
      assert.ok(source);
      const due = new Date(`${source.lastChecked}T00:00:00.000Z`);
      due.setUTCDate(due.getUTCDate() + 180);
      return {
        id: source.id,
        kind: "official",
        title: source.title,
        publisher: source.publisher,
        url: source.url,
        checkedAt: source.lastChecked,
        reviewDueAt: due.toISOString().slice(0, 10),
      };
    }),
    discoverability: {
      pageTitle: parity.metadata.pageTitle,
      description: parity.metadata.description,
      canonicalPath: parity.path,
      indexing: "blocked",
    },
    review: {
      reviewerAgentSlug: "licensed-reviewer",
      reviewerVerificationId: "reviewer-verification",
      reviewedBy: "reviewer-user",
      reviewedAt: "2026-07-30T20:00:00.000Z",
      reviewDueAt: "2027-01-26",
    },
    publication: {
      publishedAt: "2026-07-30T21:00:00.000Z",
      publishedBy: "publisher-user",
    },
    audit: {
      revision: 4,
      createdAt: "2026-07-30T18:00:00.000Z",
      createdBy: "article-author",
      updatedAt: "2026-07-30T21:00:00.000Z",
      updatedBy: "publisher-user",
    },
  };
}

class FakeSnapshot {
  constructor(
    readonly id: string,
    private readonly value: unknown,
  ) {}
  get exists() {
    return this.value !== undefined;
  }
  data() {
    return this.value as Record<string, unknown> | undefined;
  }
}

class FakeDocumentReference {
  constructor(readonly path: string) {}
  async get() {
    throw new Error("Direct document reads are not used in this test.");
  }
}

class FakeCollectionReference {
  constructor(
    readonly name: string,
    private readonly documents: Map<string, unknown>,
  ) {}
  doc(id: string) {
    return new FakeDocumentReference(`${this.name}/${id}`);
  }
  async get() {
    const prefix = `${this.name}/`;
    return {
      docs: [...this.documents.entries()]
        .filter(([path]) => path.startsWith(prefix))
        .map(
          ([path, value]) =>
            new FakeSnapshot(path.slice(prefix.length), value),
        ),
    };
  }
}

class FakeTransaction {
  constructor(
    private readonly documents: Map<string, unknown>,
    private readonly reads: string[],
  ) {}
  async get(reference: FakeDocumentReference) {
    this.reads.push(reference.path);
    return new FakeSnapshot(
      reference.path.split("/").at(-1) ?? "",
      this.documents.get(reference.path),
    );
  }
  set(reference: FakeDocumentReference, value: unknown) {
    this.documents.set(reference.path, structuredClone(value));
  }
}

class FakeFirestore {
  readonly documents = new Map<string, unknown>();
  readonly reads: string[] = [];
  readonly transactions: number[] = [];
  collection(name: string) {
    return new FakeCollectionReference(name, this.documents);
  }
  async runTransaction<T>(
    callback: (transaction: FakeTransaction) => Promise<T>,
  ): Promise<T> {
    const before = this.reads.length;
    const result = await callback(
      new FakeTransaction(this.documents, this.reads),
    );
    this.transactions.push(this.reads.length - before);
    return result;
  }
}

beforeEach(() => {
  process.env.KNOWLEDGE_CMS_ENABLED = "true";
  process.env.KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED = "true";
  process.env.KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE = "shadow";
});

afterEach(() => {
  delete process.env.KNOWLEDGE_CMS_ENABLED;
  delete process.env.KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED;
  delete process.env.KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE;
});

test("native representation controls are immutable, exact, and zero-write", async () => {
  const [native] = await loadModules();
  assert.equal(native.knowledgeCmsNativeRepresentationControls.length, 22);
  assert.deepEqual(
    native.validateKnowledgeCmsNativeRepresentationControls(),
    [],
  );
  for (const control of native.knowledgeCmsNativeRepresentationControls) {
    assert.equal(control.execution.writeCount, 0);
    assert.equal(control.execution.readyToExecute, false);
    assert.equal(control.target.expectedRevision, null);
    assert.equal(control.rollout.privateShadowOnly, true);
    assert.equal(control.rollout.cutoverEligible, false);
    assert.match(control.fingerprint.value, /^[a-f0-9]{64}$/);
    const body = native.decodeKnowledgeCmsNativeRepresentationBody(
      control.target.body,
    );
    assert.equal(body.sha256, control.target.body.renderedBodySha256);
    assert.equal(body.bytes, control.target.body.renderedBodyBytes);
  }
  assert.throws(() => {
    (
      native.knowledgeCmsNativeRepresentationControls[0].target as {
        idPrefix: string;
      }
    ).idPrefix = "tampered";
  }, TypeError);
});

test("execution requires exact gate, actor, fingerprint, revision, and confirmation", async () => {
  const [native, execution] = await loadModules();
  const record = articleRecord();
  const control = native.getKnowledgeCmsNativeRepresentationControl(
    "turning-65-spokane",
  );
  assert.ok(control);
  const request = {
    controlId: control.controlId,
    controlFingerprint: control.fingerprint.value,
    expectedArticleRevision: record.audit.revision,
    confirmation:
      execution.getKnowledgeCmsNativeRepresentationConfirmationPhrase(
        record.slug,
      ),
  };
  const plan = execution.buildKnowledgeCmsNativeRepresentationExecutionPlan({
    actor: actor(),
    request,
    article: record,
    now: NOW,
  });
  assert.equal(plan.transaction.writeCount, 2);
  assert.equal(plan.target.expectedRevision, null);
  assert.equal(plan.target.conflictPolicy, "fail_if_present");
  assert.equal(plan.artifact.article.revision, record.audit.revision);
  assert.equal(plan.rollout.privateShadowOnly, true);
  assert.equal(plan.rollout.cutoverEligible, false);
  const advancedRecord: KnowledgeCmsArticle = {
    ...record,
    audit: { ...record.audit, revision: record.audit.revision + 1 },
  };
  const advancedArtifact =
    native.buildKnowledgeCmsNativeRepresentationArtifact({
      control,
      article: advancedRecord,
      actorId: actor().id,
      createdAt: NOW.toISOString(),
    });
  assert.notEqual(advancedArtifact.id, plan.artifact.id);
  assert.match(advancedArtifact.id, /--r0000000005$/);
  assert.ok(
    native
      .validateKnowledgeCmsNativeRepresentationArtifact(
        plan.artifact,
        advancedRecord,
      )
      .some((message) => /stale/i.test(message)),
  );

  await assert.rejects(
    async () =>
      execution.buildKnowledgeCmsNativeRepresentationExecutionPlan({
        actor: actor(["editor"]),
        request,
        article: record,
        now: NOW,
      }),
    /execute_article_rendering.*role_required/i,
  );
  assert.throws(
    () =>
      execution.buildKnowledgeCmsNativeRepresentationExecutionPlan({
        actor: actor(),
        request: { ...request, confirmation: "wrong" },
        article: record,
        now: NOW,
      }),
    (error) =>
      error instanceof
        execution.KnowledgeCmsNativeRepresentationExecutionError &&
      error.reason === "confirmation_mismatch",
  );
  assert.throws(
    () =>
      execution.buildKnowledgeCmsNativeRepresentationExecutionPlan({
        actor: actor(),
        request: { ...request, expectedArticleRevision: 3 },
        article: record,
        now: NOW,
      }),
    (error) =>
      error instanceof
        execution.KnowledgeCmsNativeRepresentationExecutionError &&
      error.reason === "article_not_eligible",
  );
  process.env.KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED = "TRUE";
  assert.throws(
    () =>
      execution.buildKnowledgeCmsNativeRepresentationExecutionPlan({
        actor: actor(),
        request,
        article: record,
        now: NOW,
      }),
    (error) =>
      error instanceof
        execution.KnowledgeCmsNativeRepresentationExecutionError &&
      error.reason === "execution_disabled",
  );
});

test("the repository creates one artifact and audit event atomically without overwrite", async () => {
  const [native, execution, repository] = await loadModules();
  const record = articleRecord();
  const control = native.getKnowledgeCmsNativeRepresentationControl(
    "turning-65-spokane",
  );
  assert.ok(control);
  const firestore = new FakeFirestore();
  firestore.documents.set(`knowledge_articles/${record.id}`, record);
  const storage = new repository.FirestoreKnowledgeCmsRepository({
    db: firestore as never,
    now: () => NOW,
  });
  const request = {
    controlId: control.controlId,
    controlFingerprint: control.fingerprint.value,
    expectedArticleRevision: record.audit.revision,
    confirmation:
      execution.getKnowledgeCmsNativeRepresentationConfirmationPhrase(
        record.slug,
      ),
  };
  const artifact = await storage.createArticleRendering(actor(), request);
  assert.equal(
    artifact.id,
    native.getKnowledgeCmsNativeRepresentationArtifactId(
      "turning-65-spokane",
      record.audit.revision,
    ),
  );
  assert.deepEqual(firestore.transactions, [3]);
  assert.equal(
    firestore.documents.has(
      `knowledge_cms_article_renderings/${artifact.id}`,
    ),
    true,
  );
  assert.equal(
    firestore.documents.has(
      `knowledge_cms_audit_events/${execution.getKnowledgeCmsNativeRepresentationAuditDocumentId(artifact.id)}`,
    ),
    true,
  );
  const listed = await storage.listArticleRenderings(actor());
  assert.equal(listed.length, 1);
  assert.equal(listed[0].id, artifact.id);
  await assert.rejects(
    storage.createArticleRendering(actor(), request),
    (error) => error instanceof repository.KnowledgeCmsConflictError,
  );
});

test("authorization is checked before any representation read", async () => {
  const [native, execution, repository] = await loadModules();
  const record = articleRecord();
  const control = native.getKnowledgeCmsNativeRepresentationControl(
    "turning-65-spokane",
  );
  assert.ok(control);
  const firestore = new FakeFirestore();
  firestore.documents.set(`knowledge_articles/${record.id}`, record);
  const storage = new repository.FirestoreKnowledgeCmsRepository({
    db: firestore as never,
    now: () => NOW,
  });
  await assert.rejects(
    storage.createArticleRendering(actor(["editor"]), {
      controlId: control.controlId,
      controlFingerprint: control.fingerprint.value,
      expectedArticleRevision: record.audit.revision,
      confirmation:
        execution.getKnowledgeCmsNativeRepresentationConfirmationPhrase(
          record.slug,
        ),
    }),
    /execute_article_rendering.*role_required/i,
  );
  assert.equal(firestore.reads.length, 0);
  await assert.rejects(
    storage.listArticleRenderings(actor(["editor"])),
    /preview_shadow_rendering.*role_required/i,
  );
  assert.equal(firestore.reads.length, 0);
});

test("the admin parser accepts only the bound control, revision, and typed phrase", async () => {
  const [native, execution] = await loadModules();
  const admin = await import("../lib/knowledgeCmsAdmin");
  const record = articleRecord();
  const control = native.getKnowledgeCmsNativeRepresentationControl(
    "turning-65-spokane",
  );
  assert.ok(control);
  const form = new FormData();
  const phrase =
    execution.getKnowledgeCmsNativeRepresentationConfirmationPhrase(
      record.slug,
    );
  form.set("confirmation", phrase);
  assert.deepEqual(
    admin.parseKnowledgeCmsNativeRepresentationExecutionForm(
      control.controlId,
      control.fingerprint.value,
      record.audit.revision,
      form,
    ),
    {
      controlId: control.controlId,
      controlFingerprint: control.fingerprint.value,
      expectedArticleRevision: record.audit.revision,
      confirmation: phrase,
    },
  );
  assert.throws(
    () =>
      admin.parseKnowledgeCmsNativeRepresentationExecutionForm(
        control.controlId,
        control.fingerprint.value,
        0,
        form,
      ),
    admin.KnowledgeCmsAdminInputError,
  );
});
