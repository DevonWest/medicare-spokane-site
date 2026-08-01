import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  createKnowledgeCmsSourceDraft,
  prepareKnowledgeCmsSourcesForSubmission,
  suggestKnowledgeCmsSourceId,
  suggestKnowledgeCmsSourcePublisher,
} from "../lib/knowledgeCmsEditor";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("new source drafts receive the current six-month review window", () => {
  const source = createKnowledgeCmsSourceDraft(
    new Date("2026-08-01T12:00:00.000Z"),
  );

  assert.deepEqual(source, {
    id: "",
    kind: "official",
    title: "",
    publisher: "",
    url: "",
    checkedAt: "2026-08-01",
    reviewDueAt: "2027-01-28",
  });
});

test("source suggestions use the entered title and authoritative website", () => {
  assert.equal(
    suggestKnowledgeCmsSourceId({
      title: "What's Medicare drug coverage (Part D)?",
      url: "https://www.medicare.gov/health-drug-plans/part-d",
    }),
    "whats-medicare-drug-coverage-part-d",
  );
  assert.equal(
    suggestKnowledgeCmsSourcePublisher(
      "https://www.medicare.gov/health-drug-plans/part-d",
    ),
    "Medicare.gov",
  );
  assert.equal(
    suggestKnowledgeCmsSourcePublisher(
      "https://insurance.wa.gov/agent-and-company-lookup-tool",
    ),
    "Washington Office of the Insurance Commissioner",
  );
  assert.equal(
    suggestKnowledgeCmsSourcePublisher("https://www.example.org/source"),
    "example.org",
  );
});

test("submission preparation fills only missing source internals", () => {
  const source = createKnowledgeCmsSourceDraft(
    new Date("2026-08-01T12:00:00.000Z"),
  );
  source.title = "Medicare Open Enrollment";
  source.url = "https://www.medicare.gov/health-drug-plans/open-enrollment";

  const [prepared] = prepareKnowledgeCmsSourcesForSubmission([source]);
  assert.equal(prepared.id, "medicare-open-enrollment");
  assert.equal(prepared.publisher, "Medicare.gov");
  assert.equal(source.id, "");
  assert.equal(source.publisher, "");

  const [overridden] = prepareKnowledgeCmsSourcesForSubmission([
    {
      ...source,
      id: "curated-source-id",
      publisher: "Curated publisher",
    },
  ]);
  assert.equal(overridden.id, "curated-source-id");
  assert.equal(overridden.publisher, "Curated publisher");
});

test("the everyday editor keeps technical metadata behind an advanced section", () => {
  const form = readFileSync(
    join(root, "app/admin/knowledge/components/KnowledgeRecordForm.tsx"),
    "utf8",
  );

  assert.match(form, /Everyday editing/);
  assert.match(
    form,
    /For most sources, enter only the title and official link/,
  );
  assert.match(form, /<details[^>]*>[\s\S]*Advanced settings/);
  assert.ok(form.indexOf("<SourceFields") < form.indexOf("Advanced settings"));
  assert.match(form, /prepareKnowledgeCmsSourcesForSubmission/);
});
