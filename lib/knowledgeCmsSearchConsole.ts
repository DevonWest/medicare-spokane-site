import "server-only";

import {
  auth,
  searchconsole,
  type searchconsole_v1,
} from "@googleapis/searchconsole";
import type { KnowledgeCmsSearchMetricRow } from "./knowledgeCmsSeo";
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

export interface LoadKnowledgeCmsSearchConsoleOptions {
  client?: KnowledgeCmsSearchConsoleClient;
  enabled?: string;
  now?: Date;
  rowLimit?: number;
  siteUrl?: string;
}

export type VerifyKnowledgeCmsSearchConsoleAccessOptions = Omit<
  LoadKnowledgeCmsSearchConsoleOptions,
  "rowLimit"
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

function createClient(): KnowledgeCmsSearchConsoleClient {
  const googleAuth = new auth.GoogleAuth({
    scopes: [KNOWLEDGE_CMS_SEARCH_CONSOLE_SCOPE],
  });
  const client = searchconsole({
    version: "v1",
    auth: googleAuth,
  });
  return client.searchanalytics;
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
  const client = options.client ?? createClient();
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
  const client = options.client ?? createClient();
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
    const [
      currentTotals,
      previousTotals,
      currentPages,
      previousPages,
      currentQueries,
      previousQueries,
      currentPairs,
      previousPairs,
    ] = await Promise.all([
      request(periods.current, []),
      request(periods.previous, []),
      request(periods.current, ["page"]),
      request(periods.previous, ["page"]),
      request(periods.current, ["query"]),
      request(periods.previous, ["query"]),
      request(periods.current, ["page", "query"]),
      request(periods.previous, ["page", "query"]),
    ]);
    return {
      status: "available",
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
    console.error("[knowledge-cms-seo] Search Console request failed.", {
      errorCode: classifyError(error),
    });
    return {
      status: "unavailable",
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
