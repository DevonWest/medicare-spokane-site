import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import { afterEach, test } from "node:test";
import { fileURLToPath } from "node:url";
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { knowledgeEntries, knowledgeSources } from "../lib/knowledgeCenter";
import {
  getKnowledgeCmsAuthorizationDecision,
  type KnowledgeCmsActor,
  type KnowledgeCmsArticle,
} from "../lib/knowledgeCms";
import { knowledgeCmsRendererContracts } from "../lib/knowledgeCmsRendererContract";
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

async function loadNativeRepresentation() {
  mockServerOnlyModule();
  return import("../lib/knowledgeCmsNativeRepresentation");
}

async function loadNativeRenderer() {
  mockServerOnlyModule();
  return import("../lib/knowledgeCmsNativeRepresentationRenderer");
}

async function loadPublicLeadFormAdapter() {
  mockServerOnlyModule();
  return import("../lib/knowledgeCmsPublicLeadFormAdapter");
}

function actor(roles: KnowledgeCmsActor["roles"]): KnowledgeCmsActor {
  return { id: "shadow-operator", roles };
}

function articleRecord(
  entryId = "turning-65-spokane",
  overrides: Partial<KnowledgeCmsArticle> = {},
): KnowledgeCmsArticle {
  const contract = knowledgeCmsRendererContracts.find(
    (candidate) => candidate.entryId === entryId,
  );
  const parity = getKnowledgeCmsRouteParity(entryId);
  const entry = knowledgeEntries.find((candidate) => candidate.id === entryId);
  assert.ok(contract);
  assert.ok(parity);
  assert.ok(entry);
  const sourceRecords = (entry.sourceIds ?? []).map((sourceId) => {
    const source = knowledgeSources.find(
      (candidate) => candidate.id === sourceId,
    );
    assert.ok(source);
    const reviewDueAt = new Date(`${source.lastChecked}T00:00:00.000Z`);
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
      "Governed editorial reference. The immutable rendering artifact is separate and private.",
    bodyFormat: "markdown",
    searchTerms: [...new Set([...entry.tags, ...entry.topicSlugs])],
    relationships: {
      articleIds: (entry.relationships?.entryPaths ?? []).flatMap((path) => {
        const related = knowledgeEntries.find(
          (candidate) => candidate.path === path,
        );
        return related ? [`resource-entry--${related.id}`] : [];
      }),
      topicIds: [
        `resource-category--${entry.categoryId}`,
        ...entry.topicSlugs.map((slug) => `resource-topic--${slug}`),
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
      decisionNote: "Approved for private CMS-native shadow comparison.",
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

async function representationDocument(
  entryId = "turning-65-spokane",
  record = articleRecord(entryId),
) {
  const {
    buildKnowledgeCmsNativeRepresentationArtifact,
    getKnowledgeCmsNativeRepresentationControl,
  } = await loadNativeRepresentation();
  const control = getKnowledgeCmsNativeRepresentationControl(entryId);
  assert.ok(control);
  const artifact = buildKnowledgeCmsNativeRepresentationArtifact({
    control,
    article: record,
    actorId: "publisher-user",
    createdAt: NOW.toISOString(),
  });
  return { id: artifact.id, data: artifact, artifact };
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
  delete process.env.KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED;
});

test("CMS-native artifacts round-trip every immutable route without legacy page imports", async () => {
  const {
    getKnowledgeCmsNativeRepresentationControl,
    knowledgeCmsNativeRepresentationControls,
    buildKnowledgeCmsNativeRepresentationArtifact,
    validateKnowledgeCmsNativeRepresentationControls,
  } = await loadNativeRepresentation();
  const { renderKnowledgeCmsNativeRepresentation } =
    await loadNativeRenderer();
  const { hasKnowledgeCmsPublicLeadFormAdapter } =
    await loadPublicLeadFormAdapter();

  assert.deepEqual(validateKnowledgeCmsNativeRepresentationControls(), []);
  assert.equal(knowledgeCmsNativeRepresentationControls.length, 22);
  for (const parity of knowledgeCmsRouteParityManifest) {
    assert.equal(
      hasKnowledgeCmsPublicLeadFormAdapter(parity.entryId),
      parity.renderedBody.formCount > 0,
      `${parity.path} must bind every rendered lead form to its client adapter`,
    );
    const control = getKnowledgeCmsNativeRepresentationControl(parity.entryId);
    assert.ok(control);
    const record = articleRecord(parity.entryId);
    const artifact = buildKnowledgeCmsNativeRepresentationArtifact({
      control,
      article: record,
      actorId: "publisher-user",
      createdAt: NOW.toISOString(),
    });
    const html = renderToStaticMarkup(
      createElement(
        Fragment,
        null,
        renderKnowledgeCmsNativeRepresentation(artifact, record),
      ),
    );
    const h1s = [
      ...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g),
    ].map((match) => decodeRenderedText(match[1]));
    assert.equal(
      createHash("sha256").update(html).digest("hex"),
      parity.renderedBody.sha256,
      `${parity.path} CMS-native body drifted`,
    );
    assert.equal(Buffer.byteLength(html), parity.renderedBody.bytes);
    assert.deepEqual(h1s, [parity.renderedBody.h1]);
  }
});

test("a governed article and immutable artifact produce exact private shadow evidence", async () => {
  const { buildKnowledgeCmsShadowPreview } = await loadShadowRenderer();
  const record = articleRecord();
  const representation = await representationDocument(
    "turning-65-spokane",
    record,
  );
  const preview = buildKnowledgeCmsShadowPreview(
    [record],
    [{ id: representation.id, data: representation.data }],
    { asOf: NOW, rendererMode: "shadow" },
  );

  assert.equal(preview.version, 2);
  assert.equal(preview.mode, "private_shadow");
  assert.equal(preview.writeCount, 0);
  assert.equal(preview.rendererMode.effectiveMode, "static");
  assert.equal(preview.bodySource, "cms_native_lossless_artifact");
  assert.equal(preview.cmsBodyPubliclyRendered, false);
  assert.equal(preview.cutoverEligible, false);
  assert.deepEqual(preview.summary, {
    total: 22,
    controlsReady: 22,
    candidatesPresent: 1,
    representationsPresent: 1,
    unexpectedRepresentations: 0,
    compared: 1,
    passed: 1,
    blocked: 21,
  });
  assert.equal(preview.betaParityApproval.status, "blocked");
  assert.equal(preview.betaParityApproval.exactPasses, 1);
  assert.match(preview.betaParityApproval.fingerprint, /^[a-f0-9]{64}$/);
  assert.equal(preview.betaParityApproval.executionAuthority, false);
  assert.equal(preview.betaParityApproval.publicCutoverAuthority, false);

  const result = preview.results.find(
    (candidate) => candidate.entryId === "turning-65-spokane",
  );
  assert.ok(result);
  assert.equal(result.status, "parity_passed");
  assert.equal(result.recordRevision, 4);
  assert.equal(result.errors.length, 0);
  assert.equal(result.representationId, representation.id);
  assert.equal(
    result.artifact?.renderedBody.sha256,
    getKnowledgeCmsRouteParity("turning-65-spokane")?.renderedBody.sha256,
  );
});

test("private shadow accepts separately audited review and publication by one account", async () => {
  const { buildKnowledgeCmsShadowPreview } = await loadShadowRenderer();
  const record = articleRecord("turning-65-spokane", {
    review: {
      reviewerAgentSlug: "devon-west",
      reviewerVerificationId: "devon-west-wa-oic-2026-07-31",
      reviewedBy: "devon-google-account",
      reviewedAt: "2026-07-30T21:00:00.000Z",
      reviewDueAt: "2027-01-26",
      decisionNote: "Reviewed every governed source.",
    },
    publication: {
      publishedAt: "2026-07-30T21:30:00.000Z",
      publishedBy: "devon-google-account",
    },
    audit: {
      revision: 4,
      createdAt: "2026-07-30T20:00:00.000Z",
      createdBy: "devon-google-account",
      updatedAt: "2026-07-30T21:30:00.000Z",
      updatedBy: "devon-google-account",
    },
  });
  const representation = await representationDocument(
    "turning-65-spokane",
    record,
  );
  const preview = buildKnowledgeCmsShadowPreview(
    [record],
    [{ id: representation.id, data: representation.data }],
    { asOf: NOW, rendererMode: "shadow" },
  );

  assert.equal(
    preview.results.find(
      (candidate) => candidate.entryId === "turning-65-spokane",
    )?.status,
    "parity_passed",
  );
});

test("beta parity approval requires all 22 exact artifacts and rejects unexpected documents", async () => {
  const { buildKnowledgeCmsShadowPreview } = await loadShadowRenderer();
  const records = knowledgeCmsRouteParityManifest.map((parity) =>
    articleRecord(parity.entryId),
  );
  const documents = await Promise.all(
    records.map(async (record, index) => {
      const artifact = await representationDocument(
        knowledgeCmsRouteParityManifest[index].entryId,
        record,
      );
      return { id: artifact.id, data: artifact.data };
    }),
  );
  const verified = buildKnowledgeCmsShadowPreview(records, documents, {
    asOf: NOW,
    rendererMode: "shadow",
  });
  assert.equal(verified.summary.passed, 22);
  assert.equal(verified.betaParityApproval.status, "verified");

  const unexpected = buildKnowledgeCmsShadowPreview(
    records,
    [...documents, { id: "unexpected-rendering", data: {} }],
    { asOf: NOW, rendererMode: "shadow" },
  );
  assert.equal(unexpected.summary.passed, 22);
  assert.equal(unexpected.summary.unexpectedRepresentations, 1);
  assert.equal(unexpected.betaParityApproval.status, "blocked");
  assert.notEqual(
    unexpected.betaParityApproval.fingerprint,
    verified.betaParityApproval.fingerprint,
  );
});

test("missing, malformed, and stale rendering artifacts fail closed", async () => {
  const { buildKnowledgeCmsShadowPreview } = await loadShadowRenderer();
  const missingRecord = articleRecord("turning-65-spokane");
  const malformedRecord = articleRecord("compare-options");
  const staleArtifactRecord = articleRecord("medicare-advantage");
  const staleCurrentRecord = articleRecord("medicare-advantage", {
    audit: {
      ...staleArtifactRecord.audit,
      revision: staleArtifactRecord.audit.revision + 1,
    },
  });
  const malformedControl = (
    await loadNativeRepresentation()
  ).getKnowledgeCmsNativeRepresentationControl("compare-options");
  assert.ok(malformedControl);
  const stale = await representationDocument(
    "medicare-advantage",
    staleArtifactRecord,
  );
  const preview = buildKnowledgeCmsShadowPreview(
    [missingRecord, malformedRecord, staleCurrentRecord],
    [
      {
        id: (
          await loadNativeRepresentation()
        ).getKnowledgeCmsNativeRepresentationArtifactId(
          "compare-options",
          malformedRecord.audit.revision,
        ),
        data: {},
      },
      { id: stale.id, data: stale.data },
    ],
    { asOf: NOW, rendererMode: "shadow" },
  );
  assert.equal(
    preview.results.find(
      (result) => result.entryId === "turning-65-spokane",
    )?.status,
    "representation_missing",
  );
  assert.equal(
    preview.results.find((result) => result.entryId === "compare-options")
      ?.status,
    "representation_invalid",
  );
  assert.equal(
    preview.results.find(
      (result) => result.entryId === "medicare-advantage",
    )?.status,
    "representation_stale",
  );
  assert.equal(preview.summary.compared, 0);
  assert.equal(preview.summary.passed, 0);
});

test("editorial metadata may change while publication and canonical identity stay guarded", async () => {
  const { buildKnowledgeCmsShadowPreview } = await loadShadowRenderer();
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
  const preview = buildKnowledgeCmsShadowPreview(
    [draft, wrongMetadata, expired],
    [],
    { asOf: NOW, rendererMode: "shadow" },
  );
  assert.equal(
    preview.results.find(
      (result) => result.entryId === "turning-65-spokane",
    )?.status,
    "candidate_not_published",
  );
  assert.equal(
    preview.results.find((result) => result.entryId === "compare-options")
      ?.status,
    "representation_missing",
  );
  assert.ok(
    preview.results
      .find((result) => result.entryId === "medicare-advantage")
      ?.errors.some((message) => /review is due/i.test(message)),
  );
});

test("canonical route drift still fails before artifact comparison", async () => {
  const { buildKnowledgeCmsShadowPreview } = await loadShadowRenderer();
  const wrongCanonical = articleRecord("compare-options", {
    discoverability: {
      pageTitle: "An approved editorial title",
      description: "An approved editorial description.",
      canonicalPath: "/wrong-route",
      indexing: "blocked",
    },
  });
  const preview = buildKnowledgeCmsShadowPreview([wrongCanonical], [], {
    asOf: NOW,
    rendererMode: "shadow",
  });
  assert.equal(
    preview.results.find((result) => result.entryId === "compare-options")
      ?.status,
    "record_contract_mismatch",
  );
});

test("shadow DAL is publisher-only, exact-mode gated, two-read, and zero-write", async () => {
  const {
    KnowledgeCmsPrivateShadowDisabledError,
    previewKnowledgeCmsShadow,
  } = await loadShadowDal();
  const record = articleRecord();
  const representation = await representationDocument(
    "turning-65-spokane",
    record,
  );
  let articleReads = 0;
  let representationReads = 0;
  const repository = {
    list: async () => {
      articleReads += 1;
      return [record];
    },
    listArticleRenderings: async () => {
      representationReads += 1;
      return [{ id: representation.id, data: representation.data }];
    },
  };
  const preview = await previewKnowledgeCmsShadow(
    repository,
    actor(["publisher"]),
    { asOf: NOW, rendererMode: "shadow" },
  );
  assert.equal(articleReads, 1);
  assert.equal(representationReads, 1);
  assert.equal(preview.summary.passed, 1);

  articleReads = 0;
  representationReads = 0;
  await assert.rejects(
    previewKnowledgeCmsShadow(repository, actor(["editor"]), {
      asOf: NOW,
      rendererMode: "shadow",
    }),
    /preview_shadow_rendering.*role_required/i,
  );
  assert.equal(articleReads, 0);
  assert.equal(representationReads, 0);
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
    (error) => error instanceof KnowledgeCmsPrivateShadowDisabledError,
  );
  assert.equal(articleReads, 0);
  assert.equal(representationReads, 0);
});

test("private shadow UI is isolated while the guarded internal renderer avoids legacy page modules", () => {
  const page = readFileSync(
    join(root, "app/admin/knowledge/shadow-preview/page.tsx"),
    "utf8",
  );
  const dal = readFileSync(join(root, "lib/knowledgeCmsShadowDal.ts"), "utf8");
  const shadow = readFileSync(
    join(root, "lib/knowledgeCmsShadowRenderer.tsx"),
    "utf8",
  );
  const nativeRenderer = readFileSync(
    join(root, "lib/knowledgeCmsNativeRepresentationRenderer.tsx"),
    "utf8",
  );
  const leadFormAdapter = readFileSync(
    join(root, "lib/knowledgeCmsPublicLeadFormAdapter.tsx"),
    "utf8",
  );
  const workflow = readFileSync(
    join(root, ".github/workflows/deploy.yml"),
    "utf8",
  );

  assert.match(page, /isKnowledgeCmsEnabled/);
  assert.match(page, /isKnowledgeCmsPrivateShadowEnabled/);
  assert.match(page, /getCurrentKnowledgeCmsActor/);
  assert.match(page, /\binert\b/);
  assert.doesNotMatch(page, /["']use client["']/);
  assert.doesNotMatch(page, /dangerouslySetInnerHTML/);
  assert.match(nativeRenderer, /html-react-parser/);
  assert.match(nativeRenderer, /replaceKnowledgeCmsPublicLeadForm/);
  assert.doesNotMatch(nativeRenderer, /dangerouslySetInnerHTML/);
  assert.match(leadFormAdapter, /@\/components\/LeadForm/);
  assert.doesNotMatch(leadFormAdapter, /app\/.+\/page/);
  assert.doesNotMatch(shadow, /@\/app\//);
  assert.doesNotMatch(shadow, /app\/.+\/page/);
  assert.doesNotMatch(dal, /\.save\s*\(/);
  assert.doesNotMatch(dal, /\.transition\s*\(/);
  assert.doesNotMatch(dal, /\.create\s*\(/);
  assert.match(workflow, /static\|shadow\|cutover/);
  assert.match(workflow, /approval receipt must be exactly 64/);
  assert.match(workflow, /Deploy production cutover candidate with no traffic/);
  assert.match(
    workflow,
    /KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED requires KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE=shadow/,
  );

  const publicSources = [
    ...listTypeScriptFiles(join(root, "app")),
    ...listTypeScriptFiles(join(root, "components")),
  ].filter(
    (sourceFile) =>
      !relative(root, sourceFile).startsWith(`${join("app", "admin")}/`) &&
      !relative(root, sourceFile).startsWith(`${join("app", "cms-render")}/`),
  );
  for (const sourceFile of publicSources) {
    assert.doesNotMatch(
      readFileSync(sourceFile, "utf8"),
      /knowledgeCmsShadowRenderer|knowledgeCmsShadowDal|knowledgeCmsNativeRepresentation/,
      `${relative(root, sourceFile)} must not import private CMS rendering`,
    );
  }
  const publicRendererPage = readFileSync(
    join(root, "app/cms-render/[entryId]/page.tsx"),
    "utf8",
  );
  assert.match(publicRendererPage, /loadKnowledgeCmsPublicRoute/);
  assert.match(publicRendererPage, /renderKnowledgeCmsNativeRepresentationBody/);
  assert.doesNotMatch(publicRendererPage, /app\/.+\/page/);
});
