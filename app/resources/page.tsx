import type { Metadata } from "next";
import Link from "next/link";
import CTASection from "@/components/CTASection";
import Disclaimer from "@/components/Disclaimer";
import PageHero from "@/components/PageHero";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Medicare Resources for Spokane Residents",
  description:
    "Helpful Medicare resources for Spokane-area residents — enrollment guides, plan comparisons, frequently asked questions, and links to official Medicare information.",
  alternates: { canonical: `${siteConfig.url}/resources` },
  openGraph: {
    title: "Medicare Resources for Spokane Residents",
    description:
      "Helpful Medicare resources for Spokane-area residents — enrollment guides, plan comparisons, and frequently asked questions.",
    url: `${siteConfig.url}/resources`,
  },
};

interface ResourceLink {
  href: string;
  title: string;
  body: string;
  external?: boolean;
}

const internalResources: ResourceLink[] = [
  {
    href: "/compare-medicare-options",
    title: "Compare Medicare Options",
    body: "A central Spokane landing page for comparing Medicare Advantage, Medicare Supplement, Part D, and supplemental insurance options.",
  },
  {
    href: "/medicare-enrollment-resources",
    title: "Medicare Enrollment Resources",
    body: "Initial Enrollment Period, Annual Enrollment Period, and Special Enrollment Periods explained in plain language.",
  },
  {
    href: "/medicare-faq",
    title: "Medicare FAQ",
    body: "Common Medicare questions we hear from Spokane-area residents — answered without the jargon.",
  },
  {
    href: "/turning-65-medicare-spokane",
    title: "Turning 65 Medicare Help in Spokane",
    body: "A Spokane-focused checklist and FAQ page for people approaching Medicare eligibility and planning their next steps.",
  },
  {
    href: "/medicare-advantage-vs-supplement-spokane",
    title: "Medicare Advantage vs. Medicare Supplement",
    body: "How Medicare Advantage and Medicare Supplement coverage compare so you can review choices that fit your needs.",
  },
  {
    href: "/rx-drug-review",
    title: "RX Drug Review",
    body: "Bring your prescription list and review how the Medicare Advantage and Part D plans we represent may cover your medications.",
  },
  {
    href: "/carriers",
    title: "Carriers We Represent",
    body: "See the carriers we currently work with for Medicare Advantage, Medicare Supplement, and Part D coverage in Spokane.",
  },
  {
    href: "/testimonials",
    title: "Client Testimonials",
    body: "Read what Spokane-area Medicare clients say about working with our local team.",
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
        title="Medicare Resources for Spokane Residents"
        subtitle="Guides, plan comparisons, and trusted links to help you review your Medicare options with confidence."
        crumbs={[{ href: "/", label: "Home" }, { label: "Resources" }]}
      />

      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Local Medicare Guides
          </h2>
          <p className="text-gray-600 max-w-2xl mb-10">
            Helping Spokane-area residents — including Spokane Valley, Liberty Lake, and Cheney —
            navigate Medicare year-round.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {internalResources.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="bg-slate-50 rounded-2xl border border-slate-200 p-6 hover:shadow-md hover:border-blue-300 transition-all group"
              >
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 mb-2 transition-colors">
                  {r.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{r.body}</p>
                <span className="text-blue-700 text-sm font-medium group-hover:underline">
                  Read more →
                </span>
              </Link>
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
