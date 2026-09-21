import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import CTASection from "@/components/CTASection";
import Disclaimer from "@/components/Disclaimer";
import FAQ, { type FAQItem } from "@/components/FAQ";
import MarketUpdateLinks from "@/components/MarketUpdateLinks";
import PageHero from "@/components/PageHero";
import { getMarketUpdateByPath, marketUpdatesHub } from "@/lib/marketUpdates";
import { siteConfig } from "@/lib/site";

const pagePath = "/unitedhealthcare-providence-medicare-advantage-2027-spokane";
const pageUrl = `${siteConfig.url}${pagePath}`;
const update = getMarketUpdateByPath(pagePath) ?? (() => {
  throw new Error(`Missing market update registry entry for ${pagePath}.`);
})();
const description = "UHC announces a January 1, 2027 Providence network change. See affected Spokane hospitals, Washington D-SNP exceptions and next steps for your Medicare review.";
const uhcNotice = "https://www.uhc.com/providencepnw";
const enrollmentSource = "https://www.medicare.gov/health-drug-plans/open-enrollment";
const linkClass = "font-semibold text-blue-700 underline hover:text-blue-900";

export const metadata: Metadata = {
  title: "UHC & Providence: Spokane Medicare Network Changes for 2027",
  description,
  alternates: { canonical: pageUrl },
  openGraph: {
    title: update.title,
    description,
    url: pageUrl,
    type: "article",
    publishedTime: update.publishedDate,
    modifiedTime: update.modifiedDate,
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "@id": `${pageUrl}#article`,
  headline: update.title,
  description,
  datePublished: update.publishedDate,
  dateModified: update.modifiedDate,
  mainEntityOfPage: pageUrl,
  isAccessibleForFree: true,
  author: { "@type": "Organization", name: siteConfig.legalName, url: `${siteConfig.url}/our-team` },
  publisher: { "@type": "InsuranceAgency", "@id": `${siteConfig.url}#organization`, name: siteConfig.legalName, url: siteConfig.url },
  spatialCoverage: [
    { "@type": "City", name: "Spokane, Washington" },
    { "@type": "AdministrativeArea", name: "Stevens County, Washington" },
  ],
  citation: [uhcNotice, enrollmentSource],
};

const faqs: FAQItem[] = [
  {
    question: "When can I review and change my Medicare coverage for 2027?",
    answer: "Medicare Open Enrollment runs October 15 through December 7. Changes made during that period generally take effect January 1. You can gather your doctors, prescriptions and plan notices before enrollment begins.",
  },
  {
    question: "Can I switch to Original Medicare and buy a Medicare Supplement?",
    answer: "Medicare Open Enrollment allows a change from Medicare Advantage to Original Medicare, but buying a Medicare Supplement has separate eligibility rules. Check your ability to obtain Medigap coverage and whether you need a separate Part D plan before leaving your current plan.",
  },
];

export default function UnitedHealthcareProvidence2027Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c") }} />
      <BreadcrumbSchema items={[
        { name: "Home", path: "/" },
        { name: "Resources", path: "/resources" },
        { name: "2027 Coverage Updates", path: marketUpdatesHub.path },
        { name: "UnitedHealthcare and Providence" },
      ]} />
      <PageHero title={update.title}
        subtitle="What the announcement means for your Providence care, which coverage needs a separate check, and how our Spokane team can help you prepare."
        crumbs={[{ href: "/", label: "Home" }, { href: "/resources", label: "Resources" }, { href: marketUpdatesHub.path, label: "2027 Coverage Updates" }, { label: "UHC and Providence" }]} />
      <article className="bg-white px-4 py-12">
        <div className="mx-auto max-w-4xl space-y-10 text-lg leading-relaxed text-gray-700">
          <div>
            <p className="text-base text-gray-600">By <Link href="/our-team" className={linkClass}>{siteConfig.legalName}</Link> · Published <time dateTime={update.publishedDate}>{update.publishedLabel}</time></p>
            <p className="mt-5">If you rely on Providence doctors or hospitals, your provider list deserves careful attention during this year&apos;s Medicare review. We know how much it matters to keep care with people you trust, and we are here to help you work through the details.</p>
            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-6 text-gray-900">
              <h2 className="text-2xl font-bold">What UHC announced</h2>
              <p className="mt-4">UnitedHealthcare says Providence hospitals and providers in Washington and Oregon will leave its <strong>individual Medicare Advantage network January 1, 2027</strong>. The notice, updated September 17, concerns next year&apos;s network. <a href={uhcNotice} className={linkClass}>Read UHC&apos;s official announcement.</a></p>
            </div>
          </div>

          <section aria-labelledby="affected-hospitals">
            <h2 id="affected-hospitals" className="text-3xl font-bold text-gray-900">Which local hospitals are named?</h2>
            <p className="mt-4">UHC&apos;s list includes Providence Sacred Heart Medical Center, Holy Family Hospital, Mount Carmel Hospital and St. Joseph Hospital. Its <a href={uhcNotice} className={linkClass}>full notice lists affected Washington and Oregon hospitals</a>.</p>
            <p className="mt-4">For people in Spokane, Spokane Valley and Stevens County, start with the places you actually receive care. Include your primary doctor, specialists and hospital, plus any separate imaging, lab or therapy providers. Confirm each provider and location against the exact plan you are considering for 2027.</p>
          </section>

          <section aria-labelledby="plan-types">
            <h2 id="plan-types" className="text-3xl font-bold text-gray-900">Which UHC coverage is excluded from this announcement?</h2>
            <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-base">
                <caption className="sr-only">Coverage UHC excludes from the announced individual Medicare Advantage network change</caption>
                <thead className="bg-blue-50 text-gray-900"><tr><th scope="col" className="p-4">Coverage</th><th scope="col" className="p-4">UHC&apos;s stated scope</th></tr></thead>
                <tbody>
                  <tr className="border-t border-slate-200"><th scope="row" className="p-4 font-semibold">Dual Special Needs Plans (D-SNP)</th><td className="p-4">Washington</td></tr>
                  <tr className="border-t border-slate-200"><th scope="row" className="p-4 font-semibold">Medicare Supplement</th><td className="p-4">Excluded</td></tr>
                  <tr className="border-t border-slate-200"><th scope="row" className="p-4 font-semibold">Group retiree Medicare Advantage HMO/PPO</th><td className="p-4">Washington</td></tr>
                  <tr className="border-t border-slate-200"><th scope="row" className="p-4 font-semibold">Chronic Special Needs Plans (C-SNP)</th><td className="p-4">Oregon</td></tr>
                  <tr className="border-t border-slate-200"><th scope="row" className="p-4 font-semibold">Employer commercial coverage</th><td className="p-4">Washington and Oregon; renewed</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-5"><strong>Renewal negotiations continue for Washington D-SNP/group retiree plans and Oregon C-SNP plans.</strong> Being excluded from this announcement is not a final 2027 network guarantee. <a href={uhcNotice} className={linkClass}>Check UHC&apos;s current notice.</a></p>
            <p className="mt-4">If your card says Dual Complete, ask UHC to confirm your exact Washington D-SNP. If it says AARP, also check whether the coverage is Medicare Advantage or Medicare Supplement; the brand name alone does not answer that question.</p>
          </section>

          <section aria-labelledby="ongoing-treatment">
            <h2 id="ongoing-treatment" className="text-3xl font-bold text-gray-900">What if I am in ongoing treatment?</h2>
            <p className="mt-4">UHC describes temporary continuity-of-care protection for qualifying serious or complex treatment. Call the number on your member card about eligibility and approval. Its notice also confirms emergency care at the in-network benefit level. <a href={uhcNotice} className={linkClass}>Read the care provisions.</a></p>
            <p className="mt-4">Tell your care team about any appointments or procedures scheduled for next year. Ask the plan to explain the approved time period, providers and services in writing. Keep that response with your coverage notices.</p>
          </section>

          <section aria-labelledby="review-steps">
            <h2 id="review-steps" className="text-3xl font-bold text-gray-900">How to prepare for your 2027 Medicare review</h2>
            <ol className="mt-5 list-decimal space-y-4 pl-6">
              <li><strong>Gather your notices and member card.</strong> Bring the complete plan name and any letter about provider changes.</li>
              <li><strong>Make your care list.</strong> Write down the doctors and facilities you want to keep, along with prescriptions and your preferred pharmacy.</li>
              <li><strong>Check the exact year and plan.</strong> A 2026 directory or a general carrier list cannot establish 2027 participation. Ask both the insurer and the provider about your specific plan and location.</li>
              <li><strong>Compare the whole picture.</strong> Consider access to care, drug coverage and costs together. Our <Link href="/medicare-plan-review-spokane" className={linkClass}>annual Medicare review guide</Link> can help you prepare.</li>
            </ol>
            <p className="mt-5">Medicare&apos;s annual enrollment period runs <strong>October 15–December 7</strong>, with changes effective January 1. If you are considering Original Medicare and a Supplement, check Medigap eligibility and Part D needs first; they require their own review. <a href={enrollmentSource} className={linkClass}>Medicare explains enrollment choices.</a></p>
          </section>

          <section aria-labelledby="separate-news">
            <h2 id="separate-news" className="text-3xl font-bold text-gray-900">How does this relate to the other Providence news?</h2>
            <p className="mt-4">This article covers UHC&apos;s provider-network announcement. Our <Link href="/providence-health-plan-ending-2027-washington" className={linkClass}>Providence Health Plan article</Link> covers changes to Providence&apos;s own insurance business. Keep the two notices separate when reviewing your coverage.</p>
            <p className="mt-4">Use our <Link href="/providence-medicare-advantage-plans-spokane" className={linkClass}>Providence Medicare network guide</Link> and <Link href="/spokane-medicare-provider-networks" className={linkClass}>Spokane provider-network directory</Link> as starting points, then confirm the exact 2027 plan.</p>
          </section>

          <section aria-labelledby="local-help">
            <h2 id="local-help" className="text-3xl font-bold text-gray-900">We will help you work through it</h2>
            <p className="mt-4">You do not have to sort through the insurance questions alone. Whether you are already a client or reaching out for the first time, our Health Insurance Options team can help review the Medicare plans we represent and identify what needs direct confirmation.</p>
            <p className="mt-4">Call <a href={`tel:${siteConfig.phone.replace(/\D/g, "")}`} className={linkClass}>{siteConfig.phone}</a> or <Link href="/contact" className={linkClass}>contact our Spokane team</Link>. Bring your provider list and notices so we can focus on what matters to you.</p>
          </section>

          <section aria-labelledby="sources">
            <h2 id="sources" className="text-2xl font-bold text-gray-900">Sources and last check</h2>
            <p className="mt-4 text-base">Checked September 21, 2026, against UHC&apos;s notice dated September 17 and Medicare&apos;s enrollment guidance. Network information can change; rely on current plan documents and direct confirmation for your care.</p>
            <ul className="mt-4 list-disc space-y-3 pl-6 text-base">
              <li><a href={uhcNotice} className={linkClass}>UnitedHealthcare: Providence Health in Oregon and Washington</a></li>
              <li><a href={enrollmentSource} className={linkClass}>Medicare.gov: Open Enrollment</a></li>
            </ul>
          </section>
          <MarketUpdateLinks currentPath={pagePath} />
          <Disclaimer />
        </div>
      </article>
      <FAQ heading="Planning Your 2027 Medicare Review" items={faqs} />
      <CTASection heading="Questions About Your Providence Care and Medicare?" subheading="Our Spokane team can help you review the plans we represent and the providers you want to keep." />
    </>
  );
}
