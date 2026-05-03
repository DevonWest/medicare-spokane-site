// Lightweight tests for pure lead helpers. Run with: `npm test`.
//
// Uses Node's built-in `node:test` runner via `tsx --test` so we don't
// need to add any additional dev dependencies.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildCrmFormSubmissionPayload,
  extractCrmContactId,
  joinCrmUrl,
} from "../lib/crmPayload";
import { CRM_PUBLIC_FORM_SUBMISSION_PATH } from "../lib/crmPaths";
import { buildLeadFirestoreDocument } from "../lib/leadFirestore";
import { buildLeadFormFields, buildLeadRequestPayload } from "../lib/leadPayload";
import * as leadValidation from "../lib/leadValidation";

function assertNoUndefinedDeep(value: unknown, path = "root") {
  assert.notEqual(value, undefined, `Unexpected undefined at ${path}`);

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoUndefinedDeep(item, `${path}[${index}]`));
    return;
  }

  if (value && Object.prototype.toString.call(value) === "[object Object]") {
    for (const [key, nested] of Object.entries(value)) {
      assertNoUndefinedDeep(nested, `${path}.${key}`);
    }
  }
}

test("DUPLICATE_WINDOW_MS equals 10 minutes in ms", () => {
  assert.equal(leadValidation.DUPLICATE_WINDOW_MS, 10 * 60 * 1000);
});

test("normalizeEmail lowercases and trims", () => {
  assert.equal(leadValidation.normalizeEmail("  Foo@Bar.COM "), "foo@bar.com");
  assert.equal(leadValidation.normalizeEmail(undefined), "");
});

test("normalizePhone keeps only digits", () => {
  assert.equal(leadValidation.normalizePhone("(509) 555-0100"), "5095550100");
  assert.equal(leadValidation.normalizePhone(" +1 509.555.0100 "), "15095550100");
  assert.equal(leadValidation.normalizePhone(undefined), "");
});

test("cleanString returns undefined for empty/whitespace", () => {
  assert.equal(leadValidation.cleanString("  "), undefined);
  assert.equal(leadValidation.cleanString("hi "), "hi");
  assert.equal(leadValidation.cleanString(null), undefined);
});

test("validateLead accepts a valid payload without ZIP", () => {
  const r = leadValidation.validateLead({
    fullName: "Jane Doe",
    email: "jane@example.com",
    phone: "509-555-0100",
  });
  assert.equal(r.ok, true);
  assert.deepEqual(r.errors, {});
});

test("validateLead accepts a valid payload without message", () => {
  const r = leadValidation.validateLead({
    fullName: "Jane Doe",
    email: "jane@example.com",
    phone: "509-555-0100",
    zip: "99206",
  });
  assert.equal(r.ok, true);
  assert.equal(r.errors.message, undefined);
});

test("validateLead accepts a valid payload with ZIP", () => {
  const r = leadValidation.validateLead({
    fullName: "Jane Doe",
    email: "jane@example.com",
    phone: "509-555-0100",
    zip: "99206",
  });
  assert.equal(r.ok, true);
  assert.deepEqual(r.errors, {});
});

test("validateLead rejects missing name", () => {
  const r = leadValidation.validateLead({
    fullName: "",
    email: "jane@example.com",
    phone: "5095550100",
    zip: "99206",
  });
  assert.equal(r.ok, false);
  assert.ok(r.errors.fullName);
});

test("validateLead accepts a lead with only email", () => {
  const r = leadValidation.validateLead({
    fullName: "Jane Doe",
    email: "jane@example.com",
    phone: "",
    zip: "99206",
  });
  assert.equal(r.ok, true);
  assert.deepEqual(r.errors, {});
});

test("validateLead accepts a lead with only phone", () => {
  const r = leadValidation.validateLead({
    fullName: "Jane Doe",
    email: "",
    phone: "5095550100",
    zip: "99206",
  });
  assert.equal(r.ok, true);
  assert.deepEqual(r.errors, {});
});

test("validateLead rejects missing email and phone", () => {
  const r = leadValidation.validateLead({
    fullName: "Jane Doe",
    email: "",
    phone: "",
    zip: "99206",
  });
  assert.equal(r.ok, false);
  assert.equal(r.errors.email, "Provide an email address or phone number.");
  assert.equal(r.errors.phone, "Provide a phone number or email address.");
});

test("validateLead accepts a blank ZIP", () => {
  const r = leadValidation.validateLead({
    fullName: "Jane Doe",
    email: "jane@example.com",
    phone: "5095550100",
    zip: "",
  });
  assert.equal(r.ok, true);
  assert.equal(r.errors.zip, undefined);
});

test("validateLead rejects bad email and short phone", () => {
  const r = leadValidation.validateLead({
    fullName: "A",
    email: "not-an-email",
    phone: "12345",
    zip: "99206",
  });
  assert.equal(r.ok, false);
  assert.ok(r.errors.fullName);
  assert.ok(r.errors.email);
  assert.ok(r.errors.phone);
});

test("validateLead rejects an invalid ZIP only when provided", () => {
  const r = leadValidation.validateLead({
    fullName: "Jane Doe",
    email: "jane@example.com",
    phone: "5095550100",
    zip: "abc",
  });
  assert.equal(r.ok, false);
  assert.equal(r.errors.zip, "ZIP code must be 5 digits.");
});

test("validateLead rejects too-long message", () => {
  const r = leadValidation.validateLead({
    fullName: "Jane Doe",
    email: "jane@example.com",
    phone: "5095550100",
    message: "x".repeat(2001),
  });
  assert.equal(r.ok, false);
  assert.ok(r.errors.message);
});

test("normalizePhone normalizes common phone formats", () => {
  assert.equal(leadValidation.normalizePhone("5095550100"), "5095550100");
  assert.equal(leadValidation.normalizePhone("509-555-0100"), "5095550100");
  assert.equal(leadValidation.normalizePhone("(509) 555-0100"), "5095550100");
  assert.equal(leadValidation.normalizePhone("+1 509.555.0100"), "15095550100");
});

test("validateLead accepts common phone formats", () => {
  for (const phone of ["5095550100", "509-555-0100", "(509) 555-0100", "+1 509.555.0100"]) {
    const r = leadValidation.validateLead({
      fullName: "Jane Doe",
      email: "jane@example.com",
      phone,
    });
    assert.equal(r.ok, true, phone);
  }
});

test("validateLeadRequest accepts a complete lead payload without ZIP", () => {
  const r = leadValidation.validateLeadRequest({
    fullName: "Jane Doe",
    email: "jane@example.com",
    phone: "509-555-0100",
    message: "Please call me.",
    sourcePath: "/contact",
    clientSubmittedAt: "2026-05-01T03:18:00.000Z",
  });
  assert.equal(r.ok, true);
});

test("validateLeadRequest accepts a complete lead payload without referrer", () => {
  const payload = buildLeadRequestPayload({
    fields: {
      fullName: "Jane Doe",
      email: "jane@example.com",
      phone: "509-555-0100",
      zip: undefined,
      message: undefined,
    },
    source: "contact",
    sourcePath: "/contact",
    clientSubmittedAt: "2026-05-01T03:18:00.000Z",
  });

  assert.equal("referrer" in payload, true);
  assert.equal(payload.referrer, undefined);
  assert.equal(leadValidation.validateLeadRequest(payload).ok, true);
});

test("validateLeadRequest accepts a complete lead payload with ZIP", () => {
  const r = leadValidation.validateLeadRequest({
    fullName: "Jane Doe",
    email: "jane@example.com",
    phone: "509-555-0100",
    zip: "99206",
    message: "Please call me.",
    sourcePath: "/contact",
    clientSubmittedAt: "2026-05-01T03:18:00.000Z",
  });
  assert.equal(r.ok, true);
});

test("frontend payload shape matches backend expected shape", () => {
  const formData = new FormData();
  formData.set("fullName", "Jane Doe");
  formData.set("email", "jane@example.com");
  formData.set("phone", "(509) 555-0100");
  formData.set("zip", "99206");
  formData.set("message", "Please call me.");

  const fields = buildLeadFormFields(formData, true);
  const payload = buildLeadRequestPayload({
    fields,
    source: "contact",
    sourcePath: "/contact",
    referrer: "https://example.com/",
    utm: { source: "google", medium: "cpc" },
    clientSubmittedAt: "2026-05-01T03:18:00.000Z",
  });

  assert.deepEqual(Object.keys(payload).sort(), [
    "clientSubmittedAt",
    "email",
    "fullName",
    "message",
    "phone",
    "referrer",
    "source",
    "sourcePath",
    "utm",
    "zip",
  ]);
  assert.equal(leadValidation.validateLeadRequest(payload).ok, true);
});

test("buildLeadFirestoreDocument strips undefined fields and normalizes optional values", () => {
  const payload = {
    fullName: "Jane Doe",
    email: " Jane@Example.com ",
    phone: "(509) 555-0100",
    source: "contact" as const,
    zip: undefined,
    message: undefined,
    sourcePath: "/contact",
    referrer: undefined,
    utm: { source: "google", medium: undefined, campaign: "spring" } as {
      source?: string;
      medium?: string;
      campaign?: string;
    },
    clientSubmittedAt: undefined,
  };

  const doc = buildLeadFirestoreDocument(payload, Date.parse("2026-05-01T03:18:00.000Z"));

  assertNoUndefinedDeep(doc);
  assert.equal(doc.zip, null);
  assert.equal(doc.message, null);
  assert.equal(doc.referrer, null);
  assert.equal(doc.clientSubmittedAt, null);
  assert.deepEqual(doc.utm, { source: "google", campaign: "spring" });
  assert.equal(doc.email, "jane@example.com");
  assert.equal(doc.phoneNorm, "5095550100");
});

test("buildCrmFormSubmissionPayload normalizes and trims lead fields", () => {
  const payload = buildCrmFormSubmissionPayload({
    fullName: " Jane Doe ",
    email: " Jane@Example.com ",
    phone: " (509) 555-0100 ",
    zip: " 99206 ",
    message: " Please call me. ",
    source: "contact",
    sourcePath: "/contact",
    referrer: " https://example.com/ ",
    utm: { source: "google", medium: "cpc" },
    clientSubmittedAt: "2026-05-01T03:18:00.000Z",
  });

  assert.deepEqual(payload, {
    formSlug: "medicare-in-spokane-contact",
    source: "medicareinspokane.com",
    sourceUrl: "https://www.medicareinspokane.com/contact",
    pageSource: "contact",
    pageIdentifier: "contact",
    fullName: "Jane Doe",
    email: "jane@example.com",
    phone: "(509) 555-0100",
    zip: "99206",
    message: "Please call me.",
    sourcePath: "/contact",
    referrer: "https://example.com/",
    utm: { source: "google", medium: "cpc" },
    clientSubmittedAt: "2026-05-01T03:18:00.000Z",
    siteSource: "medicareinspokane.com",
  });
});

test("buildCrmFormSubmissionPayload derives sourceUrl for root and missing source paths", () => {
  const missingSourcePath = buildCrmFormSubmissionPayload({
    fullName: "Jane Doe",
    email: "jane@example.com",
    phone: "5095550100",
    source: "",
  });
  const rootSourcePath = buildCrmFormSubmissionPayload({
    fullName: "Jane Doe",
    email: "jane@example.com",
    phone: "5095550100",
    source: "homepage",
    sourcePath: "/",
  });

  assert.equal(missingSourcePath.sourceUrl, "https://www.medicareinspokane.com/");
  assert.equal("pageSource" in missingSourcePath, false);
  assert.equal(rootSourcePath.sourceUrl, "https://www.medicareinspokane.com/");
  assert.equal(rootSourcePath.pageSource, "homepage");
});

test("CRM helpers derive URLs and nested ids safely", () => {
  assert.equal(joinCrmUrl("https://crm.example.com/", "/contacts"), "https://crm.example.com/contacts");
  assert.equal(extractCrmContactId({ id: "contact_123" }), "contact_123");
  assert.equal(extractCrmContactId({ contact: { id: "contact_456" } }), "contact_456");
  assert.equal(extractCrmContactId({ data: { contactId: "contact_789" } }), "contact_789");
});

test("CRM public form path uses the documented submission endpoint", () => {
  assert.equal(CRM_PUBLIC_FORM_SUBMISSION_PATH, "api/public/forms/medicare-in-spokane-contact/submit");
});

test("isDuplicateWithinWindow: within window is duplicate", () => {
  const now = 1_000_000_000_000;
  assert.equal(leadValidation.isDuplicateWithinWindow(now - 60_000, now), true);
  assert.equal(leadValidation.isDuplicateWithinWindow(now - leadValidation.DUPLICATE_WINDOW_MS + 1, now), true);
});

test("isDuplicateWithinWindow: outside window is NOT duplicate", () => {
  const now = 1_000_000_000_000;
  assert.equal(leadValidation.isDuplicateWithinWindow(now - leadValidation.DUPLICATE_WINDOW_MS, now), false);
  assert.equal(leadValidation.isDuplicateWithinWindow(now - leadValidation.DUPLICATE_WINDOW_MS - 1, now), false);
});

test("isDuplicateWithinWindow: future timestamps are NOT duplicate", () => {
  const now = 1_000_000_000_000;
  assert.equal(leadValidation.isDuplicateWithinWindow(now + 1000, now), false);
});
