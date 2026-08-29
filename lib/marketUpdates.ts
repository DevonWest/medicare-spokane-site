import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export interface MarketUpdate {
  path: `/${string}`;
  category: "2027-market" | "local-medicare-news";
  title: string;
  shortTitle: string;
  summary: string;
  publishedDate: `${number}-${number}-${number}`;
  publishedLabel: string;
  modifiedDate: `${number}-${number}-${number}`;
  modifiedLabel: string;
  spokaneStatus: "confirmed" | "not-confirmed";
  spokaneStatusLabel: string;
}

export const marketUpdatesHub = {
  path: "/2027-medicare-changes-spokane" as const,
  title: "2027 Medicare Changes in Spokane",
  shortTitle: "Spokane 2027 Coverage Market Updates",
  description:
    "Track confirmed 2027 Medicare and health insurance market announcements for Spokane County and Washington, with clear labels for what remains unconfirmed.",
  modifiedDate: "2026-08-28",
};

/**
 * Source of truth for time-sensitive Spokane market coverage.
 *
 * Adding a published article here automatically adds it to the standard
 * sitemap, the two-day Google News sitemap window, homepage and Resources
 * discovery links, related-article links, and the recurring Search Console
 * monitoring set. Articles in the 2027 market category also appear in the
 * dedicated 2027 tracker.
 */
export const marketUpdates: readonly MarketUpdate[] = [
  {
    path: "/spokane-wildfire-medicare-help-2026",
    category: "local-medicare-news",
    title:
      "Spokane Wildfire Medicare Help: Prescriptions, Equipment, Dialysis and Enrollment Rights",
    shortTitle: "Spokane Wildfire Medicare Help and Enrollment Rights",
    summary:
      "Official Medicare protections are active for Washington wildfires affecting Spokane County, including help with prescriptions, equipment, dialysis and some missed enrollment periods.",
    publishedDate: "2026-08-22",
    publishedLabel: "August 22, 2026",
    modifiedDate: "2026-08-22",
    modifiedLabel: "August 22, 2026",
    spokaneStatus: "confirmed",
    spokaneStatusLabel: "CMS protections active in Spokane County",
  },
  {
    path: "/providence-health-plan-ending-2027-washington",
    category: "2027-market",
    title:
      "Providence Health Plan 2027 Changes in Washington: What Spokane Members Should Know",
    shortTitle: "Providence Health Plan 2027 Changes in Washington",
    summary:
      "Providence individual and family coverage is ending, while Medicare Advantage and Medicare Supplement details are still pending.",
    publishedDate: "2026-08-19",
    publishedLabel: "August 19, 2026",
    modifiedDate: "2026-08-22",
    modifiedLabel: "August 22, 2026",
    spokaneStatus: "confirmed",
    spokaneStatusLabel: "Washington individual coverage ending",
  },
  {
    path: "/costco-scan-medicare-spokane",
    category: "2027-market",
    title: "Costco and SCAN Medicare Supplement Washington Filing: Plans and Benefits",
    shortTitle: "Costco and SCAN Medicare Supplement Filing",
    summary:
      "A public Washington filing proposes Plans A, G and N, discounts and Costco-only benefits for 2027; regulatory approval and final rates remain pending.",
    publishedDate: "2026-08-18",
    publishedLabel: "August 18, 2026",
    modifiedDate: "2026-08-28",
    modifiedLabel: "August 28, 2026",
    spokaneStatus: "confirmed",
    spokaneStatusLabel: "Washington filing under regulatory review",
  },
] as const;

export function getMarketUpdatesNewestFirst(): readonly MarketUpdate[] {
  return [...marketUpdates].sort(
    (left, right) =>
      right.publishedDate.localeCompare(left.publishedDate) ||
      left.title.localeCompare(right.title),
  );
}

export function getLatestMarketUpdate(): MarketUpdate {
  const [latest] = getMarketUpdatesNewestFirst();
  if (!latest) {
    throw new Error("At least one Spokane market update must be configured.");
  }
  return latest;
}

export function get2027MarketUpdatesNewestFirst(): readonly MarketUpdate[] {
  return getMarketUpdatesNewestFirst().filter(
    (update) => update.category === "2027-market",
  );
}

export function getMarketUpdateByPath(path: string): MarketUpdate | undefined {
  return marketUpdates.find((update) => update.path === path);
}

export function getMarketUpdateSitemapEntries(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteConfig.url}${marketUpdatesHub.path}`,
      lastModified: marketUpdatesHub.modifiedDate,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    ...getMarketUpdatesNewestFirst().map((update) => ({
      url: `${siteConfig.url}${update.path}`,
      lastModified: update.modifiedDate,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}

export function getMarketUpdateMonitoringPaths(): readonly `/${string}`[] {
  return [
    marketUpdatesHub.path,
    ...getMarketUpdatesNewestFirst().map((update) => update.path),
  ];
}

export function getCurrentNewsUpdates(
  now = new Date(),
): readonly MarketUpdate[] {
  const nowMilliseconds = now.getTime();
  if (Number.isNaN(nowMilliseconds)) {
    return [];
  }

  const twoDaysMilliseconds = 2 * 24 * 60 * 60 * 1_000;
  return getMarketUpdatesNewestFirst().filter((update) => {
    const publicationMilliseconds = Date.parse(`${update.publishedDate}T00:00:00Z`);
    const ageMilliseconds = nowMilliseconds - publicationMilliseconds;
    return ageMilliseconds >= 0 && ageMilliseconds < twoDaysMilliseconds;
  });
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function buildMarketUpdatesNewsSitemap(now = new Date()): string {
  const currentNewsPaths = new Set(
    getCurrentNewsUpdates(now).map((update) => update.path),
  );
  const nowMilliseconds = now.getTime();
  const publishedUpdates = Number.isNaN(nowMilliseconds)
    ? []
    : getMarketUpdatesNewestFirst().filter(
        (update) =>
          Date.parse(`${update.publishedDate}T00:00:00Z`) <= nowMilliseconds,
      );

  const urls = publishedUpdates
    .map((update) => {
      const newsMetadata = currentNewsPaths.has(update.path)
        ? `
    <news:news>
      <news:publication>
        <news:name>${escapeXml(siteConfig.name)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${update.publishedDate}</news:publication_date>
      <news:title>${escapeXml(update.title)}</news:title>
    </news:news>`
        : "";

      return `  <url>
    <loc>${escapeXml(`${siteConfig.url}${update.path}`)}</loc>${newsMetadata}
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urls ? `\n${urls}\n` : ""}</urlset>\n`;
}
