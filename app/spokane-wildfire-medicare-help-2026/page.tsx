import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import Disclaimer from "@/components/Disclaimer";
import MarketUpdateLinks from "@/components/MarketUpdateLinks";
import PageHero from "@/components/PageHero";
import { getMarketUpdateByPath } from "@/lib/marketUpdates";
import { siteConfig } from "@/lib/site";

const pagePath = "/spokane-wildfire-medicare-help-2026";
const pageUrl = `${siteConfig.url}${pagePath}`;
const marketUpdate = getMarketUpdateByPath(pagePath) ?? (() => {
  throw new Error(`Missing market update registry entry for ${pagePath}.`);
})();

const cmsAlertUrl =
  "https://www.cms.gov/newsroom/news-alert/cms-announces-resources-flexibilities-assist-public-health-emergency-state-washington";
const cmsEmergencyUrl =
  "https://www.cms.gov/about-cms/what-we-do/emergency-response/current-emergencies";
const medicareDisasterUrl =
  "https://www.medicare.gov/providers-services/disaster-emergency";
const medicareSpecialEnrollmentUrl =
  "https://www.medicare.gov/basics/get-started-with-medicare/get-more-coverage/joining-a-plan/special-enrollment-periods";

export const metadata: Metadata = {
  title: "Spokane Wildfire Medicare Help & Special Enrollment",
  description:
    "Spokane wildfire Medicare help for prescriptions, damaged equipment, dialysis and possible Special Enrollment Periods during Washington's emergency.",
  keywords: [
    "Spokane wildfire Medicare help",
    "Washington wildfire Medicare special enrollment",
    "Spokane Medicare prescription emergency",
    "Medicare disaster assistance Washington",
  ],
  alternates: { canonical: pageUrl },
  openGraph: {
    title: marketUpdate.title,
    description:
      "Official Medicare protections are active for Washington wildfires affecting Spokane County. See the help available and the limits on disaster enrollment rights.",
    url: pageUrl,
    type: "article",
    publishedTime: `${marketUpdate.publishedDate}T10:00:00-07:00`,
    modifiedTime: `${marketUpdate.modifiedDate}T10:00:00-07:00`,
  },
};

const faqItems = [
  {
    question: "Does the Spokane wildfire let me change Medicare plans?",
    answer:
      "Not automatically. Medicare says a disaster or emergency Special Enrollment Period may be available if the declared emergency prevented you from using another valid enrollment period. Call 1-800-MEDICARE to ask whether your circumstances qualify.",
  },
  {
    question: "Can I refill a Medicare Part D prescription during the wildfire emergency?",
    answer:
      "CMS says Part D plans must make sure displaced beneficiaries can get covered drugs at out-of-network pharmacies when normal access is disrupted. Plans are also expected to remove refill-too-soon edits when medication was lost because of the emergency. Contact your plan or 1-800-MEDICARE for help.",
  },
  {
    question: "Will Medicare replace equipment damaged by a wildfire?",
    answer:
      "Medicare beneficiaries may get replacements for covered durable medical equipment, prosthetics, orthotics and supplies that were lost or damaged in the emergency. Call 1-800-MEDICARE for assistance with the replacement process.",
  },
  {
    question: "Where can Spokane dialysis patients get emergency help?",
    answer:
      "CMS says ESRD Network 16 is helping dialysis patients and facilities in Spokane County. Its emergency hotline is 1-800-232-3773. People facing an immediate medical emergency should call 911.",
  },
] as const;

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "@id": `${pageUrl}#article`,
  headline: marketUpdate.title,
  description:
    "Spokane-focused guidance on Medicare prescription access, equipment replacement, dialysis support and possible Special Enrollment Periods during Washington's wildfire emergency.",
  datePublished: marketUpdate.publishedDate,
  dateModified: marketUpdate.modifiedDate,
  mainEntityOfPage: pageUrl,
  isAccessibleForFree: true,
  articleSection: "Medicare emergency assistance",
  keywords: [
    "Spokane wildfire Medicare help",
    "Washington wildfire Medicare",
    "Medicare Special Enrollment Period",
    "Spokane County",
  ],
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
    { "@type": "Thing", name: "Medicare emergency assistance" },
    { "@type": "Thing", name: "Washington wildfires" },
    { "@type": "AdministrativeArea", name: "Spokane County, Washington" },
    { "@type": "Thing", name: "Medicare Special Enrollment Period" },
  ],
  spatialCoverage: [
    { "@type": "AdministrativeArea", name: "Spokane County" },
    { "@type": "City", name: "Spokane" },
    { "@type": "State", name: "Washington" },
  ],
  citation: [
    cmsAlertUrl,
    cmsEmergencyUrl,
    medicareDisasterUrl,
    medicareSpecialEnrollmentUrl,
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${pageUrl}#faq`,
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function SpokaneWildfireMedicareHelpPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c"),
        }}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Resources", path: "/resources" },
          { name: "Spokane Wildfire Medicare Help" },
        ]}
      />

      <PageHero
        title="Spokane Wildfire Medicare Help: Prescriptions, Equipment, Dialysis and Enrollment Rights"
        subtitle="Official Medicare protections are active during Washington's wildfire emergency. Here is what Spokane County residents can use now—and when a disaster Special Enrollment Period may apply."
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/resources", label: "Resources" },
          { label: "Wildfire Medicare Help" },
        ]}
      />

      <article>
        <section className="bg-white px-4 py-12">
          <div className="mx-auto max-w-4xl">
            <p className="text-sm text-gray-500">
              Published <time dateTime={marketUpdate.publishedDate}>{marketUpdate.publishedLabel}</time>{" "}
              · Last updated{" "}
              <time dateTime={marketUpdate.modifiedDate}>{marketUpdate.modifiedLabel}</time>
            </p>

            <div className="mt-7 rounded-2xl border-2 border-red-300 bg-red-50 p-6 text-red-950">
              <p className="text-sm font-semibold uppercase tracking-wider text-red-800">
                Spokane County status: federal protections active
              </p>
              <p className="mt-3 text-xl font-bold">
                Medicare emergency assistance applies to Washington wildfires affecting areas near
                Spokane County.
              </p>
              <p className="mt-3 leading-relaxed">
                CMS says wildfire emergency conditions began August 1, 2026, and are continuing.
                The federal public health emergency was declared August 7 and made effective back
                to August 1. The affected fires named by CMS include Fairview, Autumn Lane and Old
                Trails near Spokane County.
              </p>
            </div>

            <div className="mt-10 max-w-3xl space-y-5 text-lg leading-relaxed text-gray-700">
              <h2 className="text-3xl font-bold text-gray-900">
                What Medicare help is available during the Spokane wildfire emergency?
              </h2>
              <p>
                Medicare and CMS have emergency rules intended to keep care available when people
                are displaced, pharmacies are inaccessible, equipment is damaged or normal health
                care operations are interrupted. The help that applies depends on your coverage and
                circumstances.
              </p>
              <p>
                For individual assistance, call{" "}
                <a href="tel:+18006334227" className="font-semibold text-blue-700 hover:underline">
                  1-800-MEDICARE (1-800-633-4227)
                </a>
                . TTY users can call 1-877-486-2048. If you are in immediate danger or have a
                medical emergency, call 911.
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-slate-50 px-4 py-14">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-gray-900">Four Medicare protections to know</h2>
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <article className="rounded-2xl border border-blue-200 bg-white p-7">
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
                  Prescriptions
                </p>
                <h3 className="mt-2 text-2xl font-bold text-gray-900">
                  Part D access when your usual pharmacy is unavailable
                </h3>
                <p className="mt-4 leading-relaxed text-gray-700">
                  CMS says Part D plans must make sure displaced beneficiaries can obtain covered
                  drugs at out-of-network pharmacies when normal access is disrupted. Plans are
                  expected to remove refill-too-soon limits when medication was lost because of the
                  emergency. Call your Part D plan first, or 1-800-MEDICARE if you need help.
                </p>
              </article>

              <article className="rounded-2xl border border-blue-200 bg-white p-7">
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
                  Medical equipment
                </p>
                <h3 className="mt-2 text-2xl font-bold text-gray-900">
                  Replacement of lost or damaged Medicare equipment
                </h3>
                <p className="mt-4 leading-relaxed text-gray-700">
                  Medicare beneficiaries may get replacements for covered durable medical
                  equipment, prosthetics, orthotics and supplies lost or damaged in the emergency.
                  That can include items Medicare originally paid for. Call 1-800-MEDICARE for help
                  with the replacement process.
                </p>
              </article>

              <article className="rounded-2xl border border-blue-200 bg-white p-7">
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
                  Dialysis
                </p>
                <h3 className="mt-2 text-2xl font-bold text-gray-900">
                  ESRD Network 16 is assisting Spokane County
                </h3>
                <p className="mt-4 leading-relaxed text-gray-700">
                  CMS says ESRD Network 16 is helping dialysis patients and facilities in Spokane
                  County. Call the network&apos;s emergency hotline at{" "}
                  <a href="tel:+18002323773" className="font-semibold text-blue-700 hover:underline">
                    1-800-232-3773
                  </a>{" "}
                  if treatment access has been disrupted.
                </p>
              </article>

              <article className="rounded-2xl border border-blue-200 bg-white p-7">
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
                  Enrollment
                </p>
                <h3 className="mt-2 text-2xl font-bold text-gray-900">
                  A disaster Special Enrollment Period may apply
                </h3>
                <p className="mt-4 leading-relaxed text-gray-700">
                  If the declared emergency prevented you from using another valid Medicare
                  enrollment period, you may qualify for a disaster or emergency Special Enrollment
                  Period. This is not automatic for every Spokane-area resident and is not a general
                  open-enrollment window.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-14">
          <div className="mx-auto max-w-4xl space-y-11">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Can I change Medicare plans because of the wildfire?
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                Possibly, but only in specific circumstances. Medicare.gov says an emergency
                Special Enrollment Period may be available when the declared disaster or emergency
                kept you from using another enrollment opportunity for which you were already
                eligible. Examples can involve enrollment in Original Medicare, Medicare Advantage
                or a Medicare drug plan, depending on the missed period.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                Do not assume the wildfire creates a new plan-change right by itself. Call
                1-800-MEDICARE and explain which enrollment period you missed, how the emergency
                prevented you from using it and the dates involved. Because the emergency is still
                active, this page does not list a fixed deadline.
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900">What to do now</h2>
              <ol className="mt-5 space-y-5 text-lg leading-relaxed text-gray-700">
                <li>
                  <strong className="text-gray-900">1. Protect immediate health needs.</strong> Call
                  911 for urgent medical help. Contact your doctor, dialysis center, plan or pharmacy
                  as soon as normal access is interrupted.
                </li>
                <li>
                  <strong className="text-gray-900">2. Keep a simple record.</strong> Note the dates
                  you were displaced, prescriptions or equipment lost, calls made and any enrollment
                  deadline the emergency prevented you from meeting.
                </li>
                <li>
                  <strong className="text-gray-900">3. Call the right Medicare contact.</strong> Use
                  your plan&apos;s member-service number for plan benefits. Call 1-800-MEDICARE for
                  Original Medicare, replacement-equipment or enrollment questions.
                </li>
                <li>
                  <strong className="text-gray-900">4. Verify before changing coverage.</strong> If
                  you believe you qualify for a Special Enrollment Period, confirm eligibility and
                  the applicable deadline with Medicare before submitting a change.
                </li>
              </ol>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
                <h2 className="text-xl font-bold text-gray-900">Organize prescription information</h2>
                <p className="mt-3 leading-relaxed text-gray-700">
                  Keep an up-to-date list of medications, doses and pharmacies so a replacement or
                  emergency refill can be reviewed accurately.
                </p>
                <Link
                  href="/rx-drug-review"
                  className="mt-4 inline-block font-semibold text-blue-700 hover:underline"
                >
                  Use the prescription review guide →
                </Link>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
                <h2 className="text-xl font-bold text-gray-900">Find local Medicare guidance</h2>
                <p className="mt-3 leading-relaxed text-gray-700">
                  Start with our Spokane Medicare guide for enrollment basics, official resources
                  and questions to prepare before asking for help.
                </p>
                <Link
                  href="/medicare-spokane"
                  className="mt-4 inline-block font-semibold text-blue-700 hover:underline"
                >
                  Medicare help in Spokane →
                </Link>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900">Common questions</h2>
              <div className="mt-6 space-y-6">
                {faqItems.map((item) => (
                  <div key={item.question}>
                    <h3 className="text-xl font-semibold text-gray-900">{item.question}</h3>
                    <p className="mt-2 leading-relaxed text-gray-700">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-xl font-bold text-gray-900">Official sources reviewed</h2>
              <ul className="mt-4 space-y-3 text-gray-700">
                <li>
                  <a
                    href={cmsAlertUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    CMS Washington wildfire public health emergency alert
                  </a>{" "}
                  for Spokane-area conditions, prescription access, equipment replacement and
                  dialysis assistance.
                </li>
                <li>
                  <a
                    href={cmsEmergencyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    CMS current emergencies page
                  </a>{" "}
                  for the active Washington declaration and federal updates.
                </li>
                <li>
                  <a
                    href={medicareDisasterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    Medicare.gov disaster and emergency guidance
                  </a>{" "}
                  for coverage access and disaster Special Enrollment Period rules.
                </li>
                <li>
                  <a
                    href={medicareSpecialEnrollmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    Medicare.gov Special Enrollment Period guidance
                  </a>{" "}
                  for additional enrollment timing information.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-blue-950">
              <p className="font-semibold">Independent local reporting</p>
              <p className="mt-2 leading-relaxed">
                {siteConfig.legalName} is not affiliated with CMS, Medicare or any emergency-response
                agency. This page summarizes public information and does not determine eligibility
                for an enrollment period or benefit.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">Update log</h2>
              <p className="mt-3 leading-relaxed text-gray-700">
                <time dateTime={marketUpdate.publishedDate}>{marketUpdate.publishedLabel}</time> —
                Published with CMS protections for the Washington wildfire emergency and Spokane
                County assistance details. We will update this page when the federal emergency
                status or Medicare instructions change.
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
