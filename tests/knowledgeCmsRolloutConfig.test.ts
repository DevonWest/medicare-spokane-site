import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const resolver = join(root, "scripts/resolve-knowledge-cms-rollout-config.mjs");
const checkedInConfig = join(root, "config/knowledge-cms-production-rollout.json");

function resolve(config: unknown): string {
  const directory = mkdtempSync(join(tmpdir(), "knowledge-rollout-"));
  const path = join(directory, "config.json");
  writeFileSync(path, JSON.stringify(config));
  return execFileSync(process.execPath, [resolver, path], { encoding: "utf8" });
}

test("the checked-in steady state preserves all 22 governed CMS routes without the temporary approval receipt", () => {
  const config = JSON.parse(readFileSync(checkedInConfig, "utf8"));
  const expectedRoutes = [
    "turning-65-spokane",
    "compare-options",
    "medicare-advantage",
    "medicare-supplements",
    "appointment-checklist",
    "annual-plan-review",
    "annual-enrollment-spokane",
    "prescription-review",
    "part-d",
    "helping-parent",
    "working-past-65",
    "health-insurance-spokane",
    "health-insurance-agent",
    "individual-family-health-insurance",
    "self-employed-health-insurance",
    "special-enrollment-health-insurance",
    "enrollment-resources",
    "moving-to-spokane",
    "medicare-savings-extra-help",
    "medicare-faq",
    "advantage-vs-supplement",
    "represented-carriers",
  ];
  assert.equal(config.phase, "steady");
  assert.equal(config.approvalReceipt, "");
  assert.deepEqual(config.routes, expectedRoutes);
  const output = resolve(config);
  assert.match(output, /KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE=cutover/);
  assert.match(output, /KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED=false/);
  assert.match(output, /KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED=false/);
  assert.match(output, /KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED=false/);
  assert.match(output, /KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_EXECUTION_ENABLED=false/);
  assert.match(output, /KNOWLEDGE_CMS_PUBLIC_CUTOVER_ENABLED=true/);
  const proof = output.match(/KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_RECEIPT=([a-f0-9]{64})/)?.[1];
  assert.ok(proof);
  assert.notEqual(proof, "a303b95ef581b927aab2ec00ffdffbf5677fd8957f37ac5043547c105a04fbd2");
  assert.ok(
    output
      .split("\n")
      .includes(`KNOWLEDGE_CMS_PUBLIC_CUTOVER_ROUTES=${expectedRoutes.join("|")}`),
  );
});

test("steady state proof is deterministic and changes with the active rollback set", () => {
  const first = resolve({
    phase: "steady",
    approvalReceipt: "",
    routes: ["appointment-checklist", "medicare-supplements"],
  });
  const repeated = resolve({
    phase: "steady",
    approvalReceipt: "",
    routes: ["appointment-checklist", "medicare-supplements"],
  });
  const rolledBack = resolve({
    phase: "steady",
    approvalReceipt: "",
    routes: ["appointment-checklist"],
  });
  const receipt = (output: string) =>
    output.match(/KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_RECEIPT=([a-f0-9]{64})/)?.[1];
  assert.equal(receipt(first), receipt(repeated));
  assert.notEqual(receipt(first), receipt(rolledBack));
  assert.match(first, /KNOWLEDGE_CMS_PUBLIC_CUTOVER_ROUTES=appointment-checklist\|medicare-supplements/);
});

test("cutover requires a receipt and explicit unique routes", () => {
  const invalid = spawnSync(
    process.execPath,
    [resolver, checkedInConfig],
    {
      encoding: "utf8",
      env: process.env,
    },
  );
  assert.equal(invalid.status, 0);

  const receipt = "a".repeat(64);
  const output = resolve({
    phase: "cutover",
    approvalReceipt: receipt,
    routes: ["appointment-checklist"],
  });
  assert.match(output, /KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE=cutover/);
  assert.match(output, /KNOWLEDGE_CMS_PUBLIC_CUTOVER_ENABLED=true/);
  assert.match(output, new RegExp(`APPROVAL_RECEIPT=${receipt}`));
  assert.match(output, /CUTOVER_ROUTES=appointment-checklist/);

  const directory = mkdtempSync(join(tmpdir(), "knowledge-rollout-invalid-"));
  const path = join(directory, "config.json");
  writeFileSync(path, JSON.stringify({ phase: "cutover", approvalReceipt: "", routes: [] }));
  const result = spawnSync(process.execPath, [resolver, path], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /cutover requires/);
});
