import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import type { EditorialReviewerVerification } from "../lib/editorial";
import type { KnowledgeCmsActor } from "../lib/knowledgeCms";
import {
  buildKnowledgeCmsArticleMaterializationDryRun,
  materializeKnowledgeCmsArticleMigrationRecord,
} from "../lib/knowledgeCmsArticleMigrationDryRun";
import {
  buildKnowledgeCmsMigrationPreview,
  type KnowledgeCmsMigrationArticleTarget,
} from "../lib/knowledgeCmsMigration";
import { resolveKnowledgeCmsPublicRendererMode } from "../lib/knowledgeCmsRendererContract";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const NOW = new Date("2026-07-31T18:00:00.000Z");
const ACTOR: KnowledgeCmsActor = {
  id: "readiness-publisher",
  roles: ["publisher"],
};
const reviewerVerifications: EditorialReviewerVerification[] = [
  {
    id: "readiness-lynn-wold",
    agentSlug: "lynn-wold",
    status: "verified",
    credentialName: "Washington insurance producer license",
    jurisdiction: "Washington",
    verifiedAt: "2026-07-30",
    validThrough: "2027-07-30",
    verificationSourceUrl: "https://example.gov/license/lynn-wold",
  },
];

function mockServerOnlyModule() {
  const serverOnlyPath = require.resolve("server-only");
  require.cache[serverOnlyPath] = {
    exports: {},
    filename: serverOnlyPath,
    id: serverOnlyPath,
    loaded: true,
  } as never;
}

async function loadReadinessModules() {
  mockServerOnlyModule();
  return Promise.all([
    import("../lib/knowledgeCmsOperationalReadiness"),
    import("../lib/knowledgeCmsOperationalReadinessDal"),
    import("../lib/knowledgeCmsArticleMigrationVerification"),
  ]);
}

function roleUsers() {
  return [
    {
      uid: "readiness-author",
      emailVerified: true,
      disabled: false,
      customClaims: { knowledgeCmsRoles: ["author"] },
    },
    {
      uid: "readiness-reviewer",
      emailVerified: true,
      disabled: false,
      customClaims: {
        knowledgeCmsRoles: ["reviewer"],
        knowledgeCmsAgentSlug: "lynn-wold",
      },
    },
    {
      uid: ACTOR.id,
      emailVerified: true,
      disabled: false,
      customClaims: { knowledgeCmsRoles: ["publisher"] },
    },
  ];
}

async function completeRoleDirectory() {
  const [readiness] = await loadReadinessModules();
  return readiness.scanKnowledgeCmsRoleDirectory(
    {
      listUsers: async (_maxResults, pageToken) =>
        pageToken
          ? { users: roleUsers().slice(1) }
          : { users: roleUsers().slice(0, 1), pageToken: "second-page" },
    },
    NOW,
    reviewerVerifications,
  );
}

function configuration(execution = true) {
  return {
    cmsGate: "enabled" as const,
    articleMigrationExecutionGate: execution
      ? "enabled" as const
      : "disabled" as const,
    renderer: resolveKnowledgeCmsPublicRendererMode("static"),
    firebase: {
      adminConfigured: true,
      browserAuthConfigured: true,
      projectAlignment: "matched" as const,
    },
  };
}

async function emptyWorkspace() {
  const [, , verification] = await loadReadinessModules();
  const preview = buildKnowledgeCmsMigrationPreview({
    asOf: NOW,
    rendererMode: "static",
    existingRecords: [],
  });
  return {
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
}

function firstArticleTarget(): KnowledgeCmsMigrationArticleTarget {
  const candidate = buildKnowledgeCmsMigrationPreview({
    asOf: NOW,
    rendererMode: "static",
  }).candidates.find(
    (item) =>
      item.target.kind === "article" && item.target.controlRecord,
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
    actorId: ACTOR.id,
    kind: "article",
    recordId: target.id,
    revision: 1,
    status: "draft",
    slug: target.slug,
    occurredAt: NOW.toISOString(),
    migrationControlId: target.controlRecord.controlId,
    migrationControlFingerprint: target.controlRecord.fingerprint.value,
    migrationExecutionVersion: 1,
    migrationWriteCount: 4,
    migrationRecordFingerprint: recordFingerprint,
    canonicalPath: target.canonicalPath,
    publicSource: "verified_static_route",
  };
}

async function workspaceWithCreatedTarget(searchData?: unknown) {
  const [, , verificationModule] = await loadReadinessModules();
  const target = firstArticleTarget();
  assert.ok(target.canonicalPath);
  const record = materializeKnowledgeCmsArticleMigrationRecord(
    target,
    ACTOR.id,
    NOW.toISOString(),
  );
  const audit = currentAudit(
    target,
    verificationModule.fingerprintKnowledgeCmsArticleMigrationRecord(record),
  );
  const auditDocumentId =
    verificationModule.getKnowledgeCmsArticleMigrationAuditDocumentId(target.id);
  const preview = buildKnowledgeCmsMigrationPreview({
    asOf: NOW,
    rendererMode: "static",
    existingRecords: [record],
  });
  const verification =
    verificationModule.buildKnowledgeCmsArticleMigrationPostCreateVerification({
      auditDocumentId,
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
      searchData,
      observedAt: new Date("2026-07-31T18:05:00.000Z"),
    });
  return {
    target,
    workspace: {
      preview,
      articleMaterializationDryRun:
        buildKnowledgeCmsArticleMaterializationDryRun({
          preview,
          existingRecords: [record],
          actor: ACTOR,
          now: NOW,
        }),
      executionHistory:
        verificationModule.buildKnowledgeCmsArticleMigrationExecutionHistory([
          { id: auditDocumentId, data: audit },
        ]),
    },
    verification,
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

test("role readiness paginates Auth users and proves reviewer-publisher separation without identities", async () => {
  const snapshot = await completeRoleDirectory();

  assert.equal(snapshot.status, "complete");
  assert.equal(snapshot.pagesRead, 2);
  assert.equal(snapshot.accountsScanned, 3);
  assert.equal(snapshot.activeRoleAccounts, 3);
  assert.equal(snapshot.roleCounts.author, 1);
  assert.equal(snapshot.roleCounts.reviewer, 1);
  assert.equal(snapshot.roleCounts.publisher, 1);
  assert.equal(snapshot.capabilities.verifiedReviewerAccounts, 1);
  assert.equal(snapshot.capabilities.reviewerPublisherSeparationReady, true);
  assert.equal(snapshot.writeCount, 0);
  assert.equal("users" in snapshot, false);
  assert.equal(Object.isFrozen(snapshot), true);
});

test("role readiness fails closed on invalid, inactive, duplicate, or unavailable directory evidence", async () => {
  const [readiness] = await loadReadinessModules();
  const mixed = await readiness.scanKnowledgeCmsRoleDirectory(
    {
      listUsers: async () => ({
        users: [
          {
            uid: "invalid-role",
            emailVerified: true,
            disabled: false,
            customClaims: { knowledgeCmsRoles: ["super-admin"] },
          },
          {
            uid: "disabled-role",
            emailVerified: true,
            disabled: true,
            customClaims: { knowledgeCmsRoles: ["publisher"] },
          },
          {
            uid: "unverified-role",
            emailVerified: false,
            disabled: false,
            customClaims: { knowledgeCmsRoles: ["reviewer"] },
          },
        ],
      }),
    },
    NOW,
    reviewerVerifications,
  );
  assert.equal(mixed.status, "complete");
  assert.equal(mixed.invalidClaimAccounts, 1);
  assert.equal(mixed.disabledClaimAccounts, 1);
  assert.equal(mixed.unverifiedClaimAccounts, 1);
  assert.equal(mixed.activeRoleAccounts, 0);

  const unavailable = await readiness.scanKnowledgeCmsRoleDirectory({
    listUsers: async () => {
      throw new Error("permission denied");
    },
  }, NOW);
  assert.equal(unavailable.status, "unavailable");
  assert.equal(unavailable.failureReason, "directory_read_failed");
  assert.equal(unavailable.writeCount, 0);

  const duplicate = await readiness.scanKnowledgeCmsRoleDirectory({
    listUsers: async () => ({
      users: [roleUsers()[0]!, roleUsers()[0]!],
    }),
  }, NOW);
  assert.equal(duplicate.status, "unavailable");
  assert.equal(duplicate.failureReason, "duplicate_user");
});

test("all absent article targets produce a fingerprinted ready report when private prerequisites are proven", async () => {
  const [readiness] = await loadReadinessModules();
  const roleDirectory = await completeRoleDirectory();
  const report = readiness.buildKnowledgeCmsOperationalReadinessReport({
    actor: ACTOR,
    observedAt: NOW,
    configuration: configuration(true),
    roleDirectory,
    workspaceEvidence: {
      status: "available",
      workspace: await emptyWorkspace(),
      verifications: [],
    },
  });

  assert.equal(report.overall, "ready_for_guarded_private_operations");
  assert.equal(report.capabilities.privateWorkspace, "ready");
  assert.equal(report.capabilities.editorialWorkflow, "ready");
  assert.equal(report.capabilities.singleRecordArticleMigration, "ready");
  assert.equal(report.capabilities.privateShadow, "disabled");
  assert.equal(report.capabilities.publicCutover, "prohibited");
  assert.equal(report.migration.targets.total, 22);
  assert.equal(report.migration.targets.preparedAbsent, 22);
  assert.equal(report.migration.targets.blocked, 0);
  assert.equal(report.migration.controls.verified, 22);
  assert.equal(report.migration.evidence.publicRepresentationBlockers, 22);
  assert.equal(report.readBoundary.firestoreInventoryCollectionReads, 3);
  assert.equal(report.readBoundary.firestoreHistoryCollectionReads, 1);
  assert.equal(report.readBoundary.writeCount, 0);
  assert.equal(report.publicSafety.publicCutoverEligible, false);
  assert.match(report.fingerprint.value, /^[a-f0-9]{64}$/);
  assert.deepEqual(
    readiness.validateKnowledgeCmsOperationalReadinessReport(report),
    [],
  );
  assert.equal(Object.isFrozen(report), true);
});

test("a disabled execution gate blocks only incomplete article migration capability", async () => {
  const [readiness] = await loadReadinessModules();
  const report = readiness.buildKnowledgeCmsOperationalReadinessReport({
    actor: ACTOR,
    observedAt: NOW,
    configuration: configuration(false),
    roleDirectory: await completeRoleDirectory(),
    workspaceEvidence: {
      status: "available",
      workspace: await emptyWorkspace(),
      verifications: [],
    },
  });

  assert.equal(report.capabilities.privateWorkspace, "ready");
  assert.equal(report.capabilities.editorialWorkflow, "ready");
  assert.equal(report.capabilities.singleRecordArticleMigration, "blocked");
  assert.equal(report.overall, "blocked");
  assert.equal(
    report.checks.find((item) => item.code === "article_execution_gate")?.status,
    "blocked",
  );
  assert.equal(report.publicSafety.publicCutoverEligible, false);
});

test("a present migration target is ready only with one current passing five-artifact receipt", async () => {
  const [readiness] = await loadReadinessModules();
  const created = await workspaceWithCreatedTarget();
  const good = readiness.buildKnowledgeCmsOperationalReadinessReport({
    actor: ACTOR,
    observedAt: NOW,
    configuration: configuration(true),
    roleDirectory: await completeRoleDirectory(),
    workspaceEvidence: {
      status: "available",
      workspace: created.workspace,
      verifications: [
        {
          recordId: created.target.id,
          status: "available",
          result: created.verification,
        },
      ],
    },
  });
  assert.equal(good.migration.targets.verifiedPrivateDrafts, 1);
  assert.equal(good.migration.targets.preparedAbsent, 21);
  assert.equal(good.migration.targets.blocked, 0);
  assert.equal(good.readBoundary.verificationTransactions, 1);
  assert.equal(good.readBoundary.verifiedArtifactReads, 5);

  const badCreated = await workspaceWithCreatedTarget({ unexpected: true });
  assert.equal(badCreated.verification.status, "failed");
  const bad = readiness.buildKnowledgeCmsOperationalReadinessReport({
    actor: ACTOR,
    observedAt: NOW,
    configuration: configuration(true),
    roleDirectory: await completeRoleDirectory(),
    workspaceEvidence: {
      status: "available",
      workspace: badCreated.workspace,
      verifications: [
        {
          recordId: badCreated.target.id,
          status: "available",
          result: badCreated.verification,
        },
      ],
    },
  });
  assert.equal(bad.migration.targets.blocked, 1);
  assert.equal(bad.migration.verifications.failed, 1);
  assert.equal(bad.migration.evidence.ready, false);
  assert.equal(bad.overall, "blocked");
});

test("readiness authorization is enforced before Auth or Firestore reads", async () => {
  const [, readinessDal, verification] = await loadReadinessModules();
  let reads = 0;
  await assert.rejects(
    readinessDal.readKnowledgeCmsOperationalReadiness({
      actor: { id: "readiness-editor", roles: ["editor"] },
      repository: {
        list: async () => {
          reads += 1;
          return [];
        },
        listArticleMigrationExecutions: async () => {
          reads += 1;
          return verification.buildKnowledgeCmsArticleMigrationExecutionHistory([]);
        },
        verifyArticleMigrationExecution: async () => {
          reads += 1;
          return undefined;
        },
      },
      roleDirectoryProvider: {
        listUsers: async () => {
          reads += 1;
          return { users: [] };
        },
      },
      configuration: configuration(true),
      now: NOW,
    }),
    /preview_migration.*role_required/i,
  );
  assert.equal(reads, 0);
});

test("readiness remains an authenticated private zero-write boundary", () => {
  const moduleSource = readFileSync(
    join(root, "lib/knowledgeCmsOperationalReadiness.ts"),
    "utf8",
  );
  const dataAccess = readFileSync(
    join(root, "lib/knowledgeCmsOperationalReadinessDal.ts"),
    "utf8",
  );
  const page = readFileSync(
    join(root, "app/admin/knowledge/readiness/page.tsx"),
    "utf8",
  );

  assert.match(moduleSource, /^import "server-only";/);
  assert.match(dataAccess, /^import "server-only";/);
  assert.match(dataAccess, /requireKnowledgeCmsActor/);
  assert.match(dataAccess, /assertKnowledgeCmsActionAllowed/);
  assert.match(dataAccess, /process\.env\.NEXT_PUBLIC_FIREBASE_API_KEY/);
  assert.match(dataAccess, /process\.env\.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN/);
  assert.match(dataAccess, /process\.env\.NEXT_PUBLIC_FIREBASE_PROJECT_ID/);
  assert.doesNotMatch(dataAccess, /env\("NEXT_PUBLIC_FIREBASE_/);
  assert.match(moduleSource, /listUsers/);
  assert.match(dataAccess, /verifyArticleMigrationExecution/);
  assert.doesNotMatch(dataAccess, /createArticleMigrationDraft/);
  assert.doesNotMatch(dataAccess, /\.save\s*\(|\.set\s*\(|\.delete\s*\(|runTransaction/);
  assert.match(page, /getCurrentKnowledgeCmsActor/);
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
      /knowledgeCmsOperationalReadiness/,
      `${relative(root, sourceFile)} must not import operational readiness`,
    );
  }
});
