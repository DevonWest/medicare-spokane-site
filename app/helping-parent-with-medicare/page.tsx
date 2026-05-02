import type { Metadata } from "next";
import Link from "next/link";
import CTASection from "@/components/CTASection";
import Disclaimer from "@/components/Disclaimer";
import FAQ, { type FAQItem } from "@/components/FAQ";
import { HelpingParentIllustration } from "@/components/Illustrations";
import LeadForm from "@/components/LeadForm";
import { siteConfig, telHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Helping a Parent with Medicare Spokane",
  description:
    "Helping a parent or loved one with Medicare in Spokane? Get local guidance reviewing Medicare Advantage, Medicare Supplement, Part D, prescriptions, doctors, and plan options.",
  alternates: { canonical: `${siteConfig.url}/helping-parent-with-medicare` },
  openGraph: {
    title: "Helping a Parent with Medicare Spokane",
    description:
      "Helping a parent or loved one with Medicare in Spokane? Get local guidance reviewing Medicare Advantage, Medicare Supplement, Part D, prescriptions, doctors, and plan options.",
    url: `${siteConfig.url}/helping-parent-with-medicare`,
  },
};

const audiences: string[] = [
  "Adult children helping a parent",
  "Spouses comparing coverage together",
  "Caregivers helping organize Medicare information",
  "Families reviewing prescriptions and doctors",
  "Loved ones confused by plan changes or premium increases",
];

const reviewItems: string[] = [
  "Current Medicare coverage",
  "Medicare Advantage options",
  "Medicare Supplement options",
  "Part D prescription drug coverage",
  "Doctor and hospital networks",
  "Pharmacy preferences",
  "Monthly premiums, copays, and out-of-pocket costs",
  "Important enrollment timing questions",
];

const processSteps: string[] = [
  "Tell us what your family is trying to solve",
  "Gather basic coverage, prescription, doctor, and pharmacy information",
  "Review options from the plans we represent",
  "Explain choices in plain English",
  "Help your loved one make an informed decision if they choose",
];

const faqs: FAQItem[] = [
  {
    question: "Can I help my parent compare Medicare options?",
    answer:
      "Yes. Adult children, spouses, caregivers, and other family members often help gather information and ask questions. We can explain Medicare basics, review options from the plans we represent, and help your family understand the next steps.",
  },
  {
    question: "Does my parent need to be on the call?",
    answer:
      "Sometimes. To protect privacy, your loved one may need to be involved in the conversation or provide permission before we can discuss personal plan details.",
  },
  {
    question: "Can you review prescriptions and doctors?",
    answer:
      "Yes. We can review prescriptions, doctors, hospitals, and pharmacy preferences so your family can better understand how the plans we represent may fit your loved one's situation.",
  },
  {
    question: "Can you help if my parent's plan changed?",
    answer:
      "Yes. If premiums increased, provider access changed, or prescriptions are being handled differently, we can review the situation and explain available options from the plans we represent in plain English.",
  },
  {
    question: "Is there a cost for the consultation?",
    answer:
      "No. Our consultations are no-cost and no-obligation. If your loved one chooses to enroll in a plan we represent, the premium is the same whether they work with us or enroll on their own.",
  },
];

const internalLinks = [
  {
    href: "/compare-medicare-options",
    title: "Compare Medicare Options",
    body: "Review plan types, coverage trade-offs, and next steps with local Spokane guidance.",
  },
  {
    href: "/rx-drug-review",
    title: "RX Drug Review",
    body: "See how prescriptions and pharmacy preferences can affect Medicare coverage choices.",
  },
  {
    href: "/medicare-advantage",
    title: "Medicare Advantage",
    body: "Learn how Medicare Advantage options work, including networks and extra benefits.",
  },
  {
    href: "/medicare-supplements",
    title: "Medicare Supplements",
    body: "Understand how Medigap plans work with Original Medicare to help with out-of-pocket costs.",
  },
  {
    href: "/medicare-part-d",
    title: "Medicare Part D",
    body: "Get a plain-English overview of standalone prescription drug coverage.",
  },
  {
    href: "/contact",
    title: "Contact Our Spokane Office",
    body: "Schedule an in-person or phone consultation with our local licensed agents.",
  },
];

export default function HelpingParentWithMedicarePage() {
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
            <span>Helping a Parent with Medicare</span>
          </nav>
          <div className="max-w-4xl">
            <h1 className="mb-4 text-4xl font-extrabold leading-tight md:text-5xl">
              Helping a Parent with Medicare in Spokane?
            </h1>
            <p className="max-w-3xl text-xl text-blue-100">
              If you&apos;re helping a parent, spouse, or loved one understand Medicare, you don&apos;t have to
              figure it out alone. Our local licensed agents can help review plan options, prescriptions,
              doctors, and next steps in plain English.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href={telHref}
                className="inline-flex items-center justify-center rounded-lg bg-white px-7 py-3 text-lg font-semibold text-blue-800 transition-colors hover:bg-blue-50"
              >
                Call 509-353-0476
              </a>
              <Link
                href="#parent-help-form"
                className="inline-flex items-center justify-center rounded-lg border border-blue-300 bg-blue-900 px-7 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-950"
              >
                Request Help for a Parent
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
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_0.8fr]">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold text-gray-900">Who this page is for</h2>
              <p className="mt-3 text-lg text-gray-600">
                Support for Spokane-area families trying to make Medicare decisions with more clarity and less
                stress.
              </p>
            </div>
            <div className="mx-auto hidden w-full max-w-sm rounded-3xl border border-stone-200 bg-stone-50 p-5 shadow-sm md:block">
              <HelpingParentIllustration className="text-sky-700" />
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            {audiences.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">{item}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="parent-help-form" className="border-y border-slate-100 bg-slate-50 px-4 py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">What we can help review</h2>
            <p className="mt-3 max-w-3xl text-lg leading-relaxed text-gray-700">
              Bring the practical details that matter most so your family can understand Medicare options with
              less guesswork.
            </p>
            <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {reviewItems.map((item) => (
                <li key={item} className="flex rounded-2xl border border-white bg-white p-4 shadow-sm">
                  <span className="mr-3 mt-0.5 text-blue-700" aria-hidden="true">
                    ✓
                  </span>
                  <span className="text-gray-800">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-amber-800">Important permission note</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">Privacy comes first.</h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-800">
              To protect privacy, your loved one may need to be involved in the conversation or provide
              permission before we can discuss personal plan details.
            </p>
            <p className="mt-4 text-base leading-relaxed text-gray-700">
              We can still explain general Medicare rules, help your family organize questions, and outline what
              information will be needed for a more detailed review.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900">How the process works</h2>
            <p className="mt-3 text-lg text-gray-600">
              A simple process for families who want clear answers without pressure.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            {processSteps.map((step, index) => (
              <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Step {index + 1}</p>
                <h3 className="mt-3 text-lg font-semibold text-gray-900">{step}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50 px-4 py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Local Spokane support</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">Talk with a local licensed agency.</h2>
              <div className="mt-4 space-y-4 text-lg leading-relaxed text-gray-700">
                <p>
                  {siteConfig.legalName} is a Spokane-based licensed independent insurance agency helping adult
                  children, spouses, caregivers, and families review Medicare options.
                </p>
                <p>Our Spokane office is located inside the Providence Medical Building.</p>
                <p>In-person and phone consultations are available.</p>
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

            <Disclaimer />
          </div>

          <LeadForm
            source="helping-parent-with-medicare"
            heading="Request Help for a Parent"
            subheading="Share a few basics about what your family wants help with. Please do not include sensitive medical details in the form."
            showMessage
            className="h-fit"
          />
        </div>
      </section>

      <FAQ items={faqs} heading="Helping a Parent with Medicare FAQ" />

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900">Helpful Medicare links</h2>
            <p className="mt-3 text-lg text-gray-600">
              Explore related Spokane Medicare pages for plan comparisons, drug reviews, and next steps.
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
        heading="Need Medicare help for a parent or loved one?"
        subheading="Talk with a local licensed insurance professional in Spokane — no cost, no pressure."
      />
    </>
  );
}
