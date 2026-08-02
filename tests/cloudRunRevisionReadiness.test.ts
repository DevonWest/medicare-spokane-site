import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { parseCloudRunRevisionReadiness } from "../scripts/parse-cloud-run-revision-readiness.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const parser = join(root, "scripts/parse-cloud-run-revision-readiness.mjs");

const retiredReadyRevision = {
  metadata: { name: "medicare-spokane-site-beta-r-example" },
  status: {
    conditions: [
      { type: "Ready", status: "True", reason: "Retired" },
      { type: "Active", status: "False", reason: "Retired" },
      { type: "ContainerReady", status: "True" },
      { type: "ResourcesAvailable", status: "Unknown", reason: "Retired" },
    ],
  },
};

test("extracts Ready=True from the exact retired no-traffic condition shape", () => {
  assert.equal(parseCloudRunRevisionReadiness(retiredReadyRevision), "True");

  const result = spawnSync(process.execPath, [parser], {
    encoding: "utf8",
    input: JSON.stringify(retiredReadyRevision),
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "True\n");
});

test("preserves pending and terminal Ready statuses", () => {
  assert.equal(
    parseCloudRunRevisionReadiness({
      status: { conditions: [{ type: "Ready", status: "Unknown" }] },
    }),
    "Unknown",
  );
  assert.equal(
    parseCloudRunRevisionReadiness({
      status: { conditions: [{ type: "Ready", status: "False" }] },
    }),
    "False",
  );
  assert.equal(parseCloudRunRevisionReadiness({ status: { conditions: [] } }), "");
  assert.equal(parseCloudRunRevisionReadiness({}), "");
});

test("fails closed on malformed or ambiguous revision responses", () => {
  assert.throws(() => parseCloudRunRevisionReadiness([]), /JSON object/);
  assert.throws(
    () => parseCloudRunRevisionReadiness({ status: { conditions: {} } }),
    /conditions must be an array/,
  );
  assert.throws(
    () =>
      parseCloudRunRevisionReadiness({
        status: {
          conditions: [
            { type: "Ready", status: "True" },
            { type: "Ready", status: "False" },
          ],
        },
      }),
    /duplicate Ready conditions/,
  );
  assert.throws(
    () =>
      parseCloudRunRevisionReadiness({
        status: { conditions: [{ type: "Ready", status: true }] },
      }),
    /invalid status/,
  );
});
