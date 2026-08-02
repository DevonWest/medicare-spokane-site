import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { afterEach, test } from "node:test";
import { fileURLToPath } from "node:url";
import type { DecodedIdToken, UserRecord } from "firebase-admin/auth";
import {
  KnowledgeCmsAdminInputError,
  parseKnowledgeCmsArticleEditorialRolloutForm,
  parseKnowledgeCmsArticleMigrationExecutionForm,
  parseKnowledgeCmsCreateForm,
  parseKnowledgeCmsUpdateForm,
  parseKnowledgeCmsWorkflowForm,
  toKnowledgeCmsAdminRecordDto,
  toKnowledgeCmsAdminRecordSummaryDto,
  validateKnowledgeCmsPublicationDecision,
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
  delete process.env.KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED;
  delete process.env.KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE;
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

test("article migration parsing accepts only the bound control and typed confirmation", () => {
  const form = new FormData();
  form.set(
    "confirmation",
    " CREATE PRIVATE DRAFT turning-65-spokane ",
  );
  form.set("ownerId", "forged-owner");
  form.set("status", "published");
  form.set("payload", JSON.stringify({ indexing: "eligible" }));
  const parsed = parseKnowledgeCmsArticleMigrationExecutionForm(
    "resource-library-article-control--turning-65-spokane",
    "a".repeat(64),
    form,
  );
  assert.deepEqual(parsed, {
    controlId:
      "resource-library-article-control--turning-65-spokane",
    controlFingerprint: "a".repeat(64),
    confirmation: "CREATE PRIVATE DRAFT turning-65-spokane",
  });
  assert.equal("ownerId" in parsed, false);
  assert.equal("status" in parsed, false);
  assert.equal("payload" in parsed, false);

  assert.throws(
    () =>
      parseKnowledgeCmsArticleMigrationExecutionForm(
        "../wrong-control",
        "a".repeat(64),
        form,
      ),
    /selected article migration control is invalid/i,
  );
  assert.throws(
    () =>
      parseKnowledgeCmsArticleMigrationExecutionForm(
        "resource-library-article-control--turning-65-spokane",
        "A".repeat(64),
        form,
      ),
    /selected article migration control is invalid/i,
  );
  form.delete("confirmation");
  assert.throws(
    () =>
      parseKnowledgeCmsArticleMigrationExecutionForm(
        "resource-library-article-control--turning-65-spokane",
        "a".repeat(64),
        form,
      ),
    /confirmation is required/i,
  );
});

test("article rollout form requires a record-specific attestation and audit notes", () => {
  const form = new FormData();
  form.set("expectedRevision", "3");
  form.set("approvalNote", " Verified governed source evidence. ");
  form.set("publicationNote", " Private publication remains blocked. ");
  assert.throws(
    () =>
      parseKnowledgeCmsArticleEditorialRolloutForm(
        "resource-entry--turning-65-spokane",
        form,
      ),
    /review attestation/i,
  );

  form.set("reviewAttestation", "confirmed");
  assert.deepEqual(
    parseKnowledgeCmsArticleEditorialRolloutForm(
      "resource-entry--turning-65-spokane",
      form,
    ),
    {
      id: "resource-entry--turning-65-spokane",
      expectedRevision: 3,
      attested: true,
      approvalNote: "Verified governed source evidence.",
      publicationNote: "Private publication remains blocked.",
    },
  );

  assert.throws(
    () =>
      parseKnowledgeCmsArticleEditorialRolloutForm("../wrong", form),
    /selected governed article is invalid/i,
  );
});

test("workflow form parsing accepts only governed transition fields", () => {
  const submit = new FormData();
  submit.set("expectedRevision", "7");
  submit.set("feedback", "This must not affect a submit action.");
  assert.deepEqual(
    parseKnowledgeCmsWorkflowForm(submit, "submit_for_review"),
    { expectedRevision: 7 },
  );

  const request = new FormData();
  request.set("expectedRevision", "8");
  assert.throws(
    () => parseKnowledgeCmsWorkflowForm(request, "request_changes"),
    /feedback is required/i,
  );
  request.set("feedback", " Clarify which enrollment period applies. ");
  assert.deepEqual(
    parseKnowledgeCmsWorkflowForm(request, "request_changes"),
    {
      expectedRevision: 8,
      decisionNote: "Clarify which enrollment period applies.",
    },
  );
  request.set("feedback", "x".repeat(2_001));
  assert.throws(
    () => parseKnowledgeCmsWorkflowForm(request, "request_changes"),
    /feedback is too long/i,
  );

  const approve = new FormData();
  approve.set("expectedRevision", "9");
  approve.set("reviewerVerificationId", "forged-verification");
  approve.set("reviewDueAt", "2099-12-31");
  assert.throws(
    () => parseKnowledgeCmsWorkflowForm(approve, "approve"),
    /approvalNote is required/i,
  );
  approve.set(
    "approvalNote",
    " Official enrollment timing and source dates verified. ",
  );
  assert.deepEqual(parseKnowledgeCmsWorkflowForm(approve, "approve"), {
    expectedRevision: 9,
    decisionNote: "Official enrollment timing and source dates verified.",
  });

  const publish = new FormData();
  publish.set("expectedRevision", "10");
  publish.set("publishedBy", "forged-publisher");
  publish.set("publishedAt", "2099-12-31T00:00:00.000Z");
  assert.throws(
    () => parseKnowledgeCmsWorkflowForm(publish, "publish"),
    /indexing is required/i,
  );
  publish.set("indexing", "public");
  assert.throws(
    () => parseKnowledgeCmsWorkflowForm(publish, "publish"),
    /indexing must be blocked or eligible/i,
  );
  publish.set("indexing", "blocked");
  assert.throws(
    () => parseKnowledgeCmsWorkflowForm(publish, "publish"),
    /publicationNote is required/i,
  );
  publish.set("publicationNote", " Publish after checking the approved record. ");
  assert.deepEqual(parseKnowledgeCmsWorkflowForm(publish, "publish"), {
    expectedRevision: 10,
    indexing: "blocked",
    decisionNote: "Publish after checking the approved record.",
  });
  publish.set("indexing", "eligible");
  assert.throws(
    () => parseKnowledgeCmsWorkflowForm(publish, "publish"),
    /canonicalPathConfirmation is required/i,
  );
  publish.set(
    "canonicalPathConfirmation",
    "/resources/medicare-enrollment-in-spokane",
  );
  assert.deepEqual(parseKnowledgeCmsWorkflowForm(publish, "publish"), {
    expectedRevision: 10,
    indexing: "eligible",
    canonicalPathConfirmation:
      "/resources/medicare-enrollment-in-spokane",
    decisionNote: "Publish after checking the approved record.",
  });

  const unpublish = new FormData();
  unpublish.set("expectedRevision", "11");
  assert.throws(
    () => parseKnowledgeCmsWorkflowForm(unpublish, "unpublish"),
    /unpublishReason is required/i,
  );
  unpublish.set("unpublishReason", " Source requires rechecking. ");
  assert.deepEqual(parseKnowledgeCmsWorkflowForm(unpublish, "unpublish"), {
    expectedRevision: 11,
    decisionNote: "Source requires rechecking.",
  });
});

test("publication decisions require exact canonical confirmation only for eligibility", () => {
  const record = articleRecord({
    discoverability: {
      indexing: "blocked",
      canonicalPath: "/resources/medicare-enrollment-in-spokane",
    },
  });
  assert.deepEqual(
    validateKnowledgeCmsPublicationDecision(record, {
      indexing: "blocked",
    }),
    [],
  );
  assert.match(
    validateKnowledgeCmsPublicationDecision(record, {
      indexing: "eligible",
      canonicalPathConfirmation: "/resources/wrong",
    })[0] ?? "",
    /exactly match/i,
  );
  assert.deepEqual(
    validateKnowledgeCmsPublicationDecision(record, {
      indexing: "eligible",
      canonicalPathConfirmation:
        "/resources/medicare-enrollment-in-spokane",
    }),
    [],
  );
  assert.match(
    validateKnowledgeCmsPublicationDecision(
      articleRecord(),
      {
        indexing: "eligible",
        canonicalPathConfirmation:
          "/resources/medicare-enrollment-in-spokane",
      },
    )[0] ?? "",
    /approved canonical path/i,
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
  assert.deepEqual(detail.workflowActions, {
    approve: false,
    publish: false,
    submitForReview: true,
    requestChanges: false,
    unpublish: false,
  });

  const readOnly = toKnowledgeCmsAdminRecordDto(
    articleRecord({ status: "in_review" }),
    author,
  );
  assert.equal(readOnly.editable, false);

  const reviewer: KnowledgeCmsActor = {
    id: "reviewer-user",
    roles: ["reviewer"],
    agentSlug: "lynn-wold",
  };
  const requested = toKnowledgeCmsAdminRecordDto(
    articleRecord({
      status: "draft",
      changeRequest: {
        requestedByAgentSlug: "lynn-wold",
        reviewerVerificationId: "wa-license-check-1",
        requestedAt: NOW.toISOString(),
        feedback: "Clarify the enrollment example.",
      },
    }),
    author,
  );
  assert.deepEqual(requested.changeRequest, {
    requestedAt: NOW.toISOString(),
    feedback: "Clarify the enrollment example.",
  });
  assert.equal(
    "reviewerVerificationId" in requested.changeRequest!,
    false,
  );
  assert.deepEqual(
    toKnowledgeCmsAdminRecordDto(
      articleRecord({ status: "in_review" }),
      reviewer,
      { reviewerVerified: true },
    ).workflowActions,
    {
      approve: true,
      publish: false,
      submitForReview: false,
      requestChanges: true,
      unpublish: false,
    },
  );

  const approvedRecord = articleRecord({
    status: "approved",
    review: {
      reviewerAgentSlug: "lynn-wold",
      reviewerVerificationId: "wa-license-check-1",
      reviewedBy: "reviewer-user",
      reviewedAt: NOW.toISOString(),
      reviewDueAt: "2027-07-30",
      decisionNote: "Official source evidence verified.",
    },
  });
  const publisher: KnowledgeCmsActor = {
    id: "publisher-user",
    roles: ["publisher"],
  };
  const publishable = toKnowledgeCmsAdminRecordDto(
    approvedRecord,
    publisher,
  );
  assert.deepEqual(publishable.review, {
    reviewerAgentSlug: "lynn-wold",
    reviewedAt: NOW.toISOString(),
    reviewDueAt: "2027-07-30",
    decisionNote: "Official source evidence verified.",
  });
  assert.equal("reviewerVerificationId" in publishable.review!, false);
  assert.equal("reviewedBy" in publishable.review!, false);
  assert.equal(publishable.workflowActions.publish, true);
  assert.equal(
    toKnowledgeCmsAdminRecordDto(approvedRecord, {
      id: "reviewer-user",
      roles: ["reviewer", "publisher"],
      agentSlug: "lynn-wold",
    }).workflowActions.publish,
    true,
  );

  const published = toKnowledgeCmsAdminRecordDto(
    articleRecord({
      ...approvedRecord,
      status: "published",
      publication: {
        publishedAt: NOW.toISOString(),
        publishedBy: "publisher-user",
      },
      discoverability: {
        indexing: "blocked",
      },
    }),
    publisher,
  );
  assert.equal("publication" in published, false);
  assert.equal(published.workflowActions.unpublish, true);

  const workingRevision = toKnowledgeCmsAdminRecordDto(
    articleRecord({
      audit: {
        revision: 6,
        createdAt: NOW.toISOString(),
        createdBy: "author-user",
        updatedAt: NOW.toISOString(),
        updatedBy: "publisher-user",
      },
      workingRevision: {
        sourceRevision: 5,
        sourcePublishedAt: NOW.toISOString(),
        sourcePublishedBy: "publisher-user",
        sourceAiRunId: "4f59f915-58ca-4d35-9b3f-d7d28c589723",
        startedAt: NOW.toISOString(),
        startedBy: "publisher-user",
      },
    }),
    publisher,
  );
  assert.deepEqual(workingRevision.workingRevision, {
    sourceRevision: 5,
    sourcePublishedAt: NOW.toISOString(),
    startedAt: NOW.toISOString(),
  });
  assert.doesNotMatch(
    JSON.stringify(workingRevision),
    /sourceAiRunId|sourcePublishedBy|startedBy/,
  );
});

test("admin routes remain default-off and publication stays private and server-authorized", () => {
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
    "app/admin/knowledge/article-review-queue/page.tsx",
    "app/admin/knowledge/migration-preview/page.tsx",
    "app/admin/knowledge/migration-preview/[recordId]/page.tsx",
    "app/admin/knowledge/readiness/page.tsx",
    "app/admin/knowledge/public-cutover/page.tsx",
  ].map((path) => readFileSync(join(root, path), "utf8"));
  const dataAccess = readFileSync(
    join(root, "lib/knowledgeCmsAdminDal.ts"),
    "utf8",
  );
  const migrationDataAccess = readFileSync(
    join(root, "lib/knowledgeCmsMigrationDal.ts"),
    "utf8",
  );
  const readinessDataAccess = readFileSync(
    join(root, "lib/knowledgeCmsOperationalReadinessDal.ts"),
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
  assert.match(actions, /submitKnowledgeCmsForReviewAction/);
  assert.match(actions, /requestKnowledgeCmsChangesAction/);
  assert.match(actions, /approveKnowledgeCmsRecordAction/);
  assert.match(actions, /publishKnowledgeCmsRecordAction/);
  assert.match(actions, /publishNextGovernedKnowledgeCmsArticleAction/);
  assert.match(actions, /unpublishKnowledgeCmsRecordAction/);
  assert.match(actions, /createKnowledgeCmsArticleMigrationDraftAction/);
  assert.match(dataAccess, /resolveCurrentEditorialReviewerVerification/);
  assert.match(dataAccess, /resolveKnowledgeCmsApprovalDueAt/);
  assert.match(dataAccess, /validateKnowledgeCmsPublicationDecision/);
  assert.match(dataAccess, /requireKnowledgeCmsActor/);
  assert.match(migrationDataAccess, /requireKnowledgeCmsActor/);
  assert.match(
    migrationDataAccess,
    /createArticleMigrationDraft\(actor, request\)/,
  );
  assert.match(
    migrationDataAccess,
    /verifyArticleMigrationExecution\(actor, recordId\)/,
  );
  assert.match(readinessDataAccess, /requireKnowledgeCmsActor/);
  assert.match(readinessDataAccess, /scanKnowledgeCmsRoleDirectory/);
  assert.match(readinessDataAccess, /verifyArticleMigrationExecution/);
  assert.doesNotMatch(readinessDataAccess, /createArticleMigrationDraft/);
  assert.match(nextConfig, /\/admin\/knowledge\/:path\*/);
  assert.match(nextConfig, /X-Robots-Tag/);
  assert.match(deployWorkflow, /KNOWLEDGE_CMS_ENABLED must be exactly true or false/);
  assert.match(
    deployWorkflow,
    /KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE must be exactly static, shadow, or cutover/,
  );
  assert.match(
    deployWorkflow,
    /Public cutover approval receipt must be exactly 64 lowercase hex characters/,
  );
  assert.match(
    deployWorkflow,
    /Deploy production cutover candidate with no traffic/,
  );
  assert.match(
    deployWorkflow,
    /KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE=\$\{\{ env\.KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE \}\}/,
  );
  assert.match(
    deployWorkflow,
    /KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED must be exactly true or false/,
  );
  assert.match(
    deployWorkflow,
    /KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED requires KNOWLEDGE_CMS_ENABLED=true/,
  );
  assert.match(
    deployWorkflow,
    /KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED=\$\{\{ env\.KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED \}\}/,
  );
  assert.match(deployWorkflow, /NEXT_PUBLIC_FIREBASE_API_KEY is required/);
  assert.match(dockerfile, /ARG NEXT_PUBLIC_FIREBASE_API_KEY/);
  assert.match(dockerfile, /ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN/);
  assert.doesNotMatch(sitemap, /admin\/knowledge/);
});
