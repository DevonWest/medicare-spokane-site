import type { MetadataRoute } from "next";
import { getAllLocalMedicarePaths } from "@/lib/cities";
import { siteConfig } from "@/lib/site";
import { getAllTopicSlugs } from "@/lib/topics";

const staticPaths = [
  "",
  "/our-team",
  "/editorial-standards",
  "/medicare-advantage",
  "/medicare-supplements",
  "/medicare-part-d",
  "/compare-medicare-options",
  "/rx-drug-review",
  "/medicare-plan-review-spokane",
  "/medicare-appointment-checklist",
  "/supplemental-insurance",
  "/carriers",
  "/testimonials",
  "/turning-65-medicare-spokane",
  "/helping-parent-with-medicare",
  "/working-past-65-medicare",
  "/medicare-advantage-vs-supplement-spokane",
  "/medicare-faq",
  "/medicare-enrollment-resources",
  "/medicare-annual-enrollment-spokane",
  "/medicare-savings-program-extra-help-washington",
  "/moving-to-spokane-medicare",
  "/resources",
  "/health-insurance-spokane",
  "/individual-family-health-insurance-spokane",
  "/self-employed-health-insurance-spokane",
  "/health-insurance-special-enrollment-spokane",
  "/health-insurance-agent-spokane",
  "/contact",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const canonicalPaths = new Set<string>([
    ...staticPaths,
    ...getAllTopicSlugs().map((slug) => `/topics/${slug}`),
    ...getAllLocalMedicarePaths(),
  ]);

  // Only emit signals that are verifiably accurate. Page-level modification
  // dates can be added when they come from maintained content or CMS data.
  return Array.from(canonicalPaths, (path) => ({
    url: `${siteConfig.url}${path}`,
  }));
}
