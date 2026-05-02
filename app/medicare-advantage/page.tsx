import type { Metadata } from "next";
import Link from "next/link";
import CTASection from "@/components/CTASection";
import Disclaimer from "@/components/Disclaimer";
import FAQ, { type FAQItem } from "@/components/FAQ";
import LeadForm from "@/components/LeadForm";
import PageHero from "@/components/PageHero";
import { MedicareAdvantageIllustration } from "@/components/Illustrations";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Medicare Advantage Plans in Spokane, WA",
  description:
    "Compare Medicare Advantage (Part C) plans in Spokane with a licensed independent insurance agency. We help you review network, drug, and benefit differences across the carriers we represent.",
  alternates: { canonical: `${siteConfig.url}/medicare-advantage` },
  openGraph: {
    title: "Medicare Advantage Plans in Spokane, WA",
    description:
      "Compare Medicare Advantage (Part C) options with a local Spokane licensed independent insurance agency.",
    url: `${siteConfig.url}/medicare-advantage`,
  },
};

const faqs: FAQItem[] = [
  {
    question: "What is Medicare Advantage (Part C)?",
    answer:
      "Medicare Advantage (also called Part C) is an alternative way to receive your Medicare benefits. Plans are offered by private insurance carriers approved by Medicare and typically bundle Part A (hospital), Part B (medical), and often Part D (prescription drugs). Many plans also include extras like dental, vision, hearing, and fitness programs.",
  },
  {
    question: "Are Medicare Advantage plans the same everywhere in Spokane?",
    answer:
      "No. Medicare Advantage plan availability, premiums, networks, and benefits can vary by ZIP code and county, and plans change every year. We can show you the plans we represent for your specific address and help you compare them.",
  },
  {
    question: "When can I enroll in a Medicare Advantage plan?",
    answer:
      "Most people enroll during their Initial Enrollment Period (around age 65), the Annual Enrollment Period (October 15 – December 7), or the Medicare Advantage Open Enrollment Period (January 1 – March 31). You may also qualify for a Special Enrollment Period if you have a qualifying life event.",
  },
];

export default function MedicareAdvantagePage() {
  return (
    <>
      <PageHero
        title="Medicare Advantage in Spokane"
        subtitle="Help comparing Medicare Advantage (Part C) options in Spokane County and Eastern Washington."
        crumbs={[{ href: "/", label: "Home" }, { label: "Medicare Advantage" }]}
        illustration={<MedicareAdvantageIllustration />}
      />

      <section className="py-14 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-gray-800 space-y-5 text-lg leading-relaxed">
          <p>
            Medicare Advantage plans bundle your Part A and Part B benefits — and usually Part D —
            into a single plan offered by a private carrier approved by Medicare. Many also include
            additional benefits such as dental, vision, hearing, and over-the-counter allowances.
          </p>
          <p>
            {siteConfig.legalName} is {siteConfig.agencyDescriptor}. We can help you compare the
            Medicare Advantage plans we represent so you can see how each one would work with your
            doctors, hospitals, and prescriptions, and help you find a plan that fits your needs.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4">What we look at together</h2>
          <ul className="list-disc list-outside pl-6 space-y-2">
            <li>
              <strong>Provider networks.</strong> Whether your doctors and preferred hospitals are
              in-network in the plans we represent.
            </li>
            <li>
              <strong>Prescription drug coverage.</strong> A side-by-side review of how your
              medications are covered, including tier placement and preferred pharmacies — see our{" "}
              <Link href="/medicare-part-d" className="text-blue-700 underline">
                Part D page
              </Link>{" "}
              for more on the prescription review.
            </li>
            <li>
              <strong>Total expected costs.</strong> Premium, deductibles, copays, and out-of-pocket
              maximums.
            </li>
            <li>
              <strong>Extra benefits</strong> like dental, vision, hearing, OTC allowances, and
              fitness programs.
            </li>
          </ul>

          <p>
            Plan availability changes year to year and varies by ZIP code. A no-cost consultation is
            the easiest way to see what is currently available at your address.
          </p>
        </div>
      </section>

      <section className="py-10 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <Disclaimer />
        </div>
      </section>

      <FAQ items={faqs} heading="Medicare Advantage FAQ" />

      <section className="py-12 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <LeadForm
            source="medicare-advantage"
            heading="Compare Medicare Advantage Plans"
            subheading="Share a few details and a licensed insurance professional will help compare the Medicare Advantage plans we represent in your area."
            showMessage
          />
        </div>
      </section>

      <CTASection />
    </>
  );
}
