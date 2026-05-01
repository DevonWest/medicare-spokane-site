// Lightweight tests for pure lead helpers. Run with: `npm test`.
//
// Uses Node's built-in `node:test` runner via `tsx --test` so we don't
// need to add any additional dev dependencies.

import { test } from "node:test";
import assert from "node:assert/strict";

import * as leadValidation from "../lib/leadValidation";

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

test("validateLead accepts a good payload", () => {
  const r = leadValidation.validateLead({
    fullName: "Jane Doe",
    email: "jane@example.com",
    phone: "509-555-0100",
    zip: "99206",
  });
  assert.equal(r.ok, true);
  assert.deepEqual(r.errors, {});
});

test("validateLead rejects missing fields", () => {
  const r = leadValidation.validateLead({ fullName: "", email: "", phone: "" });
  assert.equal(r.ok, false);
  assert.ok(r.errors.fullName);
  assert.ok(r.errors.email);
  assert.ok(r.errors.phone);
  assert.equal(r.errors.zip, undefined);
});

test("validateLead allows a blank ZIP", () => {
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
  });
  assert.equal(r.ok, false);
  assert.ok(r.errors.fullName);
  assert.ok(r.errors.email);
  assert.ok(r.errors.phone);
});

test("validateLead rejects bad zip and too-long message", () => {
  const r = leadValidation.validateLead({
    fullName: "Jane Doe",
    email: "jane@example.com",
    phone: "5095550100",
    zip: "abc",
    message: "x".repeat(2001),
  });
  assert.equal(r.ok, false);
  assert.ok(r.errors.zip);
  assert.ok(r.errors.message);
});

test("validateLead accepts ZIP+4", () => {
  const r = leadValidation.validateLead({
    fullName: "Jane Doe",
    email: "jane@example.com",
    phone: "5095550100",
    zip: "99206-1234",
  });
  assert.equal(r.ok, true);
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
