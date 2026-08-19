import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import type { KnowledgeCmsArticle } from "../lib/knowledgeCms";

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

function record(): KnowledgeCmsArticle {
  return {
    schemaVersion: 1,
    id: "part-d",
    kind: "article",
    slug: "part-d",
    status: "published",
    ownerId: "admin",
    title: "Part D",
    summary: "Part D help.",
    body: "Body",
    bodyFormat: "markdown",
    searchTerms: ["part d"],
    relationships: {
      articleIds: [], topicIds: [], faqIds: [], citySlugs: ["spokane"],
      agentSlugs: [], carrierNames: [], existingPaths: ["/part-d"],
    },
    sources: [],
    discoverability: {
      canonicalPath: "/part-d",
      indexing: "blocked",
    },
    publication: {
      publishedAt: "2026-08-01T00:00:00.000Z",
      publishedBy: "admin",
    },
    audit: {
      revision: 2,
      createdAt: "2026-08-01T00:00:00.000Z",
      createdBy: "admin",
      updatedAt: "2026-08-01T00:00:00.000Z",
      updatedBy: "admin",
    },
  };
}

test("Search Console uses two stable 28-day periods and normalizes rows", async () => {
  mockServerOnlyModule();
  const searchConsole = await import("../lib/knowledgeCmsSearchConsole");
  const calls: Array<Record<string, unknown>> = [];
  const inspectionCalls: Array<Record<string, unknown>> = [];
  const snapshot = await searchConsole.loadKnowledgeCmsSearchConsoleSnapshot({
    enabled: "true",
    siteUrl: "sc-domain:medicareinspokane.com",
    origin: "https://www.medicareinspokane.com",
    inspectionPaths: ["/part-d"],
    now: new Date("2026-08-01T12:00:00.000Z"),
    client: {
      async query(input) {
        calls.push(input as unknown as Record<string, unknown>);
        const dimensions = input.requestBody.dimensions ?? [];
        if (dimensions.length === 0) {
          return {
            data: {
              rows: [{ clicks: 26, impressions: 3_696, ctr: 26 / 3_696, position: 23.6 }],
            },
          };
        }
        if (dimensions.length === 1 && dimensions[0] === "page") {
          return {
            data: {
              rows: [{
                keys: ["https://www.medicareinspokane.com/part-d"],
                clicks: 5,
                impressions: 100,
                ctr: 0.05,
                position: 8,
              }],
            },
          };
        }
        if (dimensions.length === 1 && dimensions[0] === "query") {
          return {
            data: {
              rows: [{
                keys: ["part d spokane"],
                clicks: 5,
                impressions: 100,
                ctr: 0.05,
                position: 8,
              }],
            },
          };
        }
        return {
          data: {
            rows: [
              {
                keys: ["https://www.medicareinspokane.com/part-d", "part d spokane"],
                clicks: 5,
                impressions: 100,
                ctr: 0.05,
                position: 8,
              },
            ],
          },
        };
      },
    },
    inspectionClient: {
      async inspect(input) {
        inspectionCalls.push(input as unknown as Record<string, unknown>);
        return {
          data: {
            inspectionResult: {
              inspectionResultLink: "https://search.google.com/search-console/inspect/example",
              indexStatusResult: {
                verdict: "PASS",
                coverageState: "Submitted and indexed",
                robotsTxtState: "ALLOWED",
                indexingState: "INDEXING_ALLOWED",
                pageFetchState: "SUCCESSFUL",
                lastCrawlTime: "2026-07-29T10:00:00Z",
                googleCanonical: "https://www.medicareinspokane.com/part-d",
                userCanonical: "https://www.medicareinspokane.com/part-d",
                sitemap: ["https://www.medicareinspokane.com/sitemap.xml"],
              },
            },
          },
        };
      },
    },
  });
  assert.equal(snapshot.status, "available");
  assert.deepEqual(snapshot.currentPeriod, {
    startDate: "2026-07-02",
    endDate: "2026-07-29",
  });
  assert.deepEqual(snapshot.previousPeriod, {
    startDate: "2026-06-04",
    endDate: "2026-07-01",
  });
  assert.equal(calls.length, 8);
  assert.equal(inspectionCalls.length, 1);
  assert.deepEqual(inspectionCalls[0].requestBody, {
    inspectionUrl: "https://www.medicareinspokane.com/part-d",
    siteUrl: "sc-domain:medicareinspokane.com",
    languageCode: "en-US",
  });
  assert.equal(snapshot.urlInspectionStatus, "available");
  assert.equal(snapshot.urlInspections?.[0].verdict, "PASS");
  assert.equal(
    snapshot.urlInspections?.[0].googleCanonical,
    "https://www.medicareinspokane.com/part-d",
  );
  assert.equal(snapshot.currentTotals?.clicks, 26);
  assert.equal(snapshot.currentTotals?.impressions, 3_696);
  assert.equal(snapshot.currentPageRows[0].page, "https://www.medicareinspokane.com/part-d");
  assert.equal(snapshot.currentPageRows[0].query, "");
  assert.equal(snapshot.currentQueryRows[0].page, "");
  assert.equal(snapshot.currentQueryRows[0].query, "part d spokane");
  assert.equal(snapshot.currentRows[0].query, "part d spokane");
});

test("URL inspection retains exact watched routes and reports partial API failures", async () => {
  mockServerOnlyModule();
  const searchConsole = await import("../lib/knowledgeCmsSearchConsole");
  const snapshot = await searchConsole.loadKnowledgeCmsSearchConsoleSnapshot({
    enabled: "true",
    siteUrl: "sc-domain:medicareinspokane.com",
    origin: "https://www.medicareinspokane.com",
    inspectionPaths: [
      "/2027-medicare-changes-spokane",
      "/costco-scan-medicare-spokane",
    ],
    client: {
      async query() {
        return { data: {} };
      },
    },
    inspectionClient: {
      async inspect(input) {
        if (input.requestBody.inspectionUrl?.includes("costco")) {
          throw Object.assign(new Error("quota"), { code: 429 });
        }
        return {
          data: {
            inspectionResult: {
              indexStatusResult: {
                verdict: "NEUTRAL",
                coverageState: "Discovered - currently not indexed",
                robotsTxtState: "ALLOWED",
                indexingState: "INDEXING_ALLOWED",
              },
            },
          },
        };
      },
    },
  });

  assert.equal(snapshot.status, "available");
  assert.equal(snapshot.urlInspectionStatus, "partial");
  assert.equal(snapshot.urlInspectionErrorCode, "quota_exceeded");
  assert.deepEqual(
    snapshot.urlInspections?.map((inspection) => [
      inspection.path,
      inspection.status,
    ]),
    [
      ["/2027-medicare-changes-spokane", "available"],
      ["/costco-scan-medicare-spokane", "unavailable"],
    ],
  );
});

test("Search Console fails closed when the feature is disabled or site property is invalid", async () => {
  mockServerOnlyModule();
  const searchConsole = await import("../lib/knowledgeCmsSearchConsole");
  assert.equal(
    (await searchConsole.loadKnowledgeCmsSearchConsoleSnapshot({ enabled: "false" })).status,
    "disabled",
  );
  const invalid = await searchConsole.loadKnowledgeCmsSearchConsoleSnapshot({
    enabled: "true",
    siteUrl: "http://example.com",
  });
  assert.equal(invalid.status, "unconfigured");
  assert.equal(invalid.errorCode, "invalid_configuration");
});

test("Search Console activation uses one read-only, one-row analytics request", async () => {
  mockServerOnlyModule();
  const searchConsole = await import("../lib/knowledgeCmsSearchConsole");
  const calls: Array<Record<string, unknown>> = [];
  const result = await searchConsole.verifyKnowledgeCmsSearchConsoleAccess({
    enabled: "true",
    siteUrl: "sc-domain:medicareinspokane.com",
    now: new Date("2026-08-01T12:00:00.000Z"),
    client: {
      async query(input) {
        calls.push(input as unknown as Record<string, unknown>);
        return { data: {} };
      },
    },
  });
  assert.deepEqual(result, {
    status: "available",
    siteUrl: "sc-domain:medicareinspokane.com",
  });
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].requestBody, {
    startDate: "2026-07-02",
    endDate: "2026-07-29",
    dimensions: ["page"],
    dataState: "final",
    type: "web",
    rowLimit: 1,
    startRow: 0,
  });
});

test("crawler extracts rendered SEO signals and never follows off-origin links", async () => {
  mockServerOnlyModule();
  const crawler = await import("../lib/knowledgeCmsSeoCrawler");
  const requested: string[] = [];
  const fakeFetch: typeof fetch = async (input) => {
    const url = input instanceof URL ? input : new URL(String(input));
    requested.push(url.toString());
    if (url.pathname === "/api/deployment-health") {
      return new Response('{"status":"ok"}', {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    if (url.pathname === "/sitemap.xml") {
      return new Response("<urlset></urlset>", { status: 200 });
    }
    if (url.pathname === "/robots.txt") {
      return new Response("User-agent: *\nAllow: /", { status: 200 });
    }
    return new Response(
      `<html><head><title>Part D Spokane</title><meta name="description" content="Useful help"><meta name="robots" content="index,follow"><link href="${url.origin}${url.pathname}" rel="canonical"></head><body><h1>Part D</h1><a href="/contact">Contact</a><a href="https://competitor.example/page">Other</a></body></html>`,
      { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
    );
  };
  const result = await crawler.crawlKnowledgeCmsSite([record()], {
    origin: "https://www.medicareinspokane.com",
    fetcher: fakeFetch,
  });
  assert.deepEqual(result.site, { healthOk: true, sitemapOk: true, robotsOk: true });
  assert.equal(result.pages[0].title, "Part D Spokane");
  assert.equal(result.pages[0].h1Count, 1);
  assert.equal(result.pages[0].internalLinkCount, 1);
  assert.equal(
    requested.includes(
      "https://www.medicareinspokane.com/api/deployment-health",
    ),
    true,
  );
  assert.equal(
    requested.includes("https://www.medicareinspokane.com/healthz"),
    false,
  );
  assert.equal(
    requested.includes(
      "https://www.medicareinspokane.com/2027-medicare-changes-spokane",
    ),
    true,
  );
  assert.equal(
    requested.includes(
      "https://www.medicareinspokane.com/costco-scan-medicare-spokane",
    ),
    true,
  );
  assert.equal(
    requested.includes(
      "https://www.medicareinspokane.com/providence-health-plan-ending-2027-washington",
    ),
    true,
  );
  assert.equal(requested.some((url) => url.includes("competitor.example")), false);
});

test("crawler reserves its page budget for safe non-CMS monitoring routes", async () => {
  mockServerOnlyModule();
  const crawler = await import("../lib/knowledgeCmsSeoCrawler");
  const requestedPaths: string[] = [];
  const fakeFetch: typeof fetch = async (input) => {
    const url = input instanceof URL ? input : new URL(String(input));
    requestedPaths.push(url.pathname);
    if (url.pathname === "/api/deployment-health") {
      return new Response('{"status":"ok"}', { status: 200 });
    }
    if (url.pathname === "/sitemap.xml") {
      return new Response("<urlset></urlset>", { status: 200 });
    }
    if (url.pathname === "/robots.txt") {
      return new Response("User-agent: *\nAllow: /", { status: 200 });
    }
    return new Response(
      `<html><head><title>${url.pathname}</title><link href="${url.origin}${url.pathname}" rel="canonical"></head><body><h1>Page</h1></body></html>`,
      { status: 200, headers: { "content-type": "text/html" } },
    );
  };

  const result = await crawler.crawlKnowledgeCmsSite([record()], {
    origin: "https://www.medicareinspokane.com",
    fetcher: fakeFetch,
    monitoringPaths: [
      "/costco-scan-medicare-spokane",
      "https://competitor.example/page",
      "//competitor.example/page",
      "/../admin",
    ],
    pageLimit: 2,
  });

  assert.deepEqual(
    result.pages.map((page) => page.path),
    ["/part-d", "/costco-scan-medicare-spokane"],
  );
  assert.equal(requestedPaths.includes("/admin"), false);
});

test("crawler rejects a configured origin containing a path or insecure public protocol", async () => {
  mockServerOnlyModule();
  const crawler = await import("../lib/knowledgeCmsSeoCrawler");
  await assert.rejects(
    crawler.crawlKnowledgeCmsSite([record()], { origin: "https://example.com/path" }),
    /bare HTTPS origin/,
  );
  await assert.rejects(
    crawler.crawlKnowledgeCmsSite([record()], { origin: "http://example.com" }),
    /bare HTTPS origin/,
  );
});

test("SEO scan orchestrates CMS, crawl, and Search Console evidence into one saved snapshot", async () => {
  mockServerOnlyModule();
  const previousGate = process.env.KNOWLEDGE_CMS_SEO_ENABLED;
  process.env.KNOWLEDGE_CMS_SEO_ENABLED = "true";
  try {
    const seoDal = await import("../lib/knowledgeCmsSeoDal");
    let saved: import("../lib/knowledgeCmsSeoDal").KnowledgeCmsSeoScan | undefined;
    const scan = await seoDal.runKnowledgeCmsSeoScan(
      {
        actor: { id: "seo-admin", roles: ["admin"] },
        trigger: "scheduled",
      },
      {
        now: () => new Date("2026-08-01T12:00:00.000Z"),
        repository: {
          async list(query) {
            return query.kind === "article" ? [record()] : [];
          },
        },
        crawl: async () => ({
          origin: "https://www.medicareinspokane.com",
          site: { healthOk: true, sitemapOk: true, robotsOk: true },
          pages: [
            {
              path: "/part-d",
              status: 200,
              title: "Part D",
              description: "Part D help.",
              canonical: "https://www.medicareinspokane.com/part-d",
              h1Count: 1,
              internalLinkCount: 3,
            },
          ],
        }),
        searchConsole: async () => ({
          status: "available",
          urlInspectionStatus: "available",
          urlInspections: [
            {
              path: "/2027-medicare-changes-spokane",
              url: "https://www.medicareinspokane.com/2027-medicare-changes-spokane",
              status: "available",
              verdict: "NEUTRAL",
              coverageState: "Discovered - currently not indexed",
              robotsTxtState: "ALLOWED",
              indexingState: "INDEXING_ALLOWED",
              sitemaps: [],
              referringUrls: [],
            },
            {
              path: "/costco-scan-medicare-spokane",
              url: "https://www.medicareinspokane.com/costco-scan-medicare-spokane",
              status: "available",
              verdict: "PASS",
              coverageState: "Submitted and indexed",
              robotsTxtState: "ALLOWED",
              indexingState: "INDEXING_ALLOWED",
              pageFetchState: "SUCCESSFUL",
              googleCanonical:
                "https://www.medicareinspokane.com/costco-scan-medicare-spokane",
              userCanonical:
                "https://www.medicareinspokane.com/costco-scan-medicare-spokane",
              sitemaps: ["https://www.medicareinspokane.com/sitemap.xml"],
              referringUrls: [],
            },
          ],
          currentTotals: {
            clicks: 26,
            impressions: 3_696,
            ctr: 26 / 3_696,
            position: 23.6,
          },
          previousTotals: {
            clicks: 20,
            impressions: 3_200,
            ctr: 20 / 3_200,
            position: 25,
          },
          currentPageRows: [
            {
              page: "https://www.medicareinspokane.com/part-d",
              query: "",
              clicks: 2,
              impressions: 100,
              ctr: 0.02,
              position: 9,
            },
            {
              page:
                "https://www.medicareinspokane.com/costco-scan-medicare-spokane",
              query: "",
              clicks: 1,
              impressions: 45,
              ctr: 1 / 45,
              position: 11,
            },
          ],
          previousPageRows: [],
          currentQueryRows: [
            {
              page: "",
              query: "part d spokane",
              clicks: 2,
              impressions: 100,
              ctr: 0.02,
              position: 9,
            },
          ],
          previousQueryRows: [],
          currentRows: [
            {
              page: "https://www.medicareinspokane.com/part-d",
              query: "part d spokane",
              clicks: 2,
              impressions: 100,
              ctr: 0.02,
              position: 9,
            },
            {
              page:
                "https://www.medicareinspokane.com/costco-scan-medicare-spokane",
              query: "costco scan medicare spokane",
              clicks: 1,
              impressions: 45,
              ctr: 1 / 45,
              position: 11,
            },
          ],
          previousRows: [],
        }),
        store: {
          async save(value) {
            saved = value;
          },
          async latest() {
            return saved;
          },
        },
      },
    );
    assert.equal(scan.trigger, "scheduled");
    assert.equal(scan.searchConsoleStatus, "available");
    assert.equal(scan.urlInspectionStatus, "available");
    assert.equal(scan.searchMetrics.clicks, 26);
    assert.equal(scan.searchMetrics.impressions, 3_696);
    assert.equal(scan.searchEvidence?.pages[0].query, "");
    assert.equal(scan.searchEvidence?.queries[0].query, "part d spokane");
    assert.equal(
      scan.searchEvidence?.queries[0].page,
      "https://www.medicareinspokane.com/part-d",
    );
    const watchedCostco = scan.watchedPages?.find(
      (page) => page.path === "/costco-scan-medicare-spokane",
    );
    assert.equal(watchedCostco?.inspection?.verdict, "PASS");
    assert.equal(watchedCostco?.searchMetrics?.impressions, 45);
    assert.equal(
      watchedCostco?.queries[0].query,
      "costco scan medicare spokane",
    );
    assert.ok(
      scan.opportunities.some(
        (item) =>
          item.page === "/2027-medicare-changes-spokane" &&
          item.title.startsWith("Get "),
      ),
    );
    assert.ok(
      scan.observationHolds?.some((hold) => hold.path === "/resources"),
    );
    assert.equal(scan.summary.recordsAudited, 1);
    assert.ok(scan.opportunities.some((item) => item.kind === "low_click_through_rate"));
    assert.equal(saved?.id, scan.id);
  } finally {
    if (previousGate === undefined) delete process.env.KNOWLEDGE_CMS_SEO_ENABLED;
    else process.env.KNOWLEDGE_CMS_SEO_ENABLED = previousGate;
  }
});
