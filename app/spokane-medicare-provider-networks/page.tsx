import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import CTASection from "@/components/CTASection";
import Disclaimer from "@/components/Disclaimer";
import FAQ, { type FAQItem } from "@/components/FAQ";
import KnowledgePageEnhancements from "@/components/KnowledgePageEnhancements";
import PageHero from "@/components/PageHero";
import ProviderNetworkDirectory from "@/components/ProviderNetworkDirectory";
import {
  PROVIDER_NETWORK_CHECKED_AT,
  PROVIDER_NETWORK_CHECKED_LABEL,
  PROVIDER_NETWORK_GUIDE_PATH,
  providerNetworkSources,
  providerSystems,
} from "@/lib/providerNetworks";
import { siteConfig } from "@/lib/site";

const pageUrl = `${siteConfig.url}${PROVIDER_NETWORK_GUIDE_PATH}`;

export const metadata: Metadata = {
  title: "Spokane Medicare Provider Networks: 2026 Guide",
  description:
    "Search 2026 Medicare network information for Providence, MultiCare, Rockwood, Inland Imaging, CHAS Health, Humana, SCAN, UnitedHealthcare and more.",
  alternates: { canonical: pageUrl },
  openGraph: {
    title: "Spokane Medicare Provider Networks: 2026 Local Guide",
    description:
      "A source-backed Spokane crosswalk for Medicare carriers, health systems, imaging providers, product limits and network changes.",
    url: pageUrl,
    type: "website",
  },
};

const collectionSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${pageUrl}#collection`,
  url: pageUrl,
  name: "Spokane Medicare Advantage Provider Network Guide",
  description:
    "A locally maintained guide to Medicare Advantage carrier participation at major Spokane and Inland Northwest health systems.",
  dateModified: PROVIDER_NETWORK_CHECKED_AT,
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
    url: siteConfig.url,
  },
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: providerSystems.length,
    itemListElement: providerSystems.map((system, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: system.name,
      ...(system.detailPath
        ? { url: `${siteConfig.url}${system.detailPath}` }
        : {}),
    })),
  },
  citation: providerNetworkSources.map((source) => source.url),
  spatialCoverage: [
    { "@type": "City", name: "Spokane, Washington" },
    { "@type": "AdministrativeArea", name: "Spokane County, Washington" },
    { "@type": "AdministrativeArea", name: "Inland Northwest" },
  ],
};

const faqs: FAQItem[] = [
  {
    question: "Does MultiCare accept Humana Medicare Advantage in Spokane?",
    answer:
      "MultiCare's Spokane County list names Humana group-retiree Medicare Advantage PPO plans. It does not list ordinary individual Humana Medicare Advantage products. Confirm the exact plan with Humana and the MultiCare provider before relying on the listing.",
  },
  {
    question: "Does Providence accept SCAN Medicare Advantage in Spokane?",
    answer:
      "SCAN was not included on Providence's Washington Medicare Advantage carrier list when this guide was checked on August 25, 2026. That is best described as not listed, not as proof that every Providence-related provider is out of network. Verify the exact SCAN plan and provider.",
  },
  {
    question: "Does SCAN include MultiCare and Rockwood in Spokane?",
    answer:
      "MultiCare lists SCAN Health Plan for Spokane County, and SCAN announced MultiCare network access in Spokane beginning January 1, 2026. Individual physicians, facilities, and the exact plan should still be confirmed.",
  },
  {
    question: "Which Medicare plans does Inland Imaging accept in Spokane?",
    answer:
      "Inland Imaging lists Premera, Kaiser, Aetna, UnitedHealthcare, PacificSource, Asuris/Regence, and Health Net Medicare Advantage. It also lists Humana Medicare, CHPW Medicare, Molina Medicare/Special Needs, and participating Traditional Medicare. Amerigroup Medicare Advantage is marked pending, and exact product, location, service, and billing-entity participation should be confirmed.",
  },
  {
    question: "Is accepting an insurance card the same as being in network?",
    answer:
      "No. A provider may bill or accept an insurance card without being contracted as an in-network provider for the exact plan. Ask both the plan and the provider about the specific plan name and provider location.",
  },
  {
    question: "Do Medicare Supplement policies use these provider networks?",
    answer:
      "Usually no. Medicare Supplement policies generally work with providers that accept Original Medicare. This guide focuses on Medicare Advantage network participation, which can be plan-specific.",
  },
];

const verificationSteps = [
  "Use the complete plan name from the member ID card, not only the carrier name.",
  "Ask whether the exact physician, clinic location, hospital, and physician group are in network.",
  "Confirm with the insurance plan and the provider because either directory can be incomplete or outdated.",
  "Repeat the check before a planned procedure and during each annual plan review.",
];

export default function SpokaneMedicareProviderNetworksPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionSchema).replace(/</g, "\\u003c"),
        }}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Resources", path: "/resources" },
          { name: "Spokane Medicare Provider Networks" },
        ]}
      />

      <PageHero
        title="Spokane Medicare Advantage Provider Networks"
        subtitle="Search source-backed 2026 information for Providence, MultiCare, Rockwood Clinic, Inland Imaging, CHAS Health, Kootenai Health and major Medicare carriers."
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/resources", label: "Resources" },
          { label: "Provider Networks" },
        ]}
      />

      <main>
        <section className="border-b border-blue-100 bg-blue-50 px-4 py-10">
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
                  Current-year reference
                </p>
                <h2 className="mt-2 text-2xl font-bold text-gray-900">
                  Carrier name alone is not enough to confirm a network
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-gray-700">
                  Medicare Advantage networks can differ by HMO, PPO, group-retiree plan, D-SNP,
                  physician group, facility, and plan year. This guide preserves those differences
                  instead of using a broad accepted-or-not-accepted label.
                </p>
              </div>
              <div className="rounded-xl border border-blue-200 bg-white px-5 py-4 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">Last source check</p>
                <time dateTime={PROVIDER_NETWORK_CHECKED_AT}>{PROVIDER_NETWORK_CHECKED_LABEL}</time>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-14">
          <div className="mx-auto max-w-6xl">
            <ProviderNetworkDirectory />
          </div>
        </section>

        <section className="border-y border-slate-100 bg-slate-50 px-4 py-14">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
                Common Spokane questions
              </p>
              <h2 className="mt-2 text-3xl font-bold text-gray-900">Quick network answers</h2>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <article className="rounded-2xl border border-amber-200 bg-white p-7">
                <p className="text-sm font-semibold uppercase tracking-wider text-amber-800">
                  Humana and MultiCare
                </p>
                <h3 className="mt-2 text-2xl font-bold text-gray-900">
                  The answer depends on whether it is a group-retiree plan
                </h3>
                <p className="mt-4 leading-relaxed text-gray-700">
                  MultiCare lists Humana group-retiree Medicare Advantage PPO plans for Spokane
                  County. Individual Humana Medicare Advantage products are not included in that
                  public listing.
                </p>
                <Link
                  href="/multicare-medicare-advantage-plans-spokane"
                  className="mt-5 inline-block font-semibold text-blue-700 hover:underline"
                >
                  Read the MultiCare and Rockwood guide →
                </Link>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-7">
                <p className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                  SCAN and Providence
                </p>
                <h3 className="mt-2 text-2xl font-bold text-gray-900">
                  SCAN is not on Providence&apos;s Washington carrier list
                </h3>
                <p className="mt-4 leading-relaxed text-gray-700">
                  Providence did not list SCAN when this guide was checked. Because provider
                  directories can differ at the physician level, the careful conclusion is “not
                  listed,” followed by an exact-plan check.
                </p>
                <Link
                  href="/providence-medicare-advantage-plans-spokane"
                  className="mt-5 inline-block font-semibold text-blue-700 hover:underline"
                >
                  Read the Providence Spokane guide →
                </Link>
              </article>
              <article className="rounded-2xl border border-rose-200 bg-white p-7">
                <p className="text-sm font-semibold uppercase tracking-wider text-rose-700">
                  Molina D-SNP and MultiCare
                </p>
                <h3 className="mt-2 text-2xl font-bold text-gray-900">
                  MultiCare published a product-specific network change
                </h3>
                <p className="mt-4 leading-relaxed text-gray-700">
                  MultiCare says Molina Medicare Advantage D-SNP plans became out of network on
                  January 1, 2026. That statement should not be broadened to every Molina product.
                </p>
              </article>
              <article className="rounded-2xl border border-emerald-200 bg-white p-7">
                <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
                  CHAS Health
                </p>
                <h3 className="mt-2 text-2xl font-bold text-gray-900">
                  CHAS publishes both medical and dental participation
                </h3>
                <p className="mt-4 leading-relaxed text-gray-700">
                  CHAS lists several Medicare Advantage carriers and separately identifies plans
                  that are not in network. Its medical and dental participation can differ for the
                  same carrier.
                </p>
              </article>
              <article className="rounded-2xl border border-blue-200 bg-white p-7">
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
                  Inland Imaging
                </p>
                <h3 className="mt-2 text-2xl font-bold text-gray-900">
                  The imaging location and radiologist may have separate contracts
                </h3>
                <p className="mt-4 leading-relaxed text-gray-700">
                  Inland Imaging lists several Medicare Advantage products and participating
                  Traditional Medicare. Amerigroup Medicare Advantage is marked pending, and some
                  carrier listings need product-level confirmation.
                </p>
                <Link
                  href="/inland-imaging-medicare-plans-spokane"
                  className="mt-5 inline-block font-semibold text-blue-700 hover:underline"
                >
                  Read the Inland Imaging guide →
                </Link>
              </article>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-14">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                How to verify a doctor or hospital correctly
              </h2>
              <ol className="mt-6 space-y-5">
                {verificationSteps.map((step, index) => (
                  <li key={step} className="flex gap-4 leading-relaxed text-gray-700">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-700 font-bold text-white">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-7">
              <h2 className="text-2xl font-bold text-gray-900">
                “Accepts insurance” and “in network” are not interchangeable
              </h2>
              <p className="mt-4 leading-relaxed text-gray-700">
                A hospital may accept an insurance card or submit a claim even when the exact plan
                treats the service as out of network. A hospital facility, employed physician,
                independent specialist, laboratory, imaging group, and anesthesiology group can
                also have different contracts.
              </p>
              <p className="mt-4 leading-relaxed text-gray-700">
                For planned care, obtain the plan&apos;s confirmation and ask the provider to verify the
                complete plan name. Emergency-care rules are different and should not be evaluated
                only with this directory.
              </p>
            </aside>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-slate-50 px-4 py-14">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-gray-900">Coverage and maintenance limits</h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              This Spokane crosswalk covers provider-published information for Providence,
              MultiCare and Rockwood, Inland Imaging, CHAS Health, and selected Kootenai Health
              cross-border issues. Cancer Care Northwest, independent physician groups, anesthesia
              groups, rehabilitation facilities, and other specialty providers may use separate
              contracts. We will add them only when reliable provider-level evidence is available.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              The current guide is for 2026. We will keep these evergreen pages and add verified
              2027 information after official plan-year directories and approved materials are
              available.
            </p>
          </div>
        </section>

        <FAQ heading="Spokane Medicare Provider Network Questions" items={faqs} />

        <section className="bg-white px-4 py-10">
          <div className="mx-auto max-w-4xl">
            <Disclaimer />
          </div>
        </section>

        <KnowledgePageEnhancements currentPath={PROVIDER_NETWORK_GUIDE_PATH} />
      </main>

      <CTASection
        heading="Want Us to Verify Your Doctors and Hospitals?"
        subheading="Bring the exact plan name and your provider list. A local licensed insurance professional can help you check the details before you make a decision."
      />
    </>
  );
}
