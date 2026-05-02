import type { Metadata } from "next";
import Link from "next/link";
import Disclaimer from "@/components/Disclaimer";
import FAQ, { type FAQItem } from "@/components/FAQ";
import { PartDIllustration } from "@/components/Illustrations";
import { siteConfig, telHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Prescription Drug Plan Review Spokane",
  description:
    "Get local help reviewing prescription drug coverage for Medicare Advantage and Part D plans in Spokane. Bring your medication list and compare options with a licensed insurance agent.",
  alternates: { canonical: `${siteConfig.url}/rx-drug-review` },
  openGraph: {
    title: "Prescription Drug Plan Review Spokane",
    description:
      "Get local help reviewing prescription drug coverage for Medicare Advantage and Part D plans in Spokane.",
    url: `${siteConfig.url}/rx-drug-review`,
  },
};

const checklistItems: string[] = [
  "Medication name",
  "Dosage",
  "How often you take it",
  "Preferred pharmacy",
  "Current Medicare card / plan card if applicable",
  "Doctor or specialist names if relevant",
];

const reviewSteps: string[] = [
  "Collect your prescription list",
  "Review plan coverage options we represent",
  "Compare pharmacies and estimated costs",
  "Explain choices in plain English",
];

const faqs: FAQItem[] = [
  {
    question: "Do I need a drug list before comparing plans?",
    answer:
      "A current drug list is the most helpful place to start because prescription coverage depends on the exact medications, dosages, and pharmacy you use. If your list is still changing, we can still talk through your situation and explain what information will help with a more detailed review.",
  },
  {
    question: "Can prescription costs change from year to year?",
    answer:
      "Yes. Formularies, pharmacy networks, tiers, and cost-sharing can all change from one plan year to the next. Reviewing your prescriptions during an enrollment period can help you understand whether the Medicare Advantage or Part D plans we represent may cover your medications differently.",
  },
  {
    question: "Can my pharmacy affect my costs?",
    answer:
      "Yes. Many plans have preferred pharmacies, standard pharmacies, and mail-order options with different pricing. Using the same medication at a different in-network pharmacy can change your estimated out-of-pocket costs.",
  },
  {
    question: "Can you review both Medicare Advantage and Part D options?",
    answer:
      "Yes. We can help you review how the Medicare Advantage and standalone Part D plans we represent may cover your prescriptions, then explain the differences so you can decide which type of coverage fits your situation.",
  },
];

export default function RxDrugReviewPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-blue-800 to-blue-600 text-white py-16 landscape-mobile:py-5 px-4">
        <div className="max-w-5xl mx-auto">
          <nav aria-label="Breadcrumb" className="text-blue-200 text-sm mb-4 landscape-mobile:mb-2">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/resources" className="hover:text-white">
              Resources
            </Link>
            <span className="mx-2">/</span>
            <span>RX Drug Review</span>
          </nav>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100 mb-3 landscape-mobile:mb-1">
            Prescription Drug Plan Review in Spokane
          </p>
          <h1 className="text-4xl landscape-mobile:text-2xl landscape-mobile:leading-snug md:text-5xl font-extrabold leading-tight mb-4 landscape-mobile:mb-2">
            Bring Your Prescription List — We’ll Help Review Your Options
          </h1>
          <p className="text-xl landscape-mobile:text-base text-blue-100 max-w-4xl">
            Prescription coverage can vary by plan, pharmacy, tier, and ZIP code. Our licensed
            local agents can help you compare how the Medicare Advantage and Part D plans we
            represent may cover your current medications.
          </p>
        </div>
      </section>

      <section className="py-14 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-gray-800 space-y-8">
          <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-5 text-lg leading-relaxed">
              <p>
                If you are using this visit to{" "}
                <Link href="/compare-medicare-options" className="text-blue-700 hover:underline">
                  compare Medicare options
                </Link>
                , a prescription review can give you a clearer picture of how drug coverage may affect
                your decision.
              </p>
              <p>
                If you are reviewing{" "}
                <Link href="/medicare-part-d" className="text-blue-700 hover:underline">
                  Medicare Part D
                </Link>{" "}
                or{" "}
                <Link href="/medicare-advantage" className="text-blue-700 hover:underline">
                  Medicare Advantage
                </Link>{" "}
                coverage, a prescription review can help you understand how your pharmacy choice and
                medication list may affect your expected costs before you enroll.
              </p>
            </div>
            <div className="mx-auto hidden w-full max-w-sm rounded-3xl border border-stone-200 bg-stone-50 p-5 shadow-sm md:block">
              <PartDIllustration />
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Why prescription review matters
            </h2>
            <div className="space-y-4 text-gray-800 leading-relaxed">
              <p>
                Drug formularies vary by plan, which means a medication covered on one plan may be
                handled differently on another.
              </p>
              <p>
                Preferred pharmacies can affect cost, and the same prescription may have different
                pricing depending on where you fill it.
              </p>
              <p>
                Tier placement can change your annual out-of-pocket costs, especially if you take
                several ongoing medications.
              </p>
              <p>
                Reviewing prescriptions before choosing coverage can help you avoid surprises after
                enrollment and make a more informed decision.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What to bring</h2>
              <ul className="space-y-3 text-gray-800">
                {checklistItems.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-semibold text-white"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">How we help</h2>
              <ol className="space-y-4">
                {reviewSteps.map((step, index) => (
                  <li key={step} className="flex items-start gap-4">
                    <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-700 font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="pt-1 text-gray-800">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <section className="rounded-2xl bg-blue-700 px-6 py-8 text-white">
            <h2 className="text-2xl font-bold mb-3">Request your RX drug review</h2>
            <p className="text-blue-100 leading-relaxed mb-6 max-w-2xl">
              Bring your list, ask questions, and get a plain-English review of the Medicare
              Advantage and Part D options we represent. If you are ready to start,{" "}
              <Link href="/contact" className="font-semibold text-white underline underline-offset-2">
                contact our Spokane office
              </Link>{" "}
              or call today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 font-semibold text-blue-700 transition-colors hover:bg-blue-50"
              >
                Request a Drug Review
              </Link>
              <a
                href={telHref}
                className="inline-flex items-center justify-center rounded-lg border border-blue-300 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-800"
              >
                Call 509-353-0476
              </a>
            </div>
          </section>
        </div>
      </section>

      <section className="py-10 px-4 bg-gray-50 border-y border-gray-100">
        <div className="max-w-3xl mx-auto">
          <Disclaimer />
        </div>
      </section>

      <FAQ items={faqs} heading="Prescription Drug Review FAQ" />
    </>
  );
}
