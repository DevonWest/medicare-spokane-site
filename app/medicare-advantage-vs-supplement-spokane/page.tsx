import type { Metadata } from "next";
import Link from "next/link";
import FAQ, { type FAQItem } from "@/components/FAQ";
import LeadForm from "@/components/LeadForm";
import CTASection from "@/components/CTASection";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Medicare Advantage vs. Medicare Supplement in Spokane, WA",
  description:
    "Compare Medicare Advantage (Part C) and Medicare Supplement (Medigap) in Spokane, WA. Understand the trade-offs in cost, networks, and flexibility with help from a licensed independent insurance agency.",
  alternates: { canonical: `${siteConfig.url}/medicare-advantage-vs-supplement-spokane` },
  openGraph: {
    title: "Medicare Advantage vs. Medicare Supplement in Spokane",
    description:
      "Side-by-side comparison of Medicare Advantage and Medicare Supplement plans for Spokane-area residents.",
    url: `${siteConfig.url}/medicare-advantage-vs-supplement-spokane`,
  },
};

const faqs: FAQItem[] = [
  {
    question: "Is Medicare Advantage or Medicare Supplement better in Spokane?",
    answer:
      "Neither plan type is universally better — they are designed for different priorities. Medicare Advantage often has lower monthly premiums and bundles in extras, but uses provider networks. Medicare Supplement plans typically have higher premiums but predictable out-of-pocket costs and broad provider access. We can review both with you to see which fits your situation.",
  },
  {
    question: "Can I switch from Medicare Advantage to Medicare Supplement later?",
    answer:
      "You can usually change Medicare Advantage plans during the Annual Enrollment Period (Oct 15 – Dec 7). Switching to a Medicare Supplement after your initial Medigap open enrollment window may require medical underwriting, which can affect approval and price. We are happy to walk through your options.",
  },
  {
    question: "Do Medicare Advantage plans in Spokane include drug coverage?",
    answer:
      "Many Medicare Advantage plans include Part D prescription drug coverage. Some do not. Standalone Part D plans can be paired with Original Medicare and a Medicare Supplement. We can review formularies for the plans we represent.",
  },
  {
    question: "Will my doctor accept the plan I choose?",
    answer:
      "With Original Medicare plus a Medicare Supplement, you can generally see any provider in the U.S. who accepts Medicare. With a Medicare Advantage plan, your provider must be in the plan's network for in-network coverage. We can verify networks for the plans we offer before you enroll.",
  },
];

const comparison: Array<{
  feature: string;
  advantage: string;
  supplement: string;
}> = [
  {
    feature: "Monthly premium",
    advantage: "Often $0 – low; Part B premium still applies",
    supplement: "Higher monthly premium; Part B premium still applies",
  },
  {
    feature: "Out-of-pocket costs",
    advantage: "Copays/coinsurance per service, with annual max",
    supplement: "Predictable; many plans cover most cost-sharing",
  },
  {
    feature: "Provider access",
    advantage: "Network-based (HMO, PPO, etc.)",
    supplement: "Any U.S. provider that accepts Medicare",
  },
  {
    feature: "Prescription drugs",
    advantage: "Often included (MAPD)",
    supplement: "Add a standalone Part D plan",
  },
  {
    feature: "Extra benefits",
    advantage: "May include dental, vision, hearing, fitness",
    supplement: "Generally not included",
  },
  {
    feature: "Travel coverage",
    advantage: "Limited outside service area",
    supplement: "Strong nationwide; some plans include foreign travel emergency",
  },
];

export default function AdvantageVsSupplementPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-800 to-blue-600 text-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <nav aria-label="Breadcrumb" className="text-blue-200 text-sm mb-4">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span>Medicare Advantage vs. Supplement</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
            Medicare Advantage vs. Medicare Supplement in Spokane
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            A side-by-side look at the two main ways Spokane-area residents get Medicare coverage. We are a licensed
            independent insurance agency — we will help you weigh the trade-offs.
          </p>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">At a Glance</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold text-gray-700">Feature</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Medicare Advantage (Part C)</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Medicare Supplement (Medigap)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {comparison.map((row) => (
                  <tr key={row.feature}>
                    <th scope="row" className="px-4 py-3 font-medium text-gray-900 align-top">
                      {row.feature}
                    </th>
                    <td className="px-4 py-3 text-gray-700 align-top">{row.advantage}</td>
                    <td className="px-4 py-3 text-gray-700 align-top">{row.supplement}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            This is a general comparison for educational purposes. Specific plan benefits, premiums, and networks vary
            by carrier and ZIP code. We do not offer every plan available in your area.
          </p>
        </div>
      </section>

      {/* Form CTA */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Which Plan Type Fits Your Situation?
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The right choice depends on factors like your preferred doctors, your prescriptions, how often you travel,
              your budget, and how predictable you want your monthly costs to be. There is no single &ldquo;right&rdquo;
              answer — and we will not tell you there is.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Tell us about your situation and we will compare the Medicare Advantage and Medicare Supplement options we
              represent in your ZIP code, side by side.
            </p>
          </div>
          <div>
            <LeadForm
              source="advantage-vs-supplement"
              heading="Compare Plans for Your Situation"
              subheading="A licensed agent will walk through Medicare Advantage and Medigap options with you."
            />
          </div>
        </div>
      </section>

      <FAQ items={faqs} heading="Common Questions: Advantage vs. Supplement" />

      <CTASection
        heading="Still Not Sure Which Plan Type Is Right?"
        subheading="Speak with a licensed Spokane Medicare agent — no cost, no pressure."
      />
    </>
  );
}
