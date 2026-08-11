const routeByEntryId = new Map([
  ["turning-65-spokane", "/turning-65-medicare-spokane"],
  ["compare-options", "/compare-medicare-options"],
  ["medicare-advantage", "/medicare-advantage"],
  ["medicare-supplements", "/medicare-supplements"],
  ["appointment-checklist", "/medicare-appointment-checklist"],
  ["annual-plan-review", "/medicare-plan-review-spokane"],
  ["annual-enrollment-spokane", "/medicare-annual-enrollment-spokane"],
  ["prescription-review", "/rx-drug-review"],
  ["part-d", "/medicare-part-d"],
  ["helping-parent", "/helping-parent-with-medicare"],
  ["working-past-65", "/working-past-65-medicare"],
  ["health-insurance-spokane", "/health-insurance-spokane"],
  ["health-insurance-agent", "/health-insurance-agent-spokane"],
  ["individual-family-health-insurance", "/individual-family-health-insurance-spokane"],
  ["self-employed-health-insurance", "/self-employed-health-insurance-spokane"],
  ["special-enrollment-health-insurance", "/health-insurance-special-enrollment-spokane"],
  ["enrollment-resources", "/medicare-enrollment-resources"],
  ["moving-to-spokane", "/moving-to-spokane-medicare"],
  ["medicare-savings-extra-help", "/medicare-savings-program-extra-help-washington"],
  ["medicare-faq", "/medicare-faq"],
  ["advantage-vs-supplement", "/medicare-advantage-vs-supplement-spokane"],
  ["represented-carriers", "/carriers"],
]);

function argument(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const baseUrl = argument("url");
const routeValue = argument("routes");
if (!baseUrl || !routeValue) {
  throw new Error("Usage: --url <production candidate URL> --routes <comma-separated entry IDs>");
}

const entryIds = [...new Set(routeValue.split(",").map((value) => value.trim()).filter(Boolean))];
if (entryIds.length === 0 || entryIds.some((entryId) => !routeByEntryId.has(entryId))) {
  throw new Error("The production route list is empty or contains an unknown governed entry ID.");
}

for (const entryId of entryIds) {
  const path = routeByEntryId.get(entryId);
  const response = await fetch(new URL(path, baseUrl), {
    redirect: "manual",
    signal: AbortSignal.timeout(10_000),
  });
  const html = await response.text();
  if (response.status !== 200) {
    throw new Error(`${path} returned ${response.status}.`);
  }
  if (response.headers.get("x-knowledge-cms-cutover") !== "routed") {
    throw new Error(`${path} did not confirm CMS routing.`);
  }
  if (!html.includes("data-knowledge-cms-article=") || !html.includes("data-knowledge-cms-revision=")) {
    throw new Error(`${path} did not render the approved CMS article body.`);
  }
  if (/name=["']robots["'][^>]*noindex/i.test(html) || /x-robots-tag/i.test(html)) {
    throw new Error(`${path} unexpectedly emitted a noindex directive.`);
  }
  console.log(`Verified production CMS route ${entryId} -> ${path}`);
}
