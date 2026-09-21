import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import { applicationDefault, deleteApp, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const require = createRequire(import.meta.url);
const APP_NAME = "medicareinspokane-admin";

function loadFreshAdminModule(): typeof import("../lib/firebase-admin") {
  const serverOnlyPath = require.resolve("server-only");
  require.cache[serverOnlyPath] = {
    exports: {},
    filename: serverOnlyPath,
    id: serverOnlyPath,
    loaded: true,
  } as never;

  // Next.js route bundles can evaluate this module independently while the
  // Firebase Admin SDK continues to share the same named app and client.
  const adminPath = require.resolve("../lib/firebase-admin");
  delete require.cache[adminPath];
  return require(adminPath);
}

function createTestApp() {
  // Client construction/settings do not perform database or credential I/O.
  return initializeApp(
    { projectId: "demo-firestore-initialization", credential: applicationDefault() },
    APP_NAME,
  );
}

test("independent CMS and lead modules reuse the configured Firestore client", async () => {
  const app = createTestApp();
  try {
    const cmsModule = loadFreshAdminModule();
    const cmsDb = cmsModule.getFirestoreAdmin();
    const leadModule = loadFreshAdminModule();

    assert.notEqual(cmsModule, leadModule);
    assert.equal(leadModule.getFirestoreAdmin(), cmsDb);
    assert.equal(cmsModule.getFirestoreAdmin(), cmsDb);
    assert.equal(getFirestore(app), cmsDb);
  } finally {
    await deleteApp(app);
  }
});

test("a failed settings call is not cached as a successfully configured client", async (t) => {
  const app = createTestApp();
  try {
    const db = getFirestore(app);
    const settings = db.settings.bind(db);
    let calls = 0;
    t.mock.method(db, "settings", (options: Parameters<typeof db.settings>[0]) => {
      calls += 1;
      if (calls === 1) throw new Error("Synthetic initialization failure");
      return settings(options);
    });
    const adminModule = loadFreshAdminModule();

    assert.throws(() => adminModule.getFirestoreAdmin(), /Synthetic initialization failure/);
    assert.equal(adminModule.getFirestoreAdmin(), db);
    assert.equal(calls, 2);
    assert.equal(adminModule.getFirestoreAdmin(), db);
    assert.equal(calls, 2);
  } finally {
    await deleteApp(app);
  }
});

test("recreating the named app does not reuse its old Firestore client", async () => {
  const firstApp = createTestApp();
  const adminModule = loadFreshAdminModule();
  let firstDb;
  try {
    firstDb = adminModule.getFirestoreAdmin();
  } finally {
    await deleteApp(firstApp);
  }

  const replacementApp = createTestApp();
  try {
    const replacementDb = adminModule.getFirestoreAdmin();
    assert.notEqual(replacementDb, firstDb);
    assert.equal(replacementDb, getFirestore(replacementApp));
  } finally {
    await deleteApp(replacementApp);
  }
});
