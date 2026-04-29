import { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { isProduction } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  // Beta / staging / preview environments must not be indexed.
  if (!isProduction()) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
