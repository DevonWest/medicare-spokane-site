import { MetadataRoute } from "next";
import { getAllLocalMedicarePaths } from "@/lib/cities";
import { siteConfig } from "@/lib/site";
import { getAllTopicSlugs } from "@/lib/topics";
import { getAllZips } from "@/lib/zips";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;
  const now = new Date();
  const getLocalPagePriority = (path: string) => (path === "/medicare-spokane" ? 0.9 : 0.8);

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${baseUrl}/our-team`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${baseUrl}/medicare-advantage`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/medicare-supplements`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/medicare-part-d`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/compare-medicare-options`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/rx-drug-review`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    {
      url: `${baseUrl}/medicare-plan-review-spokane`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/medicare-appointment-checklist`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    { url: `${baseUrl}/supplemental-insurance`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/carriers`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/testimonials`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    {
      url: `${baseUrl}/turning-65-medicare-spokane`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/helping-parent-with-medicare`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/working-past-65-medicare`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/medicare-advantage-vs-supplement-spokane`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    { url: `${baseUrl}/medicare-faq`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    {
      url: `${baseUrl}/medicare-enrollment-resources`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    { url: `${baseUrl}/resources`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/request-contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  const localPages: MetadataRoute.Sitemap = getAllLocalMedicarePaths().map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: getLocalPagePriority(path),
  }));

  const zipPages: MetadataRoute.Sitemap = getAllZips().map((zip) => ({
    url: `${baseUrl}/zip/${zip}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const topicPages: MetadataRoute.Sitemap = getAllTopicSlugs().map((slug) => ({
    url: `${baseUrl}/topics/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticPages, ...topicPages, ...localPages, ...zipPages];
}
