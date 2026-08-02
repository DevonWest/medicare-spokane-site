import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  KnowledgeCmsAiInputError,
  parseKnowledgeCmsAiProposal,
  parseKnowledgeCmsAiRequest,
} from "../lib/knowledgeCmsAi";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function articleProposal(sourceUrl = "https://www.medicare.gov/health-drug-plans/part-d") {
  return {
    summary: "Create a stronger Part D resource.",
    reasoning: "The draft answers a demonstrated visitor need with official evidence.",
    recommendedActions: ["Review every factual statement and source."],
    draft: {
      title: "Medicare Part D Help in Spokane",
      summary: "Understand Medicare drug coverage and prepare for a local review.",
      body: "# Medicare Part D Help in Spokane\n\nReview your prescriptions and pharmacies.",
      slug: "medicare-part-d-help-spokane",
      pageTitle: "Medicare Part D Help in Spokane",
      description: "Understand Medicare Part D in Spokane and prepare your prescriptions and pharmacies for an evidence-based coverage review.",
      canonicalPath: "/medicare-part-d-help-spokane",
      searchTerms: ["medicare part d spokane"],
      topicIds: ["medicare-part-d"],
      faqIds: [],
      existingPaths: [],
      sources: [
        {
          id: "medicare-part-d",
          kind: "official",
          title: "What's Medicare drug coverage (Part D)?",
          publisher: "Medicare.gov",
          url: sourceUrl,
          checkedAt: "2026-08-01",
          reviewDueAt: "2027-01-28",
        },
      ],
    },
    citations: [
      {
        title: "Medicare Part D",
        publisher: "Medicare.gov",
        url: sourceUrl,
        note: "Supports the general drug coverage explanation.",
      },
    ],
  };
}

test("AI article proposals require complete structured drafts and trusted sources", () => {
  const result = parseKnowledgeCmsAiProposal(articleProposal(), "new_article");
  assert.equal(result.draft?.slug, "medicare-part-d-help-spokane");
  assert.equal(result.draft?.sources[0].publisher, "Medicare.gov");

  assert.throws(
    () =>
      parseKnowledgeCmsAiProposal(
        articleProposal("https://untrusted.example/medicare"),
        "new_article",
      ),
    KnowledgeCmsAiInputError,
  );
});

test("strategy proposals may cite competitors but cannot contain an applyable draft", () => {
  const result = parseKnowledgeCmsAiProposal(
    {
      summary: "Prioritize a content gap.",
      reasoning: "Competitor results reveal an unmet query intent.",
      recommendedActions: ["Validate the opportunity in Search Console."],
      draft: null,
      citations: [
        {
          title: "Competitor result",
          publisher: "Example agency",
          url: "https://example.com/medicare",
          note: "Used only for gap analysis, not factual Medicare support.",
        },
      ],
    },
    "site_strategy",
  );
  assert.equal(result.draft, null);
  assert.throws(
    () => parseKnowledgeCmsAiProposal(articleProposal(), "site_strategy"),
    /cannot include an applyable draft/,
  );
});

test("copilot form parsing requires intent and an article target for improvements", () => {
  const form = new FormData();
  form.set("mode", "new_article");
  form.set("prompt", "Create a useful Spokane enrollment guide.");
  form.set("deepResearch", "true");
  assert.deepEqual(parseKnowledgeCmsAiRequest(form), {
    mode: "new_article",
    prompt: "Create a useful Spokane enrollment guide.",
    deepResearch: true,
  });

  const invalid = new FormData();
  invalid.set("mode", "improve_article");
  invalid.set("prompt", "Improve the selected article for visitors.");
  assert.throws(() => parseKnowledgeCmsAiRequest(invalid), /Choose an article/);
});

test("copilot refinement binds a valid prior run without accepting forged IDs", () => {
  const form = new FormData();
  form.set("mode", "site_strategy");
  form.set("prompt", "Keep the priorities but add clearer evidence and next steps.");
  form.set("parentRunId", "4f59f915-58ca-4d35-9b3f-d7d28c589723");
  assert.deepEqual(parseKnowledgeCmsAiRequest(form), {
    mode: "site_strategy",
    prompt: "Keep the priorities but add clearer evidence and next steps.",
    deepResearch: false,
    parentRunId: "4f59f915-58ca-4d35-9b3f-d7d28c589723",
  });

  form.set("parentRunId", "../../another-run");
  assert.throws(
    () => parseKnowledgeCmsAiRequest(form),
    /valid prior proposal/i,
  );
});

test("copilot UI and scheduled endpoint preserve explicit human and secret gates", () => {
  const controls = readFileSync(
    join(root, "app/admin/knowledge/components/KnowledgeCmsCopilotControls.tsx"),
    "utf8",
  );
  const route = readFileSync(
    join(root, "app/api/knowledge-cms/seo-scan/route.ts"),
    "utf8",
  );
  const provider = readFileSync(
    join(root, "lib/knowledgeCmsAiOpenAi.ts"),
    "utf8",
  );
  const deploy = readFileSync(
    join(root, ".github/workflows/deploy.yml"),
    "utf8",
  );
  const dal = readFileSync(join(root, "lib/knowledgeCmsAiDal.ts"), "utf8");
  const page = readFileSync(
    join(root, "app/admin/knowledge/copilot/page.tsx"),
    "utf8",
  );
  assert.match(controls, /apply_private_draft/);
  assert.match(controls, /start_private_revision/);
  assert.match(controls, /will not submit, approve, publish, or enable indexing/);
  assert.match(route, /timingSafeEqual/);
  assert.match(route, /KNOWLEDGE_CMS_CONTINUOUS_SEO_ENABLED/);
  assert.match(provider, /store: false/);
  assert.match(provider, /allowed_domains/);
  assert.match(provider, /max_output_tokens/);
  assert.match(provider, /KNOWLEDGE_CMS_AI_TIMEOUT_MS/);
  assert.match(
    deploy,
    /vars\.KNOWLEDGE_CMS_SEO_ENABLED \|\| vars\.KNOWLEDGE_CMS_ENABLED/,
  );
  assert.match(deploy, /KNOWLEDGE_CMS_AI_MAX_OUTPUT_TOKENS/);
  assert.match(deploy, /KNOWLEDGE_CMS_AI_DEEP_MAX_OUTPUT_TOKENS/);
  assert.match(dal, /revision_proposal/);
  assert.match(dal, /currentArticle\.status !== "published"/);
  assert.match(page, /immutable/);
  assert.match(page, /static public/);
  assert.match(page, /AI proposal history/);
  assert.match(controls, /Continue refining this proposal/);
  assert.match(provider, /previousProposal/);
});
