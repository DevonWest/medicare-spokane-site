import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { metadata as contactMetadata } from "../app/contact/page";
import { metadata as homeMetadata } from "../app/page";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSource(path: string) {
  return readFileSync(join(root, path), "utf8");
}

test("homepage keeps the August 10 Medicare and health insurance search snippet", () => {
  assert.equal(homeMetadata.title, "Spokane Medicare & Health Insurance Agents | Local Help");
  assert.match(String(homeMetadata.description), /local licensed Spokane insurance agents/i);
});

test("high-authority local pages point to the dedicated Spokane Medicare guide", () => {
  for (const path of [
    "app/page.tsx",
    "app/contact/page.tsx",
    "app/resources/page.tsx",
    "app/our-team/page.tsx",
  ]) {
    assert.match(readSource(path), /href="\/medicare-spokane"/, path);
  }
});

test("contact metadata clearly identifies the Spokane office without targeting FMO intent", () => {
  assert.match(String(contactMetadata.title), /Spokane Medicare Office/);
  assert.match(String(contactMetadata.description), /820 South McClellan/);

  const publicPageSources = [
    readSource("app/page.tsx"),
    readSource("app/contact/page.tsx"),
    readSource("app/resources/page.tsx"),
    readSource("app/our-team/page.tsx"),
    readSource("components/LocalMedicarePage.tsx"),
  ].join("\n");

  assert.doesNotMatch(publicPageSources, /\bFMO\b/i);
});
