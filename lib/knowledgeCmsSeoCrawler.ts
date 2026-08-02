import "server-only";

import type {
  KnowledgeCmsRecord,
} from "./knowledgeCms";
import type {
  KnowledgeCmsSeoPageObservation,
  KnowledgeCmsSeoSiteObservation,
} from "./knowledgeCmsSeo";
import { env } from "./runtimeValues";

const MAX_CRAWL_PAGES = 50;
const MAX_HTML_BYTES = 2_000_000;
const REQUEST_TIMEOUT_MS = 12_000;
const CRAWLER_USER_AGENT = "MedicareInSpokane-SEO-Monitor/1.0";

type CrawlerFetch = typeof fetch;

export interface KnowledgeCmsSeoCrawlResult {
  origin: string;
  pages: KnowledgeCmsSeoPageObservation[];
  site: KnowledgeCmsSeoSiteObservation;
}

export interface CrawlKnowledgeCmsSiteOptions {
  fetcher?: CrawlerFetch;
  origin?: string;
  pageLimit?: number;
}

function resolveOrigin(value: string | undefined): URL {
  const configured = value?.trim();
  if (!configured) {
    throw new Error("NEXT_PUBLIC_SITE_URL is required for the SEO crawler.");
  }

  const parsed = new URL(configured);
  const isLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (
    (parsed.protocol !== "https:" && !(isLocal && parsed.protocol === "http:")) ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a bare HTTPS origin.");
  }
  return parsed;
}

function configuredPageLimit(value: number | undefined): number {
  if (!Number.isInteger(value) || !value || value < 1) {
    return MAX_CRAWL_PAGES;
  }
  return Math.min(value, MAX_CRAWL_PAGES);
}

function canonicalPaths(records: ReadonlyArray<KnowledgeCmsRecord>, limit: number): string[] {
  const paths = new Set<string>();
  for (const record of records) {
    const path = record.discoverability.canonicalPath;
    if (
      path &&
      /^\/(?!\/)[A-Za-z0-9/_-]*$/.test(path) &&
      !path.includes("..") &&
      record.relationships.existingPaths.includes(path)
    ) {
      paths.add(path);
    }
  }
  return [...paths].sort().slice(0, limit);
}

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function attribute(tag: string, name: string): string | undefined {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tag.match(
    new RegExp(
      `(?:^|\\s)${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
      "i",
    ),
  );
  return decodeHtml(match?.[1] ?? match?.[2] ?? match?.[3] ?? "") || undefined;
}

function metaContent(html: string, key: "description" | "robots"): string | undefined {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    if (attribute(tag, "name")?.toLowerCase() === key) {
      return attribute(tag, "content");
    }
  }
  return undefined;
}

function canonicalHref(html: string): string | undefined {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    const rel = attribute(tag, "rel")?.toLowerCase().split(/\s+/) ?? [];
    if (rel.includes("canonical")) {
      return attribute(tag, "href");
    }
  }
  return undefined;
}

export function inspectKnowledgeCmsSeoHtml(
  path: string,
  status: number,
  html: string,
  origin: string,
): KnowledgeCmsSeoPageObservation {
  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const internalLinks = new Set<string>();
  for (const match of html.matchAll(/<a\b[^>]*>/gi)) {
    const href = attribute(match[0], "href");
    if (!href) continue;
    try {
      const url = new URL(href, origin);
      if (url.origin === origin) {
        internalLinks.add(`${url.pathname}${url.search}`);
      }
    } catch {
      // Malformed links are ignored here; other site checks can report them.
    }
  }

  return {
    path,
    status,
    ...(titleMatch?.[1] ? { title: decodeHtml(titleMatch[1].replace(/<[^>]+>/g, "")) } : {}),
    ...(metaContent(html, "description")
      ? { description: metaContent(html, "description") }
      : {}),
    ...(canonicalHref(html) ? { canonical: canonicalHref(html) } : {}),
    ...(metaContent(html, "robots") ? { robots: metaContent(html, "robots") } : {}),
    h1Count: [...html.matchAll(/<h1\b[^>]*>/gi)].length,
    internalLinkCount: internalLinks.size,
  };
}

async function boundedFetch(
  fetcher: CrawlerFetch,
  url: URL,
  accept: string,
): Promise<Response> {
  return fetcher(url, {
    cache: "no-store",
    headers: {
      accept,
      "user-agent": CRAWLER_USER_AGENT,
    },
    redirect: "manual",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

async function crawlPage(
  fetcher: CrawlerFetch,
  origin: URL,
  path: string,
): Promise<KnowledgeCmsSeoPageObservation> {
  try {
    const response = await boundedFetch(fetcher, new URL(path, origin), "text/html");
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.includes("text/html")) {
      return {
        path,
        status: response.status,
        h1Count: 0,
        internalLinkCount: 0,
        errorCode: "invalid_content_type",
      };
    }
    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_HTML_BYTES) {
      return {
        path,
        status: response.status,
        h1Count: 0,
        internalLinkCount: 0,
        errorCode: "response_too_large",
      };
    }
    const html = await response.text();
    if (new TextEncoder().encode(html).byteLength > MAX_HTML_BYTES) {
      return {
        path,
        status: response.status,
        h1Count: 0,
        internalLinkCount: 0,
        errorCode: "response_too_large",
      };
    }
    return inspectKnowledgeCmsSeoHtml(path, response.status, html, origin.origin);
  } catch {
    return {
      path,
      status: null,
      h1Count: 0,
      internalLinkCount: 0,
      errorCode: "fetch_failed",
    };
  }
}

async function checkSiteResource(
  fetcher: CrawlerFetch,
  origin: URL,
  path: string,
  expected: RegExp,
  accept: string,
): Promise<boolean> {
  try {
    const response = await boundedFetch(fetcher, new URL(path, origin), accept);
    if (response.status !== 200) return false;
    const body = (await response.text()).slice(0, 250_000);
    return expected.test(body);
  } catch {
    return false;
  }
}

export async function crawlKnowledgeCmsSite(
  records: ReadonlyArray<KnowledgeCmsRecord>,
  options: CrawlKnowledgeCmsSiteOptions = {},
): Promise<KnowledgeCmsSeoCrawlResult> {
  const origin = resolveOrigin(options.origin ?? env("NEXT_PUBLIC_SITE_URL"));
  const fetcher = options.fetcher ?? fetch;
  const paths = canonicalPaths(records, configuredPageLimit(options.pageLimit));

  const [pages, healthOk, sitemapOk, robotsOk] = await Promise.all([
    Promise.all(paths.map((path) => crawlPage(fetcher, origin, path))),
    checkSiteResource(fetcher, origin, "/healthz", /"status"\s*:\s*"ok"/i, "application/json"),
    checkSiteResource(fetcher, origin, "/sitemap.xml", /<urlset\b/i, "application/xml,text/xml"),
    checkSiteResource(fetcher, origin, "/robots.txt", /user-agent\s*:/i, "text/plain"),
  ]);

  return {
    origin: origin.origin,
    pages,
    site: { healthOk, sitemapOk, robotsOk },
  };
}
