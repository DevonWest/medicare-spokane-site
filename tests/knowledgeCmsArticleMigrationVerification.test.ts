import assert from "node:assert/strict";
import {
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import type { KnowledgeCmsArticle } from "../lib/knowledgeCms";
import {
  buildKnowledgeCmsMigrationPreview,
  type KnowledgeCmsMigrationArticleTarget,
} from "../lib/knowledgeCmsMigration";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const NOW = new Date("2026-07-30T22:00:00.000Z");
const LATER = "2026-07-31T01:00:00.000Z";
const ACTOR_ID = "migration-publisher";

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
    import("../lib/knowledgeCmsArticleMigrationVerification"),
    import("../lib/knowledgeCmsArticleMigrationDryRun"),
  ]);
}

function firstTarget(): KnowledgeCmsMigrationArticleTarget {
  const candidate = buildKnowledgeCmsMigrationPreview({
    asOf: NOW,
    rendererMode: "static",
  }).candidates.find(
    (item) =>
      item.target.kind === "article" &&
      item.target.controlRecord,
  );
  assert.ok(candidate?.target.kind === "article");
  return candidate.target;
}

function currentAudit(
  target: KnowledgeCmsMigrationArticleTarget,
  recordFingerprint: string,
) {
  assert.ok(target.controlRecord);
  assert.ok(target.canonicalPath);
  return {
    event: "migration_create_private_draft",
    actorId: ACTOR_ID,
    kind: "article",
    recordId: target.id,
    revision: 1,
    status: "draft",
    slug: target.slug,
    occurredAt: NOW.toISOString(),
    migrationControlId: target.controlRecord.controlId,
    migrationControlFingerprint:
      target.controlRecord.fingerprint.value,
    migrationExecutionVersion: 1,
    migrationWriteCount: 4,
    migrationRecordFingerprint: recordFingerprint,
    canonicalPath: target.canonicalPath,
    publicSource: "verified_static_route",
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

test("authenticated history validates, sorts, fingerprints, and excludes malformed events", async () => {
  const [verification, dryRun] = await loadModules();
  const target = firstTarget();
  const record = dryRun.materializeKnowledgeCmsArticleMigrationRecord(
    target,
    ACTOR_ID,
    NOW.toISOString(),
  );
  const recordFingerprint =
    verification.fingerprintKnowledgeCmsArticleMigrationRecord(record);
  const audit = currentAudit(target, recordFingerprint);
  const documentId =
    verification.getKnowledgeCmsArticleMigrationAuditDocumentId(
      target.id,
    );
  const history =
    verification.buildKnowledgeCmsArticleMigrationExecutionHistory([
      { id: documentId, data: audit },
      {
        id: "article--malformed--0000000001",
        data: {
          ...audit,
          recordId: "malformed",
          canonicalPath: target.canonicalPath,
          migrationExecutionVersion: undefined,
        },
      },
    ]);

  assert.equal(history.mode, "authenticated_execution_history");
  assert.equal(history.summary.eventsObserved, 2);
  assert.equal(history.summary.validEvents, 1);
  assert.equal(history.summary.invalidEvents, 1);
  assert.equal(history.summary.controlsVerified, 1);
  assert.equal(history.summary.writeCount, 0);
  assert.equal(history.entries[0].recordId, target.id);
  assert.equal(history.entries[0].title, target.title);
  assert.equal(
    history.entries[0].transaction.evidenceSchema,
    "execution_v1",
  );
  assert.match(history.entries[0].evidenceFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(Object.isFrozen(history), true);
  assert.equal(Object.isFrozen(history.entries[0]), true);
});

test("an untouched private draft verifies all five Firestore artifacts", async () => {
  const [verification, dryRun] = await loadModules();
  const target = firstTarget();
  assert.ok(target.canonicalPath);
  const record = dryRun.materializeKnowledgeCmsArticleMigrationRecord(
    target,
    ACTOR_ID,
    NOW.toISOString(),
  );
  const audit = currentAudit(
    target,
    verification.fingerprintKnowledgeCmsArticleMigrationRecord(record),
  );
  const result =
    verification.buildKnowledgeCmsArticleMigrationPostCreateVerification({
      auditDocumentId:
        verification.getKnowledgeCmsArticleMigrationAuditDocumentId(
          target.id,
        ),
      auditData: audit,
      recordData: record,
      slugLockData: {
        kind: "article",
        recordId: record.id,
        slug: record.slug,
        updatedAt: record.audit.updatedAt,
      },
      canonicalLockData: {
        canonicalPath: target.canonicalPath,
        kind: "article",
        recordId: record.id,
        updatedAt: record.audit.updatedAt,
      },
      searchData: undefined,
      observedAt: new Date(LATER),
    });

  assert.equal(result.status, "verified_private_draft");
  assert.equal(result.currentRevision, 1);
  assert.equal(result.artifacts.readCount, 5);
  assert.equal(result.artifacts.writeCount, 0);
  assert.equal(result.artifacts.repairAttempted, false);
  assert.ok(result.checks.every((item) => item.status === "verified"));
  assert.equal(result.rollout.publicSource, "verified_static_route");
  assert.equal(result.rollout.cmsBodyPubliclyRendered, false);
  assert.equal(result.rollout.indexingChanged, false);
  assert.equal(result.rollout.cutoverEligible, false);
  assert.match(result.fingerprint.value, /^[a-f0-9]{64}$/);
});

test("legacy PR 100 audit evidence remains directly verifiable without mutation", async () => {
  const [verification, dryRun] = await loadModules();
  const target = firstTarget();
  assert.ok(target.controlRecord);
  assert.ok(target.canonicalPath);
  const record = dryRun.materializeKnowledgeCmsArticleMigrationRecord(
    target,
    ACTOR_ID,
    NOW.toISOString(),
  );
  const legacyAudit = {
    event: "migration_create_private_draft",
    actorId: ACTOR_ID,
    kind: "article",
    recordId: target.id,
    revision: 1,
    status: "draft",
    slug: target.slug,
    occurredAt: NOW.toISOString(),
    migrationControlId: target.controlRecord.controlId,
    migrationControlFingerprint:
      target.controlRecord.fingerprint.value,
    publicSource: "verified_static_route",
  };
  const result =
    verification.buildKnowledgeCmsArticleMigrationPostCreateVerification({
      auditDocumentId:
        verification.getKnowledgeCmsArticleMigrationAuditDocumentId(
          target.id,
        ),
      auditData: legacyAudit,
      recordData: record,
      slugLockData: {
        kind: "article",
        recordId: record.id,
        slug: record.slug,
        updatedAt: record.audit.updatedAt,
      },
      canonicalLockData: {
        canonicalPath: target.canonicalPath,
        kind: "article",
        recordId: record.id,
        updatedAt: record.audit.updatedAt,
      },
      searchData: undefined,
      observedAt: new Date(LATER),
    });

  assert.equal(result.status, "verified_private_draft");
  assert.equal(
    result.history?.transaction.evidenceSchema,
    "legacy_pr100",
  );
  assert.equal(
    result.checks.find((item) => item.code === "record_fingerprint")
      ?.status,
    "not_applicable",
  );
});

test("valid later revisions are distinguished from a failed post-create snapshot", async () => {
  const [verification, dryRun] = await loadModules();
  const target = firstTarget();
  assert.ok(target.canonicalPath);
  const initial = dryRun.materializeKnowledgeCmsArticleMigrationRecord(
    target,
    ACTOR_ID,
    NOW.toISOString(),
  );
  const advanced: KnowledgeCmsArticle = {
    ...initial,
    summary: `${initial.summary} Editorial clarification added.`,
    audit: {
      ...initial.audit,
      revision: 2,
      updatedAt: LATER,
      updatedBy: "migration-editor",
    },
  };
  const audit = currentAudit(
    target,
    verification.fingerprintKnowledgeCmsArticleMigrationRecord(initial),
  );
  const result =
    verification.buildKnowledgeCmsArticleMigrationPostCreateVerification({
      auditDocumentId:
        verification.getKnowledgeCmsArticleMigrationAuditDocumentId(
          target.id,
        ),
      auditData: audit,
      recordData: advanced,
      slugLockData: {
        kind: "article",
        recordId: advanced.id,
        slug: advanced.slug,
        updatedAt: LATER,
      },
      canonicalLockData: {
        canonicalPath: target.canonicalPath,
        kind: "article",
        recordId: advanced.id,
        updatedAt: LATER,
      },
      searchData: undefined,
      observedAt: new Date("2026-07-31T02:00:00.000Z"),
    });

  assert.equal(result.status, "record_advanced");
  assert.ok(
    result.checks.every(
      (item) => item.status === "verified",
    ),
  );
});

test("missing or contradictory control, record, lock, and search evidence fails closed", async () => {
  const [verification, dryRun] = await loadModules();
  const target = firstTarget();
  assert.ok(target.canonicalPath);
  const record = dryRun.materializeKnowledgeCmsArticleMigrationRecord(
    target,
    ACTOR_ID,
    NOW.toISOString(),
  );
  const audit = currentAudit(
    target,
    verification.fingerprintKnowledgeCmsArticleMigrationRecord(record),
  );
  const base = {
    auditDocumentId:
      verification.getKnowledgeCmsArticleMigrationAuditDocumentId(
        target.id,
      ),
    auditData: audit,
    recordData: record,
    slugLockData: {
      kind: "article",
      recordId: record.id,
      slug: record.slug,
      updatedAt: record.audit.updatedAt,
    },
    canonicalLockData: {
      canonicalPath: target.canonicalPath,
      kind: "article",
      recordId: record.id,
      updatedAt: record.audit.updatedAt,
    },
    searchData: undefined,
    observedAt: new Date(LATER),
  };
  const cases = [
    {
      ...base,
      auditData: {
        ...audit,
        migrationControlFingerprint: "0".repeat(64),
      },
    },
    { ...base, recordData: undefined },
    {
      ...base,
      slugLockData: { ...base.slugLockData, recordId: "another-record" },
    },
    {
      ...base,
      canonicalLockData: {
        ...base.canonicalLockData,
        recordId: "another-record",
      },
    },
    { ...base, searchData: { unexpected: true } },
  ];

  for (const artifacts of cases) {
    const result =
      verification.buildKnowledgeCmsArticleMigrationPostCreateVerification(
        artifacts,
      );
    assert.equal(result.status, "failed");
    assert.ok(result.checks.some((item) => item.status === "failed"));
    assert.equal(result.artifacts.writeCount, 0);
    assert.equal(result.artifacts.repairAttempted, false);
  }
});

test("history and verification remain private read-only server boundaries", () => {
  const moduleSource = readFileSync(
    join(root, "lib/knowledgeCmsArticleMigrationVerification.ts"),
    "utf8",
  );
  const repository = readFileSync(
    join(root, "lib/knowledgeCmsRepository.ts"),
    "utf8",
  );
  const page = readFileSync(
    join(
      root,
      "app/admin/knowledge/migration-preview/[recordId]/page.tsx",
    ),
    "utf8",
  );

  assert.match(moduleSource, /^import "server-only";/);
  assert.doesNotMatch(moduleSource, /\.save\s*\(|\.set\s*\(|\.delete\s*\(/);
  assert.match(repository, /preview_migration/);
  assert.match(repository, /runTransaction/);
  assert.match(
    repository,
    /buildKnowledgeCmsArticleMigrationPostCreateVerification/,
  );
  assert.match(page, /getCurrentKnowledgeCmsActor/);
  assert.match(page, /getKnowledgeCmsAdminArticleMigrationVerification/);
  assert.match(page, /isKnowledgeCmsEnabled/);
  assert.match(page, /notFound/);
  assert.doesNotMatch(page, /["']use client["']/);

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
      /knowledgeCmsArticleMigrationVerification/,
      `${relative(root, sourceFile)} must not import migration verification`,
    );
  }
});
