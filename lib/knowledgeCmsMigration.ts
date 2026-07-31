import {
  knowledgeCategories,
  knowledgeEntries,
  knowledgeSources,
  validateKnowledgeCenter,
  type KnowledgeEntry,
  type KnowledgeSource,
} from "./knowledgeCenter";
import {
  getKnowledgeFactSourceIds,
  knowledgeFacts,
  knowledgeFaqs,
  type KnowledgeFact,
  type KnowledgeFaq,
} from "./knowledgeRecords";
import {
  KNOWLEDGE_CMS_MAX_SOURCE_AGE_DAYS,
  generateKnowledgeCmsSlug,
  isKnowledgeCmsSourceExpired,
  normalizeKnowledgeCmsRelationships,
  type KnowledgeCmsRecord,
  type KnowledgeCmsRecordKind,
  type KnowledgeCmsRelationships,
  type KnowledgeCmsSource,
} from "./knowledgeCms";
import {
  getKnowledgeCmsRouteParity,
  validateKnowledgeCmsRouteParityManifest,
  type KnowledgeCmsRouteParityManifestEntry,
} from "./knowledgeCmsRouteParity";
import { medicareTopics, type Topic } from "./topics";

export const KNOWLEDGE_CMS_MIGRATION_PREVIEW_VERSION = 2 as const;
export const KNOWLEDGE_CMS_MIGRATION_WRITE_COUNT = 0 as const;

const FIRST_PARTY_ABOUT_URL =
  "https://www.medicareinspokane.com/about";
const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

export type KnowledgeCmsMigrationIssueSeverity =
  | "blocker"
  | "warning"
  | "info";

export type KnowledgeCmsMigrationIssueCode =
  | "article_body_representation_blocked"
  | "candidate_canonical_conflict"
  | "candidate_id_conflict"
  | "candidate_slug_conflict"
  | "existing_canonical_conflict"
  | "existing_content_conflict"
  | "existing_id_conflict"
  | "existing_match"
  | "existing_record_requires_content_comparison"
  | "existing_slug_conflict"
  | "content_parity_snapshot_verified"
  | "legacy_review_required"
  | "metadata_parity_verified"
  | "metadata_parity_unverified"
  | "missing_article_relationship"
  | "missing_fact_reference"
  | "missing_faq_relationship"
  | "missing_source"
  | "missing_topic_relationship"
  | "parity_manifest_invalid"
  | "parity_manifest_missing"
  | "source_due_for_review"
  | "static_registry_invalid"
  | "static_fact_reference_preserved"
  | "static_record_not_published"
  | "unsupported_relationship";

export interface KnowledgeCmsMigrationIssue {
  code: KnowledgeCmsMigrationIssueCode;
  severity: KnowledgeCmsMigrationIssueSeverity;
  message: string;
}

export type KnowledgeCmsMigrationOrigin =
  | {
      kind: "resource_entry";
      id: string;
      path: string;
    }
  | {
      kind: "resource_category";
      id: string;
    }
  | {
      kind: "resource_topic";
      id: string;
      path: string;
    }
  | {
      kind: "resource_faq";
      id: string;
      path: string;
    };

interface KnowledgeCmsMigrationTargetBase {
  id: string;
  kind: KnowledgeCmsRecordKind;
  slug: string;
  title: string;
  searchTerms: string[];
  relationships: KnowledgeCmsRelationships;
  sources: KnowledgeCmsSource[];
  canonicalPath?: string;
  status: "draft";
  indexing: "blocked";
}

export interface KnowledgeCmsMigrationArticleTarget
  extends KnowledgeCmsMigrationTargetBase {
  kind: "article";
  summary: string;
  bodyStatus: "missing" | "snapshot_verified";
  pageTitle?: string;
  description?: string;
  routeParity?: KnowledgeCmsRouteParityManifestEntry;
}

export interface KnowledgeCmsMigrationTopicTarget
  extends KnowledgeCmsMigrationTargetBase {
  kind: "topic";
  description: string;
  order: number;
  parentTopicId?: string;
}

export interface KnowledgeCmsMigrationFaqTarget
  extends KnowledgeCmsMigrationTargetBase {
  kind: "faq";
  question: string;
  answer: string;
  categoryId: string;
  factIds: string[];
  schemaEligible: boolean;
}

export type KnowledgeCmsMigrationTarget =
  | KnowledgeCmsMigrationArticleTarget
  | KnowledgeCmsMigrationTopicTarget
  | KnowledgeCmsMigrationFaqTarget;

export type KnowledgeCmsMigrationCandidateState =
  | "ready"
  | "blocked"
  | "already_present";

export interface KnowledgeCmsMigrationCandidate {
  key: string;
  origin: KnowledgeCmsMigrationOrigin;
  target: KnowledgeCmsMigrationTarget;
  state: KnowledgeCmsMigrationCandidateState;
  issues: KnowledgeCmsMigrationIssue[];
}

export interface KnowledgeCmsMigrationKindSummary {
  total: number;
  ready: number;
  blocked: number;
  alreadyPresent: number;
}

export interface KnowledgeCmsMigrationPreview {
  version: typeof KNOWLEDGE_CMS_MIGRATION_PREVIEW_VERSION;
  mode: "read_only";
  asOf: string;
  writeCount: typeof KNOWLEDGE_CMS_MIGRATION_WRITE_COUNT;
  readyToExecute: false;
  summary: {
    total: number;
    ready: number;
    blocked: number;
    alreadyPresent: number;
    blockers: number;
    warnings: number;
    sourceRecords: number;
    articleParity: {
      total: number;
      snapshotsVerified: number;
      metadataVerified: number;
      representationBlocked: number;
    };
    byKind: Record<KnowledgeCmsRecordKind, KnowledgeCmsMigrationKindSummary>;
  };
  issues: KnowledgeCmsMigrationIssue[];
  candidates: KnowledgeCmsMigrationCandidate[];
}

interface MutableMigrationCandidate {
  key: string;
  origin: KnowledgeCmsMigrationOrigin;
  target: KnowledgeCmsMigrationTarget;
  issues: KnowledgeCmsMigrationIssue[];
}

export interface BuildKnowledgeCmsMigrationPreviewOptions {
  asOf?: string | Date;
  existingRecords?: KnowledgeCmsRecord[];
}

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function isValidDateOnly(value: string): boolean {
  if (!dateOnlyPattern.test(value)) {
    return false;
  }
  const parsed = parseDateOnly(value);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function addUtcDays(value: string, days: number): string {
  const parsed = parseDateOnly(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function normalizeAsOf(value: string | Date | undefined): string {
  if (value instanceof Date && Number.isNaN(value.getTime())) {
    throw new Error("Knowledge CMS migration preview requires a valid UTC date.");
  }
  const result =
    value === undefined
      ? new Date().toISOString().slice(0, 10)
      : typeof value === "string"
        ? value
        : value.toISOString().slice(0, 10);

  if (
    !isValidDateOnly(result)
  ) {
    throw new Error("Knowledge CMS migration preview requires a valid UTC date.");
  }

  return result;
}

function unique(values: ReadonlyArray<string | undefined>): string[] {
  return [
    ...new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ];
}

function sameStrings(
  left: ReadonlyArray<string>,
  right: ReadonlyArray<string>,
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function sameStringSet(
  left: ReadonlyArray<string>,
  right: ReadonlyArray<string>,
): boolean {
  return sameStrings([...left].sort(), [...right].sort());
}

function migrationArticleId(id: string): string {
  return `resource-entry--${id}`;
}

function migrationCategoryId(id: string): string {
  return `resource-category--${id}`;
}

function migrationTopicId(slug: string): string {
  return `resource-topic--${slug}`;
}

function migrationFaqId(id: string): string {
  return `resource-faq--${id}`;
}

function slugFromPath(path: string): string {
  const segment = path.split("/").filter(Boolean).at(-1);
  return generateKnowledgeCmsSlug(segment ?? path);
}

function issue(
  code: KnowledgeCmsMigrationIssueCode,
  severity: KnowledgeCmsMigrationIssueSeverity,
  message: string,
): KnowledgeCmsMigrationIssue {
  return { code, severity, message };
}

function addIssue(
  candidate: MutableMigrationCandidate,
  next: KnowledgeCmsMigrationIssue,
): void {
  if (
    !candidate.issues.some(
      (existing) =>
        existing.code === next.code && existing.message === next.message,
    )
  ) {
    candidate.issues.push(next);
  }
}

function sourceReviewDueAt(checkedAt: string, requested?: string): string {
  const maximum = addUtcDays(checkedAt, KNOWLEDGE_CMS_MAX_SOURCE_AGE_DAYS);
  if (!isValidDateOnly(checkedAt)) {
    return requested ?? checkedAt;
  }
  if (requested && !isValidDateOnly(requested)) {
    return requested;
  }
  return requested && requested < maximum ? requested : maximum;
}

function migrateOfficialSource(source: KnowledgeSource): KnowledgeCmsSource {
  return {
    id: source.id,
    kind: "official",
    title: source.title,
    publisher: source.publisher,
    url: source.url,
    checkedAt: source.lastChecked,
    reviewDueAt: sourceReviewDueAt(source.lastChecked),
  };
}

function migrateFirstPartyFactSource(fact: KnowledgeFact): KnowledgeCmsSource {
  const owner =
    fact.evidence.kind === "first-party"
      ? fact.evidence.owner
      : "Health Insurance Options LLC";
  return {
    id: `first-party--${generateKnowledgeCmsSlug(owner)}`,
    kind: "first_party",
    title: `${owner} agency disclosure`,
    publisher: owner,
    url: FIRST_PARTY_ABOUT_URL,
    checkedAt: fact.checkedAt,
    reviewDueAt: sourceReviewDueAt(fact.checkedAt, fact.reviewDueAt),
  };
}

function sourcesForIds(
  sourceIds: ReadonlyArray<string>,
  candidate: MutableMigrationCandidate,
  sourceById: ReadonlyMap<string, KnowledgeSource>,
  asOf: string,
): KnowledgeCmsSource[] {
  const sources: KnowledgeCmsSource[] = [];
  for (const sourceId of unique(sourceIds)) {
    const source = sourceById.get(sourceId);
    if (!source) {
      addIssue(
        candidate,
        issue(
          "missing_source",
          "blocker",
          `Static source "${sourceId}" does not exist.`,
        ),
      );
      continue;
    }
    sources.push(migrateOfficialSource(source));
  }

  for (const source of sources) {
    if (isKnowledgeCmsSourceExpired(source, asOf)) {
      addIssue(
        candidate,
        issue(
          "source_due_for_review",
          "blocker",
          `Source "${source.id}" is due for review as of ${asOf}.`,
        ),
      );
    }
  }

  return sources;
}

function factSources(
  facts: ReadonlyArray<KnowledgeFact>,
  candidate: MutableMigrationCandidate,
  sourceById: ReadonlyMap<string, KnowledgeSource>,
  asOf: string,
): KnowledgeCmsSource[] {
  const sources = sourcesForIds(
    facts.flatMap(getKnowledgeFactSourceIds),
    candidate,
    sourceById,
    asOf,
  );

  for (const fact of facts) {
    if (fact.evidence.kind === "first-party") {
      sources.push(migrateFirstPartyFactSource(fact));
    }
  }

  const uniqueSources = [
    ...new Map(sources.map((source) => [source.id, source])).values(),
  ];
  for (const source of uniqueSources) {
    if (isKnowledgeCmsSourceExpired(source, asOf)) {
      addIssue(
        candidate,
        issue(
          "source_due_for_review",
          "blocker",
          `Source "${source.id}" is due for review as of ${asOf}.`,
        ),
      );
    }
  }
  return uniqueSources;
}

function articleRelationships(
  entry: KnowledgeEntry,
  candidate: MutableMigrationCandidate,
  entryByPath: ReadonlyMap<string, KnowledgeEntry>,
  faqById: ReadonlyMap<string, KnowledgeFaq>,
): KnowledgeCmsRelationships {
  const articleIds: string[] = [];
  for (const path of entry.relationships?.entryPaths ?? []) {
    const related = entryByPath.get(path);
    if (!related) {
      addIssue(
        candidate,
        issue(
          "missing_article_relationship",
          "blocker",
          `Related Resource Library path "${path}" does not resolve.`,
        ),
      );
      continue;
    }
    articleIds.push(migrationArticleId(related.id));
  }

  const faqIds: string[] = [];
  for (const faqId of entry.relationships?.faqIds ?? []) {
    if (!faqById.has(faqId)) {
      addIssue(
        candidate,
        issue(
          "missing_faq_relationship",
          "blocker",
          `Related FAQ "${faqId}" does not resolve.`,
        ),
      );
      continue;
    }
    faqIds.push(migrationFaqId(faqId));
  }

  if (
    (entry.relationships?.videoIds?.length ?? 0) > 0 ||
    (entry.relationships?.downloadIds?.length ?? 0) > 0 ||
    (entry.relationships?.factIds?.length ?? 0) > 0
  ) {
    addIssue(
      candidate,
      issue(
        "unsupported_relationship",
        "warning",
        "Video, download, or article-level fact relationships need an explicit CMS mapping.",
      ),
    );
  }

  return normalizeKnowledgeCmsRelationships({
    articleIds,
    topicIds: [
      migrationCategoryId(entry.categoryId),
      ...entry.topicSlugs.map(migrationTopicId),
    ],
    faqIds,
    citySlugs: entry.relationships?.citySlugs,
    agentSlugs: entry.relationships?.agentSlugs,
    carrierNames: entry.relationships?.carrierNames,
    existingPaths: [entry.path],
  });
}

function buildArticleCandidate(
  entry: KnowledgeEntry,
  sourceById: ReadonlyMap<string, KnowledgeSource>,
  entryByPath: ReadonlyMap<string, KnowledgeEntry>,
  faqById: ReadonlyMap<string, KnowledgeFaq>,
  asOf: string,
): MutableMigrationCandidate {
  const routeParity = getKnowledgeCmsRouteParity(entry.id);
  const candidate: MutableMigrationCandidate = {
    key: `article:${migrationArticleId(entry.id)}`,
    origin: {
      kind: "resource_entry",
      id: entry.id,
      path: entry.path,
    },
    target: {
      id: migrationArticleId(entry.id),
      kind: "article",
      slug: slugFromPath(entry.path),
      title: entry.title,
      summary: entry.summary,
      bodyStatus: routeParity ? "snapshot_verified" : "missing",
      ...(routeParity
        ? {
            pageTitle: routeParity.metadata.pageTitle,
            description: routeParity.metadata.description,
            routeParity,
          }
        : {}),
      searchTerms: unique([...entry.tags, ...entry.topicSlugs]),
      relationships: normalizeKnowledgeCmsRelationships(undefined),
      sources: [],
      canonicalPath: entry.path,
      status: "draft",
      indexing: "blocked",
    },
    issues: [],
  };
  if (!routeParity) {
    addIssue(
      candidate,
      issue(
        "parity_manifest_missing",
        "blocker",
        `The public route body and metadata at "${entry.path}" have no parity snapshot.`,
      ),
    );
  } else {
    addIssue(
      candidate,
      issue(
        "content_parity_snapshot_verified",
        "info",
        `The rendered route body is pinned to ${routeParity.renderedBody.hashAlgorithm}:${routeParity.renderedBody.sha256}.`,
      ),
    );
    addIssue(
      candidate,
      issue(
        "metadata_parity_verified",
        "info",
        "The page title, description, canonical, Open Graph metadata, H1, and structured-data types match the route parity manifest.",
      ),
    );
    if (routeParity.cmsRepresentation.status === "blocked") {
      addIssue(
        candidate,
        issue(
          "article_body_representation_blocked",
          "blocker",
          routeParity.cmsRepresentation.reason,
        ),
      );
    }
  }
  if (entry.review?.status !== "reviewed") {
    addIssue(
      candidate,
      issue(
        "legacy_review_required",
        "warning",
        "The static entry has not been attributed to a verified licensed reviewer.",
      ),
    );
  }
  candidate.target.relationships = articleRelationships(
    entry,
    candidate,
    entryByPath,
    faqById,
  );
  candidate.target.sources = sourcesForIds(
    entry.sourceIds ?? [],
    candidate,
    sourceById,
    asOf,
  );
  return candidate;
}

function buildCategoryCandidate(
  category: (typeof knowledgeCategories)[number],
): MutableMigrationCandidate {
  const relatedArticles = knowledgeEntries
    .filter((entry) => entry.categoryId === category.id)
    .map((entry) => migrationArticleId(entry.id));
  return {
    key: `topic:${migrationCategoryId(category.id)}`,
    origin: {
      kind: "resource_category",
      id: category.id,
    },
    target: {
      id: migrationCategoryId(category.id),
      kind: "topic",
      slug: generateKnowledgeCmsSlug(category.id),
      title: category.title,
      description: category.intro,
      order: category.order,
      searchTerms: [],
      relationships: normalizeKnowledgeCmsRelationships({
        articleIds: relatedArticles,
      }),
      sources: [],
      status: "draft",
      indexing: "blocked",
    },
    issues: [],
  };
}

function buildTopicCandidate(topic: Topic): MutableMigrationCandidate {
  const canonicalPath = `/topics/${topic.slug}`;
  return {
    key: `topic:${migrationTopicId(topic.slug)}`,
    origin: {
      kind: "resource_topic",
      id: topic.slug,
      path: canonicalPath,
    },
    target: {
      id: migrationTopicId(topic.slug),
      kind: "topic",
      slug: generateKnowledgeCmsSlug(topic.slug),
      title: topic.title,
      description: topic.longDescription,
      order: knowledgeCategories.length + medicareTopics.indexOf(topic) + 1,
      searchTerms: unique(topic.keywords),
      relationships: normalizeKnowledgeCmsRelationships({
        articleIds: knowledgeEntries
          .filter((entry) => entry.topicSlugs.includes(topic.slug))
          .map((entry) => migrationArticleId(entry.id)),
        existingPaths: [canonicalPath],
      }),
      sources: [],
      canonicalPath,
      status: "draft",
      indexing: "blocked",
    },
    issues: [
      issue(
        "metadata_parity_unverified",
        "warning",
        "The current public topic metadata and rendered copy must be compared before import.",
      ),
    ],
  };
}

function buildFaqCandidate(
  faq: KnowledgeFaq,
  sourceById: ReadonlyMap<string, KnowledgeSource>,
  factById: ReadonlyMap<string, KnowledgeFact>,
  asOf: string,
): MutableMigrationCandidate {
  const candidate: MutableMigrationCandidate = {
    key: `faq:${migrationFaqId(faq.id)}`,
    origin: {
      kind: "resource_faq",
      id: faq.id,
      path: "/medicare-faq",
    },
    target: {
      id: migrationFaqId(faq.id),
      kind: "faq",
      slug: generateKnowledgeCmsSlug(faq.question),
      title: faq.question,
      question: faq.question,
      answer: faq.answer,
      categoryId: faq.categoryId,
      factIds: [...faq.factIds],
      schemaEligible: faq.schemaEligible,
      searchTerms: unique(faq.searchTerms),
      relationships: normalizeKnowledgeCmsRelationships(undefined),
      sources: [],
      status: "draft",
      indexing: "blocked",
    },
    issues: [],
  };
  const facts: KnowledgeFact[] = [];
  for (const factId of faq.factIds) {
    const fact = factById.get(factId);
    if (!fact) {
      addIssue(
        candidate,
        issue(
          "missing_fact_reference",
          "blocker",
          `FAQ fact "${factId}" does not resolve.`,
        ),
      );
      continue;
    }
    facts.push(fact);
  }
  if (faq.status !== "published") {
    addIssue(
      candidate,
      issue(
        "static_record_not_published",
        "warning",
        "The static FAQ is not currently published and will remain a private draft.",
      ),
    );
  }
  if (faq.factIds.length > 0) {
    addIssue(
      candidate,
      issue(
        "static_fact_reference_preserved",
        "info",
        "Governed fact IDs remain linked to the existing static factual-claim registry.",
      ),
    );
  }
  candidate.target.relationships = normalizeKnowledgeCmsRelationships({
    topicIds: faq.topicSlugs.map(migrationTopicId),
    agentSlugs: faq.answeredByAgentSlug
      ? [faq.answeredByAgentSlug]
      : [],
    existingPaths: ["/medicare-faq"],
  });
  candidate.target.sources = factSources(
    facts,
    candidate,
    sourceById,
    asOf,
  );
  if (candidate.target.sources.length === 0) {
    addIssue(
      candidate,
      issue(
        "missing_source",
        "blocker",
        "The FAQ has no migratable official or first-party source.",
      ),
    );
  }
  return candidate;
}

function validateRelationships(
  candidates: MutableMigrationCandidate[],
): void {
  const articleIds = new Set(
    candidates
      .filter((candidate) => candidate.target.kind === "article")
      .map((candidate) => candidate.target.id),
  );
  const topicIds = new Set(
    candidates
      .filter((candidate) => candidate.target.kind === "topic")
      .map((candidate) => candidate.target.id),
  );
  const faqIds = new Set(
    candidates
      .filter((candidate) => candidate.target.kind === "faq")
      .map((candidate) => candidate.target.id),
  );

  for (const candidate of candidates) {
    for (const articleId of candidate.target.relationships.articleIds) {
      if (!articleIds.has(articleId)) {
        addIssue(
          candidate,
          issue(
            "missing_article_relationship",
            "blocker",
            `Target article relationship "${articleId}" is not in the migration manifest.`,
          ),
        );
      }
    }
    for (const topicId of candidate.target.relationships.topicIds) {
      if (!topicIds.has(topicId)) {
        addIssue(
          candidate,
          issue(
            "missing_topic_relationship",
            "blocker",
            `Target topic relationship "${topicId}" is not in the migration manifest.`,
          ),
        );
      }
    }
    for (const faqId of candidate.target.relationships.faqIds) {
      if (!faqIds.has(faqId)) {
        addIssue(
          candidate,
          issue(
            "missing_faq_relationship",
            "blocker",
            `Target FAQ relationship "${faqId}" is not in the migration manifest.`,
          ),
        );
      }
    }
  }
}

function validateCandidateCollisions(
  candidates: MutableMigrationCandidate[],
): void {
  const ids = new Map<string, MutableMigrationCandidate[]>();
  const slugs = new Map<string, MutableMigrationCandidate[]>();
  const canonicals = new Map<string, MutableMigrationCandidate[]>();

  for (const candidate of candidates) {
    const idKey = `${candidate.target.kind}:${candidate.target.id}`;
    const slugKey = `${candidate.target.kind}:${candidate.target.slug}`;
    ids.set(idKey, [...(ids.get(idKey) ?? []), candidate]);
    slugs.set(slugKey, [...(slugs.get(slugKey) ?? []), candidate]);
    if (candidate.target.canonicalPath) {
      canonicals.set(candidate.target.canonicalPath, [
        ...(canonicals.get(candidate.target.canonicalPath) ?? []),
        candidate,
      ]);
    }
  }

  for (const duplicates of ids.values()) {
    if (duplicates.length > 1) {
      for (const candidate of duplicates) {
        addIssue(
          candidate,
          issue(
            "candidate_id_conflict",
            "blocker",
            `Migration target ID "${candidate.target.id}" is duplicated.`,
          ),
        );
      }
    }
  }
  for (const duplicates of slugs.values()) {
    if (duplicates.length > 1) {
      for (const candidate of duplicates) {
        addIssue(
          candidate,
          issue(
            "candidate_slug_conflict",
            "blocker",
            `Migration target slug "${candidate.target.slug}" is duplicated for ${candidate.target.kind} records.`,
          ),
        );
      }
    }
  }
  for (const duplicates of canonicals.values()) {
    if (duplicates.length > 1) {
      for (const candidate of duplicates) {
        addIssue(
          candidate,
          issue(
            "candidate_canonical_conflict",
            "blocker",
            `Migration canonical "${candidate.target.canonicalPath}" is claimed by multiple records.`,
          ),
        );
      }
    }
  }
}

function sameRelationships(
  left: KnowledgeCmsRelationships,
  right: KnowledgeCmsRelationships,
): boolean {
  return (
    sameStringSet(left.articleIds, right.articleIds) &&
    sameStringSet(left.topicIds, right.topicIds) &&
    sameStringSet(left.faqIds, right.faqIds) &&
    sameStringSet(left.citySlugs, right.citySlugs) &&
    sameStringSet(left.agentSlugs, right.agentSlugs) &&
    sameStringSet(left.carrierNames, right.carrierNames) &&
    sameStringSet(left.existingPaths, right.existingPaths)
  );
}

function sameSources(
  left: ReadonlyArray<KnowledgeCmsSource>,
  right: ReadonlyArray<KnowledgeCmsSource>,
): boolean {
  const serialize = (source: KnowledgeCmsSource) =>
    JSON.stringify({
      id: source.id,
      kind: source.kind,
      title: source.title,
      publisher: source.publisher,
      url: source.url,
      checkedAt: source.checkedAt,
      reviewDueAt: source.reviewDueAt,
    });
  return sameStrings(
    left.map(serialize).sort(),
    right.map(serialize).sort(),
  );
}

function existingRecordMatchesTarget(
  record: KnowledgeCmsRecord,
  target: KnowledgeCmsMigrationTarget,
): boolean {
  if (
    record.kind !== target.kind ||
    record.id !== target.id ||
    record.slug !== target.slug ||
    record.discoverability.canonicalPath !== target.canonicalPath ||
    !sameStringSet(record.searchTerms, target.searchTerms) ||
    !sameRelationships(record.relationships, target.relationships) ||
    !sameSources(record.sources, target.sources)
  ) {
    return false;
  }

  if (record.kind === "topic" && target.kind === "topic") {
    return (
      record.title === target.title &&
      record.description === target.description &&
      record.order === target.order &&
      record.parentTopicId === target.parentTopicId
    );
  }
  if (record.kind === "faq" && target.kind === "faq") {
    return (
      record.question === target.question &&
      record.answer === target.answer &&
      record.categoryId === target.categoryId &&
      sameStringSet(record.factIds, target.factIds) &&
      record.schemaEligible === target.schemaEligible
    );
  }

  return false;
}

function compareExistingRecords(
  candidates: MutableMigrationCandidate[],
  existingRecords: ReadonlyArray<KnowledgeCmsRecord>,
): void {
  for (const candidate of candidates) {
    const sameId = existingRecords.find(
      (record) =>
        record.kind === candidate.target.kind &&
        record.id === candidate.target.id,
    );
    if (sameId) {
      if (
        sameId.slug !== candidate.target.slug ||
        sameId.discoverability.canonicalPath !==
          candidate.target.canonicalPath
      ) {
        addIssue(
          candidate,
          issue(
            "existing_id_conflict",
            "blocker",
            `Existing ${sameId.kind} ID "${sameId.id}" has a different slug or canonical path.`,
          ),
        );
      } else if (candidate.target.kind === "article") {
        addIssue(
          candidate,
          issue(
            "existing_record_requires_content_comparison",
            "warning",
            `Existing article "${sameId.id}" requires body and metadata parity comparison.`,
          ),
        );
      } else if (existingRecordMatchesTarget(sameId, candidate.target)) {
        addIssue(
          candidate,
          issue(
            "existing_match",
            "info",
            `An equivalent ${sameId.kind} record already exists at revision ${sameId.audit.revision}.`,
          ),
        );
      } else {
        addIssue(
          candidate,
          issue(
            "existing_content_conflict",
            "blocker",
            `Existing ${sameId.kind} ID "${sameId.id}" has different governed content or relationships.`,
          ),
        );
      }
    }

    const sameSlug = existingRecords.find(
      (record) =>
        record.kind === candidate.target.kind &&
        record.slug === candidate.target.slug &&
        record.id !== candidate.target.id,
    );
    if (sameSlug) {
      addIssue(
        candidate,
        issue(
          "existing_slug_conflict",
          "blocker",
          `Slug "${candidate.target.slug}" is already used by ${sameSlug.kind} "${sameSlug.id}".`,
        ),
      );
    }

    if (candidate.target.canonicalPath) {
      const sameCanonical = existingRecords.find(
        (record) =>
          record.discoverability.canonicalPath ===
            candidate.target.canonicalPath &&
          (record.kind !== candidate.target.kind ||
            record.id !== candidate.target.id),
      );
      if (sameCanonical) {
        addIssue(
          candidate,
          issue(
            "existing_canonical_conflict",
            "blocker",
            `Canonical "${candidate.target.canonicalPath}" is already claimed by ${sameCanonical.kind} "${sameCanonical.id}".`,
          ),
        );
      }
    }
  }
}

function finalizeCandidate(
  candidate: MutableMigrationCandidate,
): KnowledgeCmsMigrationCandidate {
  const issues = [...candidate.issues].sort((left, right) => {
    const severityOrder: Record<KnowledgeCmsMigrationIssueSeverity, number> = {
      blocker: 0,
      warning: 1,
      info: 2,
    };
    return (
      severityOrder[left.severity] - severityOrder[right.severity] ||
      left.code.localeCompare(right.code) ||
      left.message.localeCompare(right.message)
    );
  });
  const blocked = issues.some((item) => item.severity === "blocker");
  const alreadyPresent = issues.some((item) => item.code === "existing_match");
  return {
    ...candidate,
    issues,
    state: blocked
      ? "blocked"
      : alreadyPresent
        ? "already_present"
        : "ready",
  };
}

function emptyKindSummary(): KnowledgeCmsMigrationKindSummary {
  return {
    total: 0,
    ready: 0,
    blocked: 0,
    alreadyPresent: 0,
  };
}

export function buildKnowledgeCmsMigrationPreview(
  options: BuildKnowledgeCmsMigrationPreviewOptions = {},
): KnowledgeCmsMigrationPreview {
  const asOf = normalizeAsOf(options.asOf);
  const sourceById = new Map(
    knowledgeSources.map((source) => [source.id, source]),
  );
  const entryByPath = new Map(
    knowledgeEntries.map((entry) => [entry.path, entry]),
  );
  const faqById = new Map(knowledgeFaqs.map((faq) => [faq.id, faq]));
  const factById = new Map(knowledgeFacts.map((fact) => [fact.id, fact]));
  const mutableCandidates: MutableMigrationCandidate[] = [
    ...knowledgeEntries.map((entry) =>
      buildArticleCandidate(
        entry,
        sourceById,
        entryByPath,
        faqById,
        asOf,
      ),
    ),
    ...knowledgeCategories.map(buildCategoryCandidate),
    ...medicareTopics.map(buildTopicCandidate),
    ...knowledgeFaqs.map((faq) =>
      buildFaqCandidate(faq, sourceById, factById, asOf),
    ),
  ];

  validateRelationships(mutableCandidates);
  validateCandidateCollisions(mutableCandidates);
  compareExistingRecords(
    mutableCandidates,
    options.existingRecords ?? [],
  );

  const kindOrder: Record<KnowledgeCmsRecordKind, number> = {
    article: 0,
    topic: 1,
    faq: 2,
  };
  const candidates = mutableCandidates
    .map(finalizeCandidate)
    .sort(
      (left, right) =>
        kindOrder[left.target.kind] - kindOrder[right.target.kind] ||
        left.target.title.localeCompare(right.target.title),
    );
  const registryIssues = [
    ...validateKnowledgeCenter(asOf).map((message) =>
      issue("static_registry_invalid", "blocker", message),
    ),
    ...validateKnowledgeCmsRouteParityManifest().map((message) =>
      issue("parity_manifest_invalid", "blocker", message),
    ),
  ];
  const byKind: Record<
    KnowledgeCmsRecordKind,
    KnowledgeCmsMigrationKindSummary
  > = {
    article: emptyKindSummary(),
    topic: emptyKindSummary(),
    faq: emptyKindSummary(),
  };
  for (const candidate of candidates) {
    const summary = byKind[candidate.target.kind];
    summary.total += 1;
    if (candidate.state === "blocked") {
      summary.blocked += 1;
    } else if (candidate.state === "already_present") {
      summary.alreadyPresent += 1;
    } else {
      summary.ready += 1;
    }
  }
  const sourceRecords = new Set(
    candidates.flatMap((candidate) =>
      candidate.target.sources.map((source) => source.id),
    ),
  ).size;
  const candidateIssues = candidates.flatMap(
    (candidate) => candidate.issues,
  );
  const articleCandidates = candidates.filter(
    (
      candidate,
    ): candidate is KnowledgeCmsMigrationCandidate & {
      target: KnowledgeCmsMigrationArticleTarget;
    } => candidate.target.kind === "article",
  );

  return {
    version: KNOWLEDGE_CMS_MIGRATION_PREVIEW_VERSION,
    mode: "read_only",
    asOf,
    writeCount: KNOWLEDGE_CMS_MIGRATION_WRITE_COUNT,
    readyToExecute: false,
    summary: {
      total: candidates.length,
      ready: candidates.filter((candidate) => candidate.state === "ready")
        .length,
      blocked: candidates.filter(
        (candidate) => candidate.state === "blocked",
      ).length,
      alreadyPresent: candidates.filter(
        (candidate) => candidate.state === "already_present",
      ).length,
      blockers: [...registryIssues, ...candidateIssues].filter(
        (item) => item.severity === "blocker",
      ).length,
      warnings: [...registryIssues, ...candidateIssues].filter(
        (item) => item.severity === "warning",
      ).length,
      sourceRecords,
      articleParity: {
        total: articleCandidates.length,
        snapshotsVerified: articleCandidates.filter(
          (candidate) =>
            candidate.target.bodyStatus === "snapshot_verified",
        ).length,
        metadataVerified: articleCandidates.filter(
          (candidate) =>
            candidate.target.routeParity?.metadata.status === "verified",
        ).length,
        representationBlocked: articleCandidates.filter(
          (candidate) =>
            candidate.target.routeParity?.cmsRepresentation.status ===
            "blocked",
        ).length,
      },
      byKind,
    },
    issues: registryIssues,
    candidates,
  };
}
