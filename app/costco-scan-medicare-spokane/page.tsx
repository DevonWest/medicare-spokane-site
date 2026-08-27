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
    "Costco and SCAN have identified Washington for their planned co-branded Medicare Supplement rollout. See what is confirmed for Spokane and what remains pending.",
  alternates: { canonical: pageUrl },
  openGraph: {
    title: marketUpdate.title,
    description:
      "Washington is confirmed for the planned Costco- and SCAN-co-branded Medicare Supplement rollout; rates, plan details, timing, and final availability remain pending.",
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
    "Costco and SCAN have identified Washington for their planned co-branded Medicare Supplement rollout. See what is confirmed for Spokane and what remains pending.",
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
  "Costco and SCAN have identified Washington for the co-branded Medicare Supplement portion of their planned rollout.",
  "The Washington Medicare Supplement offering will be Costco- and SCAN-co-branded; this is not a new Medicare Advantage service-area announcement for Spokane County.",
  "The planned offering remains subject to applicable regulatory approval and final product availability.",
];

const unknownItems = [
  "The launch and effective date.",
  "The standardized plan letter or letters, premiums, discounts, underwriting rules, and any added services.",
  "When approved product documents, applications, and Washington availability details will be released.",
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
        title="Costco and SCAN Medicare Supplement Is Planned for Washington"
        subtitle="The Washington Medicare Supplement offering will be co-branded. Rates, plan details, approval, and launch timing remain pending."
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

            <div className="mt-7 rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-6 text-emerald-950">
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-800">
                Washington status: confirmed for Medicare Supplement
              </p>
              <p className="mt-3 text-xl font-bold">
                Costco and SCAN have identified Washington for their co-branded Medicare Supplement rollout.
              </p>
              <p className="mt-3 leading-relaxed">
                This confirms both the state and the Costco/SCAN co-branding for the Medicare
                Supplement offering. It does not mean applications are open or that rates, plan
                details, an effective date, or final regulatory approval have been announced.
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
                Costco and SCAN have since identified Washington for the co-branded Medicare
                Supplement portion of that planned rollout. For Spokane residents, that replaces
                our earlier &quot;state not disclosed&quot; status with a confirmed Washington
                market and confirms that the Medicare Supplement product is part of the Costco
                partnership. It is not a new confirmation of a Costco- and SCAN-branded Medicare
                Advantage plan in Spokane County.
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
              <h2 className="text-3xl font-bold text-gray-900">
                What does the Washington confirmation mean for Spokane?
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                Washington confirmation is directly relevant to Spokane residents because Medicare
                Supplement policies pair with Original Medicare rather than using a Spokane-only
                Medicare Advantage service-area network. Even so, residents should wait for approved
                product documents, premiums, eligibility rules, and an effective date before treating
                the planned offering as an available coverage option.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900">What Spokane residents should do now</h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                No coverage decision is needed because of this update. Keep your current coverage
                information and wait for the approved Washington product documents. If the plan
                becomes available, compare its standardized benefits, premium, discounts, rate
                history, eligibility rules, and any additional services with other Medicare
                Supplement options—not just the Costco or SCAN name.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                Our{" "}
                <Link href={marketUpdatesHub.path} className="font-semibold text-blue-700 hover:underline">
                  2027 Spokane Medicare changes tracker
                </Link>{" "}
                will be updated as SCAN releases approved Washington plan details, rates, and timing.
                For general preparation, use the{" "}
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
                <li>
                  SCAN&apos;s subsequent Washington market announcement, which identifies Washington
                  for the Costco- and SCAN-co-branded Medicare Supplement portion of the planned
                  rollout.
                </li>
                <li>
                  <a
                    href="https://www.medicare.gov/medigap-supplemental-insurance-plans/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    Medicare.gov&apos;s Medicare Supplement overview
                  </a>{" "}
                  for how Medicare Supplement coverage works with Original Medicare.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-blue-950">
              <p className="font-semibold">Independent local reporting</p>
              <p className="mt-2 leading-relaxed">
                {siteConfig.legalName} is not affiliated with Costco, SCAN Group, or SCAN Health
                Plan. This page is general information and does not recommend or compare a
                Costco- and SCAN-co-branded product.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">Update log</h2>
              <div className="mt-3 space-y-2 leading-relaxed text-gray-700">
                <p>
                  <time dateTime={marketUpdate.modifiedDate}>{marketUpdate.modifiedLabel}</time> —
                  Updated after Costco and SCAN identified Washington for their co-branded Medicare
                  Supplement rollout.
                </p>
                <p>
                  <time dateTime={publishedDate}>{marketUpdate.publishedLabel}</time> — Published
                  with the rollout states marked as unconfirmed.
                </p>
              </div>
            </div>

            <MarketUpdateLinks currentPath={pagePath} />

            <Disclaimer />
          </div>
        </section>
      </article>

    </>
  );
}
