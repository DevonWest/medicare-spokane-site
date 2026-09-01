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
const rateFilingUrl =
  "https://serff-sfa.naic.org/serff/sfa/search/filingSummary.xhtml?filingId=135055285";
const filingSearchUrl =
  "https://www.insurance.wa.gov/insurers-regulated-entities/rate-and-form-filing/search-company-filings-serff-filing-access";
const washingtonMedigapUrl =
  "https://www.insurance.wa.gov/insurance-resources/medicare/health-and-drug-plans/medigap-medicare-supplement-plan-coverage-and-costs";

export const metadata: Metadata = {
  title: marketUpdate.shortTitle,
  description:
    "A Washington filing proposes Costco and SCAN Medicare Supplement Plans A, G and N for 2027. See the proposed discounts, benefits and pending status.",
  alternates: { canonical: pageUrl },
  openGraph: {
    title: marketUpdate.title,
    description:
      "A public Washington filing outlines proposed Costco and SCAN Medicare Supplement plans, discounts and added benefits. Approval and final rates remain pending.",
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
    "A public Washington filing outlines proposed Costco and SCAN Medicare Supplement plans, discounts and added benefits. Approval and final rates remain pending.",
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
  citation: [reportingUrl, partnershipUrl, rateFilingUrl, washingtonMedigapUrl],
};

const knownItems = [
  "SCAN has identified Washington for its planned co-branded Medicare Supplement rollout with Costco.",
  "The public rate filing, SERFF tracking number IASL-135055285, was submitted August 14, 2026 and remained under review as of September 1, 2026.",
  "The filing proposes standardized Plans A, G and N with a target effective date of January 1, 2027.",
  "The filing proposes household and automatic-payment discounts plus Costco membership, vision and hearing benefits.",
];

const unknownItems = [
  "Whether regulators will approve the filing as submitted and whether the January 1, 2027 target date will hold.",
  "The final approved monthly premiums and whether any proposed discounts or added benefits will change during review.",
  "When applications will open, the final enrollment instructions and whether any geographic availability limits will apply.",
];

const proposedFilingDetails = [
  {
    label: "Standardized plans",
    detail: "Plans A, G and N.",
  },
  {
    label: "Target effective date",
    detail: "January 1, 2027.",
  },
  {
    label: "Household discount",
    detail: "7% for eligible members residing with a spouse, applied to both eligible members.",
  },
  {
    label: "Automatic-payment discount",
    detail: "$2 per month for payment by automatic bank withdrawal.",
  },
  {
    label: "Costco membership",
    detail: "An annual Costco membership, valued in the filing at $65 per household.",
  },
  {
    label: "Costco-only vision and hearing",
    detail:
      "Up to $300 annually for eye exams and lenses, and up to $400 annually for hearing aids, available only at Costco.",
  },
] as const;

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
        title="Costco and SCAN Medicare Supplement Washington Filing Update"
        subtitle="A public filing now outlines proposed Plans A, G and N, discounts and Costco-only extras. Regulatory approval and final rates are still pending."
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
                Washington filing status: review pending
              </p>
              <p className="mt-3 text-xl font-bold">
                The Washington market and proposed product details are now public, but the plan is
                not yet approved or open for enrollment.
              </p>
              <p className="mt-3 leading-relaxed">
                The rate filing was submitted on August 14, 2026. As of September 1, the Washington
                filing record still showed <strong>Review Pending</strong>. Every premium, discount,
                benefit and date below should be read as proposed and subject to change.
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
                SCAN has since identified Washington for the co-branded Medicare Supplement
                portion of its planned rollout with Costco. For Spokane residents, that replaces
                our earlier &quot;state not disclosed&quot; status with a confirmed Washington
                market and confirms that the Medicare Supplement product is part of the Costco
                partnership. It is not a new confirmation of a Costco- and SCAN-branded Medicare
                Advantage plan in Spokane County.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                The public Washington rate filing adds the first meaningful product details. It
                proposes standardized Medicare Supplement Plans A, G and N for a January 1, 2027
                effective date, along with discounts and value-added benefits tied to Costco. Those
                details are useful for planning, but they are not final until the regulatory review
                is complete.
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-slate-50 px-4 py-14">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
                Proposed in the public filing
              </p>
              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                Plans, discounts and added benefits
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                These are the terms SCAN and Costco submitted for review. They help show how the
                product is intended to work, but they are not an offer of coverage and should not
                be quoted as final approved benefits.
              </p>
            </div>
            <dl className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {proposedFilingDetails.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <dt className="font-bold text-gray-900">{item.label}</dt>
                  <dd className="mt-2 leading-relaxed text-gray-700">{item.detail}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 leading-relaxed text-amber-950">
              The proposed Washington rate exhibits are also public, but the premiums remain under
              review. We will post and compare the final approved rates when the filing receives a
              disposition.
            </p>
            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-6 text-blue-950">
              <h3 className="text-xl font-bold">
                Do not mix Medicare Advantage benefits with this Medicare Supplement filing
              </h3>
              <p className="mt-3 leading-relaxed">
                Separate SCAN rollout materials for the broader Costco partnership mention a Costco
                Preferred Pharmacy network, rewards and incentive programs, grocery benefits for
                some chronically ill members, and a retail presence during Annual Enrollment. Those
                features are described with the Medicare Advantage rollout; they do not appear as
                benefits in the Washington Medicare Supplement filing reviewed for this article.
              </p>
              <p className="mt-3 leading-relaxed">
                For the proposed Washington Medigap product, rely on the public filing: Plans A, G
                and N, the filed discounts, Costco membership, and the Costco-only vision and
                hearing allowances summarized above. Do not assume pharmacy, grocery, rewards or
                in-store enrollment features apply unless they appear in final Washington-approved
                documents.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-14">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200 bg-white p-7">
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
                Confirmed or filed
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
                Still pending
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

        <section className="border-y border-blue-100 bg-blue-50 px-4 py-14">
          <div className="mx-auto max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
              Independent broker perspective
            </p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              My take on the SCAN and Costco Medicare Supplement proposal
            </h2>
            <div className="mt-6 space-y-5 text-lg leading-relaxed text-gray-700">
              <p>
                The proposed starting prices deserve attention. Based on the public rate filing,
                Plan G and Plan N appear very competitive with many Medicare Supplement options
                currently available in Washington. If the final approved prices create meaningful
                savings, that is good news for beneficiaries, and we will take the option seriously.
              </p>
              <p>
                At the same time, a starting premium is only one part of the decision. This would
                be a new Medicare Supplement block with no rate history of its own. That is not a
                criticism of SCAN or Costco, and it is not a reason to dismiss the plan. Every new
                product begins without a track record. It simply means nobody can know yet how
                closely future claims and rate needs will match the original assumptions.
              </p>
              <p>
                The responsible approach is not to predict that rates will rise sharply, and it is
                not to assume that an attractive starting premium will remain unchanged. We should
                compare the final approved premium, discounts, added benefits, customer experience
                and future rate filings as actual experience develops.
              </p>
              <p>
                If an approved option can save a client $50 or $60 per month, that is $600 to $720
                per year back in their pocket. We should not ignore meaningful savings simply
                because a product is new. We also should not recommend a plan based only on the
                Costco name or the first-year premium.
              </p>
              <p>
                Washington gives many current Medicare Supplement policyholders valuable
                flexibility. According to the{" "}
                <a
                  href={washingtonMedigapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-700 hover:underline"
                >
                  Washington Office of the Insurance Commissioner
                </a>
                , someone already enrolled in a Medigap Plan B through Plan N can generally switch
                to another Plan B through Plan N at any time without completing a written health
                screening questionnaire. Every situation should still be reviewed individually,
                especially for someone who is not already enrolled in one of those plans.
              </p>
              <p>
                Our job is not to declare a winner before the filing is approved. If the SCAN and
                Costco plan becomes a strong fit for a client, we will help them take advantage of
                it. If the price or the client&apos;s needs change later, we will be there to review the
                options again. We approach Medicare coverage as an ongoing relationship, not a
                one-time sale.
              </p>
              <p>
                I hope the proposed pricing proves sustainable. More competition and meaningful
                savings can be very good for Washington consumers. We will keep watching the filing
                and give our clients the same careful, honest guidance after approval and in every
                year that follows.
              </p>
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
                Medicare Advantage service-area network. The filing does not present a county-by-county
                service area. Even so, residents should wait for approved product documents, premiums,
                eligibility rules and final Washington availability before treating the proposed plan
                as an available coverage option.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900">What Spokane residents should do now</h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                No coverage decision is needed because of this update. Keep your current coverage
                information and wait for the approved Washington product documents. If the plan
                becomes available, compare its standardized benefits, premium, discounts, eligibility
                rules and additional services with other Medicare Supplement options. After launch,
                its rate history should become part of that review too.
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
                    href={rateFilingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    Washington&apos;s public SERFF rate filing IASL-135055285
                  </a>{" "}
                  for the proposed plans, discounts, added benefits, target effective date and
                  pending status. SERFF may first display its public-access agreement.
                </li>
                <li>
                  <a
                    href={filingSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    Washington OIC filing-search instructions
                  </a>{" "}
                  for independently locating the SCAN filing by company name or tracking number.
                </li>
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
                  <a
                    href={washingtonMedigapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    Washington OIC&apos;s Medicare Supplement guidance
                  </a>{" "}
                  for the state&apos;s rules on switching among Medigap Plans B through N.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-blue-950">
              <p className="font-semibold">Independent local reporting and opinion</p>
              <p className="mt-2 leading-relaxed">
                {siteConfig.legalName} is not affiliated with Costco, SCAN Group, or SCAN Health
                Plan. The filing facts and independent commentary on this page have not been
                reviewed or approved by those organizations and are not a recommendation to enroll.
                Filed terms may change before approval.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">Update log</h2>
              <div className="mt-3 space-y-2 leading-relaxed text-gray-700">
                <p>
                  <time dateTime={marketUpdate.modifiedDate}>{marketUpdate.modifiedLabel}</time> —
                  Verified that the Washington filing remains under review and clarified that
                  broader Costco and SCAN Medicare Advantage features are not confirmed benefits of
                  the proposed Washington Medicare Supplement product.
                </p>
                <p>
                  <time dateTime="2026-08-28">August 28, 2026</time> — Added the public filing
                  status, proposed Plans A, G and N, proposed discounts and Costco-only benefits,
                  plus independent client-focused commentary.
                </p>
                <p>
                  <time dateTime="2026-08-27">August 27, 2026</time> — Updated after SCAN identified
                  Washington for its planned co-branded Medicare Supplement rollout with Costco.
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
