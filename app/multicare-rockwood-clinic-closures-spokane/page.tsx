import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import CTASection from "@/components/CTASection";
import Disclaimer from "@/components/Disclaimer";
import MarketUpdateLinks from "@/components/MarketUpdateLinks";
import PageHero from "@/components/PageHero";
import { getMarketUpdateByPath } from "@/lib/marketUpdates";
import { siteConfig } from "@/lib/site";

const pagePath = "/multicare-rockwood-clinic-closures-spokane";
const pageUrl = `${siteConfig.url}${pagePath}`;
const update = getMarketUpdateByPath(pagePath) ?? (() => {
  throw new Error(`Missing market update registry entry for ${pagePath}.`);
})();
const description = "Five MultiCare Rockwood clinics in Spokane County will close in late 2026. See affected locations, closure dates and what patients should do next.";
const primaryCareNotice = "https://www.multicare.org/location/multicare-rockwood-main-clinic/multicare-rockwood-clinic-primary-care-access-clinic/";
const spokesmanReport = "https://www.spokesman.com/stories/2026/sep/04/multicare-to-close-multiple-clinics-by-the-end-of-/";
const journalReport = "https://www.spokanejournal.com/articles/18692-multicare-to-close-rockwood-eye-center";
const linkClass = "font-semibold text-blue-700 underline hover:text-blue-900";

export const metadata: Metadata = {
  title: "MultiCare Rockwood Closures in Spokane: 2026 Update",
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

const closures = [
  { name: "MultiCare Rockwood Primary Care Access Clinic", address: "300 E. Fifth Ave., Spokane", date: "2026-10-27", label: "October 27, 2026" },
  { name: "MultiCare Rockwood Dermatology Center", address: "300 E. Fifth Ave., Spokane", date: "2026-12-04", label: "December 4, 2026" },
  { name: "Rockwood Eye & Optical Center – Downtown", address: "300 E. Fifth Ave., Spokane", date: "2026-12-31", label: "December 31, 2026" },
  { name: "Rockwood Eye Center – Northpointe", address: "605 E. Holland Ave., Spokane", date: "2026-12-31", label: "December 31, 2026" },
  { name: "Rockwood Eye Center – Valley", address: "1414 N. Houk Road, Spokane Valley", date: "2026-12-31", label: "December 31, 2026" },
];

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
  spatialCoverage: { "@type": "AdministrativeArea", name: "Spokane County, Washington" },
  citation: [primaryCareNotice, spokesmanReport, journalReport],
};

export default function MultiCareRockwoodClosuresPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c") }} />
      <BreadcrumbSchema items={[
        { name: "Home", path: "/" },
        { name: "Resources", path: "/resources" },
        { name: "MultiCare Rockwood Clinic Closures" },
      ]} />
      <PageHero title={update.title}
        subtitle="Closure dates, the downtown retina-care exception and next steps for patients in Spokane and Spokane Valley."
        crumbs={[{ href: "/", label: "Home" }, { href: "/resources", label: "Resources" }, { label: "Rockwood Clinic Closures" }]} />
      <article className="bg-white px-4 py-12">
        <div className="mx-auto max-w-4xl space-y-10 text-lg leading-relaxed text-gray-700">
          <div>
            <p className="text-base text-gray-600">By <Link href="/our-team" className={linkClass}>{siteConfig.legalName}</Link> · Updated <time dateTime={update.modifiedDate}>{update.modifiedLabel}</time></p>
            <p className="mt-5">MultiCare Health System plans to close five Rockwood clinics and services in Spokane County before the end of 2026, according to its statement reported September 4 by <a href={spokesmanReport} className={linkClass}>The Spokesman-Review</a>.</p>
            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-6 text-gray-900">
              <p><strong>This announcement concerns specific outpatient services.</strong> It does not announce closure of Rockwood Main Clinic as a whole, Deaconess Hospital or Valley Hospital.</p>
            </div>
          </div>

          <section aria-labelledby="closure-dates">
            <h2 id="closure-dates" className="text-3xl font-bold text-gray-900">Which MultiCare Rockwood clinics are closing?</h2>
            <p className="mt-4">The announced schedule is below. Dates are from <a href={spokesmanReport} className={linkClass}>MultiCare&apos;s statement as reported locally</a>; MultiCare also posts an <a href={primaryCareNotice} className={linkClass}>official October 27 closure notice for the Primary Care Access Clinic</a>.</p>
            <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-base">
                <caption className="sr-only">Announced 2026 Rockwood clinic closure dates in Spokane County</caption>
                <thead className="bg-blue-50 text-gray-900"><tr>
                  <th scope="col" className="p-4">Clinic or service</th><th scope="col" className="p-4">Address</th><th scope="col" className="p-4">Closure date</th>
                </tr></thead>
                <tbody>{closures.map((clinic) => <tr key={clinic.name} className="border-t border-slate-200">
                  <th scope="row" className="p-4 font-semibold text-gray-900">{clinic.name}</th>
                  <td className="p-4">{clinic.address}</td><td className="p-4"><time dateTime={clinic.date}>{clinic.label}</time></td>
                </tr>)}</tbody>
              </table>
            </div>
            <p className="mt-5"><strong>Downtown retina-care exception:</strong> limited medical-retina services are expected to continue downtown through June 2027. Confirm your particular treatment and appointment with the clinic; this is not an extension of all eye-care services. <a href={spokesmanReport} className={linkClass}>Read the reported exception.</a></p>
            <p className="mt-4">MultiCare says it is contacting affected patients about care transitions. <a href={journalReport} className={linkClass}>The Journal of Business reports on the eye-clinic transition.</a></p>
          </section>

          <section aria-labelledby="patient-steps">
            <h2 id="patient-steps" className="text-3xl font-bold text-gray-900">What should current patients do?</h2>
            <p className="mt-4">If you receive care at one of these locations, begin planning before its closure date. Questions to ask your care team include:</p>
            <ol className="mt-5 list-decimal space-y-4 pl-6">
              <li><strong>How will I receive updates?</strong> Check that the clinic has your current phone number, mailing address and email.</li>
              <li><strong>What happens to my appointments?</strong> Ask about visits scheduled after the closure date. Do not assume they will transfer automatically.</li>
              <li><strong>Is my provider moving?</strong> Ask whether your physician will practice elsewhere and when that information will be available.</li>
              <li><strong>Who will manage ongoing care?</strong> Discuss refills, pending test results and follow-up treatment with your care team. Ask about timely arrangements for regular eye injections or other continuing treatment.</li>
              <li><strong>How do records and referrals transfer?</strong> Ask whether the clinic will coordinate the transfer or whether you need to submit a request.</li>
              <li><strong>Does the replacement office take my coverage?</strong> Confirm the exact provider, location and insurance plan before scheduling, along with new-patient availability.</li>
            </ol>
            <p className="mt-5">For a starting point, use <a href="https://www.multicare.org/find-a-doctor/" className={linkClass}>MultiCare&apos;s provider directory</a> or <a href="https://www.medicare.gov/care-compare/?providerType=Physician" className={linkClass}>Medicare Care Compare</a>. A directory listing does not guarantee appointment availability or participation in your specific Medicare Advantage plan.</p>
          </section>

          <section aria-labelledby="coverage-questions">
            <h2 id="coverage-questions" className="text-3xl font-bold text-gray-900">Does this mean MultiCare is leaving my Medicare plan?</h2>
            <p className="mt-4">No—this announcement is about clinic closures, not a system-wide Medicare insurance-network change. If your care moves to a different office or medical group, check that new arrangement with the provider and your insurer.</p>
            <p className="mt-4">For Medicare Advantage, verify the individual clinician, clinic address, medical group and complete plan name. An office saying it accepts Medicare is not confirmation that it participates in every Medicare Advantage network. See our <Link href="/multicare-medicare-advantage-plans-spokane" className={linkClass}>MultiCare and Rockwood Medicare network guide</Link> for the existing Spokane listings and verification steps.</p>
            <p className="mt-4">With Original Medicare, ask whether the new provider accepts Medicare and Medicare assignment, and whether they are taking new patients. <a href="https://www.medicare.gov/coverage/doctor-other-health-care-provider-services" className={linkClass}>Medicare explains physician coverage and costs.</a></p>
            <h3 className="mt-7 text-2xl font-bold text-gray-900">Do I need to change my Medicare coverage?</h3>
            <p className="mt-4">Not necessarily. First find out which replacement providers are available through your existing coverage. When reviewing options for 2027, consider provider access alongside prescriptions, pharmacies and costs. Do not assume a clinic closure automatically creates a right to change plans outside a valid enrollment period; ask your plan or 1-800-MEDICARE about your circumstances. <a href="https://www.medicare.gov/basics/get-started-with-medicare/get-more-coverage/joining-a-plan/special-enrollment-periods" className={linkClass}>Medicare explains case-by-case special enrollment rights.</a></p>
          </section>

          <section aria-labelledby="closure-reason">
            <h2 id="closure-reason" className="text-3xl font-bold text-gray-900">Why is MultiCare closing these clinics?</h2>
            <p className="mt-4">MultiCare described the decision as following a service review focused on Rockwood&apos;s long-term sustainability. A more detailed reason was not provided in the <a href={journalReport} className={linkClass}>September 4 Journal of Business report</a>. We would not attribute the closures to a particular insurance company or Medicare plan without supporting evidence.</p>
          </section>

          <section aria-labelledby="local-help">
            <h2 id="local-help" className="text-3xl font-bold text-gray-900">We are here to help with the insurance questions</h2>
            <p className="mt-4">Finding out that a familiar clinic is closing can be unsettling. Our advice is to start with the facts, make a plan with your care team and check coverage before making a decision.</p>
            <p className="mt-4">Whether you already work with us or are looking for help for the first time, Health Insurance Options is here year-round. We can help check provider participation for the Medicare plans we represent and identify questions that need confirmation from your insurer.</p>
            <p className="mt-4">We cannot schedule medical appointments or transfer medical records, but you do not have to sort through the insurance questions alone. Call <a href={`tel:${siteConfig.phone.replace(/\D/g, "")}`} className={linkClass}>{siteConfig.phone}</a> or <Link href="/contact" className={linkClass}>contact our Spokane team</Link>.</p>
          </section>

          <section aria-labelledby="sources">
            <h2 id="sources" className="text-2xl font-bold text-gray-900">Sources and confirmation</h2>
            <p className="mt-4 text-base">Information checked September 5, 2026. We located MultiCare&apos;s primary-care closure notice, but did not locate a standalone public newsroom release covering all five services. The complete schedule and retina exception above are attributed to MultiCare&apos;s statement as reported by local news. Contact the clinic for patient-specific arrangements.</p>
            <ul className="mt-4 list-disc space-y-3 pl-6 text-base">
              <li><a href={primaryCareNotice} className={linkClass}>MultiCare: Primary Care Access Clinic closure notice</a></li>
              <li><a href={spokesmanReport} className={linkClass}>The Spokesman-Review: MultiCare to close multiple clinics, September 4, 2026</a></li>
              <li><a href={journalReport} className={linkClass}>Journal of Business: MultiCare plans to shut down eye clinics, September 4, 2026</a></li>
            </ul>
          </section>
          <MarketUpdateLinks currentPath={pagePath} />
          <Disclaimer />
        </div>
      </article>
      <CTASection heading="Questions About Medicare Provider Access?" subheading="Our Spokane team can help you check provider participation for the plans we represent. No cost, no pressure." />
    </>
  );
}
