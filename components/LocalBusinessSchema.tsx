import { siteConfig } from "@/lib/site";
import { spokaneAreaCities } from "@/lib/cities";

export default function LocalBusinessSchema() {
  const sameAs: string[] = [];
  if (siteConfig.social.facebook) sameAs.push(siteConfig.social.facebook);

  const schema = {
    "@context": "https://schema.org",
    "@type": ["InsuranceAgency", "LocalBusiness"],
    "@id": `${siteConfig.url}#organization`,
    name: siteConfig.legalName,
    alternateName: [siteConfig.name, siteConfig.shortName],
    legalName: siteConfig.legalName,
    description: siteConfig.description,
    slogan: siteConfig.positioning,
    url: siteConfig.url,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    priceRange: "Free consultation",
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
    ],
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "17:00",
    },
    sameAs,
    disclaimer: siteConfig.disclaimer,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
