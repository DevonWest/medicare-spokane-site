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

  const [{ handleReviewFeedbackPost }, { buildReviewFeedbackDocument, submitReviewFeedbackWithDeps }, { CRM_PUBLIC_FORM_SUBMISSION_PATH }, { CRM_SYNC_STATUS, SITE_SOURCE }] = await Promise.all([
    import("../app/api/review-feedback/route"),
    import("../lib/reviewFeedback"),
    import("../lib/crmPaths"),
    import("../lib/leadConstants"),
  ]);

  return {
    handleReviewFeedbackPost,
    buildReviewFeedbackDocument,
    submitReviewFeedbackWithDeps,
    CRM_PUBLIC_FORM_SUBMISSION_PATH,
    CRM_SYNC_STATUS,
    SITE_SOURCE,
  };
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
    fullName: "Jane Doe",
    email: "jane@example.com",
    phone: "509-555-0100",
    agentSlug: "kristi-wright",
    rating: 3,
    message: "I had trouble understanding my options.",
    sourcePath: "/review/feedback",
  };
}

function createFakeFirestore() {
  const updates: Array<Record<string, unknown>> = [];
  const addedDocs: Array<Record<string, unknown>> = [];
  const ref = {
    id: "feedback_123",
    async update(data: Record<string, unknown>) {
      updates.push(data);
    },
  };

  return {
    db: {
      collection() {
        return {
          async add(doc: Record<string, unknown>) {
            addedDocs.push(doc);
            return ref;
          },
        };
      },
    },
    addedDocs,
    updates,
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
      return { ok: true, id: "feedback_123", crmSyncStatus: "synced" };
    },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    id: "feedback_123",
    crmSyncStatus: "synced",
  });
  assert.equal(addedDocs.length, 1);
  assert.equal(addedDocs[0]?.fullName, "Jane Doe");
  assert.equal(addedDocs[0]?.rating, 3);
  assert.equal(addedDocs[0]?.agentSlug, "kristi-wright");
});

test("review feedback returns success when CRM sync fails after Firestore save", async () => {
  const { CRM_PUBLIC_FORM_SUBMISSION_PATH, CRM_SYNC_STATUS, submitReviewFeedbackWithDeps } =
    await loadReviewFeedbackModules();
  const fakeFirestore = createFakeFirestore();

  const result = await submitReviewFeedbackWithDeps(makeValidPayload(), {
    getFirestoreAdmin: () => fakeFirestore.db as never,
    submitCrmLeadForm: async () => ({
      ok: false,
      path: CRM_PUBLIC_FORM_SUBMISSION_PATH,
      status: 503,
      error: "CRM unavailable.",
    }),
  });

  assert.deepEqual(result, {
    ok: true,
    id: "feedback_123",
    crmSyncStatus: CRM_SYNC_STATUS.failed,
  });
  assert.equal(fakeFirestore.addedDocs.length, 1);
  assert.equal(fakeFirestore.updates.length, 1);
  assert.equal(fakeFirestore.updates[0]?.crmSyncStatus, CRM_SYNC_STATUS.failed);
  assert.equal(fakeFirestore.updates[0]?.crmEndpointPath, CRM_PUBLIC_FORM_SUBMISSION_PATH);
  assert.equal(fakeFirestore.updates[0]?.crmSyncErrorSafe, "CRM unavailable.");
});

test("review feedback document stores the required Firestore fields", async () => {
  const { buildReviewFeedbackDocument, CRM_SYNC_STATUS, SITE_SOURCE } = await loadReviewFeedbackModules();

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
  assert.equal(doc.crmSyncStatus, CRM_SYNC_STATUS.pending);
  assert.equal(doc.crmSyncAttempts, 0);
  assert.equal(doc.crmContactId, null);
  assert.equal(doc.crmEndpointPath, null);
  assert.equal(doc.siteSource, SITE_SOURCE);
  assert.ok(doc.submittedAt);
  assert.ok(doc.createdAt);
});
