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

const pagePath = "/multicare-medicare-advantage-plans-spokane";
const pageUrl = `${siteConfig.url}${pagePath}`;

export const metadata: Metadata = {
  title: "MultiCare Medicare Plans Accepted in Spokane",
  description:
    "See 2026 Medicare Advantage products MultiCare and Rockwood list in Spokane, including Humana, SCAN, UnitedHealthcare, Aetna, Regence and Molina D-SNP.",
  alternates: { canonical: pageUrl },
  openGraph: {
    title: "MultiCare and Rockwood Medicare Advantage Networks in Spokane",
    description:
      "A product-specific Spokane guide to Humana, SCAN, UnitedHealthcare, Aetna, Regence and Molina network information.",
    url: pageUrl,
    type: "article",
  },
};

const faqs: FAQItem[] = [
  {
    question: "Does MultiCare accept Humana Medicare Advantage in Spokane?",
    answer:
      "MultiCare's Spokane County list names Humana group-retiree Medicare Advantage PPO plans. It does not list individual Humana Medicare Advantage plans. Confirm the complete plan name with Humana and the MultiCare provider.",
  },
  {
    question: "Does MultiCare accept SCAN Medicare Advantage?",
    answer:
      "Yes, MultiCare lists SCAN Health Plan for Spokane County, and SCAN announced MultiCare network access in Spokane beginning January 1, 2026. Exact physicians, facilities, and plan participation still need confirmation.",
  },
  {
    question: "Which UnitedHealthcare Medicare products does MultiCare list in Spokane?",
    answer:
      "MultiCare's Spokane County list names Dual Complete HMO, AARP/UnitedHealthcare Medicare Advantage HMO, and group-retiree Medicare Advantage PPO plans. Other UnitedHealthcare PPO or special-needs products should be checked separately.",
  },
  {
    question: "Is MultiCare in network for Molina Medicare Advantage D-SNP?",
    answer:
      "MultiCare says it is no longer in network for Molina Medicare Advantage D-SNP plans effective January 1, 2026. This statement is specific to D-SNP and should not be applied to every Molina product without checking.",
  },
];

export default function MultiCareMedicareAdvantagePlansSpokanePage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Resources", path: "/resources" },
          { name: "Spokane Provider Networks", path: PROVIDER_NETWORK_GUIDE_PATH },
          { name: "MultiCare and Rockwood Medicare Plans" },
        ]}
      />

      <PageHero
        title="Medicare Advantage Plans Accepted by MultiCare and Rockwood in Spokane"
        subtitle="The public Spokane County list is product-specific. HMO, PPO, group-retiree, and D-SNP distinctions matter."
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/resources", label: "Resources" },
          { href: PROVIDER_NETWORK_GUIDE_PATH, label: "Provider Networks" },
          { label: "MultiCare / Rockwood" },
        ]}
      />

      <main>
        <section className="bg-white px-4 py-12">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm text-gray-500">
              Sources checked{" "}
              <time dateTime={PROVIDER_NETWORK_CHECKED_AT}>{PROVIDER_NETWORK_CHECKED_LABEL}</time>
            </p>
            <div className="mt-6 rounded-2xl border-2 border-amber-200 bg-amber-50 p-7">
              <p className="text-sm font-semibold uppercase tracking-wider text-amber-800">
                Direct answer about Humana
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                MultiCare lists Humana group-retiree Medicare Advantage PPO plans—not every Humana plan
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                A broad statement that MultiCare either “accepts Humana” or “does not accept Humana”
                leaves out the most important detail. MultiCare&apos;s Spokane County page identifies
                group-retiree Medicare Advantage PPO plans. Individual Humana Medicare Advantage
                products are not included in that listing.
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-slate-50 px-4 py-14">
          <div className="mx-auto max-w-6xl">
            <ProviderNetworkDirectory fixedSystemId="multicare-spokane" showFilters={false} />
          </div>
        </section>

        <section className="bg-white px-4 py-14">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-3">
            <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-7">
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
                SCAN
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">MultiCare is a named SCAN network partner</h2>
              <p className="mt-4 leading-relaxed text-gray-700">
                MultiCare lists SCAN for Spokane County, and SCAN announced access to MultiCare
                providers in Spokane beginning January 1, 2026.
              </p>
            </article>
            <article className="rounded-2xl border border-blue-200 bg-blue-50 p-7">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
                UnitedHealthcare
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">Several named products are listed</h2>
              <p className="mt-4 leading-relaxed text-gray-700">
                MultiCare names Dual Complete HMO, AARP/UnitedHealthcare Medicare Advantage HMO,
                and group-retiree Medicare Advantage PPO. Do not assume another UHC PPO is included.
              </p>
            </article>
            <article className="rounded-2xl border border-rose-200 bg-rose-50 p-7">
              <p className="text-sm font-semibold uppercase tracking-wider text-rose-700">
                Molina D-SNP
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">Out of network beginning in 2026</h2>
              <p className="mt-4 leading-relaxed text-gray-700">
                MultiCare says Molina Medicare Advantage D-SNP became out of network January 1,
                2026. This is a product-specific change, not a statement about every Molina plan.
              </p>
            </article>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-blue-50 px-4 py-14">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-gray-900">
              Rockwood Clinic and hospital participation can still differ
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              MultiCare&apos;s accepted-plan page is an important starting point, but a health-system
              listing does not replace an exact physician check. Confirm the clinician, clinic
              location, hospital, physician group, and plan name before planned care.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              This is especially important for services that may involve independent radiology,
              pathology, anesthesia, laboratory, or other professional groups.
            </p>
            <Link
              href={PROVIDER_NETWORK_GUIDE_PATH}
              className="mt-6 inline-block font-semibold text-blue-700 hover:underline"
            >
              Search the full Spokane provider network guide →
            </Link>
          </div>
        </section>

        <FAQ heading="MultiCare and Rockwood Medicare Network Questions" items={faqs} />

        <section className="bg-white px-4 py-10">
          <div className="mx-auto max-w-4xl">
            <Disclaimer />
          </div>
        </section>

        <KnowledgePageEnhancements currentPath={pagePath} />
      </main>

      <CTASection
        heading="Need to Keep MultiCare or Rockwood Providers?"
        subheading="Bring the exact plan name and provider list. We can help check the plans we represent and identify details that need direct confirmation."
      />
    </>
  );
}
