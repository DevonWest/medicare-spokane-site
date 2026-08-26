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
} from "@/lib/providerNetworks";
import { siteConfig } from "@/lib/site";

const pagePath = "/providence-medicare-advantage-plans-spokane";
const pageUrl = `${siteConfig.url}${pagePath}`;

export const metadata: Metadata = {
  title: "Providence Medicare Plans Accepted in Spokane",
  description:
    "See Medicare Advantage carriers Providence lists in Washington, the Spokane PPO primary-care restriction, and whether SCAN is listed for Providence care.",
  alternates: { canonical: pageUrl },
  openGraph: {
    title: "Providence Medicare Advantage Networks in Spokane",
    description:
      "A dated, source-backed guide to Providence carrier listings, plan-level verification and SCAN network questions in Spokane.",
    url: pageUrl,
    type: "article",
  },
};

const faqs: FAQItem[] = [
  {
    question: "Which Medicare Advantage carriers does Providence list in Washington?",
    answer:
      "Providence lists Aetna, Asuris Northwest Health, Cigna Healthcare, Community Health Plan of Washington, Humana, Kaiser Foundation Health Plan of Washington, Molina Healthcare of Washington, PacificSource, Providence Medicare Advantage, Regence BlueShield, UnitedHealthcare, Wellcare, and Wellpoint. Not every carrier or plan is available in every county, and exact provider participation can differ.",
  },
  {
    question: "Does Providence accept SCAN Medicare Advantage in Spokane?",
    answer:
      "SCAN was not included on Providence's Washington Medicare Advantage carrier list when this page was checked on August 25, 2026. Because individual provider directories can differ, verify the exact SCAN plan and Providence provider before concluding that care is out of network.",
  },
  {
    question: "Is Providence accepting new Medicare Advantage PPO primary-care patients?",
    answer:
      "Providence stated on its Washington Medicare page that it was not accepting new primary-care patients with Medicare PPO plans at the source check. That restriction may not apply the same way to existing patients, specialists, hospitals, or HMO products, and it can change.",
  },
  {
    question: "Is Providence Health Plan the same as Providence hospitals and clinics?",
    answer:
      "No. Providence Health Plan is an insurance company, while Providence hospitals, clinics, and medical groups deliver health care. A change involving the insurance company does not by itself mean Providence hospitals are closing or leaving every other carrier network.",
  },
];

export default function ProvidenceMedicareAdvantagePlansSpokanePage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Resources", path: "/resources" },
          { name: "Spokane Provider Networks", path: PROVIDER_NETWORK_GUIDE_PATH },
          { name: "Providence Medicare Plans" },
        ]}
      />

      <PageHero
        title="Medicare Advantage Plans Accepted by Providence in Spokane"
        subtitle="Providence publishes a Washington carrier list, but the exact plan, Spokane facility, physician group, and new-patient status still need confirmation."
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/resources", label: "Resources" },
          { href: PROVIDER_NETWORK_GUIDE_PATH, label: "Provider Networks" },
          { label: "Providence" },
        ]}
      />

      <main>
        <section className="bg-white px-4 py-12">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm text-gray-500">
              Source checked{" "}
              <time dateTime={PROVIDER_NETWORK_CHECKED_AT}>{PROVIDER_NETWORK_CHECKED_LABEL}</time>
            </p>
            <div className="mt-6 rounded-2xl border-2 border-blue-200 bg-blue-50 p-7">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
                Direct answer
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                Providence lists many Medicare Advantage carriers in Washington, but not SCAN
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                Providence&apos;s public Washington list includes Aetna, Asuris, Cigna, Community Health
                Plan of Washington, Humana, Kaiser, Molina, PacificSource, Providence Medicare
                Advantage, Regence, UnitedHealthcare, Wellcare, and Wellpoint. SCAN was not listed
                when this page was checked.
              </p>
              <p className="mt-4 leading-relaxed text-gray-700">
                This is a carrier-level starting point. It does not establish that every product,
                hospital department, clinic, or physician participates.
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-slate-50 px-4 py-14">
          <div className="mx-auto max-w-6xl">
            <ProviderNetworkDirectory fixedSystemId="providence-spokane" showFilters={false} />
          </div>
        </section>

        <section className="bg-white px-4 py-14">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-2">
            <article className="rounded-2xl border border-amber-200 bg-amber-50 p-7">
              <p className="text-sm font-semibold uppercase tracking-wider text-amber-800">
                New-patient restriction
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                Medicare PPO primary care requires an extra check
              </h2>
              <p className="mt-4 leading-relaxed text-gray-700">
                Providence stated that it remained in network with the carriers it listed but was
                not accepting new primary-care patients with Medicare PPO plans at the source
                check. A network listing therefore does not answer whether a person can establish
                with a new Providence primary-care clinician.
              </p>
              <p className="mt-4 leading-relaxed text-gray-700">
                Ask separately about existing-patient status, primary care, specialists, hospital
                services, and the exact plan type.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-7">
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                SCAN question
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                “Not listed” is more accurate than a blanket “not accepted”
              </h2>
              <p className="mt-4 leading-relaxed text-gray-700">
                Providence&apos;s Washington carrier list did not include SCAN. SCAN does have
                Providence relationships in other markets, so national carrier or health-system
                names cannot be used to infer the Spokane network.
              </p>
              <p className="mt-4 leading-relaxed text-gray-700">
                Use SCAN&apos;s provider directory for the exact plan and contact the Providence clinic
                or facility before planned care.
              </p>
            </article>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-blue-50 px-4 py-14">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-gray-900">
              Providence insurance changes are a separate issue
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              Providence Health Plan&apos;s announced 2027 insurance transition does not mean
              Providence Sacred Heart Medical Center, Holy Family Hospital, or Providence clinics
              are closing. Someone choosing different 2027 coverage will still need to verify that
              the replacement plan includes the Providence doctors and facilities they use.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <Link
                href="/providence-health-plan-ending-2027-washington"
                className="font-semibold text-blue-700 hover:underline"
              >
                Read the Providence Health Plan 2027 update →
              </Link>
              <Link
                href={PROVIDER_NETWORK_GUIDE_PATH}
                className="font-semibold text-blue-700 hover:underline"
              >
                Compare Spokane provider networks →
              </Link>
            </div>
          </div>
        </section>

        <FAQ heading="Providence Medicare Network Questions" items={faqs} />

        <section className="bg-white px-4 py-10">
          <div className="mx-auto max-w-4xl">
            <Disclaimer />
          </div>
        </section>

        <KnowledgePageEnhancements currentPath={pagePath} />
      </main>

      <CTASection
        heading="Need to Keep Providence Doctors in Network?"
        subheading="Bring your provider list and exact plan information. We can help check the plans we represent and explain what still needs direct confirmation."
      />
    </>
  );
}
