import assert from "node:assert/strict";
import test from "node:test";
import sitemap from "../app/sitemap";
import {
  buildKnowledgePageSchema,
  getFeaturedKnowledgeSources,
  getKnowledgeGraph,
  getKnowledgeSections,
  getRelatedKnowledgeEntries,
  isKnowledgeReviewExpired,
  isKnowledgeSourceExpired,
  knowledgeEntries,
  validateKnowledgeCenter,
} from "../lib/knowledgeCenter";
import { siteConfig } from "../lib/site";

test("knowledge center registry has valid references and canonical paths", () => {
  assert.deepEqual(validateKnowledgeCenter("2026-07-30"), []);
  assert.equal(
    new Set(knowledgeEntries.map((entry) => entry.path)).size,
    knowledgeEntries.length,
  );
});

test("every public resource guide has at least one official source", () => {
  const listedEntries = getKnowledgeSections().flatMap(
    (section) => section.items,
  );

  assert.deepEqual(
    listedEntries
      .filter((entry) => (entry.sourceIds ?? []).length === 0)
      .map((entry) => entry.path),
    [],
  );
});

test("resource library sections preserve their public order and 20 listed guides", () => {
  const sections = getKnowledgeSections();

  assert.deepEqual(
    sections.map((section) => section.title),
    [
      "Getting Started with Medicare",
      "Reviewing or Changing Coverage",
      "Family / Caregiver Help",
      "Working and Medicare",
      "Health Insurance Help",
      "More Spokane Medicare Resources",
    ],
  );
  assert.equal(
    sections.flatMap((section) => section.items).length,
    20,
  );
  assert.deepEqual(
    sections[0]?.items.map((entry) => entry.path),
    [
      "/turning-65-medicare-spokane",
      "/compare-medicare-options",
      "/medicare-appointment-checklist",
    ],
  );
});

test("explicit relationships retain editorial order before automatic matches", () => {
  assert.deepEqual(
    getRelatedKnowledgeEntries("/turning-65-medicare-spokane", 5).map(
      (entry) => entry.path,
    ),
    [
      "/compare-medicare-options",
      "/medicare-advantage",
      "/medicare-supplements",
      "/medicare-part-d",
      "/rx-drug-review",
    ],
  );
});

test("automatic relationships connect entries that share topics and tags", () => {
  const relatedPaths = getRelatedKnowledgeEntries(
    "/medicare-part-d",
    8,
  ).map((entry) => entry.path);

  assert.ok(relatedPaths.includes("/rx-drug-review"));
  assert.ok(relatedPaths.includes("/medicare-plan-review-spokane"));
  assert.ok(relatedPaths.includes("/compare-medicare-options"));
});

test("knowledge graph resolves topics, agents, carriers, cities, FAQs, and sources", () => {
  const graph = getKnowledgeGraph("/helping-parent-with-medicare");

  assert.ok(graph);
  assert.deepEqual(
    graph.topics.map((topic) => topic.slug),
    ["medicare-advantage", "medicare-supplement", "medicare-part-d"],
  );
  assert.ok(graph.agents.length > 0);
  assert.ok(graph.carriers.length > 0);
  assert.deepEqual(
    graph.cities.map((city) => city.slug),
    ["spokane"],
  );
  assert.ok(graph.faqs.some((faq) => faq.id === "provider-access"));
  assert.ok(graph.faqs.some((faq) => faq.id === "part-d-basics"));
  assert.deepEqual(
    graph.sources.map((source) => source.id),
    ["medicare-coverage-options", "medicare-part-d"],
  );
  assert.equal(graph.reviewer, undefined);
});

test("unreviewed pages expose citations without making a reviewer claim", () => {
  const schema = buildKnowledgePageSchema(
    "/turning-65-medicare-spokane",
  );

  assert.ok(schema);
  assert.equal(
    schema["@id"],
    `${siteConfig.url}/turning-65-medicare-spokane#webpage`,
  );
  assert.deepEqual(schema.citation, [
    "https://www.medicare.gov/basics/get-started-with-medicare",
    "https://www.medicare.gov/basics/get-started-with-medicare/sign-up/when-can-i-sign-up-for-medicare",
  ]);
  assert.equal("reviewedBy" in schema, false);
  assert.equal("dateModified" in schema, false);
  assert.deepEqual(schema.author, {
    "@id": `${siteConfig.url}#organization`,
  });
  assert.equal(
    schema.publishingPrinciples,
    `${siteConfig.url}${siteConfig.editorialStandardsPath}`,
  );
});

test("featured official sources retain the existing public resource links", () => {
  assert.deepEqual(
    getFeaturedKnowledgeSources().map((source) => source.url),
    [
      "https://www.medicare.gov/",
      "https://www.insurance.wa.gov/statewide-health-insurance-benefits-advisors-shiba",
      "https://www.ssa.gov/medicare/",
    ],
  );
});

test("official sources expire after the six-month verification window", () => {
  const source = { lastChecked: "2026-01-01" };

  assert.equal(isKnowledgeSourceExpired(source, "2026-06-30"), false);
  assert.equal(isKnowledgeSourceExpired(source, "2026-07-01"), true);
});

test("licensed-review claims stop resolving after their review date", () => {
  const review = {
    status: "reviewed" as const,
    reviewedAt: "2026-01-01",
    reviewedByAgentSlug: "lynn-wold",
    reviewerVerificationId: "test-lynn-wold-verification",
    reviewDueAt: "2026-06-30",
  };

  assert.equal(isKnowledgeReviewExpired(review, "2026-06-30"), false);
  assert.equal(isKnowledgeReviewExpired(review, "2026-07-01"), true);

  const reviewWithoutExplicitDueDate = {
    status: "reviewed" as const,
    reviewedAt: "2026-01-01",
    reviewedByAgentSlug: "lynn-wold",
    reviewerVerificationId: "test-lynn-wold-verification",
  };

  assert.equal(
    isKnowledgeReviewExpired(
      reviewWithoutExplicitDueDate,
      "2027-01-01",
    ),
    false,
  );
  assert.equal(
    isKnowledgeReviewExpired(
      reviewWithoutExplicitDueDate,
      "2027-01-02",
    ),
    true,
  );
});

test("every listed knowledge center entry remains present in the sitemap", () => {
  const sitemapUrls = new Set(sitemap().map((entry) => entry.url));

  for (const section of getKnowledgeSections()) {
    for (const entry of section.items) {
      assert.ok(
        sitemapUrls.has(`${siteConfig.url}${entry.path}`),
        `${entry.path} should be in the sitemap`,
      );
    }
  }
});
