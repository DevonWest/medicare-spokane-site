import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Metadata } from "next";
import { knowledgeEntries } from "../lib/knowledgeCenter";
import {
  KNOWLEDGE_CMS_ROUTE_PARITY_CAPTURE,
  KNOWLEDGE_CMS_ROUTE_PARITY_HASH_ALGORITHM,
  KNOWLEDGE_CMS_ROUTE_PARITY_MODE,
  KNOWLEDGE_CMS_ROUTE_PARITY_VERSION,
  knowledgeCmsRouteParityManifest,
  validateKnowledgeCmsRouteParityManifest,
} from "../lib/knowledgeCmsRouteParity";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

interface PublicPageModule {
  default: ComponentType;
  metadata: Metadata;
}

function metadataString(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof URL) {
    return value.toString();
  }
  if (
    value &&
    typeof value === "object" &&
    "absolute" in value &&
    typeof value.absolute === "string"
  ) {
    return value.absolute;
  }
  return undefined;
}

function decodeRenderedText(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replaceAll("&amp;", "&")
    .replaceAll("&#x27;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x2F;", "/")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSchemaTypes(
  html: string,
): Array<string | undefined> {
  return [
    ...html.matchAll(
      /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
    ),
  ].flatMap((match) => {
    const parsed = JSON.parse(match[1]) as
      | Record<string, unknown>
      | Array<Record<string, unknown>>;
    return (Array.isArray(parsed) ? parsed : [parsed]).map((schema) =>
      typeof schema["@type"] === "string"
        ? schema["@type"]
        : undefined,
    );
  });
}

function loadPublicPage(sourceFile: string): PublicPageModule {
  return require(join(root, sourceFile)) as PublicPageModule;
}

test("route parity manifest covers exactly the 22 migration articles", () => {
  assert.deepEqual(validateKnowledgeCmsRouteParityManifest(), []);
  assert.equal(knowledgeCmsRouteParityManifest.length, 22);
  assert.deepEqual(
    knowledgeCmsRouteParityManifest.map((entry) => entry.entryId),
    knowledgeEntries.map((entry) => entry.id),
  );
  assert.deepEqual(
    knowledgeCmsRouteParityManifest.map((entry) => entry.path),
    knowledgeEntries.map((entry) => entry.path),
  );
  assert.equal(
    knowledgeCmsRouteParityManifest.some((entry) =>
      ["/", "/medicare-spokane"].includes(entry.path),
    ),
    false,
  );
  assert.ok(
    knowledgeCmsRouteParityManifest.every(
      (entry) =>
        entry.version === KNOWLEDGE_CMS_ROUTE_PARITY_VERSION &&
        entry.mode === KNOWLEDGE_CMS_ROUTE_PARITY_MODE &&
        entry.renderedBody.capture ===
          KNOWLEDGE_CMS_ROUTE_PARITY_CAPTURE &&
        entry.renderedBody.hashAlgorithm ===
          KNOWLEDGE_CMS_ROUTE_PARITY_HASH_ALGORITHM &&
        existsSync(join(root, entry.sourceFile)),
    ),
  );
});

test("route metadata matches every explicit parity snapshot", () => {
  for (const entry of knowledgeCmsRouteParityManifest) {
    const page = loadPublicPage(entry.sourceFile);
    const metadata = page.metadata;

    assert.equal(
      metadataString(metadata.title),
      entry.metadata.pageTitle,
      `${entry.path} page title drifted`,
    );
    assert.equal(
      metadata.description,
      entry.metadata.description,
      `${entry.path} description drifted`,
    );
    assert.equal(
      metadataString(metadata.alternates?.canonical),
      entry.metadata.canonicalUrl,
      `${entry.path} canonical drifted`,
    );
    assert.equal(
      metadataString(metadata.openGraph?.title),
      entry.metadata.openGraphTitle,
      `${entry.path} Open Graph title drifted`,
    );
    assert.equal(
      metadata.openGraph?.description,
      entry.metadata.openGraphDescription,
      `${entry.path} Open Graph description drifted`,
    );
    assert.equal(
      metadataString(metadata.openGraph?.url),
      entry.metadata.openGraphUrl,
      `${entry.path} Open Graph URL drifted`,
    );
  }
});

test("rendered route bodies match their H1, schema, and SHA-256 snapshots", () => {
  for (const entry of knowledgeCmsRouteParityManifest) {
    const page = loadPublicPage(entry.sourceFile);
    const html = renderToStaticMarkup(createElement(page.default));
    const h1s = [
      ...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g),
    ].map((match) => decodeRenderedText(match[1]));
    const renderedSha256 = createHash("sha256")
      .update(html)
      .digest("hex");

    assert.equal(
      Buffer.byteLength(html),
      entry.renderedBody.bytes,
      `${entry.path} rendered byte count drifted`,
    );
    // Breadcrumb JSON-LD is intentionally additive SEO metadata. Its
    // serialized bytes are validated above and its exact schema type/order is
    // validated below; do not make CMS body parity depend on JSON key order.
    if (!entry.renderedBody.schemaTypes.includes("BreadcrumbList")) {
      assert.equal(
        renderedSha256,
        entry.renderedBody.sha256,
        `${entry.path} rendered body drifted`,
      );
    }
    assert.equal(
      h1s.length,
      entry.renderedBody.h1Count,
      `${entry.path} H1 count drifted`,
    );
    assert.deepEqual(
      h1s,
      [entry.renderedBody.h1],
      `${entry.path} H1 copy drifted`,
    );
    assert.deepEqual(
      extractSchemaTypes(html),
      entry.renderedBody.schemaTypes,
      `${entry.path} structured data drifted`,
    );
    assert.equal(
      (html.match(/<form\b/g) ?? []).length,
      entry.renderedBody.formCount,
      `${entry.path} form count drifted`,
    );
    assert.equal(
      (html.match(/<details\b/g) ?? []).length,
      entry.renderedBody.faqDisclosureCount,
      `${entry.path} FAQ disclosure count drifted`,
    );
  }
});

test("manifest fails closed on every Markdown-only article representation", () => {
  assert.ok(
    knowledgeCmsRouteParityManifest.every(
      (entry) =>
        entry.metadata.status === "verified" &&
        entry.renderedBody.status === "verified" &&
        entry.cmsRepresentation.status === "blocked" &&
        entry.cmsRepresentation.bodyFormat === "markdown" &&
        entry.cmsRepresentation.preservationRequirements.includes(
          "react_component_tree",
        ) &&
        entry.cmsRepresentation.preservationRequirements.includes(
          "related_content",
        ),
    ),
  );

  const faq = knowledgeCmsRouteParityManifest.find(
    (entry) => entry.entryId === "medicare-faq",
  );
  const carriers = knowledgeCmsRouteParityManifest.find(
    (entry) => entry.entryId === "represented-carriers",
  );
  assert.ok(
    faq?.cmsRepresentation.preservationRequirements.includes(
      "governed_faq_registry",
    ),
  );
  assert.ok(
    carriers?.cmsRepresentation.preservationRequirements.includes(
      "represented_carrier_registry",
    ),
  );
  assert.throws(
    () => {
      knowledgeCmsRouteParityManifest[0].renderedBody.schemaTypes.push(
        "WebPage",
      );
    },
    TypeError,
  );
  assert.throws(
    () => {
      knowledgeCmsRouteParityManifest[0].metadata.pageTitle =
        "mutated title";
    },
    TypeError,
  );
});
