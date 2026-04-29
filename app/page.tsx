import type { Metadata } from "next";
import Link from "next/link";
import CTASection from "@/components/CTASection";
import FAQ, { type FAQItem } from "@/components/FAQ";
import LeadForm from "@/components/LeadForm";
import TrustBenefits from "@/components/TrustBenefits";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `${siteConfig.name} | Local Medicare Help in Spokane, WA`,
  description: siteConfig.description,
  alternates: { canonical: siteConfig.url },
  openGraph: {
    title: `${siteConfig.name} | Local Medicare Help in Spokane, WA`,
    description: siteConfig.description,
    url: siteConfig.url,
    type: "website",
  },
};

const homepageFaqs: FAQItem[] = [
  {
    question: "Does it cost anything to talk to a licensed Medicare agent?",
    answer:
      "No. As a licensed independent insurance agency, we are paid by the insurance carriers we represent. Your monthly premium is the same whether you enroll on your own or work with us.",
  },
  {
    question: "Do you offer every Medicare plan available in Spokane?",
    answer:
      "No. We do not offer every plan available in your area. Any information we provide is limited to the plans we do offer in your area. For information on all of your options, contact Medicare.gov or 1-800-MEDICARE (TTY 1-877-486-2048).",
  },
  {
    question: "What if I'm turning 65 soon?",
    answer:
      "We can walk you through your Initial Enrollment Period, the differences between Original Medicare, Medicare Advantage, Medicare Supplement, and Part D, and help you compare options without any pressure.",
  },
  {
    question: "Can I switch my Medicare plan during the year?",
    answer:
      "The Medicare Annual Enrollment Period runs October 15 – December 7 and is when most beneficiaries can change their Medicare Advantage or Part D plan. Special Enrollment Periods may apply if you have a qualifying life event.",
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
              Licensed Independent Insurance Agency
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-5">
              Local Medicare Help in Spokane, WA
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Compare Medicare Advantage, Medicare Supplement, and Part D options with a licensed local agent — no
              cost, no pressure.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={`tel:${siteConfig.phone.replace(/\D/g, "")}`}
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-800 font-bold px-7 py-3 rounded-lg hover:bg-blue-50 transition-colors text-lg"
              >
                Call {siteConfig.phone}
              </a>
              <Link
                href="/medicare-spokane"
                className="inline-flex items-center justify-center bg-blue-900 hover:bg-blue-950 text-white font-semibold px-7 py-3 rounded-lg transition-colors text-lg border border-blue-400"
              >
                Learn More
              </Link>
            </div>
          </div>

          <div className="lg:pl-4">
            <LeadForm
              source="homepage"
              heading="Get a Free Medicare Review"
              subheading="A licensed agent will reach out to walk through the options in your area."
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
            Whether you are new to Medicare or reviewing your current coverage, we will help you understand your
            options without pressure.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                href: "/medicare-spokane",
                title: "Medicare in Spokane",
                body:
                  "Get a clear, local overview of Medicare and how a licensed independent agency can help you compare options.",
              },
              {
                href: "/turning-65-medicare-spokane",
                title: "Turning 65 & Medicare",
                body:
                  "A simple, step-by-step walk-through of Medicare for Spokane-area residents approaching age 65.",
              },
              {
                href: "/medicare-advantage-vs-supplement-spokane",
                title: "Advantage vs. Medigap",
                body:
                  "Compare Medicare Advantage (Part C) and Medicare Supplement (Medigap) side by side to see what fits your situation.",
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

      <FAQ items={homepageFaqs} heading="Common Medicare Questions in Spokane" />

      <CTASection
        heading="Ready to Talk With a Local Medicare Agent?"
        subheading="Speak with a licensed independent agent in Spokane — no cost, no pressure."
      />
    </>
  );
}
