import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { generateMetadata as generateDirectoryMetadata } from "../app/directory/[location]/page";
import { metadata as homeMetadata } from "../app/page";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import {
  getCanonicalDirectoryDestination,
  getLegacyPathResolution,
  getLegacyRedirectDestination,
  legacyRedirects,
  isKnownDirectoryPath,
  localDirectoryPages,
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
    "/profiles/karen-speerstra": "/our-team",
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
  assert.equal(getLegacyRedirectDestination("/charlie-howell"), null);
  assert.equal(getLegacyRedirectDestination("/profiles/rose-records/"), "/our-team");
  assert.equal(getLegacyRedirectDestination("/does-not-exist"), null);
});

test("legacy redirect lookup is case-insensitive for legacy capitalization", () => {
  assert.equal(getLegacyRedirectDestination("/Home"), "/");
  assert.equal(getLegacyRedirectDestination("/Home/"), "/");
  assert.equal(getLegacyRedirectDestination("/Profiles/Karen-Speerstra"), "/our-team");
  assert.equal(getLegacyRedirectDestination("/Profiles/Karen-Speerstra/"), "/our-team");
});

test("proxy returns 301 redirects for legacy URLs", () => {
  const response = proxy(new NextRequest("https://example.com/request-a-quote?source=google"));

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://example.com/contact?source=google");
});

test("local directory pages include required canonical destinations", () => {
  assert.deepEqual(localDirectoryPages, {
    "/directory/spokane-wa": "/directory/spokane-wa",
    "/directory/spokane-valley-wa": "/directory/spokane-valley-wa",
    "/directory/cheney-wa": "/directory/cheney-wa",
    "/directory/airway-heights-wa": "/directory/airway-heights-wa",
    "/directory/liberty-lake-wa": "/directory/liberty-lake-wa",
    "/directory/medical-lake-wa": "/directory/medical-lake-wa",
    "/directory/mead-wa": "/directory/mead-wa",
    "/directory/deer-park-wa": "/directory/deer-park-wa",
  });
});

test("legacy path resolution marks /charlie-howell as gone", () => {
  assert.deepEqual(getLegacyPathResolution("/charlie-howell"), { type: "gone" });
  assert.deepEqual(getLegacyPathResolution("/charlie-howell/"), { type: "gone" });
});

test("directory helpers normalize case, trailing slash, and supported locations", () => {
  assert.equal(getCanonicalDirectoryDestination("/Directory/deer-park-wa"), "/directory/deer-park-wa");
  assert.equal(getCanonicalDirectoryDestination("/directory/steptoe-wa/"), "/directory/steptoe-wa");
  assert.equal(getCanonicalDirectoryDestination("/contact"), null);
  assert.equal(isKnownDirectoryPath("/directory/deer-park-wa/"), true);
  assert.equal(isKnownDirectoryPath("/directory/steptoe-wa/"), false);
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

test("proxy allows canonical lowercase directory URLs to render", () => {
  const response = proxy(new NextRequest("https://www.medicareinspokane.com/directory/cheney-wa"));

  assert.notEqual(response.status, 301);
  assert.equal(response.headers.get("location"), null);
});

test("proxy redirects old uppercase directory URLs to lowercase directory URLs without from", () => {
  const response = proxy(
    new NextRequest("https://www.medicareinspokane.com/Directory/deer-park-wa?from=deer-park-wa"),
  );

  assert.equal(response.status, 301);
  assert.equal(
    response.headers.get("location"),
    "https://www.medicareinspokane.com/directory/deer-park-wa",
  );
});

test("proxy returns 410 Gone for /charlie-howell instead of redirecting", () => {
  const response = proxy(new NextRequest("https://www.medicareinspokane.com/charlie-howell"));

  assert.equal(response.status, 410);
  assert.equal(response.headers.get("location"), null);
});

test("proxy returns 410 Gone for /charlie-howell/ with trailing slash", () => {
  const response = proxy(new NextRequest("https://www.medicareinspokane.com/charlie-howell/"));

  assert.equal(response.status, 410);
  assert.equal(response.headers.get("location"), null);
});

test("proxy redirects /Home (legacy capitalization) to the canonical homepage", () => {
  const response = proxy(new NextRequest("https://www.medicareinspokane.com/Home"));

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://www.medicareinspokane.com/");
});

test("proxy redirects /Home/ (legacy capitalization with trailing slash) to the canonical homepage", () => {
  const response = proxy(new NextRequest("https://www.medicareinspokane.com/Home/"));

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://www.medicareinspokane.com/");
});

test("proxy redirects /Profiles/Karen-Speerstra to /our-team", () => {
  const response = proxy(
    new NextRequest("https://www.medicareinspokane.com/Profiles/Karen-Speerstra"),
  );

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://www.medicareinspokane.com/our-team");
});

test("proxy redirects /Profiles/Karen-Speerstra/ with trailing slash to /our-team", () => {
  const response = proxy(
    new NextRequest("https://www.medicareinspokane.com/Profiles/Karen-Speerstra/"),
  );

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://www.medicareinspokane.com/our-team");
});

const legacyDirectoryRedirectCases: Array<{ from: string; to: string }> = [
  { from: "/directory/mica-wa", to: "/medicare-spokane" },
  { from: "/directory/mica-wa/", to: "/medicare-spokane" },
  { from: "/directory/newman-lake-wa", to: "/medicare-spokane-valley" },
  { from: "/directory/newman-lake-wa/", to: "/medicare-spokane-valley" },
  { from: "/directory/fairfield-wa", to: "/medicare-spokane" },
  { from: "/directory/fairfield-wa/", to: "/medicare-spokane" },
  { from: "/directory/freeman-wa", to: "/medicare-spokane" },
  { from: "/directory/freeman-wa/", to: "/medicare-spokane" },
  { from: "/directory/four-lakes-wa", to: "/medicare-spokane" },
  { from: "/directory/four-lakes-wa/", to: "/medicare-spokane" },
];

for (const { from, to } of legacyDirectoryRedirectCases) {
  test(`proxy redirects legacy directory URL ${from} to ${to}`, () => {
    const response = proxy(new NextRequest(`https://www.medicareinspokane.com${from}`));

    assert.equal(response.status, 301);
    assert.equal(response.headers.get("location"), `https://www.medicareinspokane.com${to}`);
  });
}

test("proxy redirects legacy directory URL with from query to the closest active page without query", () => {
  const response = proxy(
    new NextRequest("https://www.medicareinspokane.com/directory/mica-wa?from=anywhere"),
  );

  assert.equal(response.status, 301);
  assert.equal(
    response.headers.get("location"),
    "https://www.medicareinspokane.com/medicare-spokane",
  );
});

const legacyGoneDirectoryPaths: string[] = [
  "/directory/blue-lake-ca/",
  "/directory/tensed-id/",
  "/directory/irrigon-or/",
  "/directory/hatton-wa/",
  "/directory/grand-coulee-wa/",
  "/directory/strawberry-valley-ca/",
  "/directory/underwood-wa/",
  "/directory/starbuck-wa/",
  "/directory/eagleville-ca/",
  "/directory/goldendale-wa/",
  "/directory/washtucna-wa/",
  "/directory/steptoe-wa/",
  "/Directory/selma-or",
  "/directory/big-bend-ca/",
  "/Directory/hornbrook-ca",
  "/Directory/greenview-ca",
  "/directory/weott-ca/",
  "/Directory/reedsport-or",
  "/Directory/meadow-valley-ca",
  "/directory/lamont-wa/",
  "/directory/culver-or/",
  "/directory/oregon-house-ca/",
  "/directory/nespelem-wa/",
  "/directory/mesa-wa/",
  "/directory/harrison-id/",
  "/directory/williams-or/",
  "/Directory/omak-wa",
  "/Directory/trinity-center-ca",
  "/directory/silverton-or/",
  "/Directory/walla-walla-wa",
  "/directory/merlin-or/",
  "/directory/prairie-city-or/",
  "/directory/rockport-wa/",
  "/directory/loyalton-ca/",
  "/directory/pleasant-hill-or/",
  "/Directory/beverly-wa",
  "/directory/burney-ca/",
  "/directory/alderpoint-ca/",
  "/directory/murray-id/",
  "/Directory/clackamas-or",
  "/directory/shingletown-ca/",
  "/directory/broadbent-or/",
  "/directory/mount-angel-or/",
  "/directory/tygh-valley-or/",
  "/Directory/artois-ca",
  "/directory/umatilla-or/",
  "/directory/alsea-or/",
  "/directory/plummer-id/",
  "/Directory/naches-wa",
];

for (const path of legacyGoneDirectoryPaths) {
  test(`proxy returns 410 Gone for irrelevant legacy directory URL ${path}`, () => {
    const response = proxy(new NextRequest(`https://www.medicareinspokane.com${path}`));

    assert.equal(response.status, 410);
    assert.equal(response.headers.get("location"), null);
  });
}

const legacyGoneDirectoryQueryCases: Array<{ path: string; query: string }> = [
  { path: "/Directory/selma-or", query: "from=o-brien-or" },
  { path: "/Directory/hornbrook-ca", query: "from=talent-or" },
  { path: "/Directory/walla-walla-wa", query: "from=cayuse-or" },
  { path: "/Directory/clackamas-or", query: "from=gresham-or" },
  { path: "/Directory/artois-ca", query: "from=red-bluff-ca" },
  { path: "/Directory/naches-wa", query: "from=white-swan-wa" },
];

for (const { path, query } of legacyGoneDirectoryQueryCases) {
  test(`proxy returns 410 Gone for ${path}?${query} regardless of query string`, () => {
    const response = proxy(
      new NextRequest(`https://www.medicareinspokane.com${path}?${query}`),
    );

    assert.equal(response.status, 410);
    assert.equal(response.headers.get("location"), null);
  });
}

test("sitemap excludes all legacy 404-coverage URLs", () => {
  const sitemapUrls = new Set(sitemap().map((entry) => entry.url));
  const baseUrl = siteConfig.url;

  const legacyPathsThatMustNotAppear = [
    "/Home",
    "/Home/",
    "/Profiles/Karen-Speerstra",
    "/Profiles/Karen-Speerstra/",
    "/charlie-howell",
    "/charlie-howell/",
    ...legacyDirectoryRedirectCases.map((entry) => entry.from),
    ...legacyGoneDirectoryPaths,
  ];

  for (const path of legacyPathsThatMustNotAppear) {
    assert.equal(
      sitemapUrls.has(`${baseUrl}${path}`),
      false,
      `sitemap should not include ${path}`,
    );
  }
});

test("proxy never returns 404 or 5xx for any handled legacy URL", () => {
  const handledLegacyUrls = [
    "/Home",
    "/Home/",
    "/home",
    "/home/",
    "/Profiles/Karen-Speerstra",
    "/Profiles/Karen-Speerstra/",
    "/profiles/karen-speerstra",
    "/profiles/karen-speerstra/",
    "/charlie-howell",
    "/charlie-howell/",
    ...legacyDirectoryRedirectCases.map((entry) => entry.from),
    ...legacyGoneDirectoryPaths,
    ...legacyGoneDirectoryQueryCases.map(({ path, query }) => `${path}?${query}`),
  ];

  for (const path of handledLegacyUrls) {
    const response = proxy(new NextRequest(`https://www.medicareinspokane.com${path}`));

    assert.notEqual(response.status, 404, `${path} should not return 404`);
    assert.ok(
      response.status < 500,
      `${path} should not return 5xx (got ${response.status})`,
    );
  }
});

test("proxy never produces a redirect Location with port 8080 for handled legacy URLs", () => {
  const redirectingUrls = [
    "/Home",
    "/Home/",
    "/Profiles/Karen-Speerstra",
    "/Profiles/Karen-Speerstra/",
    ...legacyDirectoryRedirectCases.map((entry) => entry.from),
  ];

  for (const path of redirectingUrls) {
    const response = proxy(new NextRequest(`https://www.medicareinspokane.com${path}`));
    const location = response.headers.get("location");

    assert.ok(location, `${path} should have a Location header`);
    assert.equal(
      location?.includes(":8080"),
      false,
      `${path} redirect Location must not contain :8080`,
    );
  }
});

test("proxy returns 410 Gone for unknown uppercase /Directory/* paths even with from query", () => {
  const response = proxy(
    new NextRequest("https://www.medicareinspokane.com/Directory/monument-or?from=monument-or"),
  );

  assert.equal(response.status, 410);
  assert.equal(response.headers.get("location"), null);
});

test("proxy returns 410 for unknown canonical directory URLs instead of 5xx or 401", () => {
  const response = proxy(
    new NextRequest("https://www.medicareinspokane.com/directory/steptoe-wa"),
  );

  assert.equal(response.status, 410);
  assert.equal(response.headers.get("location"), null);
});

test("proxy allows canonical supported directory URLs to render", () => {
  const response = proxy(
    new NextRequest("https://www.medicareinspokane.com/directory/deer-park-wa"),
  );

  assert.notEqual(response.status, 301);
  assert.equal(response.headers.get("location"), null);
});

test("directory page metadata uses a self-referencing canonical URL", async () => {
  const metadata = await generateDirectoryMetadata({
    params: Promise.resolve({ location: "deer-park-wa" }),
  });

  assert.equal(
    metadata.alternates?.canonical,
    "https://www.medicareinspokane.com/directory/deer-park-wa",
  );
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
