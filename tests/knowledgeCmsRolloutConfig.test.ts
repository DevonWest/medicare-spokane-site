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

test("the checked-in phase enables approval without routing public traffic", () => {
  const config = JSON.parse(readFileSync(checkedInConfig, "utf8"));
  assert.equal(config.phase, "approval");
  const output = resolve(config);
  assert.match(output, /KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE=shadow/);
  assert.match(output, /KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED=false/);
  assert.match(output, /KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_EXECUTION_ENABLED=true/);
  assert.match(output, /KNOWLEDGE_CMS_PUBLIC_CUTOVER_ENABLED=false/);
  assert.match(output, /KNOWLEDGE_CMS_PUBLIC_CUTOVER_ROUTES=\n/);
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
    routes: ["resource-entry--appointment-checklist"],
  });
  assert.match(output, /KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE=cutover/);
  assert.match(output, /KNOWLEDGE_CMS_PUBLIC_CUTOVER_ENABLED=true/);
  assert.match(output, new RegExp(`APPROVAL_RECEIPT=${receipt}`));
  assert.match(output, /CUTOVER_ROUTES=resource-entry--appointment-checklist/);

  const directory = mkdtempSync(join(tmpdir(), "knowledge-rollout-invalid-"));
  const path = join(directory, "config.json");
  writeFileSync(path, JSON.stringify({ phase: "cutover", approvalReceipt: "", routes: [] }));
  const result = spawnSync(process.execPath, [resolver, path], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /cutover requires/);
});
