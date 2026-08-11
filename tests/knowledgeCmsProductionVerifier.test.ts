import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const verifier = join(root, "scripts/verify-knowledge-cms-production-routes.mjs");

function cmsHtml(input: {
  path: string;
  schemas: string[];
  link?: string;
}) {
  return `<!doctype html><html><head>
    <link rel="canonical" href="https://www.medicareinspokane.com${input.path}">
    <script type="application/ld+json">${JSON.stringify({
      "@graph": input.schemas.map((type) => ({ "@type": type })),
    })}</script>
    </head><body data-knowledge-cms-article="article" data-knowledge-cms-revision="5">
    <form></form><a href="${input.link ?? "/resources"}">Resource</a></body></html>`;
}

async function withServer(input: {
  path?: string;
  schemas?: string[];
  link: string;
}, callback: (baseUrl: string) => Promise<void>) {
  const path = input.path ?? "/medicare-appointment-checklist";
  const schemas = input.schemas ?? ["BreadcrumbList", "FAQPage", "WebPage"];
  const server = createServer((request, response) => {
    if (request.url === path) {
      response.setHeader("x-knowledge-cms-cutover", "routed");
      response.end(cmsHtml({ path, schemas, link: input.link }));
      return;
    }
    if (["/", "/medicare-spokane", "/resources"].includes(request.url ?? "")) {
      response.end("<!doctype html><p>static</p>");
      return;
    }
    response.statusCode = 404;
    response.end("missing");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  try {
    await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("steady-state verifier checks routing, SEO contracts, forms, static routes, and links", async () => {
  await withServer({ link: "/resources" }, async (baseUrl) => {
    const result = await run(process.execPath, [verifier, "--url", baseUrl, "--routes", "appointment-checklist"]);
    assert.match(result.stdout, /Verified CMS, canonical, indexing, schema, and forms/);
    assert.match(result.stdout, /Verified 1 unique internal links and 3 protected static routes/);
  });
});

test("steady-state verifier fails on a broken internal link", async () => {
  await withServer({ link: "/missing" }, async (baseUrl) => {
    await assert.rejects(
      run(process.execPath, [verifier, "--url", baseUrl, "--routes", "appointment-checklist"]),
      /Internal link \/missing returned 404/,
    );
  });
});

test("steady-state verifier does not require FAQ schema without governed visible FAQs", async () => {
  await withServer({
    path: "/medicare-annual-enrollment-spokane",
    schemas: ["BreadcrumbList", "WebPage"],
    link: "/resources",
  }, async (baseUrl) => {
    const result = await run(process.execPath, [
      verifier,
      "--url",
      baseUrl,
      "--routes",
      "annual-enrollment-spokane",
    ]);
    assert.match(result.stdout, /Verified CMS, canonical, indexing, schema, and forms/);
  });
});
