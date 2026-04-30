import type { Metadata } from "next";
import Link from "next/link";
import Disclaimer from "@/components/Disclaimer";
import FAQ, { type FAQItem } from "@/components/FAQ";
import LeadForm from "@/components/LeadForm";
import { siteConfig, telHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Annual Medicare Plan Review Spokane",
  description:
    "Review your Medicare plan in Spokane with help from a local licensed insurance agent. Check prescriptions, doctors, pharmacies, premiums, copays, and plan options.",
  alternates: { canonical: `${siteConfig.url}/medicare-plan-review-spokane` },
  openGraph: {
    title: "Annual Medicare Plan Review Spokane | Medicare in Spokane",
    description:
      "Review your Medicare plan in Spokane with help from a local licensed insurance agent. Check prescriptions, doctors, pharmacies, premiums, copays, and plan options.",
    url: `${siteConfig.url}/medicare-plan-review-spokane`,
  },
};

const whyReviewItems = [
  {
    title: "Prescription formularies can change",
    body: "A medication covered this year may be handled differently next year, including tier placement and prior authorization rules.",
  },
  {
    title: "Pharmacy costs can change",
    body: "Your preferred pharmacy may have different pricing, and preferred-pharmacy status can change from year to year.",
  },
  {
    title: "Premiums and cost-sharing may change",
    body: "Monthly premiums, copays, deductibles, and maximum out-of-pocket costs can all change with a new plan year.",
  },
  {
    title: "Provider networks can change",
    body: "Doctors, specialists, and hospitals can move in or out of a plan network, which may affect where you receive care.",
  },
  {
    title: "Extra benefits can change",
    body: "Dental, vision, hearing, transportation, over-the-counter, or other supplemental benefits may be updated, reduced, or expanded.",
  },
  {
    title: "Your health needs can change",
    body: "New prescriptions, specialist visits, planned procedures, or changing budget priorities can make it helpful to review your coverage.",
  },
];

const reviewChecklist = [
  "Current Medicare Advantage, Supplement, or Part D plan",
  "Prescription list",
  "Preferred pharmacy",
  "Doctor and specialist access",
  "Hospital preferences",
  "Monthly premium",
  "Copays and out-of-pocket costs",
  "Dental, vision, hearing, or supplemental needs",
  "Annual Notice of Change, if available",
];

const reviewSteps = [
  "Review your current plan",
  "Check prescriptions, doctors, and pharmacy preferences",
  "Compare options from the plans we represent",
  "Explain your choices in plain English",
];

const faqs: FAQItem[] = [
  {
    question: "Should I review my Medicare plan every year?",
    answer:
      "An annual review is a good idea because prescriptions, pharmacies, provider networks, premiums, copays, and extra benefits can change from year to year. A review can help you understand whether your current coverage still fits your needs.",
  },
  {
    question: "Do I have to change plans after a review?",
    answer:
      "No. Not everyone needs to change plans each year. Sometimes staying where you are may make sense. The purpose of a review is to understand what changed and help you make an informed decision.",
  },
  {
    question: "Can prescriptions affect whether I should review my plan?",
    answer:
      "Yes. Changes to formularies, drug tiers, pharmacy networks, or your own prescription list can all affect how your coverage works. That is why prescriptions are an important part of the review.",
  },
  {
    question: "Can you review my doctors and pharmacy?",
    answer:
      "Yes. We can review your doctors, specialists, hospitals, and preferred pharmacy when looking at your current coverage and options from the plans we represent.",
  },
  {
    question: "Is there a cost for the plan review?",
    answer:
      "No. The consultation is no-cost and no-obligation. We explain your current coverage and options from the plans we represent so you can decide what makes sense for your situation.",
  },
];

const internalLinks = [
  {
    href: "/rx-drug-review",
    title: "RX Drug Review",
    body: "Bring your medication list to see how prescriptions and pharmacies can affect coverage.",
  },
  {
    href: "/compare-medicare-options",
    title: "Compare Medicare Options",
    body: "Review Medicare Advantage, Supplement, Part D, and other coverage paths available through the plans we represent.",
  },
  {
    href: "/medicare-part-d",
    title: "Medicare Part D",
    body: "Learn more about prescription drug coverage, formularies, and preferred pharmacies.",
  },
  {
    href: "/medicare-advantage",
    title: "Medicare Advantage",
    body: "See how provider networks, benefits, and out-of-pocket costs can vary by plan.",
  },
  {
    href: "/contact",
    title: "Contact Our Spokane Office",
    body: "Request an in-person or phone consultation with a local licensed insurance agent.",
  },
];

export default function MedicarePlanReviewSpokanePage() {
  return (
    <>
      <section className="bg-gradient-to-br from-blue-800 to-blue-600 px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-blue-200">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span>Annual Medicare Plan Review</span>
          </nav>
          <div className="max-w-4xl">
            <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">
              Annual Medicare Plan Review in Spokane
            </h1>
            <p className="mt-4 text-xl leading-relaxed text-blue-100">
              Medicare plans can change from year to year. Our local licensed agents can help you review your current
              coverage, prescriptions, doctors, pharmacies, and options from the plans we represent.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href={telHref}
                className="inline-flex items-center justify-center rounded-lg bg-white px-7 py-3 text-lg font-semibold text-blue-800 transition-colors hover:bg-blue-50"
              >
                Call 509-353-0476
              </a>
              <Link
                href="#plan-review-form"
                className="inline-flex items-center justify-center rounded-lg border border-blue-300 bg-blue-900 px-7 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-950"
              >
                Request a Plan Review
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
            <h2 className="text-3xl font-bold text-gray-900">Why review your Medicare plan each year?</h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              Reviewing your coverage each year can help you understand what changed before those changes affect your
              prescriptions, doctors, pharmacy costs, or out-of-pocket expenses. The goal is to avoid surprises and
              make sure your current coverage still fits your needs.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {whyReviewItems.map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-gray-700">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">What we review</h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                We walk through the practical details that often matter most during an annual review so you can better
                understand how your current plan is working and what changed.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                If you are also reviewing prescriptions, our{" "}
                <Link href="/rx-drug-review" className="font-medium text-blue-700 hover:underline">
                  RX drug review page
                </Link>{" "}
                explains what to bring. You can also visit our{" "}
                <Link href="/compare-medicare-options" className="font-medium text-blue-700 hover:underline">
                  compare Medicare options page
                </Link>{" "}
                for a broader overview.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {reviewChecklist.map((item) => (
                <div key={item} className="flex rounded-2xl border border-white bg-white p-4 shadow-sm">
                  <span className="mr-3 mt-0.5 text-blue-700" aria-hidden="true">
                    ✓
                  </span>
                  <span className="text-gray-800">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wider text-amber-800">Important reminder</p>
            <p className="mt-4 text-xl leading-relaxed text-gray-900">
              Not everyone needs to change plans each year. Sometimes staying where you are may make sense. The goal
              of a review is to understand what changed and whether your current coverage still fits your needs.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 pb-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900">How the review works</h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              A straightforward process designed to keep things clear, calm, and easy to follow.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {reviewSteps.map((step, index) => (
              <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Step {index + 1}</p>
                <h3 className="mt-3 text-xl font-semibold text-gray-900">{step}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50 px-4 py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[1fr_0.95fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Local Spokane trust</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">Local help from a Spokane-based licensed independent insurance agency</h2>
            <div className="mt-4 space-y-4 text-lg leading-relaxed text-gray-700">
              <p>
                {siteConfig.legalName} is a Spokane-based licensed independent insurance agency that helps Medicare
                beneficiaries review current coverage and compare options from the plans we represent.
              </p>
              <p>Our Spokane office is located inside the Providence Medical Building.</p>
              <p>In-person and phone consultations are available for Spokane-area residents.</p>
              <p>
                If you want more details about plan types before your review, visit our{" "}
                <Link href="/medicare-part-d" className="font-medium text-blue-700 hover:underline">
                  Medicare Part D
                </Link>{" "}
                and{" "}
                <Link href="/medicare-advantage" className="font-medium text-blue-700 hover:underline">
                  Medicare Advantage
                </Link>{" "}
                pages.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
            <h3 className="text-2xl font-bold text-gray-900">What to have ready for a review</h3>
            <ul className="mt-6 space-y-4 text-base leading-relaxed text-gray-700">
              <li className="flex items-start gap-3">
                <span
                  className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-semibold text-white"
                  aria-hidden="true"
                >
                  1
                </span>
                <span>Your current Medicare plan card and any Annual Notice of Change you received.</span>
              </li>
              <li className="flex items-start gap-3">
                <span
                  className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-semibold text-white"
                  aria-hidden="true"
                >
                  2
                </span>
                <span>Your prescription list, preferred pharmacy, and any doctor or specialist preferences.</span>
              </li>
              <li className="flex items-start gap-3">
                <span
                  className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-semibold text-white"
                  aria-hidden="true"
                >
                  3
                </span>
                <span>Your questions about premiums, copays, extra benefits, and how your current coverage is working.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section id="plan-review-form" className="bg-white px-4 py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Request a Medicare plan review</h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              Share a few details and a local licensed agent will follow up to review your current coverage,
              prescriptions, doctors, pharmacy preferences, and questions.
            </p>
            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-base leading-relaxed text-blue-900">
              <p className="font-semibold">No-cost consultation</p>
              <p className="mt-2">
                Request your review online or{" "}
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
            source="medicare-plan-review-spokane"
            heading="Request a Plan Review"
            subheading="Tell us how to reach you and a licensed local agent will contact you to schedule your Medicare review."
            showMessage
          />
        </div>
      </section>

      <FAQ items={faqs} heading="Annual Medicare Plan Review FAQ" />

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900">Helpful Medicare links</h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              Explore related Spokane Medicare pages before or after your annual review.
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
