import type { Metadata } from "next";
import Link from "next/link";
import CTASection from "@/components/CTASection";
import Disclaimer from "@/components/Disclaimer";
import LeadForm from "@/components/LeadForm";
import PageHero from "@/components/PageHero";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Our Team – Local Spokane Medicare Agents",
  description:
    "Meet the local Spokane Medicare team at Health Insurance Options LLC. Over 40 years of combined Medicare-related insurance experience, helping clients compare options at no cost.",
  alternates: { canonical: `${siteConfig.url}/about` },
  openGraph: {
    title: "Our Team – Local Spokane Medicare Agents",
    description:
      "Meet the local Spokane Medicare team at Health Insurance Options LLC. Over 40 years of combined experience.",
    url: `${siteConfig.url}/about`,
  },
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="Local Spokane Medicare Help"
        subtitle={`${siteConfig.legalName} is a locally grown team of licensed insurance professionals based in Spokane, Washington. ${siteConfig.positioning}`}
        crumbs={[{ href: "/", label: "Home" }, { label: "Our Team" }]}
      />

      <section className="py-14 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-gray-800 space-y-6 leading-relaxed text-lg">
          <h2 className="text-2xl font-bold text-gray-900">Who we are</h2>
          <p>
            We are {siteConfig.agencyDescriptor} headquartered in Spokane, WA. Our agents are
            handpicked from the Spokane area, which means the people you talk to live and work in
            the same communities we serve — Spokane, Spokane Valley, Liberty Lake, Cheney, Airway
            Heights, Medical Lake, Mead, Deer Park, and surrounding Eastern Washington.
          </p>
          <p>
            <strong>
              Our team has over 40 years of combined Medicare-related insurance experience
            </strong>
            , and we specialize in making Medicare easier to understand. Whether you are turning
            65, retiring, moving onto Medicare from employer coverage, or reviewing your current
            plan, we can help you compare the options we represent at no cost.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4">How we work with you</h2>
          <ul className="list-disc list-outside pl-6 space-y-2">
            <li>
              <strong>No-cost consultation</strong> with a licensed insurance professional — in our
              Spokane office, by phone, or by video.
            </li>
            <li>
              We take the time to <strong>understand your doctors, prescriptions, and budget</strong>{" "}
              before recommending anything.
            </li>
            <li>
              We <strong>compare the plans we represent</strong> across Medicare Advantage, Medicare
              Supplement, Part D, and supplemental products to help you find a plan that fits your
              needs.
            </li>
            <li>
              We stay available <strong>year-round</strong> for billing questions, plan changes,
              and Annual Enrollment reviews.
            </li>
            <li>
              We are happy to talk with the Medicare beneficiary, an adult child, or another
              caregiver and will go at the pace you need.
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 pt-4">Independent and local</h2>
          <p>
            {siteConfig.legalName} is independent. We are not affiliated with the U.S. Centers for
            Medicare &amp; Medicaid Services (CMS), Medicare.gov, the Social Security
            Administration, or the U.S. Department of Health and Human Services (HHS). Our help is
            free because we are paid by the insurance carriers we represent — your monthly premium
            is the same whether you enroll on your own or work with us.
          </p>

          <p className="text-base text-gray-600">
            Want to meet the team?{" "}
            <Link href="/contact" className="text-blue-700 underline">
              Visit our office or call us
            </Link>
            , or{" "}
            <Link href="/request-contact" className="text-blue-700 underline">
              request a call back
            </Link>{" "}
            at a time that works for you.
          </p>
        </div>
      </section>

      <section className="py-12 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <Disclaimer />
        </div>
      </section>

      <section className="py-12 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <LeadForm
            source="about"
            heading="Talk With Our Team"
            subheading="Tell us a little about your situation and a licensed insurance professional will reach out."
            showMessage
          />
        </div>
      </section>

      <CTASection />
    </>
  );
}
