import type { Metadata } from "next";
import Link from "next/link";
import Disclaimer from "@/components/Disclaimer";
import FAQ, { type FAQItem } from "@/components/FAQ";
import LeadForm from "@/components/LeadForm";
import CTASection from "@/components/CTASection";
import { siteConfig, telHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Working Past 65 and Medicare Spokane",
  description:
    "Still working at 65? Get local help understanding Medicare timing, employer coverage questions, Part B, Part D, and Medicare plan options in Spokane.",
  alternates: { canonical: `${siteConfig.url}/working-past-65-medicare` },
  openGraph: {
    title: "Working Past 65 and Medicare Spokane | Medicare in Spokane",
    description:
      "Still working at 65? Get local help understanding Medicare timing, employer coverage questions, Part B, Part D, and Medicare plan options in Spokane.",
    url: `${siteConfig.url}/working-past-65-medicare`,
  },
};

const audienceCards = [
  "You are turning 65 and still working",
  "Your spouse has employer coverage",
  "You are unsure about Part B timing",
  "You contribute to an HSA",
  "You want to compare employer coverage with Medicare options",
];

const importantQuestions = [
  "Is my employer coverage considered creditable?",
  "Should I enroll in Part A only?",
  "When should I enroll in Part B?",
  "How does Part D prescription coverage fit in?",
  "Could delaying coverage create a penalty?",
  "How does Medicare coordinate with employer coverage?",
  "Should I speak with my HR/benefits department?",
];

const helpSteps = [
  "Review your situation and timeline",
  "Help you understand Medicare plan options",
  "Compare options from the plans we represent",
  "Help you prepare questions for HR/benefits",
  "Provide year-round support",
];

const internalLinks = [
  {
    href: "/turning-65-medicare-spokane",
    title: "Turning 65 in Spokane",
    body: "Review a simple Medicare checklist for the months around your 65th birthday.",
  },
  {
    href: "/compare-medicare-options",
    title: "Compare Medicare Options",
    body: "See how local licensed agents help Spokane-area residents compare Medicare coverage options.",
  },
  {
    href: "/medicare-part-d",
    title: "Medicare Part D",
    body: "Learn how prescription drug coverage works and what questions to ask before you enroll.",
  },
  {
    href: "/medicare-supplements",
    title: "Medicare Supplements",
    body: "Understand how Medigap works alongside Original Medicare.",
  },
  {
    href: "/contact",
    title: "Contact Our Spokane Office",
    body: "Schedule an in-person or phone consultation with a licensed local insurance agent.",
  },
];

const faqs: FAQItem[] = [
  {
    question: "Do I have to enroll in Medicare if I am still working?",
    answer:
      "Not always. Some people can delay certain parts of Medicare while they or a spouse still have qualifying employer coverage. The timing depends on the type of coverage and your situation, so it is important to review the details before deciding when to enroll.",
  },
  {
    question: "Should I keep employer coverage or move to Medicare?",
    answer:
      "That depends on factors like premiums, provider access, prescriptions, and how your employer coverage works with Medicare. We can help you understand Medicare plan options and compare options from the plans we represent, while you confirm employer-benefit details with your HR/benefits department.",
  },
  {
    question: "Can I contribute to an HSA after enrolling in Medicare?",
    answer:
      "HSA contribution rules can change once you enroll in Medicare. We can help you understand Medicare timing and plan options, but you should confirm HSA questions with your HR/benefits department and consult a tax professional.",
  },
  {
    question: "What is creditable coverage?",
    answer:
      "Creditable coverage generally means coverage that is expected to pay, on average, at least as much as standard Medicare coverage in the area it applies to, such as prescription drug coverage for Part D. This matters because delaying coverage without creditable coverage can lead to penalties later.",
  },
  {
    question: "Can you help me compare Medicare options if I am leaving employer coverage?",
    answer:
      "Yes. We can review your timeline, explain Medicare plan options, and compare options from the plans we represent as you prepare to leave employer coverage.",
  },
];

export default function WorkingPastSixtyFivePage() {
  return (
    <>
      <section className="bg-gradient-to-br from-blue-800 to-blue-600 px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-blue-200">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span>Working Past 65 &amp; Medicare</span>
          </nav>
          <div className="max-w-4xl">
            <h1 className="mb-4 text-4xl font-extrabold leading-tight md:text-5xl">
              Working Past 65? Understand Your Medicare Options
            </h1>
            <p className="max-w-3xl text-xl text-blue-100">
              If you or your spouse are still working, Medicare decisions can be more complicated. Our local licensed
              agents help Spokane-area residents understand what questions to ask before deciding when and how to
              enroll.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href={telHref}
                className="inline-flex items-center justify-center rounded-lg bg-white px-7 py-3 text-lg font-semibold text-blue-800 transition-colors hover:bg-blue-50"
              >
                Call 509-353-0476
              </a>
              <Link
                href="#working-past-65-form"
                className="inline-flex items-center justify-center rounded-lg border border-blue-300 bg-blue-900 px-7 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-950"
              >
                Request Medicare Help
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
            <h2 className="text-3xl font-bold text-gray-900">Who this page is for</h2>
            <p className="mt-3 text-lg text-gray-600">
              Built for Spokane-area residents who want to understand Medicare timing while they or a spouse are still
              working.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            {audienceCards.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">{item}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50 px-4 py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Important questions to ask</h2>
            <p className="mt-3 max-w-3xl text-lg leading-relaxed text-gray-700">
              These are some of the questions Spokane-area residents often want to sort through before deciding when
              and how to enroll.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {importantQuestions.map((question) => (
                <div key={question} className="flex rounded-2xl border border-white bg-white p-4 shadow-sm">
                  <span className="mr-3 mt-0.5 text-blue-700" aria-hidden="true">
                    ?
                  </span>
                  <span className="text-gray-800">{question}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-amber-700">Important note</p>
            <p className="mt-4 text-lg leading-relaxed text-gray-800">
              Employer coverage, HSA rules, and Medicare enrollment timing can be complex. We can help you understand
              Medicare plan options, but you should also confirm employer-benefit questions with your HR/benefits
              department and consult a tax professional for HSA-related questions.
            </p>
          </aside>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">How we help</h2>
            <p className="mt-3 max-w-3xl text-lg text-gray-600">
              A local process built to help you understand your Medicare options without pressure.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-1">
              {helpSteps.map((step, index) => (
                <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Step {index + 1}</p>
                  <h3 className="mt-3 text-xl font-semibold text-gray-900">{step}</h3>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Local Spokane trust</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">Work with a Spokane-based local agency.</h2>
            <div className="mt-4 space-y-4 text-lg leading-relaxed text-gray-700">
              <p>
                {siteConfig.legalName} is a Spokane-based licensed independent insurance agency helping local residents
                understand Medicare plan options.
              </p>
              <p>Our Spokane office is located inside the Providence Medical Building.</p>
              <p>In-person and phone consultations are available for Spokane-area residents.</p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={telHref}
                className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-800"
              >
                Call {siteConfig.phone}
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-base font-semibold text-gray-900 transition-colors hover:bg-gray-50"
              >
                Contact Our Office
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="working-past-65-form" className="border-y border-slate-100 bg-slate-50 px-4 py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Request local Medicare help</h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              Tell us a little about your timing and coverage questions. A licensed local agent can help you understand
              Medicare plan options and the questions to bring to your HR/benefits department.
            </p>
            <Disclaimer className="mt-6" />
          </div>
          <LeadForm
            source="working-past-65-medicare"
            heading="Request Medicare Help"
            subheading="Share a few details and a licensed local agent will follow up to review your Medicare options."
            showMessage
          />
        </div>
      </section>

      <FAQ items={faqs} heading="Working Past 65 Medicare FAQ" />

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900">Helpful Medicare links</h2>
            <p className="mt-3 text-lg text-gray-600">
              Explore related Medicare pages for Spokane-area residents.
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

      <CTASection
        heading="Need help sorting out Medicare while still working?"
        subheading="Talk with a local licensed insurance professional in Spokane — no cost, no pressure."
      />
    </>
  );
}
