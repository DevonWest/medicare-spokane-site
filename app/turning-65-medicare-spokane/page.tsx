import type { Metadata } from "next";
import Link from "next/link";
import FAQ, { type FAQItem } from "@/components/FAQ";
import LeadForm from "@/components/LeadForm";
import TrustBenefits from "@/components/TrustBenefits";
import CTASection from "@/components/CTASection";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Turning 65 & Medicare in Spokane, WA – What to Do and When",
  description:
    "Turning 65 in Spokane? Learn when to enroll in Medicare, how Parts A, B, C, and D fit together, and how a licensed independent insurance agency can help you compare options.",
  alternates: { canonical: `${siteConfig.url}/turning-65-medicare-spokane` },
  openGraph: {
    title: "Turning 65 & Medicare in Spokane, WA",
    description:
      "Step-by-step Medicare guidance for Spokane residents turning 65, from a licensed independent insurance agency.",
    url: `${siteConfig.url}/turning-65-medicare-spokane`,
  },
};

const faqs: FAQItem[] = [
  {
    question: "When should I sign up for Medicare if I'm turning 65 in Spokane?",
    answer:
      "Most people are first eligible during their Initial Enrollment Period (IEP) — a seven-month window that begins three months before the month you turn 65, includes your birthday month, and ends three months after. Enrolling during the first three months helps your coverage start the month you turn 65.",
  },
  {
    question: "Do I have to enroll in Medicare at 65 if I have employer coverage?",
    answer:
      "Not always. If you (or your spouse) are still working and have qualifying employer health coverage, you may be able to delay Part B without a late-enrollment penalty. Whether to delay depends on the size of your employer and the type of coverage. We recommend reviewing the details before deciding.",
  },
  {
    question: "What is the difference between Part A, Part B, Part C, and Part D?",
    answer:
      "Part A is hospital insurance. Part B is medical insurance for doctors and outpatient care. Part C (Medicare Advantage) is an alternative way to receive Parts A and B (and usually drug coverage) through a private plan. Part D is standalone prescription drug coverage you can add to Original Medicare.",
  },
  {
    question: "What happens if I miss my Medicare enrollment window?",
    answer:
      "Missing your Initial Enrollment Period can result in late-enrollment penalties for Part B and Part D and a delay in when your coverage starts. There is a General Enrollment Period each year, and certain qualifying events trigger a Special Enrollment Period. We can walk through the options if you missed your window.",
  },
];

const steps = [
  {
    number: "1",
    title: "Confirm your eligibility window",
    body: "Your Initial Enrollment Period begins three months before the month you turn 65 and runs for seven months total. Mark it on your calendar.",
  },
  {
    number: "2",
    title: "Decide on Original Medicare vs. Medicare Advantage",
    body: "Original Medicare (Parts A & B) plus a Medicare Supplement and Part D plan is one path. Medicare Advantage (Part C) is the other. Each has trade-offs — we will walk you through them.",
  },
  {
    number: "3",
    title: "Check your doctors and prescriptions",
    body: "If you are considering a Medicare Advantage or Part D plan, we will review whether your providers are in-network and whether your medications are covered.",
  },
  {
    number: "4",
    title: "Enroll and stay covered",
    body: "We help you complete enrollment, then stay available year-round for billing questions, plan changes, and Annual Enrollment Period reviews.",
  },
];

export default function TurningSixtyFivePage() {
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
            <span>Turning 65 &amp; Medicare</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
            Turning 65 &amp; Medicare in Spokane
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            A simple, step-by-step walk through Medicare for Spokane-area residents approaching age 65 — including
            Spokane Valley, Liberty Lake, Cheney, Airway Heights, Medical Lake, Mead, and Deer Park. We are a licensed
            independent insurance agency.
          </p>
        </div>
      </section>

      {/* Steps + Form */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Your Medicare Game Plan, Step by Step
            </h2>
            <ol className="space-y-5">
              {steps.map((step) => (
                <li key={step.number} className="flex gap-4">
                  <div className="shrink-0 w-9 h-9 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                    <p className="text-gray-700 leading-relaxed">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-900">
              <strong>Heads up:</strong> Late enrollment in Part B or Part D may result in lifelong premium penalties.
              If you are unsure when to enroll, talk to us before your Initial Enrollment Period ends.
            </div>
          </div>

          <div className="lg:pl-4">
            <LeadForm
              source="turning-65"
              heading="Get a Free Turning-65 Medicare Review"
              subheading="Tell us a little about your situation and a licensed agent will walk you through your options."
            />
          </div>
        </div>
      </section>

      <TrustBenefits
        heading="Why Work With an Independent Agency at 65?"
        subheading="We help you compare carriers and plan types so you can make a confident decision."
      />

      <section className="bg-white px-4 py-12">
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Family &amp; caregiver resource</p>
          <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold text-gray-900">Helping a parent or spouse with Medicare?</h2>
              <p className="mt-3 text-lg leading-relaxed text-gray-700">
                If your family is helping a loved one organize Medicare information, review prescriptions and
                doctors, or understand plan changes, we have a dedicated Spokane resource for that conversation.
              </p>
            </div>
            <Link
              href="/helping-parent-with-medicare"
              className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-800"
            >
              View Family Resource
            </Link>
          </div>
        </div>
      </section>

      <FAQ items={faqs} heading="Turning 65 in Spokane – FAQ" />

      <CTASection
        heading="Approaching 65? Let's Talk."
        subheading="Get personalized Medicare guidance from a licensed local agent — no cost, no pressure."
      />
    </>
  );
}
