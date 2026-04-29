// Lightweight tests for pure lead helpers. Run with: `npm test`.
//
// Uses Node's built-in `node:test` runner so we don't need to add any
// additional dev dependencies. Imports the TS source via tsx's loader
// (registered by the npm script).

import { test } from "node:test";
import assert from "node:assert/strict";

const mod = await import('../lib/leadValidation.ts');
console.log('Exports:', Object.keys(mod));

import {
  DUPLICATE_WINDOW_MS,
  cleanString,
  isDuplicateWithinWindow,
  normalizeEmail,
  normalizePhone,
  validateLead,
} from "../lib/leadValidation.ts";

test("normalizeEmail lowercases and trims", () => {
  assert.equal(normalizeEmail("  Foo@Bar.COM "), "foo@bar.com");
  assert.equal(normalizeEmail(undefined), "");
});

test("normalizePhone keeps only digits", () => {
  assert.equal(normalizePhone("(509) 555-0100"), "5095550100");
  assert.equal(normalizePhone(" +1 509.555.0100 "), "15095550100");
  assert.equal(normalizePhone(undefined), "");
});

test("cleanString returns undefined for empty/whitespace", () => {
  assert.equal(cleanString("  "), undefined);
  assert.equal(cleanString("hi "), "hi");
  assert.equal(cleanString(null), undefined);
});

test("validateLead accepts a good payload", () => {
  const r = validateLead({
    fullName: "Jane Doe",
    email: "jane@example.com",
    phone: "509-555-0100",
    zip: "99206",
  });
  assert.equal(r.ok, true);
  assert.deepEqual(r.errors, {});
});

test("validateLead rejects missing fields", () => {
  const r = validateLead({ fullName: "", email: "", phone: "" });
  assert.equal(r.ok, false);
  assert.ok(r.errors.fullName);
  assert.ok(r.errors.email);
  assert.ok(r.errors.phone);
});

test("validateLead rejects bad email and short phone", () => {
  const r = validateLead({
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
  const r = validateLead({
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
  const r = validateLead({
    fullName: "Jane Doe",
    email: "jane@example.com",
    phone: "5095550100",
    zip: "99206-1234",
  });
  assert.equal(r.ok, true);
});

test("isDuplicateWithinWindow: within window is duplicate", () => {
  const now = 1_000_000_000_000;
  assert.equal(isDuplicateWithinWindow(now - 60_000, now), true);
  assert.equal(isDuplicateWithinWindow(now - DUPLICATE_WINDOW_MS + 1, now), true);
});

test("isDuplicateWithinWindow: outside window is NOT duplicate", () => {
  const now = 1_000_000_000_000;
  assert.equal(isDuplicateWithinWindow(now - DUPLICATE_WINDOW_MS, now), false);
  assert.equal(isDuplicateWithinWindow(now - DUPLICATE_WINDOW_MS - 1, now), false);
});

test("isDuplicateWithinWindow: future timestamps are NOT duplicate", () => {
  const now = 1_000_000_000_000;
  assert.equal(isDuplicateWithinWindow(now + 1000, now), false);
});
