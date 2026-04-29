import { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { getAllCitySlugs } from "@/lib/cities";
import { getAllZips } from "@/lib/zips";
import { getAllTopicSlugs } from "@/lib/topics";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/medicare-spokane`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/turning-65-medicare-spokane`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/medicare-advantage-vs-supplement-spokane`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const cityPages: MetadataRoute.Sitemap = getAllCitySlugs().map((slug) => ({
    url: `${baseUrl}/cities/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const zipPages: MetadataRoute.Sitemap = getAllZips().map((zip) => ({
    url: `${baseUrl}/zip/${zip}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const topicPages: MetadataRoute.Sitemap = getAllTopicSlugs().map((slug) => ({
    url: `${baseUrl}/topics/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.9,
  }));

  return [...staticPages, ...topicPages, ...cityPages, ...zipPages];
}
