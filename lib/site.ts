export const siteConfig = {
  name: "Medicare in Spokane",
  legalName: "Medicare in Spokane",
  agencyDescriptor: "a licensed independent insurance agency",
  tagline: "Local Medicare Help in Spokane, WA",
  description:
    "Medicare in Spokane is a licensed independent insurance agency helping Spokane-area residents understand and compare Medicare Advantage, Medicare Supplement, and Part D options.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.medicareinspokane.com",
  phone: "(509) 555-0100",
  email: "info@medicareinspokane.com",
  address: {
    streetAddress: "123 W Riverside Ave, Suite 100",
    addressLocality: "Spokane",
    addressRegion: "WA",
    postalCode: "99201",
    addressCountry: "US",
  },
  social: {
    facebook: "https://facebook.com/medicareinspokane",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
  },
};

export type SiteConfig = typeof siteConfig;
