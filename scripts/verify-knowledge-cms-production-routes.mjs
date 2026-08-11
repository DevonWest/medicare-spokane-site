const productionOrigin = "https://www.medicareinspokane.com";
const protectedStaticPaths = ["/", "/medicare-spokane", "/resources"];

const routeByEntryId = new Map([
  ["turning-65-spokane", ["/turning-65-medicare-spokane", ["BreadcrumbList", "WebPage", "FAQPage"], 1]],
  ["compare-options", ["/compare-medicare-options", ["BreadcrumbList", "WebPage", "FAQPage"], 1]],
  ["medicare-advantage", ["/medicare-advantage", ["BreadcrumbList", "WebPage", "FAQPage"], 1]],
  ["medicare-supplements", ["/medicare-supplements", ["BreadcrumbList", "WebPage", "FAQPage"], 1]],
  ["appointment-checklist", ["/medicare-appointment-checklist", ["BreadcrumbList", "WebPage", "FAQPage"], 1]],
  ["annual-plan-review", ["/medicare-plan-review-spokane", ["BreadcrumbList", "WebPage", "FAQPage"], 1]],
  ["annual-enrollment-spokane", ["/medicare-annual-enrollment-spokane", ["BreadcrumbList", "WebPage"], 1]],
  ["prescription-review", ["/rx-drug-review", ["BreadcrumbList", "WebPage", "FAQPage"], 1]],
  ["part-d", ["/medicare-part-d", ["BreadcrumbList", "WebPage", "FAQPage"], 1]],
  ["helping-parent", ["/helping-parent-with-medicare", ["BreadcrumbList", "WebPage", "FAQPage"], 1]],
  ["working-past-65", ["/working-past-65-medicare", ["BreadcrumbList", "WebPage", "FAQPage"], 1]],
  ["health-insurance-spokane", ["/health-insurance-spokane", ["BreadcrumbList", "WebPage"], 1]],
  ["health-insurance-agent", ["/health-insurance-agent-spokane", ["BreadcrumbList", "WebPage"], 1]],
  ["individual-family-health-insurance", ["/individual-family-health-insurance-spokane", ["BreadcrumbList", "WebPage"], 1]],
  ["self-employed-health-insurance", ["/self-employed-health-insurance-spokane", ["BreadcrumbList", "WebPage"], 1]],
  ["special-enrollment-health-insurance", ["/health-insurance-special-enrollment-spokane", ["BreadcrumbList", "WebPage"], 1]],
  ["enrollment-resources", ["/medicare-enrollment-resources", ["BreadcrumbList", "WebPage", "FAQPage"], 1]],
  ["moving-to-spokane", ["/moving-to-spokane-medicare", ["BreadcrumbList", "WebPage", "FAQPage"], 1]],
  ["medicare-savings-extra-help", ["/medicare-savings-program-extra-help-washington", ["BreadcrumbList", "WebPage", "FAQPage"], 1]],
  ["medicare-faq", ["/medicare-faq", ["BreadcrumbList", "WebPage", "FAQPage"], 1]],
  ["advantage-vs-supplement", ["/medicare-advantage-vs-supplement-spokane", ["BreadcrumbList", "WebPage", "FAQPage"], 1]],
  ["represented-carriers", ["/carriers", ["BreadcrumbList", "WebPage", "FAQPage"], 1]],
]);

function argument(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:["']([^"']*)["']|([^\\s>]+))`, "i"));
  return match?.[1] ?? match?.[2];
}

function canonicalHref(html) {
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    if ((attribute(tag, "rel") ?? "").toLowerCase().split(/\s+/).includes("canonical")) {
      return attribute(tag, "href");
    }
  }
  return undefined;
}

function schemaTypes(html) {
  const types = new Set();
  const visit = (value) => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== "object") return;
    const ownTypes = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]];
    ownTypes.filter((type) => typeof type === "string").forEach((type) => types.add(type));
    if (value["@graph"]) visit(value["@graph"]);
  };
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    visit(JSON.parse(match[1]));
  }
  return types;
}

function internalLinks(html, baseUrl) {
  const links = new Set();
  const candidate = new URL(baseUrl);
  for (const tag of html.match(/<a\b[^>]*>/gi) ?? []) {
    const href = attribute(tag, "href")?.replaceAll("&amp;", "&");
    if (!href || href.startsWith("#")) continue;
    let url;
    try {
      url = new URL(href, productionOrigin);
    } catch {
      continue;
    }
    if (![new URL(productionOrigin).host, candidate.host].includes(url.host)) continue;
    if (["/api/", "/admin/", "/cms-render/"].some((prefix) => url.pathname.startsWith(prefix))) continue;
    links.add(`${url.pathname}${url.search}`);
  }
  return links;
}

async function fetchPage(url) {
  return fetch(url, { redirect: "manual", signal: AbortSignal.timeout(10_000) });
}

const baseUrl = argument("url");
const routeValue = argument("routes");
if (!baseUrl || !routeValue) {
  throw new Error("Usage: --url <production candidate URL> --routes <pipe- or comma-separated entry IDs>");
}

const entryIds = [...new Set(routeValue.split(/[|,]/).map((value) => value.trim()).filter(Boolean))];
if (entryIds.length === 0 || entryIds.some((entryId) => !routeByEntryId.has(entryId))) {
  throw new Error("The production route list is empty or contains an unknown governed entry ID.");
}

const links = new Set();
for (const entryId of entryIds) {
  const [path, expectedSchemas, expectedFormCount] = routeByEntryId.get(entryId);
  const response = await fetchPage(new URL(path, baseUrl));
  const html = await response.text();
  if (response.status !== 200) throw new Error(`${path} returned ${response.status}.`);
  if (response.headers.get("x-knowledge-cms-cutover") !== "routed") {
    throw new Error(`${path} did not confirm CMS routing.`);
  }
  if (!html.includes("data-knowledge-cms-article=") || !html.includes("data-knowledge-cms-revision=")) {
    throw new Error(`${path} did not render the approved CMS article body.`);
  }
  if (/noindex/i.test(response.headers.get("x-robots-tag") ?? "") || /name=["']robots["'][^>]*noindex/i.test(html)) {
    throw new Error(`${path} unexpectedly emitted a noindex directive.`);
  }
  const expectedCanonical = `${productionOrigin}${path}`;
  if (canonicalHref(html) !== expectedCanonical) {
    throw new Error(`${path} canonical did not equal ${expectedCanonical}.`);
  }
  const actualSchemas = schemaTypes(html);
  for (const expected of expectedSchemas) {
    if (!actualSchemas.has(expected)) throw new Error(`${path} is missing ${expected} structured data.`);
  }
  const formCount = (html.match(/<form\b/gi) ?? []).length;
  if (formCount !== expectedFormCount) {
    throw new Error(`${path} rendered ${formCount} form(s); expected ${expectedFormCount}.`);
  }
  internalLinks(html, baseUrl).forEach((link) => links.add(link));
  console.log(`Verified CMS, canonical, indexing, schema, and forms for ${entryId} -> ${path}`);
}

for (const path of protectedStaticPaths) {
  const response = await fetchPage(new URL(path, baseUrl));
  const html = await response.text();
  if (response.status !== 200 || response.headers.has("x-knowledge-cms-cutover") || html.includes("data-knowledge-cms-article=")) {
    throw new Error(`${path} is not a healthy protected static route.`);
  }
}

for (const path of links) {
  const response = await fetchPage(new URL(path, baseUrl));
  if (response.status >= 400) throw new Error(`Internal link ${path} returned ${response.status}.`);
}

console.log(`Verified ${links.size} unique internal links and ${protectedStaticPaths.length} protected static routes.`);
