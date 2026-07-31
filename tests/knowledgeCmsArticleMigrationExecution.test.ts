import assert from "node:assert/strict";
import {
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import { afterEach, test } from "node:test";
import { fileURLToPath } from "node:url";
import { buildKnowledgeCmsMigrationPreview } from "../lib/knowledgeCmsMigration";
import type { KnowledgeCmsActor } from "../lib/knowledgeCms";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const NOW = new Date("2026-07-30T22:00:00.000Z");
const PUBLISHER: KnowledgeCmsActor = {
  id: "migration-publisher",
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

async function loadExecutionModule() {
  mockServerOnlyModule();
  return import("../lib/knowledgeCmsArticleMigrationExecution");
}

function firstControl() {
  const preview = buildKnowledgeCmsMigrationPreview({ asOf: NOW });
  const candidate = preview.candidates.find(
    (item) =>
      item.target.kind === "article" &&
      item.target.controlRecord,
  );
  assert.ok(candidate?.target.kind === "article");
  assert.ok(candidate.target.controlRecord);
  return {
    target: candidate.target,
    control: candidate.target.controlRecord,
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

afterEach(() => {
  delete process.env.KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED;
});

test("article migration execution is separately exact-true gated", async () => {
  const {
    assertKnowledgeCmsArticleMigrationExecutionEnabled,
    isKnowledgeCmsArticleMigrationExecutionEnabled,
  } = await loadExecutionModule();

  for (const value of [undefined, "", "false", "TRUE", " true "]) {
    assert.equal(
      isKnowledgeCmsArticleMigrationExecutionEnabled(value),
      false,
    );
  }
  assert.equal(
    isKnowledgeCmsArticleMigrationExecutionEnabled("true"),
    true,
  );
  assert.throws(
    () => assertKnowledgeCmsArticleMigrationExecutionEnabled("false"),
    /execution is disabled/i,
  );
});

test("one exact control produces a private transaction plan", async () => {
  const {
    buildKnowledgeCmsArticleMigrationExecutionPlan,
    getKnowledgeCmsArticleMigrationConfirmationPhrase,
  } = await loadExecutionModule();
  process.env.KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED = "true";
  const { control, target } = firstControl();
  const confirmation =
    getKnowledgeCmsArticleMigrationConfirmationPhrase(target.slug);
  const plan = buildKnowledgeCmsArticleMigrationExecutionPlan({
    actor: PUBLISHER,
    now: NOW,
    request: {
      controlId: control.controlId,
      controlFingerprint: control.fingerprint.value,
      confirmation,
    },
  });

  assert.equal(plan.mode, "single_article_private_draft");
  assert.equal(plan.control.id, control.controlId);
  assert.equal(plan.control.fingerprint, control.fingerprint.value);
  assert.equal(plan.confirmation.expected, confirmation);
  assert.equal(plan.record.ownerId, PUBLISHER.id);
  assert.equal(plan.record.audit.createdAt, NOW.toISOString());
  assert.equal(plan.record.audit.createdBy, PUBLISHER.id);
  assert.equal(plan.record.status, "draft");
  assert.equal(plan.record.discoverability.indexing, "blocked");
  assert.equal(plan.record.review, undefined);
  assert.equal(plan.record.publication, undefined);
  assert.equal(plan.transaction.writeCount, 4);
  assert.equal(plan.transaction.createsOneCmsRecord, true);
  assert.deepEqual(plan.transaction.rechecks, [
    "authenticated_actor",
    "control_fingerprint",
    "expected_absent_document",
    "slug_lock_and_legacy_owner",
    "canonical_lock_and_legacy_owner",
    "search_projection_absence",
    "revision_one_audit_absence",
  ]);
  assert.equal(plan.rollout.publicSource, "verified_static_route");
  assert.equal(plan.rollout.cmsBodyPubliclyRendered, false);
  assert.equal(plan.rollout.cutoverEligible, false);
  assert.equal(plan.rollout.bulkExecution, false);
});

test("forged, stale, ambiguous, and unauthorized execution inputs fail closed", async () => {
  const {
    buildKnowledgeCmsArticleMigrationExecutionPlan,
    getKnowledgeCmsArticleMigrationConfirmationPhrase,
  } = await loadExecutionModule();
  process.env.KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED = "true";
  const { control, target } = firstControl();
  const validRequest = {
    controlId: control.controlId,
    controlFingerprint: control.fingerprint.value,
    confirmation:
      getKnowledgeCmsArticleMigrationConfirmationPhrase(target.slug),
  };

  assert.throws(
    () =>
      buildKnowledgeCmsArticleMigrationExecutionPlan({
        actor: { id: "migration-editor", roles: ["editor"] },
        now: NOW,
        request: validRequest,
      }),
    /execute_article_migration.*role_required/i,
  );
  assert.throws(
    () =>
      buildKnowledgeCmsArticleMigrationExecutionPlan({
        actor: PUBLISHER,
        now: NOW,
        request: {
          ...validRequest,
          controlFingerprint: "0".repeat(64),
        },
      }),
    /control changed/i,
  );
  assert.throws(
    () =>
      buildKnowledgeCmsArticleMigrationExecutionPlan({
        actor: PUBLISHER,
        now: NOW,
        request: {
          ...validRequest,
          confirmation: "CREATE PRIVATE DRAFT a-different-article",
        },
      }),
    /confirmation phrase/i,
  );
  assert.throws(
    () =>
      buildKnowledgeCmsArticleMigrationExecutionPlan({
        actor: PUBLISHER,
        now: NOW,
        request: {
          ...validRequest,
          controlId: "resource-library-article-control--missing",
        },
      }),
    /was not found/i,
  );
  assert.throws(
    () =>
      buildKnowledgeCmsArticleMigrationExecutionPlan({
        actor: PUBLISHER,
        now: new Date(Number.NaN),
        request: validRequest,
      }),
    /valid transaction server clock/i,
  );
});

test("execution remains private, single-record, and server-authorized", () => {
  const execution = readFileSync(
    join(root, "lib/knowledgeCmsArticleMigrationExecution.ts"),
    "utf8",
  );
  const repository = readFileSync(
    join(root, "lib/knowledgeCmsRepository.ts"),
    "utf8",
  );
  const dal = readFileSync(
    join(root, "lib/knowledgeCmsMigrationDal.ts"),
    "utf8",
  );
  const action = readFileSync(
    join(root, "app/admin/knowledge/actions.ts"),
    "utf8",
  );
  const control = readFileSync(
    join(
      root,
      "app/admin/knowledge/components/KnowledgeArticleMigrationExecutionControl.tsx",
    ),
    "utf8",
  );

  assert.match(execution, /^import "server-only";/);
  assert.match(execution, /execute_article_migration/);
  assert.match(repository, /runTransaction/);
  assert.match(repository, /currentSnapshot\.exists/);
  assert.match(repository, /slugSnapshot\.exists/);
  assert.match(repository, /canonicalSnapshot\.exists/);
  assert.match(repository, /searchSnapshot\.exists/);
  assert.match(repository, /auditSnapshot\.exists/);
  assert.match(dal, /const actor = await requireKnowledgeCmsActor\(\)/);
  assert.match(action, /parseKnowledgeCmsArticleMigrationExecutionForm/);
  assert.match(control, /useActionState/);
  assert.doesNotMatch(control, /ownerId|audit\.createdAt|status="published"/);

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
      /knowledgeCmsArticleMigrationExecution/,
      `${relative(root, sourceFile)} must not import migration execution`,
    );
  }
});
