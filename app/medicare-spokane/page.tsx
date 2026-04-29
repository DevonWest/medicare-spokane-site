import type { Metadata } from "next";
import Link from "next/link";
import FAQ, { type FAQItem } from "@/components/FAQ";
import LeadForm from "@/components/LeadForm";
import TrustBenefits from "@/components/TrustBenefits";
import CTASection from "@/components/CTASection";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Medicare in Spokane, WA – Plan Help from a Local Independent Agency",
  description:
    "Get straightforward Medicare help in Spokane, WA. Compare Medicare Advantage, Medicare Supplement (Medigap), and Part D options with a licensed independent insurance agency.",
  alternates: { canonical: `${siteConfig.url}/medicare-spokane` },
  openGraph: {
    title: "Medicare in Spokane, WA – Plan Help from a Local Independent Agency",
    description:
      "Compare Medicare Advantage, Medicare Supplement, and Part D options with a licensed independent insurance agency in Spokane.",
    url: `${siteConfig.url}/medicare-spokane`,
  },
};

const faqs: FAQItem[] = [
  {
    question: "What Medicare plans are available in Spokane, WA?",
    answer:
      "Spokane-area residents typically have access to Original Medicare (Parts A and B), Medicare Advantage (Part C) plans, Medicare Supplement (Medigap) plans, and standalone Medicare Part D prescription drug plans. The specific plans available depend on your ZIP code. We do not offer every plan available in your area, but we can help you compare the options we represent.",
  },
  {
    question: "Does it cost anything to work with your agency?",
    answer:
      "No. As a licensed independent insurance agency, we are paid by the insurance carriers we represent. Your monthly premium is the same whether you enroll on your own or work with us.",
  },
  {
    question: "When can I enroll in Medicare in Spokane?",
    answer:
      "Most people first become eligible during their Initial Enrollment Period — the seven-month window around their 65th birthday. You may also qualify for a Special Enrollment Period due to certain life events. The Annual Enrollment Period (October 15 – December 7) is when most current beneficiaries can change their Medicare Advantage or Part D coverage.",
  },
  {
    question: "Can you help me keep my current doctor?",
    answer:
      "We can review the provider networks of the Medicare Advantage and Part D plans we represent and help you understand which plans include your preferred providers and pharmacies. With Original Medicare plus a Medicare Supplement, you can generally see any provider in the U.S. who accepts Medicare.",
  },
];

export default function MedicareSpokanePage() {
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
            <span>Medicare in Spokane</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
            Medicare in Spokane, WA
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Local, no-pressure help from a licensed independent insurance agency. We help Spokane-area residents
            understand and compare Medicare Advantage, Medicare Supplement, and Part D options.
          </p>
        </div>
      </section>

      {/* Intro + Form */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              A Local Independent Agency, Not a Call Center
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Medicare can be confusing — especially when you are sorting through mailers, TV ads, and conflicting
              advice. We are a licensed independent insurance agency based in the Spokane area, and we work with
              multiple insurance carriers so we can compare options together rather than pushing a single plan.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our goal is to help you understand how Medicare works, what plan types may fit your situation, and what
              your next step is. Every conversation is at your pace, with no pressure.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-3">What we can help with</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex gap-2">
                <span className="text-blue-600">✓</span>
                Reviewing your current Medicare coverage during the Annual Enrollment Period
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">✓</span>
                Comparing Medicare Advantage and Medicare Supplement (Medigap) options
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">✓</span>
                Looking at standalone Part D prescription drug plans
              </li>
              <li className="flex gap-2">
                <span className="text-blue-600">✓</span>
                Walking through enrollment if you are turning 65 or losing employer coverage
              </li>
            </ul>
          </div>

          <div className="lg:pl-4">
            <LeadForm source="medicare-spokane" />
          </div>
        </div>
      </section>

      <TrustBenefits />

      <FAQ items={faqs} heading="Common Questions About Medicare in Spokane" />

      <CTASection
        heading="Talk to a Local Spokane Medicare Agent"
        subheading="Get straightforward answers from a licensed independent agent — no pressure, no obligation."
      />
    </>
  );
}
