import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import CTASection from "@/components/CTASection";
import Disclaimer from "@/components/Disclaimer";
import FAQ, { type FAQItem } from "@/components/FAQ";
import KnowledgePageEnhancements from "@/components/KnowledgePageEnhancements";
import PageHero from "@/components/PageHero";
import MedicarePlanNavigation from "@/components/MedicarePlanNavigation";
import ProviderNetworkDirectory from "@/components/ProviderNetworkDirectory";
import {
  PROVIDER_NETWORK_CHECKED_AT,
  PROVIDER_NETWORK_CHECKED_LABEL,
  PROVIDER_NETWORK_GUIDE_PATH,
} from "@/lib/providerNetworks";
import { siteConfig } from "@/lib/site";

const pagePath = "/inland-imaging-medicare-plans-spokane";
const pageUrl = `${siteConfig.url}${pagePath}`;

export const metadata: Metadata = {
  title: "Inland Imaging Medicare Plans Accepted in Spokane",
  description:
    "See Inland Imaging's 2026 contracted Medicare payers in Spokane, including Premera, Aetna, Humana, Kaiser, UHC, Regence, Molina and Original Medicare.",
  alternates: { canonical: pageUrl },
  openGraph: {
    title: "Inland Imaging Medicare Plans Accepted in Spokane",
    description:
      "A source-backed guide to Inland Imaging Medicare contracts, pending products, unlisted carriers and plan-level verification in Spokane.",
    url: pageUrl,
    type: "article",
  },
};

const faqs: FAQItem[] = [
  {
    question: "Which Medicare Advantage plans does Inland Imaging accept in Spokane?",
    answer:
      "Inland Imaging's contracted-payer page lists Premera, Kaiser, Aetna, UnitedHealthcare, PacificSource, Asuris/Regence, and Health Net Medicare Advantage. It also lists Humana Medicare, CHPW Medicare, and Molina Medicare/Special Needs without always naming a narrower product. Exact plan, location, service, and billing-entity participation should be confirmed.",
  },
  {
    question: "Does Inland Imaging accept Humana Medicare Advantage?",
    answer:
      "Inland Imaging lists Humana Medicare, but its contracted-payer page does not specify HMO, PPO, special-needs, individual, or group-retiree products. Confirm the complete Humana plan name with the plan and Inland Imaging before service.",
  },
  {
    question: "Does Inland Imaging accept SCAN Medicare Advantage?",
    answer:
      "SCAN was not included on Inland Imaging's contracted-payer page when this guide was checked on August 25, 2026. That is best described as not listed, not proof that every Inland Imaging service is out of network. Verify the exact SCAN plan and imaging provider.",
  },
  {
    question: "Does Inland Imaging accept Original Medicare?",
    answer:
      "Inland Imaging lists Traditional Medicare as participating in Jurisdiction F, which includes Washington. Confirm the exact imaging location, service, radiologist, and billing entity before care.",
  },
  {
    question: "Is Amerigroup Medicare Advantage accepted by Inland Imaging?",
    answer:
      "Inland Imaging marks Amerigroup Medicare Advantage as pending on its contracted-payer page. Do not rely on that as in-network participation unless Inland Imaging and the plan confirm the current contract.",
  },
  {
    question: "Why can an imaging center and radiologist have different insurance networks?",
    answer:
      "Imaging care can create separate facility and professional claims. Inland Imaging also describes multiple business entities and separate contract sections. Confirm the imaging location, radiologist or professional group, billing entity, service, and exact plan—not only the Inland Imaging name.",
  },
];

const verificationQuestions = [
  "Is the exact imaging location in network for the complete plan name on the member ID card?",
  "Is the radiologist or professional group that will interpret the study also in network?",
  "Will the facility and professional interpretation create separate claims or bills?",
  "Does the service require prior authorization or a plan-approved imaging location?",
];

export default function InlandImagingMedicarePlansSpokanePage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Resources", path: "/resources" },
          { name: "Spokane Provider Networks", path: PROVIDER_NETWORK_GUIDE_PATH },
          { name: "Inland Imaging Medicare Plans" },
        ]}
      />

      <PageHero
        title="Medicare Plans Accepted by Inland Imaging in Spokane"
        subtitle="Inland Imaging publishes a contracted-payer list, but the exact plan, imaging location, radiologist, service, and billing entity still need confirmation."
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/resources", label: "Resources" },
          { href: PROVIDER_NETWORK_GUIDE_PATH, label: "Provider Networks" },
          { label: "Inland Imaging" },
        ]}
      />

      <main>
        <section className="bg-white px-4 py-12">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm text-gray-500">
              Sources checked{" "}
              <time dateTime={PROVIDER_NETWORK_CHECKED_AT}>{PROVIDER_NETWORK_CHECKED_LABEL}</time>
            </p>
            <div className="mt-6 rounded-2xl border-2 border-blue-200 bg-blue-50 p-7">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
                Direct answer
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                Inland Imaging lists several Medicare plans and Traditional Medicare
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                Its official LLC/Integra professional-services list names Premera, Kaiser, Aetna,
                UnitedHealthcare, PacificSource, Asuris/Regence, and Health Net Medicare Advantage.
                It also names Humana Medicare, CHPW Medicare, Molina Medicare/Special Needs, and
                participating Traditional Medicare.
              </p>
              <p className="mt-4 leading-relaxed text-gray-700">
                Amerigroup Medicare Advantage is marked pending. Wellcare is listed without a
                product type. SCAN and Providence Medicare Advantage were not listed at the source
                check. Those distinctions are preserved in the directory below.
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-slate-50 px-4 py-14">
          <div className="mx-auto max-w-6xl">
            <ProviderNetworkDirectory fixedSystemId="inland-imaging" showFilters={false} />
          </div>
        </section>

        <section className="bg-white px-4 py-14">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-3">
            <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-7">
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
                Clearly named products
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                Several Medicare Advantage contracts are explicit
              </h2>
              <p className="mt-4 leading-relaxed text-gray-700">
                Premera, Kaiser, Aetna, UnitedHealthcare, PacificSource, Asuris/Regence, and Health
                Net are each listed with Medicare Advantage wording.
              </p>
            </article>
            <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-7">
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
                Product detail needed
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                Humana, CHPW, Molina, and Wellcare need a closer check
              </h2>
              <p className="mt-4 leading-relaxed text-gray-700">
                The source uses broader wording for these carriers or omits a product type. The
                member&apos;s complete plan name determines whether the public listing applies.
              </p>
            </article>
            <article className="rounded-2xl border border-amber-200 bg-amber-50 p-7">
              <p className="text-sm font-semibold uppercase tracking-wider text-amber-800">
                Pending contract
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                Amerigroup Medicare Advantage is not a confirmed listing
              </h2>
              <p className="mt-4 leading-relaxed text-gray-700">
                Inland Imaging labels Amerigroup Medicare Advantage as pending. Verify current
                participation before scheduling or receiving non-emergency services.
              </p>
            </article>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-blue-50 px-4 py-14">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Ask about both the imaging facility and professional interpretation
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                Inland Imaging is composed of multiple companies and publishes separate contract
                sections. A hospital or imaging facility can participate differently from the
                radiology group that interprets the study.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                Inland Imaging directs patients to their insurance plan for exact coverage and
                prior-authorization questions. Its billing page lists <a href="tel:+18887374455" className="font-semibold text-blue-700 hover:underline">1-888-737-4455</a> for billing and estimate questions.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-6">
                <a
                  href="https://www.inlandimaging.com/medical-providers-and-contracted-payers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-700 hover:underline"
                >
                  View Inland Imaging&apos;s payer list ↗
                </a>
                <a
                  href="https://www.inlandimaging.com/billing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-700 hover:underline"
                >
                  Read its insurance guidance ↗
                </a>
              </div>
            </div>
            <aside className="rounded-2xl border border-blue-200 bg-white p-7">
              <h2 className="text-2xl font-bold text-gray-900">Questions to ask before the scan</h2>
              <ol className="mt-6 space-y-5">
                {verificationQuestions.map((question, index) => (
                  <li key={question} className="flex gap-4 leading-relaxed text-gray-700">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-700 font-bold text-white">
                      {index + 1}
                    </span>
                    <span>{question}</span>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </section>

        <section className="bg-white px-4 py-12">
          <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-slate-50 p-7">
            <h2 className="text-2xl font-bold text-gray-900">Compare other Spokane provider networks</h2>
            <p className="mt-4 leading-relaxed text-gray-700">
              A plan that includes a hospital system does not automatically include every
              independent radiology or imaging contract. Use the full local directory to compare
              Inland Imaging with Providence, MultiCare, Rockwood Clinic, CHAS Health, and other
              source-backed listings.
            </p>
            <Link
              href={PROVIDER_NETWORK_GUIDE_PATH}
              className="mt-5 inline-block font-semibold text-blue-700 hover:underline"
            >
              Search the Spokane provider network guide →
            </Link>
          </div>
        </section>

        <FAQ heading="Inland Imaging Medicare Network Questions" items={faqs} />

        <section className="bg-white px-4 py-10">
          <div className="mx-auto max-w-4xl">
            <Disclaimer />
          </div>
        </section>

        <MedicarePlanNavigation currentPath={pagePath} />
        <KnowledgePageEnhancements currentPath={pagePath} />
      </main>

      <CTASection
        heading="Need to Confirm an Imaging Network Before Choosing a Plan?"
        subheading="Bring the exact plan name, imaging location, and provider information. We can help check the plans we represent and identify details that need direct confirmation."
      />
    </>
  );
}
