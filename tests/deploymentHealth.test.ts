import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { GET as getPublicDeploymentHealth } from "../app/api/deployment-health/route";
import {
  GET,
  getDeploymentCommitSha,
} from "../app/healthz/route";

const originalEnvironment = {
  APP_COMMIT_SHA: process.env.APP_COMMIT_SHA,
  KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE:
    process.env.KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE,
  NEXT_PUBLIC_SITE_ENV: process.env.NEXT_PUBLIC_SITE_ENV,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
};

afterEach(() => {
  for (const [name, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

test("deployment commit metadata accepts only normalized full Git SHAs", () => {
  assert.equal(getDeploymentCommitSha(`  ${"A".repeat(40)}  `), "a".repeat(40));
  assert.equal(getDeploymentCommitSha("abc123"), null);
  assert.equal(getDeploymentCommitSha(undefined), null);
});

test("health response identifies the exact healthy beta deployment", async () => {
  process.env.APP_COMMIT_SHA = "b".repeat(40);
  process.env.KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE = "static";
  process.env.NEXT_PUBLIC_SITE_ENV = "staging";
  process.env.NEXT_PUBLIC_SITE_URL = "https://beta.medicareinspokane.com";

  const response = GET();
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(body.status, "ok");
  assert.equal(body.deployment.commitSha, "b".repeat(40));
  assert.equal(body.knowledgeCmsPublicRenderer.environment, "beta");
  assert.equal(body.knowledgeCmsPublicRenderer.configurationValid, true);
});


test("public deployment health endpoint exposes the exact production revision", async () => {
  process.env.APP_COMMIT_SHA = "e".repeat(40);
  process.env.KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE = "static";
  process.env.NEXT_PUBLIC_SITE_ENV = "production";
  process.env.NEXT_PUBLIC_SITE_URL = "https://www.medicareinspokane.com";

  const response = getPublicDeploymentHealth();
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(body.status, "ok");
  assert.equal(body.deployment.commitSha, "e".repeat(40));
  assert.equal(body.knowledgeCmsPublicRenderer.environment, "production");
  assert.equal(body.knowledgeCmsPublicRenderer.configurationValid, true);
});
