import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import KnowledgeCmsPublishedArticle from "../components/KnowledgeCmsPublishedArticle";
import type { KnowledgeCmsArticle } from "../lib/knowledgeCms";

const article: KnowledgeCmsArticle = {
  schemaVersion: 1,
  id: "resource-entry--appointment-checklist",
  kind: "article",
  slug: "medicare-appointment-checklist",
  status: "published",
  ownerId: "author",
  title: "Updated Medicare Appointment Checklist",
  summary: "A current Spokane checklist from the CMS.",
  body: [
    "# CMS body heading",
    "",
    "This is the **improved body** with [official guidance](https://www.medicare.gov/).",
    "",
    "- Medicare card",
    "- Prescription list",
    "",
    "| Item | Why |",
    "| --- | --- |",
    "| Medications | Plan review |",
  ].join("\n"),
  bodyFormat: "markdown",
  searchTerms: [],
  relationships: {
    articleIds: [],
    topicIds: [],
    faqIds: [],
    citySlugs: [],
    agentSlugs: [],
    carrierNames: [],
    existingPaths: ["/medicare-appointment-checklist"],
  },
  sources: [
    {
      id: "medicare",
      kind: "official",
      title: "Medicare.gov",
      publisher: "Centers for Medicare & Medicaid Services",
      url: "https://www.medicare.gov/",
      checkedAt: "2026-08-10",
      reviewDueAt: "2027-02-06",
    },
  ],
  discoverability: {
    pageTitle: "Updated Medicare Appointment Checklist",
    description: "Current checklist.",
    canonicalPath: "/medicare-appointment-checklist",
    indexing: "blocked",
  },
  review: {
    reviewerAgentSlug: "reviewer",
    reviewerVerificationId: "verification",
    reviewedAt: "2026-08-10T12:00:00.000Z",
    reviewDueAt: "2027-02-06",
  },
  publication: {
    publishedAt: "2026-08-10T12:30:00.000Z",
    publishedBy: "publisher",
  },
  audit: {
    revision: 5,
    createdAt: "2026-07-30T12:00:00.000Z",
    createdBy: "author",
    updatedAt: "2026-08-10T12:30:00.000Z",
    updatedBy: "publisher",
  },
};

test("the production CMS renderer uses the approved Markdown body and preserves conversion and compliance elements", () => {
  const html = renderToStaticMarkup(
    createElement(KnowledgeCmsPublishedArticle, {
      article,
      path: "/medicare-appointment-checklist",
    }),
  );

  assert.match(html, /Updated Medicare Appointment Checklist/);
  assert.match(html, /CMS body heading/);
  assert.match(html, /improved body/);
  assert.match(html, /<table/);
  assert.match(html, /Request Local Help/);
  assert.match(html, /Plan availability/);
  assert.match(html, /Official sources/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.doesNotMatch(html, /<h1[^>]*>CMS body heading/);
});
