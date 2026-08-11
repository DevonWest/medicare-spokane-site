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

function cmsHtml(link = "/resources") {
  return `<!doctype html><html><head>
    <link rel="canonical" href="https://www.medicareinspokane.com/medicare-appointment-checklist">
    <script type="application/ld+json">{"@graph":[{"@type":"FAQPage"},{"@type":"WebPage"}]}</script>
    </head><body data-knowledge-cms-article="article" data-knowledge-cms-revision="5">
    <form></form><a href="${link}">Resource</a></body></html>`;
}

async function withServer(link: string, callback: (baseUrl: string) => Promise<void>) {
  const server = createServer((request, response) => {
    if (request.url === "/medicare-appointment-checklist") {
      response.setHeader("x-knowledge-cms-cutover", "routed");
      response.end(cmsHtml(link));
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
  await withServer("/resources", async (baseUrl) => {
    const result = await run(process.execPath, [verifier, "--url", baseUrl, "--routes", "appointment-checklist"]);
    assert.match(result.stdout, /Verified CMS, canonical, indexing, schema, and forms/);
    assert.match(result.stdout, /Verified 1 unique internal links and 3 protected static routes/);
  });
});

test("steady-state verifier fails on a broken internal link", async () => {
  await withServer("/missing", async (baseUrl) => {
    await assert.rejects(
      run(process.execPath, [verifier, "--url", baseUrl, "--routes", "appointment-checklist"]),
      /Internal link \/missing returned 404/,
    );
  });
});
