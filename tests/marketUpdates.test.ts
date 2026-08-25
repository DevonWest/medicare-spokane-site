import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import {
  buildMarketUpdatesNewsSitemap,
  get2027MarketUpdatesNewestFirst,
  getMarketUpdateMonitoringPaths,
  getMarketUpdateSitemapEntries,
  marketUpdates,
  marketUpdatesHub,
} from "../lib/marketUpdates";
import { publicMonitoringPaths } from "../lib/publicMonitoringPaths";
import { siteConfig } from "../lib/site";

const article = readFileSync(
  new URL("../app/costco-scan-medicare-spokane/page.tsx", import.meta.url),
  "utf8",
);
const providenceArticle = readFileSync(
  new URL(
    "../app/providence-health-plan-ending-2027-washington/page.tsx",
    import.meta.url,
  ),
  "utf8",
);
const wildfireArticle = readFileSync(
  new URL(
    "../app/spokane-wildfire-medicare-help-2026/page.tsx",
    import.meta.url,
  ),
  "utf8",
);
const hub = readFileSync(
  new URL("../app/2027-medicare-changes-spokane/page.tsx", import.meta.url),
  "utf8",
);
const homepage = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const resources = readFileSync(
  new URL("../app/resources/page.tsx", import.meta.url),
  "utf8",
);
const relatedLinks = readFileSync(
  new URL("../components/MarketUpdateLinks.tsx", import.meta.url),
  "utf8",
);

test("one market-update registry drives discovery, monitoring, and internal links", () => {
  const sitemapUrls = new Set(sitemap().map((entry) => entry.url));
  const registrySitemapUrls = getMarketUpdateSitemapEntries().map((entry) => entry.url);

  for (const path of getMarketUpdateMonitoringPaths()) {
    assert.ok(publicMonitoringPaths.includes(path), `${path} should be monitored`);
  }
  assert.deepEqual(registrySitemapUrls, [
    `${siteConfig.url}${marketUpdatesHub.path}`,
    ...marketUpdates.map((update) => `${siteConfig.url}${update.path}`),
  ]);
  for (const url of registrySitemapUrls) {
    assert.ok(sitemapUrls.has(url), `${url} should be in the standard sitemap`);
  }

  assert.match(homepage, /getLatestMarketUpdate/);
  assert.match(homepage, /href=\{marketUpdatesHub\.path\}/);
  assert.match(resources, /getMarketUpdatesNewestFirst/);
  assert.match(resources, /marketUpdates\.map/);
  assert.match(hub, /get2027MarketUpdatesNewestFirst/);
  assert.deepEqual(
    get2027MarketUpdatesNewestFirst().map((update) => update.category),
    ["2027-market", "2027-market"],
  );
  assert.match(article, /MarketUpdateLinks/);
  assert.match(relatedLinks, /relatedUpdates\.map/);
  assert.match(relatedLinks, /href=\{marketUpdatesHub\.path\}/);
  assert.match(wildfireArticle, /MarketUpdateLinks/);
});

test("news sitemap automatically includes only updates from the latest two days", () => {
  const current = buildMarketUpdatesNewsSitemap(
    new Date("2026-08-19T12:00:00Z"),
  );
  assert.match(current, /xmlns:news="http:\/\/www\.google\.com\/schemas\/sitemap-news\/0\.9"/);
  assert.match(current, /<loc>https:\/\/www\.medicareinspokane\.com\/costco-scan-medicare-spokane<\/loc>/);
  assert.match(current, /<news:publication_date>2026-08-18<\/news:publication_date>/);
  assert.match(current, /<news:title>Costco and SCAN Medicare Partnership/);
  assert.match(
    current,
    /<loc>https:\/\/www\.medicareinspokane\.com\/providence-health-plan-ending-2027-washington<\/loc>/,
  );
  assert.match(current, /<news:publication_date>2026-08-19<\/news:publication_date>/);
  assert.match(current, /<news:title>Providence Health Plan Ending Most Coverage/);

  const expired = buildMarketUpdatesNewsSitemap(
    new Date("2026-08-21T00:00:00Z"),
  );
  assert.doesNotMatch(expired, /costco-scan-medicare-spokane/);
  assert.doesNotMatch(expired, /providence-health-plan-ending-2027-washington/);
  assert.match(expired, /<urlset[^>]*>[\s\S]*<\/urlset>/);

  const wildfireCurrent = buildMarketUpdatesNewsSitemap(
    new Date("2026-08-22T12:00:00Z"),
  );
  assert.match(
    wildfireCurrent,
    /<loc>https:\/\/www\.medicareinspokane\.com\/spokane-wildfire-medicare-help-2026<\/loc>/,
  );
  assert.match(wildfireCurrent, /<news:publication_date>2026-08-22<\/news:publication_date>/);
  assert.doesNotMatch(wildfireCurrent, /costco-scan-medicare-spokane/);
  assert.doesNotMatch(wildfireCurrent, /providence-health-plan-ending-2027-washington/);
});

test("robots advertises both standard and news sitemaps", () => {
  assert.deepEqual(robots().sitemap, [
    `${siteConfig.url}/sitemap.xml`,
    `${siteConfig.url}/news-sitemap.xml`,
  ]);
});

test("Costco and SCAN article preserves the Spokane confirmation guardrail", () => {
  assert.match(article, /Spokane status: not confirmed/);
  assert.match(article, /No Costco- and SCAN-branded Medicare product has been announced/);
  assert.match(article, /does not recommend or compare/);
  assert.match(article, /"@type": "NewsArticle"/);
  assert.match(article, /datePublished: publishedDate/);
});

test("Providence article separates confirmed Washington changes from pending Medicare details", () => {
  assert.match(providenceArticle, /Washington status: confirmed for individual coverage/);
  assert.match(providenceArticle, /will not offer individual and family health insurance/);
  assert.match(providenceArticle, /Medicare Advantage and Medicare Supplement details remain pending/);
  assert.match(
    providenceArticle,
    /does\s+not\s+mean Providence hospitals or clinics are closing/,
  );
  assert.match(providenceArticle, /"@type": "NewsArticle"/);
  assert.match(providenceArticle, /datePublished: marketUpdate\.publishedDate/);
  assert.match(providenceArticle, /more\s+details\s+will\s+be\s+shared/);
  assert.doesNotMatch(providenceArticle, /potential agreement with another carrier/);
});

test("wildfire article explains active Spokane protections without overstating enrollment rights", () => {
  assert.match(wildfireArticle, /Spokane County status: federal protections active/);
  assert.match(wildfireArticle, /This is not automatic for every Spokane-area resident/);
  assert.match(wildfireArticle, /1-800-MEDICARE/);
  assert.match(wildfireArticle, /ESRD Network 16/);
  assert.match(wildfireArticle, /refill-too-soon/);
  assert.match(wildfireArticle, /"@type": "NewsArticle"/);
  assert.match(wildfireArticle, /"@type": "FAQPage"/);
});
