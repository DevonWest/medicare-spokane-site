import type { Metadata } from "next";
import Link from "next/link";
import Disclaimer from "@/components/Disclaimer";
import FAQ, { type FAQItem } from "@/components/FAQ";
import LeadForm from "@/components/LeadForm";
import { siteConfig, telHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Affordable Health Insurance Help in Spokane, WA | Health Insurance Options",
  description:
    "Get local help reviewing individual and family health insurance options in Spokane, WA. Health Insurance Options LLC helps people compare coverage, costs, provider access, and enrollment timing before Medicare.",
  alternates: { canonical: `${siteConfig.url}/health-insurance-spokane` },
  openGraph: {
    title: "Affordable Health Insurance Help in Spokane, WA | Health Insurance Options",
    description:
      "Get local help reviewing individual and family health insurance options in Spokane, WA. Health Insurance Options LLC helps people compare coverage, costs, provider access, and enrollment timing before Medicare.",
    url: `${siteConfig.url}/health-insurance-spokane`,
  },
};

const audienceCards: Array<{ title: string; body: string }> = [
  {
    title: "Self-employed workers",
    body: "Freelancers, contractors, and small-business owners reviewing coverage options outside an employer plan.",
  },
  {
    title: "People losing employer coverage",
    body: "Workers leaving a job, retiring early, or coming off a spouse's plan who need to understand enrollment timing.",
  },
  {
    title: "Families comparing coverage",
    body: "Households reviewing premiums, deductibles, copays, prescriptions, and provider access for dependents.",
  },
  {
    title: "People moving to Washington",
    body: "New Spokane-area residents reviewing what coverage is available locally.",
  },
  {
    title: "People not yet eligible for Medicare",
    body: "Adults under 65 looking at health insurance choices before Medicare begins.",
  },
  {
    title: "People between jobs",
    body: "Spokane-area residents reviewing available options while they are between employer coverage.",
  },
];

const reviewBullets: string[] = [
  "Monthly premiums",
  "Deductibles",
  "Copays and out-of-pocket costs",
  "Doctor and provider access",
  "Prescription coverage",
  "Household and income considerations",
  "Enrollment timing",
  "Special enrollment situations",
];

const processSteps: string[] = [
  "Tell us what kind of coverage you need",
  "Review household, provider, and prescription needs",
  "Compare options available through the carriers/plans we represent",
  "Ask questions and choose whether to apply",
];

const faqs: FAQItem[] = [
  {
    question: "Can you help me find affordable health insurance in Spokane?",
    answer:
      "Yes. We help Spokane-area individuals and families review available health insurance options and understand costs, provider access, prescriptions, and enrollment timing. We do not guarantee savings or eligibility.",
  },
  {
    question: "Do you help people who are not on Medicare?",
    answer:
      "Yes. While most of our work focuses on Medicare, we also help Spokane-area individuals and families review health insurance options when Medicare is not yet a factor.",
  },
  {
    question: "Can you help if I am self-employed?",
    answer:
      "Yes. Self-employed workers, freelancers, and small-business owners often need to find their own coverage. We can walk through available options through the carriers and plans we represent.",
  },
  {
    question: "Can you help if I lost employer coverage?",
    answer:
      "Yes. Losing employer coverage may open a Special Enrollment Period. We can help you understand timing, what to look at, and what coverage choices may be available.",
  },
  {
    question: "What if I am turning 65 soon?",
    answer:
      "If you are turning 65 or already on Medicare, your options are different. Visit our Turning 65 in Spokane page or our Medicare Help page for guidance on Medicare Advantage, Medicare Supplement, and Part D.",
  },
];

const affordabilityBullets: string[] = [
  "Review premiums, deductibles, copays, and out-of-pocket costs",
  "Look at doctor and provider access",
  "Consider prescription coverage and pharmacy needs",
  "Explain enrollment timing and special enrollment situations",
];

const moreHealthInsuranceHelp: Array<{ href: string; label: string; body: string }> = [
  {
    href: "/individual-family-health-insurance-spokane",
    label: "Individual & Family Health Insurance",
    body: "Review coverage options for individuals, families, and people buying coverage outside an employer plan.",
  },
  {
    href: "/self-employed-health-insurance-spokane",
    label: "Self-Employed Health Insurance",
    body: "Explore coverage considerations for self-employed workers, contractors, and small business owners.",
  },
  {
    href: "/health-insurance-special-enrollment-spokane",
    label: "Special Enrollment Help",
    body: "Understand enrollment timing after losing employer coverage, moving, or experiencing another qualifying life event.",
  },
];

const internalLinks: Array<{ href: string; label: string; body: string }> = [
  {
    href: "/contact",
    label: "Contact Our Spokane Office",
    body: "Reach our Spokane-based team by phone or in person at the Providence Medical Building.",
  },
  {
    href: "/medicare-spokane",
    label: "Medicare Help in Spokane",
    body: "Local Medicare guidance for Spokane-area residents who are turning 65 or already on Medicare.",
  },
  {
    href: "/turning-65-medicare-spokane",
    label: "Turning 65 in Spokane",
    body: "Checklists and answers to common questions for people approaching Medicare eligibility.",
  },
  {
    href: "/working-past-65-medicare",
    label: "Working Past 65 & Medicare",
    body: "Understand how employer coverage and Medicare timing work when you keep working past 65.",
  },
  {
    href: "/resources",
    label: "Resource Library",
    body: "Browse local guides and trusted government resources on coverage, enrollment, and more.",
  },
];

export default function HealthInsuranceSpokanePage() {
  return (
    <>
      <section className="bg-gradient-to-br from-blue-800 to-blue-600 px-4 py-16 landscape-mobile:py-5 text-white">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Breadcrumb" className="mb-4 landscape-mobile:mb-2 text-sm text-blue-200">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/resources" className="hover:text-white">
              Resources
            </Link>
            <span className="mx-2">/</span>
            <span>Health Insurance Help in Spokane</span>
          </nav>
          <div className="max-w-4xl">
            <p className="mb-3 landscape-mobile:mb-1 text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">
              Affordable Coverage Guidance for Individuals and Families
            </p>
            <h1 className="mb-4 landscape-mobile:mb-2 text-4xl landscape-mobile:text-2xl landscape-mobile:leading-snug font-extrabold leading-tight md:text-5xl">
              Health Insurance Help in Spokane, WA
            </h1>
            <p className="max-w-3xl text-xl landscape-mobile:text-base text-blue-100">
              {siteConfig.legalName} helps Spokane-area individuals and families review health insurance options,
              including coverage for people who are not yet eligible for Medicare.
            </p>
            <div className="mt-8 landscape-mobile:mt-4 flex flex-col gap-4 landscape-mobile:gap-3 sm:flex-row landscape-mobile:flex-row">
              <a
                href={telHref}
                className="inline-flex items-center justify-center rounded-lg bg-white px-7 landscape-mobile:px-5 py-3 landscape-mobile:py-2 text-lg landscape-mobile:text-base font-semibold text-blue-800 transition-colors hover:bg-blue-50"
              >
                Call 509-353-0476
              </a>
              <Link
                href="#health-insurance-help-form"
                className="inline-flex items-center justify-center rounded-lg border border-blue-300 bg-blue-900 px-7 landscape-mobile:px-5 py-3 landscape-mobile:py-2 text-lg landscape-mobile:text-base font-semibold text-white transition-colors hover:bg-blue-950"
              >
                Request Health Insurance Help
              </Link>
            </div>
            <p className="mt-5 landscape-mobile:mt-2 text-base landscape-mobile:text-sm font-semibold text-blue-50">
              Local guidance. No-cost consultation. Clear explanations.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900">
              Looking for Affordable Health Insurance Coverage in Spokane?
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-gray-700">
              We help individuals and families review available health insurance options before Medicare. A local
              licensed agent can explain coverage options clearly so you can compare costs, provider access,
              prescription coverage, and enrollment timing before you decide what to do next.
            </p>
            <p className="mt-4 text-base leading-relaxed text-gray-700">
              We do not guarantee savings or eligibility. Our role is to help you understand the plans we represent
              and other available options in plain language so you can make an informed decision.
            </p>
          </div>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {affordabilityBullets.map((item) => (
              <li key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-gray-800">
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {audienceCards.map((card) => (
              <article key={card.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-700">{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50 px-4 py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">What we can help review</h2>
            <p className="mt-3 max-w-3xl text-lg leading-relaxed text-gray-700">
              We sit down with you and walk through the parts of a health insurance plan that usually matter most.
            </p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {reviewBullets.map((item) => (
                <li
                  key={item}
                  className="flex items-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <span
                    className="mr-3 mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span className="text-gray-800">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <aside
            className="rounded-3xl border-2 border-blue-200 bg-blue-50 p-6 shadow-sm sm:p-8"
            aria-label="Medicare cross-link"
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
              Turning 65 or already on Medicare?
            </p>
            <h2 className="mt-3 text-2xl font-bold text-gray-900">
              Visit our Medicare help page.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-800">
              If you are turning 65 or already on Medicare, your options are different. Visit our Medicare Help and
              Turning 65 pages for Medicare Advantage, Medicare Supplement, and Part D information.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/medicare-spokane"
                className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-800"
              >
                Medicare Help in Spokane
              </Link>
              <Link
                href="/turning-65-medicare-spokane"
                className="inline-flex items-center justify-center rounded-lg border border-blue-300 bg-white px-5 py-3 text-base font-semibold text-blue-800 transition-colors hover:bg-blue-100"
              >
                Turning 65 in Spokane
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Local Spokane help</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">
              Talk with a Spokane-based licensed agent.
            </h2>
            <div className="mt-4 space-y-4 text-lg leading-relaxed text-gray-700">
              <p>
                {siteConfig.legalName} is a Spokane-based licensed independent insurance agency helping local
                residents review health insurance options.
              </p>
              <p>Our Spokane office is located inside the Providence Medical Building.</p>
              <p>We offer both in-person and phone consultations for Spokane-area residents.</p>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900">How the process works</h2>
            <ol className="mt-8 space-y-4">
              {processSteps.map((step, index) => (
                <li
                  key={step}
                  className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-700 font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="pt-1 text-gray-800">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900">More Health Insurance Help</h2>
            <p className="mt-3 text-lg text-gray-600">
              Explore additional health insurance pages for Spokane-area individuals, families, and
              workers who are not yet eligible for Medicare.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {moreHealthInsuranceHelp.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
              >
                <h3 className="text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-700">
                  {item.label}
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

      <section className="border-y border-slate-100 bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-3xl" id="health-insurance-help-form">
          <LeadForm
            source="health-insurance-spokane"
            heading="Request Health Insurance Help"
            subheading="Tell us a little about your situation and a licensed local agent will follow up to help you review health insurance options."
            showMessage
          />
        </div>
      </section>

      <FAQ items={faqs} heading="Health Insurance Help FAQ" />

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900">Related pages</h2>
            <p className="mt-3 text-lg text-gray-600">
              Looking for something else? These local pages may help.
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
                <p className="mt-3 text-sm leading-relaxed text-gray-700">{item.body}</p>
                <span className="mt-4 inline-block text-sm font-medium text-blue-700 group-hover:underline">
                  Visit page →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <Disclaimer />
        </div>
      </section>
    </>
  );
}
