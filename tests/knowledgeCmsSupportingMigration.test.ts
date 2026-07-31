import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  buildKnowledgeCmsMigrationPreview,
  type KnowledgeCmsMigrationCandidate,
  type KnowledgeCmsMigrationFaqTarget,
  type KnowledgeCmsMigrationTopicTarget,
} from "../lib/knowledgeCmsMigration";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const NOW = new Date("2026-07-31T18:00:00.000Z");
const ACTOR = { id: "supporting-publisher", roles: ["publisher" as const] };

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
    import("../lib/knowledgeCmsSupportingMigrationControl"),
    import("../lib/knowledgeCmsSupportingMigrationExecution"),
    import("../lib/knowledgeCmsSupportingMigrationVerification"),
  ]);
}

type SupportingCandidate = KnowledgeCmsMigrationCandidate & {
  target: KnowledgeCmsMigrationTopicTarget | KnowledgeCmsMigrationFaqTarget;
};

function supportingCandidates(): SupportingCandidate[] {
  return buildKnowledgeCmsMigrationPreview({
    asOf: NOW,
    rendererMode: "static",
  }).candidates.filter(
    (candidate): candidate is SupportingCandidate =>
      candidate.target.kind === "topic" || candidate.target.kind === "faq",
  );
}

function requestFor(
  candidate: ReturnType<typeof supportingCandidates>[number],
  execution: Awaited<ReturnType<typeof loadModules>>[1],
) {
  assert.ok(
    candidate.target.kind === "topic" || candidate.target.kind === "faq",
  );
  assert.ok(candidate.target.controlRecord);
  return {
    kind: candidate.target.kind,
    controlId: candidate.target.controlRecord.controlId,
    controlFingerprint: candidate.target.controlRecord.fingerprint.value,
    confirmation: execution.getKnowledgeCmsSupportingMigrationConfirmationPhrase(
      candidate.target.kind,
      candidate.target.slug,
    ),
  };
}

function auditFor(
  plan: ReturnType<
    Awaited<ReturnType<typeof loadModules>>[1]["buildKnowledgeCmsSupportingMigrationExecutionPlan"]
  >,
  control: Awaited<ReturnType<typeof loadModules>>[0],
) {
  return {
    event: "migration_create_private_supporting_draft",
    actorId: ACTOR.id,
    kind: plan.record.kind,
    recordId: plan.record.id,
    revision: 1,
    status: "draft",
    slug: plan.record.slug,
    occurredAt: NOW.toISOString(),
    migrationControlId: plan.control.id,
    migrationControlFingerprint: plan.control.fingerprint,
    migrationExecutionVersion: 1,
    migrationWriteCount: plan.transaction.writeCount,
    migrationRecordFingerprint:
      control.fingerprintKnowledgeCmsSupportingMigrationRecord(plan.record),
    ...(plan.target.canonicalPath
      ? { canonicalPath: plan.target.canonicalPath }
      : {}),
    publicSource: "existing_static_experience",
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

test("all 12 topics and 11 FAQs have deterministic private zero-write controls", async () => {
  const [control, execution] = await loadModules();
  const candidates = supportingCandidates();
  assert.equal(candidates.length, 23);
  assert.equal(
    candidates.filter((candidate) => candidate.target.kind === "topic").length,
    12,
  );
  assert.equal(
    candidates.filter((candidate) => candidate.target.kind === "faq").length,
    11,
  );
  const fingerprints = new Set<string>();
  for (const candidate of candidates) {
    assert.ok(
      candidate.target.kind === "topic" || candidate.target.kind === "faq",
    );
    const record = candidate.target.controlRecord;
    assert.ok(record);
    const input = execution.getKnowledgeCmsSupportingMigrationControlInput(
      candidate,
    );
    assert.deepEqual(
      control.validateKnowledgeCmsSupportingMigrationControl(record, input),
      [],
    );
    assert.equal(record.target.payload.status, "draft");
    assert.equal(record.target.payload.discoverability.indexing, "blocked");
    assert.equal(record.execution.readyToExecute, false);
    assert.equal(record.execution.writeCount, 0);
    assert.equal(record.rollout.cmsRecordPubliclyRendered, false);
    assert.equal(record.rollout.cutoverEligible, false);
    assert.match(record.fingerprint.value, /^[a-f0-9]{64}$/);
    assert.equal(Object.isFrozen(record), true);
    fingerprints.add(record.fingerprint.value);
  }
  assert.equal(fingerprints.size, 23);
});

test("one-record execution uses three writes without a canonical and four with one", async () => {
  const [, execution] = await loadModules();
  process.env.KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED = "true";
  const candidates = supportingCandidates();
  const category = candidates.find(
    (candidate) =>
      candidate.target.kind === "topic" &&
      !candidate.target.canonicalPath,
  );
  const routedTopic = candidates.find(
    (candidate) =>
      candidate.target.kind === "topic" &&
      Boolean(candidate.target.canonicalPath),
  );
  const faq = candidates.find((candidate) => candidate.target.kind === "faq");
  assert.ok(category && routedTopic && faq);

  for (const [candidate, expectedWrites] of [
    [category, 3],
    [routedTopic, 4],
    [faq, 3],
  ] as const) {
    const plan = execution.buildKnowledgeCmsSupportingMigrationExecutionPlan({
      actor: ACTOR,
      request: requestFor(candidate, execution),
      now: NOW,
    });
    assert.equal(plan.mode, "single_supporting_private_draft");
    assert.equal(plan.record.kind, candidate.target.kind);
    assert.equal(plan.record.ownerId, ACTOR.id);
    assert.equal(plan.record.audit.createdAt, NOW.toISOString());
    assert.equal(plan.record.status, "draft");
    assert.equal(plan.record.discoverability.indexing, "blocked");
    assert.equal(plan.transaction.writeCount, expectedWrites);
    assert.equal(plan.transaction.createsOneCmsRecord, true);
    assert.equal(plan.rollout.bulkExecution, false);
    assert.equal(plan.rollout.cmsRecordPubliclyRendered, false);
    assert.equal(plan.rollout.cutoverEligible, false);
  }
});

test("disabled, unauthorized, forged, and mistyped execution fails closed", async () => {
  const [, execution] = await loadModules();
  const candidate = supportingCandidates()[0];
  process.env.KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED = "false";
  assert.throws(
    () =>
      execution.buildKnowledgeCmsSupportingMigrationExecutionPlan({
        actor: ACTOR,
        request: requestFor(candidate, execution),
        now: NOW,
      }),
    /disabled/i,
  );
  process.env.KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED = "true";
  const request = requestFor(candidate, execution);
  assert.throws(
    () =>
      execution.buildKnowledgeCmsSupportingMigrationExecutionPlan({
        actor: { id: "supporting-editor", roles: ["editor"] },
        request,
        now: NOW,
      }),
    /execute_supporting_migration.*role_required/i,
  );
  assert.throws(
    () =>
      execution.buildKnowledgeCmsSupportingMigrationExecutionPlan({
        actor: ACTOR,
        request: { ...request, controlFingerprint: "0".repeat(64) },
        now: NOW,
      }),
    /control changed/i,
  );
  assert.throws(
    () =>
      execution.buildKnowledgeCmsSupportingMigrationExecutionPlan({
        actor: ACTOR,
        request: { ...request, confirmation: "CREATE PRIVATE TOPIC DRAFT wrong" },
        now: NOW,
      }),
    /confirmation phrase/i,
  );
});

test("topic and FAQ post-create receipts verify optional canonical artifacts with zero writes", async () => {
  const [control, execution, verification] = await loadModules();
  process.env.KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED = "true";
  const candidates = supportingCandidates();
  const selected = [
    candidates.find(
      (candidate) =>
        candidate.target.kind === "topic" &&
        Boolean(candidate.target.canonicalPath),
    ),
    candidates.find((candidate) => candidate.target.kind === "faq"),
  ];
  assert.ok(selected.every(Boolean));

  for (const candidate of selected) {
    assert.ok(candidate);
    const plan = execution.buildKnowledgeCmsSupportingMigrationExecutionPlan({
      actor: ACTOR,
      request: requestFor(candidate, execution),
      now: NOW,
    });
    const audit = auditFor(plan, control);
    const result =
      verification.buildKnowledgeCmsSupportingMigrationPostCreateVerification({
        kind: plan.record.kind,
        auditDocumentId:
          verification.getKnowledgeCmsSupportingMigrationAuditDocumentId(
            plan.record.kind,
            plan.record.id,
          ),
        auditData: audit,
        recordData: plan.record,
        slugLockData: {
          kind: plan.record.kind,
          recordId: plan.record.id,
          slug: plan.record.slug,
          updatedAt: plan.record.audit.updatedAt,
        },
        ...(plan.target.canonicalPath
          ? {
              canonicalLockData: {
                kind: plan.record.kind,
                recordId: plan.record.id,
                canonicalPath: plan.target.canonicalPath,
                updatedAt: plan.record.audit.updatedAt,
              },
            }
          : {}),
        searchData: undefined,
        observedAt: new Date("2026-07-31T18:05:00.000Z"),
      });
    assert.equal(result.status, "verified_private_draft");
    assert.equal(result.artifacts.readCount, plan.target.canonicalPath ? 5 : 4);
    assert.equal(result.artifacts.writeCount, 0);
    assert.equal(result.artifacts.repairAttempted, false);
    assert.ok(result.checks.every((item) => item.status !== "failed"));
    assert.equal(result.rollout.cmsRecordPubliclyRendered, false);
    assert.equal(result.rollout.indexingChanged, false);
    assert.equal(result.rollout.cutoverEligible, false);
    assert.match(result.fingerprint.value, /^[a-f0-9]{64}$/);
  }
});

test("supporting verification fails closed on forged audit, provenance, fingerprint, and lock evidence", async () => {
  const [control, execution, verification] = await loadModules();
  process.env.KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED = "true";
  const candidate = supportingCandidates().find(
    (item) => item.target.kind === "faq",
  );
  assert.ok(candidate);
  const plan = execution.buildKnowledgeCmsSupportingMigrationExecutionPlan({
    actor: ACTOR,
    request: requestFor(candidate, execution),
    now: NOW,
  });
  const audit = auditFor(plan, control);
  const auditDocumentId =
    verification.getKnowledgeCmsSupportingMigrationAuditDocumentId(
      plan.record.kind,
      plan.record.id,
    );
  const baseArtifacts = {
    kind: plan.record.kind,
    auditDocumentId,
    auditData: audit,
    recordData: plan.record,
    slugLockData: {
      kind: plan.record.kind,
      recordId: plan.record.id,
      slug: plan.record.slug,
      updatedAt: plan.record.audit.updatedAt,
    },
    searchData: undefined,
    observedAt: new Date("2026-07-31T18:05:00.000Z"),
  } as const;

  for (const artifacts of [
    {
      ...baseArtifacts,
      auditData: { ...audit, status: "published" },
    },
    {
      ...baseArtifacts,
      auditData: { ...audit, migrationWriteCount: 4 },
    },
    {
      ...baseArtifacts,
      auditData: { ...audit, migrationRecordFingerprint: "0".repeat(64) },
    },
    {
      ...baseArtifacts,
      recordData: {
        ...plan.record,
        audit: {
          ...plan.record.audit,
          revision: 2,
          createdBy: "forged-creator",
          updatedAt: "2026-07-31T18:04:00.000Z",
          updatedBy: "forged-creator",
        },
      },
    },
    {
      ...baseArtifacts,
      slugLockData: {
        kind: plan.record.kind,
        recordId: plan.record.id,
        slug: plan.record.slug,
      },
    },
  ]) {
    const receipt =
      verification.buildKnowledgeCmsSupportingMigrationPostCreateVerification(
        artifacts,
      );
    assert.equal(receipt.status, "failed");
    assert.equal(
      receipt.checks.some((item) => item.status === "failed"),
      true,
    );
    assert.equal(receipt.artifacts.writeCount, 0);
  }
});

test("supporting history excludes malformed events and fingerprints valid evidence", async () => {
  const [control, execution, verification] = await loadModules();
  process.env.KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED = "true";
  const candidate = supportingCandidates().find(
    (item) => item.target.kind === "faq",
  );
  assert.ok(candidate);
  const plan = execution.buildKnowledgeCmsSupportingMigrationExecutionPlan({
    actor: ACTOR,
    request: requestFor(candidate, execution),
    now: NOW,
  });
  const audit = auditFor(plan, control);
  const documentId =
    verification.getKnowledgeCmsSupportingMigrationAuditDocumentId(
      plan.record.kind,
      plan.record.id,
    );
  const history =
    verification.buildKnowledgeCmsSupportingMigrationExecutionHistory([
      { id: documentId, data: audit },
      { id: "faq--invalid--0000000001", data: { event: "other" } },
    ]);
  assert.equal(history.summary.eventsObserved, 2);
  assert.equal(history.summary.validEvents, 1);
  assert.equal(history.summary.invalidEvents, 1);
  assert.equal(history.summary.controlsVerified, 1);
  assert.equal(history.summary.writeCount, 0);
  assert.match(history.entries[0].evidenceFingerprint, /^[a-f0-9]{64}$/);
});

test("supporting migration remains private, one-record, server-authorized, and absent from public code", () => {
  const execution = readFileSync(
    join(root, "lib/knowledgeCmsSupportingMigrationExecution.ts"),
    "utf8",
  );
  const verification = readFileSync(
    join(root, "lib/knowledgeCmsSupportingMigrationVerification.ts"),
    "utf8",
  );
  const repository = readFileSync(
    join(root, "lib/knowledgeCmsRepository.ts"),
    "utf8",
  );
  const action = readFileSync(
    join(root, "app/admin/knowledge/actions.ts"),
    "utf8",
  );
  assert.match(execution, /^import "server-only";/);
  assert.match(verification, /^import "server-only";/);
  assert.match(execution, /execute_supporting_migration/);
  assert.match(repository, /migration_create_private_supporting_draft/);
  assert.match(repository, /runTransaction/);
  assert.match(action, /parseKnowledgeCmsSupportingMigrationExecutionForm/);
  assert.doesNotMatch(verification, /\.save\s*\(|\.set\s*\(|\.delete\s*\(/);

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
      /knowledgeCmsSupportingMigration/,
      `${relative(root, sourceFile)} must not import supporting migration`,
    );
  }
});
