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

test("Cloud Run deployments use compatible maintained actions and Cloud SDK", () => {
  assert.doesNotMatch(workflow, /actions\/checkout@v4/);
  assert.doesNotMatch(workflow, /actions\/setup-node@v4/);
  assert.doesNotMatch(workflow, /google-github-actions\/(?:auth|setup-gcloud|deploy-cloudrun)@v2/);
  assert.equal((workflow.match(/actions\/checkout@v5/g) ?? []).length, 2);
  assert.match(workflow, /actions\/setup-node@v5/);
  assert.match(workflow, /google-github-actions\/auth@v3/);
  assert.match(workflow, /google-github-actions\/setup-gcloud@v3/);
  assert.match(workflow, /version: "latest"/);
  assert.match(workflow, /- name: Verify Cloud SDK health-probe support/);
  assert.match(workflow, /gcloud run deploy --help/);
  assert.match(workflow, /for probe_flag in --startup-probe --liveness-probe/);
  assert.doesNotMatch(workflow, /--readiness-probe/);
  assert.ok(
    workflow.indexOf("- name: Verify Cloud SDK health-probe support") <
      workflow.indexOf("- name: Build container image"),
  );
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
    (workflow.match(/--liveness-probe=httpGet\.path=\/healthz/g) ?? []).length,
    2,
  );
  assert.equal((workflow.match(/APP_COMMIT_SHA=\$\{\{ github\.sha \}\}/g) ?? []).length, 2);
});

test("traffic-serving deploys promote and verify the exact commit through both routes", () => {
  assert.equal((workflow.match(/revision_traffic: LATEST=100/g) ?? []).length, 1);
  assert.match(workflow, /- name: Verify deployed Cloud Run service health/);
  assert.match(workflow, /--url "\$\{\{ steps\.deploy_standard\.outputs\.url \}\}\/healthz"/);
  assert.match(workflow, /- name: Verify deployed custom-domain health/);
  assert.match(workflow, /--url "\$\{\{ steps\.cfg\.outputs\.site_url \}\}\/healthz"/);
  assert.match(workflow, /--commit "\$\{\{ github\.sha \}\}"/);
  assert.match(workflow, /--target "\$TARGET"/);
  assert.match(workflow, /- name: Show service URL\n\s+if: \$\{\{ always\(\) \}\}/);
});
