import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { metadata as homeMetadata } from "../app/page";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import { getLegacyRedirectDestination, legacyRedirects } from "../lib/legacyRedirects";
import { siteConfig } from "../lib/site";
import { proxy } from "../proxy";

test("legacy redirect map includes required permanent destinations", () => {
  assert.deepEqual(legacyRedirects, {
    "/about": "/our-team",
    "/lynn-wold": "/our-team",
    "/craig-lenhart": "/our-team",
    "/meg-shumaker": "/our-team",
    "/rose-records": "/our-team",
    "/sheryl-manchester": "/our-team",
    "/karen-christensen": "/our-team",
    "/karen-speerstra": "/our-team",
    "/medicare-supplement-insurance-plans": "/medicare-supplements",
    "/medicare-part-d-prescription-plans": "/medicare-part-d",
    "/rx-drug-lookup": "/rx-drug-review",
    "/rx-drug-lookup-form": "/rx-drug-review",
    "/request-a-quote": "/contact",
    "/request-contact": "/contact",
    "/7-things-to-know-about-working-past-65": "/working-past-65-medicare",
  });
});

test("legacy redirect lookup returns canonical destinations", () => {
  assert.equal(getLegacyRedirectDestination("/rx-drug-lookup"), "/rx-drug-review");
  assert.equal(getLegacyRedirectDestination("/request-a-quote"), "/contact");
  assert.equal(getLegacyRedirectDestination("/about"), "/our-team");
  assert.equal(getLegacyRedirectDestination("/does-not-exist"), null);
});

test("proxy returns 301 redirects for legacy URLs", () => {
  const response = proxy(new NextRequest("https://example.com/request-a-quote?source=google"));

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://example.com/contact?source=google");
});

test("proxy permanently redirects the apex root host to canonical www without any port", () => {
  const response = proxy(new NextRequest("https://medicareinspokane.com/"));

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://www.medicareinspokane.com/");
});

test("proxy permanently redirects apex host paths to canonical www without any port", () => {
  const response = proxy(new NextRequest("https://medicareinspokane.com/contact"));

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://www.medicareinspokane.com/contact");
});

test("proxy permanently redirects apex host to canonical www with path and query intact", () => {
  const response = proxy(
    new NextRequest("https://medicareinspokane.com/rx-drug-review?x=1&ref=google"),
  );

  assert.equal(response.status, 301);
  assert.equal(
    response.headers.get("location"),
    "https://www.medicareinspokane.com/rx-drug-review?x=1&ref=google",
  );
});

test("proxy redirects apex host with port 8080 to canonical www without any port", () => {
  const response = proxy(new NextRequest("https://medicareinspokane.com:8080/contact?x=1"));

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://www.medicareinspokane.com/contact?x=1");
});

test("proxy uses forwarded apex host when deciding the canonical redirect", () => {
  const response = proxy(
    new NextRequest("https://medicare-spokane-site-12345-uc.a.run.app/contact?x=1", {
      headers: {
        "x-forwarded-host": "medicareinspokane.com",
      },
    }),
  );

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://www.medicareinspokane.com/contact?x=1");
});

test("proxy uses forwarded apex host with port 8080 when deciding the canonical redirect", () => {
  const response = proxy(
    new NextRequest("https://medicare-spokane-site-12345-uc.a.run.app/contact?x=1", {
      headers: {
        "x-forwarded-host": "medicareinspokane.com:8080",
      },
    }),
  );

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://www.medicareinspokane.com/contact?x=1");
});

test("proxy does not redirect canonical www host before rendering", () => {
  const response = proxy(new NextRequest("https://www.medicareinspokane.com/contact?x=1"));

  assert.notEqual(response.status, 301);
  assert.equal(response.headers.get("location"), null);
});

test("proxy does not redirect Cloud Run hosts before rendering", () => {
  const response = proxy(new NextRequest("https://medicare-spokane-site-12345-uc.a.run.app/contact?x=1"));

  assert.notEqual(response.status, 301);
  assert.equal(response.headers.get("location"), null);
});

test("proxy keeps Cloud Run hosts on legacy redirects instead of forcing www", () => {
  const response = proxy(
    new NextRequest("https://medicare-spokane-site-12345-uc.a.run.app/request-a-quote?source=google"),
  );

  assert.equal(response.status, 301);
  assert.equal(
    response.headers.get("location"),
    "https://medicare-spokane-site-12345-uc.a.run.app/contact?source=google",
  );
});

test("site metadata, sitemap, and robots use the canonical www production URL", () => {
  assert.equal(siteConfig.url, "https://www.medicareinspokane.com");
  assert.equal(homeMetadata.alternates?.canonical, "https://www.medicareinspokane.com");
  assert.equal(homeMetadata.openGraph?.url, "https://www.medicareinspokane.com");
  assert.equal(robots().sitemap, "https://www.medicareinspokane.com/sitemap.xml");

  const sitemapUrls = new Set(sitemap().map((entry) => entry.url));

  assert.ok(sitemapUrls.has("https://www.medicareinspokane.com"));
  assert.ok(sitemapUrls.has("https://www.medicareinspokane.com/contact"));
});

test("sitemap only includes canonical request, team, and prescription URLs", () => {
  const sitemapUrls = new Set(sitemap().map((entry) => entry.url));

  assert.ok(sitemapUrls.has(`${siteConfig.url}/contact`));
  assert.ok(sitemapUrls.has(`${siteConfig.url}/our-team`));
  assert.ok(sitemapUrls.has(`${siteConfig.url}/rx-drug-review`));

  assert.equal(sitemapUrls.has(`${siteConfig.url}/about`), false);
  assert.equal(sitemapUrls.has(`${siteConfig.url}/request-contact`), false);
  assert.equal(sitemapUrls.has(`${siteConfig.url}/request-a-quote`), false);
  assert.equal(sitemapUrls.has(`${siteConfig.url}/rx-drug-lookup`), false);
  assert.equal(sitemapUrls.has(`${siteConfig.url}/rx-drug-lookup-form`), false);
});
