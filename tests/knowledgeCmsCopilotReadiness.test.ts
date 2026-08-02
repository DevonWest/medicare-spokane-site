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

async function readiness(runtime: Record<string, string | undefined>) {
  const { getKnowledgeCmsCopilotReadiness } = await import(
    "../lib/knowledgeCmsCopilotReadiness"
  );
  return getKnowledgeCmsCopilotReadiness(runtime);
}

test("copilot readiness distinguishes disabled features from blocked dependencies", async () => {
  const initial = await readiness({});
  assert.equal(initial.readyCount, 0);
  assert.deepEqual(
    initial.checks.map((item) => [item.id, item.state]),
    [
      ["cms", "blocked"],
      ["seo", "disabled"],
      ["search_console", "disabled"],
      ["ai", "disabled"],
      ["continuous", "disabled"],
    ],
  );

  const blocked = await readiness({
    KNOWLEDGE_CMS_AI_ENABLED: "true",
    KNOWLEDGE_CMS_SEARCH_CONSOLE_ENABLED: "true",
    KNOWLEDGE_CMS_CONTINUOUS_SEO_ENABLED: "true",
  });
  assert.equal(blocked.checks.find((item) => item.id === "ai")?.state, "blocked");
  assert.equal(
    blocked.checks.find((item) => item.id === "search_console")?.state,
    "blocked",
  );
  assert.equal(
    blocked.checks.find((item) => item.id === "continuous")?.state,
    "blocked",
  );
});

test("fully configured readiness reports capability without exposing secret values", async () => {
  const apiKey = "private-api-key-test-value";
  const schedulerToken = "x".repeat(48);
  const result = await readiness({
    KNOWLEDGE_CMS_ENABLED: "true",
    KNOWLEDGE_CMS_SEO_ENABLED: "true",
    KNOWLEDGE_CMS_SEARCH_CONSOLE_ENABLED: "true",
    SEARCH_CONSOLE_SITE_URL: "sc-domain:medicareinspokane.com",
    KNOWLEDGE_CMS_AI_ENABLED: "true",
    OPENAI_API_KEY: apiKey,
    KNOWLEDGE_CMS_AI_MODEL: "gpt-5.6-terra",
    KNOWLEDGE_CMS_AI_DEEP_MODEL: "gpt-5.6-sol",
    KNOWLEDGE_CMS_CONTINUOUS_SEO_ENABLED: "true",
    KNOWLEDGE_CMS_SEO_CRON_TOKEN: schedulerToken,
  });
  assert.equal(result.readyCount, result.totalCount);
  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, new RegExp(apiKey));
  assert.doesNotMatch(serialized, new RegExp(schedulerToken));
  assert.match(serialized, /gpt-5\.6-terra/);
  assert.match(serialized, /gpt-5\.6-sol/);
});

test("invalid model and Search Console values fail closed", async () => {
  const result = await readiness({
    KNOWLEDGE_CMS_ENABLED: "true",
    KNOWLEDGE_CMS_SEO_ENABLED: "true",
    KNOWLEDGE_CMS_SEARCH_CONSOLE_ENABLED: "true",
    SEARCH_CONSOLE_SITE_URL: "http://example.com",
    KNOWLEDGE_CMS_AI_ENABLED: "true",
    OPENAI_API_KEY: "configured",
    KNOWLEDGE_CMS_AI_MODEL: "not-a-model",
  });
  assert.equal(
    result.checks.find((item) => item.id === "search_console")?.state,
    "blocked",
  );
  assert.equal(result.checks.find((item) => item.id === "ai")?.state, "blocked");
});
