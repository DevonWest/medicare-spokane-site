import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import CTASection from "@/components/CTASection";
import FAQ, { type FAQItem } from "@/components/FAQ";
import HomeTestimonials from "@/components/HomeTestimonials";
import FriendlyIllustration from "@/components/FriendlyIllustration";
import LeadForm from "@/components/LeadForm";
import OfficeLocationTrust from "@/components/OfficeLocationTrust";
import ProcessSection from "@/components/ProcessSection";
import TeamSection from "@/components/TeamSection";
import TrustBenefits from "@/components/TrustBenefits";
import { siteConfig, telHref } from "@/lib/site";
import { getActiveTeamMembers } from "@/lib/team";

export const metadata: Metadata = {
  title: `${siteConfig.shortName} | ${siteConfig.positioning}`,
  description: siteConfig.description,
  alternates: { canonical: siteConfig.url },
  openGraph: {
    title: `${siteConfig.shortName} | ${siteConfig.positioning}`,
    description: siteConfig.description,
    url: siteConfig.url,
    type: "website",
  },
};

const homepageFaqs: FAQItem[] = [
  {
    question: "Does it cost anything to talk to a licensed insurance professional?",
    answer:
      "No. Our consultations are no-cost and no-obligation. Health Insurance Options LLC is paid by the insurance carriers we represent, so your monthly premium is the same whether you enroll on your own or work with us.",
  },
  {
    question: "Can you help me compare the plans you represent in Spokane?",
    answer:
      "Yes. We can help you compare the plans we represent in Spokane. We do not offer every plan available in your area. Currently, we represent 8 organizations which offer 75 products in your area. Please contact Medicare.gov, 1-800-MEDICARE, or your local State Health Insurance Assistance Program (SHIP) to get information on all of your options.",
  },
  {
    question: "Can you help me review my prescription drugs when comparing plans?",
    answer:
      "Yes. We can sit down with your current prescription list and help you compare how each Medicare Advantage or Part D plan we represent would cover your medications, including preferred pharmacies and tier placement.",
  },
  {
    question: "What if I'm turning 65 soon?",
    answer:
      "We can walk you through your Initial Enrollment Period, the differences between Original Medicare, Medicare Advantage, Medicare Supplement, and Part D, and help you compare options without any pressure.",
  },
  {
    question: "Are you affiliated with the government or Medicare?",
    answer:
      "No. Health Insurance Options LLC is a licensed independent insurance agency. We are not affiliated with or endorsed by the U.S. Centers for Medicare & Medicaid Services (CMS), Medicare.gov, the Social Security Administration, or the U.S. Department of Health and Human Services (HHS).",
  },
];

const trustBullets: string[] = [
  "Spokane-based team",
  "40+ years combined experience",
  "No-cost consultations",
];

const whatHappensNextSteps: string[] = [
  "We review your request.",
  "A licensed local Medicare agent contacts you.",
  "We help compare options from the plans we represent.",
  "There is no cost or obligation.",
];

export default function HomePage() {
  const activeMembers = getActiveTeamMembers();
  const heroFaces = activeMembers.slice(0, 3);
  const previewMembers = activeMembers.slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-800 to-blue-600 px-4 py-14 text-white sm:py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="mb-4 inline-block rounded-full border border-blue-400/50 bg-blue-900/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-100">
              Licensed Independent Insurance Agency · Spokane, WA
            </p>
            <h1 className="mb-4 text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl lg:text-6xl">
              Medicare Help for Spokane Residents
            </h1>
            <p className="mb-6 text-lg leading-relaxed text-blue-50 md:text-xl">
              Work with local licensed agents who guide you through your Medicare options with
              clarity and confidence.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <a
                href={telHref}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-bold text-blue-800 shadow-md transition-colors hover:bg-blue-50 sm:px-7 sm:text-lg"
                aria-label={`Call Now (${siteConfig.phone})`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z"
                  />
                </svg>
                Call Now ({siteConfig.phone})
              </a>
              <Link
                href="/contact"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-blue-400 bg-blue-900 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-950 sm:px-7 sm:text-lg"
              >
                Request Help
              </Link>
            </div>

            <p className="mt-4 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-50 shadow-sm backdrop-blur-sm sm:text-base">
              <span className="tracking-[0.2em] text-amber-300" aria-hidden="true">
                ★★★★★
              </span>
              <span>Trusted by Spokane-area Medicare clients</span>
            </p>

            {/* Trust bullets */}
            <ul className="mt-5 grid grid-cols-1 gap-2.5 text-sm sm:mt-6 sm:grid-cols-3 sm:gap-3">
              {trustBullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex items-center gap-2 text-blue-50 font-medium"
                >
                  <span
                    className="flex-shrink-0 inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-400/90 text-blue-900"
                    aria-hidden="true"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 5.292a1 1 0 010 1.416l-7.5 7.5a1 1 0 01-1.416 0l-3.5-3.5a1 1 0 111.416-1.416L8.5 12.088l6.79-6.796a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  {bullet}
                </li>
              ))}
            </ul>

            <div className="mt-6 hidden max-w-sm rounded-3xl border border-white/10 bg-white/10 p-4 shadow-lg backdrop-blur-sm lg:block">
              <FriendlyIllustration name="homepageGuidance" priority />
            </div>

            {/* Team preview row */}
            <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex shrink-0 -space-x-3">
                {heroFaces.map((m) => (
                  <div
                    key={m.name}
                    className="h-10 w-10 overflow-hidden rounded-full bg-blue-100 ring-2 ring-white sm:h-12 sm:w-12"
                  >
                    {m.image ? (
                      <Image
                        src={m.image}
                        alt={`Photo of ${m.name}, ${m.title}`}
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs font-bold text-blue-800">
                        {m.name
                          .split(" ")
                          .map((p) => p[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="min-w-0 flex-1 text-sm leading-6 text-blue-50">
                <p className="font-semibold text-white">Meet your local team</p>
                <Link
                  href="/our-team"
                  className="inline break-words text-blue-100 underline-offset-2 hover:underline"
                >
                  Helping Spokane-area residents navigate Medicare year-round →
                </Link>
              </div>
            </div>
          </div>

          <div className="lg:pl-4">
            <LeadForm
              source="homepage"
              heading="Schedule a No-Cost Medicare Review"
              subheading="A licensed insurance professional will reach out to help you compare options in your area."
            />
            <section className="mt-4 rounded-2xl border border-blue-100 bg-white/95 p-5 shadow-sm sm:p-6">
              <h3 className="text-xl font-bold text-gray-900">What Happens After You Submit?</h3>
              <ol className="mt-4 space-y-3">
                {whatHappensNextSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3 text-base leading-7 text-gray-700">
                    <span
                      className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-semibold text-white"
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </section>

      {/* CTA band — after hero */}
      <section className="bg-blue-50 border-b border-blue-100 py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-gray-800 font-medium">
            Ready to talk? A local Spokane agent can help you compare options today.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={telHref}
              className="inline-flex items-center justify-center bg-blue-700 hover:bg-blue-800 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              Call {siteConfig.phone}
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center bg-white text-blue-700 border border-blue-300 hover:border-blue-500 font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              Request a Consultation
            </Link>
          </div>
        </div>
      </section>

      {/* Helpful resource cards */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Helpful Medicare Guides
              </h2>
              <p className="text-gray-600 text-lg">
                Start with a few of the most helpful Spokane Medicare guides, then explore the full
                resource library when you are ready.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                href: "/turning-65-medicare-spokane",
                title: "Turning 65 in Spokane",
                body:
                  "Start with a Spokane-focused Medicare checklist covering enrollment timing, employer coverage questions, and the next steps to review.",
              },
              {
                href: "/compare-medicare-options",
                title: "Compare Medicare Options",
                body:
                  "Review Medicare Advantage, Medicare Supplement, Part D, and related coverage types from the plans we represent.",
              },
              {
                href: "/rx-drug-review",
                title: "Prescription Drug Review",
                body:
                  "Bring your medication list and compare how Medicare Advantage and Part D plans we represent may cover your prescriptions.",
              },
              {
                href: "/medicare-part-d",
                title: "Medicare Part D",
                body:
                  "Walk through your prescription list and compare standalone Part D plans we represent, including preferred pharmacies.",
              },
            ].map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="bg-slate-50 rounded-2xl border border-slate-200 p-6 hover:shadow-md hover:-translate-y-0.5 hover:border-blue-300 transition-all group"
              >
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 mb-2 transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">{card.body}</p>
                <span className="text-blue-700 text-sm font-medium group-hover:underline">
                  Learn more →
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/resources"
              className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-6 py-3 text-base font-semibold text-blue-700 transition-colors hover:bg-blue-100"
            >
              View All Medicare Resources
            </Link>
          </div>
        </div>
      </section>

      {/* Trust block */}
      <TrustBenefits />

      <OfficeLocationTrust />

      {/* Testimonials / social proof */}
      <HomeTestimonials />

      {/* CTA — after trust section */}
      <section className="bg-white py-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Talk With a Local, Licensed Spokane Agent
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Independent Guidance from a Spokane-based team — at your pace, with no pressure.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={telHref}
              className="inline-flex items-center justify-center bg-blue-700 hover:bg-blue-800 text-white font-semibold px-7 py-3 rounded-lg transition-colors text-base"
            >
              Call {siteConfig.phone}
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center bg-white text-blue-700 border-2 border-blue-700 hover:bg-blue-50 font-semibold px-7 py-3 rounded-lg transition-colors text-base"
            >
              Compare Plans
            </Link>
          </div>
        </div>
      </section>

      {/* Process section */}
      <ProcessSection />

      {/* Team preview */}
      <section className="py-20 px-4 bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-blue-700 text-sm font-semibold uppercase tracking-wider mb-3">
            Our Local Team
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            Meet Your Local Medicare Team
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto text-lg">
            Our licensed insurance professionals are Spokane locals who offer no-cost Medicare
            guidance to help you compare options and find coverage that fits your needs.
          </p>
          <TeamSection members={previewMembers} />
          <div className="mt-12 text-center">
            <Link
              href="/our-team"
              className="inline-flex items-center justify-center bg-blue-700 hover:bg-blue-800 text-white font-semibold px-7 py-3 rounded-lg transition-colors text-base"
            >
              Meet the Full Team →
            </Link>
          </div>
        </div>
      </section>

      {/* RX review band */}
      <section className="py-16 px-4 bg-blue-50 border-y border-blue-100">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            <div className="text-center lg:text-left">
              <h2 className="mb-3 text-2xl font-bold text-gray-900 md:text-3xl">
                Bring Your Prescription List
              </h2>
              <p className="mb-6 text-lg leading-relaxed text-gray-700">
                One of the most useful things we do during a no-cost consultation is review your current
                prescriptions. We will help you compare how the Medicare Advantage and Part D plans we
                represent would cover your medications — including tier placement, preferred pharmacies,
                and estimated annual costs — so you can choose with confidence.
              </p>
              <Link
                href="/rx-drug-review"
                className="inline-block rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-800"
              >
                Request a Drug Review
              </Link>
            </div>
            <div className="mx-auto hidden w-full max-w-sm rounded-3xl border border-blue-100 bg-white p-5 shadow-sm lg:block">
              <FriendlyIllustration name="prescriptionReview" />
            </div>
          </div>
        </div>
      </section>

      {/* Local areas served */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Serving Spokane &amp; Surrounding Communities
          </h2>
          <p className="text-gray-700 leading-relaxed text-lg max-w-3xl mx-auto">
            Helping Spokane-area residents navigate Medicare year-round — including{" "}
            <strong>Spokane Valley</strong>, <strong>Liberty Lake</strong>,{" "}
            <strong>Cheney</strong>, Airway Heights, Medical Lake, Mead, and Deer Park.
          </p>
        </div>
      </section>

      <FAQ items={homepageFaqs} heading="Common Medicare Questions in Spokane" />

      {/* Final CTA */}
      <CTASection
        heading="Ready to Compare Your Medicare Options?"
        subheading="No cost, no pressure — just straightforward Medicare guidance in Spokane."
      />
    </>
  );
}
