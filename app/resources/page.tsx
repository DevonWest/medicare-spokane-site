import type { Metadata } from "next";
import Link from "next/link";
import CTASection from "@/components/CTASection";
import Disclaimer from "@/components/Disclaimer";
import PageHero from "@/components/PageHero";
import {
  getFeaturedKnowledgeSources,
  getKnowledgeSections,
} from "@/lib/knowledgeCenter";
import { getMarketUpdatesNewestFirst, marketUpdatesHub } from "@/lib/marketUpdates";
import { PROVIDER_NETWORK_GUIDE_PATH } from "@/lib/providerNetworks";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Medicare Resource Library for Spokane Residents",
  description:
    "Browse Spokane Medicare guides for turning 65, comparing options, reviewing prescriptions, and finding trusted Medicare and government resources.",
  alternates: { canonical: `${siteConfig.url}/resources` },
  openGraph: {
    title: "Medicare Resource Library for Spokane Residents",
    description:
      "Browse Spokane Medicare guides for turning 65, comparing options, reviewing prescriptions, and trusted Medicare and government resources.",
    url: `${siteConfig.url}/resources`,
  },
};

export default function ResourcesPage() {
  const resourceSections = getKnowledgeSections();
  const officialResources = getFeaturedKnowledgeSources();
  const marketUpdates = getMarketUpdatesNewestFirst();

  return (
    <>
      <PageHero
        title="Medicare Resource Library"
        subtitle="Browse local Medicare guides, plan comparisons, and trusted Medicare and government links to help you review your options with confidence."
        crumbs={[{ href: "/", label: "Home" }, { label: "Resources" }]}
      />

      <section className="border-b border-blue-100 bg-blue-50 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            Spokane coverage updates
          </p>
          <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Timely Medicare and insurance news</h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                Find current Medicare alerts and confirmed health insurance announcements for
                Spokane and Washington, with clear labels for details that remain unconfirmed.
              </p>
              <Link
                href={marketUpdatesHub.path}
                className="mt-5 inline-block font-semibold text-blue-700 hover:underline"
              >
                View the complete 2027 changes tracker →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {marketUpdates.map((update) => (
                <Link
                  key={update.path}
                  href={update.path}
                  className="rounded-2xl border border-blue-200 bg-white p-5 transition-colors hover:border-blue-400"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                    {update.publishedLabel} · {update.spokaneStatusLabel}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">{update.shortTitle}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-700">{update.summary}</p>
                  <span className="mt-3 inline-block text-sm font-semibold text-blue-700">
                    Read update →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-3 text-2xl font-bold text-gray-900 md:text-3xl">Local Medicare Guides</h2>
          <p className="mb-10 max-w-2xl text-gray-600">
            Helping Spokane-area residents review Medicare with large-text, easy-to-scan guides and
            clear next steps. If you want local plan-comparison help first, start with our{" "}
            <Link href="/medicare-spokane" className="font-semibold text-blue-700 hover:underline">
              Medicare plans in Spokane guide
            </Link>
            .
          </p>
          <p className="mb-8 max-w-3xl text-lg leading-relaxed text-gray-700">
            Live north of Spokane? Our <Link href="/medicare-stevens-county" className="font-semibold text-blue-700 underline">Stevens County Medicare guide</Link> covers Colville and Chewelah provider checks, trips to Spokane for care, and local pharmacy considerations.
          </p>
          <div className="mb-12 rounded-2xl border-2 border-blue-200 bg-blue-50 p-6 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
              New local reference
            </p>
            <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Spokane Medicare Advantage Provider Networks
                </h3>
                <p className="mt-3 text-lg leading-relaxed text-gray-700">
                  Search dated, source-linked carrier information for Providence, MultiCare,
                  Rockwood Clinic, Inland Imaging, CHAS Health, and selected Inland Northwest
                  providers. Product limits for HMO, PPO, group-retiree, and D-SNP plans are shown
                  separately.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link
                  href={PROVIDER_NETWORK_GUIDE_PATH}
                  className="rounded-xl bg-blue-700 px-5 py-3 text-center font-semibold text-white transition-colors hover:bg-blue-800"
                >
                  Search the network guide
                </Link>
                <div className="flex justify-center gap-4 text-sm font-semibold text-blue-700 lg:justify-start">
                  <Link href="/providence-medicare-advantage-plans-spokane" className="hover:underline">
                    Providence
                  </Link>
                  <Link href="/multicare-medicare-advantage-plans-spokane" className="hover:underline">
                    MultiCare / Rockwood
                  </Link>
                  <Link href="/inland-imaging-medicare-plans-spokane" className="hover:underline">
                    Inland Imaging
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-12">
            {resourceSections.map((section) => (
              <section key={section.title}>
                <div className="max-w-3xl">
                  <h3 className="text-2xl font-bold text-gray-900">{section.title}</h3>
                  <p className="mt-3 text-lg leading-relaxed text-gray-600">{section.intro}</p>
                </div>
                <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                  {section.items.map((resource) => (
                    <Link
                      key={resource.path}
                      href={resource.path}
                      className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 transition-all hover:border-blue-300 hover:shadow-md"
                    >
                      <h4 className="text-xl font-semibold text-gray-900 transition-colors group-hover:text-blue-700">
                        {resource.title}
                      </h4>
                      <p className="mt-3 text-base leading-relaxed text-gray-700">{resource.summary}</p>
                      <span className="mt-5 inline-block text-sm font-medium text-blue-700 group-hover:underline">
                        {resource.ctaLabel ?? "Read More"} →
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-3 text-2xl font-bold text-gray-900 md:text-3xl">
            Medicare &amp; Government Resources
          </h2>
          <p className="mb-10 max-w-2xl text-gray-600">
            Independent guidance starts with reliable information. These official resources can help
            you compare options and understand your rights.
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {officialResources.map((r) => (
              <a
                key={r.url}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-blue-300 hover:shadow-md"
              >
                <h3 className="mb-2 text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-700">
                  {r.title}
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-gray-600">{r.summary}</p>
                <span className="text-sm font-medium text-blue-700 group-hover:underline">Visit site ↗</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <Disclaimer />
        </div>
      </section>

      <CTASection
        heading="Have a Medicare Question?"
        subheading="Talk with a local licensed insurance professional in Spokane — no cost, no pressure."
      />
    </>
  );
}
