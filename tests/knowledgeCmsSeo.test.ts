import assert from "node:assert/strict";
import test from "node:test";
import type { KnowledgeCmsArticle } from "../lib/knowledgeCms";
import {
  assignKnowledgeCmsQueryPageOwnership,
  buildKnowledgeCmsRecordOpportunities,
  buildKnowledgeCmsSearchOpportunities,
  buildKnowledgeCmsTechnicalOpportunities,
  compareKnowledgeCmsSearchMetrics,
  getKnowledgeCmsSeoObservationHolds,
  sortAndLimitKnowledgeCmsSeoOpportunities,
  summarizeKnowledgeCmsSearchMetrics,
  summarizeKnowledgeCmsSearchTotals,
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

test("site-wide Search Console totals remain authoritative when query rows are privacy-filtered", () => {
  const summary = summarizeKnowledgeCmsSearchTotals(
    { clicks: 26, impressions: 3_696, ctr: 26 / 3_696, position: 23.6 },
    { clicks: 32, impressions: 3_500 },
  );

  assert.equal(summary.clicks, 26);
  assert.equal(summary.impressions, 3_696);
  assert.equal(summary.clickChange, -0.1875);
  assert.equal(summary.position, 23.6);
});

test("query aggregates inherit their dominant page, deduplicate pair findings, and expose observation holds", () => {
  const queryComparisons = compareKnowledgeCmsSearchMetrics(
    [
      {
        page: "",
        query: "health insurance",
        clicks: 1,
        impressions: 350,
        ctr: 1 / 350,
        position: 3.5,
      },
    ],
    [],
  );
  const pairComparisons = compareKnowledgeCmsSearchMetrics(
    [
      {
        page: "https://www.medicareinspokane.com/resources",
        query: "health insurance",
        clicks: 1,
        impressions: 220,
        ctr: 1 / 220,
        position: 3.2,
      },
      {
        page: "https://www.medicareinspokane.com/contact",
        query: "health insurance",
        clicks: 0,
        impressions: 130,
        ctr: 0,
        position: 4,
      },
    ],
    [],
  );
  const owned = assignKnowledgeCmsQueryPageOwnership(
    queryComparisons,
    pairComparisons,
  );

  assert.equal(
    owned[0].page,
    "https://www.medicareinspokane.com/resources",
  );

  const opportunities = sortAndLimitKnowledgeCmsSeoOpportunities([
    ...buildKnowledgeCmsSearchOpportunities(owned, { interventions: [] }),
    ...buildKnowledgeCmsSearchOpportunities(pairComparisons.slice(0, 1), {
      interventions: [],
    }),
  ]);
  assert.equal(
    opportunities.filter(
      (item) => item.kind === "low_click_through_rate",
    ).length,
    1,
  );

  assert.ok(
    getKnowledgeCmsSeoObservationHolds("2026-08-09").some(
      (hold) =>
        hold.path === "/resources" && hold.evaluateAfter === "2026-08-24",
    ),
  );
  assert.equal(getKnowledgeCmsSeoObservationHolds("2026-08-24").length, 0);
});

test("search evidence finds low CTR, striking distance, and material declines", () => {
  const opportunities = buildKnowledgeCmsSearchOpportunities(
    [
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
    ],
    { interventions: [] },
  );
  assert.deepEqual(
    new Set(opportunities.map((item) => item.kind)),
    new Set([
      "low_click_through_rate",
      "striking_distance",
      "declining_performance",
    ]),
  );
});

test("search evidence suppresses low-volume zero-click impression declines outside actionable rankings", () => {
  const lowVolume = buildKnowledgeCmsSearchOpportunities(
    [
      {
        page: "https://www.medicareinspokane.com/medicare-spokane-valley",
        query: "",
        clicks: 0,
        impressions: 50,
        ctr: 0,
        position: 60,
        previousClicks: 0,
        previousImpressions: 109,
        previousCtr: 0,
        previousPosition: 55,
      },
    ],
    { interventions: [] },
  );
  assert.equal(
    lowVolume.some((item) => item.kind === "declining_performance"),
    false,
  );

  const materialVolume = buildKnowledgeCmsSearchOpportunities(
    [
      {
        page: "https://www.medicareinspokane.com/established-page",
        query: "",
        clicks: 0,
        impressions: 300,
        ctr: 0,
        position: 60,
        previousClicks: 0,
        previousImpressions: 600,
        previousCtr: 0,
        previousPosition: 55,
      },
    ],
    { interventions: [] },
  );
  assert.equal(
    materialVolume.some((item) => item.kind === "declining_performance"),
    true,
  );
});

test("page-level evidence surfaces high-impression low-CTR pages even without a named query", () => {
  const opportunities = buildKnowledgeCmsSearchOpportunities(
    [
      {
        page: "https://www.medicareinspokane.com/medicare-supplements",
        query: "",
        clicks: 0,
        impressions: 185,
        ctr: 0,
        position: 18,
        previousClicks: 0,
        previousImpressions: 150,
        previousCtr: 0,
        previousPosition: 20,
      },
    ],
    { interventions: [] },
  );

  assert.ok(
    opportunities.some(
      (item) =>
        item.kind === "low_click_through_rate" &&
        item.page?.endsWith("/medicare-supplements") &&
        item.query === "",
    ),
  );
});

test("search evidence waits for the observation window after a recorded SEO intervention", () => {
  const row = {
    page: "https://www.medicareinspokane.com/contact",
    query: "medicare spokane",
    clicks: 0,
    impressions: 100,
    ctr: 0,
    position: 7,
    previousClicks: 0,
    previousImpressions: 80,
    previousCtr: 0,
    previousPosition: 9,
  };
  const interventions = [
    {
      path: "/contact",
      effectiveDate: "2026-08-10",
      evaluateAfter: "2026-08-24",
    },
  ];

  assert.equal(
    buildKnowledgeCmsSearchOpportunities([row], {
      evidenceThrough: "2026-08-08",
      interventions,
    }).length,
    0,
  );
  assert.ok(
    buildKnowledgeCmsSearchOpportunities([row], {
      evidenceThrough: "2026-08-24",
      interventions,
    }).length > 0,
  );
});

test("search evidence ignores FMO queries that do not match the consumer site", () => {
  const opportunities = buildKnowledgeCmsSearchOpportunities(
    [
      {
        page: "https://www.medicareinspokane.com/",
        query: "medicare fmo in spokane",
        clicks: 0,
        impressions: 100,
        ctr: 0,
        position: 5,
        previousClicks: 0,
        previousImpressions: 50,
        previousCtr: 0,
        previousPosition: 8,
      },
    ],
    { interventions: [] },
  );

  assert.equal(opportunities.length, 0);
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

test("record audit does not treat a published indexing-blocked control note as public body content", () => {
  const control = article({
    status: "published",
    body: "Private migration control note only.",
    discoverability: {
      ...article().discoverability,
      indexing: "blocked",
    },
  });
  const opportunities = buildKnowledgeCmsRecordOpportunities([control]);

  assert.equal(
    opportunities.some((item) => item.title.startsWith("Build out")),
    false,
  );
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
