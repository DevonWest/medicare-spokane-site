import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { afterEach, test } from "node:test";
import { fileURLToPath } from "node:url";
import type { DecodedIdToken, UserRecord } from "firebase-admin/auth";
import {
  KnowledgeCmsAdminInputError,
  parseKnowledgeCmsCreateForm,
  parseKnowledgeCmsUpdateForm,
  toKnowledgeCmsAdminRecordDto,
  toKnowledgeCmsAdminRecordSummaryDto,
} from "../lib/knowledgeCmsAdmin";
import type {
  KnowledgeCmsActor,
  KnowledgeCmsArticle,
} from "../lib/knowledgeCms";
import type { KnowledgeCmsAuthProvider } from "../lib/knowledgeCmsAdminAuth";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const NOW = new Date("2026-07-30T22:00:00.000Z");

function mockServerOnlyModule() {
  const serverOnlyPath = require.resolve("server-only");
  require.cache[serverOnlyPath] = {
    exports: {},
    filename: serverOnlyPath,
    id: serverOnlyPath,
    loaded: true,
  } as never;
}

async function loadAuthModule() {
  mockServerOnlyModule();
  return import("../lib/knowledgeCmsAdminAuth");
}

function decodedToken(
  uid = "editor-user",
  authTime = Math.floor(NOW.getTime() / 1_000) - 30,
): DecodedIdToken {
  return {
    aud: "firebase-project",
    auth_time: authTime,
    exp: Math.floor(NOW.getTime() / 1_000) + 3_600,
    firebase: {
      identities: {},
      sign_in_provider: "google.com",
    },
    iat: Math.floor(NOW.getTime() / 1_000) - 30,
    iss: "https://securetoken.google.com/firebase-project",
    sub: uid,
    uid,
  };
}

function userRecord(
  overrides: Partial<UserRecord> = {},
): UserRecord {
  return {
    uid: "editor-user",
    emailVerified: true,
    disabled: false,
    customClaims: {
      knowledgeCmsRoles: ["editor"],
    },
    ...overrides,
  } as UserRecord;
}

function authProvider(
  overrides: Partial<KnowledgeCmsAuthProvider> = {},
): KnowledgeCmsAuthProvider {
  return {
    verifyIdToken: async () => decodedToken(),
    createSessionCookie: async () => "signed-session-cookie",
    verifySessionCookie: async () => decodedToken(),
    getUser: async () => userRecord(),
    ...overrides,
  };
}

function articleRecord(
  overrides: Partial<KnowledgeCmsArticle> = {},
): KnowledgeCmsArticle {
  return {
    schemaVersion: 1,
    id: "article-1",
    kind: "article",
    slug: "spokane-medicare-enrollment",
    status: "draft",
    ownerId: "author-user",
    title: "Spokane Medicare enrollment",
    summary: "A governed draft summary.",
    body: "A governed draft body.",
    bodyFormat: "markdown",
    searchTerms: ["medicare enrollment"],
    relationships: {
      articleIds: [],
      topicIds: [],
      faqIds: [],
      citySlugs: ["spokane"],
      agentSlugs: [],
      carrierNames: [],
      existingPaths: ["/medicare-spokane"],
    },
    sources: [],
    discoverability: {
      indexing: "blocked",
    },
    audit: {
      revision: 1,
      createdAt: NOW.toISOString(),
      createdBy: "author-user",
      updatedAt: NOW.toISOString(),
      updatedBy: "author-user",
    },
    ...overrides,
  };
}

afterEach(() => {
  delete process.env.KNOWLEDGE_CMS_ENABLED;
  delete process.env.NEXT_PUBLIC_SITE_URL;
});

test("server-authoritative Firebase claims resolve the CMS actor", async () => {
  const { resolveKnowledgeCmsActor } = await loadAuthModule();
  const actor = resolveKnowledgeCmsActor({
    uid: "devon-user",
    emailVerified: true,
    disabled: false,
    customClaims: {
      knowledgeCmsRoles: ["admin", "editor", "admin"],
      knowledgeCmsAgentSlug: "devon-west",
    },
  });

  assert.deepEqual(actor, {
    id: "devon-user",
    roles: ["admin", "editor"],
    agentSlug: "devon-west",
  });
});

test("unverified, disabled, and unassigned users are denied", async () => {
  const {
    KnowledgeCmsAuthenticationError,
    resolveKnowledgeCmsActor,
  } = await loadAuthModule();

  assert.throws(
    () =>
      resolveKnowledgeCmsActor({
        uid: "user-1",
        emailVerified: false,
        disabled: false,
        customClaims: { knowledgeCmsRoles: ["editor"] },
      }),
    (error) =>
      error instanceof KnowledgeCmsAuthenticationError &&
      error.reason === "verified_email_required",
  );
  assert.throws(
    () =>
      resolveKnowledgeCmsActor({
        uid: "user-1",
        emailVerified: true,
        disabled: true,
        customClaims: { knowledgeCmsRoles: ["editor"] },
      }),
    (error) =>
      error instanceof KnowledgeCmsAuthenticationError &&
      error.reason === "account_disabled",
  );
  assert.throws(
    () =>
      resolveKnowledgeCmsActor({
        uid: "user-1",
        emailVerified: true,
        disabled: false,
        customClaims: { knowledgeCmsRoles: ["superuser"] },
      }),
    (error) =>
      error instanceof KnowledgeCmsAuthenticationError &&
      error.reason === "cms_role_required",
  );
});

test("session exchange requires a recent sign-in and current user claims", async () => {
  process.env.KNOWLEDGE_CMS_ENABLED = "true";
  const { createKnowledgeCmsSession } = await loadAuthModule();
  let expiresIn = 0;
  const result = await createKnowledgeCmsSession("id-token", {
    now: () => NOW,
    auth: authProvider({
      verifyIdToken: async () => decodedToken("editor-user"),
      getUser: async () =>
        userRecord({
          customClaims: { knowledgeCmsRoles: ["author", "editor"] },
        }),
      createSessionCookie: async (_token, options) => {
        expiresIn = options.expiresIn;
        return "session-cookie";
      },
    }),
  });

  assert.deepEqual(result, {
    actor: {
      id: "editor-user",
      roles: ["author", "editor"],
    },
    sessionCookie: "session-cookie",
  });
  assert.equal(expiresIn, 8 * 60 * 60 * 1_000);

  await assert.rejects(
    createKnowledgeCmsSession("stale-token", {
      now: () => NOW,
      auth: authProvider({
        verifyIdToken: async () =>
          decodedToken(
            "editor-user",
            Math.floor(NOW.getTime() / 1_000) - 301,
          ),
      }),
    }),
    /authentication failed/i,
  );
});

test("session verification refreshes roles from the current Firebase user", async () => {
  process.env.KNOWLEDGE_CMS_ENABLED = "true";
  const { verifyKnowledgeCmsSession } = await loadAuthModule();
  const actor = await verifyKnowledgeCmsSession(
    "session-cookie",
    authProvider({
      verifySessionCookie: async () => decodedToken("editor-user"),
      getUser: async () =>
        userRecord({
          customClaims: { knowledgeCmsRoles: ["publisher"] },
        }),
    }),
  );

  assert.deepEqual(actor.roles, ["publisher"]);
});

test("session cookies and session endpoints use strict request boundaries", async () => {
  const {
    getKnowledgeCmsSessionCookieOptions,
    isSameOriginKnowledgeCmsRequest,
  } = await loadAuthModule();

  assert.deepEqual(getKnowledgeCmsSessionCookieOptions(true), {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/admin/knowledge",
    maxAge: 28_800,
    priority: "high",
  });
  assert.equal(
    isSameOriginKnowledgeCmsRequest(
      new Request("https://www.medicareinspokane.com/admin/knowledge/auth/session", {
        headers: { origin: "https://www.medicareinspokane.com" },
      }),
    ),
    true,
  );
  assert.equal(
    isSameOriginKnowledgeCmsRequest(
      new Request("https://internal.run.app/admin/knowledge/auth/session", {
        headers: {
          host: "www.medicareinspokane.com",
          origin: "https://www.medicareinspokane.com",
          "x-forwarded-proto": "https",
        },
      }),
    ),
    true,
  );
  assert.equal(
    isSameOriginKnowledgeCmsRequest(
      new Request("https://internal.run.app/admin/knowledge/auth/session", {
        headers: {
          host: "internal.run.app",
          origin: "https://attacker.example",
          "x-forwarded-host": "attacker.example",
          "x-forwarded-proto": "https",
        },
      }),
    ),
    false,
  );
  assert.equal(
    isSameOriginKnowledgeCmsRequest(
      new Request("https://www.medicareinspokane.com/admin/knowledge/auth/session", {
        headers: { origin: "https://attacker.example" },
      }),
    ),
    false,
  );
});

test("session route is hidden while disabled and rejects cross-origin requests", async () => {
  mockServerOnlyModule();
  const { POST } = await import(
    "../app/admin/knowledge/auth/session/route"
  );
  process.env.KNOWLEDGE_CMS_ENABLED = "false";
  const disabled = await POST(
    new Request(
      "https://www.medicareinspokane.com/admin/knowledge/auth/session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          origin: "https://www.medicareinspokane.com",
        },
        body: JSON.stringify({ idToken: "x".repeat(200) }),
      },
    ),
  );
  assert.equal(disabled.status, 404);

  process.env.KNOWLEDGE_CMS_ENABLED = "true";
  const crossOrigin = await POST(
    new Request(
      "https://www.medicareinspokane.com/admin/knowledge/auth/session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          origin: "https://attacker.example",
        },
        body: JSON.stringify({ idToken: "x".repeat(200) }),
      },
    ),
  );
  assert.equal(crossOrigin.status, 403);
});

test("admin form parsing normalizes content and ignores forged identity fields", () => {
  const form = new FormData();
  form.set("kind", "article");
  form.set("title", " Spokane Medicare enrollment ");
  form.set("summary", " Summary ");
  form.set("body", " Body ");
  form.set("searchTerms", "Medicare\nSpokane,Medicare");
  form.set("citySlugs", "spokane\nspokane-valley");
  form.set("existingPaths", "/medicare-spokane");
  form.set("ownerId", "attacker");
  form.set("roles", "admin");
  form.set("status", "published");
  form.set(
    "sources",
    JSON.stringify([
      {
        id: "medicare-basics",
        kind: "official",
        title: "Medicare basics",
        publisher: "Medicare.gov",
        url: "https://www.medicare.gov/basics/get-started-with-medicare",
        checkedAt: "2026-07-30",
        reviewDueAt: "2026-12-30",
      },
    ]),
  );

  const input = parseKnowledgeCmsCreateForm(form);
  assert.equal(input.kind, "article");
  assert.equal(input.title, "Spokane Medicare enrollment");
  assert.deepEqual(input.searchTerms, ["Medicare", "Spokane"]);
  assert.deepEqual(input.relationships?.citySlugs, [
    "spokane",
    "spokane-valley",
  ]);
  assert.equal("ownerId" in input, false);
  assert.equal("roles" in input, false);
  assert.equal("status" in input, false);
  assert.equal(input.sources?.[0]?.publisher, "Medicare.gov");
});

test("update parsing rejects kind changes and stale revision input", () => {
  const form = new FormData();
  form.set("kind", "topic");
  form.set("title", "Enrollment");
  form.set("topicDescription", "Enrollment topic.");
  form.set("order", "0");
  form.set("expectedRevision", "one");

  assert.throws(
    () => parseKnowledgeCmsUpdateForm(form, "article"),
    KnowledgeCmsAdminInputError,
  );

  form.set("kind", "article");
  form.set("summary", "Summary");
  form.set("body", "Body");
  assert.throws(
    () => parseKnowledgeCmsUpdateForm(form, "article"),
    /expectedRevision is invalid/i,
  );
});

test("admin DTOs omit ownership and audit internals while preserving access decisions", () => {
  const author: KnowledgeCmsActor = {
    id: "author-user",
    roles: ["author"],
  };
  const record = articleRecord();
  const summary = toKnowledgeCmsAdminRecordSummaryDto(record, author);
  const detail = toKnowledgeCmsAdminRecordDto(record, author);

  assert.equal(summary.editable, true);
  assert.equal(summary.ownedByCurrentUser, true);
  assert.equal(detail.editable, true);
  assert.equal("ownerId" in detail, false);
  assert.equal("audit" in detail, false);
  assert.equal("review" in detail, false);
  assert.equal("publication" in detail, false);
  assert.equal(detail.revision, 1);

  const readOnly = toKnowledgeCmsAdminRecordDto(
    articleRecord({ status: "in_review" }),
    author,
  );
  assert.equal(readOnly.editable, false);
});

test("admin routes remain default-off, noindex, and draft-only", () => {
  const layout = readFileSync(
    join(root, "app/admin/knowledge/layout.tsx"),
    "utf8",
  );
  const actions = readFileSync(
    join(root, "app/admin/knowledge/actions.ts"),
    "utf8",
  );
  const routePages = [
    "app/admin/knowledge/page.tsx",
    "app/admin/knowledge/login/page.tsx",
    "app/admin/knowledge/new/page.tsx",
    "app/admin/knowledge/[kind]/[id]/page.tsx",
  ].map((path) => readFileSync(join(root, path), "utf8"));
  const dataAccess = readFileSync(
    join(root, "lib/knowledgeCmsAdminDal.ts"),
    "utf8",
  );
  const nextConfig = readFileSync(join(root, "next.config.ts"), "utf8");
  const deployWorkflow = readFileSync(
    join(root, ".github/workflows/deploy.yml"),
    "utf8",
  );
  const dockerfile = readFileSync(join(root, "Dockerfile"), "utf8");
  const sitemap = readFileSync(join(root, "app/sitemap.ts"), "utf8");

  assert.match(layout, /isKnowledgeCmsEnabled/);
  assert.match(layout, /notFound/);
  assert.match(layout, /index:\s*false/);
  for (const page of routePages) {
    assert.match(page, /isKnowledgeCmsEnabled/);
    assert.match(page, /notFound/);
  }
  assert.match(dataAccess, /requireKnowledgeCmsActor/);
  assert.doesNotMatch(actions, /\.transition\(/);
  assert.doesNotMatch(actions, /publishKnowledge/i);
  assert.match(nextConfig, /\/admin\/knowledge\/:path\*/);
  assert.match(nextConfig, /X-Robots-Tag/);
  assert.match(deployWorkflow, /KNOWLEDGE_CMS_ENABLED must be exactly true or false/);
  assert.match(deployWorkflow, /NEXT_PUBLIC_FIREBASE_API_KEY is required/);
  assert.match(dockerfile, /ARG NEXT_PUBLIC_FIREBASE_API_KEY/);
  assert.match(dockerfile, /ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN/);
  assert.doesNotMatch(sitemap, /admin\/knowledge/);
});
