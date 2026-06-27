import Link from "next/link";
import Disclaimer from "@/components/Disclaimer";
import FAQ, { type FAQItem } from "@/components/FAQ";
import LeadForm from "@/components/LeadForm";
import { siteConfig, telHref } from "@/lib/site";
import type { LeadSource } from "@/lib/leadSources";

export interface FocusedHealthInsurancePageConfig {
  slug: string;
  source: LeadSource;
  eyebrow: string;
  title: string;
  intro: string;
  forTitle: string;
  forItems: Array<{ title: string; body: string }>;
  reviewItems: string[];
  processSteps: string[];
  faqs: FAQItem[];
  formHeading: string;
  formSubheading: string;
  /** Optional override for the "Related pages" cards. Defaults to the shared set below. */
  relatedLinks?: Array<{ href: string; label: string; body: string }>;
}

const defaultRelatedLinks: Array<{ href: string; label: string; body: string }> = [
  {
    href: "/health-insurance-spokane",
    label: "Health Insurance Help in Spokane",
    body: "Broader local health insurance guidance for individuals, families, self-employed workers, and people between coverage.",
  },
  {
    href: "/contact",
    label: "Contact Our Spokane Office",
    body: "Reach our Spokane-based team by phone or request a no-cost consultation.",
  },
  {
    href: "/resources",
    label: "Resource Library",
    body: "Browse Medicare and health insurance guides for Spokane-area residents.",
  },
  {
    href: "/medicare-spokane",
    label: "Medicare Help in Spokane",
    body: "Local Medicare guidance for Spokane-area residents who are turning 65 or already on Medicare.",
  },
  {
    href: "/turning-65-medicare-spokane",
    label: "Turning 65 in Spokane",
    body: "Understand Medicare timing and next steps as you approach age 65.",
  },
  {
    href: "/working-past-65-medicare",
    label: "Working Past 65 & Medicare",
    body: "Review how employer coverage and Medicare timing can interact when you keep working.",
  },
];

const healthInsuranceDisclosure =
  "By submitting, you agree to be contacted by a licensed insurance professional about health insurance options. We can help review coverage options, compare costs and coverage, and discuss plans we represent and other available options. Lower costs or approval are not promised.";

export default function FocusedHealthInsuranceLandingPage({
  config,
}: {
  config: FocusedHealthInsurancePageConfig;
}) {
  const relatedLinks = config.relatedLinks ?? defaultRelatedLinks;
  return (
    <>
      <section className="bg-gradient-to-br from-blue-800 to-blue-600 px-4 py-16 text-white landscape-mobile:py-5">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-blue-200 landscape-mobile:mb-2">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/resources" className="hover:text-white">
              Resources
            </Link>
            <span className="mx-2">/</span>
            <span>{config.title}</span>
          </nav>
          <div className="max-w-4xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-100 landscape-mobile:mb-1">
              {config.eyebrow}
            </p>
            <h1 className="mb-4 text-4xl font-extrabold leading-tight landscape-mobile:mb-2 landscape-mobile:text-2xl landscape-mobile:leading-snug md:text-5xl">
              {config.title}
            </h1>
            <p className="max-w-3xl text-xl text-blue-100 landscape-mobile:text-base">{config.intro}</p>
            <div className="mt-8 flex flex-col gap-4 landscape-mobile:mt-4 landscape-mobile:flex-row landscape-mobile:gap-3 sm:flex-row">
              <a
                href={telHref}
                className="inline-flex items-center justify-center rounded-lg bg-white px-7 py-3 text-lg font-semibold text-blue-800 transition-colors hover:bg-blue-50 landscape-mobile:px-5 landscape-mobile:py-2 landscape-mobile:text-base"
              >
                Call 509-353-0476
              </a>
              <Link
                href={`#${config.slug}-form`}
                className="inline-flex items-center justify-center rounded-lg border border-blue-300 bg-blue-900 px-7 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-950 landscape-mobile:px-5 landscape-mobile:py-2 landscape-mobile:text-base"
              >
                Request Health Insurance Help
              </Link>
            </div>
            <p className="mt-5 text-base font-semibold text-blue-50 landscape-mobile:mt-2 landscape-mobile:text-sm">
              Local guidance. No-cost consultation. Clear explanations.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900">{config.forTitle}</h2>
            <p className="mt-3 text-lg leading-relaxed text-gray-700">
              We help Spokane-area residents review coverage options before Medicare. A local licensed agent can help
              you compare costs and coverage, provider access, prescriptions, and enrollment timing for plans we
              represent and other available options.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {config.forItems.map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-700">{item.body}</p>
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
              We focus on the practical details that can affect your household, providers, prescriptions, and budget.
            </p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {config.reviewItems.map((item) => (
                <li key={item} className="flex items-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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

          <aside className="rounded-3xl border-2 border-blue-200 bg-blue-50 p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Turning 65 or already on Medicare? Your options are different.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-800">
              Medicare-specific coverage has different enrollment rules, plan types, and timing. Use these Medicare
              pages if you are approaching age 65 or already enrolled in Medicare.
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
                {siteConfig.legalName} is a Spokane-based licensed independent insurance agency helping local residents
                review health insurance and Medicare coverage questions separately.
              </p>
              <p>Our Spokane office is located inside the Providence Medical Building.</p>
              <p>We offer both in-person and phone consultations for Spokane-area residents.</p>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900">How the process works</h2>
            <ol className="mt-8 space-y-4">
              {config.processSteps.map((step, index) => (
                <li key={step} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
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

      <section className="border-y border-slate-100 bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-3xl" id={`${config.slug}-form`}>
          <LeadForm
            source={config.source}
            heading={config.formHeading}
            subheading={config.formSubheading}
            showMessage
            submitLabel="Request Health Insurance Help"
            successBody="A licensed local agent will review your information and contact you soon. We typically respond the same business day during business hours."
            zipHelperText="Optional, but helpful because available health insurance options can vary by ZIP code."
            disclosureText={healthInsuranceDisclosure}
          />
        </div>
      </section>

      <FAQ items={config.faqs} heading="Health Insurance Help FAQ" />

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900">Related pages</h2>
            <p className="mt-3 text-lg text-gray-600">These pages keep Medicare-specific guidance separate.</p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {relatedLinks.map((item) => (
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
