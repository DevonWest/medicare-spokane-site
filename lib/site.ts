/**
 * Source-of-truth business / brand configuration.
 *
 * Reflects the live site at https://www.medicareinspokane.com — Health
 * Insurance Options LLC, doing business as "Medicare in Spokane by Health
 * Insurance Options". Compliance language here is intentionally limited to
 * what CMS marketing rules allow for a licensed independent insurance agency
 * that does not represent every plan in the area.
 */
export const siteConfig = {
  /** Public-facing brand / site name. */
  name: "Medicare in Spokane by Health Insurance Options",
  /** Short brand for nav, breadcrumbs, etc. */
  shortName: "Medicare in Spokane",
  /** Legal entity that holds the insurance license. */
  legalName: "Health Insurance Options LLC",
  /** How we describe ourselves for compliance purposes. */
  agencyDescriptor: "a licensed independent insurance agency",
  /** Brand positioning / tagline used on the live site. */
  positioning: "Guiding You Through the Confusion of Medicare.",
  tagline: "Local Spokane Medicare Help",
  description:
    "Health Insurance Options LLC is a licensed independent insurance agency in Spokane, WA, helping local Medicare beneficiaries compare Medicare Advantage, Medicare Supplement, Part D, and supplemental insurance options. No-cost consultations with a licensed insurance professional.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.medicareinspokane.com",
  phone: "509-353-0476",
  email: "info@medicareinspokane.com",
  hours: "Mon – Fri, 9:00 AM – 5:00 PM Pacific",
  address: {
    buildingName: "Providence Medical Building",
    streetAddress: "820 South McClellan LL#10",
    addressLocality: "Spokane",
    addressRegion: "WA",
    postalCode: "99204",
    addressCountry: "US",
  },
  social: {
    facebook: "",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
  },
  /**
   * Current CMS-style disclaimer required by the live site. Use this verbatim
   * wherever a plan/carrier disclosure is needed.
   */
  disclaimer:
    "We do not offer every plan available in your area. Currently, we represent 8 organizations which offer 75 products in your area. Please contact Medicare.gov, 1-800-MEDICARE, or your local State Health Insurance Assistance Program (SHIP) to get information on all of your options.",
  /**
   * Non-affiliation disclosure. The agency is independent and not connected to
   * any government Medicare program.
   */
  nonAffiliation:
    "Health Insurance Options LLC is a licensed independent insurance agency. We are not affiliated with or endorsed by the U.S. Centers for Medicare & Medicaid Services (CMS), Medicare.gov, the Social Security Administration, or the U.S. Department of Health and Human Services (HHS).",
};

export type SiteConfig = typeof siteConfig;

/** Digits-only phone number, suitable for `tel:` links. */
export const phoneDigits = siteConfig.phone.replace(/\D/g, "");

/** Pre-built `tel:` href. */
export const telHref = `tel:${phoneDigits}`;
