import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import sitemap from "../app/sitemap";
import { buildMarketUpdatesNewsSitemap, getLatestMarketUpdate, getMarketUpdateByPath } from "../lib/marketUpdates";
import { publicMonitoringPaths } from "../lib/publicMonitoringPaths";
import { siteConfig } from "../lib/site";

const path = "/multicare-rockwood-clinic-closures-spokane";
const article = readFileSync(new URL(`../app${path}/page.tsx`, import.meta.url), "utf8");

test("Rockwood closure article is discoverable and monitored as local news", () => {
  assert.equal(getMarketUpdateByPath(path)?.category, "local-medicare-news");
  assert.equal(getLatestMarketUpdate().path, path);
  assert.ok(publicMonitoringPaths.includes(path));
  assert.equal(sitemap().filter((entry) => entry.url === `${siteConfig.url}${path}`).length, 1);
  const news = buildMarketUpdatesNewsSitemap(new Date("2026-09-05T12:00:00Z"));
  assert.ok(news.includes(`${siteConfig.url}${path}`));
  assert.match(news, /<news:publication_date>2026-09-05<\/news:publication_date>/);
  const networkPage = readFileSync(new URL("../app/multicare-medicare-advantage-plans-spokane/page.tsx", import.meta.url), "utf8");
  assert.ok(networkPage.includes(`href="${path}"`));
});

test("Rockwood article preserves dates, retina exception and source distinctions", () => {
  assert.match(article, /2026-10-27/);
  assert.match(article, /2026-12-04/);
  assert.equal((article.match(/date: "2026-12-31"/g) ?? []).length, 3);
  assert.match(article, /through June 2027/);
  assert.match(article, /not an extension of all eye-care services/);
  assert.match(article, /does not announce closure of Rockwood Main Clinic as a whole/);
  assert.match(article, /not a system-wide Medicare insurance-network change/);
  assert.match(article, /did not locate a standalone public newsroom release/);
  assert.match(article, /BreadcrumbSchema/);
  assert.match(article, /"@type": "NewsArticle"/);
  assert.match(article, /alternates: \{ canonical: pageUrl \}/);
  assert.match(article, /<MarketUpdateLinks/);
  assert.match(article, /<Disclaimer/);
});
