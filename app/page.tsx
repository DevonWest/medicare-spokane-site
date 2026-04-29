import type { Metadata } from "next";
import Link from "next/link";
import CTASection from "@/components/CTASection";
import FAQ, { type FAQItem } from "@/components/FAQ";
import LeadForm from "@/components/LeadForm";
import TrustBenefits from "@/components/TrustBenefits";
import { siteConfig, telHref } from "@/lib/site";

export const metadata: Metadata = {
  title: `${siteConfig.shortName} | ${siteConfig.positioning}`,
  description: siteConfig.description,
  alternates: { canonical: siteConfig.url },
  openGraph: {
    title: `${siteConfig.shortName} | ${siteConfig.positioning}`,
    description: siteConfig.description,
    url: siteConfig.url,
    type: "website",
  },
};

const homepageFaqs: FAQItem[] = [
  {
    question: "Does it cost anything to talk to a licensed insurance professional?",
    answer:
      "No. Our consultations are no-cost and no-obligation. Health Insurance Options LLC is paid by the insurance carriers we represent, so your monthly premium is the same whether you enroll on your own or work with us.",
  },
  {
    question: "Do you offer every Medicare plan available in Spokane?",
    answer:
      "No. We do not offer every plan available in your area. Currently, we represent 8 organizations which offer 75 products in your area. Please contact Medicare.gov, 1-800-MEDICARE, or your local State Health Insurance Assistance Program (SHIP) to get information on all of your options.",
  },
  {
    question: "Can you help me review my prescription drugs when comparing plans?",
    answer:
      "Yes. We can sit down with your current prescription list and help you compare how each Medicare Advantage or Part D plan we represent would cover your medications, including preferred pharmacies and tier placement.",
  },
  {
    question: "What if I'm turning 65 soon?",
    answer:
      "We can walk you through your Initial Enrollment Period, the differences between Original Medicare, Medicare Advantage, Medicare Supplement, and Part D, and help you compare options without any pressure.",
  },
  {
    question: "Are you affiliated with the government or Medicare?",
    answer:
      "No. Health Insurance Options LLC is a licensed independent insurance agency. We are not affiliated with or endorsed by the U.S. Centers for Medicare & Medicaid Services (CMS), Medicare.gov, the Social Security Administration, or the U.S. Department of Health and Human Services (HHS).",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-800 to-blue-600 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="inline-block bg-blue-900/40 border border-blue-400/50 text-blue-100 text-xs font-semibold uppercase tracking-wider rounded-full px-3 py-1 mb-5">
              Licensed Independent Insurance Agency · Spokane, WA
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-5">
              {siteConfig.positioning}
            </h1>
            <p className="text-xl text-blue-100 mb-6 leading-relaxed">
              Local Spokane Medicare help from {siteConfig.legalName}. Our team has more than{" "}
              <strong className="text-white">40 years of combined Medicare-related insurance
              experience</strong> and offers no-cost consultations to help you compare Medicare
              Advantage, Medicare Supplement, Part D, and supplemental insurance options.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={telHref}
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-800 font-bold px-7 py-3 rounded-lg hover:bg-blue-50 transition-colors text-lg"
              >
                Call {siteConfig.phone}
              </a>
              <Link
                href="/request-contact"
                className="inline-flex items-center justify-center bg-blue-900 hover:bg-blue-950 text-white font-semibold px-7 py-3 rounded-lg transition-colors text-lg border border-blue-400"
              >
                Request a Call Back
              </Link>
            </div>
          </div>

          <div className="lg:pl-4">
            <LeadForm
              source="homepage"
              heading="Schedule a No-Cost Medicare Review"
              subheading="A licensed insurance professional will reach out to help you compare options in your area."
            />
          </div>
        </div>
      </section>

      {/* Topic Cards */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            How We Help Spokane-Area Residents
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Whether you are new to Medicare or reviewing your current coverage, we will help compare
            the options we represent so you can find a plan that fits your needs.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                href: "/medicare-advantage",
                title: "Medicare Advantage",
                body:
                  "Compare Medicare Advantage (Part C) plans available in Spokane County and help understand network, drug, and benefit differences.",
              },
              {
                href: "/medicare-supplements",
                title: "Medicare Supplements (Medigap)",
                body:
                  "Review Medicare Supplement options that work alongside Original Medicare to help with out-of-pocket costs.",
              },
              {
                href: "/medicare-part-d",
                title: "Medicare Part D",
                body:
                  "Walk through your prescription list and compare standalone Part D plans we represent, including preferred pharmacies.",
              },
              {
                href: "/supplemental-insurance",
                title: "Supplemental Insurance",
                body:
                  "Dental, vision, and hospital indemnity coverage that can complement your Medicare plan.",
              },
              {
                href: "/carriers",
                title: "Carriers We Represent",
                body:
                  "See the carriers we currently work with. Carrier and plan availability may vary by county, product type, and enrollment period.",
              },
              {
                href: "/medicare-enrollment-resources",
                title: "Enrollment Resources",
                body:
                  "Initial Enrollment, Annual Enrollment, and Special Enrollment Periods explained in plain language.",
              },
            ].map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="bg-gray-50 rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all group"
              >
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 mb-2 transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">{card.body}</p>
                <span className="text-blue-700 text-sm font-medium group-hover:underline">Learn more →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <TrustBenefits />

      {/* RX review band */}
      <section className="py-14 px-4 bg-blue-50 border-y border-blue-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Bring Your Prescription List
          </h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            One of the most useful things we do during a no-cost consultation is review your current
            prescriptions. We will help you compare how the Medicare Advantage and Part D plans we
            represent would cover your medications — including tier placement, preferred pharmacies,
            and estimated annual costs — so you can choose with confidence.
          </p>
          <Link
            href="/request-contact"
            className="inline-block bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Request a Drug Review
          </Link>
        </div>
      </section>

      <FAQ items={homepageFaqs} heading="Common Medicare Questions in Spokane" />

      <CTASection
        heading="Talk With a Local Licensed Insurance Professional"
        subheading="No cost, no pressure — just straightforward Medicare guidance in Spokane."
      />
    </>
  );
}
