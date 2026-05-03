import type { Metadata } from "next";
import CTASection from "@/components/CTASection";
import Disclaimer from "@/components/Disclaimer";
import FAQ, { type FAQItem } from "@/components/FAQ";
import FriendlyIllustration from "@/components/FriendlyIllustration";
import LeadForm from "@/components/LeadForm";
import PageHero from "@/components/PageHero";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Medicare Part D Prescription Drug Plans in Spokane",
  description:
    "Compare Medicare Part D prescription drug plans in Spokane. We help you review your medications and how each plan we represent would cover them, including preferred pharmacies.",
  alternates: { canonical: `${siteConfig.url}/medicare-part-d` },
  openGraph: {
    title: "Medicare Part D Prescription Drug Plans in Spokane",
    description:
      "Help comparing standalone Medicare Part D plans, including a prescription review.",
    url: `${siteConfig.url}/medicare-part-d`,
  },
};

const faqs: FAQItem[] = [
  {
    question: "What does Medicare Part D cover?",
    answer:
      "Medicare Part D is the prescription drug benefit. It is offered through standalone Part D plans (often paired with Original Medicare and a Medicare Supplement) or as part of most Medicare Advantage plans. Each plan has its own formulary (list of covered drugs), tiers, and preferred pharmacies.",
  },
  {
    question: "What is creditable drug coverage?",
    answer:
      "Creditable coverage is prescription drug coverage that is expected to pay, on average, at least as much as standard Medicare Part D. If you delay enrolling in Part D and do not have creditable coverage, you may owe a late enrollment penalty when you do enroll. We can review your situation with you.",
  },
  {
    question: "How do I know which Part D plan is best for my prescriptions?",
    answer:
      "There is no single ‘best’ plan — the right plan depends on your specific medications, dosages, and pharmacy preferences. We can sit down with your prescription list and compare how the Part D plans we represent would cover your drugs, including tier placement and preferred-pharmacy pricing.",
  },
];

export default function MedicarePartDPage() {
  return (
    <>
      <PageHero
        title="Medicare Part D in Spokane"
        subtitle="Help comparing standalone Medicare Part D prescription drug plans, including a no-cost prescription review."
        crumbs={[{ href: "/", label: "Home" }, { label: "Medicare Part D" }]}
        illustration={<FriendlyIllustration name="prescriptionReview" />}
      />

      <section className="py-14 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-gray-800 space-y-5 text-lg leading-relaxed">
          <p>
            Choosing the right Medicare Part D plan is mostly about your specific medications. The
            same drug can be on different formulary tiers across plans, and preferred-pharmacy
            pricing can change your annual costs significantly.
          </p>
          <p>
            {siteConfig.legalName} offers a no-cost prescription review as part of our consultation.
            Bring your current prescription list — including dosages and how often you fill — and we
            will help you compare how the Part D plans we represent would cover those medications.
          </p>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 not-prose">
            <h2 className="text-xl font-bold text-gray-900 mb-2">RX drug review checklist</h2>
            <ul className="list-disc list-outside pl-6 text-base text-gray-800 space-y-1">
              <li>Drug name, strength, and dosage form</li>
              <li>How many days’ supply you receive at a time</li>
              <li>Your preferred pharmacy (and any back-up pharmacy)</li>
              <li>Whether you want mail-order or 90-day fills</li>
              <li>Any drug allergies or recent prescription changes</li>
            </ul>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 pt-4">When you can enroll or change Part D</h2>
          <ul className="list-disc list-outside pl-6 space-y-2">
            <li>
              <strong>Initial Enrollment Period</strong> — the seven-month window around your 65th
              birthday.
            </li>
            <li>
              <strong>Annual Enrollment Period</strong> — October 15 through December 7 each year.
            </li>
            <li>
              <strong>Special Enrollment Periods</strong> — when certain qualifying life events
              happen (move, loss of creditable coverage, etc.).
            </li>
          </ul>
        </div>
      </section>

      <section className="py-10 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <Disclaimer />
        </div>
      </section>

      <FAQ items={faqs} heading="Medicare Part D FAQ" />

      <section className="py-12 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <LeadForm
            source="medicare-part-d"
            heading="Request a No-Cost Prescription Review"
            subheading="Tell us how to reach you and a licensed insurance professional will help compare Part D plans for your medications."
            showMessage
          />
        </div>
      </section>

      <CTASection />
    </>
  );
}
