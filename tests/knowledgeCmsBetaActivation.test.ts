import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import type { KnowledgeCmsActor } from "../lib/knowledgeCms";
import { buildKnowledgeCmsArticleMaterializationDryRun } from "../lib/knowledgeCmsArticleMigrationDryRun";
import { buildKnowledgeCmsMigrationPreview } from "../lib/knowledgeCmsMigration";
import { resolveKnowledgeCmsPublicRendererMode } from "../lib/knowledgeCmsRendererContract";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const NOW = new Date("2026-07-31T19:00:00.000Z");
const ACTOR: KnowledgeCmsActor = {
  id: "beta-publisher",
  roles: ["publisher"],
};

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
    import("../lib/knowledgeCmsBetaActivation"),
    import("../lib/knowledgeCmsBetaActivationDal"),
    import("../lib/knowledgeCmsOperationalReadiness"),
    import("../lib/knowledgeCmsArticleMigrationVerification"),
  ]);
}

function roleDirectory() {
  return {
    status: "complete" as const,
    pagesRead: 1,
    accountsScanned: 3,
    accountsWithCmsClaims: 3,
    activeRoleAccounts: 3,
    invalidClaimAccounts: 0,
    disabledClaimAccounts: 0,
    unverifiedClaimAccounts: 0,
    roleCounts: {
      author: 1,
      editor: 0,
      reviewer: 1,
      publisher: 1,
      admin: 0,
    },
    capabilities: {
      authoringAccounts: 1,
      reviewerClaimAccounts: 1,
      verifiedReviewerAccounts: 1,
      publisherAccounts: 1,
      reviewerPublisherSeparationReady: true,
    },
    writeCount: 0 as const,
  };
}

async function operationalReadiness(
  rendererMode: "cutover" | "shadow" | "static" = "static",
) {
  const [, , readiness, verification] = await loadModules();
  const preview = buildKnowledgeCmsMigrationPreview({
    asOf: NOW,
    rendererMode: "static",
    existingRecords: [],
  });
  const workspace = {
    preview,
    articleMaterializationDryRun:
      buildKnowledgeCmsArticleMaterializationDryRun({
        preview,
        existingRecords: [],
        actor: ACTOR,
        now: NOW,
      }),
    executionHistory:
      verification.buildKnowledgeCmsArticleMigrationExecutionHistory([]),
  };
  return readiness.buildKnowledgeCmsOperationalReadinessReport({
    actor: ACTOR,
    observedAt: NOW,
    configuration: {
      cmsGate: "enabled",
      articleMigrationExecutionGate: "enabled",
      renderer: resolveKnowledgeCmsPublicRendererMode(rendererMode),
      firebase: {
        adminConfigured: true,
        browserAuthConfigured: true,
        projectAlignment: "matched",
      },
    },
    roleDirectory: roleDirectory(),
    workspaceEvidence: {
      status: "available",
      workspace,
      verifications: [],
    },
  });
}

function betaDeployment() {
  return {
    siteEnvironment: "staging",
    siteUrl: "https://beta.medicareinspokane.com",
  };
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

test("a fresh ready receipt at the exact beta identity produces a zero-mutation activation preview", async () => {
  const [activation] = await loadModules();
  const readiness = await operationalReadiness();
  const preview = activation.buildKnowledgeCmsBetaActivationPreview({
    actor: ACTOR,
    readiness,
    deployment: betaDeployment(),
    observedAt: NOW,
  });

  assert.equal(readiness.overall, "ready_for_guarded_private_operations");
  assert.equal(preview.eligibility, "ready_for_private_beta_activation");
  assert.equal(preview.environment.verified, true);
  assert.equal(preview.environment.observedSiteEnvironment, "staging");
  assert.equal(preview.environment.observedSiteOrigin, "beta");
  assert.equal(preview.readinessBinding.fingerprint, readiness.fingerprint.value);
  assert.equal(preview.readinessBinding.ageMilliseconds, 0);
  assert.equal(preview.checks.every((item) => item.status === "pass"), true);
  assert.equal(preview.activation.changesRequired, 1);
  assert.deepEqual(
    preview.activation.variables.map((item) => [
      item.name,
      item.current,
      item.proposed,
      item.scope,
    ]),
    [
      ["KNOWLEDGE_CMS_ENABLED", "true", "true", "beta_only"],
      [
        "KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED",
        "true",
        "true",
        "beta_only",
      ],
      [
        "KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE",
        "static",
        "shadow",
        "beta_only",
      ],
    ],
  );
  assert.equal(preview.activation.executionAuthorized, false);
  assert.equal(preview.activation.productionAuthorized, false);
  assert.equal(preview.rollback.steps.length, 5);
  assert.equal(preview.rollback.triggers.length, 6);
  assert.equal(preview.rollback.preservesCmsRecords, true);
  assert.equal(preview.rollback.writeCount, 0);
  assert.equal(preview.mutationBoundary.additionalReads, 0);
  assert.equal(preview.mutationBoundary.writeCount, 0);
  assert.equal(preview.publicSafety.effectiveRendererMode, "static");
  assert.equal(preview.publicSafety.publicCutoverEligible, false);
  assert.match(preview.fingerprint.value, /^[a-f0-9]{64}$/);
  assert.deepEqual(
    activation.validateKnowledgeCmsBetaActivationPreview(preview, readiness),
    [],
  );
  assert.equal(Object.isFrozen(preview), true);
  assert.equal(Object.isFrozen(preview.rollback.steps), true);
});

test("production and malformed deployment identities fail closed without reflecting unsafe raw values", async () => {
  const [activation] = await loadModules();
  const readiness = await operationalReadiness();
  const production = activation.buildKnowledgeCmsBetaActivationPreview({
    actor: ACTOR,
    readiness,
    deployment: {
      siteEnvironment: "production",
      siteUrl: "https://www.medicareinspokane.com",
    },
    observedAt: NOW,
  });
  assert.equal(production.eligibility, "blocked");
  assert.equal(production.environment.observedSiteEnvironment, "production");
  assert.equal(production.environment.observedSiteOrigin, "production");
  assert.equal(production.activation.productionAuthorized, false);

  const malformed = activation.buildKnowledgeCmsBetaActivationPreview({
    actor: ACTOR,
    readiness,
    deployment: {
      siteEnvironment: "staging ",
      siteUrl:
        "https://user:do-not-reflect@beta.medicareinspokane.com/path?secret=value",
    },
    observedAt: NOW,
  });
  assert.equal(malformed.eligibility, "blocked");
  assert.equal(
    malformed.environment.observedSiteEnvironment,
    "other_or_missing",
  );
  assert.equal(malformed.environment.observedSiteOrigin, "other_or_invalid");
  assert.doesNotMatch(JSON.stringify(malformed), /do-not-reflect|secret=value/);
});

test("stale, future-dated, and tampered readiness evidence blocks activation", async () => {
  const [activation] = await loadModules();
  const readiness = await operationalReadiness();
  const stale = activation.buildKnowledgeCmsBetaActivationPreview({
    actor: ACTOR,
    readiness,
    deployment: betaDeployment(),
    observedAt: new Date(
      NOW.getTime() + activation.KNOWLEDGE_CMS_BETA_READINESS_MAX_AGE_MS + 1,
    ),
  });
  assert.equal(stale.eligibility, "blocked");
  assert.equal(stale.readinessBinding.fresh, false);

  const future = activation.buildKnowledgeCmsBetaActivationPreview({
    actor: ACTOR,
    readiness,
    deployment: betaDeployment(),
    observedAt: new Date(NOW.getTime() - 1),
  });
  assert.equal(future.eligibility, "blocked");
  assert.equal(future.readinessBinding.fresh, false);

  const tampered = structuredClone(readiness);
  tampered.fingerprint.value = "0".repeat(64);
  const invalid = activation.buildKnowledgeCmsBetaActivationPreview({
    actor: ACTOR,
    readiness: tampered,
    deployment: betaDeployment(),
    observedAt: NOW,
  });
  assert.equal(invalid.eligibility, "blocked");
  assert.equal(invalid.readinessBinding.valid, false);
  assert.match(
    activation.validateKnowledgeCmsBetaActivationPreview(invalid, tampered).join(" "),
    /not bound/i,
  );
});

test("cutover is blocked by operational readiness and the beta activation boundary", async () => {
  const [activation, , readinessModule] = await loadModules();
  const readiness = await operationalReadiness("cutover");
  assert.equal(readiness.overall, "blocked");
  assert.equal(
    readiness.checks.find((item) => item.code === "renderer_configuration")
      ?.status,
    "blocked",
  );
  assert.match(
    readinessModule
      .validateKnowledgeCmsOperationalReadinessReport(readiness)
      .join(" "),
    /static-public/i,
  );
  const preview = activation.buildKnowledgeCmsBetaActivationPreview({
    actor: ACTOR,
    readiness,
    deployment: betaDeployment(),
    observedAt: NOW,
  });
  assert.equal(preview.eligibility, "blocked");
  assert.equal(
    preview.checks.find((item) => item.code === "public_static_guard")
      ?.status,
    "blocked",
  );
});

test("beta activation authorization is enforced before the readiness read", async () => {
  const [, activationDal] = await loadModules();
  let reads = 0;
  await assert.rejects(
    activationDal.readKnowledgeCmsBetaActivationPreview({
      actor: { id: "beta-editor", roles: ["editor"] },
      readinessProvider: {
        read: async () => {
          reads += 1;
          return operationalReadiness();
        },
      },
      deployment: betaDeployment(),
      now: NOW,
    }),
    /preview_migration.*role_required/i,
  );
  assert.equal(reads, 0);

  const preview = await activationDal.readKnowledgeCmsBetaActivationPreview({
    actor: ACTOR,
    readinessProvider: {
      read: async (actor, now) => {
        reads += 1;
        assert.equal(actor.id, ACTOR.id);
        assert.equal(now.toISOString(), NOW.toISOString());
        return operationalReadiness();
      },
    },
    deployment: betaDeployment(),
    now: NOW,
  });
  assert.equal(reads, 1);
  assert.equal(preview.eligibility, "ready_for_private_beta_activation");
});

test("the beta preview is private, server-only, zero-write, and absent from public code", () => {
  const moduleSource = readFileSync(
    join(root, "lib/knowledgeCmsBetaActivation.ts"),
    "utf8",
  );
  const dataAccess = readFileSync(
    join(root, "lib/knowledgeCmsBetaActivationDal.ts"),
    "utf8",
  );
  const page = readFileSync(
    join(root, "app/admin/knowledge/beta-activation/page.tsx"),
    "utf8",
  );
  const nextConfig = readFileSync(join(root, "next.config.ts"), "utf8");
  const sitemap = readFileSync(join(root, "app/sitemap.ts"), "utf8");
  const foundation = readFileSync(
    join(root, "docs/knowledge-cms-foundation.md"),
    "utf8",
  );
  const betaChecklist = readFileSync(
    join(root, "docs/deploy-beta-checklist.md"),
    "utf8",
  );

  assert.match(moduleSource, /^import "server-only";/);
  assert.match(dataAccess, /^import "server-only";/);
  assert.match(dataAccess, /assertKnowledgeCmsActionAllowed/);
  assert.match(dataAccess, /process\.env\.NEXT_PUBLIC_SITE_ENV/);
  assert.match(dataAccess, /process\.env\.NEXT_PUBLIC_SITE_URL/);
  assert.doesNotMatch(
    dataAccess,
    /createKnowledgeCmsRepository|\.save\s*\(|\.set\s*\(|\.delete\s*\(|runTransaction/,
  );
  assert.match(page, /getCurrentKnowledgeCmsActor/);
  assert.match(page, /isKnowledgeCmsEnabled/);
  assert.match(page, /notFound/);
  assert.doesNotMatch(page, /["']use client["']/);
  assert.doesNotMatch(page, /<form\b/);
  assert.match(nextConfig, /\/admin\/knowledge\/:path\*/);
  assert.doesNotMatch(sitemap, /beta-activation/);
  assert.match(foundation, /## Beta activation preview and rollback contract/);
  assert.match(foundation, /12 topics and 11 FAQs/);
  assert.match(betaChecklist, /\/admin\/knowledge\/beta-activation/);

  const publicSources = [
    ...listTypeScriptFiles(join(root, "app")),
    ...listTypeScriptFiles(join(root, "components")),
  ].filter(
    (sourceFile) =>
      !relative(root, sourceFile).startsWith(`${join("app", "admin")}/`),
  );
  for (const sourceFile of publicSources) {
    assert.doesNotMatch(
      readFileSync(sourceFile, "utf8"),
      /knowledgeCmsBetaActivation/,
      `${relative(root, sourceFile)} must not import beta activation`,
    );
  }
});
