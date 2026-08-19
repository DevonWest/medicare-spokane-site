import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import Disclaimer from "@/components/Disclaimer";
import MarketUpdateLinks from "@/components/MarketUpdateLinks";
import PageHero from "@/components/PageHero";
import { getMarketUpdateByPath, marketUpdatesHub } from "@/lib/marketUpdates";
import { siteConfig } from "@/lib/site";

const pagePath = "/providence-health-plan-ending-2027-washington";
const pageUrl = `${siteConfig.url}${pagePath}`;
const marketUpdate = getMarketUpdateByPath(pagePath) ?? (() => {
  throw new Error(`Missing market update registry entry for ${pagePath}.`);
})();

const providenceStatusUrl =
  "https://www.providencehealthplan.com/about-providence/providence-news/status-update";
const washingtonOicUrl =
  "https://www.insurance.wa.gov/about-us/news/2026/thirteen-health-insurers-request-average-224-rate-increase-2027-individual-market";
const washingtonHealthplanfinderUrl =
  "https://www.wahealthplanfinder.org/us/en/health-coverage/new/federal-changes-and-updates.html";

export const metadata: Metadata = {
  title: "Providence Health Plan 2027 Changes",
  description:
    "Providence Health Plan will end Washington individual and family coverage after 2026. See what Spokane members should know about group and Medicare coverage.",
  alternates: { canonical: pageUrl },
  openGraph: {
    title: marketUpdate.title,
    description:
      "Washington individual coverage is ending after 2026, while Providence Medicare Advantage and Medicare Supplement details remain pending.",
    url: pageUrl,
    type: "article",
    publishedTime: `${marketUpdate.publishedDate}T09:00:00-07:00`,
    modifiedTime: `${marketUpdate.modifiedDate}T09:00:00-07:00`,
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "@id": `${pageUrl}#article`,
  headline: marketUpdate.title,
  description:
    "What Providence Health Plan's 2027 transition means for individual, family, employer group, Medicare Advantage, and Medicare Supplement members in Washington.",
  datePublished: marketUpdate.publishedDate,
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
    { "@type": "Organization", name: "Providence Health Plan" },
    { "@type": "State", name: "Washington" },
    { "@type": "City", name: "Spokane, Washington" },
    { "@type": "Thing", name: "Individual and family health insurance" },
    { "@type": "Thing", name: "Medicare Advantage" },
    { "@type": "Thing", name: "Medicare Supplement" },
  ],
  spatialCoverage: [
    { "@type": "State", name: "Washington" },
    { "@type": "AdministrativeArea", name: "Eastern Washington" },
    { "@type": "City", name: "Spokane" },
  ],
  citation: [providenceStatusUrl, washingtonOicUrl, washingtonHealthplanfinderUrl],
};

const confirmedChanges = [
  "Providence says current members will keep their existing coverage through the 2026 plan year.",
  "Individual and family policies will be discontinued effective January 1, 2027.",
  "Washington's insurance regulator confirms Providence Health Plan will not offer individual coverage in the state for 2027.",
  "Providence says small-group plans will end at the end of 2026, with advance notice to employer group sponsors.",
];

const pendingDetails = [
  "Providence Medicare Advantage members may be able to keep coverage through a potential agreement with another carrier, but final 2027 details have not been announced.",
  "Providence says current Medicare Supplement coverage remains in effect, with individual notice to come before any 2027 change.",
  "Some large-group or employer arrangements may continue into 2027, so employees should rely on information from their employer.",
  "A replacement plan's provider network, prescriptions, premium, deductible, and out-of-pocket costs cannot be assumed before 2027 options are released.",
];

export default function ProvidenceHealthPlanEnding2027WashingtonPage() {
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
          { name: "Resources", path: "/resources" },
          { name: "2027 Coverage Updates", path: marketUpdatesHub.path },
          { name: "Providence Health Plan 2027 Changes" },
        ]}
      />

      <PageHero
        title="Providence Health Plan Ending Most Coverage in 2027: What Spokane and Washington Members Should Know"
        subtitle="Washington individual and family coverage is ending after 2026. Medicare Advantage and Medicare Supplement members should wait for plan-specific 2027 details."
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/resources", label: "Resources" },
          { href: marketUpdatesHub.path, label: "2027 Coverage Updates" },
          { label: "Providence Health Plan" },
        ]}
      />

      <article>
        <section className="bg-white px-4 py-12">
          <div className="mx-auto max-w-4xl">
            <p className="text-sm text-gray-500">
              Published{" "}
              <time dateTime={marketUpdate.publishedDate}>{marketUpdate.publishedLabel}</time> · Last
              updated{" "}
              <time dateTime={marketUpdate.modifiedDate}>{marketUpdate.modifiedLabel}</time>
            </p>

            <div className="mt-7 rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-amber-950">
              <p className="text-sm font-semibold uppercase tracking-wider text-amber-800">
                Washington status: confirmed for individual coverage
              </p>
              <p className="mt-3 text-xl font-bold">
                Providence Health Plan will not offer individual and family health insurance in
                Washington for 2027.
              </p>
              <p className="mt-3 leading-relaxed">
                Current 2026 coverage continues through the end of the plan year. This does not
                mean every Providence insurance product is ending on the same terms, and it does
                not mean Providence hospitals or clinics are closing.
              </p>
            </div>

            <div className="mt-10 max-w-3xl space-y-5 text-lg leading-relaxed text-gray-700">
              <h2 className="text-3xl font-bold text-gray-900">What Providence announced</h2>
              <p>
                Providence Health Plan announced that it will transition out of most health
                insurance lines beginning in 2027. The company&apos;s July update says individual and
                family policies will be discontinued effective January 1, 2027, and will not be
                offered in 2027 or later.
              </p>
              <p>
                The Washington Office of the Insurance Commissioner separately reported that
                Providence Health Plan, which had 254 individual-market enrollees in Washington,
                will not offer individual coverage in the state for 2027. That makes this a
                confirmed Washington change with direct relevance for any Spokane-area member who
                is currently covered by Providence.
              </p>
              <p>
                Providence also says small-group plans will end at the end of 2026. Large-group,
                self-funded, Medicare Advantage, and Medicare Supplement arrangements have
                different transition details and should not be described as one blanket
                cancellation.
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
              <h2 className="mt-2 text-2xl font-bold text-gray-900">What is ending or changing</h2>
              <ul className="mt-5 space-y-4">
                {confirmedChanges.map((item) => (
                  <li key={item} className="flex gap-3 leading-relaxed text-gray-700">
                    <span className="font-bold text-emerald-700" aria-hidden="true">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-white p-7">
              <p className="text-sm font-semibold uppercase tracking-wider text-amber-700">
                Still pending or plan-specific
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">What remains uncertain</h2>
              <ul className="mt-5 space-y-4">
                {pendingDetails.map((item) => (
                  <li key={item} className="flex gap-3 leading-relaxed text-gray-700">
                    <span className="font-bold text-amber-700" aria-hidden="true">
                      ?
                    </span>
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
                What this means for Spokane and Eastern Washington
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                Providence is both a health system and the name of an insurance company. This
                announcement concerns Providence Health Plan&apos;s insurance business. It does not, by
                itself, say that Providence Sacred Heart Medical Center, Holy Family Hospital, or
                other Providence providers are closing.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                If you select different coverage for 2027, check the new plan&apos;s network rather
                than assuming a Providence doctor or facility will be in network. Also compare your
                prescriptions, pharmacies, premium, deductible, copays, and maximum out-of-pocket
                cost before enrolling.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900">What members should do next</h2>
              <ol className="mt-5 space-y-5 text-lg leading-relaxed text-gray-700">
                <li>
                  <strong className="text-gray-900">1. Identify your coverage type.</strong> An
                  individual or family plan, small-employer plan, large-employer plan, Medicare
                  Advantage plan, and Medicare Supplement policy do not follow the same transition
                  rules.
                </li>
                <li>
                  <strong className="text-gray-900">2. Keep every Providence notice.</strong> Your
                  written notice and employer communication will provide the terms that apply to
                  your specific policy.
                </li>
                <li>
                  <strong className="text-gray-900">3. Prepare a comparison list.</strong> Write
                  down your doctors, facilities, prescriptions, pharmacies, and expected medical
                  needs before reviewing replacement coverage.
                </li>
                <li>
                  <strong className="text-gray-900">4. Use the correct enrollment window.</strong>{" "}
                  Washington&apos;s 2027 individual-market open enrollment runs from November 1, 2026,
                  through January 15, 2027. Enrollment must be completed by December 31 for January
                  1 coverage.
                </li>
                <li>
                  <strong className="text-gray-900">5. Do not cancel 2026 coverage early.</strong>{" "}
                  Providence says current coverage continues through 2026; changing or canceling
                  it prematurely could create an avoidable gap.
                </li>
              </ol>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
                <h2 className="text-xl font-bold text-gray-900">Individual or family coverage</h2>
                <p className="mt-3 leading-relaxed text-gray-700">
                  Review our Spokane guide for comparing networks, prescriptions, costs, and
                  financial-help eligibility before 2027 enrollment opens.
                </p>
                <Link
                  href="/individual-family-health-insurance-spokane"
                  className="mt-4 inline-block font-semibold text-blue-700 hover:underline"
                >
                  Individual and family health insurance help →
                </Link>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
                <h2 className="text-xl font-bold text-gray-900">Medicare coverage</h2>
                <p className="mt-3 leading-relaxed text-gray-700">
                  Wait for plan-specific information, then compare doctors, prescriptions, and
                  total costs during the applicable Medicare enrollment period.
                </p>
                <Link
                  href="/medicare-plan-review-spokane"
                  className="mt-4 inline-block font-semibold text-blue-700 hover:underline"
                >
                  Prepare for a Medicare plan review →
                </Link>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900">Common questions</h2>
              <div className="mt-6 space-y-5">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Is Providence Health Plan completely shutting down in Washington?
                  </h3>
                  <p className="mt-2 leading-relaxed text-gray-700">
                    Providence is leaving most insurance lines, but the timing and outcome differ
                    by coverage type. Individual and family coverage is confirmed to end after
                    2026. Medicare and some employer arrangements have separate pending details.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Are Providence Medicare Advantage plans ending in 2027?
                  </h3>
                  <p className="mt-2 leading-relaxed text-gray-700">
                    That has not been confirmed as a blanket outcome. Providence says it is working
                    on a potential agreement with another carrier that may let current members keep
                    coverage. Members should wait for official plan-specific information.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Does the announcement mean Providence hospitals are closing?
                  </h3>
                  <p className="mt-2 leading-relaxed text-gray-700">
                    No. The announcement concerns Providence Health Plan&apos;s insurance lines. It is
                    separate from the operation of Providence hospitals, clinics, and medical
                    practices.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-bold text-gray-900">Sources reviewed</h2>
              <ul className="mt-4 space-y-3 text-gray-700">
                <li>
                  <a
                    href={providenceStatusUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    Providence Health Plan&apos;s official coverage transition update
                  </a>{" "}
                  for the company&apos;s confirmed and pending changes by coverage type.
                </li>
                <li>
                  <a
                    href={washingtonOicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    Washington Office of the Insurance Commissioner&apos;s 2027 individual-market
                    announcement
                  </a>{" "}
                  for Providence&apos;s confirmed Washington exit and statewide enrollment context.
                </li>
                <li>
                  <a
                    href={washingtonHealthplanfinderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    Washington Healthplanfinder&apos;s 2027 enrollment dates
                  </a>{" "}
                  for the November 1, 2026, through January 15, 2027, enrollment window.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-blue-950">
              <p className="font-semibold">Independent local reporting</p>
              <p className="mt-2 leading-relaxed">
                {siteConfig.legalName} is not affiliated with Providence Health Plan or Providence.
                This page provides general information and does not recommend any specific health
                insurance or Medicare plan.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">Update log</h2>
              <p className="mt-3 leading-relaxed text-gray-700">
                <time dateTime={marketUpdate.publishedDate}>{marketUpdate.publishedLabel}</time> —
                Published with Washington individual-market changes marked confirmed and Medicare
                details marked pending.
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
