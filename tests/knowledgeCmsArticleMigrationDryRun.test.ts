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
import {
  validateKnowledgeCmsRecord,
  type KnowledgeCmsActor,
  type KnowledgeCmsArticle,
  type KnowledgeCmsRecord,
} from "../lib/knowledgeCms";
import {
  buildKnowledgeCmsArticleMaterializationDryRun,
  validateKnowledgeCmsArticleMaterializationDryRun,
  type BuildKnowledgeCmsArticleMaterializationDryRunInput,
  type KnowledgeCmsArticleMaterializationDryRun,
} from "../lib/knowledgeCmsArticleMigrationDryRun";
import {
  buildKnowledgeCmsMigrationPreview,
} from "../lib/knowledgeCmsMigration";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const NOW = new Date("2026-07-30T22:00:00.000Z");
const ACTOR: KnowledgeCmsActor = {
  id: "materialization-operator",
  roles: ["publisher"],
};

function input(
  existingRecords: KnowledgeCmsRecord[] = [],
): BuildKnowledgeCmsArticleMaterializationDryRunInput {
  return {
    preview: buildKnowledgeCmsMigrationPreview({
      asOf: NOW,
      existingRecords,
    }),
    existingRecords,
    actor: ACTOR,
    now: NOW,
  };
}

function build(
  existingRecords: KnowledgeCmsRecord[] = [],
): KnowledgeCmsArticleMaterializationDryRun {
  return buildKnowledgeCmsArticleMaterializationDryRun(
    input(existingRecords),
  );
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
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

function mockServerOnlyModule() {
  const serverOnlyPath = require.resolve("server-only");
  require.cache[serverOnlyPath] = {
    exports: {},
    filename: serverOnlyPath,
    id: serverOnlyPath,
    loaded: true,
  } as never;
}

async function loadMigrationDal() {
  mockServerOnlyModule();
  return import("../lib/knowledgeCmsMigrationDal");
}

test("all 22 article controls produce authenticated zero-write dry-run receipts", () => {
  const dryRun = build();

  assert.equal(dryRun.version, 1);
  assert.equal(dryRun.mode, "materialization_dry_run");
  assert.equal(dryRun.generatedAt, NOW.toISOString());
  assert.deepEqual(dryRun.actor, {
    id: ACTOR.id,
    source: "authenticated_server_session",
  });
  assert.deepEqual(dryRun.inventory, {
    source: "current_firestore_collection_inventory",
    collectionReads: 3,
    recordsObserved: 0,
  });
  assert.deepEqual(dryRun.summary, {
    controls: 22,
    controlsVerified: 22,
    expectedAbsentConfirmed: 22,
    targetsPresent: 0,
    recordsMaterializedInMemory: 22,
    receiptsVerified: 22,
    blocked: 0,
    executionEligible: 0,
    writeCount: 0,
  });
  assert.equal(dryRun.readyToExecute, false);
  assert.equal(dryRun.receipts.length, 22);
  assert.ok(/^[a-f0-9]{64}$/.test(dryRun.fingerprint.value));
  assert.equal(
    new Set(
      dryRun.receipts.map((receipt) => receipt.fingerprint.value),
    ).size,
    22,
  );

  for (const receipt of dryRun.receipts) {
    assert.equal(receipt.control.validation, "verified");
    assert.equal(receipt.target.expectedState, "absent");
    assert.equal(receipt.target.observedState, "absent");
    assert.equal(
      receipt.materialization.status,
      "verified_in_memory",
    );
    assert.ok(receipt.materialization.record);
    assert.equal(receipt.materialization.record.ownerId, ACTOR.id);
    assert.deepEqual(
      receipt.materialization.record.audit,
      {
        revision: 1,
        createdAt: NOW.toISOString(),
        createdBy: ACTOR.id,
        updatedAt: NOW.toISOString(),
        updatedBy: ACTOR.id,
      },
    );
    assert.deepEqual(
      validateKnowledgeCmsRecord(receipt.materialization.record),
      [],
    );
    assert.equal(receipt.execution.status, "disabled");
    assert.equal(receipt.execution.readyToExecute, false);
    assert.equal(receipt.execution.writeCount, 0);
    assert.equal(receipt.execution.transactionalRecheckRequired, true);
    assert.equal(receipt.rollout.cmsBodyPubliclyRendered, false);
    assert.equal(receipt.rollout.indexing, "blocked");
    assert.equal(receipt.rollout.cutoverEligible, false);
    assert.ok(Object.isFrozen(receipt));
    assert.ok(Object.isFrozen(receipt.materialization.record));
  }
  assert.ok(Object.isFrozen(dryRun));
  assert.ok(Object.isFrozen(dryRun.receipts));
  assert.deepEqual(
    validateKnowledgeCmsArticleMaterializationDryRun(dryRun, input()),
    [],
  );
});

test("fixed server inputs produce deterministic control and batch bindings", () => {
  const first = build();
  const second = build();

  assert.deepEqual(first, second);
  const turning65 = first.receipts.find(
    (receipt) =>
      receipt.target.id === "resource-entry--turning-65-spokane",
  );
  assert.ok(turning65);
  assert.equal(
    turning65.control.fingerprint,
    "cef618e106cf22a644c1dabb98c53f0206c3396052725fcea21349faf6d2c940",
  );
  assert.equal(
    turning65.materialization.record?.audit.createdAt,
    NOW.toISOString(),
  );
  assert.equal(turning65.binding.ownerMatchesActor, true);
  assert.equal(turning65.binding.auditMatchesServerClock, true);
});

test("an existing target fails the expected-absent precondition without overwriting", () => {
  const baseline = build();
  const existing = clone(
    baseline.receipts[0]?.materialization.record,
  ) as KnowledgeCmsArticle;
  existing.audit.revision = 4;

  const dryRun = build([existing]);
  const receipt = dryRun.receipts.find(
    (item) => item.target.id === existing.id,
  );
  assert.ok(receipt);
  assert.equal(receipt.control.validation, "verified");
  assert.equal(receipt.target.observedState, "present");
  assert.equal(receipt.target.observedRevision, 4);
  assert.equal(receipt.materialization.status, "blocked");
  assert.equal(receipt.materialization.record, undefined);
  assert.ok(
    receipt.materialization.findings.some((message) =>
      /expected-absent target exists at revision 4/i.test(message),
    ),
  );
  assert.equal(dryRun.summary.controlsVerified, 22);
  assert.equal(dryRun.summary.expectedAbsentConfirmed, 21);
  assert.equal(dryRun.summary.targetsPresent, 1);
  assert.equal(dryRun.summary.recordsMaterializedInMemory, 21);
  assert.equal(dryRun.summary.blocked, 1);
  assert.equal(dryRun.summary.writeCount, 0);
  assert.equal(dryRun.readyToExecute, false);
});

test("current slug and canonical conflicts block materialization when target IDs are absent", () => {
  const baseline = build();
  const target = baseline.receipts[0]?.materialization.record;
  assert.ok(target);
  const slugConflict: KnowledgeCmsArticle = {
    ...clone(target),
    id: "different-existing-article",
    discoverability: {
      ...target.discoverability,
      canonicalPath: "/different-existing-article",
    },
  };

  const slugDryRun = build([slugConflict]);
  const slugReceipt = slugDryRun.receipts.find(
    (item) => item.target.slug === slugConflict.slug,
  );
  assert.ok(slugReceipt);
  assert.equal(slugReceipt.target.observedState, "absent");
  assert.ok(
    slugReceipt.target.conflictCodes.includes("existing_slug_conflict"),
  );
  assert.equal(slugReceipt.materialization.status, "blocked");
  assert.equal(slugDryRun.summary.writeCount, 0);

  const canonicalConflict: KnowledgeCmsArticle = {
    ...clone(target),
    id: "canonical-existing-article",
    slug: "canonical-existing-article",
  };
  const canonicalDryRun = build([canonicalConflict]);
  const canonicalReceipt = canonicalDryRun.receipts.find(
    (item) => item.target.canonicalPath === target.discoverability.canonicalPath,
  );
  assert.ok(canonicalReceipt);
  assert.equal(canonicalReceipt.target.observedState, "absent");
  assert.ok(
    canonicalReceipt.target.conflictCodes.includes(
      "existing_canonical_conflict",
    ),
  );
  assert.equal(canonicalReceipt.materialization.status, "blocked");
  assert.equal(canonicalDryRun.summary.writeCount, 0);
});

test("receipt, materialized-record, and execution tampering fail validation", () => {
  const dryRun = clone(build());
  const receipt = dryRun.receipts[0];
  assert.ok(receipt?.materialization.record);
  receipt.materialization.record.title = "Forged title";
  (
    receipt.execution as {
      readyToExecute: boolean;
      writeCount: number;
      transactionalRecheckRequired: boolean;
    }
  ).readyToExecute = true;
  (
    receipt.execution as {
      readyToExecute: boolean;
      writeCount: number;
      transactionalRecheckRequired: boolean;
    }
  ).writeCount = 1;
  (
    dryRun.summary as {
      writeCount: number;
      executionEligible: number;
    }
  ).writeCount = 1;
  (
    dryRun.summary as {
      writeCount: number;
      executionEligible: number;
    }
  ).executionEligible = 1;

  const errors = validateKnowledgeCmsArticleMaterializationDryRun(
    dryRun,
    input(),
  );
  assert.ok(
    errors.some((message) => /does not match its server inputs/i.test(message)),
  );
  assert.ok(
    errors.some((message) => /receipt.*invalid fingerprint/i.test(message)),
  );
  assert.ok(
    errors.some((message) => /batch fingerprint is invalid/i.test(message)),
  );
  assert.ok(
    errors.some((message) => /must remain zero-write/i.test(message)),
  );
  assert.ok(
    errors.some((message) => /must remain non-executable/i.test(message)),
  );
});

test("materialization rejects an invalid clock and unauthorized actor before use", () => {
  const invalidClock = input();
  invalidClock.now = new Date(Number.NaN);
  assert.throws(
    () => buildKnowledgeCmsArticleMaterializationDryRun(invalidClock),
    /valid server clock/i,
  );

  const unauthorized = input();
  unauthorized.actor = {
    id: "materialization-editor",
    roles: ["editor"],
  };
  assert.throws(
    () => buildKnowledgeCmsArticleMaterializationDryRun(unauthorized),
    /preview_migration.*role_required/i,
  );
});

test("the server DAL reauthorizes before four collection reads and performs no writes", async () => {
  const { previewKnowledgeCmsArticleMaterialization } =
    await loadMigrationDal();
  const kinds: string[] = [];
  let historyReads = 0;
  const workspace = await previewKnowledgeCmsArticleMaterialization(
    {
      list: async ({ kind }) => {
        kinds.push(kind);
        return [];
      },
      listArticleMigrationExecutions: async () => {
        historyReads += 1;
        return {
          version: 1,
          mode: "authenticated_execution_history",
          entries: [],
          summary: {
            eventsObserved: 0,
            validEvents: 0,
            invalidEvents: 0,
            controlsVerified: 0,
            controlsMismatched: 0,
            returned: 0,
            truncated: false,
            collectionReads: 1,
            writeCount: 0,
          },
        };
      },
    },
    ACTOR,
    NOW,
  );

  assert.deepEqual(kinds.sort(), ["article", "faq", "topic"]);
  assert.equal(historyReads, 1);
  assert.equal(workspace.preview.writeCount, 0);
  assert.equal(
    workspace.articleMaterializationDryRun.summary.writeCount,
    0,
  );

  let unauthorizedReads = 0;
  await assert.rejects(
    previewKnowledgeCmsArticleMaterialization(
      {
        list: async () => {
          unauthorizedReads += 1;
          return [];
        },
        listArticleMigrationExecutions: async () => {
          unauthorizedReads += 1;
          throw new Error("History must not be read for an unauthorized actor.");
        },
      },
      { id: "materialization-editor", roles: ["editor"] },
      NOW,
    ),
    /preview_migration.*role_required/i,
  );
  assert.equal(unauthorizedReads, 0);
});

test("the dry-run builder remains non-mutating and private", () => {
  const moduleSource = readFileSync(
    join(root, "lib/knowledgeCmsArticleMigrationDryRun.ts"),
    "utf8",
  );
  const page = readFileSync(
    join(root, "app/admin/knowledge/migration-preview/page.tsx"),
    "utf8",
  );

  assert.doesNotMatch(moduleSource, /\.save\s*\(/);
  assert.doesNotMatch(moduleSource, /\.transition\s*\(/);
  assert.doesNotMatch(moduleSource, /\.create\s*\(/);
  assert.doesNotMatch(moduleSource, /runTransaction\s*\(/);
  assert.doesNotMatch(page, /["']use client["']/);
  assert.match(page, /KnowledgeArticleMigrationExecutionControl/);

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
      /knowledgeCmsArticleMigrationDryRun/,
      `${relative(root, sourceFile)} must not import the dry run`,
    );
  }
});
