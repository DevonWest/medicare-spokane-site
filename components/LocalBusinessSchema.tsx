import { siteConfig } from "@/lib/site";

export default function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "InsuranceAgency",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address.streetAddress,
      addressLocality: siteConfig.address.addressLocality,
      addressRegion: siteConfig.address.addressRegion,
      postalCode: siteConfig.address.postalCode,
      addressCountry: siteConfig.address.addressCountry,
    },
    areaServed: [
      {
        "@type": "City",
        name: "Spokane",
        sameAs: "https://en.wikipedia.org/wiki/Spokane,_Washington",
      },
      {
        "@type": "City",
        name: "Spokane Valley",
      },
      {
        "@type": "AdministrativeArea",
        name: "Spokane County, Washington",
      },
    ],
    serviceType: ["Medicare Advantage", "Medicare Supplement", "Medicare Part D", "Medicare Enrollment"],
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
