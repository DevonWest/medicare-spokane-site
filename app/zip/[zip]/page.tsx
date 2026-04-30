import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocalMedicarePath } from "@/lib/cities";
import { getZipArea, getAllZips, spokaneZipAreas } from "@/lib/zips";
import { medicareTopics } from "@/lib/topics";
import { siteConfig } from "@/lib/site";
import CTASection from "@/components/CTASection";

interface Props {
  params: Promise<{ zip: string }>;
}

export async function generateStaticParams() {
  return getAllZips().map((zip) => ({ zip }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { zip } = await params;
  const area = getZipArea(zip);

  if (!area) {
    return { title: "Not Found" };
  }

  const title = `Medicare Plans for ZIP Code ${area.zip} – ${area.city}, ${area.stateCode}`;
  const description = `Compare Medicare Advantage, Supplement, and Part D plans in ${area.zip}${area.neighborhood ? ` (${area.neighborhood})` : ""}, ${area.city}, ${area.state}. Free local Medicare agent help.`;

  return {
    title,
    description,
    keywords: [
      `Medicare ${area.zip}`,
      `Medicare ${area.city} ${area.zip}`,
      `Medicare plans zip code ${area.zip}`,
    ],
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/zip/${area.zip}`,
    },
    alternates: {
      canonical: `${siteConfig.url}/zip/${area.zip}`,
    },
  };
}

export default async function ZipPage({ params }: Props) {
  const { zip } = await params;
  const area = getZipArea(zip);

  if (!area) {
    notFound();
  }

  const nearbyZips = spokaneZipAreas.filter((z) => z.citySlug === area.citySlug && z.zip !== area.zip).slice(0, 6);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-800 to-blue-600 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <nav className="text-blue-200 text-sm mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <Link href={getLocalMedicarePath(area.citySlug)} className="hover:text-white">
              {area.city}
            </Link>
            <span className="mx-2">/</span>
            <span>ZIP {area.zip}</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Medicare Plans in ZIP Code {area.zip}
          </h1>
          <p className="text-xl text-blue-100">
            {area.neighborhood ? `${area.neighborhood} – ` : ""}
            {area.city}, {area.stateCode}
          </p>
        </div>
      </section>

      {/* Overview */}
      <section className="py-12 px-4 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Medicare Options for {area.zip} Residents
        </h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          If you live in the {area.zip} zip code
          {area.neighborhood ? ` (${area.neighborhood})` : ""} area of {area.city}, {area.state}, you have access to
          several Medicare plan options. A local Medicare agent can help you compare all available plans at no cost.
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

      {/* City link */}
      <section className="py-4 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <p className="text-gray-700">
            ZIP code {area.zip} is part of{" "}
            <Link href={getLocalMedicarePath(area.citySlug)} className="text-blue-700 font-medium hover:underline">
              {area.city}, {area.stateCode}
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Nearby zips */}
      {nearbyZips.length > 0 && (
        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Nearby ZIP Codes in {area.city}</h2>
            <div className="flex flex-wrap gap-2">
              {nearbyZips.map((z) => (
                <Link
                  key={z.zip}
                  href={`/zip/${z.zip}`}
                  className="bg-white border border-gray-200 rounded px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-700 transition-colors"
                >
                  {z.zip}
                  {z.neighborhood ? ` – ${z.neighborhood}` : ""}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <CTASection
        heading={`Get Medicare Help for ZIP Code ${area.zip}`}
        subheading={`Free plan comparison for ${area.city} residents in the ${area.zip} area.`}
      />
    </>
  );
}
