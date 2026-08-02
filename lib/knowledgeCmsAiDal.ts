import "server-only";

import { randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import { getFirestoreAdmin } from "./firebase-admin";
import {
  KNOWLEDGE_CMS_COLLECTIONS,
  KnowledgeCmsAuthorizationError,
  getKnowledgeCmsAuthorizationDecision,
  type KnowledgeCmsActor,
  type KnowledgeCmsArticle,
  type KnowledgeCmsArticleInput,
  type KnowledgeCmsRecord,
} from "./knowledgeCms";
import {
  KNOWLEDGE_CMS_AI_RUN_SCHEMA_VERSION,
  parseKnowledgeCmsAiProposal,
  type KnowledgeCmsAiMode,
  type KnowledgeCmsAiProposal,
  type KnowledgeCmsAiProvider,
  type KnowledgeCmsAiRequest,
} from "./knowledgeCmsAi";
import { OpenAiKnowledgeCmsProvider } from "./knowledgeCmsAiOpenAi";
import { requireKnowledgeCmsActor } from "./knowledgeCmsAdminAuth";
import {
  KnowledgeCmsNotFoundError,
  createKnowledgeCmsRepository,
  type KnowledgeCmsRepository,
} from "./knowledgeCmsRepository";
import {
  FirestoreKnowledgeCmsSeoScanStore,
  isKnowledgeCmsSeoEnabled,
  type KnowledgeCmsSeoScan,
  type KnowledgeCmsSeoScanStore,
} from "./knowledgeCmsSeoDal";
import { KnowledgeCmsWorkflow } from "./knowledgeCmsWorkflow";

export type KnowledgeCmsAiRunStatus = "applied" | "pending" | "strategy";

export interface KnowledgeCmsAiRun {
  id: string;
  schemaVersion: typeof KNOWLEDGE_CMS_AI_RUN_SCHEMA_VERSION;
  mode: KnowledgeCmsAiMode;
  status: KnowledgeCmsAiRunStatus;
  prompt: string;
  deepResearch: boolean;
  initiatedBy: string;
  createdAt: string;
  model: string;
  targetRecordId?: string;
  targetRevision?: number;
  proposedRecordId?: string;
  proposal: KnowledgeCmsAiProposal;
  appliedAt?: string;
  appliedRecordId?: string;
  appliedRecordRevision?: number;
}

export interface KnowledgeCmsAiRunStore {
  get(id: string): Promise<KnowledgeCmsAiRun | undefined>;
  save(run: KnowledgeCmsAiRun): Promise<void>;
  markApplied(
    id: string,
    actorId: string,
    result: { recordId: string; revision: number; appliedAt: string },
  ): Promise<void>;
}

export interface KnowledgeCmsAiDalDependencies {
  now?: () => Date;
  provider?: KnowledgeCmsAiProvider;
  repository?: KnowledgeCmsRepository;
  runStore?: KnowledgeCmsAiRunStore;
  scanStore?: KnowledgeCmsSeoScanStore;
}

export class KnowledgeCmsAiFeatureError extends Error {
  readonly code = "knowledge_cms_ai_feature";

  constructor(
    readonly reason:
      | "already_applied"
      | "disabled"
      | "invalid_clock"
      | "proposal_not_applyable"
      | "run_not_found"
      | "target_not_draft"
      | "wrong_actor",
  ) {
    super(`Knowledge CMS AI action is unavailable (${reason}).`);
    this.name = "KnowledgeCmsAiFeatureError";
  }
}

export function isKnowledgeCmsAiEnabled(
  value: string | undefined = process.env.KNOWLEDGE_CMS_AI_ENABLED,
): boolean {
  return value === "true";
}

export function isKnowledgeCmsAiRunId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function assertEnabled(): void {
  if (!isKnowledgeCmsAiEnabled()) {
    throw new KnowledgeCmsAiFeatureError("disabled");
  }
}

function assertAuthorized(actor: KnowledgeCmsActor): void {
  const decision = getKnowledgeCmsAuthorizationDecision(actor, "use_ai_copilot");
  if (!decision.allowed) {
    throw new KnowledgeCmsAuthorizationError("use_ai_copilot", decision.reason);
  }
}

function parseStoredRun(value: unknown): KnowledgeCmsAiRun | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const run = value as Partial<KnowledgeCmsAiRun>;
  const valid =
    run.schemaVersion === KNOWLEDGE_CMS_AI_RUN_SCHEMA_VERSION &&
    isKnowledgeCmsAiRunId(run.id) &&
    typeof run.initiatedBy === "string" &&
    /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(run.initiatedBy) &&
    typeof run.createdAt === "string" &&
    Number.isFinite(Date.parse(run.createdAt)) &&
    typeof run.prompt === "string" &&
    run.prompt.length >= 10 &&
    run.prompt.length <= 4_000 &&
    typeof run.model === "string" &&
    /^gpt-[A-Za-z0-9._-]{1,80}$/.test(run.model) &&
    typeof run.deepResearch === "boolean" &&
    (run.mode === "site_strategy" ||
      run.mode === "new_article" ||
      run.mode === "improve_article") &&
    (run.status === "pending" || run.status === "strategy" || run.status === "applied") &&
    Boolean(run.proposal) &&
    (run.mode === "site_strategy"
      ? run.status === "strategy"
      : run.status === "pending" || run.status === "applied");
  if (!valid) return undefined;
  if (
    run.mode === "improve_article" &&
    (!run.targetRecordId ||
      !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(run.targetRecordId) ||
      !Number.isInteger(run.targetRevision) ||
      (run.targetRevision ?? 0) < 1)
  ) {
    return undefined;
  }
  if (run.mode === "new_article" && !isKnowledgeCmsAiRunId(run.proposedRecordId)) {
    return undefined;
  }
  if (
    run.status === "applied" &&
    (!run.appliedAt ||
      !Number.isFinite(Date.parse(run.appliedAt)) ||
      !run.appliedRecordId ||
      !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(run.appliedRecordId) ||
      !Number.isInteger(run.appliedRecordRevision) ||
      (run.appliedRecordRevision ?? 0) < 1)
  ) {
    return undefined;
  }
  try {
    return {
      ...(run as KnowledgeCmsAiRun),
      proposal: parseKnowledgeCmsAiProposal(run.proposal, run.mode!),
    };
  } catch {
    return undefined;
  }
}

export class FirestoreKnowledgeCmsAiRunStore implements KnowledgeCmsAiRunStore {
  constructor(private readonly db: Firestore = getFirestoreAdmin()) {}

  async get(id: string): Promise<KnowledgeCmsAiRun | undefined> {
    if (!isKnowledgeCmsAiRunId(id)) return undefined;
    const snapshot = await this.db
      .collection(KNOWLEDGE_CMS_COLLECTIONS.aiRuns)
      .doc(id)
      .get();
    const value = snapshot.data();
    return parseStoredRun(value);
  }

  async save(run: KnowledgeCmsAiRun): Promise<void> {
    await this.db
      .collection(KNOWLEDGE_CMS_COLLECTIONS.aiRuns)
      .doc(run.id)
      .create(run);
  }

  async markApplied(
    id: string,
    actorId: string,
    result: { recordId: string; revision: number; appliedAt: string },
  ): Promise<void> {
    const reference = this.db.collection(KNOWLEDGE_CMS_COLLECTIONS.aiRuns).doc(id);
    await this.db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      const run = parseStoredRun(snapshot.data());
      if (!run) throw new KnowledgeCmsAiFeatureError("run_not_found");
      if (run.initiatedBy !== actorId) {
        throw new KnowledgeCmsAiFeatureError("wrong_actor");
      }
      if (run.status === "applied") {
        if (
          run.appliedRecordId === result.recordId &&
          run.appliedRecordRevision === result.revision
        ) {
          return;
        }
        throw new KnowledgeCmsAiFeatureError("already_applied");
      }
      if (run.status !== "pending") {
        throw new KnowledgeCmsAiFeatureError("proposal_not_applyable");
      }
      transaction.update(reference, {
        status: "applied",
        appliedAt: result.appliedAt,
        appliedRecordId: result.recordId,
        appliedRecordRevision: result.revision,
      });
    });
  }
}

function validNow(now: () => Date): Date {
  const value = now();
  if (!Number.isFinite(value.getTime())) {
    throw new KnowledgeCmsAiFeatureError("invalid_clock");
  }
  return value;
}

async function latestScan(
  store: KnowledgeCmsSeoScanStore | undefined,
): Promise<KnowledgeCmsSeoScan | undefined> {
  if (!isKnowledgeCmsSeoEnabled()) return undefined;
  try {
    return await (store ?? new FirestoreKnowledgeCmsSeoScanStore()).latest();
  } catch (error) {
    console.error("[knowledge-cms-ai] Latest SEO scan unavailable.", {
      error: error instanceof Error ? error.name : "unknown",
    });
    return undefined;
  }
}

function asArticle(record: KnowledgeCmsRecord | undefined): KnowledgeCmsArticle | undefined {
  return record?.kind === "article" ? record : undefined;
}

export async function createKnowledgeCmsAiRun(
  request: KnowledgeCmsAiRequest,
  dependencies: KnowledgeCmsAiDalDependencies = {},
): Promise<KnowledgeCmsAiRun> {
  assertEnabled();
  const actor = await requireKnowledgeCmsActor();
  assertAuthorized(actor);
  const repository = dependencies.repository ?? createKnowledgeCmsRepository();
  const articles = (await repository.list({ kind: "article" })) as KnowledgeCmsArticle[];
  let currentArticle: KnowledgeCmsArticle | undefined;
  if (request.mode === "improve_article") {
    currentArticle = asArticle(
      await repository.get("article", request.targetRecordId ?? ""),
    );
    if (!currentArticle) {
      throw new KnowledgeCmsNotFoundError("article", request.targetRecordId ?? "");
    }
    if (currentArticle.status !== "draft") {
      throw new KnowledgeCmsAiFeatureError("target_not_draft");
    }
  }

  const provider = dependencies.provider ?? new OpenAiKnowledgeCmsProvider();
  const generated = await provider.generate(
    {
      request,
      ...(currentArticle ? { currentArticle } : {}),
      latestScan: await latestScan(dependencies.scanStore),
      articleInventory: articles.map((article) => ({
        id: article.id,
        title: article.title,
        status: article.status,
        canonicalPath: article.discoverability.canonicalPath,
        searchTerms: article.searchTerms,
      })),
    },
    { actorId: actor.id },
  );
  const createdAt = validNow(dependencies.now ?? (() => new Date())).toISOString();
  const run: KnowledgeCmsAiRun = {
    id: randomUUID(),
    schemaVersion: KNOWLEDGE_CMS_AI_RUN_SCHEMA_VERSION,
    mode: request.mode,
    status: request.mode === "site_strategy" ? "strategy" : "pending",
    prompt: request.prompt,
    deepResearch: request.deepResearch,
    initiatedBy: actor.id,
    createdAt,
    model: generated.model,
    ...(currentArticle
      ? {
          targetRecordId: currentArticle.id,
          targetRevision: currentArticle.audit.revision,
        }
      : {}),
    ...(request.mode === "new_article" ? { proposedRecordId: randomUUID() } : {}),
    proposal: generated.proposal,
  };
  await (dependencies.runStore ?? new FirestoreKnowledgeCmsAiRunStore()).save(run);
  return run;
}

function articleInput(
  run: KnowledgeCmsAiRun,
  current?: KnowledgeCmsArticle,
): KnowledgeCmsArticleInput {
  const draft = run.proposal.draft;
  if (!draft) throw new KnowledgeCmsAiFeatureError("proposal_not_applyable");
  return {
    kind: "article",
    title: draft.title,
    summary: draft.summary,
    body: draft.body,
    slug: draft.slug,
    searchTerms: draft.searchTerms,
    relationships: {
      articleIds: current?.relationships.articleIds ?? [],
      topicIds: draft.topicIds,
      faqIds: draft.faqIds,
      citySlugs: current?.relationships.citySlugs ?? ["spokane"],
      agentSlugs: current?.relationships.agentSlugs ?? [],
      carrierNames: current?.relationships.carrierNames ?? [],
      existingPaths: draft.existingPaths,
    },
    sources: draft.sources,
    discoverability: {
      pageTitle: draft.pageTitle,
      description: draft.description,
      canonicalPath: draft.canonicalPath,
    },
  };
}

export async function applyKnowledgeCmsAiRun(
  runId: string,
  dependencies: KnowledgeCmsAiDalDependencies = {},
): Promise<{ id: string; revision: number }> {
  assertEnabled();
  const actor = await requireKnowledgeCmsActor();
  assertAuthorized(actor);
  const runStore = dependencies.runStore ?? new FirestoreKnowledgeCmsAiRunStore();
  const run = await runStore.get(runId);
  if (!run) throw new KnowledgeCmsAiFeatureError("run_not_found");
  if (run.initiatedBy !== actor.id) {
    throw new KnowledgeCmsAiFeatureError("wrong_actor");
  }
  if (run.status === "applied") {
    if (run.appliedRecordId && run.appliedRecordRevision) {
      return { id: run.appliedRecordId, revision: run.appliedRecordRevision };
    }
    throw new KnowledgeCmsAiFeatureError("already_applied");
  }
  if (run.status !== "pending" || !run.proposal.draft) {
    throw new KnowledgeCmsAiFeatureError("proposal_not_applyable");
  }

  const repository = dependencies.repository ?? createKnowledgeCmsRepository();
  const now = dependencies.now ?? (() => new Date());
  const workflow = new KnowledgeCmsWorkflow(repository, {
    now,
    ...(run.proposedRecordId ? { idFactory: () => run.proposedRecordId! } : {}),
  });
  let result: KnowledgeCmsArticle;
  if (run.mode === "improve_article") {
    const current = asArticle(
      await repository.get("article", run.targetRecordId ?? ""),
    );
    if (!current || current.status !== "draft") {
      throw new KnowledgeCmsAiFeatureError("target_not_draft");
    }
    result = (await workflow.update(
      "article",
      current.id,
      articleInput(run, current),
      run.targetRevision ?? 0,
      actor,
      { note: `Applied private AI copilot proposal ${run.id}.` },
    )) as KnowledgeCmsArticle;
  } else if (run.mode === "new_article") {
    if (!run.proposedRecordId) {
      throw new KnowledgeCmsAiFeatureError("proposal_not_applyable");
    }
    const existing = asArticle(
      await repository.get("article", run.proposedRecordId),
    );
    result =
      existing ??
      ((await workflow.create(articleInput(run), actor, {
        note: `Created from private AI copilot proposal ${run.id}.`,
      })) as KnowledgeCmsArticle);
  } else {
    throw new KnowledgeCmsAiFeatureError("proposal_not_applyable");
  }

  await runStore.markApplied(run.id, actor.id, {
    recordId: result.id,
    revision: result.audit.revision,
    appliedAt: validNow(now).toISOString(),
  });
  return { id: result.id, revision: result.audit.revision };
}

export async function getKnowledgeCmsAiRun(
  id: string,
  dependencies: Pick<KnowledgeCmsAiDalDependencies, "runStore"> = {},
): Promise<KnowledgeCmsAiRun | undefined> {
  assertEnabled();
  const actor = await requireKnowledgeCmsActor();
  assertAuthorized(actor);
  const run = await (
    dependencies.runStore ?? new FirestoreKnowledgeCmsAiRunStore()
  ).get(id);
  return run?.initiatedBy === actor.id ? run : undefined;
}
