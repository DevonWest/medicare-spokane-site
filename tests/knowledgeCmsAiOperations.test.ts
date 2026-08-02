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

  async markApplied() {
    throw new Error("A published revision proposal must never be marked applied.");
  }
}

function repository(published: KnowledgeCmsArticle): KnowledgeCmsRepository {
  return {
    async get(kind, id) {
      return kind === "article" && id === published.id
        ? structuredClone(published)
        : undefined;
    },
    async list(query) {
      return query.kind === "article"
        ? [structuredClone(published) as KnowledgeCmsRecord]
        : [];
    },
    async save() {
      throw new Error("A published revision proposal must not mutate a CMS record.");
    },
  };
}

test("published articles create persistent revision proposals that cannot be directly applied", async () => {
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
      repository: repository(article()),
      runStore: store,
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
      ai.applyKnowledgeCmsAiRun(run.id, dependencies),
      (error: unknown) =>
        error instanceof ai.KnowledgeCmsAiFeatureError &&
        error.reason === "proposal_not_applyable",
    );
  } finally {
    if (previous === undefined) delete process.env.KNOWLEDGE_CMS_AI_ENABLED;
    else process.env.KNOWLEDGE_CMS_AI_ENABLED = previous;
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
      repository: repository(article()),
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
