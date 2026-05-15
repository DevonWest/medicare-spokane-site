import type { Metadata } from "next";
import Link from "next/link";
import Disclaimer from "@/components/Disclaimer";
import FAQ, { type FAQItem } from "@/components/FAQ";
import LeadForm from "@/components/LeadForm";
import { siteConfig, telHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Medicare Annual Enrollment Help in Spokane",
  description:
    "Medicare's Annual Enrollment Period runs October 15 through December 7 each year. A local Spokane licensed independent insurance agency can help you review prescriptions, doctors, pharmacies, premiums, copays, and plan changes.",
  alternates: { canonical: `${siteConfig.url}/medicare-annual-enrollment-spokane` },
  openGraph: {
    title: "Medicare Annual Enrollment Help in Spokane | Medicare in Spokane",
    description:
      "Plain-language overview of the Medicare Annual Enrollment Period (Oct 15 – Dec 7) with help reviewing prescriptions, doctors, pharmacies, and the plans we represent in Spokane.",
    url: `${siteConfig.url}/medicare-annual-enrollment-spokane`,
  },
};

const aepBasics = [
  {
    title: "When it happens",
    body: "Medicare's Annual Enrollment Period (AEP) runs October 15 through December 7 each year. Changes you make during AEP generally take effect on January 1.",
  },
  {
    title: "What you can do",
    body: "During AEP you can join, switch, or drop a Medicare Advantage plan, and you can join, switch, or drop a standalone Part D prescription drug plan. You can also return to Original Medicare.",
  },
  {
    title: "What it is not",
    body: "AEP is different from your Initial Enrollment Period when you first become eligible for Medicare, and it is different from the Medicare Advantage Open Enrollment Period (January 1 – March 31). It also does not change Medicare Supplement underwriting rules.",
  },
];

const whatToReview = [
  {
    title: "Prescriptions",
    body: "Formularies, drug tiers, prior authorization, and step therapy rules can change each plan year. Reviewing your medication list is one of the most important AEP steps.",
  },
  {
    title: "Doctors and hospitals",
    body: "Provider networks for Medicare Advantage plans can change. Confirming whether your doctors, specialists, and hospitals are in-network helps avoid surprises.",
  },
  {
    title: "Pharmacies",
    body: "Preferred and standard pharmacy networks can shift. Your usual pharmacy may have different pricing on a different plan, or you may want to compare options nearby.",
  },
  {
    title: "Premiums and copays",
    body: "Monthly premiums, deductibles, copays, coinsurance, and out-of-pocket maximums can all change with a new plan year. AEP is a good time to look at the numbers.",
  },
  {
    title: "Extra benefits",
    body: "Dental, vision, hearing, over-the-counter, transportation, and other supplemental benefits in Medicare Advantage plans can be updated, expanded, or reduced.",
  },
  {
    title: "Annual Notice of Change (ANOC)",
    body: "If you are in a Medicare Advantage or Part D plan, your carrier sends an Annual Notice of Change describing what is changing for the next plan year. It is a useful starting point.",
  },
];

const aepChecklist = [
  "Your current Medicare Advantage, Supplement, or Part D plan information",
  "Your prescription list with dosages",
  "Your preferred pharmacy",
  "Doctors, specialists, and hospitals you want to keep",
  "Your most recent Annual Notice of Change",
  "Questions about premiums, copays, and benefit changes",
];

const reviewSteps = [
  "Share your current coverage and any Annual Notice of Change",
  "Review prescriptions, doctors, and pharmacy preferences",
  "Compare options from the plans we represent",
  "Talk through any change before your AEP enrollment",
];

const faqs: FAQItem[] = [
  {
    question: "When is the Medicare Annual Enrollment Period?",
    answer:
      "The Medicare Annual Enrollment Period runs October 15 through December 7 each year. Changes generally take effect on January 1 of the following year.",
  },
  {
    question: "Do I have to change plans during Annual Enrollment?",
    answer:
      "No. Not everyone needs to change plans each year. Sometimes staying where you are may make sense. The point of an annual review is to understand what is changing for the next plan year and make an informed decision.",
  },
  {
    question: "What is the difference between AEP and the Medicare Advantage Open Enrollment Period?",
    answer:
      "The Annual Enrollment Period (October 15 – December 7) lets you join, switch, or drop a Medicare Advantage plan or a Part D plan. The Medicare Advantage Open Enrollment Period (January 1 – March 31) lets people already enrolled in a Medicare Advantage plan make a one-time change. They are separate windows with different rules set by Medicare.",
  },
  {
    question: "Can you help me review my Part D prescription drug plan during AEP?",
    answer:
      "Yes. We can review your prescriptions, your preferred pharmacy, and the Part D and Medicare Advantage prescription drug plans we represent so you can see how your medications may be covered next year. See our Part D and prescription drug review pages for more detail.",
  },
  {
    question: "Is there a cost for an AEP review?",
    answer:
      "No. Consultations with our local licensed independent insurance agency are no-cost and no-obligation. We explain your current coverage and the options from the plans we represent so you can decide what fits your situation.",
  },
];

const internalLinks = [
  {
    href: "/medicare-plan-review-spokane",
    title: "Annual Medicare Plan Review",
    body: "Walk through prescriptions, doctors, pharmacies, premiums, copays, and benefit changes with a local licensed agent.",
  },
  {
    href: "/rx-drug-review",
    title: "Prescription Drug Review",
    body: "Bring your medication list to compare how prescriptions and pharmacies may be covered.",
  },
  {
    href: "/medicare-part-d",
    title: "Medicare Part D",
    body: "Learn how Medicare prescription drug coverage works and what to look at each year.",
  },
  {
    href: "/compare-medicare-options",
    title: "Compare Medicare Options",
    body: "See an overview of Medicare Advantage, Medicare Supplement, Part D, and other coverage paths.",
  },
  {
    href: "/contact",
    title: "Contact Our Spokane Office",
    body: "Schedule an in-person or phone consultation with a local licensed insurance agent.",
  },
];

export default function MedicareAnnualEnrollmentSpokanePage() {
  return (
    <>
      <section className="bg-gradient-to-br from-blue-800 to-blue-600 px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-blue-200">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/resources" className="hover:text-white">
              Resources
            </Link>
            <span className="mx-2">/</span>
            <span>Medicare Annual Enrollment in Spokane</span>
          </nav>
          <div className="max-w-4xl">
            <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">
              Medicare Annual Enrollment Help in Spokane
            </h1>
            <p className="mt-4 text-xl leading-relaxed text-blue-100">
              Medicare&apos;s Annual Enrollment Period runs October 15 through December 7 each
              year. It is a good time to review your prescriptions, doctors, pharmacies,
              premiums, copays, and any plan changes &mdash; whether or not you decide to switch.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href={telHref}
                className="inline-flex items-center justify-center rounded-lg bg-white px-7 py-3 text-lg font-semibold text-blue-800 transition-colors hover:bg-blue-50"
              >
                Call 509-353-0476
              </a>
              <Link
                href="#aep-form"
                className="inline-flex items-center justify-center rounded-lg border border-blue-300 bg-blue-900 px-7 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-950"
              >
                Request Help Online
              </Link>
            </div>
            <p className="mt-5 text-base font-semibold text-blue-50">
              No-cost consultation. No pressure. Local Spokane guidance.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900">
              The Annual Enrollment Period in plain language
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              The Annual Enrollment Period (AEP) is the yearly window when most Medicare
              beneficiaries can make changes to their Medicare Advantage or Part D coverage.
              Here are the basics in plain English.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {aepBasics.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-gray-700">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900">What to review during AEP</h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              Reviewing the items below each year can help you understand what changed before
              those changes affect your prescriptions, doctors, pharmacy costs, or out-of-pocket
              expenses.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {whatToReview.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-white bg-white p-6 shadow-sm"
              >
                <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-gray-700">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wider text-amber-800">
              Important reminder
            </p>
            <p className="mt-4 text-lg leading-relaxed text-gray-900">
              Not everyone needs to change plans each year. The goal of an AEP review is to
              understand what is changing and whether your current coverage still fits your
              needs. We do not guarantee any savings or outcome from changing plans.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 pb-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">What to have ready</h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              A short checklist makes the conversation easier and helps a local licensed agent
              review your AEP options with you.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              For more on prescriptions and drug coverage, see our{" "}
              <Link href="/rx-drug-review" className="font-medium text-blue-700 hover:underline">
                prescription drug review
              </Link>{" "}
              and{" "}
              <Link href="/medicare-part-d" className="font-medium text-blue-700 hover:underline">
                Medicare Part D
              </Link>{" "}
              pages.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {aepChecklist.map((item) => (
              <div
                key={item}
                className="flex rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
              >
                <span className="mr-3 mt-0.5 text-blue-700" aria-hidden="true">
                  ✓
                </span>
                <span className="text-gray-800">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900">How an AEP review works</h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              A simple, step-by-step process that keeps things calm and easy to follow before
              the December 7 deadline.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {reviewSteps.map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-white bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
                  Step {index + 1}
                </p>
                <h3 className="mt-3 text-xl font-semibold text-gray-900">{step}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="aep-form" className="bg-white px-4 py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Request AEP help in Spokane</h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              Tell us a few details and a local licensed agent with {siteConfig.legalName} will
              follow up to review your prescriptions, doctors, pharmacies, and options from the
              plans we represent.
            </p>
            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-base leading-relaxed text-blue-900">
              <p className="font-semibold">No-cost consultation</p>
              <p className="mt-2">
                Request help online or{" "}
                <a href={telHref} className="font-semibold underline underline-offset-2">
                  call 509-353-0476
                </a>
                . If you prefer to meet in person or by phone, visit our{" "}
                <Link href="/contact" className="font-semibold underline underline-offset-2">
                  contact page
                </Link>
                .
              </p>
            </div>
            <Disclaimer className="mt-6" />
          </div>
          <LeadForm
            source="medicare-annual-enrollment-spokane"
            heading="Request Help Online"
            subheading="Share a few details and a licensed local agent will contact you to schedule your Annual Enrollment review."
            showMessage
          />
        </div>
      </section>

      <FAQ items={faqs} heading="Medicare Annual Enrollment FAQ" />

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900">Related Spokane Medicare pages</h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              Continue reviewing your Medicare options with these related Spokane resources.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {internalLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
              >
                <h3 className="text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-700">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-700">{item.body}</p>
                <span className="mt-4 inline-block text-sm font-medium text-blue-700 group-hover:underline">
                  Visit page →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
