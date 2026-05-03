import type { Metadata } from "next";
import Link from "next/link";
import CTASection from "@/components/CTASection";
import Disclaimer from "@/components/Disclaimer";
import FAQ, { type FAQItem } from "@/components/FAQ";
import LeadForm from "@/components/LeadForm";
import PageHero from "@/components/PageHero";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Medicare Supplement (Medigap) Plans in Spokane",
  description:
    "Help comparing Medicare Supplement (Medigap) options in Spokane. Plans work alongside Original Medicare to help with deductibles, coinsurance, and other out-of-pocket costs.",
  alternates: { canonical: `${siteConfig.url}/medicare-supplements` },
  openGraph: {
    title: "Medicare Supplement (Medigap) Plans in Spokane",
    description:
      "Compare Medicare Supplement options with a local Spokane licensed independent insurance agency.",
    url: `${siteConfig.url}/medicare-supplements`,
  },
};

const faqs: FAQItem[] = [
  {
    question: "What is a Medicare Supplement (Medigap) plan?",
    answer:
      "A Medicare Supplement, also called Medigap, is a private insurance policy that works alongside Original Medicare (Parts A and B). It can help pay for some of the out-of-pocket costs Original Medicare leaves behind, such as deductibles and coinsurance, depending on the plan letter you choose.",
  },
  {
    question: "How is a Medigap plan different from a Medicare Advantage plan?",
    answer:
      "Medigap works with Original Medicare and you generally can see any provider in the U.S. who accepts Medicare. Medicare Advantage replaces the way you receive your benefits and typically uses a network of doctors and hospitals. Most Medigap plans do not include drug coverage, so you typically pair them with a standalone Medicare Part D plan.",
  },
  {
    question: "When is the best time to enroll in a Medigap plan?",
    answer:
      "Your Medigap Open Enrollment Period is a six-month window that begins when you are 65 or older and enrolled in Medicare Part B. During this window you generally have guaranteed-issue rights. Enrolling outside that window may require medical underwriting depending on your situation.",
  },
];

export default function MedicareSupplementsPage() {
  return (
    <>
      <PageHero
        title="Medicare Supplements (Medigap)"
        subtitle="Help comparing Medicare Supplement plans that work alongside Original Medicare to lower your out-of-pocket costs."
        crumbs={[{ href: "/", label: "Home" }, { label: "Medicare Supplements" }]}
      />

      <section className="py-14 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-gray-800 space-y-5 text-lg leading-relaxed">
          <p>
            Medicare Supplement plans (Medigap) help cover some of the costs that Original Medicare
            does not — such as deductibles and coinsurance. Plans are standardized and identified by
            letter (for example Plan G, Plan N), but premiums and underwriting rules vary by carrier.
          </p>
          <p>
            {siteConfig.legalName} can help you compare the Medicare Supplement plans we represent
            so you can find a plan that fits your needs and your budget. Most Medigap plans do not
            include prescription drug coverage, so we often pair them with a standalone{" "}
            <Link href="/medicare-part-d" className="text-blue-700 underline">
              Medicare Part D
            </Link>{" "}
            plan.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4">When Medigap can be a strong fit</h2>
          <ul className="list-disc list-outside pl-6 space-y-2">
            <li>You want predictable out-of-pocket costs.</li>
            <li>You want flexibility to see providers anywhere in the U.S. who accept Medicare.</li>
            <li>You travel frequently or split time between Spokane and another state.</li>
            <li>You are within your six-month Medigap Open Enrollment Period.</li>
          </ul>

          <p>
            Not sure if Medigap or Medicare Advantage is the better fit?{" "}
            <Link
              href="/medicare-advantage-vs-supplement-spokane"
              className="text-blue-700 underline"
            >
              Read our side-by-side comparison
            </Link>{" "}
            or schedule a no-cost consultation.
          </p>
        </div>
      </section>

      <section className="py-10 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <Disclaimer />
        </div>
      </section>

      <FAQ items={faqs} heading="Medicare Supplement FAQ" />

      <section className="py-12 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <LeadForm
            source="medicare-supplements"
            heading="Compare Medicare Supplement Plans"
            subheading="A licensed insurance professional will help you compare the Medicare Supplement plans we represent."
            showMessage
          />
        </div>
      </section>

      <CTASection />
    </>
  );
}
