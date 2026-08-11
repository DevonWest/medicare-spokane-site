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
const readme = readFileSync(join(root, "README.md"), "utf8");
const deploymentGuide = readFileSync(
  join(root, "docs/deploy-beta-checklist.md"),
  "utf8",
);
const copilotGuide = readFileSync(
  join(root, "docs/knowledge-cms-ai-seo-copilot.md"),
  "utf8",
);

test("pull requests run the full CI job without deploying", () => {
  assert.match(workflow, /on:\n  pull_request:\n  push:/);
  assert.match(workflow, /push:\n    branches:\n      - main/);
  assert.match(
    workflow,
    /deploy:\n    if: \${{ github\.event_name != 'pull_request' }}/,
  );
});

test("main pushes and manual runs deploy production only", () => {
  assert.match(workflow, /workflow_dispatch:\n/);
  assert.match(
    workflow,
    /group: deploy-cloud-run-\$\{\{ github\.ref \}\}-production/,
  );
  assert.match(workflow, /TARGET: production/);
  assert.match(
    workflow,
    /- name: Build sanity check\n        run: npm run build\n        env:\n          NEXT_PUBLIC_SITE_URL: https:\/\/www\.medicareinspokane\.com\n          NEXT_PUBLIC_SITE_ENV: production/,
  );
  assert.doesNotMatch(workflow, /CLOUD_RUN_SERVICE_BETA|event\.inputs\.target/);
  assert.doesNotMatch(workflow, /beta\.medicareinspokane\.com/);
});

test("production rollout phase is checked in and resolved before validation", () => {
  assert.match(
    workflow,
    /- name: Resolve checked-in Knowledge CMS rollout phase/,
  );
  assert.match(
    workflow,
    /node scripts\/resolve-knowledge-cms-rollout-config\.mjs\n\s+config\/knowledge-cms-production-rollout\.json\n\s+>> "\$GITHUB_ENV"/,
  );
  assert.ok(
    workflow.indexOf("- name: Resolve checked-in Knowledge CMS rollout phase") <
      workflow.indexOf("- name: Validate required variables"),
  );
});

test("Search Console evidence is enabled by default with an explicit kill switch", () => {
  assert.match(
    workflow,
    /KNOWLEDGE_CMS_SEARCH_CONSOLE_ENABLED: \${{ vars\.KNOWLEDGE_CMS_SEARCH_CONSOLE_ENABLED \|\| 'true' }}/,
  );
  assert.match(
    workflow,
    /SEARCH_CONSOLE_SITE_URL: \${{ vars\.SEARCH_CONSOLE_SITE_URL \|\| 'sc-domain:medicareinspokane\.com' }}/,
  );
  assert.match(
    copilotGuide,
    /explicit repository\s+value of `false` remains the kill switch/,
  );
});

test("Search Console API setup stays outside the least-privilege deploy workflow", () => {
  assert.doesNotMatch(workflow, /gcloud services enable/);
  assert.doesNotMatch(workflow, /serviceusage\.services\.enable/);
  assert.match(
    copilotGuide,
    /gcloud services enable searchconsole\.googleapis\.com/,
  );
  assert.match(
    copilotGuide,
    /ordinary\s+GitHub deployer intentionally does not receive\s+`serviceusage\.services\.enable`/,
  );
  assert.match(
    copilotGuide,
    /CMS live-connection check remains the authoritative verification/,
  );
});

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

test("public rollout and CMS monitoring guides use the edge-safe health endpoint", () => {
  for (const guide of [readme, deploymentGuide, copilotGuide]) {
    assert.match(guide, /\/api\/deployment-health/);
    assert.doesNotMatch(
      guide,
      /https:\/\/(?:beta|www)\.medicareinspokane\.com\/healthz/,
    );
  }
  assert.match(readme, /`\/healthz` \| Internal container smoke/);
  assert.match(copilotGuide, /using `\/healthz` internally for container probes/);
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
    /--url "\$\{\{ steps\.service_state\.outputs\.direct_url \}\}\/api\/deployment-health"/,
  );
  assert.match(workflow, /- name: Explain protected Cloud Run service endpoint/);
  assert.match(
    workflow,
    /steps\.service_state\.outputs\.direct_public != 'true'/,
  );
  assert.doesNotMatch(workflow, /steps\.deploy_standard\.outputs\.url/);
  assert.match(workflow, /- name: Verify deployed custom-domain health/);
  assert.match(workflow, /--url "\$\{\{ steps\.cfg\.outputs\.site_url \}\}\/api\/deployment-health"/);
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
