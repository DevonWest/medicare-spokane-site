import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import { afterEach, test } from "node:test";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  knowledgeEntries,
  knowledgeSources,
} from "../lib/knowledgeCenter";
import {
  getKnowledgeCmsAuthorizationDecision,
  type KnowledgeCmsActor,
  type KnowledgeCmsArticle,
} from "../lib/knowledgeCms";
import {
  knowledgeCmsRendererContracts,
} from "../lib/knowledgeCmsRendererContract";
import {
  getKnowledgeCmsRouteParity,
  knowledgeCmsRouteParityManifest,
} from "../lib/knowledgeCmsRouteParity";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const NOW = new Date("2026-07-30T22:00:00.000Z");

function mockServerOnlyModule() {
  const serverOnlyPath = require.resolve("server-only");
  require.cache[serverOnlyPath] = {
    exports: {},
    filename: serverOnlyPath,
    id: serverOnlyPath,
    loaded: true,
  } as never;
}

async function loadShadowRenderer() {
  mockServerOnlyModule();
  return import("../lib/knowledgeCmsShadowRenderer");
}

async function loadShadowDal() {
  mockServerOnlyModule();
  return import("../lib/knowledgeCmsShadowDal");
}

function actor(
  roles: KnowledgeCmsActor["roles"],
): KnowledgeCmsActor {
  return {
    id: "shadow-operator",
    roles,
  };
}

function articleRecord(
  entryId = "turning-65-spokane",
  overrides: Partial<KnowledgeCmsArticle> = {},
): KnowledgeCmsArticle {
  const contract = knowledgeCmsRendererContracts.find(
    (candidate) => candidate.entryId === entryId,
  );
  const parity = getKnowledgeCmsRouteParity(entryId);
  const entry = knowledgeEntries.find(
    (candidate) => candidate.id === entryId,
  );
  assert.ok(contract);
  assert.ok(parity);
  assert.ok(entry);
  const sourceRecords = (entry.sourceIds ?? []).map((sourceId) => {
    const source = knowledgeSources.find(
      (candidate) => candidate.id === sourceId,
    );
    assert.ok(source);
    const reviewDueAt = new Date(
      `${source.lastChecked}T00:00:00.000Z`,
    );
    reviewDueAt.setUTCDate(reviewDueAt.getUTCDate() + 180);
    return {
      id: source.id,
      kind: "official" as const,
      title: source.title,
      publisher: source.publisher,
      url: source.url,
      checkedAt: source.lastChecked,
      reviewDueAt: reviewDueAt.toISOString().slice(0, 10),
    };
  });

  return {
    schemaVersion: 1,
    id: contract.record.id,
    kind: "article",
    slug: contract.path.slice(1),
    status: "published",
    ownerId: "author-user",
    title: entry.title,
    summary: entry.summary,
    body:
      "Governed editorial reference. The private shadow adapter preserves the verified React route; this Markdown body is not public.",
    bodyFormat: "markdown",
    searchTerms: [
      ...new Set([...entry.tags, ...entry.topicSlugs]),
    ],
    relationships: {
      articleIds: (entry.relationships?.entryPaths ?? []).flatMap(
        (path) => {
          const related = knowledgeEntries.find(
            (candidate) => candidate.path === path,
          );
          return related ? [`resource-entry--${related.id}`] : [];
        },
      ),
      topicIds: [
        `resource-category--${entry.categoryId}`,
        ...entry.topicSlugs.map(
          (slug) => `resource-topic--${slug}`,
        ),
      ],
      faqIds: (entry.relationships?.faqIds ?? []).map(
        (id) => `resource-faq--${id}`,
      ),
      citySlugs: [...(entry.relationships?.citySlugs ?? [])],
      agentSlugs: [...(entry.relationships?.agentSlugs ?? [])],
      carrierNames: [...(entry.relationships?.carrierNames ?? [])],
      existingPaths: [contract.path],
    },
    sources: sourceRecords,
    discoverability: {
      pageTitle: parity.metadata.pageTitle,
      description: parity.metadata.description,
      canonicalPath: contract.path,
      indexing: "blocked",
    },
    review: {
      reviewerAgentSlug: "licensed-reviewer",
      reviewerVerificationId: "reviewer-verification-1",
      reviewedBy: "reviewer-user",
      reviewedAt: "2026-07-30T21:00:00.000Z",
      reviewDueAt: "2027-01-26",
      decisionNote: "Approved for private shadow comparison.",
    },
    publication: {
      publishedAt: "2026-07-30T21:30:00.000Z",
      publishedBy: "publisher-user",
    },
    audit: {
      revision: 4,
      createdAt: "2026-07-30T20:00:00.000Z",
      createdBy: "author-user",
      updatedAt: "2026-07-30T21:30:00.000Z",
      updatedBy: "publisher-user",
    },
    ...overrides,
  };
}

function decodeRenderedText(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replaceAll("&amp;", "&")
    .replaceAll("&#x27;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/\s+/g, " ")
    .trim();
}

function listTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory()
      ? listTypeScriptFiles(path)
      : /\.(ts|tsx)$/.test(path)
        ? [path]
        : [];
  });
}

afterEach(() => {
  delete process.env.KNOWLEDGE_CMS_ENABLED;
  delete process.env.KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE;
});

test("private shadow adapters reproduce every immutable route snapshot", async () => {
  const {
    getKnowledgeCmsShadowRouteAdapter,
    validateKnowledgeCmsShadowAdapters,
  } = await loadShadowRenderer();

  assert.deepEqual(validateKnowledgeCmsShadowAdapters(), []);
  for (const parity of knowledgeCmsRouteParityManifest) {
    const adapter = getKnowledgeCmsShadowRouteAdapter(parity.entryId);
    assert.ok(adapter);
    assert.equal(adapter.path, parity.path);
    assert.equal(adapter.sourceFile, parity.sourceFile);

    const html = renderToStaticMarkup(createElement(adapter.Component));
    const h1s = [
      ...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g),
    ].map((match) => decodeRenderedText(match[1]));
    assert.equal(
      createHash("sha256").update(html).digest("hex"),
      parity.renderedBody.sha256,
      `${parity.path} private shadow adapter drifted`,
    );
    assert.equal(
      Buffer.byteLength(html),
      parity.renderedBody.bytes,
      `${parity.path} private shadow byte count drifted`,
    );
    assert.deepEqual(h1s, [parity.renderedBody.h1]);
  }
});

test("a governed published record produces exact private shadow evidence", async () => {
  const { buildKnowledgeCmsShadowPreview } =
    await loadShadowRenderer();
  const preview = buildKnowledgeCmsShadowPreview([articleRecord()], {
    asOf: NOW,
    rendererMode: "shadow",
  });

  assert.equal(preview.version, 1);
  assert.equal(preview.mode, "private_shadow");
  assert.equal(preview.writeCount, 0);
  assert.equal(preview.rendererMode.requestedMode, "shadow");
  assert.equal(preview.rendererMode.effectiveMode, "static");
  assert.equal(preview.rendererMode.privateShadowEnabled, true);
  assert.equal(preview.publicSource, "verified_static_route");
  assert.equal(preview.cmsBodyPubliclyRendered, false);
  assert.equal(preview.cutoverEligible, false);
  assert.deepEqual(preview.summary, {
    total: 22,
    adaptersReady: 22,
    candidatesPresent: 1,
    compared: 1,
    passed: 1,
    blocked: 21,
  });

  const result = preview.results.find(
    (candidate) => candidate.entryId === "turning-65-spokane",
  );
  assert.ok(result);
  assert.equal(result.status, "parity_passed");
  assert.equal(result.recordRevision, 4);
  assert.equal(result.errors.length, 0);
  assert.equal(result.cmsBodyPubliclyRendered, false);
  assert.equal(result.cutoverEligible, false);
  assert.equal(
    result.artifact?.renderedBody.sha256,
    getKnowledgeCmsRouteParity("turning-65-spokane")?.renderedBody
      .sha256,
  );
  assert.equal(
    preview.results.filter(
      (candidate) => candidate.status === "candidate_missing",
    ).length,
    21,
  );
});

test("stale, non-published, or mismatched records fail before comparison", async () => {
  const { buildKnowledgeCmsShadowPreview } =
    await loadShadowRenderer();
  const draft = articleRecord("turning-65-spokane", {
    status: "draft",
    publication: undefined,
  });
  const wrongMetadata = articleRecord("compare-options", {
    discoverability: {
      pageTitle: "Wrong title",
      description: "Wrong description",
      canonicalPath: "/compare-medicare-options",
      indexing: "blocked",
    },
  });
  const expired = articleRecord("medicare-advantage", {
    review: {
      reviewerAgentSlug: "licensed-reviewer",
      reviewerVerificationId: "reviewer-verification-1",
      reviewedBy: "reviewer-user",
      reviewedAt: "2026-01-01T21:00:00.000Z",
      reviewDueAt: "2026-07-29",
    },
  });
  const sameReviewerPublisher = articleRecord(
    "medicare-supplements",
    {
      publication: {
        publishedAt: "2026-07-30T21:30:00.000Z",
        publishedBy: "reviewer-user",
      },
    },
  );
  const preview = buildKnowledgeCmsShadowPreview(
    [draft, wrongMetadata, expired, sameReviewerPublisher],
    {
      asOf: NOW,
      rendererMode: "shadow",
    },
  );

  assert.equal(
    preview.results.find(
      (result) => result.entryId === "turning-65-spokane",
    )?.status,
    "candidate_not_published",
  );
  const metadataResult = preview.results.find(
    (result) => result.entryId === "compare-options",
  );
  assert.equal(metadataResult?.status, "record_contract_mismatch");
  assert.ok(
    metadataResult?.errors.some((message) => /title or description/i.test(message)),
  );
  const expiredResult = preview.results.find(
    (result) => result.entryId === "medicare-advantage",
  );
  assert.equal(expiredResult?.status, "record_contract_mismatch");
  assert.ok(
    expiredResult?.errors.some((message) => /review is due/i.test(message)),
  );
  const separationResult = preview.results.find(
    (result) => result.entryId === "medicare-supplements",
  );
  assert.equal(
    separationResult?.status,
    "record_contract_mismatch",
  );
  assert.ok(
    separationResult?.errors.some((message) =>
      /reviewer and publisher/i.test(message),
    ),
  );
  assert.equal(preview.summary.compared, 0);
  assert.equal(preview.summary.passed, 0);
});

test("shadow DAL is publisher-only, exact-mode gated, and read-only", async () => {
  const {
    KnowledgeCmsPrivateShadowDisabledError,
    previewKnowledgeCmsShadow,
  } = await loadShadowDal();
  let reads = 0;
  const repository = {
    list: async () => {
      reads += 1;
      return [articleRecord()];
    },
  };

  const preview = await previewKnowledgeCmsShadow(
    repository,
    actor(["publisher"]),
    {
      asOf: NOW,
      rendererMode: "shadow",
    },
  );
  assert.equal(reads, 1);
  assert.equal(preview.summary.passed, 1);

  reads = 0;
  await assert.rejects(
    previewKnowledgeCmsShadow(repository, actor(["editor"]), {
      asOf: NOW,
      rendererMode: "shadow",
    }),
    /preview_shadow_rendering.*role_required/i,
  );
  assert.equal(reads, 0);
  assert.equal(
    getKnowledgeCmsAuthorizationDecision(
      actor(["admin"]),
      "preview_shadow_rendering",
    ).allowed,
    true,
  );

  await assert.rejects(
    previewKnowledgeCmsShadow(repository, actor(["admin"]), {
      asOf: NOW,
      rendererMode: "static",
    }),
    (error) =>
      error instanceof KnowledgeCmsPrivateShadowDisabledError,
  );
  assert.equal(reads, 0);
});

test("private shadow UI is isolated from public routes and mutation paths", () => {
  const page = readFileSync(
    join(root, "app/admin/knowledge/shadow-preview/page.tsx"),
    "utf8",
  );
  const dal = readFileSync(
    join(root, "lib/knowledgeCmsShadowDal.ts"),
    "utf8",
  );
  const workflow = readFileSync(
    join(root, ".github/workflows/deploy.yml"),
    "utf8",
  );

  assert.match(page, /isKnowledgeCmsEnabled/);
  assert.match(page, /isKnowledgeCmsPrivateShadowEnabled/);
  assert.match(page, /getCurrentKnowledgeCmsActor/);
  assert.match(page, /publisher/);
  assert.match(page, /admin/);
  assert.match(page, /\binert\b/);
  assert.doesNotMatch(page, /["']use client["']/);
  assert.doesNotMatch(page, /dangerouslySetInnerHTML/);
  assert.doesNotMatch(dal, /\.save\s*\(/);
  assert.doesNotMatch(dal, /\.transition\s*\(/);
  assert.doesNotMatch(dal, /\.create\s*\(/);
  assert.match(workflow, /static\|shadow/);
  assert.match(
    workflow,
    /KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE must be exactly static or shadow/,
  );
  assert.match(workflow, /cutover cannot be activated/);

  const publicSources = [
    ...listTypeScriptFiles(join(root, "app")),
    ...listTypeScriptFiles(join(root, "components")),
  ].filter(
    (sourceFile) =>
      !relative(root, sourceFile).startsWith(
        `${join("app", "admin")}/`,
      ),
  );
  for (const sourceFile of publicSources) {
    assert.doesNotMatch(
      readFileSync(sourceFile, "utf8"),
      /knowledgeCmsShadowRenderer|knowledgeCmsShadowDal/,
      `${relative(root, sourceFile)} must not import private shadow rendering`,
    );
  }
});
