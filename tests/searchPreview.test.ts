import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import Image, { size, contentType } from "../app/opengraph-image";
import TwitterImage, { size as twitterSize } from "../app/twitter-image";
import BreadcrumbSchema from "../components/BreadcrumbSchema";
import { siteConfig } from "../lib/site";

test("shared-link fallback renders a local 1200x630 PNG", async () => {
  assert.deepEqual(size, { width: 1200, height: 630 });
  assert.deepEqual(twitterSize, size);
  assert.equal(TwitterImage, Image);
  const response = Image();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), contentType);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(bytes.subarray(1, 4).toString(), "PNG");
  assert.equal(bytes.readUInt32BE(16), 1200);
  assert.equal(bytes.readUInt32BE(20), 630);
});

test("topic pages mark up their visible breadcrumbs, not invented FAQ questions", () => {
  const source = readFileSync("app/topics/[topic]/page.tsx", "utf8");
  assert.doesNotMatch(source, /FAQPage|acceptedAnswer|faqSchema/);
  assert.match(source, /<BreadcrumbSchema/);
  assert.match(source, /items=\{\[\{ name: "Home", path: "\/" \}, \{ name: topic.title \}\]\}/);
  assert.match(source, /topic\.benefits\.map/);
  const html = renderToStaticMarkup(createElement(BreadcrumbSchema, {
    items: [{ name: "Home", path: "/" }, { name: "Medicare Part D" }],
  }));
  const schema = JSON.parse(html.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, ""));
  assert.equal(schema["@type"], "BreadcrumbList");
  assert.deepEqual(schema.itemListElement, [
    { "@type": "ListItem", position: 1, name: "Home", item: `${siteConfig.url}/` },
    { "@type": "ListItem", position: 2, name: "Medicare Part D" },
  ]);
});
