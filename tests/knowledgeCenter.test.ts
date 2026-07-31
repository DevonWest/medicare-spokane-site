import assert from "node:assert/strict";
import test from "node:test";
import sitemap from "../app/sitemap";
import {
  buildKnowledgeRecordSearchDocuments,
  buildKnowledgePageSchema,
  getFeaturedKnowledgeSources,
  getKnowledgeFaqsForPath,
  getKnowledgeGraph,
  getKnowledgeSections,
  getPublishedKnowledgeFacts,
  getPublishedKnowledgeFaqs,
  getRelatedKnowledgeEntries,
  getRelatedKnowledgeLinks,
  isKnowledgeFactExpired,
  isKnowledgeReviewExpired,
  isKnowledgeSourceExpired,
  knowledgeEntries,
  knowledgeFacts,
  knowledgeFaqs,
  validateKnowledgeCenter,
  validateKnowledgeLinks,
} from "../lib/knowledgeCenter";
import { siteConfig } from "../lib/site";

test("knowledge center registry has valid references and canonical paths", () => {
  assert.deepEqual(validateKnowledgeCenter("2026-07-30"), []);
  assert.equal(
    new Set(knowledgeEntries.map((entry) => entry.path)).size,
    knowledgeEntries.length,
  );
});

test("published sources, facts, and review records are current on the test date", () => {
  assert.deepEqual(validateKnowledgeCenter(new Date()), []);
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

test("related links expose deterministic editorial and entity reasons", () => {
  const links = getRelatedKnowledgeLinks(
    "/turning-65-medicare-spokane",
    5,
  );

  assert.deepEqual(
    links.map((link) => ({
      path: link.entry.path,
      mode: link.mode,
      firstReason: link.reasons[0]?.kind,
    })),
    [
      {
        path: "/compare-medicare-options",
        mode: "curated",
        firstReason: "curated",
      },
      {
        path: "/medicare-advantage",
        mode: "curated",
        firstReason: "curated",
      },
      {
        path: "/medicare-supplements",
        mode: "curated",
        firstReason: "curated",
      },
      {
        path: "/medicare-part-d",
        mode: "curated",
        firstReason: "curated",
      },
      {
        path: "/rx-drug-review",
        mode: "curated",
        firstReason: "curated",
      },
    ],
  );
  assert.ok(
    links.every(
      (link) => link.reasons.length > 0 && link.score > 0,
    ),
  );
});

test("automatic links stay inside their governed content silo", () => {
  const healthInsuranceLinks = getRelatedKnowledgeLinks(
    "/health-insurance-spokane",
    50,
  );
  const medicareLinks = getRelatedKnowledgeLinks("/medicare-part-d", 50);

  assert.ok(
    healthInsuranceLinks.every(
      (link) => link.entry.categoryId === "health-insurance",
    ),
  );
  assert.ok(
    medicareLinks.every(
      (link) => link.entry.categoryId !== "health-insurance",
    ),
  );
});

test("automatic link explanations include shared topic, city, carrier, and agent entities", () => {
  const link = getRelatedKnowledgeLinks("/medicare-part-d", 8).find(
    (candidate) => candidate.entry.path === "/rx-drug-review",
  );

  assert.ok(link);
  assert.equal(link.mode, "automatic");
  const reasonKinds = new Set(link.reasons.map((reason) => reason.kind));
  assert.ok(reasonKinds.has("topic"));
  assert.ok(reasonKinds.has("city"));
  assert.ok(reasonKinds.has("carrier"));
  assert.ok(reasonKinds.has("agent"));
});

test("related-link budget is capped and never returns self or duplicates", () => {
  for (const entry of knowledgeEntries) {
    const links = getRelatedKnowledgeLinks(entry.path, 100);
    const paths = links.map((link) => link.entry.path);

    assert.ok(links.length <= 8);
    assert.equal(paths.includes(entry.path), false);
    assert.equal(new Set(paths).size, paths.length);
  }
});

test("the complete internal-link graph passes governance checks", () => {
  assert.deepEqual(validateKnowledgeLinks(), []);
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

test("Medicare FAQ resolves governed facts and their official source lineage", () => {
  const graph = getKnowledgeGraph("/medicare-faq");

  assert.ok(graph);
  assert.equal(graph.faqs.length, 11);
  assert.equal(graph.facts.length, 11);
  assert.ok(
    graph.sources.some(
      (source) => source.id === "medicare-creditable-coverage",
    ),
  );
  assert.ok(
    graph.sources.some(
      (source) => source.id === "medicare-nursing-home-care",
    ),
  );
});

test("published FAQ registry preserves the existing public questions and answer order", () => {
  const faqs = getKnowledgeFaqsForPath("/medicare-faq");

  assert.deepEqual(
    faqs.map((faq) => faq.id),
    [
      "initial-enrollment-period",
      "dependent-spouse",
      "employer-coverage",
      "parts-a-and-b",
      "provider-access",
      "nursing-home-care",
      "missed-enrollment-window",
      "part-c-basics",
      "part-d-basics",
      "creditable-coverage",
      "government-affiliation",
    ],
  );
  assert.equal(
    faqs[0]?.answer,
    "Most people first become eligible during their Initial Enrollment Period — the seven-month window that begins three months before the month you turn 65 and ends three months after. People who qualify due to disability or certain conditions may become eligible earlier.",
  );
});

test("draft FAQs stay out of public relationships and search-ready documents", () => {
  const draftFaq = {
    ...knowledgeFaqs[0]!,
    id: "draft-test-faq",
    status: "draft" as const,
    schemaEligible: false,
  };

  assert.deepEqual(getPublishedKnowledgeFaqs([draftFaq]), []);

  const searchDocuments = buildKnowledgeRecordSearchDocuments(
    knowledgeFacts,
    [...knowledgeFaqs, draftFaq],
  );

  assert.equal(
    searchDocuments.some(
      (document) => document.id === "faq:draft-test-faq",
    ),
    false,
  );
  assert.equal(
    searchDocuments.filter((document) => document.kind === "faq").length,
    11,
  );
  assert.equal(
    searchDocuments.filter((document) => document.kind === "fact").length,
    11,
  );
});

test("public FAQ relationships are assembled from published records only", () => {
  const entry = knowledgeEntries.find(
    (candidate) => candidate.path === "/medicare-faq",
  );

  assert.ok(entry);
  assert.deepEqual(
    entry.relationships?.factIds,
    getPublishedKnowledgeFacts().map((fact) => fact.id),
  );
  assert.deepEqual(
    entry.relationships?.faqIds,
    getPublishedKnowledgeFaqs().map((faq) => faq.id),
  );
});

test("search documents cannot mutate canonical source evidence", () => {
  const fact = knowledgeFacts.find(
    (candidate) =>
      candidate.evidence.kind === "official-sources" &&
      candidate.evidence.sourceIds.length > 0,
  );

  assert.ok(fact);
  assert.equal(fact.evidence.kind, "official-sources");
  const originalSourceIds = [...fact.evidence.sourceIds];
  const document = buildKnowledgeRecordSearchDocuments().find(
    (candidate) => candidate.id === `fact:${fact.id}`,
  );

  assert.ok(document);
  document.sourceIds.push("index-only-source");
  assert.deepEqual(fact.evidence.sourceIds, originalSourceIds);
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

test("governed facts expire after the six-month accuracy window", () => {
  const fact = { checkedAt: "2026-01-01" };

  assert.equal(isKnowledgeFactExpired(fact, "2026-06-30"), false);
  assert.equal(isKnowledgeFactExpired(fact, "2026-07-01"), true);
  assert.equal(
    isKnowledgeFactExpired(
      fact,
      new Date("2026-06-30T23:59:59.999Z"),
    ),
    false,
  );
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
