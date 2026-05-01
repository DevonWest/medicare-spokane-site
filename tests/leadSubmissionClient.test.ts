import assert from "node:assert/strict";
import { test } from "node:test";

import {
  LEAD_NETWORK_ERROR_MESSAGE,
  submitLeadRequest,
} from "../lib/leadSubmissionClient";
import type { LeadRequestPayload } from "../lib/leadPayload";

const payload: LeadRequestPayload = {
  fullName: "Jane Doe",
  email: "jane@example.com",
  phone: "509-555-0100",
  zip: "99206",
  message: "Please call me.",
  source: "contact",
  sourcePath: "/contact",
  referrer: "https://example.com/",
  utm: { source: "google", medium: "cpc" },
  clientSubmittedAt: "2026-05-01T03:18:00.000Z",
};

test("submitLeadRequest treats ok true API responses as success", async () => {
  const result = await submitLeadRequest(
    async () =>
      new Response(JSON.stringify({ ok: true, id: "lead_123", crmSyncStatus: "failed" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    payload,
  );

  assert.equal(result.kind, "success");
  if (result.kind === "success") {
    assert.equal(result.data.id, "lead_123");
    assert.equal(result.data.crmSyncStatus, "failed");
  }
});

test("submitLeadRequest treats 201 ok true API responses as success", async () => {
  const result = await submitLeadRequest(
    async () =>
      new Response(JSON.stringify({ ok: true, id: "lead_123", emailStatus: "failed" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    payload,
  );

  assert.equal(result.kind, "success");
});

test("submitLeadRequest returns the API validation message on validation errors", async () => {
  const result = await submitLeadRequest(
    async () =>
      new Response(JSON.stringify({ ok: false, error: "Please enter a valid phone number." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    payload,
  );

  assert.deepEqual(result, {
    kind: "api-error",
    message: "Please enter a valid phone number.",
  });
});

test("submitLeadRequest only uses the network error message for true fetch failures", async () => {
  const result = await submitLeadRequest(
    async () => {
      throw new TypeError("fetch failed");
    },
    payload,
  );

  assert.deepEqual(result, {
    kind: "network-error",
    message: LEAD_NETWORK_ERROR_MESSAGE,
  });
});
