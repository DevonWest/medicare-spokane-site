import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildAepLeadMessage,
  isAepBestTime,
  isAepContactPreference,
  isAepHelpType,
} from "../lib/aepLead";

test("AEP qualifier guards accept supported values and reject arbitrary input", () => {
  assert.equal(isAepHelpType("current-plan"), true);
  assert.equal(isAepHelpType("medical-history"), false);
  assert.equal(isAepContactPreference("text"), true);
  assert.equal(isAepContactPreference("carrier-pigeon"), false);
  assert.equal(isAepBestTime("afternoon"), true);
  assert.equal(isAepBestTime("midnight"), false);
});

test("buildAepLeadMessage creates a structured, categorical CRM note", () => {
  const message = buildAepLeadMessage({
    helpType: "prescriptions",
    contactPreference: "phone",
    bestTime: "morning",
  });

  assert.equal(
    message,
    [
      "Annual Medicare review requested: Yes",
      "Help requested: Prescription drug coverage and pharmacy costs",
      "Preferred contact: Phone call",
      "Best time: Morning",
      "Contact consent confirmed: Yes",
    ].join("\n"),
  );
});
