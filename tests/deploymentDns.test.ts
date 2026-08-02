import assert from "node:assert/strict";
import test from "node:test";

import {
  parseDeploymentDnsArguments,
  verifyDeploymentDns,
} from "../scripts/verify-deployment-dns.mjs";

test("deployment DNS arguments require safe hostnames", () => {
  const options = parseDeploymentDnsArguments([
    "--hostname",
    "beta.medicareinspokane.com",
    "--expected-cname",
    "ghs.googlehosted.com.",
  ]);

  assert.equal(options.hostname, "beta.medicareinspokane.com");
  assert.equal(options.expectedCname, "ghs.googlehosted.com");
  assert.throws(
    () =>
      parseDeploymentDnsArguments([
        "--hostname",
        "https://beta.medicareinspokane.com",
        "--expected-cname",
        "ghs.googlehosted.com",
      ]),
    /hostname is invalid/,
  );
});

test("deployment DNS accepts the exact Cloud Run CNAME", async () => {
  let lookups = 0;
  await verifyDeploymentDns(
    {
      hostname: "beta.medicareinspokane.com",
      expectedCname: "ghs.googlehosted.com",
      attempts: 1,
      delayMs: 0,
    },
    {
      resolveCnameImpl: async () => {
        lookups += 1;
        return ["GHS.GOOGLEHOSTED.COM."];
      },
    },
  );

  assert.equal(lookups, 1);
});

test("deployment DNS retries missing and incorrect records", async () => {
  let lookups = 0;
  let sleeps = 0;

  await assert.rejects(
    verifyDeploymentDns(
      {
        hostname: "beta.medicareinspokane.com",
        expectedCname: "ghs.googlehosted.com",
        attempts: 2,
        delayMs: 1,
      },
      {
        resolveCnameImpl: async () => {
          lookups += 1;
          if (lookups === 1) {
            throw Object.assign(new Error("queryCname ENOTFOUND"), {
              code: "ENOTFOUND",
            });
          }
          return ["wrong.example.com"];
        },
        sleepImpl: async () => {
          sleeps += 1;
        },
      },
    ),
    /Add CNAME beta\.medicareinspokane\.com -> ghs\.googlehosted\.com/,
  );

  assert.equal(lookups, 2);
  assert.equal(sleeps, 1);
});
