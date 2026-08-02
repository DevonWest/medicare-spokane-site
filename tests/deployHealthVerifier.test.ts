import assert from "node:assert/strict";
import test from "node:test";
import {
  cleanFailureReason,
  parseDeploymentHealthArguments,
  validateDeploymentHealthPayload,
  verifyDeploymentHealth,
} from "../scripts/verify-cloud-run-health.mjs";

const commitSha = "c".repeat(40);

function healthyPayload() {
  return {
    status: "ok",
    deployment: { commitSha },
    knowledgeCmsPublicRenderer: {
      configurationValid: true,
      environment: "beta",
    },
  };
}

test("deployment health arguments require a safe exact target", () => {
  const options = parseDeploymentHealthArguments([
    "--url",
    "https://beta.medicareinspokane.com/healthz",
    "--commit",
    commitSha,
    "--target",
    "beta",
  ]);

  assert.equal(options.url.href, "https://beta.medicareinspokane.com/healthz");
  assert.equal(options.expectedCommitSha, commitSha);
  assert.equal(options.expectedTarget, "beta");
  assert.equal(
    parseDeploymentHealthArguments([
      "--url",
      "http://127.0.0.1:18080/healthz",
      "--commit",
      commitSha,
      "--target",
      "beta",
    ]).url.href,
    "http://127.0.0.1:18080/healthz",
  );
  assert.throws(
    () =>
      parseDeploymentHealthArguments([
        "--url",
        "https://example.com/healthz?token=secret",
        "--commit",
        commitSha,
        "--target",
        "beta",
      ]),
    /credential-free HTTPS or loopback HTTP/,
  );
  assert.throws(
    () =>
      parseDeploymentHealthArguments([
        "--url",
        "http://example.com/healthz",
        "--commit",
        commitSha,
        "--target",
        "beta",
      ]),
    /credential-free HTTPS or loopback HTTP/,
  );
});

test("deployment health payload is revision- and environment-bound", () => {
  assert.doesNotThrow(() =>
    validateDeploymentHealthPayload(healthyPayload(), {
      expectedCommitSha: commitSha,
      expectedTarget: "beta",
    }),
  );
  assert.throws(
    () =>
      validateDeploymentHealthPayload(
        {
          ...healthyPayload(),
          deployment: { commitSha: "d".repeat(40) },
        },
        { expectedCommitSha: commitSha, expectedTarget: "beta" },
      ),
    /deployed commit/,
  );
  assert.throws(
    () =>
      validateDeploymentHealthPayload(
        {
          ...healthyPayload(),
          knowledgeCmsPublicRenderer: {
            configurationValid: false,
            environment: "beta",
          },
        },
        { expectedCommitSha: commitSha, expectedTarget: "beta" },
      ),
    /invalid renderer configuration/,
  );
});

test("deployment health verification retries until the exact revision is live", async () => {
  let requests = 0;
  let sleeps = 0;

  await verifyDeploymentHealth(
    {
      url: new URL("https://beta.medicareinspokane.com/healthz"),
      expectedCommitSha: commitSha,
      expectedTarget: "beta",
      attempts: 2,
      delayMs: 1,
      timeoutMs: 1_000,
    },
    {
      fetchImpl: async () => {
        requests += 1;
        return requests === 1
          ? new Response(null, { status: 503 })
          : Response.json(healthyPayload());
      },
      sleepImpl: async () => {
        sleeps += 1;
      },
    },
  );

  assert.equal(requests, 2);
  assert.equal(sleeps, 1);
});

test("deployment health failures preserve actionable network causes", () => {
  const dnsCause = Object.assign(new Error("getaddrinfo ENOTFOUND"), {
    code: "ENOTFOUND",
  });
  const refusedCause = Object.assign(new Error("connect ECONNREFUSED"), {
    code: "ECONNREFUSED",
  });

  assert.equal(
    cleanFailureReason(new TypeError("fetch failed", { cause: dnsCause })),
    "DNS name could not be resolved",
  );
  assert.equal(
    cleanFailureReason(new TypeError("fetch failed", { cause: refusedCause })),
    "connection was refused",
  );
});
