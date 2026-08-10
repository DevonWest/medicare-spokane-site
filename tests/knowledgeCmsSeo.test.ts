import assert from "node:assert/strict";
import test from "node:test";
import type { KnowledgeCmsArticle } from "../lib/knowledgeCms";
import {
  buildKnowledgeCmsRecordOpportunities,
  buildKnowledgeCmsSearchOpportunities,
  buildKnowledgeCmsTechnicalOpportunities,
  compareKnowledgeCmsSearchMetrics,
  summarizeKnowledgeCmsSearchMetrics,
} from "../lib/knowledgeCmsSeo";

function article(overrides: Partial<KnowledgeCmsArticle> = {}): KnowledgeCmsArticle {
  return {
    schemaVersion: 1,
    id: "article-one",
    kind: "article",
    slug: "medicare-review-spokane",
    status: "draft",
    ownerId: "admin-one",
    title: "Medicare Review in Spokane",
    summary: "A useful review guide for Spokane Medicare beneficiaries.",
    body: Array.from({ length: 400 }, (_, index) => `word${index}`).join(" "),
    bodyFormat: "markdown",
    searchTerms: ["medicare review spokane"],
    relationships: {
      articleIds: [],
      topicIds: ["reviewing-coverage"],
      faqIds: [],
      citySlugs: ["spokane"],
      agentSlugs: [],
      carrierNames: [],
      existingPaths: ["/medicare-review-spokane"],
    },
    sources: [
      {
        id: "medicare-review",
        kind: "official",
        title: "Medicare health and drug plans",
        publisher: "Medicare.gov",
        url: "https://www.medicare.gov/health-drug-plans",
        checkedAt: "2026-07-01",
        reviewDueAt: "2026-12-28",
      },
    ],
    discoverability: {
      pageTitle: "Medicare Review in Spokane, Washington",
      description:
        "Review Medicare coverage, prescriptions, doctors, pharmacies, and costs with practical help for Spokane residents before making a coverage decision.",
      canonicalPath: "/medicare-review-spokane",
      indexing: "blocked",
    },
    audit: {
      revision: 1,
      createdAt: "2026-07-01T00:00:00.000Z",
      createdBy: "admin-one",
      updatedAt: "2026-07-01T00:00:00.000Z",
      updatedBy: "admin-one",
    },
    ...overrides,
  };
}

test("Search Console rows compare exact page-query pairs and summarize performance", () => {
  const comparisons = compareKnowledgeCmsSearchMetrics(
    [
      {
        page: "https://www.medicareinspokane.com/part-d",
        query: "medicare part d spokane",
        clicks: 12,
        impressions: 300,
        ctr: 0.04,
        position: 7,
      },
    ],
    [
      {
        page: "https://www.medicareinspokane.com/part-d",
        query: "medicare part d spokane",
        clicks: 20,
        impressions: 400,
        ctr: 0.05,
        position: 6,
      },
    ],
  );
  assert.equal(comparisons[0].previousClicks, 20);
  const summary = summarizeKnowledgeCmsSearchMetrics(comparisons);
  assert.equal(summary.clicks, 12);
  assert.equal(summary.clickChange, -0.4);
  assert.equal(summary.position, 7);
});

test("search evidence finds low CTR, striking distance, and material declines", () => {
  const opportunities = buildKnowledgeCmsSearchOpportunities([
    {
      page: "https://www.medicareinspokane.com/part-d",
      query: "medicare part d spokane",
      clicks: 4,
      impressions: 300,
      ctr: 0.013,
      position: 7,
      previousClicks: 20,
      previousImpressions: 500,
      previousCtr: 0.04,
      previousPosition: 5,
    },
  ]);
  assert.deepEqual(
    new Set(opportunities.map((item) => item.kind)),
    new Set([
      "low_click_through_rate",
      "striking_distance",
      "declining_performance",
    ]),
  );
});

test("record audit prioritizes expired governed sources and incomplete content", () => {
  const incomplete = article({
    body: "Too short.",
    searchTerms: [],
    relationships: {
      articleIds: [],
      topicIds: [],
      faqIds: [],
      citySlugs: [],
      agentSlugs: [],
      carrierNames: [],
      existingPaths: [],
    },
    sources: [
      {
        ...article().sources[0],
        reviewDueAt: "2026-07-01",
      },
    ],
  });
  const opportunities = buildKnowledgeCmsRecordOpportunities(
    [incomplete],
    new Date("2026-08-01T00:00:00.000Z"),
  );
  assert.ok(opportunities.some((item) => item.priority === "high" && item.kind === "source_freshness"));
  assert.ok(opportunities.some((item) => item.title.startsWith("Build out")));
  assert.ok(opportunities.some((item) => item.title.startsWith("Connect")));
});

test("technical audit respects beta noindex and still catches production noindex", () => {
  const pages = [
    {
      path: "/part-d",
      status: 200,
      title: "Medicare Part D",
      description: "Drug plan help in Spokane.",
      canonical: "https://www.medicareinspokane.com/part-d",
      robots: "noindex,nofollow",
      h1Count: 1,
      internalLinkCount: 4,
    },
  ];
  const site = { healthOk: true, sitemapOk: true, robotsOk: true };
  assert.equal(
    buildKnowledgeCmsTechnicalOpportunities(pages, site, {
      expectIndexing: false,
    }).length,
    0,
  );
  assert.ok(
    buildKnowledgeCmsTechnicalOpportunities(pages, site, {
      expectIndexing: true,
    }).some((item) => item.title.includes("noindex")),
  );
});

test("technical audit reports the public deployment endpoint instead of the internal probe", () => {
  const opportunities = buildKnowledgeCmsTechnicalOpportunities([], {
    healthOk: false,
    sitemapOk: true,
    robotsOk: true,
  });
  const health = opportunities.find(
    (item) => item.page === "/api/deployment-health",
  );

  assert.equal(health?.title, "Repair the public deployment health check");
  assert.match(
    health?.recommendation ?? "",
    /Keep \/healthz reserved for container probes/,
  );
});
