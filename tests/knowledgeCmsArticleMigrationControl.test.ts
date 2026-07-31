import assert from "node:assert/strict";
import {
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  validateKnowledgeCmsRecord,
} from "../lib/knowledgeCms";
import {
  validateKnowledgeCmsArticleMigrationControl,
  type KnowledgeCmsArticleMigrationControlInput,
  type KnowledgeCmsArticleMigrationControlRecord,
} from "../lib/knowledgeCmsArticleMigrationControl";
import {
  buildKnowledgeCmsMigrationPreview,
  type KnowledgeCmsMigrationArticleTarget,
} from "../lib/knowledgeCmsMigration";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const AS_OF = "2026-07-30";

function articleFixture(
  key = "article:resource-entry--turning-65-spokane",
): {
  control: KnowledgeCmsArticleMigrationControlRecord;
  input: KnowledgeCmsArticleMigrationControlInput;
  target: KnowledgeCmsMigrationArticleTarget;
} {
  const candidate = buildKnowledgeCmsMigrationPreview({
    asOf: AS_OF,
  }).candidates.find((item) => item.key === key);
  assert.ok(candidate, `Expected migration candidate ${key}.`);
  assert.equal(candidate.target.kind, "article");
  const target = candidate.target as KnowledgeCmsMigrationArticleTarget;
  assert.ok(target.routeParity);
  assert.ok(target.rendererContract);
  assert.ok(target.controlRecord);

  return {
    control: target.controlRecord,
    target,
    input: {
      target: {
        id: target.id,
        kind: "article",
        slug: target.slug,
        title: target.title,
        summary: target.summary,
        searchTerms: [...target.searchTerms],
        relationships: target.relationships,
        sources: target.sources,
        canonicalPath: target.canonicalPath!,
        pageTitle: target.pageTitle!,
        description: target.description!,
      },
      routeParity: target.routeParity,
      rendererContract: target.rendererContract,
    },
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

test("all article controls are deterministic immutable private drafts", () => {
  const current = buildKnowledgeCmsMigrationPreview({
    asOf: AS_OF,
  });
  const later = buildKnowledgeCmsMigrationPreview({
    asOf: "2027-01-27",
  });
  const currentControls = current.candidates
    .filter(
      (
        candidate,
      ): candidate is typeof candidate & {
        target: KnowledgeCmsMigrationArticleTarget;
      } => candidate.target.kind === "article",
    )
    .map((candidate) => candidate.target.controlRecord);
  const laterControls = later.candidates
    .filter(
      (
        candidate,
      ): candidate is typeof candidate & {
        target: KnowledgeCmsMigrationArticleTarget;
      } => candidate.target.kind === "article",
    )
    .map((candidate) => candidate.target.controlRecord);

  assert.equal(currentControls.length, 22);
  assert.ok(currentControls.every(Boolean));
  assert.deepEqual(currentControls, laterControls);
  assert.equal(
    new Set(
      currentControls.map((control) => control?.controlId),
    ).size,
    22,
  );
  assert.equal(
    new Set(
      currentControls.map(
        (control) => control?.fingerprint.value,
      ),
    ).size,
    22,
  );
  for (const control of currentControls) {
    assert.ok(control);
    assert.equal(control.version, 2);
    assert.equal(control.operation, "create_private_draft");
    assert.equal(control.target.expectedRevision, null);
    assert.equal(control.target.conflictPolicy, "fail_if_present");
    assert.equal(control.target.payload.status, "draft");
    assert.equal(
      control.target.payload.discoverability.indexing,
      "blocked",
    );
    assert.equal(control.execution.status, "disabled");
    assert.equal(control.execution.readyToExecute, false);
    assert.equal(control.execution.writeCount, 0);
    assert.equal(
      control.execution.reason,
      "control_record_is_not_execution_authority",
    );
    assert.equal(control.rollout.cmsBodyPubliclyRendered, false);
    assert.equal(control.rollout.cutoverEligible, false);
    assert.ok(Object.isFrozen(control));
    assert.ok(Object.isFrozen(control.target.payload));
    assert.ok(Object.isFrozen(control.target.payload.relationships));
    assert.ok(Object.isFrozen(control.target.payload.sources));
  }
});

test("a control pins the deterministic record identity and route evidence", () => {
  const { control } = articleFixture();

  assert.equal(
    control.controlId,
    "resource-library-article-control--turning-65-spokane",
  );
  assert.equal(
    control.target.payload.id,
    "resource-entry--turning-65-spokane",
  );
  assert.equal(
    control.target.payload.slug,
    "turning-65-medicare-spokane",
  );
  assert.equal(
    control.target.payload.discoverability.canonicalPath,
    "/turning-65-medicare-spokane",
  );
  assert.equal(
    control.provenance.renderedBodySha256,
    "b1d53f57def98f6dd71f59bba2e7c4b2a1ba7693e81843e6c5b653f4b863eca3",
  );
  assert.equal(control.provenance.rendererContractVersion, 2);
  assert.equal(
    control.fingerprint.value,
    "cef618e106cf22a644c1dabb98c53f0206c3396052725fcea21349faf6d2c940",
  );
  assert.match(
    control.target.payload.body,
    /Private migration control record/,
  );
  assert.match(
    control.target.payload.body,
    /It is not the public page body/,
  );
});

test("control payloads omit server-owned fields and materialize as valid drafts", () => {
  const { control, input } = articleFixture();
  const payload = control.target.payload as unknown as Record<
    string,
    unknown
  >;

  assert.equal("ownerId" in payload, false);
  assert.equal("audit" in payload, false);
  assert.equal("review" in payload, false);
  assert.equal("publication" in payload, false);
  assert.deepEqual(
    control.target.serverMaterialization.requiredServerFields,
    [
      "ownerId",
      "audit.createdAt",
      "audit.createdBy",
      "audit.updatedAt",
      "audit.updatedBy",
    ],
  );

  assert.deepEqual(
    validateKnowledgeCmsRecord({
      ...control.target.payload,
      ownerId: "migration-control-operator",
      audit: {
        revision: 1,
        createdAt: "2026-07-30T22:00:00.000Z",
        createdBy: "migration-control-operator",
        updatedAt: "2026-07-30T22:00:00.000Z",
        updatedBy: "migration-control-operator",
      },
    }),
    [],
  );
  assert.deepEqual(
    validateKnowledgeCmsArticleMigrationControl(control, input),
    [],
  );
});

test("content, fingerprint, and execution tampering fail validation", () => {
  const { control, input } = articleFixture();
  const tampered = JSON.parse(
    JSON.stringify(control),
  ) as KnowledgeCmsArticleMigrationControlRecord;
  (
    tampered.target.payload as {
      title: string;
    }
  ).title = "Forged title";
  (
    tampered.execution as {
      readyToExecute: boolean;
      writeCount: number;
    }
  ).readyToExecute = true;
  (
    tampered.execution as {
      readyToExecute: boolean;
      writeCount: number;
    }
  ).writeCount = 1;

  const errors = validateKnowledgeCmsArticleMigrationControl(
    tampered,
    input,
  );
  assert.ok(
    errors.some((message) =>
      /does not match its deterministic source inputs/.test(message),
    ),
  );
  assert.ok(
    errors.some((message) =>
      /fingerprint does not match/.test(message),
    ),
  );
  assert.ok(
    errors.some((message) =>
      /disabled, zero-write, create-only/.test(message),
    ),
  );
});

test("article control records remain non-mutating and private", () => {
  const controlSource = readFileSync(
    join(root, "lib/knowledgeCmsArticleMigrationControl.ts"),
    "utf8",
  );
  const execution = readFileSync(
    join(root, "lib/knowledgeCmsArticleMigrationExecution.ts"),
    "utf8",
  );

  assert.doesNotMatch(
    controlSource,
    /knowledgeCmsRepository|knowledgeCmsWorkflow/,
  );
  assert.doesNotMatch(controlSource, /\.save\s*\(/);
  assert.doesNotMatch(controlSource, /\.transition\s*\(/);
  assert.doesNotMatch(controlSource, /runTransaction\s*\(/);
  assert.match(execution, /validateKnowledgeCmsArticleMigrationControl/);

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
      /knowledgeCmsArticleMigrationControl/,
      `${relative(root, sourceFile)} must not import article migration controls`,
    );
  }
});
