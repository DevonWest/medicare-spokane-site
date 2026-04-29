import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCityBySlug, getAllCitySlugs, spokaneAreaCities } from "@/lib/cities";
import { medicareTopics } from "@/lib/topics";
import { siteConfig } from "@/lib/site";
import CTASection from "@/components/CTASection";

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateStaticParams() {
  return getAllCitySlugs().map((city) => ({ city }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);

  if (!city) {
    return { title: "Not Found" };
  }

  const title = `Medicare in ${city.name}, ${city.stateCode} | Local Medicare Plans`;
  const description = `Find Medicare Advantage, Supplement, and Part D plans in ${city.name}, ${city.state}. Free help from a licensed local Medicare agent serving ${city.county}.`;

  return {
    title,
    description,
    keywords: [
      `Medicare ${city.name}`,
      `Medicare ${city.name} WA`,
      `Medicare Advantage ${city.name}`,
      `Medicare Supplement ${city.name}`,
      `Medicare agent ${city.name}`,
    ],
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/cities/${city.slug}`,
    },
    alternates: {
      canonical: `${siteConfig.url}/cities/${city.slug}`,
    },
  };
}

export default async function CityPage({ params }: Props) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);

  if (!city) {
    notFound();
  }

  const citySchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteConfig.url}/cities/${city.slug}`,
    name: `${siteConfig.name} – ${city.name}`,
    description: `Medicare insurance services in ${city.name}, ${city.stateCode}`,
    url: `${siteConfig.url}/cities/${city.slug}`,
    telephone: siteConfig.phone,
    areaServed: {
      "@type": "City",
      name: city.name,
      containedInPlace: {
        "@type": "AdministrativeArea",
        name: city.county,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(citySchema) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-800 to-blue-600 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <nav className="text-blue-200 text-sm mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <span>Medicare in {city.name}</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Medicare in {city.name}, {city.stateCode}
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl">{city.description}</p>
        </div>
      </section>

      {/* Overview */}
      <section className="py-12 px-4 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Medicare Plans Available in {city.name}
        </h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          Residents of {city.name}, {city.state} have access to a range of Medicare plan options. Whether you are
          turning 65, retiring, or looking to switch plans during the Annual Enrollment Period, a licensed Medicare agent
          can help you compare your options at no cost.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {medicareTopics.slice(0, 4).map((topic) => (
            <Link
              key={topic.slug}
              href={`/topics/${topic.slug}`}
              className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100 hover:border-blue-400 transition-colors group"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                  {topic.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{topic.shortDescription}</p>
              </div>
              <span className="text-blue-600 mt-1">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Zip Codes */}
      {city.zipCodes.length > 0 && (
        <section className="py-8 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Zip Codes We Serve in {city.name}
            </h2>
            <div className="flex flex-wrap gap-2">
              {city.zipCodes.map((zip) => (
                <Link
                  key={zip}
                  href={`/zip/${zip}`}
                  className="bg-white border border-gray-200 rounded px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-700 transition-colors"
                >
                  {zip}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Nearby Cities */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Other Areas We Serve</h2>
          <div className="flex flex-wrap gap-2">
            {spokaneAreaCities
              .filter((c) => c.slug !== city.slug)
              .map((c) => (
                <Link
                  key={c.slug}
                  href={`/cities/${c.slug}`}
                  className="bg-white border border-gray-200 rounded px-3 py-1.5 text-sm text-gray-700 hover:border-blue-400 hover:text-blue-700 transition-colors"
                >
                  {c.name}
                </Link>
              ))}
          </div>
        </div>
      </section>

      <CTASection
        heading={`Get Medicare Help in ${city.name}`}
        subheading={`A licensed ${city.name} Medicare agent will help you compare plans and enroll — free of charge.`}
      />
    </>
  );
}
