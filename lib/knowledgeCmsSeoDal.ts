import "server-only";

import { randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import { getFirestoreAdmin } from "./firebase-admin";
import { isProduction } from "./env";
import {
  KNOWLEDGE_CMS_COLLECTIONS,
  KnowledgeCmsAuthorizationError,
  getKnowledgeCmsAuthorizationDecision,
  type KnowledgeCmsActor,
  type KnowledgeCmsRecord,
  type KnowledgeCmsRecordKind,
} from "./knowledgeCms";
import { requireKnowledgeCmsActor } from "./knowledgeCmsAdminAuth";
import {
  createKnowledgeCmsRepository,
  type KnowledgeCmsRepository,
} from "./knowledgeCmsRepository";
import {
  KNOWLEDGE_CMS_SEO_SCAN_SCHEMA_VERSION,
  buildKnowledgeCmsRecordOpportunities,
  buildKnowledgeCmsSearchOpportunities,
  buildKnowledgeCmsTechnicalOpportunities,
  compareKnowledgeCmsSearchMetrics,
  sortAndLimitKnowledgeCmsSeoOpportunities,
  summarizeKnowledgeCmsSearchMetrics,
  summarizeKnowledgeCmsSearchTotals,
  summarizeKnowledgeCmsSeoOpportunities,
  type KnowledgeCmsSearchMetricsSummary,
  type KnowledgeCmsSeoOpportunity,
  type KnowledgeCmsSeoPageObservation,
  type KnowledgeCmsSeoScanSummary,
  type KnowledgeCmsSeoSiteObservation,
} from "./knowledgeCmsSeo";
import {
  crawlKnowledgeCmsSite,
  type KnowledgeCmsSeoCrawlResult,
} from "./knowledgeCmsSeoCrawler";
import {
  loadKnowledgeCmsSearchConsoleSnapshot,
  type KnowledgeCmsSearchConsolePeriod,
  type KnowledgeCmsSearchConsoleSnapshot,
  type KnowledgeCmsSearchConsoleStatus,
} from "./knowledgeCmsSearchConsole";

const RECORD_KINDS: KnowledgeCmsRecordKind[] = ["article", "topic", "faq"];

export type KnowledgeCmsSeoScanTrigger = "manual" | "scheduled";

export interface KnowledgeCmsSeoScan {
  id: string;
  schemaVersion: typeof KNOWLEDGE_CMS_SEO_SCAN_SCHEMA_VERSION;
  trigger: KnowledgeCmsSeoScanTrigger;
  startedAt: string;
  completedAt: string;
  initiatedBy: string;
  environment: string;
  origin: string;
  searchConsoleStatus: KnowledgeCmsSearchConsoleStatus;
  searchConsoleErrorCode?: KnowledgeCmsSearchConsoleSnapshot["errorCode"];
  currentPeriod?: KnowledgeCmsSearchConsolePeriod;
  previousPeriod?: KnowledgeCmsSearchConsolePeriod;
  searchMetrics: KnowledgeCmsSearchMetricsSummary;
  searchEvidence?: {
    pages: ReturnType<typeof compareKnowledgeCmsSearchMetrics>;
    queries: ReturnType<typeof compareKnowledgeCmsSearchMetrics>;
  };
  site: KnowledgeCmsSeoSiteObservation;
  pages: KnowledgeCmsSeoPageObservation[];
  opportunities: KnowledgeCmsSeoOpportunity[];
  summary: KnowledgeCmsSeoScanSummary;
}

export interface KnowledgeCmsSeoScanStore {
  save(scan: KnowledgeCmsSeoScan): Promise<void>;
  latest(): Promise<KnowledgeCmsSeoScan | undefined>;
  listRecent?(limit: number): Promise<KnowledgeCmsSeoScan[]>;
}

export interface KnowledgeCmsSeoDalDependencies {
  crawl?: (
    records: ReadonlyArray<KnowledgeCmsRecord>,
  ) => Promise<KnowledgeCmsSeoCrawlResult>;
  now?: () => Date;
  repository?: Pick<KnowledgeCmsRepository, "list">;
  searchConsole?: () => Promise<KnowledgeCmsSearchConsoleSnapshot>;
  store?: KnowledgeCmsSeoScanStore;
}

export interface RunKnowledgeCmsSeoScanOptions {
  actor?: KnowledgeCmsActor;
  trigger?: KnowledgeCmsSeoScanTrigger;
}

export class KnowledgeCmsSeoFeatureError extends Error {
  readonly code = "knowledge_cms_seo_feature";

  constructor(readonly reason: "disabled" | "invalid_clock") {
    super(`Knowledge CMS SEO scan is unavailable (${reason}).`);
    this.name = "KnowledgeCmsSeoFeatureError";
  }
}

export function isKnowledgeCmsSeoEnabled(
  value: string | undefined = process.env.KNOWLEDGE_CMS_SEO_ENABLED,
): boolean {
  return value === "true";
}

function assertAuthorized(actor: KnowledgeCmsActor): void {
  const decision = getKnowledgeCmsAuthorizationDecision(actor, "run_seo_scan");
  if (!decision.allowed) {
    throw new KnowledgeCmsAuthorizationError("run_seo_scan", decision.reason);
  }
}

function isStoredScan(value: unknown): value is KnowledgeCmsSeoScan {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const scan = value as Partial<KnowledgeCmsSeoScan>;
  return (
    scan.schemaVersion === KNOWLEDGE_CMS_SEO_SCAN_SCHEMA_VERSION &&
    typeof scan.id === "string" &&
    typeof scan.completedAt === "string" &&
    Array.isArray(scan.opportunities) &&
    Array.isArray(scan.pages) &&
    Boolean(scan.summary) &&
    Boolean(scan.searchMetrics) &&
    Boolean(scan.site)
  );
}

export class FirestoreKnowledgeCmsSeoScanStore
  implements KnowledgeCmsSeoScanStore
{
  constructor(private readonly db: Firestore = getFirestoreAdmin()) {}

  async save(scan: KnowledgeCmsSeoScan): Promise<void> {
    await this.db
      .collection(KNOWLEDGE_CMS_COLLECTIONS.seoScans)
      .doc(scan.id)
      .create(scan);
  }

  async latest(): Promise<KnowledgeCmsSeoScan | undefined> {
    const snapshot = await this.db
      .collection(KNOWLEDGE_CMS_COLLECTIONS.seoScans)
      .orderBy("completedAt", "desc")
      .limit(1)
      .get();
    const value = snapshot.docs[0]?.data();
    return isStoredScan(value) ? value : undefined;
  }

  async listRecent(limit: number): Promise<KnowledgeCmsSeoScan[]> {
    const boundedLimit = Number.isInteger(limit)
      ? Math.min(Math.max(limit, 1), 50)
      : 8;
    const snapshot = await this.db
      .collection(KNOWLEDGE_CMS_COLLECTIONS.seoScans)
      .orderBy("completedAt", "desc")
      .limit(boundedLimit)
      .get();
    return snapshot.docs
      .map((document) => document.data())
      .filter((value): value is KnowledgeCmsSeoScan => isStoredScan(value));
  }
}

async function listAllRecords(
  repository: Pick<KnowledgeCmsRepository, "list">,
): Promise<KnowledgeCmsRecord[]> {
  return (
    await Promise.all(RECORD_KINDS.map((kind) => repository.list({ kind })))
  ).flat();
}

function emptyMetrics(): KnowledgeCmsSearchMetricsSummary {
  return {
    clicks: 0,
    impressions: 0,
    ctr: 0,
    position: 0,
    previousClicks: 0,
    previousImpressions: 0,
    clickChange: null,
    impressionChange: null,
  };
}

export async function runKnowledgeCmsSeoScan(
  options: RunKnowledgeCmsSeoScanOptions = {},
  dependencies: KnowledgeCmsSeoDalDependencies = {},
): Promise<KnowledgeCmsSeoScan> {
  if (!isKnowledgeCmsSeoEnabled()) {
    throw new KnowledgeCmsSeoFeatureError("disabled");
  }

  const actor = options.actor ?? (await requireKnowledgeCmsActor());
  assertAuthorized(actor);
  const now = dependencies.now ?? (() => new Date());
  const started = now();
  if (!Number.isFinite(started.getTime())) {
    throw new KnowledgeCmsSeoFeatureError("invalid_clock");
  }

  const repository = dependencies.repository ?? createKnowledgeCmsRepository();
  const store = dependencies.store ?? new FirestoreKnowledgeCmsSeoScanStore();
  const records = await listAllRecords(repository);
  const [crawl, searchConsole] = await Promise.all([
    (dependencies.crawl ?? crawlKnowledgeCmsSite)(records),
    (dependencies.searchConsole ?? loadKnowledgeCmsSearchConsoleSnapshot)(),
  ]);

  const comparisons = compareKnowledgeCmsSearchMetrics(
    searchConsole.currentRows,
    searchConsole.previousRows,
  );
  const pageComparisons = compareKnowledgeCmsSearchMetrics(
    searchConsole.currentPageRows,
    searchConsole.previousPageRows,
  );
  const queryComparisons = compareKnowledgeCmsSearchMetrics(
    searchConsole.currentQueryRows,
    searchConsole.previousQueryRows,
  );
  const opportunities = sortAndLimitKnowledgeCmsSeoOpportunities([
    ...buildKnowledgeCmsTechnicalOpportunities(crawl.pages, crawl.site, {
      expectIndexing: isProduction(),
    }),
    ...buildKnowledgeCmsRecordOpportunities(records, started),
    ...buildKnowledgeCmsSearchOpportunities(pageComparisons, {
      evidenceThrough: searchConsole.currentPeriod?.endDate,
    }),
    ...buildKnowledgeCmsSearchOpportunities(comparisons, {
      evidenceThrough: searchConsole.currentPeriod?.endDate,
    }),
  ]);
  const completed = now();
  if (!Number.isFinite(completed.getTime())) {
    throw new KnowledgeCmsSeoFeatureError("invalid_clock");
  }

  const scan: KnowledgeCmsSeoScan = {
    id: `${completed.toISOString().replace(/[^0-9]/g, "")}--${randomUUID()}`,
    schemaVersion: KNOWLEDGE_CMS_SEO_SCAN_SCHEMA_VERSION,
    trigger: options.trigger ?? "manual",
    startedAt: started.toISOString(),
    completedAt: completed.toISOString(),
    initiatedBy: actor.id,
    environment: process.env.NEXT_PUBLIC_SITE_ENV?.trim() || "production",
    origin: crawl.origin,
    searchConsoleStatus: searchConsole.status,
    ...(searchConsole.errorCode
      ? { searchConsoleErrorCode: searchConsole.errorCode }
      : {}),
    ...(searchConsole.currentPeriod
      ? { currentPeriod: searchConsole.currentPeriod }
      : {}),
    ...(searchConsole.previousPeriod
      ? { previousPeriod: searchConsole.previousPeriod }
      : {}),
    searchMetrics:
      searchConsole.currentTotals && searchConsole.previousTotals
        ? summarizeKnowledgeCmsSearchTotals(
            searchConsole.currentTotals,
            searchConsole.previousTotals,
          )
        : comparisons.length > 0
          ? summarizeKnowledgeCmsSearchMetrics(comparisons)
          : emptyMetrics(),
    searchEvidence: {
      pages: [...pageComparisons]
        .sort((left, right) => right.impressions - left.impressions)
        .slice(0, 100),
      queries: [...queryComparisons]
        .sort((left, right) => right.impressions - left.impressions)
        .slice(0, 100),
    },
    site: crawl.site,
    pages: crawl.pages,
    opportunities,
    summary: summarizeKnowledgeCmsSeoOpportunities(
      opportunities,
      records.length,
      crawl.pages.length,
    ),
  };
  await store.save(scan);
  return scan;
}

export async function getLatestKnowledgeCmsSeoScan(
  dependencies: Pick<KnowledgeCmsSeoDalDependencies, "store"> = {},
): Promise<KnowledgeCmsSeoScan | undefined> {
  const actor = await requireKnowledgeCmsActor();
  assertAuthorized(actor);
  if (!isKnowledgeCmsSeoEnabled()) return undefined;
  const store = dependencies.store ?? new FirestoreKnowledgeCmsSeoScanStore();
  return store.latest();
}

export async function getRecentKnowledgeCmsSeoScans(
  limit = 8,
  dependencies: Pick<KnowledgeCmsSeoDalDependencies, "store"> = {},
): Promise<KnowledgeCmsSeoScan[]> {
  const actor = await requireKnowledgeCmsActor();
  assertAuthorized(actor);
  if (!isKnowledgeCmsSeoEnabled()) return [];
  const boundedLimit = Number.isInteger(limit)
    ? Math.min(Math.max(limit, 1), 25)
    : 8;
  const store = dependencies.store ?? new FirestoreKnowledgeCmsSeoScanStore();
  if (store.listRecent) {
    return (await store.listRecent(boundedLimit)).slice(0, boundedLimit);
  }
  const latest = await store.latest();
  return latest ? [latest] : [];
}
