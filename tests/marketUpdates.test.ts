import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import sitemap from "../app/sitemap";
import { siteConfig } from "../lib/site";

const article = readFileSync(
  new URL("../app/costco-scan-medicare-spokane/page.tsx", import.meta.url),
  "utf8",
);
const hub = readFileSync(
  new URL("../app/2027-medicare-changes-spokane/page.tsx", import.meta.url),
  "utf8",
);

test("market update routes are discoverable and cross-linked", () => {
  const sitemapUrls = new Set(sitemap().map((entry) => entry.url));

  assert.ok(sitemapUrls.has(`${siteConfig.url}/2027-medicare-changes-spokane`));
  assert.ok(sitemapUrls.has(`${siteConfig.url}/costco-scan-medicare-spokane`));
  assert.match(hub, /href="\/costco-scan-medicare-spokane"/);
  assert.match(article, /href="\/2027-medicare-changes-spokane"/);
});

test("Costco and SCAN article preserves the Spokane confirmation guardrail", () => {
  assert.match(article, /Spokane status: not confirmed/);
  assert.match(article, /No Costco- and SCAN-branded Medicare product has been announced/);
  assert.match(article, /does not recommend or compare/);
  assert.match(article, /"@type": "NewsArticle"/);
  assert.match(article, /datePublished: publishedDate/);
});
