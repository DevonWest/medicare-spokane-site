import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import PageHero from "@/components/PageHero";
import { siteConfig, telHref } from "@/lib/site";

const title = "2027 Medicare Costs, Part B Premium and IRMAA Brackets";
const description =
  "Look up the $209.40 standard Part B premium, $292 deductible, Part A hospital costs and 2027 Medicare income brackets. Download a printable guide from our Spokane office.";
const url = `${siteConfig.url}/2027-medicare-costs`;
const cmsSource = "https://www.cms.gov/newsroom/fact-sheets/2027-medicare-parts-b-premiums-deductibles";
const ssaSource = "https://secure.ssa.gov/POMS.NSF/lnx/0601101010";
const linkStyle = "font-semibold text-blue-700 underline underline-offset-2";
const headingStyle = "mb-3 text-2xl font-bold text-slate-950 sm:text-3xl";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "article", publishedTime: "2026-11-20" },
  twitter: { card: "summary_large_image", title, description },
};

const hospitalCosts = [
  ["Inpatient hospital deductible", "$1,776 per benefit period"],
  ["Hospital days 1–60", "$0 daily coinsurance after the deductible"],
  ["Hospital days 61–90", "$444 per day"],
  ["Hospital days beyond day 90", "$888 per lifetime reserve day used"],
  ["Covered skilled nursing facility days 21–100", "$222 per day"],
];

const incomeBrackets = [
  ["$112,000 or less", "$224,000 or less", "$209.40", "$0"],
  ["$112,001–$141,000", "$224,001–$282,000", "$293.10", "$15.40"],
  ["$141,001–$177,000", "$282,001–$354,000", "$418.80", "$39.70"],
  ["$177,001–$212,000", "$354,001–$424,000", "$544.40", "$64.00"],
  ["$212,001–$499,999", "$424,001–$749,999", "$670.00", "$88.30"],
  ["$500,000 or more", "$750,000 or more", "$711.80", "$96.40"],
];

export default function MedicareCostsPage() {
  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Home", path: "/" },
        { name: "Resources", path: "/resources" },
        { name: "2027 Medicare costs" },
      ]} />
      <PageHero
        title="2027 Medicare costs"
        subtitle="The standard Part B premium is $209.40 per month in 2027. The Part B annual deductible is $292, and the Part A hospital deductible is $1,776 per benefit period."
        crumbs={[{ href: "/", label: "Home" }, { href: "/resources", label: "Resources" }, { label: "2027 Medicare costs" }]}
      />
      <article className="mx-auto max-w-4xl space-y-10 px-4 py-10 text-lg leading-relaxed text-slate-800 sm:px-6">
        <div>
          <p className="text-base text-slate-600">Health Insurance Options · <time dateTime="2026-11-20">November 20, 2026</time></p>
          <p className="mt-3">
            These federal amounts apply in Spokane and across the country. If you have Medicare
            Advantage, your plan sets the amount you pay for hospital stays and other covered care.
            If you have Original Medicare with a Medicare Supplement, your policy may pay some of
            the deductibles and coinsurance shown below.
          </p>
          <a href="/guides/2027-medicare-costs.pdf" download className="mt-4 inline-block rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800">
            Download the two-page cost guide (PDF)
          </a>
        </div>

        <section>
          <h2 className={headingStyle}>How much is Medicare Part B in 2027?</h2>
          <p>
            The standard monthly premium rises from $202.90 to <strong>$209.40</strong>. That adds
            $6.50 a month, or $78 over a full year. The annual deductible rises from $283 to
            <strong> $292</strong>. The premium is what you pay to keep Part B each month. The
            deductible is what you pay toward covered services that are subject to it.
          </p>
        </section>

        <section>
          <h2 className={headingStyle}>Part A premiums and hospital costs</h2>
          <p>
            Most people pay no Part A premium. If you buy Part A, the 2027 monthly premium is
            generally $328 with 30–39 quarters of Medicare-covered work and $597 with fewer than
            30 quarters. A spouse’s work record can also count.
          </p>
          <dl className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 px-4">
            {hospitalCosts.map(([service, amount]) => (
              <div key={service} className="grid gap-1 py-3 sm:grid-cols-2 sm:gap-5">
                <dt>{service}</dt>
                <dd className="font-semibold text-slate-950">{amount}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4">
            You can owe the inpatient deductible more than once in a year. A new benefit period
            can begin after 60 days in a row without inpatient hospital care or skilled care in
            a skilled nursing facility.
          </p>
        </section>

        <section>
          <h2 className={headingStyle}>2027 Medicare income brackets for Part B and Part D</h2>
          <p>
            Social Security generally uses your 2025 modified adjusted gross income to determine
            your 2027 income-related monthly adjustment amount (IRMAA). Find your income under
            your tax filing status. The Part B column is the total monthly premium per person.
            Add the Part D amount to your own drug plan’s monthly premium.
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200" role="region" aria-label="2027 Medicare income brackets" tabIndex={0}>
            <table className="w-full text-left text-base tabular-nums">
              <caption className="sr-only">2027 monthly premiums by individual or joint tax return, in whole-dollar income brackets</caption>
              <thead className="bg-blue-900 text-white">
                <tr>
                  {["Individual income", "Joint income", "Part B total", "Part D extra"].map((label) => (
                    <th key={label} scope="col" className="px-2 py-3 sm:px-4">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {incomeBrackets.map(([individual, joint, partB, partD]) => (
                  <tr key={individual} className="odd:bg-slate-50">
                    <th scope="row" className="px-2 py-3 font-normal sm:px-4">{individual}</th>
                    <td className="px-2 py-3 sm:px-4">{joint}</td>
                    <td className="px-2 py-3 font-semibold sm:px-4">{partB}</td>
                    <td className="px-2 py-3 sm:px-4">{partD}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4">
            For example, a single filer with $120,000 in modified adjusted gross income would
            pay $293.10 a month for Part B. With Part D coverage, they would also pay $15.40
            a month in addition to their drug plan premium.
          </p>
          <p className="mt-3">
            <strong>Married filing separately?</strong> If you lived with your spouse at any
            point in the tax year, a different schedule applies. With income above $112,000
            and below $388,000, the Part B total is $670 and the Part D extra is $88.30.
            At $388,000 or more, the amounts are $711.80 and $96.40. At or below $112,000,
            the standard Part B premium applies with no Part D income adjustment.
          </p>
        </section>

        <section>
          <h2 className={headingStyle}>Coverage for anti-rejection drugs after a kidney transplant</h2>
          <p>
            If your full Medicare coverage ends 36 months after a kidney transplant, you may
            qualify for Part B coverage specifically for immunosuppressive drugs. Eligibility
            depends on your other coverage. The standard 2027 premium for this benefit is
            $125.70 per month, with higher premiums at higher incomes.
          </p>
        </section>

        <section className="rounded-xl bg-blue-50 p-5 sm:p-6">
          <h2 className={headingStyle}>Help with Medicare costs in Spokane</h2>
          <p>
            If the Part B premium is hard to fit into your budget, our{" "}
            <Link href="/medicare-savings-program-extra-help-washington" className={linkStyle}>Washington guide to Medicare Savings Programs and Extra Help</Link>{" "}
            explains where to apply. For questions about how these amounts fit with your own
            coverage, call our Spokane office at <a href={telHref} className={linkStyle}>{siteConfig.phone}</a>.
          </p>
        </section>

        <section className="border-t border-slate-200 pt-5 text-base">
          <h2 className="mb-2 text-xl font-bold text-slate-950">Official sources</h2>
          <ul className="space-y-2">
            <li><a href={cmsSource} className={linkStyle}>CMS 2027 Medicare premiums, deductibles and income tables</a> · November 17, 2026</li>
            <li><a href={ssaSource} className={linkStyle}>Social Security’s income rules for Medicare premiums</a></li>
            <li><a href="https://www.medicare.gov/basics/costs/medicare-costs" className={linkStyle}>Medicare.gov guide to benefit periods and coverage costs</a></li>
          </ul>
        </section>
      </article>
    </>
  );
}
