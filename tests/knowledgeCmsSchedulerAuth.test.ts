import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const serverOnlyPath = require.resolve("server-only");
require.cache[serverOnlyPath] = {
  exports: {},
  filename: serverOnlyPath,
  id: serverOnlyPath,
  loaded: true,
} as never;

const runtime = {
  NEXT_PUBLIC_SITE_URL: "https://www.medicareinspokane.com",
  KNOWLEDGE_CMS_SEO_SCHEDULER_REPOSITORY:
    "DevonWest/medicare-spokane-site",
};

test("weekly scheduler accepts only a verified workload identity for the exact endpoint", async () => {
  const scheduler = await import("../lib/knowledgeCmsSchedulerAuth");
  const calls: Array<{ idToken: string; audience: string }> = [];
  const authorized = await scheduler.isAuthorizedKnowledgeCmsSchedulerRequest(
    new Request(
      "https://www.medicareinspokane.com/api/knowledge-cms/seo-scan",
      { headers: { authorization: "Bearer header.payload.signature" } },
    ),
    {
      runtime,
      async verifyIdToken(idToken, audience) {
        calls.push({ idToken, audience });
        return {
          repository: "DevonWest/medicare-spokane-site",
          ref: "refs/heads/main",
          workflow_ref:
            "DevonWest/medicare-spokane-site/.github/workflows/weekly-seo-scan.yml@refs/heads/main",
          event_name: "schedule",
        };
      },
    },
  );

  assert.equal(authorized, true);
  assert.deepEqual(calls, [
    {
      idToken: "header.payload.signature",
      audience:
        "https://www.medicareinspokane.com/api/knowledge-cms/seo-scan",
    },
  ]);
});

test("successful production deploy follow-ups can run the same protected scan", async () => {
  const scheduler = await import("../lib/knowledgeCmsSchedulerAuth");
  const authorized = await scheduler.isAuthorizedKnowledgeCmsSchedulerRequest(
    new Request(
      "https://www.medicareinspokane.com/api/knowledge-cms/seo-scan",
      { headers: { authorization: "Bearer header.payload.signature" } },
    ),
    {
      runtime,
      async verifyIdToken() {
        return {
          repository: "DevonWest/medicare-spokane-site",
          ref: "refs/heads/main",
          workflow_ref:
            "DevonWest/medicare-spokane-site/.github/workflows/weekly-seo-scan.yml@refs/heads/main",
          event_name: "workflow_run",
        };
      },
    },
  );

  assert.equal(authorized, true);
});

test("weekly scheduler fails closed for forged, forked, or non-main identities", async () => {
  const scheduler = await import("../lib/knowledgeCmsSchedulerAuth");
  const request = new Request(
    "https://www.medicareinspokane.com/api/knowledge-cms/seo-scan",
    { headers: { authorization: "Bearer header.payload.signature" } },
  );
  const verify = async () => ({
    repository: "attacker/fork",
    ref: "refs/heads/main",
    workflow_ref:
      "attacker/fork/.github/workflows/weekly-seo-scan.yml@refs/heads/main",
    event_name: "schedule",
  });

  assert.equal(
    await scheduler.isAuthorizedKnowledgeCmsSchedulerRequest(request, {
      runtime,
      verifyIdToken: verify,
    }),
    false,
  );
  assert.equal(
    await scheduler.isAuthorizedKnowledgeCmsSchedulerRequest(request, {
      runtime,
      verifyIdToken: async () => ({
        repository: "DevonWest/medicare-spokane-site",
        ref: "refs/heads/feature",
        workflow_ref:
          "DevonWest/medicare-spokane-site/.github/workflows/weekly-seo-scan.yml@refs/heads/feature",
        event_name: "workflow_dispatch",
      }),
    }),
    false,
  );
  assert.equal(
    await scheduler.isAuthorizedKnowledgeCmsSchedulerRequest(request, {
      runtime,
      verifyIdToken: async () => ({
        repository: "DevonWest/medicare-spokane-site",
        ref: "refs/heads/main",
        workflow_ref:
          "DevonWest/medicare-spokane-site/.github/workflows/deploy.yml@refs/heads/main",
        event_name: "schedule",
      }),
    }),
    false,
  );
  assert.equal(
    await scheduler.isAuthorizedKnowledgeCmsSchedulerRequest(
      new Request(
        "https://www.medicareinspokane.com/api/knowledge-cms/seo-scan",
        { headers: { "x-knowledge-cms-seo-token": "x".repeat(64) } },
      ),
      { runtime, verifyIdToken: verify },
    ),
    false,
  );
  assert.equal(
    await scheduler.isAuthorizedKnowledgeCmsSchedulerRequest(request, {
      runtime: {
        ...runtime,
        NEXT_PUBLIC_SITE_URL: "http://www.medicareinspokane.com",
      },
      verifyIdToken: verify,
    }),
    false,
  );
});
