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

async function loadLeadModules() {
  mockServerOnlyModule();

  const [{ handleLeadPost }, { CRM_PUBLIC_FORM_SUBMISSION_PATH }, { CRM_SYNC_STATUS }, { submitLeadWithDeps }] =
    await Promise.all([
      import("../app/api/leads/route"),
      import("../lib/crmPaths"),
      import("../lib/leadConstants"),
      import("../lib/leads"),
    ]);

  return { CRM_PUBLIC_FORM_SUBMISSION_PATH, CRM_SYNC_STATUS, handleLeadPost, submitLeadWithDeps };
}

function makeLeadPayload() {
  return {
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
}

function makeLeadRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/leads", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function createFakeFirestore(options: { addError?: Error } = {}) {
  const updates: Array<Record<string, unknown>> = [];
  const addedDocs: Array<Record<string, unknown>> = [];
  const ref = {
    id: "lead_123",
    async update(data: Record<string, unknown>) {
      updates.push(data);
    },
  };

  const emptyQuery = {
    where() {
      return emptyQuery;
    },
    limit() {
      return emptyQuery;
    },
    async get() {
      return { docs: [] as Array<{ id: string; ref: typeof ref; data(): Record<string, unknown> }> };
    },
  };

  const collection = {
    where() {
      return emptyQuery;
    },
    async add(doc: Record<string, unknown>) {
      if (options.addError) throw options.addError;
      addedDocs.push(doc);
      return ref;
    },
  };

  return {
    db: {
      collection() {
        return collection;
      },
    },
    addedDocs,
    ref,
    updates,
  };
}

test("submitLeadWithDeps returns ok true and records failed CRM sync after Firestore save", async () => {
  const { CRM_PUBLIC_FORM_SUBMISSION_PATH, CRM_SYNC_STATUS, submitLeadWithDeps } = await loadLeadModules();
  const fakeFirestore = createFakeFirestore();

  const result = await submitLeadWithDeps(makeLeadPayload(), {
    submitCrmLeadForm: async () => ({
      ok: false,
      error: "Upstream CRM unavailable.",
      path: CRM_PUBLIC_FORM_SUBMISSION_PATH,
      status: 503,
    }),
    getFirestoreAdmin: () => fakeFirestore.db as never,
    now: () => Date.parse("2026-05-01T20:00:00.000Z"),
    useDevFallback: () => false,
  });

  assert.deepEqual(result, {
    ok: true,
    id: "lead_123",
    crmSyncStatus: CRM_SYNC_STATUS.failed,
  });
  assert.equal(fakeFirestore.addedDocs.length, 1);
  assert.equal(fakeFirestore.updates.length, 1);
  assert.equal(fakeFirestore.updates[0]?.crmSyncStatus, CRM_SYNC_STATUS.failed);
  assert.equal(fakeFirestore.updates[0]?.crmSyncErrorSafe, "Upstream CRM unavailable.");
  assert.equal(fakeFirestore.updates[0]?.crmResponseStatus, 503);
  assert.equal(fakeFirestore.updates[0]?.crmEndpointPath, CRM_PUBLIC_FORM_SUBMISSION_PATH);
  assert.equal(fakeFirestore.updates[0]?.crmContactId, null);
  assert.equal(fakeFirestore.updates[0]?.crmSyncedAt, null);
  assert.ok("crmSyncFailedAt" in (fakeFirestore.updates[0] ?? {}));
});

test("submitLeadWithDeps returns ok true and records synced CRM state after Firestore save", async () => {
  const { CRM_PUBLIC_FORM_SUBMISSION_PATH, CRM_SYNC_STATUS, submitLeadWithDeps } = await loadLeadModules();
  const fakeFirestore = createFakeFirestore();

  const result = await submitLeadWithDeps(makeLeadPayload(), {
    submitCrmLeadForm: async () => ({
      ok: true,
      contactId: "crm_456",
      path: CRM_PUBLIC_FORM_SUBMISSION_PATH,
      status: 201,
    }),
    getFirestoreAdmin: () => fakeFirestore.db as never,
    now: () => Date.parse("2026-05-01T20:00:00.000Z"),
    useDevFallback: () => false,
  });

  assert.deepEqual(result, {
    ok: true,
    id: "lead_123",
    crmSyncStatus: CRM_SYNC_STATUS.synced,
  });
  assert.equal(fakeFirestore.addedDocs.length, 1);
  assert.equal(fakeFirestore.updates.length, 1);
  assert.equal(fakeFirestore.updates[0]?.crmSyncStatus, CRM_SYNC_STATUS.synced);
  assert.equal(fakeFirestore.updates[0]?.crmContactId, "crm_456");
  assert.equal(fakeFirestore.updates[0]?.crmSyncErrorSafe, null);
  assert.equal(fakeFirestore.updates[0]?.crmResponseStatus, 201);
  assert.equal(fakeFirestore.updates[0]?.crmEndpointPath, CRM_PUBLIC_FORM_SUBMISSION_PATH);
  assert.ok("crmSyncedAt" in (fakeFirestore.updates[0] ?? {}));
  assert.equal(fakeFirestore.updates[0]?.crmSyncFailedAt, null);
});

test("POST returns 200 with ok true when CRM sync fails after Firestore save", async () => {
  const { CRM_SYNC_STATUS, handleLeadPost } = await loadLeadModules();
  const response = await handleLeadPost(makeLeadRequest(makeLeadPayload()), {
    submitLead: async () => ({
      ok: true,
      id: "lead_123",
      crmSyncStatus: CRM_SYNC_STATUS.failed,
    }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    id: "lead_123",
    crmSyncStatus: CRM_SYNC_STATUS.failed,
  });
});

test("POST returns 400 when request validation fails", async () => {
  const { handleLeadPost } = await loadLeadModules();
  const response = await handleLeadPost(
    makeLeadRequest({
      fullName: "Jane Doe",
      email: "jane@example.com",
      phone: "509-555-0100",
      source: "contact",
    }),
  );

  assert.equal(response.status, 400);
  assert.equal((await response.json()).ok, false);
});

test("POST returns 500 when Firestore save fails", async () => {
  const { handleLeadPost } = await loadLeadModules();
  const response = await handleLeadPost(makeLeadRequest(makeLeadPayload()), {
    submitLead: async () => ({
      ok: false,
      error: "We couldn't submit your request. Please call us at 509-353-0476.",
      errorType: "server",
    }),
  });

  assert.equal(response.status, 500);
  assert.equal((await response.json()).ok, false);
});
