import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export interface MarketUpdate {
  path: `/${string}`;
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
  shortTitle: "Spokane Medicare Market Updates",
  description:
    "Track confirmed 2027 Medicare market announcements and what remains unconfirmed for Spokane County, Washington.",
  modifiedDate: "2026-08-19",
};

/**
 * Source of truth for time-sensitive Spokane market coverage.
 *
 * Adding a published article here automatically adds it to the standard
 * sitemap, the two-day Google News sitemap window, the market-update hub,
 * homepage and Resources discovery links, related-article links, and the
 * recurring Search Console monitoring set.
 */
export const marketUpdates: readonly MarketUpdate[] = [
  {
    path: "/costco-scan-medicare-spokane",
    title: "Costco and SCAN Medicare Partnership: What Spokane Residents Should Know",
    shortTitle: "Costco and SCAN Medicare Partnership: Spokane Update",
    summary:
      "See what was announced, what remains unknown, and what Spokane residents should wait to verify.",
    publishedDate: "2026-08-18",
    publishedLabel: "August 18, 2026",
    modifiedDate: "2026-08-18",
    modifiedLabel: "August 18, 2026",
    spokaneStatus: "not-confirmed",
    spokaneStatusLabel: "Spokane availability not confirmed",
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
  const urls = getCurrentNewsUpdates(now)
    .map(
      (update) => `  <url>
    <loc>${escapeXml(`${siteConfig.url}${update.path}`)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(siteConfig.name)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${update.publishedDate}</news:publication_date>
      <news:title>${escapeXml(update.title)}</news:title>
    </news:news>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urls ? `\n${urls}\n` : ""}</urlset>\n`;
}
