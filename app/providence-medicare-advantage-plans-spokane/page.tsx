import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import Disclaimer from "@/components/Disclaimer";
import FAQ, { type FAQItem } from "@/components/FAQ";
import KnowledgePageEnhancements from "@/components/KnowledgePageEnhancements";
import MedicarePlanNavigation from "@/components/MedicarePlanNavigation";
import {
  getProviderNetworkEntriesForSystem,
  getProviderNetworkSource,
  PROVIDENCE_CHECKED_AT,
  PROVIDENCE_CHECKED_LABEL,
  PROVIDER_NETWORK_GUIDE_PATH,
} from "@/lib/providerNetworks";
import { siteConfig, telHref } from "@/lib/site";

const pagePath = "/providence-medicare-advantage-plans-spokane";
const pageUrl = `${siteConfig.url}${pagePath}`;
const title = "Providence Medicare Advantage Plans in Spokane for 2027";
const description = "Which Medicare Advantage plans does Providence accept in Spokane in 2027? Check Aetna PPO, the UHC Dual SNP exception, and options if your plan is ending.";
const reviewPath = "/medicare-plan-review-spokane#cms-article-help";
const linkClass = "font-semibold text-blue-800 underline decoration-blue-300 underline-offset-4 hover:decoration-blue-800";
const crumbs = [
  { name: "Home", path: "/" },
  { name: "Resources", path: "/resources" },
  { name: "Provider Networks", path: PROVIDER_NETWORK_GUIDE_PATH },
  { name: "Providence", path: pagePath },
];

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: pageUrl },
  openGraph: { title, description, url: pageUrl, type: "article", modifiedTime: PROVIDENCE_CHECKED_AT },
  twitter: { card: "summary", title, description },
};

const entries = getProviderNetworkEntriesForSystem("providence-spokane");
const priorityIds = ["providence-aetna", "providence-uhc", "providence-providence-plan", "providence-asuris"];
const priorityPlans = priorityIds.flatMap((id) => entries.filter((entry) => entry.id === id));
const otherPlans = entries.filter((entry) =>
  !priorityIds.includes(entry.id) && (entry.status === "listed" || entry.status === "limited")
);

const faqs: FAQItem[] = [
  {
    question: "Can I see my current Providence doctor with an Aetna Medicare PPO?",
    answer: "Check the doctor’s name and office address in Aetna’s directory for your exact 2027 PPO, then call the office to confirm. If you need a new primary-care doctor, Providence says it is currently unable to accept new primary-care patients with Medicare PPO plans.",
  },
  {
    question: "How can I tell whether my UnitedHealthcare plan is the Dual SNP exception?",
    answer: "Look for “D-SNP” or “Dual Eligible Special Needs Plan” in your plan documents. A Chronic Special Needs Plan (C-SNP) is affected by the January 1, 2027 network change. If you are unsure, call the member services number on your card and ask about your plan and your Providence providers.",
  },
  {
    question: "Can I still use Sacred Heart or Holy Family if my Providence insurance plan ends?",
    answer: "Providence Health Assurance coverage ends December 31, 2026. You can still receive in-network care at Providence Sacred Heart Medical Center or Providence Holy Family Hospital if your replacement plan includes the hospital. Check your specialists and their office locations separately.",
  },
  {
    question: "Does Providence list SCAN or PacificSource Medicare Advantage in Spokane for 2027?",
    answer: "Neither appears on Providence’s 2027 Eastern Washington list. If you have one of these plans, confirm the specific Spokane location with the carrier and the provider before scheduling care.",
  },
];

export default function ProvidenceMedicareAdvantagePlansSpokanePage() {
  return (
    <>
      <BreadcrumbSchema items={crumbs} />
      <header className="border-b-4 border-teal-500 bg-linear-to-br from-blue-950 via-blue-900 to-blue-800 px-5 py-8 text-white sm:py-12">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-blue-100">
              {crumbs.map((crumb, index) => (
                <li key={crumb.path} className="flex items-center gap-2">
                  {index > 0 && <span aria-hidden="true">/</span>}
                  {crumb.path === pagePath ? <span aria-current="page">{crumb.name}</span> : <Link href={crumb.path} className="hover:underline">{crumb.name}</Link>}
                </li>
              ))}
            </ol>
          </nav>
          <div className="mt-6 grid gap-7 lg:grid-cols-[1.7fr_1fr] lg:items-center lg:gap-14">
            <div>
              <p className="font-semibold text-teal-200">2027 coverage · Spokane County</p>
              <h1 className="mt-2 max-w-3xl text-3xl font-extrabold leading-tight sm:text-5xl">Medicare Advantage plans accepted by Providence in Spokane</h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-blue-50">If you want to keep your Providence doctor, start with the name on your insurance card. Several Spokane plans change on January 1, 2027.</p>
            </div>
            <aside className="rounded-2xl bg-white p-5 text-slate-900 shadow-md sm:p-6">
              <h2 className="text-xl font-bold">Need help keeping your doctors?</h2>
              <p className="mt-2 leading-relaxed">A local licensed agent can check your doctors and prescriptions against the plans we represent at no cost to you.</p>
              <Link href={reviewPath} className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-blue-700 px-4 py-3 text-center font-bold text-white hover:bg-blue-800">Get help comparing plans</Link>
              <a href={telHref} className={`mt-1 flex min-h-11 items-center justify-center ${linkClass}`}>Call {siteConfig.phone}</a>
            </aside>
          </div>
        </div>
      </header>

      <section aria-labelledby="plan-changes" className="bg-white px-5 py-10 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-medium text-slate-600">Reviewed <time dateTime={PROVIDENCE_CHECKED_AT}>{PROVIDENCE_CHECKED_LABEL}</time></p>
          <h2 id="plan-changes" className="mt-2 text-3xl font-bold text-slate-950">What changes for my plan?</h2>
          <ul className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-300">
            {priorityPlans.map((plan) => (
              <li key={plan.id} className="grid gap-2 px-5 py-5 sm:grid-cols-[1fr_1.6fr] sm:gap-8 sm:px-7">
                <h3 className="text-xl font-bold text-slate-950">{plan.carrier}</h3>
                <div>
                  <p className={`border-l-4 pl-3 text-lg font-bold ${plan.status === "discontinued" ? "border-amber-500 text-amber-950" : "border-teal-600 text-teal-950"}`}>{plan.productScope}</p>
                  <p className="mt-2 leading-relaxed text-slate-700">{plan.detail}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-x-7 gap-y-3">
            <Link href="/unitedhealthcare-providence-medicare-advantage-2027-spokane" className={linkClass}>UHC network change details</Link>
            <Link href="/providence-health-plan-ending-2027-washington" className={linkClass}>Providence plan nonrenewal details</Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="other-plans" className="border-y border-slate-200 bg-slate-50 px-5 py-10 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <h2 id="other-plans" className="text-3xl font-bold text-slate-950">Other plans on Providence’s 2027 list</h2>
          <p className="mt-3 max-w-3xl text-lg leading-relaxed text-slate-700">Providence lists these plans for Eastern Washington. Check availability in your ZIP code and confirm your doctor, clinic and hospital with the plan.</p>
          <dl className="mt-6 grid gap-x-10 sm:grid-cols-2">
            {otherPlans.map((plan) => (
              <div key={plan.id} className="border-t border-slate-300 py-4">
                <dt className="text-lg font-bold text-slate-900">{plan.carrier}</dt>
                <dd className="mt-1 text-slate-700">{plan.productScope}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 max-w-3xl leading-relaxed text-slate-700">A D-SNP serves people who qualify for both Medicare and Medicaid. A C-SNP serves people with certain chronic conditions.</p>
        </div>
      </section>

      <FAQ heading="Questions about Providence Medicare coverage in Spokane" items={faqs} />

      <section aria-labelledby="verify-plan" className="bg-white px-5 py-10">
        <div className="mx-auto max-w-5xl">
          <h2 id="verify-plan" className="text-2xl font-bold text-slate-950">Check your plan before you enroll</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-slate-700">Have your plan name, doctor’s name and clinic address handy. Ask the carrier, “Is this doctor at this address in my network for 2027?” Then call the clinic to confirm it can see you under that plan.</p>
          <p className="mt-4"><Link href={reviewPath} className={linkClass}>Request a no-cost plan review</Link> or call <a href={telHref} className={linkClass}>{siteConfig.phone}</a>.</p>
          <h3 className="mt-8 font-bold text-slate-900">Provider and insurer sources</h3>
          <ul className="mt-2 space-y-2">
            {["providence-washington-medicare", "aetna-provider-directory", "providence-uhc-washington", "uhc-providence-2027", "providence-plan-exit", "asuris-spokane-exit"].map((id) => {
              const source = getProviderNetworkSource(id);
              return source && <li key={id}><a href={source.url} className={linkClass}>{source.publisher} · {source.title}</a></li>;
            })}
          </ul>
          <div className="mt-8"><Disclaimer /></div>
        </div>
      </section>
      <MedicarePlanNavigation currentPath={pagePath} />
      <KnowledgePageEnhancements currentPath={pagePath} />
    </>
  );
}
