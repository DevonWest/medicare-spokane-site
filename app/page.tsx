import type { Metadata } from "next";
import Link from "next/link";
import CTASection from "@/components/CTASection";
import { siteConfig } from "@/lib/site";
import { spokaneAreaCities } from "@/lib/cities";
import { medicareTopics } from "@/lib/topics";

export const metadata: Metadata = {
  title: `${siteConfig.name} | Local Medicare Help in Spokane, WA`,
  description: siteConfig.description,
  alternates: {
    canonical: siteConfig.url,
  },
};

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-800 to-blue-600 text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6">
            Local Medicare Help in Spokane, WA
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            Compare Medicare Advantage, Supplement, and Part D plans with a licensed local agent — no cost, no
            obligation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`tel:${siteConfig.phone.replace(/\D/g, "")}`}
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-800 font-bold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors text-lg"
            >
              Call {siteConfig.phone}
            </a>
            <Link
              href="/topics/medicare-enrollment"
              className="inline-flex items-center justify-center bg-blue-900 hover:bg-blue-950 text-white font-semibold px-8 py-3 rounded-lg transition-colors text-lg border border-blue-400"
            >
              Learn About Enrollment
            </Link>
          </div>
        </div>
      </section>

      {/* Medicare Options */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Medicare Plans Available in Spokane
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            We help Spokane-area residents compare all Medicare options side by side so you can choose the plan that
            fits your health needs and budget.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {medicareTopics.slice(0, 3).map((topic) => (
              <Link
                key={topic.slug}
                href={`/topics/${topic.slug}`}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all group"
              >
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 mb-2 transition-colors">
                  {topic.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">{topic.shortDescription}</p>
                <span className="text-blue-700 text-sm font-medium group-hover:underline">Learn more →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Work With a Local Spokane Medicare Agent?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "🏠",
                title: "Local Expertise",
                body: "We know the doctors, hospitals, and networks available in Spokane County — so we can match you with plans that keep your providers in-network.",
              },
              {
                icon: "💰",
                title: "No Cost to You",
                body: "Our services are completely free. We're compensated by insurance carriers — you pay the same premium whether you use us or enroll on your own.",
              },
              {
                icon: "🛡️",
                title: "Unbiased Advice",
                body: "We represent multiple carriers and will compare all your options honestly, without pushing you toward any single plan.",
              },
            ].map((item) => (
              <div key={item.title} className="text-center p-6">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Areas We Serve */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Medicare Help Across the Spokane Area
          </h2>
          <p className="text-center text-gray-600 mb-10">
            We serve residents throughout Spokane County and surrounding communities.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {spokaneAreaCities.map((city) => (
              <Link
                key={city.slug}
                href={`/cities/${city.slug}`}
                className="bg-white border border-gray-200 rounded-lg p-3 text-center text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-700 transition-colors"
              >
                {city.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
