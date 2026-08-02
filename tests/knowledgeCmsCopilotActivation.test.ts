import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import type {
  KnowledgeCmsCopilotActivationEvidence,
  KnowledgeCmsCopilotActivationStore,
} from "../lib/knowledgeCmsCopilotActivation";

const require = createRequire(import.meta.url);
const serverOnlyPath = require.resolve("server-only");
require.cache[serverOnlyPath] = {
  exports: {},
  filename: serverOnlyPath,
  id: serverOnlyPath,
  loaded: true,
} as never;

const FULL_RUNTIME = {
  NEXT_PUBLIC_SITE_ENV: "staging",
  NEXT_PUBLIC_SITE_URL: "https://beta.medicareinspokane.com",
  KNOWLEDGE_CMS_ENABLED: "true",
  KNOWLEDGE_CMS_SEO_ENABLED: "true",
  KNOWLEDGE_CMS_SEARCH_CONSOLE_ENABLED: "true",
  SEARCH_CONSOLE_SITE_URL: "sc-domain:medicareinspokane.com",
  KNOWLEDGE_CMS_AI_ENABLED: "true",
  OPENAI_API_KEY: "private-test-key",
  KNOWLEDGE_CMS_AI_MODEL: "gpt-5.6-terra",
  KNOWLEDGE_CMS_AI_DEEP_MODEL: "gpt-5.6-sol",
  KNOWLEDGE_CMS_CONTINUOUS_SEO_ENABLED: "true",
  KNOWLEDGE_CMS_SEO_CRON_TOKEN: "x".repeat(48),
} as const;

class MemoryActivationStore implements KnowledgeCmsCopilotActivationStore {
  evidence?: KnowledgeCmsCopilotActivationEvidence;

  async getCurrent(input: { environment: string; origin: string }) {
    return this.evidence?.environment === input.environment &&
      this.evidence.origin === input.origin
      ? structuredClone(this.evidence)
      : undefined;
  }

  async save(evidence: KnowledgeCmsCopilotActivationEvidence) {
    this.evidence = structuredClone(evidence);
  }
}

test("live activation verifies read-only integrations and strips secrets and actors from the admin view", async () => {
  const activation = await import("../lib/knowledgeCmsCopilotActivation");
  const store = new MemoryActivationStore();
  const view = await activation.runKnowledgeCmsCopilotActivationCheck({
    actor: { id: "cms-admin", roles: ["admin"] },
    now: () => new Date("2026-08-01T18:00:00.000Z"),
    runtime: FULL_RUNTIME,
    store,
    searchConsole: async () => ({
      status: "available",
      siteUrl: "sc-domain:medicareinspokane.com",
    }),
    openAi: async () => ({
      status: "available",
      routineModel: "gpt-5.6-terra",
      deepModel: "gpt-5.6-sol",
    }),
  });

  assert.equal(view.readyCount, 5);
  assert.equal(view.readyForAi, true);
  assert.equal(view.readyForContinuousSeo, true);
  assert.equal(
    view.checks.find((item) => item.id === "search_console")?.verification,
    "live",
  );
  assert.equal(
    view.checks.find((item) => item.id === "ai")?.verification,
    "live",
  );
  assert.ok(store.evidence?.initiatedBy);
  const serialized = JSON.stringify(view);
  assert.doesNotMatch(serialized, /cms-admin/);
  assert.doesNotMatch(serialized, /private-test-key/);
  assert.doesNotMatch(serialized, /x{32}/);
  assert.equal("configurationFingerprint" in view, false);
});

test("continuous scans require current, unexpired evidence for the exact deployment configuration", async () => {
  const activation = await import("../lib/knowledgeCmsCopilotActivation");
  const store = new MemoryActivationStore();
  await activation.runKnowledgeCmsCopilotActivationCheck({
    actor: { id: "cms-admin", roles: ["admin"] },
    now: () => new Date("2026-08-01T18:00:00.000Z"),
    runtime: FULL_RUNTIME,
    store,
    searchConsole: async () => ({
      status: "available",
      siteUrl: "sc-domain:medicareinspokane.com",
    }),
    openAi: async () => ({
      status: "available",
      routineModel: "gpt-5.6-terra",
      deepModel: "gpt-5.6-sol",
    }),
  });

  assert.equal(
    await activation.hasCurrentKnowledgeCmsContinuousSeoActivation({
      now: () => new Date("2026-08-08T18:00:00.000Z"),
      runtime: FULL_RUNTIME,
      store,
    }),
    true,
  );
  assert.equal(
    await activation.hasCurrentKnowledgeCmsContinuousSeoActivation({
      now: () => new Date("2026-08-08T18:00:00.000Z"),
      runtime: {
        ...FULL_RUNTIME,
        SEARCH_CONSOLE_SITE_URL: "sc-domain:example.com",
      },
      store,
    }),
    false,
  );
  assert.equal(
    await activation.hasCurrentKnowledgeCmsContinuousSeoActivation({
      now: () => new Date("2026-09-06T18:00:00.001Z"),
      runtime: FULL_RUNTIME,
      store,
    }),
    false,
  );
  assert.ok(store.evidence);
  store.evidence.checks[4] = structuredClone(store.evidence.checks[0]);
  assert.equal(
    await activation.hasCurrentKnowledgeCmsContinuousSeoActivation({
      now: () => new Date("2026-08-08T18:00:00.000Z"),
      runtime: FULL_RUNTIME,
      store,
    }),
    false,
  );
});

test("disabled integrations never make live calls and cannot authorize recurring monitoring", async () => {
  const activation = await import("../lib/knowledgeCmsCopilotActivation");
  const store = new MemoryActivationStore();
  let externalCalls = 0;
  const view = await activation.runKnowledgeCmsCopilotActivationCheck({
    actor: { id: "cms-admin", roles: ["admin"] },
    now: () => new Date("2026-08-01T18:00:00.000Z"),
    runtime: {
      NEXT_PUBLIC_SITE_ENV: "staging",
      NEXT_PUBLIC_SITE_URL: "https://beta.medicareinspokane.com",
      KNOWLEDGE_CMS_ENABLED: "true",
      KNOWLEDGE_CMS_SEO_ENABLED: "true",
    },
    store,
    searchConsole: async () => {
      externalCalls += 1;
      return { status: "available" };
    },
    openAi: async () => {
      externalCalls += 1;
      return { status: "available" };
    },
  });

  assert.equal(externalCalls, 0);
  assert.equal(view.readyCount, 2);
  assert.equal(view.readyForAi, false);
  assert.equal(view.readyForContinuousSeo, false);
  assert.deepEqual(
    view.checks.map((item) => [item.id, item.state]),
    [
      ["cms", "verified"],
      ["seo", "verified"],
      ["search_console", "disabled"],
      ["ai", "disabled"],
      ["continuous", "disabled"],
    ],
  );
});

test("only a CMS administrator can create live activation evidence", async () => {
  const activation = await import("../lib/knowledgeCmsCopilotActivation");
  await assert.rejects(
    activation.runKnowledgeCmsCopilotActivationCheck({
      actor: { id: "cms-editor", roles: ["editor"] },
      runtime: FULL_RUNTIME,
      store: new MemoryActivationStore(),
    }),
    /not allowed/i,
  );
});
