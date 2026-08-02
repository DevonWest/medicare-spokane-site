import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import type {
  KnowledgeCmsActor,
  KnowledgeCmsArticle,
  KnowledgeCmsRecord,
} from "../lib/knowledgeCms";
import type {
  KnowledgeCmsAiContext,
  KnowledgeCmsAiProposal,
} from "../lib/knowledgeCmsAi";
import type {
  KnowledgeCmsAiRun,
  KnowledgeCmsAiRunStore,
} from "../lib/knowledgeCmsAiDal";
import type { KnowledgeCmsRepository } from "../lib/knowledgeCmsRepository";
import type { KnowledgeCmsSaveOptions } from "../lib/knowledgeCmsRepository";

const require = createRequire(import.meta.url);

function mockServerOnlyModule() {
  const serverOnlyPath = require.resolve("server-only");
  require.cache[serverOnlyPath] = {
    exports: {},
    filename: serverOnlyPath,
    id: serverOnlyPath,
    loaded: true,
  } as never;
}

const ACTOR: KnowledgeCmsActor = { id: "cms-admin", roles: ["admin"] };

function article(): KnowledgeCmsArticle {
  return {
    schemaVersion: 1,
    id: "annual-review",
    kind: "article",
    slug: "medicare-plan-review-spokane",
    status: "published",
    ownerId: ACTOR.id,
    title: "Annual Medicare Plan Review",
    summary: "Review coverage, costs, prescriptions, doctors, and pharmacies.",
    body: "# Annual Medicare Plan Review\n\nCurrent published content.",
    bodyFormat: "markdown",
    searchTerms: ["medicare plan review spokane"],
    relationships: {
      articleIds: [],
      topicIds: ["reviewing-coverage"],
      faqIds: [],
      citySlugs: ["spokane"],
      agentSlugs: [],
      carrierNames: [],
      existingPaths: ["/medicare-plan-review-spokane"],
    },
    sources: [
      {
        id: "medicare-open-enrollment",
        kind: "official",
        title: "Medicare Open Enrollment",
        publisher: "Medicare.gov",
        url: "https://www.medicare.gov/health-drug-plans/open-enrollment",
        checkedAt: "2026-08-01",
        reviewDueAt: "2027-01-28",
      },
    ],
    discoverability: {
      pageTitle: "Annual Medicare Plan Review Spokane",
      description: "Review Medicare plan changes and costs in Spokane.",
      canonicalPath: "/medicare-plan-review-spokane",
      indexing: "blocked",
    },
    review: {
      reviewerAgentSlug: "devon-west",
      reviewerVerificationId: "devon-west-license",
      reviewedBy: ACTOR.id,
      reviewedAt: "2026-08-01T12:00:00.000Z",
      reviewDueAt: "2027-01-28",
    },
    publication: {
      publishedAt: "2026-08-01T12:05:00.000Z",
      publishedBy: ACTOR.id,
    },
    audit: {
      revision: 5,
      createdAt: "2026-08-01T11:00:00.000Z",
      createdBy: ACTOR.id,
      updatedAt: "2026-08-01T12:05:00.000Z",
      updatedBy: ACTOR.id,
    },
  };
}

function proposal(): KnowledgeCmsAiProposal {
  return {
    summary: "Strengthen the annual review guide.",
    reasoning: "The revision makes the review checklist clearer.",
    recommendedActions: ["Verify every source before promotion."],
    draft: {
      title: "Annual Medicare Plan Review",
      summary: "Review coverage, costs, prescriptions, doctors, and pharmacies.",
      body: "# Annual Medicare Plan Review\n\nProposed private revision.",
      slug: "medicare-plan-review-spokane",
      pageTitle: "Annual Medicare Plan Review Spokane",
      description: "Review Medicare plan changes and costs in Spokane.",
      canonicalPath: "/medicare-plan-review-spokane",
      searchTerms: ["medicare plan review spokane"],
      topicIds: ["reviewing-coverage"],
      faqIds: [],
      existingPaths: ["/medicare-plan-review-spokane"],
      sources: article().sources,
    },
    citations: [
      {
        title: "Medicare Open Enrollment",
        publisher: "Medicare.gov",
        url: "https://www.medicare.gov/health-drug-plans/open-enrollment",
        note: "Supports the annual coverage review context.",
      },
    ],
  };
}

class MemoryRunStore implements KnowledgeCmsAiRunStore {
  readonly values = new Map<string, KnowledgeCmsAiRun>();

  async get(id: string) {
    return this.values.get(id);
  }

  async listRecent(limit: number) {
    return [...this.values.values()]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit);
  }

  async save(run: KnowledgeCmsAiRun) {
    assert.equal(this.values.has(run.id), false);
    this.values.set(run.id, structuredClone(run));
  }

  async markApplied(
    id: string,
    actorId: string,
    result: { recordId: string; revision: number; appliedAt: string },
  ) {
    const run = this.values.get(id);
    assert.ok(run);
    assert.equal(run.initiatedBy, actorId);
    this.values.set(id, {
      ...run,
      status: "applied",
      appliedAt: result.appliedAt,
      appliedRecordId: result.recordId,
      appliedRecordRevision: result.revision,
    });
  }
}

class MemoryArticleRepository implements KnowledgeCmsRepository {
  current: KnowledgeCmsArticle;
  readonly events: KnowledgeCmsSaveOptions[] = [];

  constructor(published: KnowledgeCmsArticle) {
    this.current = structuredClone(published);
  }

  async get(kind: KnowledgeCmsRecord["kind"], id: string) {
    return kind === "article" && id === this.current.id
      ? structuredClone(this.current)
      : undefined;
  }

  async list(query: { kind: KnowledgeCmsRecord["kind"] }) {
    return query.kind === "article"
      ? [structuredClone(this.current) as KnowledgeCmsRecord]
      : [];
  }

  async save(record: KnowledgeCmsRecord, options: KnowledgeCmsSaveOptions) {
    assert.equal(record.kind, "article");
    assert.equal(options.expectedRevision, this.current.audit.revision);
    this.current = structuredClone(record as KnowledgeCmsArticle);
    this.events.push(structuredClone(options));
  }
}

test("OpenAI requests cap output and return auditable usage without storing content", async () => {
  mockServerOnlyModule();
  const previousLimit = process.env.KNOWLEDGE_CMS_AI_MAX_OUTPUT_TOKENS;
  process.env.KNOWLEDGE_CMS_AI_MAX_OUTPUT_TOKENS = "12000";
  try {
    const { OpenAiKnowledgeCmsProvider } = await import(
      "../lib/knowledgeCmsAiOpenAi"
    );
    let request: Record<string, unknown> | undefined;
    const provider = new OpenAiKnowledgeCmsProvider({
      responses: {
        async create(input: Record<string, unknown>) {
          request = input;
          return {
            output_text: JSON.stringify(proposal()),
            output: [{ type: "web_search_call" }],
            usage: {
              input_tokens: 900,
              input_tokens_details: {
                cache_write_tokens: 0,
                cached_tokens: 100,
              },
              output_tokens: 500,
              output_tokens_details: { reasoning_tokens: 200 },
              total_tokens: 1400,
            },
          };
        },
      },
    } as never);
    const result = await provider.generate(
      {
        request: {
          mode: "new_article",
          prompt: "Create a complete evidence-backed Spokane Medicare article.",
          deepResearch: false,
        },
        articleInventory: [],
      },
      { actorId: ACTOR.id },
    );

    assert.equal(request?.store, false);
    assert.equal(request?.max_output_tokens, 12000);
    assert.match(String(request?.safety_identifier), /^[a-f0-9]{64}$/);
    assert.deepEqual(result.usage, {
      inputTokens: 900,
      cachedInputTokens: 100,
      outputTokens: 500,
      reasoningTokens: 200,
      totalTokens: 1400,
      webSearchCalls: 1,
      maxOutputTokens: 12000,
    });
  } finally {
    if (previousLimit === undefined) {
      delete process.env.KNOWLEDGE_CMS_AI_MAX_OUTPUT_TOKENS;
    } else {
      process.env.KNOWLEDGE_CMS_AI_MAX_OUTPUT_TOKENS = previousLimit;
    }
  }
});

test("OpenAI activation verifies both configured models without generating content", async () => {
  mockServerOnlyModule();
  const { verifyKnowledgeCmsOpenAiAccess } = await import(
    "../lib/knowledgeCmsAiOpenAi"
  );
  const requested: string[] = [];
  const result = await verifyKnowledgeCmsOpenAiAccess({
    runtime: {
      KNOWLEDGE_CMS_AI_ENABLED: "true",
      OPENAI_API_KEY: "private-test-key",
      KNOWLEDGE_CMS_AI_MODEL: "gpt-5.6-terra",
      KNOWLEDGE_CMS_AI_DEEP_MODEL: "gpt-5.6-sol",
    },
    client: {
      models: {
        async retrieve(model) {
          requested.push(model);
          return { id: model };
        },
      },
    },
  });
  assert.deepEqual(requested.sort(), ["gpt-5.6-sol", "gpt-5.6-terra"]);
  assert.deepEqual(result, {
    status: "available",
    routineModel: "gpt-5.6-terra",
    deepModel: "gpt-5.6-sol",
  });
});

test("OpenAI activation reports sanitized access failures", async () => {
  mockServerOnlyModule();
  const { verifyKnowledgeCmsOpenAiAccess } = await import(
    "../lib/knowledgeCmsAiOpenAi"
  );
  const result = await verifyKnowledgeCmsOpenAiAccess({
    runtime: {
      KNOWLEDGE_CMS_AI_ENABLED: "true",
      OPENAI_API_KEY: "private-test-key",
    },
    client: {
      models: {
        async retrieve() {
          throw { status: 403, message: "private provider detail" };
        },
      },
    },
  });
  assert.equal(result.status, "unavailable");
  assert.equal(result.errorCode, "access_denied");
  assert.doesNotMatch(JSON.stringify(result), /private provider detail/);
});

test("published proposals require confirmation and open an audited private working revision", async () => {
  mockServerOnlyModule();
  const previous = process.env.KNOWLEDGE_CMS_AI_ENABLED;
  const previousCms = process.env.KNOWLEDGE_CMS_ENABLED;
  process.env.KNOWLEDGE_CMS_AI_ENABLED = "true";
  process.env.KNOWLEDGE_CMS_ENABLED = "true";
  try {
    const ai = await import("../lib/knowledgeCmsAiDal");
    const store = new MemoryRunStore();
    const contexts: KnowledgeCmsAiContext[] = [];
    const articleRepository = new MemoryArticleRepository(article());
    let publicMode: "cutover" | "static" = "cutover";
    const dependencies = {
      actor: ACTOR,
      now: () => new Date("2026-08-02T12:00:00.000Z"),
      repository: articleRepository,
      runStore: store,
      publicRouting: () => ({ effectiveMode: publicMode }),
      provider: {
        async generate(context: KnowledgeCmsAiContext) {
          contexts.push(context);
          return { model: "gpt-5.6-terra", proposal: proposal() };
        },
      },
    };
    const run = await ai.createKnowledgeCmsAiRun(
      {
        mode: "improve_article",
        prompt: "Improve the annual review guide while preserving the existing route.",
        deepResearch: false,
        targetRecordId: article().id,
      },
      dependencies,
    );
    assert.equal(run.status, "revision_proposal");
    assert.equal(run.targetStatus, "published");
    assert.equal(run.targetRevision, 5);
    assert.equal(store.values.get(run.id)?.status, "revision_proposal");
    assert.equal(contexts[0].currentArticle?.status, "published");

    await assert.rejects(
      ai.applyKnowledgeCmsAiRun(
        run.id,
        "apply_private_draft",
        dependencies,
      ),
      (error: unknown) =>
        error instanceof ai.KnowledgeCmsAiFeatureError &&
        error.reason === "confirmation_mismatch",
    );
    assert.equal(articleRepository.current.status, "published");

    await assert.rejects(
      ai.applyKnowledgeCmsAiRun(
        run.id,
        "start_private_revision",
        dependencies,
      ),
      (error: unknown) =>
        error instanceof ai.KnowledgeCmsAiFeatureError &&
        error.reason === "public_renderer_active",
    );
    assert.equal(articleRepository.current.status, "published");

    publicMode = "static";
    const applied = await ai.applyKnowledgeCmsAiRun(
      run.id,
      "start_private_revision",
      dependencies,
    );
    assert.deepEqual(applied, { id: article().id, revision: 6 });
    assert.equal(articleRepository.current.status, "draft");
    assert.equal(
      articleRepository.current.body,
      "# Annual Medicare Plan Review\n\nProposed private revision.",
    );
    assert.equal(articleRepository.current.review, undefined);
    assert.equal(articleRepository.current.publication, undefined);
    assert.equal(articleRepository.current.discoverability.indexing, "blocked");
    assert.equal(
      articleRepository.current.workingRevision?.sourceRevision,
      5,
    );
    assert.equal(
      articleRepository.current.workingRevision?.sourceAiRunId,
      run.id,
    );
    assert.equal(articleRepository.events[0].event, "start_revision");
    assert.equal(store.values.get(run.id)?.status, "applied");
  } finally {
    if (previous === undefined) delete process.env.KNOWLEDGE_CMS_AI_ENABLED;
    else process.env.KNOWLEDGE_CMS_AI_ENABLED = previous;
    if (previousCms === undefined) delete process.env.KNOWLEDGE_CMS_ENABLED;
    else process.env.KNOWLEDGE_CMS_ENABLED = previousCms;
  }
});

test("refinements carry the prior proposal forward and history remains actor-scoped", async () => {
  mockServerOnlyModule();
  const previous = process.env.KNOWLEDGE_CMS_AI_ENABLED;
  process.env.KNOWLEDGE_CMS_AI_ENABLED = "true";
  try {
    const ai = await import("../lib/knowledgeCmsAiDal");
    const store = new MemoryRunStore();
    const contexts: KnowledgeCmsAiContext[] = [];
    const dependencies = {
      actor: ACTOR,
      now: () => new Date("2026-08-02T12:00:00.000Z"),
      repository: new MemoryArticleRepository(article()),
      runStore: store,
      provider: {
        async generate(context: KnowledgeCmsAiContext) {
          contexts.push(context);
          return { model: "gpt-5.6-terra", proposal: proposal() };
        },
      },
    };
    const first = await ai.createKnowledgeCmsAiRun(
      {
        mode: "improve_article",
        prompt: "Improve the annual review guide while preserving the route.",
        deepResearch: false,
        targetRecordId: article().id,
      },
      dependencies,
    );
    const refined = await ai.createKnowledgeCmsAiRun(
      {
        mode: "improve_article",
        prompt: "Keep the structure and add a clearer Spokane-specific checklist.",
        deepResearch: false,
        parentRunId: first.id,
        targetRecordId: article().id,
      },
      dependencies,
    );
    assert.equal(refined.parentRunId, first.id);
    assert.deepEqual(contexts[1].previousProposal, first.proposal);

    store.values.set("another-actor", {
      ...refined,
      id: "4f59f915-58ca-4d35-9b3f-d7d28c589723",
      initiatedBy: "another-admin",
    });
    const history = await ai.listKnowledgeCmsAiRuns(10, {
      actor: ACTOR,
      runStore: store,
    });
    assert.equal(history.length, 2);
    assert.equal(history.every((run) => run.initiatedBy === ACTOR.id), true);
  } finally {
    if (previous === undefined) delete process.env.KNOWLEDGE_CMS_AI_ENABLED;
    else process.env.KNOWLEDGE_CMS_AI_ENABLED = previous;
  }
});
