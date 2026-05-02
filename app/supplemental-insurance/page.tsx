import type { Metadata } from "next";
import CTASection from "@/components/CTASection";
import Disclaimer from "@/components/Disclaimer";
import FAQ, { type FAQItem } from "@/components/FAQ";
import LeadForm from "@/components/LeadForm";
import PageHero from "@/components/PageHero";
import { SupplementalInsuranceIllustration } from "@/components/Illustrations";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Supplemental Insurance in Spokane (Dental, Vision, Hospital Indemnity)",
  description:
    "Explore supplemental insurance options in Spokane — dental, vision, and hospital indemnity coverage that can complement your Medicare plan. Help comparing options at no cost.",
  alternates: { canonical: `${siteConfig.url}/supplemental-insurance` },
  openGraph: {
    title: "Supplemental Insurance in Spokane",
    description:
      "Dental, vision, and hospital indemnity coverage that can complement your Medicare plan.",
    url: `${siteConfig.url}/supplemental-insurance`,
  },
};

const faqs: FAQItem[] = [
  {
    question: "What counts as supplemental insurance?",
    answer:
      "On this page we use ‘supplemental insurance’ to mean ancillary products that complement Medicare — primarily standalone dental, vision, and hospital indemnity coverage. (Medicare Supplement / Medigap is a separate Medicare-specific product covered on its own page.)",
  },
  {
    question: "Do I need supplemental insurance if I already have Medicare Advantage?",
    answer:
      "Some Medicare Advantage plans include limited dental, vision, or hearing benefits. Standalone supplemental policies can fill gaps when those embedded benefits are limited. We can review what your current plan covers and help you decide whether additional coverage is worth it for your situation.",
  },
  {
    question: "Can I add supplemental coverage at any time of year?",
    answer:
      "In most cases, dental, vision, and hospital indemnity products can be enrolled in year-round, subject to the carrier’s underwriting and effective-date rules. A licensed insurance professional can walk you through what is available.",
  },
];

export default function SupplementalInsurancePage() {
  return (
    <>
      <PageHero
        title="Supplemental Insurance"
        subtitle="Dental, vision, and hospital indemnity coverage that can complement your Medicare plan."
        crumbs={[{ href: "/", label: "Home" }, { label: "Supplemental Insurance" }]}
        illustration={<SupplementalInsuranceIllustration />}
      />

      <section className="py-14 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-gray-800 space-y-5 text-lg leading-relaxed">
          <p>
            Original Medicare and many Medicare Advantage plans leave gaps in dental, vision, and
            hospital coverage. Standalone supplemental policies can help fill those gaps so an
            unexpected event has less of an impact on your budget.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 pt-2">Common supplemental options we help with</h2>
          <ul className="list-disc list-outside pl-6 space-y-2">
            <li>
              <strong>Dental</strong> — preventive cleanings, fillings, crowns, and other dental
              services.
            </li>
            <li>
              <strong>Vision</strong> — annual eye exams, frames, lenses, and contact lens
              allowances.
            </li>
            <li>
              <strong>Hospital indemnity</strong> — pays a fixed cash benefit if you are admitted to
              the hospital, which can help offset Medicare Advantage hospital copays.
            </li>
          </ul>

          <p>
            {siteConfig.legalName} can compare the supplemental products we represent and help you
            decide whether they make sense alongside your Medicare coverage. Carrier and product
            availability may vary by county.
          </p>
        </div>
      </section>

      <section className="py-10 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <Disclaimer />
        </div>
      </section>

      <FAQ items={faqs} heading="Supplemental Insurance FAQ" />

      <section className="py-12 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <LeadForm
            source="supplemental-insurance"
            heading="Ask About Supplemental Coverage"
            subheading="Tell us what gaps you are trying to fill and a licensed insurance professional will follow up."
            showMessage
          />
        </div>
      </section>

      <CTASection />
    </>
  );
}
