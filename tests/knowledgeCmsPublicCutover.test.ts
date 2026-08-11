import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { afterEach, test } from "node:test";
import { fileURLToPath } from "node:url";
import { NextRequest } from "next/server";
import { knowledgeEntries, knowledgeSources } from "../lib/knowledgeCenter";
import type {
  KnowledgeCmsActor,
  KnowledgeCmsArticle,
} from "../lib/knowledgeCms";
import {
  getKnowledgeCmsRouteParity,
  knowledgeCmsRouteParityManifest,
} from "../lib/knowledgeCmsRouteParity";
import { knowledgeCmsRendererContracts } from "../lib/knowledgeCmsRendererContract";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const NOW = new Date("2026-07-31T18:00:00.000Z");
const RECEIPT_HASH = "a".repeat(64);

function mockServerOnlyModule() {
  const serverOnlyPath = require.resolve("server-only");
  require.cache[serverOnlyPath] = {
    exports: {},
    filename: serverOnlyPath,
    id: serverOnlyPath,
    loaded: true,
  } as never;
}

async function loadModules() {
  mockServerOnlyModule();
  return Promise.all([
    import("../lib/knowledgeCmsNativeRepresentation"),
    import("../lib/knowledgeCmsShadowRenderer"),
    import("../lib/knowledgeCmsPublicCutover"),
    import("../lib/knowledgeCmsPublicRenderer"),
    import("../lib/knowledgeCmsPublicRouting"),
  ]);
}

function articleRecord(entryId: string): KnowledgeCmsArticle {
  const contract = knowledgeCmsRendererContracts.find(
    (candidate) => candidate.entryId === entryId,
  );
  const parity = getKnowledgeCmsRouteParity(entryId);
  const entry = knowledgeEntries.find((candidate) => candidate.id === entryId);
  assert.ok(contract);
  assert.ok(parity);
  assert.ok(entry);
  return {
    schemaVersion: 1,
    id: contract.record.id,
    kind: "article",
    slug: contract.path.slice(1),
    status: "published",
    ownerId: "cutover-author",
    title: entry.title,
    summary: entry.summary,
    body: "Governed editable source kept separate from the lossless rendering artifact.",
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
    sources: (entry.sourceIds ?? []).map((sourceId) => {
      const source = knowledgeSources.find(
        (candidate) => candidate.id === sourceId,
      );
      assert.ok(source);
      const due = new Date(`${source.lastChecked}T00:00:00.000Z`);
      due.setUTCDate(due.getUTCDate() + 180);
      return {
        id: source.id,
        kind: "official",
        title: source.title,
        publisher: source.publisher,
        url: source.url,
        checkedAt: source.lastChecked,
        reviewDueAt: due.toISOString().slice(0, 10),
      };
    }),
    discoverability: {
      pageTitle: parity.metadata.pageTitle,
      description: parity.metadata.description,
      canonicalPath: contract.path,
      indexing: "blocked",
    },
    review: {
      reviewerAgentSlug: "licensed-reviewer",
      reviewerVerificationId: "cutover-reviewer-verification",
      reviewedBy: "cutover-reviewer",
      reviewedAt: "2026-07-30T20:00:00.000Z",
      reviewDueAt: "2027-01-26",
    },
    publication: {
      publishedAt: "2026-07-30T21:00:00.000Z",
      publishedBy: "cutover-publisher",
    },
    audit: {
      revision: 4,
      createdAt: "2026-07-30T19:00:00.000Z",
      createdBy: "cutover-author",
      updatedAt: "2026-07-30T21:00:00.000Z",
      updatedBy: "cutover-publisher",
    },
  };
}

function cutoverEnvironment(receipt: string) {
  return {
    cmsEnabled: "true",
    rendererMode: "cutover",
    cutoverEnabled: "true",
    approvalReceipt: receipt,
    approvalExecutionEnabled: "false",
    articleMigrationExecutionEnabled: "false",
    supportingMigrationExecutionEnabled: "false",
    nativeRepresentationExecutionEnabled: "false",
    cutoverRoutes: "turning-65-spokane",
    siteEnvironment: "production",
    siteUrl: "https://www.medicareinspokane.com",
  };
}

async function cutoverFixture() {
  const [native, shadow, cutover] = await loadModules();
  const records = knowledgeCmsRouteParityManifest.map((parity) =>
    articleRecord(parity.entryId),
  );
  const artifacts = records.map((record, index) => {
    const entryId = knowledgeCmsRouteParityManifest[index].entryId;
    const control = native.getKnowledgeCmsNativeRepresentationControl(entryId);
    assert.ok(control);
    return native.buildKnowledgeCmsNativeRepresentationArtifact({
      control,
      article: record,
      actorId: "cutover-publisher",
      createdAt: NOW.toISOString(),
    });
  });
  const shadowPreview = shadow.buildKnowledgeCmsShadowPreview(
    records,
    artifacts.map((artifact) => ({ id: artifact.id, data: artifact })),
    { asOf: NOW, rendererMode: "shadow" },
  );
  assert.deepEqual(shadow.validateKnowledgeCmsShadowPreview(shadowPreview), []);
  const readinessStub = {
    version: 3,
    fingerprint: { value: RECEIPT_HASH },
    migration: {
      targets: {
        verifiedPrivateDrafts: 45,
        verifiedAdvancedRecords: 0,
      },
    },
  } as never;
  const control = cutover.buildKnowledgeCmsPublicCutoverApprovalControl({
    readiness: readinessStub,
    shadow: shadowPreview,
    observedAt: NOW,
  });
  const actor: KnowledgeCmsActor = {
    id: "cutover-admin",
    roles: ["admin"],
  };
  const approval = cutover.buildKnowledgeCmsPublicCutoverApproval({
    actor,
    control,
    approvedAt: NOW,
  });
  const receipt = cutover.getKnowledgeCmsPublicCutoverReceipt(control);
  return { records, artifacts, control, approval, receipt };
}

const cutoverEnvKeys = [
  "KNOWLEDGE_CMS_ENABLED",
  "KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE",
  "KNOWLEDGE_CMS_PUBLIC_CUTOVER_ENABLED",
  "KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_RECEIPT",
  "KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_EXECUTION_ENABLED",
  "KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED",
  "KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED",
  "KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED",
  "KNOWLEDGE_CMS_PUBLIC_CUTOVER_ROUTES",
  "NEXT_PUBLIC_SITE_ENV",
  "NEXT_PUBLIC_SITE_URL",
] as const;

afterEach(() => {
  for (const key of cutoverEnvKeys) {
    delete process.env[key];
  }
});

test("approval execution is limited to the exact production shadow state", async () => {
  mockServerOnlyModule();
  const approval = await import("../lib/knowledgeCmsPublicCutoverDal");
  Object.assign(process.env, {
    KNOWLEDGE_CMS_ENABLED: "true",
    KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE: "shadow",
    KNOWLEDGE_CMS_PUBLIC_CUTOVER_ENABLED: "false",
    KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_EXECUTION_ENABLED: "true",
    KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED: "false",
    KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED: "false",
    KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED: "false",
    KNOWLEDGE_CMS_PUBLIC_CUTOVER_ROUTES: "",
    NEXT_PUBLIC_SITE_ENV: "production",
    NEXT_PUBLIC_SITE_URL: "https://www.medicareinspokane.com",
  });
  assert.equal(
    approval.isKnowledgeCmsPublicCutoverApprovalExecutionEnabled(),
    true,
  );

  for (const [key, value] of [
    ["KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED", "true"],
    ["KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE", "cutover"],
    ["KNOWLEDGE_CMS_PUBLIC_CUTOVER_ENABLED", "true"],
    ["NEXT_PUBLIC_SITE_ENV", "staging"],
    ["NEXT_PUBLIC_SITE_URL", "https://beta.medicareinspokane.com"],
  ] as const) {
    const previous = process.env[key];
    process.env[key] = value;
    assert.equal(
      approval.isKnowledgeCmsPublicCutoverApprovalExecutionEnabled(),
      false,
      `${key}=${value} must fail closed`,
    );
    process.env[key] = previous;
  }
});

test("public routing requires the complete exact cutover configuration", async () => {
  const [, , , , routing] = await loadModules();
  const valid = routing.resolveKnowledgeCmsPublicRouting(
    cutoverEnvironment(RECEIPT_HASH),
  );
  assert.equal(valid.routingEnabled, true);
  assert.equal(valid.effectiveMode, "cutover");
  assert.equal(valid.environment, "production");
  assert.deepEqual(valid.activeEntryIds, ["turning-65-spokane"]);

  const dormant = routing.resolveKnowledgeCmsPublicRouting({
    ...cutoverEnvironment(RECEIPT_HASH),
    cutoverRoutes: "",
  });
  assert.equal(dormant.routingEnabled, false);
  assert.equal(dormant.configurationValid, true);
  assert.equal(dormant.reason, "cutover_no_routes");

  for (const change of [
    { cutoverEnabled: "false" },
    { approvalExecutionEnabled: "true" },
    { articleMigrationExecutionEnabled: "true" },
    { approvalReceipt: "invalid" },
    { cutoverRoutes: "unknown-entry" },
    {
      siteEnvironment: "staging",
      siteUrl: "https://beta.medicareinspokane.com",
    },
  ]) {
    const result = routing.resolveKnowledgeCmsPublicRouting({
      ...cutoverEnvironment(RECEIPT_HASH),
      ...change,
    });
    assert.equal(result.routingEnabled, false);
    assert.equal(result.effectiveMode, "static");
    assert.equal(result.configurationValid, false);
  }
  assert.equal(
    routing.getKnowledgeCmsEntryIdForPublicPath(
      "/turning-65-medicare-spokane",
    ),
    "turning-65-spokane",
  );
  assert.equal(routing.getKnowledgeCmsEntryIdForPublicPath("/"), undefined);
});

test("an immutable approval binds all 22 revision artifacts and expires", async () => {
  const [, , cutover] = await loadModules();
  const fixture = await cutoverFixture();
  assert.equal(fixture.control.evidence.recordsVerified, 45);
  assert.equal(fixture.control.evidence.routesVerified, 22);
  assert.equal(fixture.control.routes.length, 22);
  assert.match(fixture.receipt, /^[a-f0-9]{64}$/);
  assert.deepEqual(
    cutover.validateKnowledgeCmsPublicCutoverApprovalControl(
      fixture.control,
      NOW,
    ),
    [],
  );
  assert.deepEqual(
    cutover.validateKnowledgeCmsPublicCutoverApproval(
      fixture.approval,
      fixture.receipt,
      NOW,
    ),
    [],
  );
  assert.match(
    cutover
      .validateKnowledgeCmsPublicCutoverApproval(
        fixture.approval,
        fixture.receipt,
        new Date("2026-08-08T18:00:00.000Z"),
      )
      .join(" "),
    /validity window/i,
  );
  const tampered = structuredClone(fixture.approval);
  tampered.control.routes[0].articleRevision += 1;
  assert.match(
    cutover
      .validateKnowledgeCmsPublicCutoverApproval(
        tampered,
        fixture.receipt,
        NOW,
      )
      .join(" "),
    /fingerprint/i,
  );
});

test("public route loading serves only matching live evidence and otherwise falls back", async () => {
  const [, , , publicRenderer] = await loadModules();
  const fixture = await cutoverFixture();
  const entryId = knowledgeCmsRouteParityManifest[0].entryId;
  const route = fixture.control.routes.find(
    (candidate) => candidate.entryId === entryId,
  );
  assert.ok(route);
  const record = fixture.records.find((item) => item.id === route.articleId);
  const artifact = fixture.artifacts.find(
    (item) => item.id === route.representationId,
  );
  assert.ok(record);
  assert.ok(artifact);
  const provider = {
    getApproval: async (id: string) =>
      id === fixture.approval.id ? fixture.approval : undefined,
    getArticle: async () => record,
    getRepresentation: async () => artifact,
  };
  const candidate = await publicRenderer.loadKnowledgeCmsPublicRoute({
    entryId,
    now: NOW,
    provider,
    environment: cutoverEnvironment(fixture.receipt),
  });
  assert.equal(candidate.outcome, "cms_candidate");

  const stale = await publicRenderer.loadKnowledgeCmsPublicRoute({
    entryId,
    now: NOW,
    provider: {
      ...provider,
      getArticle: async () => ({
        ...record,
        audit: { ...record.audit, revision: record.audit.revision + 1 },
      }),
    },
    environment: cutoverEnvironment(fixture.receipt),
  });
  assert.equal(stale.outcome, "static_fallback");
  assert.equal(stale.outcome === "static_fallback" && stale.reason, "evidence_mismatch");

  const missingApproval = await publicRenderer.loadKnowledgeCmsPublicRoute({
    entryId,
    now: NOW,
    provider: { ...provider, getApproval: async () => undefined },
    environment: cutoverEnvironment(fixture.receipt),
  });
  assert.equal(missingApproval.outcome, "static_fallback");
  assert.equal(
    missingApproval.outcome === "static_fallback" && missingApproval.reason,
    "approval_missing",
  );

  const timedOut = await publicRenderer.loadKnowledgeCmsPublicRoute({
    entryId,
    now: NOW,
    provider: {
      ...provider,
      getApproval: async () => new Promise(() => {}),
    },
    environment: cutoverEnvironment(fixture.receipt),
    timeoutMilliseconds: 5,
  });
  assert.equal(timedOut.outcome, "static_fallback");
  assert.equal(timedOut.outcome === "static_fallback" && timedOut.reason, "timeout");
});

test("proxy rewrites only governed cutover paths and blocks direct internal URLs", async () => {
  Object.assign(process.env, {
    KNOWLEDGE_CMS_ENABLED: "true",
    KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE: "cutover",
    KNOWLEDGE_CMS_PUBLIC_CUTOVER_ENABLED: "true",
    KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_RECEIPT: RECEIPT_HASH,
    KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_EXECUTION_ENABLED: "false",
    KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED: "false",
    KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED: "false",
    KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED: "false",
    KNOWLEDGE_CMS_PUBLIC_CUTOVER_ROUTES: "turning-65-spokane",
    NEXT_PUBLIC_SITE_ENV: "production",
    NEXT_PUBLIC_SITE_URL: "https://www.medicareinspokane.com",
  });
  const [, , , , routing] = await loadModules();
  const { proxy } = await import("../proxy");
  const governed = proxy(
    new NextRequest(
      "https://www.medicareinspokane.com/turning-65-medicare-spokane",
    ),
  );
  assert.match(
    governed.headers.get("x-middleware-rewrite") ?? "",
    /\/cms-render\/turning-65-spokane$/,
  );
  assert.equal(governed.headers.get("x-knowledge-cms-cutover"), "routed");

  const governedButNotSelected = proxy(
    new NextRequest("https://www.medicareinspokane.com/compare-medicare-options"),
  );
  assert.equal(
    governedButNotSelected.headers.get("x-middleware-rewrite"),
    null,
  );

  const protectedRoute = proxy(
    new NextRequest("https://www.medicareinspokane.com/medicare-spokane"),
  );
  assert.equal(protectedRoute.headers.get("x-middleware-rewrite"), null);

  const internal = proxy(
    new NextRequest(
      "https://www.medicareinspokane.com/cms-render/turning-65-spokane",
    ),
  );
  assert.equal(internal.status, 404);
  assert.match(internal.headers.get("x-robots-tag") ?? "", /noindex/);

  const path = "/turning-65-medicare-spokane";
  const entryId = "turning-65-spokane";
  const trustedInternal = proxy(
    new NextRequest(
      `https://www.medicareinspokane.com/cms-render/${entryId}`,
      {
        headers: {
          "x-knowledge-cms-cutover-route": path,
          "x-knowledge-cms-cutover-proof":
            routing.createKnowledgeCmsPublicCutoverRouteProof({
              entryId,
              path,
              receipt: RECEIPT_HASH,
            }),
        },
      },
    ),
  );
  assert.equal(trustedInternal.status, 200);
  assert.equal(
    trustedInternal.headers.get("x-knowledge-cms-cutover"),
    "routed",
  );

  const forgedInternal = proxy(
    new NextRequest(
      `https://www.medicareinspokane.com/cms-render/${entryId}`,
      {
        headers: { "x-knowledge-cms-cutover-route": path },
      },
    ),
  );
  assert.equal(forgedInternal.status, 404);
});

test("approval, deployment, and direct-route boundaries remain explicit and fail closed", () => {
  const approvalDal = readFileSync(
    join(root, "lib/knowledgeCmsPublicCutoverDal.ts"),
    "utf8",
  );
  const page = readFileSync(
    join(root, "app/admin/knowledge/public-cutover/page.tsx"),
    "utf8",
  );
  const workflow = readFileSync(
    join(root, ".github/workflows/deploy.yml"),
    "utf8",
  );
  const sitemap = readFileSync(join(root, "app/sitemap.ts"), "utf8");
  const foundation = readFileSync(
    join(root, "docs/knowledge-cms-foundation.md"),
    "utf8",
  );

  assert.match(approvalDal, /^import "server-only";/);
  assert.match(approvalDal, /const actor = await requireKnowledgeCmsActor\(\)/);
  assert.ok(
    approvalDal.indexOf("const actor = await requireKnowledgeCmsActor()") <
      approvalDal.indexOf("const db = getFirestoreAdmin()"),
  );
  assert.match(approvalDal, /transaction\.getAll\(/);
  assert.equal(approvalDal.match(/transaction\.set\(/g)?.length, 2);
  assert.doesNotMatch(approvalDal, /transaction\.delete\(|\.update\s*\(/);
  assert.match(page, /getCurrentKnowledgeCmsActor/);
  assert.match(page, /isKnowledgeCmsEnabled/);
  assert.match(page, /notFound/);
  assert.doesNotMatch(sitemap, /cms-render|public-cutover/);
  assert.match(workflow, /--no-traffic/);
  assert.match(workflow, /--tag=cms-cutover-candidate/);
  const cutoverDeployStart = workflow.indexOf(
    "- name: Deploy production cutover candidate with no traffic",
  );
  const candidateResolutionStart = workflow.indexOf(
    "- name: Resolve production cutover candidate URL",
  );
  assert.ok(cutoverDeployStart >= 0);
  assert.ok(candidateResolutionStart > cutoverDeployStart);
  const cutoverDeploy = workflow.slice(
    cutoverDeployStart,
    candidateResolutionStart,
  );
  assert.doesNotMatch(cutoverDeploy, /update-traffic|--to-revisions/);
  assert.ok(
    workflow.indexOf("- name: Verify production cutover candidate before traffic") <
      workflow.indexOf("- name: Promote verified production cutover revision"),
  );
  assert.match(workflow, /verify-knowledge-cms-production-routes\.mjs/);
  assert.match(workflow, /KNOWLEDGE_CMS_PUBLIC_CUTOVER_ROUTES/);
  assert.match(
    foundation,
    /## Guarded public cutover and rollback contract/,
  );
});
