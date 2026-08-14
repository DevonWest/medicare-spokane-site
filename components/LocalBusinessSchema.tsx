import { spokaneAreaCities } from "@/lib/cities";
import { siteConfig } from "@/lib/site";

export default function LocalBusinessSchema() {
  const sameAs = [siteConfig.social.facebook].filter(Boolean);
  const organizationId = `${siteConfig.url}#organization`;
  const websiteId = `${siteConfig.url}#website`;
  const logoUrl = `${siteConfig.url}/brand/hio-logo.png`;
  const horizontalLogoUrl = `${siteConfig.url}/brand/logo-horizontal.png`;

  const organization = {
    "@type": ["Organization", "InsuranceAgency", "LocalBusiness"],
    "@id": organizationId,
    name: siteConfig.legalName,
    alternateName: [siteConfig.name, siteConfig.shortName],
    legalName: siteConfig.legalName,
    description: siteConfig.description,
    slogan: siteConfig.positioning,
    url: siteConfig.url,
    logo: {
      "@type": "ImageObject",
      url: logoUrl,
      contentUrl: logoUrl,
      width: 512,
      height: 512,
    },
    image: [horizontalLogoUrl, logoUrl],
    telephone: siteConfig.phone,
    email: siteConfig.email,
    priceRange: "$0 consultation",
    hasMap: siteConfig.mapUrl,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: siteConfig.phone,
      email: siteConfig.email,
      availableLanguage: ["English"],
      areaServed: "US-WA",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address.streetAddress,
      addressLocality: siteConfig.address.addressLocality,
      addressRegion: siteConfig.address.addressRegion,
      postalCode: siteConfig.address.postalCode,
      addressCountry: siteConfig.address.addressCountry,
    },
    geo: {
      "@type": "GeoCoordinates",
      // Approximate coordinates for 820 S McClellan St, Spokane, WA 99204.
      latitude: 47.6378,
      longitude: -117.4097,
    },
    areaServed: [
      ...spokaneAreaCities.map((city) => ({
        "@type": "City",
        name: city.name,
        containedInPlace: {
          "@type": "AdministrativeArea",
          name: `${city.county}, ${city.state}`,
        },
      })),
      { "@type": "AdministrativeArea", name: "Spokane County, Washington" },
      { "@type": "AdministrativeArea", name: "Eastern Washington" },
    ],
    serviceType: [
      "Medicare Advantage",
      "Medicare Supplement",
      "Medicare Part D",
      "Supplemental Insurance",
      "Medicare Enrollment Assistance",
      "Prescription Drug Plan Review",
      "Individual and Family Health Insurance",
      "Self-Employed Health Insurance",
      "Special Enrollment Health Insurance",
      "Affordable Care Act Marketplace Coverage",
    ],
    knowsAbout: [
      "Medicare",
      "Medicare Advantage (Part C)",
      "Medicare Supplement (Medigap)",
      "Medicare Part D prescription drug plans",
      "Supplemental insurance (dental, vision, hospital indemnity)",
      "Medicare Initial Enrollment Period",
      "Medicare Annual Enrollment Period",
      "Turning 65 and Medicare",
      "Individual and family health insurance",
      "Self-employed health insurance",
      "Special Enrollment Periods for health insurance",
    ],
    publishingPrinciples: `${siteConfig.url}${siteConfig.editorialStandardsPath}`,
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "17:00",
    },
    ...(sameAs.length > 0 ? { sameAs } : {}),
    disclaimer: siteConfig.disclaimer,
  };

  const website = {
    "@type": "WebSite",
    "@id": websiteId,
    url: siteConfig.url,
    name: siteConfig.name,
    alternateName: siteConfig.shortName,
    description: siteConfig.description,
    inLanguage: "en-US",
    publisher: { "@id": organizationId },
  };

  const schema = {
    "@context": "https://schema.org",
    "@graph": [organization, website],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
      }}
    />
  );
}
