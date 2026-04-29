/**
 * Site environment helpers.
 *
 * NEXT_PUBLIC_SITE_ENV controls indexing + analytics gating:
 *   - "production"          → fully indexed, GTM enabled
 *   - "staging" / "beta" /
 *     "preview" / anything
 *     other than production → noindex, nofollow; GTM still loads only if
 *     NEXT_PUBLIC_GTM_ID is set, but events are tagged with the env so GTM
 *     can filter them out.
 *
 * Defaults to "production" so existing prod deploys without the var keep
 * the same indexable behaviour they had before this var was introduced.
 */
export type SiteEnv = "production" | "staging" | "beta" | "preview" | "development";

export function getSiteEnv(): SiteEnv {
  const raw = (process.env.NEXT_PUBLIC_SITE_ENV || "production").toLowerCase();
  if (
    raw === "production" ||
    raw === "staging" ||
    raw === "beta" ||
    raw === "preview" ||
    raw === "development"
  ) {
    return raw;
  }
  return "staging";
}

export function isProduction(): boolean {
  return getSiteEnv() === "production";
}

/** GTM container ID, e.g. "GTM-XXXXXXX". Empty string disables GTM. */
export function getGtmId(): string {
  return (process.env.NEXT_PUBLIC_GTM_ID || "").trim();
}
