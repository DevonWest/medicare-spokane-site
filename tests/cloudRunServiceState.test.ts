import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  formatCloudRunServiceState,
  parseCloudRunServiceState,
} from "../scripts/parse-cloud-run-service-state.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const parser = join(root, "scripts/parse-cloud-run-service-state.mjs");
const revision = "medicare-spokane-site-beta-r-12345678-12345678901-1";

function servicePayload(overrides: Record<string, unknown> = {}) {
  return {
    metadata: { annotations: {} },
    status: {
      traffic: [{ percent: 100, revisionName: revision }],
      url: "https://medicare-spokane-site-beta-example-uw.a.run.app",
    },
    ...overrides,
  };
}

test("accepts exact traffic and a publicly reachable default URL", () => {
  const state = parseCloudRunServiceState(servicePayload(), revision);
  assert.deepEqual(state, {
    directPublic: true,
    directReason: "public",
    directUrl: "https://medicare-spokane-site-beta-example-uw.a.run.app",
  });

  const result = spawnSync(process.execPath, [parser, "--revision", revision], {
    encoding: "utf8",
    input: JSON.stringify(servicePayload()),
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    result.stdout,
    [
      "direct_public=true",
      "direct_url=https://medicare-spokane-site-beta-example-uw.a.run.app",
      "direct_reason=public",
      "",
    ].join("\n"),
  );
});

test("classifies restricted ingress without weakening it", () => {
  for (const [ingress, reason] of [
    ["internal", "ingress-internal"],
    [
      "internal-and-cloud-load-balancing",
      "ingress-internal-and-cloud-load-balancing",
    ],
    ["INGRESS_TRAFFIC_INTERNAL_ONLY", "ingress-internal"],
    [
      "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER",
      "ingress-internal-and-cloud-load-balancing",
    ],
  ] as const) {
    const state = parseCloudRunServiceState(
      servicePayload({
        metadata: {
          annotations: { "run.googleapis.com/ingress": ingress },
        },
      }),
      revision,
    );
    assert.equal(state.directPublic, false);
    assert.equal(state.directReason, reason);
    assert.match(formatCloudRunServiceState(state), /^direct_public=false/m);
  }
});

test("classifies a disabled or unavailable default URL", () => {
  assert.equal(
    parseCloudRunServiceState(
      servicePayload({
        metadata: {
          annotations: { "run.googleapis.com/default-url-disabled": "true" },
        },
      }),
      revision,
    ).directReason,
    "default-url-disabled",
  );
  assert.deepEqual(
    parseCloudRunServiceState(
      servicePayload({
        status: {
          traffic: [{ percent: 100, revisionName: revision }],
        },
      }),
      revision,
    ),
    {
      directPublic: false,
      directReason: "default-url-unavailable",
      directUrl: null,
    },
  );
});

test("fails closed unless one exact revision owns all service traffic", () => {
  assert.throws(
    () =>
      parseCloudRunServiceState(
        servicePayload({
          status: {
            traffic: [
              { percent: 90, revisionName: revision },
              { percent: 10, revisionName: "older-revision" },
            ],
            url: "https://medicare-spokane-site-beta-example-uw.a.run.app",
          },
        }),
        revision,
      ),
    /exactly 100%/,
  );
  assert.throws(
    () =>
      parseCloudRunServiceState(
        servicePayload({
          status: {
            traffic: [{ percent: 100, revisionName: "older-revision" }],
            url: "https://medicare-spokane-site-beta-example-uw.a.run.app",
          },
        }),
        revision,
      ),
    /exactly 100%/,
  );
  assert.throws(
    () =>
      parseCloudRunServiceState(
        servicePayload({
          status: {
            traffic: [{ percent: "100", revisionName: revision }],
            url: "https://medicare-spokane-site-beta-example-uw.a.run.app",
          },
        }),
        revision,
      ),
    /percent is invalid/,
  );
});

test("fails closed on unsafe service metadata", () => {
  assert.throws(
    () =>
      parseCloudRunServiceState(
        servicePayload({
          metadata: {
            annotations: { "run.googleapis.com/ingress": "unexpected" },
          },
        }),
        revision,
      ),
    /unsupported ingress/,
  );
  assert.throws(
    () =>
      parseCloudRunServiceState(
        servicePayload({
          status: {
            traffic: [{ percent: 100, revisionName: revision }],
            url: "https://example.com",
          },
        }),
        revision,
      ),
    /safe run\.app origin/,
  );
  assert.throws(
    () => parseCloudRunServiceState([], revision),
    /JSON object/,
  );
});
