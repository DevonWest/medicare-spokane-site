import type { Metadata } from "next";
import Link from "next/link";
import Disclaimer from "@/components/Disclaimer";
import FAQ, { type FAQItem } from "@/components/FAQ";
import LeadForm from "@/components/LeadForm";
import { siteConfig, telHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Medicare Savings Program and Extra Help in Washington",
  description:
    "Learn how Medicare Savings Programs, Medicaid through Washington DSHS, and the federal Extra Help (LIS) program may help some Medicare beneficiaries with costs. Educational overview from a Spokane licensed independent insurance agency.",
  alternates: {
    canonical: `${siteConfig.url}/medicare-savings-program-extra-help-washington`,
  },
  openGraph: {
    title:
      "Medicare Savings Program and Extra Help in Washington | Medicare in Spokane",
    description:
      "Educational overview of Medicare Savings Programs, Washington Medicaid through DSHS, and the federal Extra Help (LIS) program. Eligibility is determined by the state and federal agencies that administer these programs.",
    url: `${siteConfig.url}/medicare-savings-program-extra-help-washington`,
  },
};

const programOverview = [
  {
    title: "Medicare Savings Programs (MSPs)",
    body: "Medicare Savings Programs are state-administered programs that may help certain people with limited income and resources pay some Medicare costs, such as Part B premiums and, in some cases, deductibles, coinsurance, and copayments. There are different MSPs with different rules. Eligibility and benefits are determined by the state of Washington, not by an insurance agency.",
  },
  {
    title: "Medicaid through Washington DSHS / Apple Health",
    body: "Some Medicare beneficiaries may also qualify for Medicaid (Washington Apple Health) through the Washington State Department of Social and Health Services (DSHS) or the Health Care Authority. People who have both Medicare and Medicaid are sometimes called dual eligible. Medicaid eligibility and benefits in Washington are determined by the state.",
  },
  {
    title: "Extra Help (Low Income Subsidy / LIS)",
    body: "Extra Help, also known as the Low Income Subsidy (LIS), is a federal program administered by the Social Security Administration that may help certain people with limited income and resources pay for Medicare prescription drug (Part D) costs, including premiums, deductibles, and copayments. Eligibility is determined by Social Security and the Centers for Medicare & Medicaid Services.",
  },
];

const whoToContact = [
  {
    title: "Apply for Medicare Savings Programs or Apple Health (Medicaid)",
    body: "Washington Apple Health and Medicare Savings Program applications in Washington are handled by Washington Healthplanfinder and the Washington State Department of Social and Health Services (DSHS).",
    linkLabel: "Visit Washington Healthplanfinder",
    href: "https://www.wahealthplanfinder.org/",
  },
  {
    title: "Apply for Extra Help (LIS) for Part D",
    body: "Extra Help applications are handled by the Social Security Administration. You can apply online, by phone, or at a local Social Security office.",
    linkLabel: "Apply for Extra Help at SSA.gov",
    href: "https://www.ssa.gov/medicare/part-d-extra-help",
  },
  {
    title: "Free, unbiased Medicare counseling in Washington",
    body: "Statewide Health Insurance Benefits Advisors (SHIBA) is Washington's State Health Insurance Assistance Program (SHIP). SHIBA volunteers offer free, unbiased Medicare counseling, including help with low-income assistance programs.",
    linkLabel: "Visit Washington SHIBA",
    href: "https://www.insurance.wa.gov/statewide-health-insurance-benefits-advisors-shiba",
  },
];

const howWeCanHelp = [
  "Explain in plain language how Medicare Savings Programs, Apple Health, and Extra Help generally work",
  "Point you to the official Washington and federal agencies that determine eligibility",
  "Review your current Medicare Advantage, Medicare Supplement, or Part D coverage from the plans we represent",
  "Help you understand how a Part D Low Income Subsidy may interact with prescription drug coverage",
  "Answer questions about plan choices, networks, formularies, and pharmacies",
];

const faqs: FAQItem[] = [
  {
    question: "Can a licensed insurance agent decide if I qualify for Extra Help or Medicaid?",
    answer:
      "No. Eligibility for Medicare Savings Programs and Apple Health (Medicaid) is determined by the state of Washington, and Extra Help (LIS) eligibility is determined by the Social Security Administration and the Centers for Medicare & Medicaid Services. A licensed independent insurance agency cannot approve or guarantee eligibility for these programs. We can help you understand how the programs generally work and where to apply.",
  },
  {
    question: "Do I have to be on Medicaid to get Extra Help?",
    answer:
      "Not necessarily. Extra Help has its own income and resource rules set by the federal government. Some people qualify for Extra Help automatically because they already have Medicaid, Supplemental Security Income, or a Medicare Savings Program, while others apply directly with the Social Security Administration.",
  },
  {
    question: "Will applying for these programs affect my current Medicare plan?",
    answer:
      "If you qualify for Extra Help, certain Special Enrollment Period rules may apply for prescription drug coverage. If you become dual eligible for Medicare and Medicaid, you may also have additional plan choices. We can talk through how the plans we represent might work in your situation, but the underlying eligibility decisions are made by the state and federal agencies that administer each program.",
  },
  {
    question: "Is help from your agency free?",
    answer:
      "Yes. Consultations with our licensed independent insurance agency are no-cost and no-obligation. You are also welcome to use Washington's free SHIBA counseling program for unbiased Medicare guidance.",
  },
  {
    question: "What if I am not sure whether I might qualify?",
    answer:
      "It is okay to be unsure. Income and resource limits change, and program rules can be detailed. The official agencies listed on this page can review your specific situation. We can talk you through general information and help you understand the questions to ask.",
  },
];

const internalLinks = [
  {
    href: "/medicare-part-d",
    title: "Medicare Part D",
    body: "Learn how Medicare prescription drug coverage works, including formularies and preferred pharmacies.",
  },
  {
    href: "/rx-drug-review",
    title: "Prescription Drug Review",
    body: "Bring your medication list to review how prescriptions and pharmacies may affect your coverage.",
  },
  {
    href: "/compare-medicare-options",
    title: "Compare Medicare Options",
    body: "Review Medicare Advantage, Medicare Supplement, Part D, and other coverage paths through the plans we represent.",
  },
  {
    href: "/medicare-plan-review-spokane",
    title: "Annual Medicare Plan Review",
    body: "Review your current Medicare coverage with a local licensed agent before the next plan year.",
  },
  {
    href: "/contact",
    title: "Contact Our Spokane Office",
    body: "Request an in-person or phone consultation with a local licensed insurance agent.",
  },
];

export default function MedicareSavingsProgramExtraHelpWashingtonPage() {
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
            <span>Medicare Savings Program &amp; Extra Help (Washington)</span>
          </nav>
          <div className="max-w-4xl">
            <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">
              Medicare Savings Program and Extra Help in Washington
            </h1>
            <p className="mt-4 text-xl leading-relaxed text-blue-100">
              Some Medicare beneficiaries may qualify for help with Medicare costs through the
              Medicare Savings Program, Washington Apple Health (Medicaid) through DSHS, or the
              federal Extra Help (LIS) program. This page is an educational overview only.
              Eligibility is determined by the state and federal agencies that administer these
              programs.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href={telHref}
                className="inline-flex items-center justify-center rounded-lg bg-white px-7 py-3 text-lg font-semibold text-blue-800 transition-colors hover:bg-blue-50"
              >
                Call 509-353-0476
              </a>
              <Link
                href="#extra-help-form"
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
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wider text-amber-800">
              Important
            </p>
            <p className="mt-4 text-lg leading-relaxed text-gray-900">
              {siteConfig.legalName} is {siteConfig.agencyDescriptor}. We do not determine
              eligibility for Medicaid, Medicare Savings Programs, or Extra Help, and we cannot
              guarantee that you will qualify for, save money through, or receive benefits from any
              government program. Final eligibility decisions are made by Washington state agencies
              and the federal government.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 pb-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900">
              Programs that may help with Medicare costs
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              The programs below are administered by Washington state and the federal government,
              not by an insurance agency. Each has its own rules for income, resources, and
              benefits. The summaries here are general and educational.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {programOverview.map((item) => (
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
            <h2 className="text-3xl font-bold text-gray-900">Where to apply or get unbiased help</h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              The agencies below are the official starting points for applications and unbiased
              counseling in Washington. We encourage you to contact them directly to learn whether
              you may qualify.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {whoToContact.map((item) => (
              <article
                key={item.title}
                className="flex flex-col rounded-2xl border border-white bg-white p-6 shadow-sm"
              >
                <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-gray-700">{item.body}</p>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-block text-sm font-semibold text-blue-700 hover:underline"
                >
                  {item.linkLabel} ↗
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">How a local agent can help</h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-700">
              We cannot decide whether you qualify for Medicaid, a Medicare Savings Program, or
              Extra Help &mdash; those decisions are made by the state and federal agencies that
              run those programs. What we can do is explain how Medicare works alongside these
              programs and help you review the Medicare Advantage, Medicare Supplement, and Part D
              options from the plans we represent.
            </p>
            <ul className="mt-6 space-y-3 text-base leading-relaxed text-gray-700">
              {howWeCanHelp.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    className="mt-1 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-700 text-xs font-semibold text-white"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-base leading-relaxed text-gray-700">
              Have questions about prescriptions or pharmacies? Our{" "}
              <Link href="/rx-drug-review" className="font-medium text-blue-700 hover:underline">
                prescription drug review
              </Link>{" "}
              and{" "}
              <Link href="/medicare-part-d" className="font-medium text-blue-700 hover:underline">
                Medicare Part D
              </Link>{" "}
              pages explain how drug coverage works.
            </p>
          </div>

          <div
            id="extra-help-form"
            className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8"
          >
            <LeadForm
              source="medicare-savings-program-extra-help-washington"
              heading="Request Help Online"
              subheading="Tell us how to reach you and a local licensed agent will follow up with general information and answer your questions."
              showMessage
            />
            <Disclaimer className="mt-6" />
          </div>
        </div>
      </section>

      <FAQ items={faqs} heading="Medicare Savings Program & Extra Help FAQ" />

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
