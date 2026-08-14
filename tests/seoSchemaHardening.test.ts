import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import LocalBusinessSchema from "../components/LocalBusinessSchema";
import LocalMedicarePage from "../components/LocalMedicarePage";
import PageHero from "../components/PageHero";

function schemaScripts(html: string): Array<Record<string, unknown>> {
  return Array.from(
    html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
    (match) => JSON.parse(match[1]) as Record<string, unknown>,
  );
}

test("global entity schema connects the agency and WebSite with health insurance services", () => {
  const html = renderToStaticMarkup(createElement(LocalBusinessSchema));
  const [schema] = schemaScripts(html);
  const graph = schema["@graph"] as Array<Record<string, unknown>>;
  const organization = graph.find((node) => node["@id"] === "https://www.medicareinspokane.com#organization");
  const website = graph.find((node) => node["@id"] === "https://www.medicareinspokane.com#website");

  assert.ok(organization);
  assert.ok(website);
  assert.deepEqual(organization?.["@type"], ["Organization", "InsuranceAgency", "LocalBusiness"]);
  assert.match(JSON.stringify(organization), /Individual and Family Health Insurance/);
  assert.match(JSON.stringify(organization), /ContactPoint/);
  assert.match(JSON.stringify(organization), /hio-logo\.png/);
  assert.deepEqual(website?.publisher, {
    "@id": "https://www.medicareinspokane.com#organization",
  });
});

test("PageHero emits structured breadcrumbs matching its visible breadcrumb trail", () => {
  const html = renderToStaticMarkup(
    createElement(PageHero, {
      title: "Resources",
      crumbs: [
        { href: "/", label: "Home" },
        { label: "Resources" },
      ],
    }),
  );
  const [schema] = schemaScripts(html);

  assert.equal(schema["@type"], "BreadcrumbList");
  assert.match(html, /aria-label="Breadcrumb"/);
  assert.match(html, /https:\/\/www\.medicareinspokane\.com\//);
});

test("local pages describe one agency-provided Service instead of duplicate local businesses", () => {
  const html = renderToStaticMarkup(
    createElement(LocalMedicarePage, { citySlug: "spokane-valley" }),
  );
  const scripts = schemaScripts(html);
  const localGraphSchema = scripts.find((schema) => Array.isArray(schema["@graph"]));
  const graph = localGraphSchema?.["@graph"] as Array<Record<string, unknown>>;

  assert.ok(graph.some((node) => node["@type"] === "WebPage"));
  assert.ok(graph.some((node) => node["@type"] === "Service"));
  assert.equal(
    graph.some((node) => JSON.stringify(node["@type"]).includes("LocalBusiness")),
    false,
  );
  assert.match(JSON.stringify(graph), /#organization/);
});
