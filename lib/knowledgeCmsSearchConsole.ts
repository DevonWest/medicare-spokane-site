import "server-only";

import {
  auth,
  searchconsole,
  type searchconsole_v1,
} from "@googleapis/searchconsole";
import type {
  KnowledgeCmsSearchMetricRow,
  KnowledgeCmsUrlInspectionObservation,
  KnowledgeCmsUrlInspectionStatus,
} from "./knowledgeCmsSeo";
import { publicMonitoringPaths } from "./publicMonitoringPaths";
import { env } from "./runtimeValues";

export const KNOWLEDGE_CMS_SEARCH_CONSOLE_SCOPE =
  "https://www.googleapis.com/auth/webmasters.readonly";

export type KnowledgeCmsSearchConsoleStatus =
  | "available"
  | "disabled"
  | "unavailable"
  | "unconfigured";

export type KnowledgeCmsSearchConsoleErrorCode =
  | "access_denied"
  | "invalid_configuration"
  | "quota_exceeded"
  | "request_failed"
  | "site_not_found";

export interface KnowledgeCmsSearchConsolePeriod {
  startDate: string;
  endDate: string;
}

export interface KnowledgeCmsSearchConsoleSnapshot {
  status: KnowledgeCmsSearchConsoleStatus;
  urlInspectionStatus?: KnowledgeCmsUrlInspectionStatus;
  urlInspectionErrorCode?: KnowledgeCmsSearchConsoleErrorCode;
  urlInspections?: KnowledgeCmsUrlInspectionObservation[];
  siteUrl?: string;
  currentPeriod?: KnowledgeCmsSearchConsolePeriod;
  previousPeriod?: KnowledgeCmsSearchConsolePeriod;
  currentTotals?: KnowledgeCmsSearchConsoleTotals;
  previousTotals?: KnowledgeCmsSearchConsoleTotals;
  currentPageRows: KnowledgeCmsSearchMetricRow[];
  previousPageRows: KnowledgeCmsSearchMetricRow[];
  currentQueryRows: KnowledgeCmsSearchMetricRow[];
  previousQueryRows: KnowledgeCmsSearchMetricRow[];
  currentRows: KnowledgeCmsSearchMetricRow[];
  previousRows: KnowledgeCmsSearchMetricRow[];
  errorCode?: KnowledgeCmsSearchConsoleErrorCode;
}

export interface KnowledgeCmsSearchConsoleTotals {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface KnowledgeCmsSearchConsoleAccessCheck {
  status: KnowledgeCmsSearchConsoleStatus;
  siteUrl?: string;
  errorCode?: KnowledgeCmsSearchConsoleErrorCode;
}

interface SearchConsoleQueryResult {
  data: {
    rows?: Array<{
      keys?: string[] | null;
      clicks?: number | null;
      impressions?: number | null;
      ctr?: number | null;
      position?: number | null;
    }>;
  };
}

export interface KnowledgeCmsSearchConsoleClient {
  query(input: {
    siteUrl: string;
    requestBody: searchconsole_v1.Schema$SearchAnalyticsQueryRequest;
  }): Promise<SearchConsoleQueryResult>;
}

interface SearchConsoleInspectionResult {
  data: searchconsole_v1.Schema$InspectUrlIndexResponse;
}

export interface KnowledgeCmsUrlInspectionClient {
  inspect(input: {
    requestBody: searchconsole_v1.Schema$InspectUrlIndexRequest;
  }): Promise<SearchConsoleInspectionResult>;
}

export interface LoadKnowledgeCmsSearchConsoleOptions {
  client?: KnowledgeCmsSearchConsoleClient;
  enabled?: string;
  inspectionClient?: KnowledgeCmsUrlInspectionClient;
  inspectionPaths?: ReadonlyArray<string>;
  now?: Date;
  origin?: string;
  rowLimit?: number;
  siteUrl?: string;
}

export type VerifyKnowledgeCmsSearchConsoleAccessOptions = Omit<
  LoadKnowledgeCmsSearchConsoleOptions,
  "inspectionClient" | "inspectionPaths" | "origin" | "rowLimit"
>;

export function isKnowledgeCmsSearchConsoleEnabled(
  value: string | undefined = process.env.KNOWLEDGE_CMS_SEARCH_CONSOLE_ENABLED,
): boolean {
  return value === "true";
}

function utcDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function buildKnowledgeCmsSearchConsolePeriods(
  now: Date = new Date(),
): {
  current: KnowledgeCmsSearchConsolePeriod;
  previous: KnowledgeCmsSearchConsolePeriod;
} {
  const stableEnd = addUtcDays(now, -3);
  const currentStart = addUtcDays(stableEnd, -27);
  const previousEnd = addUtcDays(currentStart, -1);
  const previousStart = addUtcDays(previousEnd, -27);
  return {
    current: {
      startDate: utcDateOnly(currentStart),
      endDate: utcDateOnly(stableEnd),
    },
    previous: {
      startDate: utcDateOnly(previousStart),
      endDate: utcDateOnly(previousEnd),
    },
  };
}

function validSiteUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.length > 500 || /\s/.test(trimmed)) {
    return undefined;
  }
  if (/^sc-domain:[a-z0-9.-]+$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
      return undefined;
    }
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function configuredRowLimit(value: number | undefined): number {
  const fromEnv = Number(env("KNOWLEDGE_CMS_SEARCH_CONSOLE_ROW_LIMIT"));
  const candidate = value ?? fromEnv;
  if (!Number.isInteger(candidate) || candidate < 100 || candidate > 25_000) {
    return 5_000;
  }
  return candidate;
}

function createClients(): {
  analytics: KnowledgeCmsSearchConsoleClient;
  inspection: KnowledgeCmsUrlInspectionClient;
} {
  const googleAuth = new auth.GoogleAuth({
    scopes: [KNOWLEDGE_CMS_SEARCH_CONSOLE_SCOPE],
  });
  const client = searchconsole({
    version: "v1",
    auth: googleAuth,
  });
  return {
    analytics: client.searchanalytics,
    inspection: client.urlInspection.index,
  };
}

function numeric(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : 0;
}

function normalizeRows(
  rows: SearchConsoleQueryResult["data"]["rows"],
  dimensions: ReadonlyArray<"page" | "query">,
): KnowledgeCmsSearchMetricRow[] {
  if (!rows) {
    return [];
  }
  return rows
    .map((row) => {
      const keys = row.keys ?? [];
      const values = Object.fromEntries(
        dimensions.map((dimension, index) => [
          dimension,
          keys[index]?.trim() ?? "",
        ]),
      );
      return {
        page: values.page ?? "",
        query: values.query ?? "",
        clicks: numeric(row.clicks),
        impressions: numeric(row.impressions),
        ctr: numeric(row.ctr),
        position: numeric(row.position),
      };
    })
    .filter(
      (row) =>
        dimensions.every((dimension) => row[dimension]) && row.impressions > 0,
    );
}

function normalizeTotals(
  rows: SearchConsoleQueryResult["data"]["rows"],
): KnowledgeCmsSearchConsoleTotals {
  const row = rows?.[0];
  return {
    clicks: numeric(row?.clicks),
    impressions: numeric(row?.impressions),
    ctr: numeric(row?.ctr),
    position: numeric(row?.position),
  };
}

function errorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }
  const candidate = error as {
    code?: unknown;
    response?: { status?: unknown };
  };
  const status = candidate.response?.status ?? candidate.code;
  return typeof status === "number" ? status : Number(status) || undefined;
}

function classifyError(error: unknown): KnowledgeCmsSearchConsoleErrorCode {
  const status = errorStatus(error);
  if (status === 401 || status === 403) {
    return "access_denied";
  }
  if (status === 404) {
    return "site_not_found";
  }
  if (status === 429) {
    return "quota_exceeded";
  }
  return "request_failed";
}

function boundedString(
  value: string | null | undefined,
  maxLength = 2_000,
): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
}

function boundedStrings(
  values: string[] | null | undefined,
  limit = 25,
): string[] {
  return (values ?? [])
    .map((value) => boundedString(value))
    .filter((value): value is string => Boolean(value))
    .slice(0, limit);
}

function inspectionTargets(
  originValue: string | undefined,
  paths: ReadonlyArray<string>,
): Array<{ path: string; url: string }> | undefined {
  if (paths.length === 0) return [];
  const configuredOrigin = originValue?.trim();
  if (!configuredOrigin) return undefined;
  try {
    const origin = new URL(configuredOrigin);
    if (
      origin.protocol !== "https:" ||
      origin.username ||
      origin.password ||
      origin.pathname !== "/" ||
      origin.search ||
      origin.hash
    ) {
      return undefined;
    }
    const uniquePaths = [...new Set(paths)];
    if (
      uniquePaths.length > 25 ||
      uniquePaths.some(
        (path) =>
          !/^\/(?!\/)[A-Za-z0-9/_-]*$/.test(path) || path.includes(".."),
      )
    ) {
      return undefined;
    }
    return uniquePaths.map((path) => ({
      path,
      url: new URL(path, origin).toString(),
    }));
  } catch {
    return undefined;
  }
}

function normalizeInspection(
  target: { path: string; url: string },
  response: SearchConsoleInspectionResult,
): KnowledgeCmsUrlInspectionObservation {
  const result = response.data.inspectionResult;
  const index = result?.indexStatusResult;
  return {
    path: target.path,
    url: target.url,
    status: "available",
    ...(boundedString(index?.verdict, 100)
      ? { verdict: boundedString(index?.verdict, 100) }
      : {}),
    ...(boundedString(index?.coverageState, 500)
      ? { coverageState: boundedString(index?.coverageState, 500) }
      : {}),
    ...(boundedString(index?.robotsTxtState, 100)
      ? { robotsTxtState: boundedString(index?.robotsTxtState, 100) }
      : {}),
    ...(boundedString(index?.indexingState, 100)
      ? { indexingState: boundedString(index?.indexingState, 100) }
      : {}),
    ...(boundedString(index?.lastCrawlTime, 100)
      ? { lastCrawlTime: boundedString(index?.lastCrawlTime, 100) }
      : {}),
    ...(boundedString(index?.pageFetchState, 100)
      ? { pageFetchState: boundedString(index?.pageFetchState, 100) }
      : {}),
    ...(boundedString(index?.googleCanonical)
      ? { googleCanonical: boundedString(index?.googleCanonical) }
      : {}),
    ...(boundedString(index?.userCanonical)
      ? { userCanonical: boundedString(index?.userCanonical) }
      : {}),
    ...(boundedString(index?.crawledAs, 100)
      ? { crawledAs: boundedString(index?.crawledAs, 100) }
      : {}),
    sitemaps: boundedStrings(index?.sitemap),
    referringUrls: boundedStrings(index?.referringUrls),
    ...(boundedString(result?.inspectionResultLink)
      ? { inspectionResultLink: boundedString(result?.inspectionResultLink) }
      : {}),
  };
}

async function loadUrlInspections(input: {
  client: KnowledgeCmsUrlInspectionClient;
  siteUrl: string;
  targets: ReadonlyArray<{ path: string; url: string }>;
}): Promise<{
  status: KnowledgeCmsUrlInspectionStatus;
  inspections: KnowledgeCmsUrlInspectionObservation[];
  errorCode?: KnowledgeCmsSearchConsoleErrorCode;
}> {
  if (input.targets.length === 0) {
    return { status: "disabled", inspections: [] };
  }

  const settled = await Promise.allSettled(
    input.targets.map(async (target) => {
      try {
        const response = await input.client.inspect({
          requestBody: {
            inspectionUrl: target.url,
            siteUrl: input.siteUrl,
            languageCode: "en-US",
          },
        });
        return normalizeInspection(target, response);
      } catch (error) {
        const errorCode = classifyError(error);
        console.error("[knowledge-cms-seo] URL inspection request failed.", {
          errorCode,
          path: target.path,
        });
        return {
          path: target.path,
          url: target.url,
          status: "unavailable" as const,
          errorCode,
          sitemaps: [],
          referringUrls: [],
        };
      }
    }),
  );
  const inspections = settled.map((result, index) =>
    result.status === "fulfilled"
      ? result.value
      : {
          path: input.targets[index].path,
          url: input.targets[index].url,
          status: "unavailable" as const,
          errorCode: "request_failed" as const,
          sitemaps: [],
          referringUrls: [],
        },
  );
  const failures = inspections.filter(
    (inspection) => inspection.status === "unavailable",
  );
  return {
    status:
      failures.length === 0
        ? "available"
        : failures.length === inspections.length
          ? "unavailable"
          : "partial",
    inspections,
    ...(failures[0]?.errorCode ? { errorCode: failures[0].errorCode } : {}),
  };
}

export async function verifyKnowledgeCmsSearchConsoleAccess(
  options: VerifyKnowledgeCmsSearchConsoleAccessOptions = {},
): Promise<KnowledgeCmsSearchConsoleAccessCheck> {
  const enabled = isKnowledgeCmsSearchConsoleEnabled(options.enabled);
  if (!enabled) return { status: "disabled" };

  const configuredSiteUrl = options.siteUrl ?? env("SEARCH_CONSOLE_SITE_URL");
  const siteUrl = validSiteUrl(configuredSiteUrl);
  if (!siteUrl) {
    return {
      status: "unconfigured",
      errorCode: "invalid_configuration",
    };
  }

  const current = buildKnowledgeCmsSearchConsolePeriods(options.now).current;
  const client = options.client ?? createClients().analytics;
  try {
    await client.query({
      siteUrl,
      requestBody: {
        startDate: current.startDate,
        endDate: current.endDate,
        dimensions: ["page"],
        dataState: "final",
        type: "web",
        rowLimit: 1,
        startRow: 0,
      },
    });
    return { status: "available", siteUrl };
  } catch (error) {
    const errorCode = classifyError(error);
    console.error("[knowledge-cms-seo] Search Console access verification failed.", {
      errorCode,
    });
    return {
      status: "unavailable",
      siteUrl,
      errorCode,
    };
  }
}

export async function loadKnowledgeCmsSearchConsoleSnapshot(
  options: LoadKnowledgeCmsSearchConsoleOptions = {},
): Promise<KnowledgeCmsSearchConsoleSnapshot> {
  const enabled = isKnowledgeCmsSearchConsoleEnabled(options.enabled);
  if (!enabled) {
    return {
      status: "disabled",
      urlInspectionStatus: "disabled",
      urlInspections: [],
      currentPageRows: [],
      previousPageRows: [],
      currentQueryRows: [],
      previousQueryRows: [],
      currentRows: [],
      previousRows: [],
    };
  }

  const configuredSiteUrl = options.siteUrl ?? env("SEARCH_CONSOLE_SITE_URL");
  const siteUrl = validSiteUrl(configuredSiteUrl);
  if (!siteUrl) {
    return {
      status: "unconfigured",
      urlInspectionStatus: "unconfigured",
      urlInspections: [],
      currentPageRows: [],
      previousPageRows: [],
      currentQueryRows: [],
      previousQueryRows: [],
      currentRows: [],
      previousRows: [],
      errorCode: configuredSiteUrl ? "invalid_configuration" : undefined,
    };
  }

  const periods = buildKnowledgeCmsSearchConsolePeriods(options.now);
  let defaultClients:
    | ReturnType<typeof createClients>
    | undefined;
  const defaults = () => {
    defaultClients ??= createClients();
    return defaultClients;
  };
  const client = options.client ?? defaults().analytics;
  const targets = inspectionTargets(
    options.origin ?? env("NEXT_PUBLIC_SITE_URL"),
    options.inspectionPaths ?? publicMonitoringPaths,
  );
  const inspectionPromise: Promise<{
    status: KnowledgeCmsUrlInspectionStatus;
    inspections: KnowledgeCmsUrlInspectionObservation[];
    errorCode?: KnowledgeCmsSearchConsoleErrorCode;
  }> = !targets
    ? Promise.resolve({
        status: "unconfigured",
        inspections: [],
        errorCode: "invalid_configuration",
      })
    : targets.length === 0
      ? Promise.resolve({ status: "disabled", inspections: [] })
      : loadUrlInspections({
          client: options.inspectionClient ?? defaults().inspection,
          siteUrl,
          targets,
        });
  const rowLimit = configuredRowLimit(options.rowLimit);
  const request = (
    period: KnowledgeCmsSearchConsolePeriod,
    dimensions: Array<"page" | "query">,
  ) =>
    client.query({
      siteUrl,
      requestBody: {
        startDate: period.startDate,
        endDate: period.endDate,
        ...(dimensions.length > 0 ? { dimensions } : {}),
        dataState: "final",
        type: "web",
        rowLimit: dimensions.length > 0 ? rowLimit : 1,
        startRow: 0,
      },
    });

  try {
    const [analytics, inspection] = await Promise.all([
      Promise.all([
        request(periods.current, []),
        request(periods.previous, []),
        request(periods.current, ["page"]),
        request(periods.previous, ["page"]),
        request(periods.current, ["query"]),
        request(periods.previous, ["query"]),
        request(periods.current, ["page", "query"]),
        request(periods.previous, ["page", "query"]),
      ]),
      inspectionPromise,
    ]);
    const [
      currentTotals,
      previousTotals,
      currentPages,
      previousPages,
      currentQueries,
      previousQueries,
      currentPairs,
      previousPairs,
    ] = analytics;
    return {
      status: "available",
      urlInspectionStatus: inspection.status,
      ...(inspection.errorCode
        ? { urlInspectionErrorCode: inspection.errorCode }
        : {}),
      urlInspections: inspection.inspections,
      siteUrl,
      currentPeriod: periods.current,
      previousPeriod: periods.previous,
      currentTotals: normalizeTotals(currentTotals.data.rows),
      previousTotals: normalizeTotals(previousTotals.data.rows),
      currentPageRows: normalizeRows(currentPages.data.rows, ["page"]),
      previousPageRows: normalizeRows(previousPages.data.rows, ["page"]),
      currentQueryRows: normalizeRows(currentQueries.data.rows, ["query"]),
      previousQueryRows: normalizeRows(previousQueries.data.rows, ["query"]),
      currentRows: normalizeRows(currentPairs.data.rows, ["page", "query"]),
      previousRows: normalizeRows(previousPairs.data.rows, ["page", "query"]),
    };
  } catch (error) {
    const inspection = await inspectionPromise;
    console.error("[knowledge-cms-seo] Search Console request failed.", {
      errorCode: classifyError(error),
    });
    return {
      status: "unavailable",
      urlInspectionStatus: inspection.status,
      ...(inspection.errorCode
        ? { urlInspectionErrorCode: inspection.errorCode }
        : {}),
      urlInspections: inspection.inspections,
      siteUrl,
      currentPeriod: periods.current,
      previousPeriod: periods.previous,
      currentPageRows: [],
      previousPageRows: [],
      currentQueryRows: [],
      previousQueryRows: [],
      currentRows: [],
      previousRows: [],
      errorCode: classifyError(error),
    };
  }
}
