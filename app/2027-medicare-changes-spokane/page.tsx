import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import Disclaimer from "@/components/Disclaimer";
import PageHero from "@/components/PageHero";
import { getMarketUpdatesNewestFirst, marketUpdatesHub } from "@/lib/marketUpdates";
import { siteConfig } from "@/lib/site";

const pagePath = marketUpdatesHub.path;
const pageUrl = `${siteConfig.url}${pagePath}`;
const marketUpdates = getMarketUpdatesNewestFirst();

const pageSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${pageUrl}#webpage`,
  url: pageUrl,
  name: marketUpdatesHub.title,
  description: marketUpdatesHub.description,
  datePublished: "2026-08-18",
  dateModified: marketUpdatesHub.modifiedDate,
  isPartOf: {
    "@type": "WebSite",
    "@id": `${siteConfig.url}#website`,
    name: siteConfig.name,
    url: siteConfig.url,
  },
  publisher: {
    "@type": "InsuranceAgency",
    "@id": `${siteConfig.url}#organization`,
    name: siteConfig.legalName,
  },
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: marketUpdates.length,
    itemListElement: marketUpdates.map((update, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteConfig.url}${update.path}`,
      name: update.title,
    })),
  },
};

export const metadata: Metadata = {
  title: marketUpdatesHub.title,
  description: marketUpdatesHub.description,
  alternates: { canonical: pageUrl },
  openGraph: {
    title: marketUpdatesHub.title,
    description:
      "A Spokane-focused tracker separating confirmed 2027 Medicare announcements from details that have not been announced locally.",
    url: pageUrl,
    type: "website",
  },
};

const itemsWeTrack = [
  {
    title: "Spokane County availability",
    body: "We look for a named county or service area before describing an offering as available in Spokane.",
  },
  {
    title: "Carrier entries and exits",
    body: "We distinguish a national or statewide announcement from a confirmed change in the Spokane market.",
  },
  {
    title: "Official availability records",
    body: "When the next plan year becomes available in Medicare's official tools, those records take priority over early reports.",
  },
  {
    title: "Meaningful local changes",
    body: "We watch for confirmed changes that may affect how Spokane residents prepare for their annual coverage review.",
  },
];

export default function MedicareChangesSpokane2027Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(pageSchema).replace(/</g, "\\u003c"),
        }}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Resources", path: "/resources" },
          { name: "2027 Medicare Changes in Spokane" },
        ]}
      />

      <PageHero
        title="2027 Medicare Changes in Spokane"
        subtitle="A local tracker for confirmed market announcements, with a clear line between what is known nationally and what is actually confirmed for Spokane County."
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/resources", label: "Resources" },
          { label: "2027 Medicare Changes" },
        ]}
      />

      <section className="bg-white px-4 py-14">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
            <p className="text-sm font-semibold uppercase tracking-wider text-amber-800">
              Current status
            </p>
            <p className="mt-3 text-lg font-semibold">
              Early announcements do not automatically mean a new offering will be available in
              Spokane.
            </p>
            <p className="mt-2 leading-relaxed">
              We will label a change as local only after Spokane County or an applicable local
              service area is identified by an official source.
            </p>
          </div>

          <div className="mt-10 max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900">Latest Spokane market updates</h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              New reports are listed here with a dated Spokane status so readers can distinguish a
              confirmed partnership or national announcement from confirmed local availability.
            </p>
          </div>

          <div className="mt-7 space-y-5">
            {marketUpdates.map((update) => (
              <Link
                key={update.path}
                href={update.path}
                className="block rounded-2xl border border-blue-200 bg-blue-50 p-6 transition-colors hover:border-blue-400 hover:bg-blue-100"
              >
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
                  {update.publishedLabel} · {update.spokaneStatusLabel}
                </p>
                <h3 className="mt-2 text-2xl font-bold text-gray-900">{update.shortTitle}</h3>
                <p className="mt-3 leading-relaxed text-gray-700">{update.summary}</p>
                <span className="mt-4 inline-block font-semibold text-blue-700">
                  Read the update →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900">What this tracker will verify</h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              The goal is to make fast-moving news useful without getting ahead of the public
              record.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
            {itemsWeTrack.map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-3 leading-relaxed text-gray-700">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-gray-900">How to use early Medicare news</h2>
          <p className="mt-4 text-lg leading-relaxed text-gray-700">
            Treat an early announcement as something to watch, not as a reason to make a coverage
            decision. Availability is location-specific, and information for a future year can
            change before it appears in official materials.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-gray-700">
            When 2027 information is released, confirm availability for your ZIP code through{" "}
            <a
              href="https://www.medicare.gov/plan-compare/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-700 hover:underline"
            >
              Medicare Plan Compare
            </a>
            . You can also use our{" "}
            <Link href="/medicare-plan-review-spokane" className="font-semibold text-blue-700 hover:underline">
              annual Medicare review guide
            </Link>{" "}
            to organize the doctors, prescriptions, pharmacies, and coverage questions that matter
            to you.
          </p>
          <p className="mt-5 text-sm text-gray-500">
            Tracker started August 18, 2026. Updates will include a dated note when confirmed local
            information changes.
          </p>
          <Disclaimer className="mt-8" />
        </div>
      </section>

    </>
  );
}
