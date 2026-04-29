import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTopicBySlug, getAllTopicSlugs, medicareTopics } from "@/lib/topics";
import { siteConfig } from "@/lib/site";
import CTASection from "@/components/CTASection";

interface Props {
  params: Promise<{ topic: string }>;
}

export async function generateStaticParams() {
  return getAllTopicSlugs().map((topic) => ({ topic }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic: topicSlug } = await params;
  const topic = getTopicBySlug(topicSlug);

  if (!topic) {
    return { title: "Not Found" };
  }

  const title = `${topic.title} in Spokane, WA | Local Medicare Help`;
  const description = `${topic.shortDescription} Get free help from a licensed Medicare agent in Spokane, WA.`;

  return {
    title,
    description,
    keywords: topic.keywords,
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/topics/${topic.slug}`,
    },
    alternates: {
      canonical: `${siteConfig.url}/topics/${topic.slug}`,
    },
  };
}

export default async function TopicPage({ params }: Props) {
  const { topic: topicSlug } = await params;
  const topic = getTopicBySlug(topicSlug);

  if (!topic) {
    notFound();
  }

  const otherTopics = medicareTopics.filter((t) => t.slug !== topic.slug);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: topic.benefits.map((benefit) => ({
      "@type": "Question",
      name: `What is a benefit of ${topic.title}?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: benefit,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-800 to-blue-600 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <nav className="text-blue-200 text-sm mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <span>{topic.title}</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{topic.title} in Spokane, WA</h1>
          <p className="text-xl text-blue-100 max-w-2xl">{topic.shortDescription}</p>
        </div>
      </section>

      {/* Main content */}
      <section className="py-12 px-4 max-w-4xl mx-auto">
        <div className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            About {topic.title} in the Spokane Area
          </h2>
          <p className="text-gray-700 leading-relaxed mb-8">{topic.longDescription}</p>
        </div>

        {/* Benefits */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Key Benefits</h2>
          <ul className="space-y-2">
            {topic.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3 text-gray-700">
                <span className="text-blue-600 mt-1 shrink-0">✓</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Other topics */}
      <section className="py-8 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-4">More Medicare Topics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {otherTopics.map((t) => (
              <Link
                key={t.slug}
                href={`/topics/${t.slug}`}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors group"
              >
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors text-sm">
                  {t.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.shortDescription}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        heading={`Ready to Explore ${topic.title} Options?`}
        subheading={`Get personalized ${topic.title} advice from a licensed Spokane Medicare agent — free of charge.`}
      />
    </>
  );
}
