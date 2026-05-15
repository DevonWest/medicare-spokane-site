import type { Metadata } from "next";
import Link from "next/link";
import Disclaimer from "@/components/Disclaimer";
import FAQ, { type FAQItem } from "@/components/FAQ";
import LeadForm from "@/components/LeadForm";
import { siteConfig, telHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Moving to Spokane? Review Your Medicare Coverage Options",
  description:
    "Moving to Spokane or Spokane County? Medicare Advantage and Part D options can vary by county, ZIP code, provider network, and pharmacy. Talk with a local licensed independent insurance agency about your options.",
  alternates: { canonical: `${siteConfig.url}/moving-to-spokane-medicare` },
  openGraph: {
    title: "Moving to Spokane? Review Your Medicare Coverage Options | Medicare in Spokane",
    description:
      "Medicare Advantage and Part D plans, networks, and pharmacy availability can change when you move to a new county or ZIP code. Review the plans we represent in Spokane and Spokane County.",
    url: `${siteConfig.url}/moving-to-spokane-medicare`,
  },
};

const whyMovingMatters = [
  {
    title: "Plan availability varies by county and ZIP",
    body: "Medicare Advantage and standalone Part D plans are offered in specific service areas. The plans available in your previous county or state may not be the same plans offered in Spokane or Spokane County.",
  },
  {
    title: "Provider networks can change",
    body: "Doctors, specialists, hospitals, and clinics that were in-network on your old plan may not be in-network on a Spokane plan. Reviewing networks is an important step before you change coverage.",
  },
  {
    title: "Pharmacy access may be different",
    body: "Preferred and standard pharmacy networks vary by plan. The pharmacy you used before may have different pricing in a Spokane plan, or you may want to find a new preferred pharmacy nearby.",
  },
  {
    title: "Drug formularies can differ",
    body: "Each Medicare Advantage and Part D plan has its own formulary. Tier placement, prior authorization, and step therapy rules can be different from your prior plan, even for the same medication.",
  },
  {
    title: "Premiums and cost-sharing can change",
    body: "Monthly premiums, deductibles, copays, and out-of-pocket maximums vary from plan to plan and from year to year. A move is a good time to review what you are paying.",
  },
  {
    title: "A move may trigger a Special Enrollment Period",
    body: "Permanently moving to a new address outside your plan's service area may qualify you for a Medicare Special Enrollment Period. Specific rules and timelines are set by Medicare, and we can help you understand the basics.",
  },
];

const movingChecklist = [
  "Confirm your new Spokane-area address and ZIP code",
  "Note the date of your move (or planned move)",
  "Gather your current Medicare Advantage, Supplement, or Part D plan information",
  "Make a list of doctors, specialists, and hospitals you want to keep using",
  "List your prescriptions and your preferred pharmacy",
  "Review any Annual Notice of Change you received from your current plan",
];

const reviewSteps = [
  "Tell us about your move and your current coverage",
  "Review doctors, prescriptions, and pharmacy preferences",
  "Compare options from the plans we represent in your new ZIP code",
  "Talk through Special Enrollment Period timing and next steps",
];

const faqs: FAQItem[] = [
  {
    question: "Do I have to change my Medicare plan if I move to Spokane?",
    answer:
      "It depends on the type of coverage you have and where you are moving from. Original Medicare (Parts A and B) generally travels with you. Medicare Advantage and standalone Part D plans are offered in specific service areas, so a move outside that service area usually means you will need to change plans. Medicare Supplement coverage rules also vary by state. We can help you understand the basics for your situation.",
  },
  {
    question: "Does moving to Washington trigger a Special Enrollment Period?",
    answer:
      "Permanently moving to a new address outside your current plan's service area may qualify you for a Special Enrollment Period to join, switch, or drop a Medicare Advantage or Part D plan. The exact rules and timelines are set by Medicare. We can walk you through the general framework, and you can also confirm details with Medicare or with Washington SHIBA.",
  },
  {
    question: "Will my doctors in Spokane be in-network?",
    answer:
      "It depends on the plan. Medicare Advantage plans use specific provider networks that vary from plan to plan. We can help you check whether the doctors, specialists, hospitals, and clinics you want to use are in-network on the plans we represent.",
  },
  {
    question: "Can I keep my Medicare Supplement plan after moving?",
    answer:
      "Medicare Supplement (Medigap) coverage rules vary by state, and your current plan may or may not still make sense after a move. We can review the Medicare Supplement options from the carriers we represent so you can decide what fits your situation.",
  },
  {
    question: "Do you charge for help reviewing my options after a move?",
    answer:
      "No. Consultations are no-cost and no-obligation. We are a local licensed independent insurance agency, and we can review the Medicare Advantage, Medicare Supplement, and Part D options available from the plans we represent in Spokane and Spokane County.",
  },
];

const internalLinks = [
  {
    href: "/compare-medicare-options",
    title: "Compare Medicare Options",
    body: "See an overview of Medicare Advantage, Medicare Supplement, Part D, and other coverage paths.",
  },
  {
    href: "/medicare-plan-review-spokane",
    title: "Annual Medicare Plan Review",
    body: "Review prescriptions, doctors, pharmacies, and out-of-pocket costs with a local licensed agent.",
  },
  {
    href: "/rx-drug-review",
    title: "Prescription Drug Review",
    body: "Bring your medication list to compare how prescriptions and pharmacies may be covered in Spokane.",
  },
  {
    href: "/medicare-part-d",
    title: "Medicare Part D",
    body: "Learn how prescription drug coverage works, including formularies and preferred pharmacies.",
  },
  {
    href: "/contact",
    title: "Contact Our Spokane Office",
    body: "Schedule an in-person or phone consultation with a local licensed insurance agent.",
  },
];

export default function MovingToSpokaneMedicarePage() {
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
            <span>Moving to Spokane &amp; Medicare</span>
          </nav>
          <div className="max-w-4xl">
            <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">
              Moving to Spokane? Review Your Medicare Coverage Options
            </h1>
            <p className="mt-4 text-xl leading-relaxed text-blue-100">
              Medicare Advantage and Part D options can vary by county, ZIP code, provider
              network, and pharmacy. If you are moving to Spokane or Spokane County, it is a good
              idea to review your coverage so your doctors, prescriptions, and pharmacy still fit.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href={telHref}
                className="inline-flex items-center justify-center rounded-lg bg-white px-7 py-3 text-lg font-semibold text-blue-800 transition-colors hover:bg-blue-50"
              >
                Call 509-353-0476
              </a>
              <Link
                href="#moving-form"
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
              Why a move is a good time to review your Medicare coverage
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              Moving across counties or state lines can change which Medicare plans are available
              to you and how your existing coverage works. Reviewing the details below can help
              you avoid surprises after you settle into Spokane.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {whyMovingMatters.map((item) => (
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
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">What to have ready</h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              A short checklist makes the conversation easier and helps a local licensed agent
              review the right Spokane options with you.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              For a deeper plan-by-plan review, see our{" "}
              <Link
                href="/medicare-plan-review-spokane"
                className="font-medium text-blue-700 hover:underline"
              >
                annual Medicare plan review
              </Link>{" "}
              and{" "}
              <Link
                href="/compare-medicare-options"
                className="font-medium text-blue-700 hover:underline"
              >
                compare Medicare options
              </Link>{" "}
              pages.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {movingChecklist.map((item) => (
              <div
                key={item}
                className="flex rounded-2xl border border-white bg-white p-4 shadow-sm"
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

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wider text-amber-800">
              Important reminder
            </p>
            <p className="mt-4 text-lg leading-relaxed text-gray-900">
              Special Enrollment Period rules and timelines for moves are set by Medicare. We can
              help you understand the basics, but the specific dates and eligibility for any
              enrollment period are determined by Medicare. We do not guarantee any savings or
              outcome from changing plans.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 pb-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900">How a Spokane review works</h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              A simple, step-by-step process designed to keep things clear and easy to follow.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {reviewSteps.map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
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

      <section
        id="moving-form"
        className="border-y border-slate-100 bg-slate-50 px-4 py-16"
      >
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Request a Spokane Medicare review
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              Tell us a little about your move and your current Medicare coverage. A local
              licensed agent with {siteConfig.legalName} will follow up to review your options
              from the plans we represent.
            </p>
            <div className="mt-6 rounded-2xl border border-blue-100 bg-white p-5 text-base leading-relaxed text-blue-900">
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
            source="moving-to-spokane-medicare"
            heading="Request Help Online"
            subheading="Share a few details about your move and a local licensed agent will reach out to review your Medicare options."
            showMessage
          />
        </div>
      </section>

      <FAQ items={faqs} heading="Moving to Spokane Medicare FAQ" />

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900">Related Spokane Medicare pages</h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              Continue exploring Spokane Medicare topics that often come up after a move.
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
