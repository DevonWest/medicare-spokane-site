import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import Disclaimer from "@/components/Disclaimer";
import FAQ, { type FAQItem } from "@/components/FAQ";
import LeadForm from "@/components/LeadForm";
import PageHero from "@/components/PageHero";
import { siteConfig, telHref } from "@/lib/site";

const path = "/medicare-stevens-county";
const title = "Medicare Plans in Stevens County, WA | Colville & Chewelah";
const description = "Compare Medicare Advantage, Supplement, and Part D options in Stevens County. Local care, Spokane specialists, pharmacy access, and no-cost guidance.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${siteConfig.url}${path}` },
  openGraph: { title, description, url: `${siteConfig.url}${path}`, type: "website" },
};

const faqs: FAQItem[] = [
  {
    question: "Can I enroll in a Spokane Medicare Advantage plan if I live in Stevens County?",
    answer: "Only if the plan’s service area includes your permanent home address and you meet its other eligibility requirements. Receiving care in Spokane does not make you a Spokane County resident for enrollment. Check the county and ZIP code tied to your home before comparing plans.",
  },
  {
    question: "Can I keep doctors in Colville or Chewelah and see specialists in Spokane?",
    answer: "That depends on your coverage and the exact providers. For Medicare Advantage, check each local provider, Spokane specialist, facility, and referral rule with the plan and provider. With Original Medicare, confirm Medicare acceptance. Do not assume that all locations in one health system share the same plan contracts.",
  },
  {
    question: "Does a Medicare Supplement include Part D drug coverage?",
    answer: "Medigap policies sold after 2005 do not include prescription drug coverage. People choosing Original Medicare and a new Supplement policy can consider a separate Part D plan, taking any other creditable drug coverage into account.",
  },
  {
    question: "Do I need to travel to Spokane for a Medicare review?",
    answer: "Our office is in Spokane, and we also offer phone or remote consultations. Tell us your home county, what you want to review, and how you prefer to meet. Consultations are at no cost; we compare plans from the organizations we represent.",
  },
];

export default function StevensCountyMedicarePage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: "Home", path: "/" }, { name: "Medicare plans in Spokane", path: "/medicare-spokane" }, { name: "Stevens County Medicare plans" }]} />
      <PageHero
        title="Medicare Plans in Stevens County, Washington"
        subtitle="Medicare Advantage, Medicare Supplement, and Part D guidance for Colville, Chewelah, Kettle Falls, and nearby communities, with phone or remote help from our Spokane team."
        crumbs={[{ href: "/", label: "Home" }, { href: "/medicare-spokane", label: "Medicare Plans" }, { label: "Stevens County" }]}
      />
      <article className="bg-white px-4 py-12">
        <div className="mx-auto max-w-4xl space-y-6 text-lg leading-relaxed text-gray-700">
          <p className="text-sm text-gray-600">Published September 5, 2026 · Health Insurance Options LLC</p>
          <p>
            If you live in Stevens County and receive some of your care in Spokane, compare coverage around both places.
            Your home address determines which Medicare Advantage service areas you can use; your doctors and pharmacies determine how useful a particular plan will be.
            A plan advertised for Spokane County may not be available at your Stevens County address.
          </p>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
            <h2 className="text-2xl font-bold text-gray-900">Start with your home county and your care routine</h2>
            <p className="mt-3">Have your permanent address, current plan name, local doctors, Spokane specialists, and preferred pharmacy ready. If your mailing address is near a county boundary, confirm the actual county instead of relying on the city name alone.</p>
            <a href={telHref} className="mt-4 inline-block font-semibold text-blue-800 underline">Call {siteConfig.phone} for a no-cost review</a>
          </div>

          <h2 className="pt-4 text-3xl font-bold text-gray-900">Medicare Advantage plans in Stevens County</h2>
          <p>
            Medicare Advantage provides Part A and Part B benefits through a private plan, and most plans include prescription drugs.
            Compare the exact plan’s network, referral and authorization rules, copays, and annual limit for covered medical out-of-pocket costs.
            You continue paying your Part B premium. A low additional premium alone does not show the total cost of using care.
          </p>
          <p>
            Build a provider list that includes local care such as <a href="https://www.providence.org/locations/wa/mount-carmel-hospital" className="text-blue-800 underline">Providence Mount Carmel Hospital in Colville</a> or <a href="https://www.providence.org/locations/wa/st-josephs-hospital" className="text-blue-800 underline">Providence St. Joseph’s Hospital in Chewelah</a> if you use them, along with every Spokane specialist and imaging location.
            These are examples of facilities to check, not a statement that a particular plan includes them.
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Ask the plan and provider about the full plan name and the coming coverage year.</li>
            <li>Check whether routine out-of-network visits are covered and what they cost.</li>
            <li>Include the physician group as well as the hospital or clinic location.</li>
            <li>If transportation is important, review any plan benefit’s actual trip limits and eligibility rather than assuming rides are included.</li>
          </ul>
          <p><Link href="/medicare-advantage" className="font-semibold text-blue-800 underline">Read the Medicare Advantage plan guide</Link> and use our <Link href="/spokane-medicare-provider-networks" className="font-semibold text-blue-800 underline">Spokane provider-network resources</Link> when checking care across counties.</p>

          <h2 className="pt-4 text-3xl font-bold text-gray-900">Medicare Supplement plans and travel for care</h2>
          <p>
            Medicare Supplement insurance, also called Medigap, helps pay certain costs left by Original Medicare.
            With Original Medicare, you can generally use providers nationwide who accept Medicare. Confirm acceptance and appointment availability with each provider.
            Compare the plan letter, premium, costs you still pay, and your enrollment rights before choosing a policy.
          </p>
          <p>
            Fall Annual Enrollment is not a general guaranteed right to buy any Medigap policy. Washington has its own switching protections, and moving from Medicare Advantage to a Supplement requires a separate eligibility review.
            Confirm that the new coverage is available to you and when it starts before ending existing coverage.
            New Medigap policies do not include prescription drugs.
          </p>
          <p><Link href="/medicare-supplements" className="font-semibold text-blue-800 underline">Compare Medicare Supplement options, including Plan G and Plan N</Link>, or review <Link href="/medicare-advantage-vs-supplement-spokane" className="font-semibold text-blue-800 underline">Medicare Advantage versus Medigap</Link>.</p>

          <h2 className="pt-4 text-3xl font-bold text-gray-900">Medicare Part D plans and pharmacy access</h2>
          <p>
            For a standalone Part D plan or drug coverage within Medicare Advantage, compare every prescription by name, strength, quantity, and refill schedule.
            Ask whether the pharmacy you actually use is in network and preferred for the exact plan.
            A lower estimate at a distant pharmacy may be less practical if you need frequent refills or reliable access close to home.
          </p>
          <p>
            Compare a nearby pharmacy, any pharmacy you use during Spokane visits, and mail-order options if appropriate.
            Review premiums plus expected drug costs over the whole year, along with prior authorization, quantity limits, and other coverage rules.
            Recheck this information each year even if your medication list has not changed.
          </p>
          <p><Link href="/medicare-part-d" className="font-semibold text-blue-800 underline">Explore Medicare Part D plans</Link> and prepare with our <Link href="/rx-drug-review" className="font-semibold text-blue-800 underline">prescription review checklist</Link>.</p>

          <h2 className="pt-4 text-3xl font-bold text-gray-900">Prepare for Annual Enrollment from home</h2>
          <p>
            Medicare Annual Enrollment runs October 15–December 7. Permitted changes to Medicare Advantage and Part D coverage take effect January 1 of the following year when the plan receives your request by the deadline.
            Review your Annual Notice of Change and the new year’s plan documents. You do not have to switch if your current coverage continues to fit.
          </p>
          <p>
            Our office is at {siteConfig.address.streetAddress} in Spokane. We also offer phone and remote consultations for Stevens County residents.
            Use the <Link href="/medicare-annual-enrollment-spokane" className="font-semibold text-blue-800 underline">AEP preparation guide</Link> to gather what you need before a conversation.
          </p>
          <p>
            Live in nearby Pend Oreille, Ferry, or Lincoln County? Tell us your county when requesting help so we can check the plans we represent at your address.
            If you live in <Link href="/medicare-deer-park" className="text-blue-800 underline">Deer Park</Link>, <Link href="/medicare-mead" className="text-blue-800 underline">Mead</Link>, or <Link href="/medicare-spokane-valley" className="text-blue-800 underline">Spokane Valley</Link>, our existing community guides can help you start.
          </p>

          <section className="border-t border-gray-200 pt-6" aria-labelledby="stevens-sources-heading">
            <h2 id="stevens-sources-heading" className="text-2xl font-bold text-gray-900">Official sources and plan lookup</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-base">
              <li><a href="https://www.medicare.gov/plan-compare/" className="text-blue-800 underline">Medicare.gov Plan Compare</a> — search the options available at your address.</li>
              <li><a href="https://www.medicare.gov/basics/get-started-with-medicare/get-more-coverage/your-coverage-options/compare-original-medicare-medicare-advantage" className="text-blue-800 underline">Medicare.gov: Original Medicare and Medicare Advantage</a>.</li>
              <li><a href="https://www.medicare.gov/health-drug-plans/medigap/basics/coverage" className="text-blue-800 underline">Medicare.gov: what Medigap covers</a>.</li>
              <li><a href="https://www.medicare.gov/health-drug-plans/open-enrollment" className="text-blue-800 underline">Medicare.gov: Open Enrollment dates and choices</a>.</li>
              <li><a href="https://www.insurance.wa.gov/insurance-resources/medicare/health-and-drug-plans/medigap-medicare-supplement-plan-coverage-and-costs" className="text-blue-800 underline">Washington OIC: Medigap coverage, costs, and switching rules</a>.</li>
            </ul>
          </section>
          <Disclaimer />
        </div>
      </article>
      <FAQ items={faqs} heading="Stevens County Medicare questions" />
      <section className="border-t border-blue-100 bg-blue-50 px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <LeadForm source="medicare-stevens-county" heading="Request a Stevens County Medicare Review" subheading="Tell us how to reach you and your ZIP code. Our Spokane team can help by phone or remotely with the plans we represent." showMessage />
        </div>
      </section>
    </>
  );
}
