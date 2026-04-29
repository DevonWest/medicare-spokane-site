export const siteConfig = {
  name: "Medicare Spokane",
  tagline: "Local Medicare Help in Spokane, WA",
  description:
    "Medicare Spokane connects Eastern Washington residents with licensed Medicare insurance agents for personalized, no-cost help choosing Medicare Advantage, Supplement, and Part D plans.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.medicarespokane.com",
  phone: "(509) 555-0100",
  email: "info@medicarespokane.com",
  address: {
    streetAddress: "123 W Riverside Ave, Suite 100",
    addressLocality: "Spokane",
    addressRegion: "WA",
    postalCode: "99201",
    addressCountry: "US",
  },
  social: {
    facebook: "https://facebook.com/medicarespokane",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
  },
};

export type SiteConfig = typeof siteConfig;
