import type { Metadata } from "next";
import Link from "next/link";
import CTASection from "@/components/CTASection";
import Disclaimer from "@/components/Disclaimer";
import FAQ, { type FAQItem } from "@/components/FAQ";
import { CompareOptionsIllustration } from "@/components/Illustrations";
import LeadForm from "@/components/LeadForm";
import { siteConfig, telHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Compare Medicare Options Spokane",
  description:
    "Compare Medicare Advantage, Medicare Supplement, Part D, and supplemental insurance options in Spokane with help from a local licensed insurance agent.",
  alternates: { canonical: `${siteConfig.url}/compare-medicare-options` },
  openGraph: {
    title: "Compare Medicare Options Spokane | Medicare in Spokane",
    description:
      "Compare Medicare Advantage, Medicare Supplement, Part D, and supplemental insurance options in Spokane with help from a local licensed insurance agent.",
    url: `${siteConfig.url}/compare-medicare-options`,
  },
};

const audiences: string[] = [
  "Turning 65",
  "Reviewing Medicare Advantage options",
  "Comparing Medicare Supplement options",
  "Reviewing Part D prescription coverage",
  "Helping a parent or spouse",
];

const comparisonItems: string[] = [
  "Monthly premiums",
  "Doctor and hospital networks",
  "Prescription coverage",
  "Pharmacy options",
  "Copays and out-of-pocket costs",
  "Dental, vision, hearing, and other extras when available",
  "Travel/flexibility needs",
];

const steps: string[] = [
  "Tell us what you need",
  "Review doctors, prescriptions, and budget",
  "Compare options from the plans we represent",
  "Enroll with confidence if you choose",
];

const internalLinks = [
  {
    href: "/medicare-advantage",
    title: "Medicare Advantage",
    body: "Review plan types, provider networks, and extra benefits available through the plans we represent.",
  },
  {
    href: "/medicare-supplements",
    title: "Medicare Supplements",
    body: "Compare Medigap options that work alongside Original Medicare to help with out-of-pocket costs.",
  },
  {
    href: "/medicare-part-d",
    title: "Medicare Part D",
    body: "See how prescription drug coverage works and what to bring to a drug review.",
  },
  {
    href: "/rx-drug-review",
    title: "RX Drug Review",
    body: "Bring your medication list and compare how the plans we represent may cover your prescriptions.",
  },
  {
    href: "/contact",
    title: "Contact Our Spokane Office",
    body: "Talk with a licensed local agent in person or by phone.",
  },
  {
    href: "/resources",
    title: "Medicare Resources",
    body: "Browse additional Medicare guides, comparisons, and official resource links.",
  },
];

const faqs: FAQItem[] = [
  {
    question: "Do you offer every Medicare plan available?",
    answer: siteConfig.disclaimer,
  },
  {
    question: "Is there a cost to get help?",
    answer:
      "No. Our consultations are no-cost and no-obligation. If you choose to enroll in a plan we represent, your premium is the same whether you work with us or enroll on your own.",
  },
  {
    question: "Can you help compare Medicare Advantage and Medicare Supplement options?",
    answer:
      "Yes. We can review Medicare Advantage and Medicare Supplement options side by side, explain the trade-offs, and help you compare options from the plans we represent based on your doctors, budget, and preferences.",
  },
  {
    question: "Can you review my prescriptions?",
    answer:
      "Yes. We can review your prescriptions, dosages, and preferred pharmacies so you can compare how Medicare Advantage or Part D plans we represent may cover your medications.",
  },
  {
    question: "Can I meet in person?",
    answer:
      "Yes. Our Spokane office is located inside the Providence Medical Building. We offer both in-person and phone consultations for Spokane-area residents.",
  },
];

export default function CompareMedicareOptionsPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-blue-800 to-blue-600 px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-blue-200">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span>Compare Medicare Options</span>
          </nav>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="max-w-4xl">
            <h1 className="mb-4 text-4xl font-extrabold leading-tight md:text-5xl">
              Compare Medicare Options in Spokane
            </h1>
            <p className="max-w-3xl text-xl text-blue-100">
              Work with a local licensed insurance agent to review Medicare Advantage, Medicare Supplement, Part D,
              and supplemental insurance options available through the plans we represent.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href={telHref}
                className="inline-flex items-center justify-center rounded-lg bg-white px-7 py-3 text-lg font-semibold text-blue-800 transition-colors hover:bg-blue-50"
              >
                Call 509-353-0476
              </a>
              <Link
                href="#compare-help-form"
                className="inline-flex items-center justify-center rounded-lg border border-blue-300 bg-blue-900 px-7 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-950"
              >
                Request Help Online
              </Link>
            </div>
            <p className="mt-5 text-base font-semibold text-blue-50">
              No-cost consultation. No pressure. Local Spokane guidance.
            </p>
            </div>
            <div className="hidden lg:flex lg:justify-center">
              <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-white/10 p-4 shadow-lg backdrop-blur-sm">
                <CompareOptionsIllustration />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900">Who this page is for</h2>
            <p className="mt-3 text-lg text-gray-600">
              This page is built for Spokane-area residents who want straightforward Medicare guidance without pressure.
            </p>
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

      <section className="border-y border-slate-100 bg-slate-50 px-4 py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">What we compare</h2>
            <p className="mt-3 max-w-3xl text-lg leading-relaxed text-gray-700">
              We help you organize the details that matter most so you can compare Medicare coverage with more clarity.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {comparisonItems.map((item) => (
                <div key={item} className="flex rounded-2xl border border-white bg-white p-4 shadow-sm">
                  <span className="mr-3 mt-0.5 text-blue-700" aria-hidden="true">
                    ✓
                  </span>
                  <span className="text-gray-800">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Local Spokane support</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">Meet with a local licensed insurance agent.</h2>
            <div className="mt-4 space-y-4 text-lg leading-relaxed text-gray-700">
              <p>
                {siteConfig.legalName} is a Spokane-based licensed independent insurance agency helping local residents
                compare Medicare Advantage, Medicare Supplement, Part D, and supplemental insurance options.
              </p>
              <p>Our Spokane office is located inside the Providence Medical Building.</p>
              <p>We offer in-person and phone consultations available for Spokane-area residents.</p>
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

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900">How the process works</h2>
            <p className="mt-3 text-lg text-gray-600">
              A simple process designed to help you review your options at your pace.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Step {index + 1}</p>
                <h3 className="mt-3 text-xl font-semibold text-gray-900">{step}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="compare-help-form" className="border-y border-slate-100 bg-slate-50 px-4 py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Request help comparing Medicare options</h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              Tell us whether you are turning 65, reviewing coverage, or helping a family member. A local licensed
              agent can review doctors, prescriptions, and budget considerations with you.
            </p>
            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm leading-relaxed text-blue-900">
              <p className="font-semibold">Compliance note</p>
              <p className="mt-2">{siteConfig.disclaimer}</p>
              <p className="mt-2">{siteConfig.nonAffiliation}</p>
            </div>
          </div>
          <LeadForm
            source="compare-medicare-options"
            heading="Request Help Online"
            subheading="Share a few details and a licensed local agent will follow up to review your Medicare options."
            showMessage
          />
        </div>
      </section>

      <FAQ items={faqs} heading="Compare Medicare Options FAQ" />

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

      <section className="bg-white px-4 pb-12">
        <div className="mx-auto max-w-3xl">
          <Disclaimer />
        </div>
      </section>

      <CTASection
        heading="Need help comparing Medicare coverage in Spokane?"
        subheading="Talk with a local licensed insurance professional — no cost, no pressure."
      />
    </>
  );
}
