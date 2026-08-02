import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const workflow = readFileSync(
  join(root, ".github/workflows/deploy.yml"),
  "utf8",
);

test("Cloud Run deployments use Node 24-compatible maintained actions", () => {
  assert.doesNotMatch(workflow, /actions\/checkout@v4/);
  assert.doesNotMatch(workflow, /actions\/setup-node@v4/);
  assert.doesNotMatch(workflow, /google-github-actions\/(?:auth|setup-gcloud|deploy-cloudrun)@v2/);
  assert.equal((workflow.match(/actions\/checkout@v5/g) ?? []).length, 2);
  assert.match(workflow, /actions\/setup-node@v5/);
  assert.match(workflow, /google-github-actions\/auth@v3/);
  assert.match(workflow, /google-github-actions\/setup-gcloud@v3/);
  assert.equal(
    (workflow.match(/google-github-actions\/deploy-cloudrun@v3/g) ?? [])
      .length,
    2,
  );
});

test("every Cloud Run revision is gated by the lightweight health route", () => {
  assert.equal(
    (workflow.match(/--startup-probe=httpGet\.path=\/healthz/g) ?? []).length,
    2,
  );
  assert.equal(
    (workflow.match(/--readiness-probe=httpGet\.path=\/healthz/g) ?? []).length,
    2,
  );
  assert.equal((workflow.match(/APP_COMMIT_SHA=\$\{\{ github\.sha \}\}/g) ?? []).length, 2);
});

test("traffic-serving deploys verify the exact commit through the public route", () => {
  assert.match(workflow, /- name: Verify deployed public health/);
  assert.match(workflow, /node scripts\/verify-cloud-run-health\.mjs/);
  assert.match(workflow, /--url "\$\{\{ steps\.cfg\.outputs\.site_url \}\}\/healthz"/);
  assert.match(workflow, /--commit "\$\{\{ github\.sha \}\}"/);
  assert.match(workflow, /--target "\$TARGET"/);
});
