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
  const snapshot = await searchConsole.loadKnowledgeCmsSearchConsoleSnapshot({
    enabled: "true",
    siteUrl: "sc-domain:medicareinspokane.com",
    now: new Date("2026-08-01T12:00:00.000Z"),
    client: {
      async query(input) {
        calls.push(input as unknown as Record<string, unknown>);
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
  assert.equal(calls.length, 2);
  assert.equal(snapshot.currentRows[0].query, "part d spokane");
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

test("crawler extracts rendered SEO signals and never follows off-origin links", async () => {
  mockServerOnlyModule();
  const crawler = await import("../lib/knowledgeCmsSeoCrawler");
  const requested: string[] = [];
  const fakeFetch: typeof fetch = async (input) => {
    const url = input instanceof URL ? input : new URL(String(input));
    requested.push(url.toString());
    if (url.pathname === "/healthz") {
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
      '<html><head><title>Part D Spokane</title><meta name="description" content="Useful help"><meta name="robots" content="index,follow"><link href="https://www.medicareinspokane.com/part-d" rel="canonical"></head><body><h1>Part D</h1><a href="/contact">Contact</a><a href="https://competitor.example/page">Other</a></body></html>',
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
  assert.equal(requested.some((url) => url.includes("competitor.example")), false);
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
          currentRows: [
            {
              page: "https://www.medicareinspokane.com/part-d",
              query: "part d spokane",
              clicks: 2,
              impressions: 100,
              ctr: 0.02,
              position: 9,
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
    assert.equal(scan.summary.recordsAudited, 1);
    assert.ok(scan.opportunities.some((item) => item.kind === "low_click_through_rate"));
    assert.equal(saved?.id, scan.id);
  } finally {
    if (previousGate === undefined) delete process.env.KNOWLEDGE_CMS_SEO_ENABLED;
    else process.env.KNOWLEDGE_CMS_SEO_ENABLED = previousGate;
  }
});
