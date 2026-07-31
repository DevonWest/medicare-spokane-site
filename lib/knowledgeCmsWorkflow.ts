import "server-only";

import { randomUUID } from "node:crypto";
import { resolveVerifiedEditorialReviewer } from "./editorial";
import {
  KNOWLEDGE_CMS_SCHEMA_VERSION,
  assertKnowledgeCmsActionAllowed,
  cloneKnowledgeCmsRecord,
  generateKnowledgeCmsSlug,
  normalizeKnowledgeCmsRelationships,
  validateKnowledgeCmsPublishReadiness,
  validateKnowledgeCmsRecord,
  validateKnowledgeCmsSubmissionReadiness,
  KnowledgeCmsValidationError,
  type KnowledgeCmsActor,
  type KnowledgeCmsArticle,
  type KnowledgeCmsChangeRequest,
  type KnowledgeCmsCreateInput,
  type KnowledgeCmsDiscoverability,
  type KnowledgeCmsFaq,
  type KnowledgeCmsRecord,
  type KnowledgeCmsRecordKind,
  type KnowledgeCmsRelationships,
  type KnowledgeCmsReview,
  type KnowledgeCmsSource,
  type KnowledgeCmsTopic,
  type KnowledgeCmsUpdateInput,
} from "./knowledgeCms";
import {
  assertKnowledgeCmsEnabled,
  KnowledgeCmsConflictError,
  KnowledgeCmsNotFoundError,
  type KnowledgeCmsAuditEvent,
  type KnowledgeCmsListQuery,
  type KnowledgeCmsRepository,
} from "./knowledgeCmsRepository";

export type KnowledgeCmsTransitionAction = Exclude<
  KnowledgeCmsAuditEvent,
  | "create"
  | "migration_create_private_draft"
  | "migration_create_private_supporting_draft"
  | "create_private_article_rendering"
  | "create_public_cutover_approval"
  | "update"
>;

export interface KnowledgeCmsTransitionInput {
  action: KnowledgeCmsTransitionAction;
  expectedRevision: number;
  reviewerVerificationId?: string;
  reviewDueAt?: string;
  decisionNote?: string;
  indexing?: KnowledgeCmsDiscoverability["indexing"];
}

export interface KnowledgeCmsWorkflowOptions {
  now?: () => Date;
  idFactory?: () => string;
  reviewerVerifier?: (
    agentSlug: string,
    verificationId: string,
    asOf: Date,
  ) => boolean;
}

export class KnowledgeCmsStateError extends Error {
  readonly code = "knowledge_cms_invalid_state";

  constructor(message: string) {
    super(message);
    this.name = "KnowledgeCmsStateError";
  }
}

export class KnowledgeCmsReviewerVerificationError extends Error {
  readonly code = "knowledge_cms_reviewer_unverified";

  constructor() {
    super(
      "The reviewer must have a current, explicitly verified licensed-agent record.",
    );
    this.name = "KnowledgeCmsReviewerVerificationError";
  }
}

function cleanRequired(value: string): string {
  return value.trim();
}

function cleanOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function uniqueTrimmed(values: string[] | undefined): string[] {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];
}

function normalizeSources(
  sources: KnowledgeCmsSource[] | undefined,
): KnowledgeCmsSource[] {
  return (sources ?? []).map((source) => ({
    id: source.id.trim(),
    kind: source.kind,
    title: source.title.trim(),
    publisher: source.publisher.trim(),
    url: source.url.trim(),
    checkedAt: source.checkedAt.trim(),
    reviewDueAt: source.reviewDueAt.trim(),
  }));
}

function normalizeDiscoverability(
  value: Omit<KnowledgeCmsDiscoverability, "indexing"> | undefined,
  indexing: KnowledgeCmsDiscoverability["indexing"] = "blocked",
): KnowledgeCmsDiscoverability {
  return {
    pageTitle: cleanOptional(value?.pageTitle),
    description: cleanOptional(value?.description),
    canonicalPath: cleanOptional(value?.canonicalPath),
    indexing,
  };
}

function resolveInputTitle(input: KnowledgeCmsCreateInput): string {
  return input.kind === "faq" ? input.question : input.title;
}

function createBaseRecord(
  input: KnowledgeCmsCreateInput,
  actor: KnowledgeCmsActor,
  id: string,
  nowIso: string,
) {
  return {
    schemaVersion: KNOWLEDGE_CMS_SCHEMA_VERSION,
    id,
    kind: input.kind,
    slug: generateKnowledgeCmsSlug(
      cleanOptional(input.slug) ?? resolveInputTitle(input),
    ),
    status: "draft" as const,
    ownerId: actor.id,
    searchTerms: uniqueTrimmed(input.searchTerms),
    relationships: normalizeKnowledgeCmsRelationships(input.relationships),
    sources: normalizeSources(input.sources),
    discoverability: normalizeDiscoverability(input.discoverability),
    audit: {
      revision: 1,
      createdAt: nowIso,
      createdBy: actor.id,
      updatedAt: nowIso,
      updatedBy: actor.id,
    },
  };
}

function createRecord(
  input: KnowledgeCmsCreateInput,
  actor: KnowledgeCmsActor,
  id: string,
  nowIso: string,
): KnowledgeCmsRecord {
  const base = createBaseRecord(input, actor, id, nowIso);

  if (input.kind === "article") {
    return {
      ...base,
      kind: "article",
      title: cleanRequired(input.title),
      summary: cleanRequired(input.summary),
      body: cleanRequired(input.body),
      bodyFormat: "markdown",
    };
  }

  if (input.kind === "topic") {
    return {
      ...base,
      kind: "topic",
      title: cleanRequired(input.title),
      description: cleanRequired(input.description),
      parentTopicId: cleanOptional(input.parentTopicId),
      order: input.order ?? 0,
    };
  }

  return {
    ...base,
    kind: "faq",
    question: cleanRequired(input.question),
    answer: cleanRequired(input.answer),
    categoryId: cleanRequired(input.categoryId),
    factIds: uniqueTrimmed(input.factIds),
    schemaEligible: input.schemaEligible ?? false,
  };
}

function mergeRelationships(
  current: KnowledgeCmsRelationships,
  update: Partial<KnowledgeCmsRelationships> | undefined,
): KnowledgeCmsRelationships {
  if (!update) {
    return normalizeKnowledgeCmsRelationships(current);
  }

  return normalizeKnowledgeCmsRelationships({
    articleIds: update.articleIds ?? current.articleIds,
    topicIds: update.topicIds ?? current.topicIds,
    faqIds: update.faqIds ?? current.faqIds,
    citySlugs: update.citySlugs ?? current.citySlugs,
    agentSlugs: update.agentSlugs ?? current.agentSlugs,
    carrierNames: update.carrierNames ?? current.carrierNames,
    existingPaths: update.existingPaths ?? current.existingPaths,
  });
}

function mergeDiscoverability(
  current: KnowledgeCmsDiscoverability,
  update: Omit<KnowledgeCmsDiscoverability, "indexing"> | undefined,
): KnowledgeCmsDiscoverability {
  if (!update) {
    return { ...current };
  }

  return {
    pageTitle:
      update.pageTitle === undefined
        ? current.pageTitle
        : cleanOptional(update.pageTitle),
    description:
      update.description === undefined
        ? current.description
        : cleanOptional(update.description),
    canonicalPath:
      update.canonicalPath === undefined
        ? current.canonicalPath
        : cleanOptional(update.canonicalPath),
    indexing: current.indexing,
  };
}

function applyCommonUpdate(
  record: KnowledgeCmsRecord,
  update: KnowledgeCmsUpdateInput,
): Pick<
  KnowledgeCmsRecord,
  | "slug"
  | "searchTerms"
  | "relationships"
  | "sources"
  | "discoverability"
> {
  return {
    slug:
      update.slug === undefined
        ? record.slug
        : generateKnowledgeCmsSlug(update.slug),
    searchTerms:
      update.searchTerms === undefined
        ? [...record.searchTerms]
        : uniqueTrimmed(update.searchTerms),
    relationships: mergeRelationships(
      record.relationships,
      update.relationships,
    ),
    sources:
      update.sources === undefined
        ? normalizeSources(record.sources)
        : normalizeSources(update.sources),
    discoverability: mergeDiscoverability(
      record.discoverability,
      update.discoverability,
    ),
  };
}

function updateArticle(
  record: KnowledgeCmsArticle,
  update: KnowledgeCmsUpdateInput,
): KnowledgeCmsArticle {
  return {
    ...record,
    ...applyCommonUpdate(record, update),
    title:
      update.title === undefined ? record.title : cleanRequired(update.title),
    summary:
      update.summary === undefined
        ? record.summary
        : cleanRequired(update.summary),
    body: update.body === undefined ? record.body : cleanRequired(update.body),
  };
}

function updateTopic(
  record: KnowledgeCmsTopic,
  update: KnowledgeCmsUpdateInput,
): KnowledgeCmsTopic {
  return {
    ...record,
    ...applyCommonUpdate(record, update),
    title:
      update.title === undefined ? record.title : cleanRequired(update.title),
    description:
      update.description === undefined
        ? record.description
        : cleanRequired(update.description),
    parentTopicId:
      update.parentTopicId === undefined
        ? record.parentTopicId
        : cleanOptional(update.parentTopicId),
    order: update.order === undefined ? record.order : update.order,
  };
}

function updateFaq(
  record: KnowledgeCmsFaq,
  update: KnowledgeCmsUpdateInput,
): KnowledgeCmsFaq {
  return {
    ...record,
    ...applyCommonUpdate(record, update),
    question:
      update.question === undefined
        ? record.question
        : cleanRequired(update.question),
    answer:
      update.answer === undefined
        ? record.answer
        : cleanRequired(update.answer),
    categoryId:
      update.categoryId === undefined
        ? record.categoryId
        : cleanRequired(update.categoryId),
    factIds:
      update.factIds === undefined
        ? [...record.factIds]
        : uniqueTrimmed(update.factIds),
    schemaEligible:
      update.schemaEligible === undefined
        ? record.schemaEligible
        : update.schemaEligible,
  };
}

function applyUpdate(
  record: KnowledgeCmsRecord,
  update: KnowledgeCmsUpdateInput,
): KnowledgeCmsRecord {
  if (record.kind !== update.kind) {
    throw new KnowledgeCmsStateError(
      `Cannot apply a ${update.kind} update to a ${record.kind} record.`,
    );
  }

  if (record.kind === "article") {
    return updateArticle(record, update);
  }
  if (record.kind === "topic") {
    return updateTopic(record, update);
  }
  return updateFaq(record, update);
}

function applyAudit(
  record: KnowledgeCmsRecord,
  actor: KnowledgeCmsActor,
  nowIso: string,
): KnowledgeCmsRecord {
  return {
    ...record,
    audit: {
      ...record.audit,
      revision: record.audit.revision + 1,
      updatedAt: nowIso,
      updatedBy: actor.id,
    },
  };
}

function assertRevision(
  record: KnowledgeCmsRecord,
  expectedRevision: number,
): void {
  if (record.audit.revision !== expectedRevision) {
    throw new KnowledgeCmsConflictError(
      `Knowledge CMS revision changed (expected ${expectedRevision}, found ${record.audit.revision}).`,
    );
  }
}

function assertStatus(
  record: KnowledgeCmsRecord,
  allowed: KnowledgeCmsRecord["status"][],
  action: KnowledgeCmsTransitionAction,
): void {
  if (!allowed.includes(record.status)) {
    throw new KnowledgeCmsStateError(
      `Cannot ${action} a ${record.status} record.`,
    );
  }
}

function assertValidRecord(record: KnowledgeCmsRecord): void {
  const errors = validateKnowledgeCmsRecord(record);
  if (errors.length > 0) {
    throw new KnowledgeCmsValidationError(errors);
  }
}

function defaultReviewerVerifier(
  agentSlug: string,
  verificationId: string,
  asOf: Date,
): boolean {
  return Boolean(
    resolveVerifiedEditorialReviewer(agentSlug, verificationId, asOf),
  );
}

export class KnowledgeCmsWorkflow {
  private readonly now: () => Date;
  private readonly idFactory: () => string;
  private readonly reviewerVerifier: NonNullable<
    KnowledgeCmsWorkflowOptions["reviewerVerifier"]
  >;

  constructor(
    private readonly repository: KnowledgeCmsRepository,
    options: KnowledgeCmsWorkflowOptions = {},
  ) {
    assertKnowledgeCmsEnabled();
    this.now = options.now ?? (() => new Date());
    this.idFactory = options.idFactory ?? randomUUID;
    this.reviewerVerifier =
      options.reviewerVerifier ?? defaultReviewerVerifier;
  }

  async create(
    input: KnowledgeCmsCreateInput,
    actor: KnowledgeCmsActor,
  ): Promise<KnowledgeCmsRecord> {
    assertKnowledgeCmsActionAllowed(actor, "create");
    const nowIso = this.now().toISOString();
    const record = createRecord(input, actor, this.idFactory(), nowIso);
    assertValidRecord(record);
    await this.repository.save(record, {
      expectedRevision: null,
      event: "create",
      actorId: actor.id,
    });
    return cloneKnowledgeCmsRecord(record);
  }

  async get(
    kind: KnowledgeCmsRecordKind,
    id: string,
    actor: KnowledgeCmsActor,
  ): Promise<KnowledgeCmsRecord | undefined> {
    assertKnowledgeCmsActionAllowed(actor, "read");
    const record = await this.repository.get(kind, id);
    return record ? cloneKnowledgeCmsRecord(record) : undefined;
  }

  async list(
    query: KnowledgeCmsListQuery,
    actor: KnowledgeCmsActor,
  ): Promise<KnowledgeCmsRecord[]> {
    assertKnowledgeCmsActionAllowed(actor, "read");
    return (await this.repository.list(query)).map(cloneKnowledgeCmsRecord);
  }

  async update(
    kind: KnowledgeCmsRecordKind,
    id: string,
    input: KnowledgeCmsUpdateInput,
    expectedRevision: number,
    actor: KnowledgeCmsActor,
  ): Promise<KnowledgeCmsRecord> {
    const current = await this.repository.get(kind, id);
    if (!current) {
      throw new KnowledgeCmsNotFoundError(kind, id);
    }
    assertRevision(current, expectedRevision);
    assertKnowledgeCmsActionAllowed(actor, "update", current);

    const nowIso = this.now().toISOString();
    const next = applyAudit(applyUpdate(current, input), actor, nowIso);
    assertValidRecord(next);
    await this.repository.save(next, {
      expectedRevision,
      event: "update",
      actorId: actor.id,
    });
    return cloneKnowledgeCmsRecord(next);
  }

  async transition(
    kind: KnowledgeCmsRecordKind,
    id: string,
    input: KnowledgeCmsTransitionInput,
    actor: KnowledgeCmsActor,
  ): Promise<KnowledgeCmsRecord> {
    const current = await this.repository.get(kind, id);
    if (!current) {
      throw new KnowledgeCmsNotFoundError(kind, id);
    }
    assertRevision(current, input.expectedRevision);
    assertKnowledgeCmsActionAllowed(actor, input.action, current);

    const now = this.now();
    const nowIso = now.toISOString();
    let next: KnowledgeCmsRecord;

    switch (input.action) {
      case "submit_for_review": {
        assertStatus(current, ["draft"], input.action);
        const errors = validateKnowledgeCmsSubmissionReadiness(current, now);
        if (errors.length > 0) {
          throw new KnowledgeCmsValidationError(errors);
        }
        next = {
          ...current,
          status: "in_review",
          changeRequest: undefined,
        };
        break;
      }
      case "request_changes": {
        assertStatus(current, ["in_review", "approved"], input.action);
        const feedback = cleanOptional(input.decisionNote);
        if (!feedback) {
          throw new KnowledgeCmsValidationError([
            "Request-changes feedback is required.",
          ]);
        }
        const agentSlug = cleanOptional(actor.agentSlug);
        const verificationId = cleanOptional(input.reviewerVerificationId);
        if (
          !agentSlug ||
          !verificationId ||
          !this.reviewerVerifier(agentSlug, verificationId, now)
        ) {
          throw new KnowledgeCmsReviewerVerificationError();
        }
        const changeRequest: KnowledgeCmsChangeRequest = {
          requestedByAgentSlug: agentSlug,
          reviewerVerificationId: verificationId,
          requestedAt: nowIso,
          feedback,
        };
        next = {
          ...current,
          status: "draft",
          changeRequest,
          review: undefined,
          publication: undefined,
          discoverability: {
            ...current.discoverability,
            indexing: "blocked",
          },
        };
        break;
      }
      case "approve": {
        assertStatus(current, ["in_review"], input.action);
        const readinessErrors = validateKnowledgeCmsSubmissionReadiness(
          current,
          now,
        );
        if (readinessErrors.length > 0) {
          throw new KnowledgeCmsValidationError(readinessErrors);
        }
        const agentSlug = cleanOptional(actor.agentSlug);
        const verificationId = cleanOptional(input.reviewerVerificationId);
        const reviewDueAt = cleanOptional(input.reviewDueAt);
        if (
          !agentSlug ||
          !verificationId ||
          !reviewDueAt ||
          !this.reviewerVerifier(agentSlug, verificationId, now)
        ) {
          throw new KnowledgeCmsReviewerVerificationError();
        }
        const decisionNote = cleanOptional(input.decisionNote);
        if (!decisionNote) {
          throw new KnowledgeCmsValidationError([
            "Approval decision note is required.",
          ]);
        }

        const review: KnowledgeCmsReview = {
          reviewerAgentSlug: agentSlug,
          reviewerVerificationId: verificationId,
          reviewedBy: actor.id,
          reviewedAt: nowIso,
          reviewDueAt,
          decisionNote,
        };
        next = { ...current, status: "approved", review };
        break;
      }
      case "publish": {
        assertStatus(current, ["approved"], input.action);
        if (input.indexing !== "blocked" && input.indexing !== "eligible") {
          throw new KnowledgeCmsValidationError([
            "An explicit blocked or eligible indexing decision is required.",
          ]);
        }
        const publicationNote = cleanOptional(input.decisionNote);
        if (!publicationNote) {
          throw new KnowledgeCmsValidationError([
            "Publication decision note is required.",
          ]);
        }
        if (
          !current.review ||
          !this.reviewerVerifier(
            current.review.reviewerAgentSlug,
            current.review.reviewerVerificationId,
            now,
          )
        ) {
          throw new KnowledgeCmsReviewerVerificationError();
        }

        const errors = validateKnowledgeCmsPublishReadiness(current, now);
        if (errors.length > 0) {
          throw new KnowledgeCmsValidationError(errors);
        }
        next = {
          ...current,
          status: "published",
          publication: {
            publishedAt: nowIso,
            publishedBy: actor.id,
          },
          discoverability: {
            ...current.discoverability,
            indexing: input.indexing,
          },
        };
        break;
      }
      case "unpublish": {
        assertStatus(current, ["published"], input.action);
        const unpublishReason = cleanOptional(input.decisionNote);
        if (!unpublishReason) {
          throw new KnowledgeCmsValidationError([
            "Unpublish reason is required.",
          ]);
        }
        next = {
          ...current,
          status: "draft",
          review: undefined,
          publication: undefined,
          discoverability: {
            ...current.discoverability,
            indexing: "blocked",
          },
        };
        break;
      }
      case "archive": {
        assertStatus(
          current,
          ["draft", "in_review", "approved", "published"],
          input.action,
        );
        next = {
          ...current,
          status: "archived",
          publication: undefined,
          discoverability: {
            ...current.discoverability,
            indexing: "blocked",
          },
        };
        break;
      }
      case "restore": {
        assertStatus(current, ["archived"], input.action);
        next = {
          ...current,
          status: "draft",
          review: undefined,
          publication: undefined,
          discoverability: {
            ...current.discoverability,
            indexing: "blocked",
          },
        };
        break;
      }
    }

    const audited = applyAudit(next, actor, nowIso);
    assertValidRecord(audited);
    await this.repository.save(audited, {
      expectedRevision: input.expectedRevision,
      event: input.action,
      actorId: actor.id,
      note: cleanOptional(input.decisionNote),
    });
    return cloneKnowledgeCmsRecord(audited);
  }
}
