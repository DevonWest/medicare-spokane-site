import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { metadata as homeMetadata } from "../app/page";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import {
  getLegacyPathResolution,
  getLegacyRedirectDestination,
  legacyRedirects,
  localDirectoryRedirects,
} from "../lib/legacyRedirects";
import { siteConfig } from "../lib/site";
import { proxy } from "../proxy";

test("legacy redirect map includes required permanent destinations", () => {
  assert.deepEqual(legacyRedirects, {
    "/about": "/our-team",
    "/home": "/",
    "/lynn-wold": "/our-team",
    "/craig-lenhart": "/our-team",
    "/meg-shumaker": "/our-team",
    "/rose-records": "/our-team",
    "/profiles/rose-records": "/our-team",
    "/sheryl-manchester": "/our-team",
    "/karen-christensen": "/our-team",
    "/karen-speerstra": "/our-team",
    "/medicare-supplement-insurance-plans": "/medicare-supplements",
    "/medicare-part-d-prescription-plans": "/medicare-part-d",
    "/videos": "/resources",
    "/rx-drug-lookup": "/rx-drug-review",
    "/rx-drug-lookup-form": "/rx-drug-review",
    "/request-a-quote": "/contact",
    "/request-contact": "/contact",
    "/7-things-to-know-about-working-past-65": "/working-past-65-medicare",
  });
});

test("legacy redirect lookup returns canonical destinations and normalizes trailing slashes", () => {
  assert.equal(getLegacyRedirectDestination("/home"), "/");
  assert.equal(getLegacyRedirectDestination("/home/"), "/");
  assert.equal(getLegacyRedirectDestination("/videos"), "/resources");
  assert.equal(getLegacyRedirectDestination("/rx-drug-lookup"), "/rx-drug-review");
  assert.equal(getLegacyRedirectDestination("/request-a-quote"), "/contact");
  assert.equal(getLegacyRedirectDestination("/about"), "/our-team");
  assert.equal(getLegacyRedirectDestination("/profiles/rose-records/"), "/our-team");
  assert.equal(getLegacyRedirectDestination("/directory/cheney-wa/"), "/medicare-cheney");
  assert.equal(getLegacyRedirectDestination("/does-not-exist"), null);
});

test("proxy returns 301 redirects for legacy URLs", () => {
  const response = proxy(new NextRequest("https://example.com/request-a-quote?source=google"));

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://example.com/contact?source=google");
});

test("local directory redirect map includes required canonical destinations", () => {
  assert.deepEqual(localDirectoryRedirects, {
    "/directory/spokane-wa": "/medicare-spokane",
    "/directory/spokane-valley-wa": "/medicare-spokane-valley",
    "/directory/cheney-wa": "/medicare-cheney",
    "/directory/airway-heights-wa": "/medicare-airway-heights",
    "/directory/liberty-lake-wa": "/medicare-liberty-lake",
    "/directory/medical-lake-wa": "/medicare-medical-lake",
    "/directory/mead-wa": "/medicare-mead",
    "/directory/deer-park-wa": "/medicare-deer-park",
  });
});

test("legacy path resolution returns 410 for removed and unknown legacy directory URLs", () => {
  assert.deepEqual(getLegacyPathResolution("/charlie-howell"), { type: "gone" });
  assert.deepEqual(getLegacyPathResolution("/charlie-howell/"), { type: "gone" });
  assert.deepEqual(getLegacyPathResolution("/directory/monument-or"), { type: "gone" });
  assert.deepEqual(getLegacyPathResolution("/Directory/hamilton-wa/"), { type: "gone" });
});

test("proxy redirects /home to the canonical homepage", () => {
  const response = proxy(new NextRequest("https://www.medicareinspokane.com/home"));

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://www.medicareinspokane.com/");
});

test("proxy redirects /videos to /resources", () => {
  const response = proxy(new NextRequest("https://www.medicareinspokane.com/videos"));

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://www.medicareinspokane.com/resources");
});

test("proxy redirects /rx-drug-lookup to /rx-drug-review", () => {
  const response = proxy(new NextRequest("https://www.medicareinspokane.com/rx-drug-lookup"));

  assert.equal(response.status, 301);
  assert.equal(
    response.headers.get("location"),
    "https://www.medicareinspokane.com/rx-drug-review",
  );
});

test("proxy redirects /request-a-quote to /contact", () => {
  const response = proxy(new NextRequest("https://www.medicareinspokane.com/request-a-quote"));

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://www.medicareinspokane.com/contact");
});

test("proxy redirects /karen-christensen to /our-team", () => {
  const response = proxy(new NextRequest("https://www.medicareinspokane.com/karen-christensen"));

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://www.medicareinspokane.com/our-team");
});

test("proxy redirects /profiles/rose-records to /our-team", () => {
  const response = proxy(new NextRequest("https://www.medicareinspokane.com/profiles/rose-records"));

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://www.medicareinspokane.com/our-team");
});

test("proxy redirects /directory/cheney-wa to /medicare-cheney", () => {
  const response = proxy(new NextRequest("https://www.medicareinspokane.com/directory/cheney-wa"));

  assert.equal(response.status, 301);
  assert.equal(
    response.headers.get("location"),
    "https://www.medicareinspokane.com/medicare-cheney",
  );
});

test("proxy redirects old uppercase directory URLs to local medicare pages without legacy query strings", () => {
  const response = proxy(
    new NextRequest("https://www.medicareinspokane.com/Directory/deer-park-wa?from=deer-park-wa"),
  );

  assert.equal(response.status, 301);
  assert.equal(
    response.headers.get("location"),
    "https://www.medicareinspokane.com/medicare-deer-park",
  );
});

test("proxy returns 410 for /charlie-howell", () => {
  const response = proxy(new NextRequest("https://www.medicareinspokane.com/charlie-howell"));

  assert.equal(response.status, 410);
  assert.equal(response.headers.get("location"), null);
});

test("proxy returns 410 for unknown directory URLs instead of 5xx", () => {
  const response = proxy(
    new NextRequest("https://www.medicareinspokane.com/Directory/monument-or?from=monument-or"),
  );

  assert.equal(response.status, 410);
  assert.equal(response.headers.get("location"), null);
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

test("proxy does not redirect apex host when it arrives on a non-canonical port", () => {
  const response = proxy(new NextRequest("https://medicareinspokane.com:3000/contact?x=1"));

  assert.notEqual(response.status, 301);
  assert.equal(response.headers.get("location"), null);
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
  assert.equal(sitemapUrls.has(`${siteConfig.url}/charlie-howell`), false);
  assert.equal(sitemapUrls.has(`${siteConfig.url}/home`), false);
  assert.equal(sitemapUrls.has(`${siteConfig.url}/videos`), false);
  assert.equal(sitemapUrls.has(`${siteConfig.url}/karen-christensen`), false);
  assert.equal(sitemapUrls.has(`${siteConfig.url}/profiles/rose-records`), false);
  assert.equal(sitemapUrls.has(`${siteConfig.url}/request-contact`), false);
  assert.equal(sitemapUrls.has(`${siteConfig.url}/request-a-quote`), false);
  assert.equal(sitemapUrls.has(`${siteConfig.url}/rx-drug-lookup`), false);
  assert.equal(sitemapUrls.has(`${siteConfig.url}/rx-drug-lookup-form`), false);
  assert.equal(Array.from(sitemapUrls).some((url) => url.includes("/directory/")), false);
  assert.equal(Array.from(sitemapUrls).some((url) => url.includes("/Directory/")), false);
});
