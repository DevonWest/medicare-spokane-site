export function LocalBusinessSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'InsuranceAgency',
    name: 'Medicare Spokane',
    description: 'Local Medicare insurance advisors helping Spokane residents find the best Medicare plans.',
    url: 'https://medicare-spokane.com',
    telephone: '+1-509-555-0100',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 W Main Ave',
      addressLocality: 'Spokane',
      addressRegion: 'WA',
      postalCode: '99201',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 47.6588,
      longitude: -117.4260,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '17:00',
      },
    ],
    priceRange: 'Free Consultation',
    areaServed: {
      '@type': 'City',
      name: 'Spokane',
      sameAs: 'https://en.wikipedia.org/wiki/Spokane,_Washington',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
