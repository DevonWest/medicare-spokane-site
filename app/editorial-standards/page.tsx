import type { Metadata } from "next";
import Disclaimer from "@/components/Disclaimer";
import PageHero from "@/components/PageHero";
import { siteConfig } from "@/lib/site";

const pageUrl = `${siteConfig.url}${siteConfig.editorialStandardsPath}`;
const policyDate = "2026-07-30";

export const metadata: Metadata = {
  title: "Editorial Standards | Medicare in Spokane",
  description:
    "Learn how Medicare in Spokane researches, sources, reviews, updates, and corrects its educational Medicare and health insurance pages.",
  alternates: { canonical: pageUrl },
  openGraph: {
    title: "Editorial Standards | Medicare in Spokane",
    description:
      "How Health Insurance Options LLC researches, reviews, updates, and corrects educational information.",
    url: pageUrl,
  },
};

const editorialStandardsSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${pageUrl}#webpage`,
  url: pageUrl,
  name: "Medicare in Spokane Editorial Standards",
  description:
    "How Health Insurance Options LLC researches, sources, reviews, updates, and corrects its educational pages.",
  datePublished: policyDate,
  dateModified: policyDate,
  isPartOf: {
    "@type": "WebSite",
    "@id": `${siteConfig.url}#website`,
    name: siteConfig.name,
    url: siteConfig.url,
  },
  publisher: {
    "@id": `${siteConfig.url}#organization`,
  },
  publishingPrinciples: pageUrl,
};

const sourceGroups = [
  {
    name: "Federal Medicare information",
    examples: "Medicare.gov, the Centers for Medicare & Medicaid Services, and Social Security",
  },
  {
    name: "Washington programs and rules",
    examples:
      "Washington State Health Care Authority, Office of the Insurance Commissioner, and Washington Healthplanfinder",
  },
  {
    name: "Plan-specific information",
    examples:
      "Current carrier materials for the plans our agency represents, used only when a page clearly identifies the scope",
  },
];

export default function EditorialStandardsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(editorialStandardsSchema).replace(/</g, "\\u003c"),
        }}
      />

      <PageHero
        title="How We Research and Review Educational Information"
        subtitle="The standards Health Insurance Options LLC uses for sourcing, accuracy checks, updates, and corrections."
        crumbs={[
          { href: "/", label: "Home" },
          { label: "Editorial Standards" },
        ]}
      />

      <section className="bg-white px-4 py-14">
        <div className="mx-auto max-w-4xl space-y-12 text-base leading-relaxed text-gray-700">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
            <p className="font-semibold text-gray-900">
              Our educational pages are meant to make Medicare and health insurance questions
              easier to understand.
            </p>
            <p className="mt-3">
              They provide general information, not medical, legal, tax, or individualized coverage
              advice. Benefits, costs, eligibility, provider networks, formularies, and enrollment
              rules can change. We encourage readers to confirm decisions with the official program
              or current plan materials that apply to them.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sources we use</h2>
            <p className="mt-3">
              We favor primary public sources for factual claims about Medicare enrollment,
              benefits, penalties, assistance programs, and Washington insurance rules. Where a
              page relies on a source, its reference panel identifies the publisher, direct link,
              and the date the link and information were checked.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {sourceGroups.map((group) => (
                <div
                  key={group.name}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                >
                  <h3 className="font-bold text-gray-900">{group.name}</h3>
                  <p className="mt-2 text-sm">{group.examples}.</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">Writing and accuracy review</h2>
            <div className="mt-4 space-y-4">
              <p>
                Pages are written in plain language and should distinguish general education from
                plan-specific or personal guidance. Important dates, program rules, and eligibility
                statements should be traceable to an official source.
              </p>
              <p>
                A page displays “Reviewed by” only after a named, active licensed insurance agent
                has completed an accuracy review and the agency has verified that person&apos;s
                reviewer record. The page must also carry the review date and a future review due
                date. Being listed on our team page by itself does not create a reviewer claim.
              </p>
              <p>
                Until those checks are recorded, the page may show its official sources but will
                not identify an individual reviewer.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">Update schedule</h2>
            <ul className="mt-4 list-disc space-y-3 pl-6">
              <li>
                Official source links and the facts they support are rechecked within 180 days.
              </li>
              <li>
                Named licensed-agent reviews expire within 365 days, or sooner when a recorded due
                date requires it.
              </li>
              <li>
                Pages should be checked sooner after material Medicare, Social Security,
                Washington, or carrier changes that affect the information presented.
              </li>
              <li>
                An expired source or review record is treated as a publishing error and blocks the
                associated accuracy claim until it is rechecked.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">Corrections</h2>
            <p className="mt-3">
              If you believe a page is inaccurate, unclear, or missing an important qualification,
              email{" "}
              <a
                href={`mailto:${siteConfig.email}?subject=Website%20correction`}
                className="font-semibold text-blue-700 hover:underline"
              >
                {siteConfig.email}
              </a>{" "}
              with the page address and the statement you want us to review. We will compare the
              report with current authoritative information, correct material errors, and update
              the page&apos;s applicable source or review record.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">Independence and scope</h2>
            <p className="mt-3">
              {siteConfig.legalName} is a licensed independent insurance agency. Our educational
              standards apply whether or not a page describes a product or carrier we represent.
              Citations to government or public agencies are references, not endorsements or
              affiliations.
            </p>
          </div>

          <p className="border-t border-slate-200 pt-6 text-sm text-gray-500">
            Policy effective <time dateTime={policyDate}>July 30, 2026</time>.
          </p>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-gray-50 px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <Disclaimer />
        </div>
      </section>
    </>
  );
}
