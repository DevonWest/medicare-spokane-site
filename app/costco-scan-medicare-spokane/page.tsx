import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import Disclaimer from "@/components/Disclaimer";
import MarketUpdateLinks from "@/components/MarketUpdateLinks";
import PageHero from "@/components/PageHero";
import { getMarketUpdateByPath, marketUpdatesHub } from "@/lib/marketUpdates";
import { siteConfig } from "@/lib/site";

const pagePath = "/costco-scan-medicare-spokane";
const pageUrl = `${siteConfig.url}${pagePath}`;
const marketUpdate = getMarketUpdateByPath(pagePath) ?? (() => {
  throw new Error(`Missing market update registry entry for ${pagePath}.`);
})();
const publishedDate = marketUpdate.publishedDate;

const reportingUrl =
  "https://www.wsj.com/health/healthcare/costco-sells-vacations-gas-and-soon-medicare-plans-c0e1470e";
const partnershipUrl =
  "https://www.scanhealthplan.com/en/about-scan/press-releases/costco-partnership";

export const metadata: Metadata = {
  title: marketUpdate.shortTitle,
  description:
    "What the Costco and SCAN Medicare announcement means for Spokane, including what is confirmed and what remains unknown.",
  alternates: { canonical: pageUrl },
  openGraph: {
    title: marketUpdate.title,
    description:
      "The partnership is confirmed, but no Costco-SCAN Medicare product has been announced for Spokane County.",
    url: pageUrl,
    type: "article",
    publishedTime: `${publishedDate}T12:00:00-07:00`,
    modifiedTime: `${marketUpdate.modifiedDate}T12:00:00-07:00`,
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "@id": `${pageUrl}#article`,
  headline: marketUpdate.title,
  description:
    "What the Costco and SCAN Medicare announcement means for Spokane, including what is confirmed and what remains unknown.",
  datePublished: publishedDate,
  dateModified: marketUpdate.modifiedDate,
  mainEntityOfPage: pageUrl,
  author: {
    "@type": "Organization",
    name: siteConfig.legalName,
    url: siteConfig.url,
  },
  publisher: {
    "@type": "InsuranceAgency",
    "@id": `${siteConfig.url}#organization`,
    name: siteConfig.legalName,
    url: siteConfig.url,
    logo: {
      "@type": "ImageObject",
      url: `${siteConfig.url}/brand/logo-horizontal.png`,
    },
  },
  about: [
    { "@type": "Organization", name: "Costco Wholesale" },
    { "@type": "Organization", name: "SCAN Group" },
    { "@type": "City", name: "Spokane, Washington" },
  ],
  citation: [reportingUrl, partnershipUrl],
};

const knownItems = [
  "Costco and SCAN have an established Medicare-focused partnership.",
  "Current national reporting describes a limited rollout of jointly branded Medicare products.",
  "The reporting identifies Medicare Advantage products in two states and a Medicare Supplement product in a third state.",
];

const unknownItems = [
  "Which states are part of the reported rollout.",
  "Whether Spokane County or any Washington service area is included.",
  "The launch date and final availability, which remain subject to approval.",
];

export default function CostcoScanMedicareSpokanePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c"),
        }}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "2027 Medicare Changes", path: marketUpdatesHub.path },
          { name: "Costco and SCAN Partnership" },
        ]}
      />

      <PageHero
        title="Costco and SCAN Medicare Partnership: What Spokane Residents Should Know"
        subtitle="The partnership and planned expansion are real. A Spokane launch is not confirmed."
        crumbs={[
          { href: "/", label: "Home" },
          { href: marketUpdatesHub.path, label: "2027 Medicare Changes" },
          { label: "Costco and SCAN" },
        ]}
      />

      <article>
        <section className="bg-white px-4 py-12">
          <div className="mx-auto max-w-4xl">
            <p className="text-sm text-gray-500">
              Published <time dateTime={publishedDate}>{marketUpdate.publishedLabel}</time> · Last updated{" "}
              <time dateTime={marketUpdate.modifiedDate}>{marketUpdate.modifiedLabel}</time>
            </p>

            <div className="mt-7 rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-amber-950">
              <p className="text-sm font-semibold uppercase tracking-wider text-amber-800">
                Spokane status: not confirmed
              </p>
              <p className="mt-3 text-xl font-bold">
                No Costco- and SCAN-branded Medicare product has been announced for Spokane County.
              </p>
              <p className="mt-3 leading-relaxed">
                The states and launch timing in the reported rollout have not been named. SCAN&apos;s
                existing presence in Washington does not, by itself, confirm that Spokane will be
                included.
              </p>
            </div>

            <div className="mt-10 max-w-3xl">
              <h2 className="text-3xl font-bold text-gray-900">What was announced?</h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                On August 18, 2026, national reporting described Costco and SCAN Group planning a
                limited expansion into jointly branded Medicare products. The report said the
                initial rollout would involve Medicare Advantage products in two states and a
                Medicare Supplement product in a third.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                The organizations did not identify those states or give a launch date. That is the
                most important limitation for Spokane residents: this is a national business
                announcement, not a local availability notice.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                The news builds on a partnership that SCAN announced in 2025. That earlier
                relationship included Medicare-focused services and education, including activity
                in Washington, but it did not establish that a future jointly branded product would
                be offered in Spokane County.
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-slate-50 px-4 py-14">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200 bg-white p-7">
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
                Confirmed
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">What we know</h2>
              <ul className="mt-5 space-y-4">
                {knownItems.map((item) => (
                  <li key={item} className="flex gap-3 leading-relaxed text-gray-700">
                    <span className="font-bold text-emerald-700" aria-hidden="true">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-white p-7">
              <p className="text-sm font-semibold uppercase tracking-wider text-amber-700">
                Not disclosed
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">What remains unknown</h2>
              <ul className="mt-5 space-y-4">
                {unknownItems.map((item) => (
                  <li key={item} className="flex gap-3 leading-relaxed text-gray-700">
                    <span className="font-bold text-amber-700" aria-hidden="true">?</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-14">
          <div className="mx-auto max-w-4xl space-y-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Does this mean Spokane is included?</h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                No. It means Spokane is worth watching because SCAN already operates in Washington,
                but it would be speculation to say the newly reported products are coming here.
                Availability must be confirmed by county or service area after official information
                is released.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900">What Spokane residents should do now</h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                No coverage decision is needed because of this announcement. Keep your current
                coverage information, watch for official notices, and verify 2027 availability by
                ZIP code when Medicare publishes the next plan-year information.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                Our{" "}
                <Link href={marketUpdatesHub.path} className="font-semibold text-blue-700 hover:underline">
                  2027 Spokane Medicare changes tracker
                </Link>{" "}
                will be updated when a source identifies Spokane County or another applicable local
                service area. For general preparation, use the{" "}
                <Link href="/medicare-plan-review-spokane" className="font-semibold text-blue-700 hover:underline">
                  annual Medicare review guide
                </Link>
                .
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-bold text-gray-900">Sources reviewed</h2>
              <ul className="mt-4 space-y-3 text-gray-700">
                <li>
                  <a
                    href={reportingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    The Wall Street Journal&apos;s August 18, 2026 report
                  </a>{" "}
                  for the newly reported rollout and its undisclosed locations and timing.
                </li>
                <li>
                  <a
                    href={partnershipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    SCAN Health Plan&apos;s partnership announcement
                  </a>{" "}
                  for background on the organizations&apos; established relationship.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-blue-950">
              <p className="font-semibold">Independent local reporting</p>
              <p className="mt-2 leading-relaxed">
                {siteConfig.legalName} is not affiliated with Costco, SCAN Group, or SCAN Health
                Plan. This page is general information and does not recommend or compare a
                Costco- or SCAN-branded product.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">Update log</h2>
              <p className="mt-3 leading-relaxed text-gray-700">
                <time dateTime={publishedDate}>{marketUpdate.publishedLabel}</time> — Published with Spokane
                availability marked as unconfirmed.
              </p>
            </div>

            <MarketUpdateLinks currentPath={pagePath} />

            <Disclaimer />
          </div>
        </section>
      </article>

    </>
  );
}
