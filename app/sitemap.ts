import { MetadataRoute } from "next";
import { getAllLocalMedicarePaths } from "@/lib/cities";
import { getMarketUpdateSitemapEntries } from "@/lib/marketUpdates";
import {
  PROVIDER_NETWORK_CHECKED_AT,
  PROVIDER_NETWORK_GUIDE_PATH,
} from "@/lib/providerNetworks";
import { siteConfig } from "@/lib/site";
import { getAllTopicSlugs } from "@/lib/topics";
import { getAllZips } from "@/lib/zips";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;
  // Only emit lastModified when an editorial date is tracked below or in the
  // market-update registry. Deployment time is not a content update.
  const getLocalPagePriority = (path: string) => (path === "/medicare-spokane" ? 0.9 : 0.8);

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/our-team`, changeFrequency: "monthly", priority: 0.85 },
    {
      url: `${baseUrl}${siteConfig.editorialStandardsPath}`,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    { url: `${baseUrl}/medicare-advantage`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/medicare-supplements`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/medicare-part-d`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/medicare-stevens-county`, lastModified: "2026-09-05", changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/compare-medicare-options`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/rx-drug-review`, changeFrequency: "weekly", priority: 0.8 },
    {
      url: `${baseUrl}/medicare-plan-review-spokane`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}${PROVIDER_NETWORK_GUIDE_PATH}`,
      lastModified: PROVIDER_NETWORK_CHECKED_AT,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/providence-medicare-advantage-plans-spokane`,
      lastModified: PROVIDER_NETWORK_CHECKED_AT,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/multicare-medicare-advantage-plans-spokane`,
      lastModified: "2026-09-05",
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/inland-imaging-medicare-plans-spokane`,
      lastModified: PROVIDER_NETWORK_CHECKED_AT,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/medicare-appointment-checklist`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    { url: `${baseUrl}/supplemental-insurance`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/carriers`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/testimonials`, changeFrequency: "monthly", priority: 0.7 },
    {
      url: `${baseUrl}/turning-65-medicare-spokane`,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/helping-parent-with-medicare`,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/working-past-65-medicare`,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/medicare-advantage-vs-supplement-spokane`,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    { url: `${baseUrl}/medicare-faq`, changeFrequency: "monthly", priority: 0.8 },
    {
      url: `${baseUrl}/medicare-enrollment-resources`,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/medicare-annual-enrollment-spokane`,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/medicare-savings-program-extra-help-washington`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/moving-to-spokane-medicare`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    { url: `${baseUrl}/resources`, changeFrequency: "monthly", priority: 0.8 },
    {
      url: `${baseUrl}/health-insurance-spokane`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/individual-family-health-insurance-spokane`,
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${baseUrl}/self-employed-health-insurance-spokane`,
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${baseUrl}/health-insurance-special-enrollment-spokane`,
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${baseUrl}/health-insurance-agent-spokane`,
      changeFrequency: "monthly",
      priority: 0.65,
    },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: 0.7 },
  ];

  const localPages: MetadataRoute.Sitemap = getAllLocalMedicarePaths().map((path) => ({
    url: `${baseUrl}${path}`,
    ...(path === "/medicare-spokane" ? { lastModified: "2026-09-05" } : {}),
    changeFrequency: "monthly",
    priority: getLocalPagePriority(path),
  }));

  const zipPages: MetadataRoute.Sitemap = getAllZips().map((zip) => ({
    url: `${baseUrl}/zip/${zip}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const topicPages: MetadataRoute.Sitemap = getAllTopicSlugs().map((slug) => ({
    url: `${baseUrl}/topics/${slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    ...staticPages,
    ...getMarketUpdateSitemapEntries(),
    ...topicPages,
    ...localPages,
    ...zipPages,
  ];
}
