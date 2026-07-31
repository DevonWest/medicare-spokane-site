export const KNOWLEDGE_CMS_SCHEMA_VERSION = 1 as const;

export const KNOWLEDGE_CMS_COLLECTIONS = {
  article: "knowledge_articles",
  topic: "knowledge_topics",
  faq: "knowledge_faqs",
  articleRenderings: "knowledge_cms_article_renderings",
  search: "knowledge_search_documents",
  slugs: "knowledge_cms_slugs",
  canonicalPaths: "knowledge_cms_canonical_paths",
  audit: "knowledge_cms_audit_events",
} as const;

export const KNOWLEDGE_CMS_MAX_SOURCE_AGE_DAYS = 180;
export const KNOWLEDGE_CMS_MAX_REVIEW_AGE_DAYS = 365;

export type KnowledgeCmsRecordKind = "article" | "topic" | "faq";
export type KnowledgeCmsStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "published"
  | "archived";

export type KnowledgeCmsRole =
  | "author"
  | "editor"
  | "reviewer"
  | "publisher"
  | "admin";

export type KnowledgeCmsAction =
  | "create"
  | "read"
  | "preview_migration"
  | "execute_article_migration"
  | "execute_supporting_migration"
  | "execute_article_rendering"
  | "preview_shadow_rendering"
  | "update"
  | "submit_for_review"
  | "approve"
  | "request_changes"
  | "publish"
  | "unpublish"
  | "archive"
  | "restore";

export interface KnowledgeCmsActor {
  id: string;
  roles: KnowledgeCmsRole[];
  agentSlug?: string;
}

export interface KnowledgeCmsRelationships {
  articleIds: string[];
  topicIds: string[];
  faqIds: string[];
  citySlugs: string[];
  agentSlugs: string[];
  carrierNames: string[];
  existingPaths: string[];
}

export type KnowledgeCmsSourceKind = "official" | "first_party";

export interface KnowledgeCmsSource {
  id: string;
  kind: KnowledgeCmsSourceKind;
  title: string;
  publisher: string;
  url: string;
  checkedAt: string;
  reviewDueAt: string;
}

export interface KnowledgeCmsDiscoverability {
  pageTitle?: string;
  description?: string;
  canonicalPath?: string;
  indexing: "blocked" | "eligible";
}

export interface KnowledgeCmsReview {
  reviewerAgentSlug: string;
  reviewerVerificationId: string;
  reviewedBy?: string;
  reviewedAt: string;
  reviewDueAt: string;
  decisionNote?: string;
}

export interface KnowledgeCmsChangeRequest {
  requestedByAgentSlug: string;
  reviewerVerificationId: string;
  requestedAt: string;
  feedback: string;
}

export interface KnowledgeCmsPublication {
  publishedAt: string;
  publishedBy: string;
}

export interface KnowledgeCmsAuditFields {
  revision: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

interface KnowledgeCmsBaseRecord {
  schemaVersion: typeof KNOWLEDGE_CMS_SCHEMA_VERSION;
  id: string;
  kind: KnowledgeCmsRecordKind;
  slug: string;
  status: KnowledgeCmsStatus;
  ownerId: string;
  searchTerms: string[];
  relationships: KnowledgeCmsRelationships;
  sources: KnowledgeCmsSource[];
  discoverability: KnowledgeCmsDiscoverability;
  changeRequest?: KnowledgeCmsChangeRequest;
  review?: KnowledgeCmsReview;
  publication?: KnowledgeCmsPublication;
  audit: KnowledgeCmsAuditFields;
}

export interface KnowledgeCmsArticle extends KnowledgeCmsBaseRecord {
  kind: "article";
  title: string;
  summary: string;
  body: string;
  bodyFormat: "markdown";
}

export interface KnowledgeCmsTopic extends KnowledgeCmsBaseRecord {
  kind: "topic";
  title: string;
  description: string;
  parentTopicId?: string;
  order: number;
}

export interface KnowledgeCmsFaq extends KnowledgeCmsBaseRecord {
  kind: "faq";
  question: string;
  answer: string;
  categoryId: string;
  factIds: string[];
  schemaEligible: boolean;
}

export type KnowledgeCmsRecord =
  | KnowledgeCmsArticle
  | KnowledgeCmsTopic
  | KnowledgeCmsFaq;

interface KnowledgeCmsCommonInput {
  slug?: string;
  searchTerms?: string[];
  relationships?: Partial<KnowledgeCmsRelationships>;
  sources?: KnowledgeCmsSource[];
  discoverability?: Omit<KnowledgeCmsDiscoverability, "indexing">;
}

export interface KnowledgeCmsArticleInput extends KnowledgeCmsCommonInput {
  kind: "article";
  title: string;
  summary: string;
  body: string;
}

export interface KnowledgeCmsTopicInput extends KnowledgeCmsCommonInput {
  kind: "topic";
  title: string;
  description: string;
  parentTopicId?: string;
  order?: number;
}

export interface KnowledgeCmsFaqInput extends KnowledgeCmsCommonInput {
  kind: "faq";
  question: string;
  answer: string;
  categoryId: string;
  factIds?: string[];
  schemaEligible?: boolean;
}

export type KnowledgeCmsCreateInput =
  | KnowledgeCmsArticleInput
  | KnowledgeCmsTopicInput
  | KnowledgeCmsFaqInput;

export type KnowledgeCmsUpdateInput = Partial<
  Omit<KnowledgeCmsArticleInput, "kind">
> &
  Partial<Omit<KnowledgeCmsTopicInput, "kind">> &
  Partial<Omit<KnowledgeCmsFaqInput, "kind">> & {
    kind: KnowledgeCmsRecordKind;
  };

export interface KnowledgeCmsSearchDocument {
  id: string;
  recordId: string;
  kind: KnowledgeCmsRecordKind;
  slug: string;
  title: string;
  summary: string;
  text: string;
  searchTerms: string[];
  topicIds: string[];
  citySlugs: string[];
  agentSlugs: string[];
  carrierNames: string[];
  sourceIds: string[];
  canonicalPath?: string;
  indexing: KnowledgeCmsDiscoverability["indexing"];
  updatedAt: string;
  publishedAt: string;
}

export interface KnowledgeCmsAuthorizationDecision {
  allowed: boolean;
  reason:
    | "allowed"
    | "authentication_required"
    | "role_required"
    | "owner_required"
    | "self_review_forbidden"
    | "reviewer_publisher_separation_required"
    | "status_not_editable";
}

export class KnowledgeCmsValidationError extends Error {
  readonly code = "knowledge_cms_validation";

  constructor(readonly errors: string[]) {
    super(errors.join(" "));
    this.name = "KnowledgeCmsValidationError";
  }
}

export class KnowledgeCmsAuthorizationError extends Error {
  readonly code = "knowledge_cms_forbidden";

  constructor(
    readonly action: KnowledgeCmsAction,
    readonly reason: KnowledgeCmsAuthorizationDecision["reason"],
  ) {
    super(`Knowledge CMS action "${action}" is not allowed (${reason}).`);
    this.name = "KnowledgeCmsAuthorizationError";
  }
}

const recordKinds = new Set<KnowledgeCmsRecordKind>([
  "article",
  "topic",
  "faq",
]);
const recordStatuses = new Set<KnowledgeCmsStatus>([
  "draft",
  "in_review",
  "approved",
  "published",
  "archived",
]);
const actorRoles = new Set<KnowledgeCmsRole>([
  "author",
  "editor",
  "reviewer",
  "publisher",
  "admin",
]);
const sourceKinds = new Set<KnowledgeCmsSourceKind>([
  "official",
  "first_party",
]);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const identifierPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
const sitePathPattern = /^\/(?!\/)[A-Za-z0-9/_-]*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown, maxLength = 10_000): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maxLength
  );
}

function isIsoInstant(value: unknown): value is string {
  if (typeof value !== "string" || !value.includes("T")) {
    return false;
  }

  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

function isHttpsUrl(value: unknown): value is string {
  if (!isNonEmptyString(value, 2_000)) {
    return false;
  }

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isSitePath(value: unknown): value is string {
  return (
    isNonEmptyString(value, 500) &&
    sitePathPattern.test(value) &&
    !value.includes("..")
  );
}

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function addUtcDays(value: Date, days: number): Date {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function isDateOnly(value: unknown): value is string {
  if (typeof value !== "string" || !dateOnlyPattern.test(value)) {
    return false;
  }

  const parsed = parseDateOnly(value);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function getUtcDateOnly(value: string | Date): string {
  const parsed = value instanceof Date ? value : new Date(value);
  return parsed.toISOString().slice(0, 10);
}

function getStringArrayErrors(
  value: unknown,
  field: string,
  options: { path?: boolean; max?: number } = {},
): string[] {
  if (!Array.isArray(value)) {
    return [`${field} must be an array.`];
  }

  const errors: string[] = [];
  const normalized = new Set<string>();
  const max = options.max ?? 100;

  if (value.length > max) {
    errors.push(`${field} cannot contain more than ${max} values.`);
  }

  for (const item of value) {
    if (!isNonEmptyString(item, 500)) {
      errors.push(`${field} contains an invalid value.`);
      continue;
    }

    const trimmed = item.trim();
    if (options.path && !isSitePath(trimmed)) {
      errors.push(`${field} contains an invalid site path.`);
    }

    if (normalized.has(trimmed)) {
      errors.push(`${field} contains a duplicate value: ${trimmed}.`);
    }
    normalized.add(trimmed);
  }

  return errors;
}

function validateRelationships(value: unknown): string[] {
  if (!isRecord(value)) {
    return ["relationships must be an object."];
  }

  return [
    ...getStringArrayErrors(value.articleIds, "relationships.articleIds"),
    ...getStringArrayErrors(value.topicIds, "relationships.topicIds"),
    ...getStringArrayErrors(value.faqIds, "relationships.faqIds"),
    ...getStringArrayErrors(value.citySlugs, "relationships.citySlugs"),
    ...getStringArrayErrors(value.agentSlugs, "relationships.agentSlugs"),
    ...getStringArrayErrors(
      value.carrierNames,
      "relationships.carrierNames",
    ),
    ...getStringArrayErrors(value.existingPaths, "relationships.existingPaths", {
      path: true,
    }),
  ];
}

function validateSources(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return ["sources must be an array."];
  }

  const errors: string[] = [];
  const ids = new Set<string>();

  if (value.length > 50) {
    errors.push("sources cannot contain more than 50 values.");
  }

  for (const [index, candidate] of value.entries()) {
    const field = `sources[${index}]`;
    if (!isRecord(candidate)) {
      errors.push(`${field} must be an object.`);
      continue;
    }

    if (
      !isNonEmptyString(candidate.id, 200) ||
      !identifierPattern.test(candidate.id)
    ) {
      errors.push(`${field}.id is invalid.`);
    } else if (ids.has(candidate.id)) {
      errors.push(`${field}.id duplicates source ${candidate.id}.`);
    } else {
      ids.add(candidate.id);
    }

    if (
      typeof candidate.kind !== "string" ||
      !sourceKinds.has(candidate.kind as KnowledgeCmsSourceKind)
    ) {
      errors.push(`${field}.kind is invalid.`);
    }

    if (!isNonEmptyString(candidate.title, 500)) {
      errors.push(`${field}.title is required.`);
    }
    if (!isNonEmptyString(candidate.publisher, 500)) {
      errors.push(`${field}.publisher is required.`);
    }
    if (!isHttpsUrl(candidate.url)) {
      errors.push(`${field}.url must be an HTTPS URL.`);
    }
    if (!isDateOnly(candidate.checkedAt)) {
      errors.push(`${field}.checkedAt must be a valid date.`);
    }
    if (!isDateOnly(candidate.reviewDueAt)) {
      errors.push(`${field}.reviewDueAt must be a valid date.`);
    }
    if (
      isDateOnly(candidate.checkedAt) &&
      isDateOnly(candidate.reviewDueAt) &&
      parseDateOnly(candidate.reviewDueAt).getTime() <
        parseDateOnly(candidate.checkedAt).getTime()
    ) {
      errors.push(`${field}.reviewDueAt cannot precede checkedAt.`);
    }
    if (
      isDateOnly(candidate.checkedAt) &&
      isDateOnly(candidate.reviewDueAt) &&
      parseDateOnly(candidate.reviewDueAt).getTime() >
        addUtcDays(
          parseDateOnly(candidate.checkedAt),
          KNOWLEDGE_CMS_MAX_SOURCE_AGE_DAYS,
        ).getTime()
    ) {
      errors.push(
        `${field}.reviewDueAt cannot be more than ${KNOWLEDGE_CMS_MAX_SOURCE_AGE_DAYS} days after checkedAt.`,
      );
    }
  }

  return errors;
}

function validateDiscoverability(value: unknown): string[] {
  if (!isRecord(value)) {
    return ["discoverability must be an object."];
  }

  const errors: string[] = [];
  if (value.indexing !== "blocked" && value.indexing !== "eligible") {
    errors.push("discoverability.indexing is invalid.");
  }
  if (
    value.pageTitle !== undefined &&
    !isNonEmptyString(value.pageTitle, 200)
  ) {
    errors.push("discoverability.pageTitle is invalid.");
  }
  if (
    value.description !== undefined &&
    !isNonEmptyString(value.description, 500)
  ) {
    errors.push("discoverability.description is invalid.");
  }
  if (
    value.canonicalPath !== undefined &&
    !isSitePath(value.canonicalPath)
  ) {
    errors.push("discoverability.canonicalPath must be a valid site path.");
  }
  return errors;
}

function validateReview(value: unknown): string[] {
  if (!isRecord(value)) {
    return ["review must be an object."];
  }

  const errors: string[] = [];
  if (
    !isNonEmptyString(value.reviewerAgentSlug, 200) ||
    !slugPattern.test(value.reviewerAgentSlug)
  ) {
    errors.push("review.reviewerAgentSlug is invalid.");
  }
  if (
    !isNonEmptyString(value.reviewerVerificationId, 200) ||
    !identifierPattern.test(value.reviewerVerificationId)
  ) {
    errors.push("review.reviewerVerificationId is invalid.");
  }
  if (
    value.reviewedBy !== undefined &&
    (!isNonEmptyString(value.reviewedBy, 200) ||
      !identifierPattern.test(value.reviewedBy))
  ) {
    errors.push("review.reviewedBy is invalid.");
  }
  if (!isIsoInstant(value.reviewedAt)) {
    errors.push("review.reviewedAt must be an ISO timestamp.");
  }
  if (!isDateOnly(value.reviewDueAt)) {
    errors.push("review.reviewDueAt must be a valid date.");
  }
  if (
    value.decisionNote !== undefined &&
    !isNonEmptyString(value.decisionNote, 2_000)
  ) {
    errors.push("review.decisionNote is invalid.");
  }
  if (
    isIsoInstant(value.reviewedAt) &&
    isDateOnly(value.reviewDueAt) &&
    parseDateOnly(value.reviewDueAt).getTime() <
      parseDateOnly(getUtcDateOnly(value.reviewedAt)).getTime()
  ) {
    errors.push("review.reviewDueAt cannot precede reviewedAt.");
  }
  if (
    isIsoInstant(value.reviewedAt) &&
    isDateOnly(value.reviewDueAt) &&
    parseDateOnly(value.reviewDueAt).getTime() >
      addUtcDays(
        parseDateOnly(getUtcDateOnly(value.reviewedAt)),
        KNOWLEDGE_CMS_MAX_REVIEW_AGE_DAYS,
      ).getTime()
  ) {
    errors.push(
      `review.reviewDueAt cannot be more than ${KNOWLEDGE_CMS_MAX_REVIEW_AGE_DAYS} days after reviewedAt.`,
    );
  }
  return errors;
}

function validateChangeRequest(value: unknown): string[] {
  if (!isRecord(value)) {
    return ["changeRequest must be an object."];
  }

  const errors: string[] = [];
  if (
    !isNonEmptyString(value.requestedByAgentSlug, 200) ||
    !slugPattern.test(value.requestedByAgentSlug)
  ) {
    errors.push("changeRequest.requestedByAgentSlug is invalid.");
  }
  if (
    !isNonEmptyString(value.reviewerVerificationId, 200) ||
    !identifierPattern.test(value.reviewerVerificationId)
  ) {
    errors.push("changeRequest.reviewerVerificationId is invalid.");
  }
  if (!isIsoInstant(value.requestedAt)) {
    errors.push("changeRequest.requestedAt must be an ISO timestamp.");
  }
  if (!isNonEmptyString(value.feedback, 2_000)) {
    errors.push("changeRequest.feedback is required.");
  }
  return errors;
}

function validatePublication(value: unknown): string[] {
  if (!isRecord(value)) {
    return ["publication must be an object."];
  }

  const errors: string[] = [];
  if (!isIsoInstant(value.publishedAt)) {
    errors.push("publication.publishedAt must be an ISO timestamp.");
  }
  if (
    !isNonEmptyString(value.publishedBy, 200) ||
    !identifierPattern.test(value.publishedBy)
  ) {
    errors.push("publication.publishedBy is invalid.");
  }
  return errors;
}

function validateAudit(value: unknown): string[] {
  if (!isRecord(value)) {
    return ["audit must be an object."];
  }

  const errors: string[] = [];
  if (
    typeof value.revision !== "number" ||
    !Number.isSafeInteger(value.revision) ||
    value.revision < 1
  ) {
    errors.push("audit.revision must be a positive integer.");
  }
  if (!isIsoInstant(value.createdAt)) {
    errors.push("audit.createdAt must be an ISO timestamp.");
  }
  if (!isIsoInstant(value.updatedAt)) {
    errors.push("audit.updatedAt must be an ISO timestamp.");
  }
  if (
    !isNonEmptyString(value.createdBy, 200) ||
    !identifierPattern.test(value.createdBy)
  ) {
    errors.push("audit.createdBy is invalid.");
  }
  if (
    !isNonEmptyString(value.updatedBy, 200) ||
    !identifierPattern.test(value.updatedBy)
  ) {
    errors.push("audit.updatedBy is invalid.");
  }
  if (
    isIsoInstant(value.createdAt) &&
    isIsoInstant(value.updatedAt) &&
    Date.parse(value.updatedAt) < Date.parse(value.createdAt)
  ) {
    errors.push("audit.updatedAt cannot precede audit.createdAt.");
  }
  return errors;
}

function validateBaseRecord(value: Record<string, unknown>): string[] {
  const errors: string[] = [];

  if (value.schemaVersion !== KNOWLEDGE_CMS_SCHEMA_VERSION) {
    errors.push(
      `schemaVersion must equal ${KNOWLEDGE_CMS_SCHEMA_VERSION}.`,
    );
  }
  if (
    !isNonEmptyString(value.id, 200) ||
    !identifierPattern.test(value.id)
  ) {
    errors.push("id is invalid.");
  }
  if (
    typeof value.kind !== "string" ||
    !recordKinds.has(value.kind as KnowledgeCmsRecordKind)
  ) {
    errors.push("kind is invalid.");
  }
  if (
    !isNonEmptyString(value.slug, 200) ||
    !slugPattern.test(value.slug)
  ) {
    errors.push("slug is invalid.");
  }
  if (
    typeof value.status !== "string" ||
    !recordStatuses.has(value.status as KnowledgeCmsStatus)
  ) {
    errors.push("status is invalid.");
  }
  if (
    !isNonEmptyString(value.ownerId, 200) ||
    !identifierPattern.test(value.ownerId)
  ) {
    errors.push("ownerId is invalid.");
  }

  errors.push(
    ...getStringArrayErrors(value.searchTerms, "searchTerms"),
    ...validateRelationships(value.relationships),
    ...validateSources(value.sources),
    ...validateDiscoverability(value.discoverability),
    ...validateAudit(value.audit),
  );

  if (value.review !== undefined) {
    errors.push(...validateReview(value.review));
  }
  if (value.changeRequest !== undefined) {
    errors.push(...validateChangeRequest(value.changeRequest));
  }
  if (value.publication !== undefined) {
    errors.push(...validatePublication(value.publication));
  }

  if (
    (value.status === "approved" || value.status === "published") &&
    value.review === undefined
  ) {
    errors.push(`${value.status} records require review metadata.`);
  }
  if (value.status === "published" && value.publication === undefined) {
    errors.push("published records require publication metadata.");
  }
  if (
    value.changeRequest !== undefined &&
    value.status !== "draft" &&
    value.status !== "archived"
  ) {
    errors.push(
      "Only draft or archived records may retain an active change request.",
    );
  }
  if (
    value.status !== "published" &&
    isRecord(value.discoverability) &&
    value.discoverability.indexing === "eligible"
  ) {
    errors.push("only published records may be eligible for indexing.");
  }
  if (
    isRecord(value.discoverability) &&
    value.discoverability.indexing === "eligible" &&
    !isNonEmptyString(value.discoverability.canonicalPath, 500)
  ) {
    errors.push("Indexing eligibility requires a canonical path.");
  }

  return errors;
}

export function validateKnowledgeCmsRecord(value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Knowledge CMS record must be an object."];
  }

  const errors = validateBaseRecord(value);

  if (value.kind === "article") {
    if (!isNonEmptyString(value.title, 300)) {
      errors.push("article.title is required.");
    }
    if (!isNonEmptyString(value.summary, 1_000)) {
      errors.push("article.summary is required.");
    }
    if (!isNonEmptyString(value.body, 200_000)) {
      errors.push("article.body is required.");
    }
    if (value.bodyFormat !== "markdown") {
      errors.push('article.bodyFormat must equal "markdown".');
    }
  } else if (value.kind === "topic") {
    if (!isNonEmptyString(value.title, 300)) {
      errors.push("topic.title is required.");
    }
    if (!isNonEmptyString(value.description, 2_000)) {
      errors.push("topic.description is required.");
    }
    if (
      value.parentTopicId !== undefined &&
      (!isNonEmptyString(value.parentTopicId, 200) ||
        !identifierPattern.test(value.parentTopicId))
    ) {
      errors.push("topic.parentTopicId is invalid.");
    }
    if (
      typeof value.order !== "number" ||
      !Number.isSafeInteger(value.order) ||
      value.order < 0
    ) {
      errors.push("topic.order must be a non-negative integer.");
    }
  } else if (value.kind === "faq") {
    if (!isNonEmptyString(value.question, 500)) {
      errors.push("faq.question is required.");
    }
    if (!isNonEmptyString(value.answer, 10_000)) {
      errors.push("faq.answer is required.");
    }
    if (
      !isNonEmptyString(value.categoryId, 200) ||
      !identifierPattern.test(value.categoryId)
    ) {
      errors.push("faq.categoryId is invalid.");
    }
    errors.push(...getStringArrayErrors(value.factIds, "faq.factIds"));
    if (typeof value.schemaEligible !== "boolean") {
      errors.push("faq.schemaEligible must be a boolean.");
    }
  }

  return errors;
}

export function cloneKnowledgeCmsRecord(
  record: KnowledgeCmsRecord,
): KnowledgeCmsRecord {
  return JSON.parse(JSON.stringify(record)) as KnowledgeCmsRecord;
}

export function parseKnowledgeCmsRecord(value: unknown): KnowledgeCmsRecord {
  const errors = validateKnowledgeCmsRecord(value);
  if (errors.length > 0) {
    throw new KnowledgeCmsValidationError(errors);
  }
  return cloneKnowledgeCmsRecord(value as KnowledgeCmsRecord);
}

export function generateKnowledgeCmsSlug(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[’']/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  if (!slug || !slugPattern.test(slug) || slug.length > 200) {
    throw new KnowledgeCmsValidationError([
      "A valid slug could not be generated.",
    ]);
  }

  return slug;
}

export function createEmptyKnowledgeCmsRelationships(): KnowledgeCmsRelationships {
  return {
    articleIds: [],
    topicIds: [],
    faqIds: [],
    citySlugs: [],
    agentSlugs: [],
    carrierNames: [],
    existingPaths: [],
  };
}

function uniqueTrimmed(values: string[] | undefined): string[] {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];
}

export function normalizeKnowledgeCmsRelationships(
  value: Partial<KnowledgeCmsRelationships> | undefined,
): KnowledgeCmsRelationships {
  return {
    articleIds: uniqueTrimmed(value?.articleIds),
    topicIds: uniqueTrimmed(value?.topicIds),
    faqIds: uniqueTrimmed(value?.faqIds),
    citySlugs: uniqueTrimmed(value?.citySlugs),
    agentSlugs: uniqueTrimmed(value?.agentSlugs),
    carrierNames: uniqueTrimmed(value?.carrierNames),
    existingPaths: uniqueTrimmed(value?.existingPaths),
  };
}

export function isKnowledgeCmsSourceExpired(
  source: KnowledgeCmsSource,
  asOf: string | Date = new Date(),
): boolean {
  if (!isDateOnly(source.reviewDueAt)) {
    return true;
  }

  return (
    parseDateOnly(getUtcDateOnly(asOf)).getTime() >
    parseDateOnly(source.reviewDueAt).getTime()
  );
}

export function isKnowledgeCmsReviewExpired(
  review: KnowledgeCmsReview,
  asOf: string | Date = new Date(),
): boolean {
  if (!isDateOnly(review.reviewDueAt)) {
    return true;
  }

  return (
    parseDateOnly(getUtcDateOnly(asOf)).getTime() >
    parseDateOnly(review.reviewDueAt).getTime()
  );
}

export function resolveKnowledgeCmsApprovalDueAt(
  reviewedAt: Date,
  reviewerVerificationValidThrough: string,
  sources: ReadonlyArray<Pick<KnowledgeCmsSource, "reviewDueAt">>,
): string {
  if (
    Number.isNaN(reviewedAt.getTime()) ||
    !isDateOnly(reviewerVerificationValidThrough) ||
    sources.some((source) => !isDateOnly(source.reviewDueAt))
  ) {
    throw new KnowledgeCmsValidationError([
      "Approval requires valid reviewer and source review dates.",
    ]);
  }

  const reviewedOn = getUtcDateOnly(reviewedAt);
  const policyMaximum = addUtcDays(
    parseDateOnly(reviewedOn),
    KNOWLEDGE_CMS_MAX_REVIEW_AGE_DAYS,
  )
    .toISOString()
    .slice(0, 10);
  const reviewDueAt = [
    policyMaximum,
    reviewerVerificationValidThrough,
    ...sources.map((source) => source.reviewDueAt),
  ].sort()[0];

  if (reviewDueAt < reviewedOn) {
    throw new KnowledgeCmsValidationError([
      "Approval cannot use an expired reviewer or source review window.",
    ]);
  }

  return reviewDueAt;
}

export function validateKnowledgeCmsSubmissionReadiness(
  record: KnowledgeCmsRecord,
  asOf: string | Date = new Date(),
): string[] {
  const errors = validateKnowledgeCmsRecord(record);

  if (
    (record.kind === "article" || record.kind === "faq") &&
    record.sources.length === 0
  ) {
    errors.push(`${record.kind} records require at least one source.`);
  }

  for (const source of record.sources) {
    if (
      isDateOnly(source.checkedAt) &&
      parseDateOnly(source.checkedAt).getTime() >
        parseDateOnly(getUtcDateOnly(asOf)).getTime()
    ) {
      errors.push(`Source ${source.id} has a future checkedAt date.`);
    }
    if (isKnowledgeCmsSourceExpired(source, asOf)) {
      errors.push(`Source ${source.id} is due for review.`);
    }
  }

  return [...new Set(errors)];
}

export function validateKnowledgeCmsPublishReadiness(
  record: KnowledgeCmsRecord,
  asOf: string | Date = new Date(),
): string[] {
  const errors = validateKnowledgeCmsSubmissionReadiness(record, asOf);

  if (record.status !== "approved" && record.status !== "published") {
    errors.push("Only approved records are ready to publish.");
  }
  if (!record.review) {
    errors.push("Publication requires verified review metadata.");
  } else {
    if (!record.review.reviewedBy) {
      errors.push(
        "Publication requires a server-recorded reviewer user identity. Request a new approval.",
      );
    }
    if (isKnowledgeCmsReviewExpired(record.review, asOf)) {
      errors.push("The editorial review is due for renewal.");
    }
  }
  if (
    record.discoverability.indexing === "eligible" &&
    !record.discoverability.canonicalPath
  ) {
    errors.push("Indexing eligibility requires a canonical path.");
  }

  return [...new Set(errors)];
}

function recordTitle(record: KnowledgeCmsRecord): string {
  return record.kind === "faq" ? record.question : record.title;
}

function recordSummary(record: KnowledgeCmsRecord): string {
  if (record.kind === "article") {
    return record.summary;
  }
  if (record.kind === "topic") {
    return record.description;
  }
  return record.answer;
}

function recordText(record: KnowledgeCmsRecord): string {
  if (record.kind === "article") {
    return record.body;
  }
  if (record.kind === "topic") {
    return record.description;
  }
  return record.answer;
}

export function buildKnowledgeCmsSearchDocument(
  record: KnowledgeCmsRecord,
): KnowledgeCmsSearchDocument | undefined {
  if (record.status !== "published" || !record.publication) {
    return undefined;
  }

  return {
    id: `${record.kind}:${record.id}`,
    recordId: record.id,
    kind: record.kind,
    slug: record.slug,
    title: recordTitle(record),
    summary: recordSummary(record),
    text: recordText(record),
    searchTerms: [...record.searchTerms],
    topicIds: [...record.relationships.topicIds],
    citySlugs: [...record.relationships.citySlugs],
    agentSlugs: [...record.relationships.agentSlugs],
    carrierNames: [...record.relationships.carrierNames],
    sourceIds: record.sources.map((source) => source.id),
    canonicalPath: record.discoverability.canonicalPath,
    indexing: record.discoverability.indexing,
    updatedAt: record.audit.updatedAt,
    publishedAt: record.publication.publishedAt,
  };
}

function hasAnyRole(
  actor: KnowledgeCmsActor,
  roles: KnowledgeCmsRole[],
): boolean {
  return actor.roles.some((role) => roles.includes(role));
}

export function getKnowledgeCmsAuthorizationDecision(
  actor: KnowledgeCmsActor | undefined,
  action: KnowledgeCmsAction,
  record?: KnowledgeCmsRecord,
): KnowledgeCmsAuthorizationDecision {
  if (
    !actor ||
    !identifierPattern.test(actor.id) ||
    actor.roles.length === 0 ||
    actor.roles.some((role) => !actorRoles.has(role))
  ) {
    return { allowed: false, reason: "authentication_required" };
  }

  if (action === "read") {
    return { allowed: true, reason: "allowed" };
  }

  if (
    action === "preview_migration" ||
    action === "execute_article_migration" ||
    action === "execute_supporting_migration" ||
    action === "execute_article_rendering" ||
    action === "preview_shadow_rendering"
  ) {
    return hasAnyRole(actor, ["publisher", "admin"])
      ? { allowed: true, reason: "allowed" }
      : { allowed: false, reason: "role_required" };
  }

  if (action === "approve" || action === "request_changes") {
    if (!hasAnyRole(actor, ["reviewer", "admin"])) {
      return { allowed: false, reason: "role_required" };
    }
    if (record?.ownerId === actor.id) {
      return { allowed: false, reason: "self_review_forbidden" };
    }
    return { allowed: true, reason: "allowed" };
  }

  if (action === "publish") {
    if (!hasAnyRole(actor, ["publisher", "admin"])) {
      return { allowed: false, reason: "role_required" };
    }
    if (
      record?.review &&
      (record.review.reviewedBy === actor.id ||
        (actor.agentSlug !== undefined &&
          record.review.reviewerAgentSlug === actor.agentSlug))
    ) {
      return {
        allowed: false,
        reason: "reviewer_publisher_separation_required",
      };
    }
    return { allowed: true, reason: "allowed" };
  }

  if (
    action === "unpublish" ||
    action === "archive" ||
    action === "restore"
  ) {
    return hasAnyRole(actor, ["publisher", "admin"])
      ? { allowed: true, reason: "allowed" }
      : { allowed: false, reason: "role_required" };
  }

  if (action === "create") {
    return hasAnyRole(actor, ["author", "editor", "admin"])
      ? { allowed: true, reason: "allowed" }
      : { allowed: false, reason: "role_required" };
  }

  if (action === "update" || action === "submit_for_review") {
    if (record && record.status !== "draft") {
      return { allowed: false, reason: "status_not_editable" };
    }
    if (hasAnyRole(actor, ["editor", "admin"])) {
      return { allowed: true, reason: "allowed" };
    }
    if (!hasAnyRole(actor, ["author"])) {
      return { allowed: false, reason: "role_required" };
    }
    return record?.ownerId === actor.id
      ? { allowed: true, reason: "allowed" }
      : { allowed: false, reason: "owner_required" };
  }

  return { allowed: false, reason: "role_required" };
}

export function assertKnowledgeCmsActionAllowed(
  actor: KnowledgeCmsActor | undefined,
  action: KnowledgeCmsAction,
  record?: KnowledgeCmsRecord,
): void {
  const decision = getKnowledgeCmsAuthorizationDecision(actor, action, record);
  if (!decision.allowed) {
    throw new KnowledgeCmsAuthorizationError(action, decision.reason);
  }
}
