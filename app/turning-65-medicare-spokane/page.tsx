import type { Metadata } from "next";
import Link from "next/link";
import Disclaimer from "@/components/Disclaimer";
import FAQ, { type FAQItem } from "@/components/FAQ";
import LeadForm from "@/components/LeadForm";
import { siteConfig, telHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Turning 65 Medicare Help Spokane | Medicare in Spokane",
  description:
    "Turning 65 in Spokane? Get local help understanding Medicare enrollment, Medicare Advantage, Medicare Supplement, and Part D options from a licensed insurance agent.",
  alternates: { canonical: `${siteConfig.url}/turning-65-medicare-spokane` },
  openGraph: {
    title: "Turning 65 Medicare Help Spokane | Medicare in Spokane",
    description:
      "Turning 65 in Spokane? Get local help understanding Medicare enrollment, Medicare Advantage, Medicare Supplement, and Part D options from a licensed insurance agent.",
    url: `${siteConfig.url}/turning-65-medicare-spokane`,
  },
};

const checklistItems: string[] = [
  "Confirm Medicare Part A and Part B timing",
  "Decide whether to keep employer coverage if still working",
  "Compare Medicare Advantage vs. Medicare Supplement options",
  "Review Part D prescription drug coverage",
  "Check doctors, pharmacies, and prescriptions",
  "Understand enrollment windows and deadlines",
];

const commonQuestions = [
  {
    title: "Do I have to enroll in Medicare at 65?",
    body: "Not always. Your decision depends on your work status, your current coverage, and whether that coverage is considered creditable for Medicare rules.",
  },
  {
    title: "What if I am still working?",
    body: "If you or your spouse still have employer coverage, it may make sense to delay parts of Medicare. We can help you understand how employer size and coverage type affect the timing.",
  },
  {
    title: "Do I need Part D if I do not take prescriptions?",
    body: "Possibly. Part D timing can matter even if you take few or no prescriptions because a late-enrollment penalty may apply if you go without creditable drug coverage.",
  },
  {
    title: "Should I choose Medicare Advantage or Medicare Supplement?",
    body: "There is no one-size-fits-all answer. The right fit depends on your doctors, prescriptions, budget, travel habits, and how you prefer to use coverage.",
  },
  {
    title: "Can I get help before my birthday month?",
    body: "Yes. Starting early gives you more time to understand enrollment timing, gather prescriptions, and review options before deadlines arrive.",
  },
];

const helpSteps: string[] = [
  "Learn about your needs",
  "Review doctors, prescriptions, and budget",
  "Compare options from plans we represent",
  "Help you understand enrollment steps",
  "Provide year-round support after enrollment",
];

const faqs: FAQItem[] = [
  {
    question: "When should I start planning for Medicare?",
    answer:
      "It is smart to start planning a few months before your Initial Enrollment Period begins. That gives you time to understand Part A and Part B timing, review employer coverage if you are still working, and compare Medicare Advantage, Medicare Supplement, and Part D options without rushing.",
  },
  {
    question: "What happens if I miss my Initial Enrollment Period?",
    answer:
      "Missing your Initial Enrollment Period can delay when your coverage starts and may lead to late-enrollment penalties for Part B or Part D. Depending on your situation, you may need to wait for another enrollment window unless you qualify for a Special Enrollment Period.",
  },
  {
    question: "Can I keep employer coverage after 65?",
    answer:
      "Sometimes, yes. Whether you should keep employer coverage, enroll in Medicare, or do both depends on your employer coverage details. We can help you review what to ask your benefits administrator before making a decision.",
  },
  {
    question: "Can you help me compare Medicare Advantage and Medicare Supplement?",
    answer:
      "Yes. We help Spokane-area residents compare Medicare Advantage and Medicare Supplement options from the plans we represent, then explain the trade-offs in plain language based on doctors, prescriptions, and budget.",
  },
  {
    question: "Is there a cost to meet with you?",
    answer:
      "No. Our consultations are no-cost and no-obligation. You can meet with our team in person at our Spokane office or talk with us by phone.",
  },
];

const internalLinks = [
  { href: "/compare-medicare-options", label: "Compare Medicare Options" },
  { href: "/medicare-advantage", label: "Medicare Advantage" },
  { href: "/medicare-supplements", label: "Medicare Supplements" },
  { href: "/medicare-part-d", label: "Medicare Part D" },
  { href: "/rx-drug-review", label: "RX Drug Review" },
  { href: "/contact", label: "Contact Our Spokane Office" },
];

export default function TurningSixtyFivePage() {
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
            <span>Turning 65 Medicare</span>
          </nav>
          <div className="max-w-4xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">
              Local Medicare Help for Spokane-Area Residents
            </p>
            <h1 className="mb-4 text-4xl font-extrabold leading-tight md:text-5xl">
              Turning 65 in Spokane? Get Help Understanding Medicare
            </h1>
            <p className="max-w-3xl text-xl text-blue-100">
              Medicare can feel overwhelming at first. Our local licensed agents help Spokane-area residents
              understand enrollment timing, compare options from the plans we represent, and avoid common mistakes.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href={telHref}
                className="inline-flex items-center justify-center rounded-lg bg-white px-7 py-3 text-lg font-semibold text-blue-800 transition-colors hover:bg-blue-50"
              >
                Call 509-353-0476
              </a>
              <Link
                href="#turning-65-help-form"
                className="inline-flex items-center justify-center rounded-lg border border-blue-300 bg-blue-900 px-7 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-950"
              >
                Request Turning 65 Help
              </Link>
            </div>
            <p className="mt-5 text-base font-semibold text-blue-50">
              No-cost consultation. No pressure. Local Spokane guidance.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Turning 65 checklist</h2>
            <p className="mt-3 max-w-3xl text-lg leading-relaxed text-gray-700">
              Use this checklist to organize your next Medicare steps before your enrollment window arrives.
            </p>
            <div className="mt-8 grid gap-4">
              {checklistItems.map((item) => (
                <div key={item} className="flex rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <span
                    className="mr-4 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span className="text-gray-800">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-slate-50 p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Local Spokane help</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">Talk with a Spokane-based licensed agent.</h2>
            <div className="mt-4 space-y-4 text-lg leading-relaxed text-gray-700">
              <p>
                {siteConfig.legalName} is a Spokane-based licensed independent insurance agency helping local
                residents understand Medicare.
              </p>
              <p>Our Spokane office is located inside the Providence Medical Building.</p>
              <p>We offer both in-person and phone consultations for Spokane-area residents.</p>
            </div>
            <div className="mt-6 rounded-2xl border border-blue-100 bg-white p-5 text-sm leading-relaxed text-gray-700">
              <p>
                Need help early? We can talk before your birthday month so you have time to review enrollment timing,
                coverage choices, and questions about doctors or prescriptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900">Common questions when turning 65</h2>
            <p className="mt-3 text-lg text-gray-600">
              These are some of the first questions Spokane residents usually ask as Medicare approaches.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {commonQuestions.map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-700">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">How we help</h2>
            <p className="mt-3 max-w-3xl text-lg leading-relaxed text-gray-700">
              Our process is built to make Medicare easier to understand without pressure.
            </p>
            <ol className="mt-8 space-y-4">
              {helpSteps.map((step, index) => (
                <li key={step} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-700 font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="pt-1 text-gray-800">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div id="turning-65-help-form">
            <LeadForm
              source="turning-65-medicare-spokane"
              heading="Request Turning 65 Help"
              subheading="Tell us a little about your situation and a licensed local agent will follow up to help you understand your Medicare options."
              showMessage
            />
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900">Helpful Medicare links</h2>
            <p className="mt-3 text-lg text-gray-600">
              Review related Spokane Medicare pages before or after your consultation.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {internalLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
              >
                <h3 className="text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-700">
                  {item.label}
                </h3>
                <span className="mt-4 inline-block text-sm font-medium text-blue-700 group-hover:underline">
                  Visit page →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Related resource</p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Still working at 65 or covered by a spouse&apos;s plan?</h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                Medicare timing can look different when employer coverage is still involved. Review the questions to ask
                about Part B, Part D, creditable coverage, and HSA contributions before you decide when to enroll.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                href="/working-past-65-medicare"
                className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-800"
              >
                Explore Working Past 65 Guidance
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-900 transition-colors hover:bg-gray-50"
              >
                Contact a Local Agent
              </Link>
            </div>
          </div>
        </div>
      </section>

      <FAQ items={faqs} heading="Turning 65 Medicare FAQ" />

      <section className="bg-white px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <Disclaimer />
        </div>
      </section>
    </>
  );
}
