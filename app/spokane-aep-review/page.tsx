import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import AepReviewLeadForm from "@/components/AepReviewLeadForm";
import { siteConfig, telHref } from "@/lib/site";

const pageUrl = `${siteConfig.url}/spokane-aep-review`;

export const metadata: Metadata = {
  title: "No-Cost Medicare Plan Review in Spokane",
  description:
    "Request a no-cost Medicare plan review from a local Spokane licensed insurance agent. Review prescriptions, doctors, pharmacies, costs, and coverage changes.",
  alternates: { canonical: pageUrl },
  robots: { index: false, follow: true },
  openGraph: {
    title: "No-Cost Medicare Plan Review in Spokane",
    description:
      "Get local help reviewing prescriptions, doctors, pharmacies, costs, and Medicare coverage options from the plans we represent.",
    url: pageUrl,
    images: [
      {
        url: "/illustrations/annual-plan-review.png",
        width: 1000,
        height: 1200,
        alt: "Annual Medicare plan review checklist",
      },
    ],
  },
};

const reviewItems = [
  "Prescription coverage and preferred pharmacies",
  "Doctors, specialists, hospitals, and plan networks",
  "Premiums, copays, deductibles, and out-of-pocket costs",
  "Benefits and changes listed in your Annual Notice of Change",
];

const trustPoints = [
  "Licensed independent insurance agency",
  "Local Spokane office",
  "Phone or in-person help available",
  "No-cost, no-obligation consultation",
];

export default function SpokaneAepReviewPage() {
  return (
    <>
      <section className="overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 px-4 py-10 text-white sm:py-14 lg:py-16">
        <div className="mx-auto grid max-w-6xl items-start gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div className="pt-1 lg:pt-5">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-200">Spokane-area Medicare help</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Review your Medicare coverage before the year ahead.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-100 sm:text-xl">
              A local licensed agent can help you review your prescriptions, doctors, pharmacy, costs, and coverage options from the plans we represent.
            </p>

            <ul className="mt-6 grid max-w-2xl grid-cols-1 gap-3 text-base text-blue-50 sm:grid-cols-2">
              {trustPoints.map((point) => (
                <li key={point} className="flex items-start gap-2.5">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-xs font-bold text-emerald-950" aria-hidden="true">✓</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href="#aep-review-form" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 py-3 font-bold text-blue-900 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-900">
                Request a No-Cost Review
              </a>
              <a href={telHref} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-blue-300 px-6 py-3 font-semibold text-white transition hover:bg-white/10">
                Call {siteConfig.phone}
              </a>
            </div>

            <div className="mt-8 flex max-w-2xl items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <Image
                src="/illustrations/annual-plan-review.png"
                alt="Annual plan review checklist"
                width={1000}
                height={1200}
                priority
                sizes="96px"
                className="h-24 w-20 shrink-0 rounded-xl object-cover object-top shadow-md"
              />
              <p className="text-sm leading-6 text-blue-50">
                <strong className="block text-base text-white">Not everyone needs to change plans.</strong>
                The goal is to understand what changed and whether your current coverage still fits.
              </p>
            </div>
          </div>

          <AepReviewLeadForm />
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-4 py-12 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">A focused annual checkup</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">What your review can cover</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Bring your current plan information and Annual Notice of Change if you have it. We will keep the conversation clear and centered on what matters to you.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            {reviewItems.map((item, index) => (
              <article key={item} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-800 text-sm font-bold text-white" aria-hidden="true">{index + 1}</span>
                <p className="pt-1 text-base font-semibold leading-7 text-slate-800">{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-12 sm:py-14">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">Simple next steps</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-950">Local help without the pressure</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Your request goes directly to {siteConfig.legalName}. A licensed local agent will contact you to learn what you want to review and arrange a convenient conversation.
            </p>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              We do not ask for Medicare numbers, Social Security numbers, medical records, or payment information on this form.
            </p>
          </div>

          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              ["1", "Send your request", "Share basic contact details and what you want to review."],
              ["2", "Talk with a local agent", "Choose phone or in-person help at a convenient time."],
              ["3", "Understand your options", "Review your current coverage and the plans we represent."],
            ].map(([number, title, body]) => (
              <li key={number} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="text-sm font-bold uppercase tracking-wider text-blue-700">Step {number}</span>
                <h3 className="mt-2 text-lg font-bold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-white px-4 py-12 sm:py-14">
        <div className="mx-auto max-w-4xl rounded-3xl border border-blue-100 bg-blue-50 p-6 text-center sm:p-9">
          <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">Ready for a clearer Medicare review?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-700">
            Request your no-cost review above, or call our Spokane office. A licensed insurance agent can help explain the options available through the organizations we represent.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="#aep-review-form" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-800 px-6 py-3 font-bold text-white hover:bg-blue-900">Request My Review</a>
            <a href={telHref} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-blue-800 bg-white px-6 py-3 font-bold text-blue-800 hover:bg-blue-50">Call {siteConfig.phone}</a>
          </div>
          <p className="mt-5 text-xs leading-5 text-slate-500">
            For general educational information about fall enrollment dates, visit our{" "}
            <Link href="/medicare-annual-enrollment-spokane" className="font-semibold text-blue-800 underline underline-offset-2">Annual Enrollment guide</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
