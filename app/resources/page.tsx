import type { Metadata } from "next";
import Link from "next/link";
import CTASection from "@/components/CTASection";
import Disclaimer from "@/components/Disclaimer";
import PageHero from "@/components/PageHero";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Medicare Resource Library for Spokane Residents",
  description:
    "Browse Spokane Medicare guides for turning 65, comparing options, reviewing prescriptions, and finding trusted official Medicare resources.",
  alternates: { canonical: `${siteConfig.url}/resources` },
  openGraph: {
    title: "Medicare Resource Library for Spokane Residents",
    description:
      "Browse Spokane Medicare guides for turning 65, comparing options, reviewing prescriptions, and trusted official resources.",
    url: `${siteConfig.url}/resources`,
  },
};

interface ResourceLink {
  href: string;
  title: string;
  body: string;
  ctaLabel?: string;
  external?: boolean;
}

const resourceSections: Array<{ title: string; intro: string; items: ResourceLink[] }> = [
  {
    title: "Getting Started with Medicare",
    intro:
      "Start with Spokane-focused guides for enrollment timing, comparing plan types, and understanding your first Medicare decisions.",
    items: [
      {
        href: "/turning-65-medicare-spokane",
        title: "Turning 65 in Spokane",
        body: "Use a local checklist to understand enrollment timing, employer coverage questions, and the next steps before Medicare begins.",
        ctaLabel: "Read Guide",
      },
      {
        href: "/compare-medicare-options",
        title: "Compare Medicare Options",
        body: "Review Medicare Advantage, Medicare Supplement, Part D, and related coverage types from the plans we represent.",
        ctaLabel: "Read Guide",
      },
    ],
  },
  {
    title: "Reviewing or Changing Coverage",
    intro:
      "Use these guides when you want help reviewing prescriptions, plan types, and coverage details before you make a change.",
    items: [
      {
        href: "/rx-drug-review",
        title: "Prescription Drug Review",
        body: "Bring your medication list and compare how Medicare Advantage and Part D plans we represent may cover your prescriptions.",
        ctaLabel: "Get Help",
      },
      {
        href: "/medicare-part-d",
        title: "Medicare Part D",
        body: "Learn how standalone prescription drug coverage works, what changes year to year, and what to review before enrolling.",
        ctaLabel: "Read Guide",
      },
    ],
  },
];

const officialResources: ResourceLink[] = [
  {
    href: "https://www.medicare.gov/",
    title: "Medicare.gov",
    body: "The official U.S. government site for Medicare beneficiaries.",
    external: true,
  },
  {
    href: "https://www.insurance.wa.gov/statewide-health-insurance-benefits-advisors-shiba",
    title: "Washington SHIBA (SHIP)",
    body: "Washington State's Statewide Health Insurance Benefits Advisors — free, unbiased Medicare counseling.",
    external: true,
  },
  {
    href: "https://www.ssa.gov/medicare/",
    title: "Social Security Administration",
    body: "Apply for Medicare and learn about enrollment timelines through the Social Security Administration.",
    external: true,
  },
];

export default function ResourcesPage() {
  return (
    <>
      <PageHero
        title="Medicare Resource Library"
        subtitle="Browse local Medicare guides, plan comparisons, and trusted official links to help you review your options with confidence."
        crumbs={[{ href: "/", label: "Home" }, { label: "Resources" }]}
      />

      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Local Medicare Guides
          </h2>
          <p className="text-gray-600 max-w-2xl mb-10">
            Helping Spokane-area residents review Medicare with large-text, easy-to-scan guides and
            clear next steps.
          </p>
          <div className="space-y-12">
            {resourceSections.map((section) => (
              <section key={section.title}>
                <div className="max-w-3xl">
                  <h3 className="text-2xl font-bold text-gray-900">{section.title}</h3>
                  <p className="mt-3 text-lg leading-relaxed text-gray-600">{section.intro}</p>
                </div>
                <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                  {section.items.map((resource) => (
                    <Link
                      key={resource.href}
                      href={resource.href}
                      className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 transition-all hover:border-blue-300 hover:shadow-md"
                    >
                      <h4 className="text-xl font-semibold text-gray-900 transition-colors group-hover:text-blue-700">
                        {resource.title}
                      </h4>
                      <p className="mt-3 text-base leading-relaxed text-gray-700">{resource.body}</p>
                      <span className="mt-5 inline-block text-sm font-medium text-blue-700 group-hover:underline">
                        {resource.ctaLabel ?? "Read Guide"} →
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Official Medicare &amp; Government Resources
          </h2>
          <p className="text-gray-600 max-w-2xl mb-10">
            Independent guidance starts with reliable information. These official resources can help
            you compare options and understand your rights.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {officialResources.map((r) => (
              <a
                key={r.href}
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all group"
              >
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 mb-2 transition-colors">
                  {r.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{r.body}</p>
                <span className="text-blue-700 text-sm font-medium group-hover:underline">
                  Visit site ↗
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <Disclaimer />
        </div>
      </section>

      <CTASection
        heading="Have a Medicare Question?"
        subheading="Talk with a local licensed insurance professional in Spokane — no cost, no pressure."
      />
    </>
  );
}
