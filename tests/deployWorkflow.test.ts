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
  assert.match(workflow, /- name: Verify Cloud SDK deployment support/);
  assert.match(workflow, /gcloud run deploy --help/);
  assert.match(
    workflow,
    /--startup-probe \\\n\s+--liveness-probe \\\n\s+--ingress \\\n\s+--default-url \\\n\s+--no-invoker-iam-check/,
  );
  assert.doesNotMatch(workflow, /--readiness-probe/);
  assert.ok(
    workflow.indexOf("- name: Verify Cloud SDK deployment support") <
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
  assert.match(workflow, /- name: Smoke test built container health/);
  assert.match(workflow, /--url "http:\/\/127\.0\.0\.1:18080\/healthz"/);
  assert.ok(
    workflow.indexOf("- name: Smoke test built container health") <
      workflow.indexOf("- name: Push container image"),
  );
});

test("public website deploys explicitly reconcile network and invocation access", () => {
  assert.equal((workflow.match(/--ingress=all/g) ?? []).length, 2);
  assert.equal((workflow.match(/--default-url/g) ?? []).length, 3);
  assert.equal((workflow.match(/--no-invoker-iam-check/g) ?? []).length, 3);
  assert.doesNotMatch(workflow, /--allow-unauthenticated/);
});

test("custom-domain DNS is verified before an image is built", () => {
  assert.match(workflow, /- name: Verify target custom-domain DNS/);
  assert.match(workflow, /node scripts\/verify-deployment-dns\.mjs/);
  assert.match(
    workflow,
    /--hostname "\$\{\{ steps\.cfg\.outputs\.site_host \}\}"/,
  );
  assert.match(workflow, /--expected-cname "ghs\.googlehosted\.com"/);
  assert.ok(
    workflow.indexOf("- name: Verify target custom-domain DNS") <
      workflow.indexOf("- name: Build container image"),
  );
});

test("traffic-serving deploys promote and verify one exact ready revision", () => {
  assert.doesNotMatch(workflow, /revision_traffic: LATEST=100/);
  assert.match(workflow, /suffix: \$\{\{ steps\.cfg\.outputs\.revision_suffix \}\}/);
  assert.match(workflow, /no_traffic: true/);
  assert.match(workflow, /- name: Require exact deployed revision readiness/);
  assert.match(workflow, /gcloud run revisions describe "\$REVISION"/);
  assert.match(workflow, /--format=json/);
  assert.match(
    workflow,
    /node scripts\/parse-cloud-run-revision-readiness\.mjs/,
  );
  assert.doesNotMatch(workflow, /status\.conditions\[\?type=/);
  assert.match(workflow, /--to-revisions "\$REVISION=100"/);
  assert.match(
    workflow,
    /- name: Verify exact Cloud Run traffic and endpoint state/,
  );
  assert.match(workflow, /gcloud run services describe "\$SERVICE"/);
  assert.match(workflow, /node scripts\/parse-cloud-run-service-state\.mjs/);
  assert.match(workflow, /--revision "\$REVISION"/);
  assert.match(workflow, /- name: Verify deployed Cloud Run service health/);
  assert.match(
    workflow,
    /steps\.service_state\.outputs\.direct_public == 'true'/,
  );
  assert.match(
    workflow,
    /--url "\$\{\{ steps\.service_state\.outputs\.direct_url \}\}\/healthz"/,
  );
  assert.match(workflow, /- name: Explain protected Cloud Run service endpoint/);
  assert.match(
    workflow,
    /steps\.service_state\.outputs\.direct_public != 'true'/,
  );
  assert.doesNotMatch(workflow, /steps\.deploy_standard\.outputs\.url/);
  assert.match(workflow, /- name: Verify deployed custom-domain health/);
  assert.match(workflow, /--url "\$\{\{ steps\.cfg\.outputs\.site_url \}\}\/healthz"/);
  assert.match(workflow, /--commit "\$\{\{ github\.sha \}\}"/);
  assert.match(workflow, /--target "\$TARGET"/);
  assert.match(workflow, /- name: Show service URL\n\s+if: \$\{\{ always\(\) \}\}/);
  assert.ok(
    workflow.indexOf("- name: Require exact deployed revision readiness") <
      workflow.indexOf("- name: Verify exact Cloud Run traffic and endpoint state"),
  );
  assert.ok(
    workflow.indexOf("- name: Verify exact Cloud Run traffic and endpoint state") <
      workflow.indexOf("- name: Verify deployed custom-domain health"),
  );
});
