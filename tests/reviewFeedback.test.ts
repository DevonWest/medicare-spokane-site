import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";

const require = createRequire(import.meta.url);

function mockServerOnlyModule() {
  const serverOnlyPath = require.resolve("server-only");
  require.cache[serverOnlyPath] = {
    exports: {},
    filename: serverOnlyPath,
    id: serverOnlyPath,
    loaded: true,
  } as never;
}

async function loadReviewFeedbackModules() {
  mockServerOnlyModule();

  const [{ handleReviewFeedbackPost }, { buildReviewFeedbackDocument }, { SITE_SOURCE }] = await Promise.all([
    import("../app/api/review-feedback/route"),
    import("../lib/reviewFeedback"),
    import("../lib/leadConstants"),
  ]);

  return { handleReviewFeedbackPost, buildReviewFeedbackDocument, SITE_SOURCE };
}

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/review-feedback", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeValidPayload() {
  return {
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "509-555-0100",
    agentSlug: "kristi-wright",
    rating: 3,
    message: "I had trouble understanding my options.",
    sourcePath: "/review/feedback",
  };
}

test("feedback API rejects a missing message", async () => {
  const { handleReviewFeedbackPost } = await loadReviewFeedbackModules();
  const response = await handleReviewFeedbackPost(
    makeRequest({
      ...makeValidPayload(),
      message: "   ",
    }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    ok: false,
    error: "Please share what happened.",
  });
});

test("feedback API rejects rating 5 because five-star reviews go to Google", async () => {
  const { handleReviewFeedbackPost } = await loadReviewFeedbackModules();
  const response = await handleReviewFeedbackPost(
    makeRequest({
      ...makeValidPayload(),
      rating: 5,
    }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    ok: false,
    error: "Please choose a rating between 1 and 4 stars.",
  });
});

test("feedback API stores valid 1-4 star feedback", async () => {
  const { handleReviewFeedbackPost } = await loadReviewFeedbackModules();
  const addedDocs: Array<Record<string, unknown>> = [];

  const response = await handleReviewFeedbackPost(makeRequest(makeValidPayload()), {
    submitReviewFeedback: async (payload) => {
      addedDocs.push(payload as Record<string, unknown>);
      return { ok: true, id: "feedback_123" };
    },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    id: "feedback_123",
  });
  assert.equal(addedDocs.length, 1);
  assert.equal(addedDocs[0]?.fullName, "Jane Doe");
  assert.equal(addedDocs[0]?.rating, 3);
  assert.equal(addedDocs[0]?.agentSlug, "kristi-wright");
});

test("review feedback document stores the required Firestore fields", async () => {
  const { buildReviewFeedbackDocument, SITE_SOURCE } = await loadReviewFeedbackModules();

  const doc = buildReviewFeedbackDocument(
    {
      fullName: "Jane Doe",
      email: "Jane@example.com",
      phone: "509-555-0100",
      agentSlug: "kristi-wright",
      rating: 2,
      message: "Follow-up needed.",
      sourcePath: "/review/feedback",
    },
    Date.parse("2026-05-02T23:00:00.000Z"),
  );

  assert.equal(doc.fullName, "Jane Doe");
  assert.equal(doc.email, "jane@example.com");
  assert.equal(doc.phone, "509-555-0100");
  assert.equal(doc.agentSlug, "kristi-wright");
  assert.equal(doc.agentName, "Kristi Wright");
  assert.equal(doc.rating, 2);
  assert.equal(doc.message, "Follow-up needed.");
  assert.equal(doc.sourcePath, "/review/feedback");
  assert.equal(doc.status, "new");
  assert.equal(doc.siteSource, SITE_SOURCE);
  assert.ok(doc.submittedAt);
  assert.ok(doc.createdAt);
});
