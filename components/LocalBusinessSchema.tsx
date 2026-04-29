import { siteConfig } from "@/lib/site";
import { spokaneAreaCities } from "@/lib/cities";

export default function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "InsuranceAgency",
    "@id": `${siteConfig.url}#organization`,
    name: siteConfig.legalName,
    alternateName: siteConfig.name,
    description: siteConfig.description,
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
      // Approximate centroid of Spokane, WA – swap for office coords when known.
      latitude: 47.6588,
      longitude: -117.4260,
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
      {
        "@type": "AdministrativeArea",
        name: "Spokane County, Washington",
      },
      {
        "@type": "AdministrativeArea",
        name: "Eastern Washington",
      },
    ],
    serviceType: ["Medicare Advantage", "Medicare Supplement", "Medicare Part D", "Medicare Enrollment"],
    knowsAbout: [
      "Medicare",
      "Medicare Advantage (Part C)",
      "Medicare Supplement (Medigap)",
      "Medicare Part D prescription drug plans",
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
    sameAs: siteConfig.social.facebook ? [siteConfig.social.facebook] : [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
