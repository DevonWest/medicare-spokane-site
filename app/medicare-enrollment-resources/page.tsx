import type { Metadata } from "next";
import Link from "next/link";
import CTASection from "@/components/CTASection";
import Disclaimer from "@/components/Disclaimer";
import LeadForm from "@/components/LeadForm";
import PageHero from "@/components/PageHero";
import { siteConfig, telHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Medicare Enrollment Resources for Spokane Beneficiaries",
  description:
    "Step-by-step Medicare enrollment resources for Spokane-area beneficiaries — Initial Enrollment Period, Annual Enrollment, Special Enrollment Periods, late enrollment penalties, and how to apply through Social Security.",
  alternates: { canonical: `${siteConfig.url}/medicare-enrollment-resources` },
  openGraph: {
    title: "Medicare Enrollment Resources for Spokane Beneficiaries",
    description:
      "Initial Enrollment, Annual Enrollment, Special Enrollment Periods, and how to apply through Social Security.",
    url: `${siteConfig.url}/medicare-enrollment-resources`,
  },
};

export default function EnrollmentResourcesPage() {
  return (
    <>
      <PageHero
        title="Medicare Enrollment Resources"
        subtitle="When and how to enroll in Medicare in Spokane — without the jargon."
        crumbs={[{ href: "/", label: "Home" }, { label: "Enrollment Resources" }]}
      />

      <section className="py-14 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-gray-800 space-y-8 text-lg leading-relaxed">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Initial Enrollment Period (IEP)</h2>
            <p>
              Most people first become eligible during a seven-month window around their 65th
              birthday — three months before, the month of, and three months after. Enrolling on
              time helps you avoid late enrollment penalties and coverage gaps.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Annual Enrollment Period (AEP)</h2>
            <p>
              <strong>October 15 – December 7 each year.</strong> This is when most current
              beneficiaries can change their Medicare Advantage plan or standalone Part D plan.
              Changes made during AEP take effect January 1.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Medicare Advantage Open Enrollment
            </h2>
            <p>
              <strong>January 1 – March 31.</strong> If you are already enrolled in a Medicare
              Advantage plan, you can switch to a different Medicare Advantage plan or return to
              Original Medicare (and add a standalone Part D plan) once during this window.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Special Enrollment Periods (SEPs)
            </h2>
            <p>
              Certain life events — moving, losing employer coverage, qualifying for Extra Help, and
              others — can open a Special Enrollment Period that lets you enroll in or change a plan
              outside the usual windows. We can help you confirm whether you qualify.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Late enrollment penalties
            </h2>
            <p>
              If you delay Part B or Part D without other creditable coverage, you may owe a late
              enrollment penalty for as long as you have Medicare. Maintaining creditable employer
              or VA coverage often allows you to delay without penalty — but the rules matter, so
              please confirm before assuming.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">How to apply</h2>
            <p>You can apply for Medicare Parts A and B through the Social Security Administration:</p>
            <ul className="list-disc list-outside pl-6 space-y-1 mt-2">
              <li>
                Online at <span className="text-blue-700">ssa.gov</span>
              </li>
              <li>By phone at 1-800-772-1213</li>
              <li>In person at your local Social Security office</li>
            </ul>
            <p className="text-base text-gray-600 mt-3">
              For information on all of your Medicare options, you can also contact Medicare.gov,
              1-800-MEDICARE, or your local State Health Insurance Assistance Program (SHIP).
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Help from a local agent</h2>
            <p>
              {siteConfig.legalName} can help you understand which enrollment period applies to you
              and compare the plans we represent. To get started,{" "}
              <Link href="/contact" className="text-blue-700 underline">
                request a call back
              </Link>{" "}
              or call us at{" "}
              <a href={telHref} className="text-blue-700 underline">
                {siteConfig.phone}
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="py-10 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <Disclaimer />
        </div>
      </section>

      <section className="py-12 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <LeadForm
            source="medicare-enrollment-resources"
            heading="Get Help With Medicare Enrollment"
            subheading="Tell us where you are in the process and a licensed insurance professional will follow up."
            showMessage
          />
        </div>
      </section>

      <CTASection />
    </>
  );
}
