import type { Metadata } from "next";
import CTASection from "@/components/CTASection";
import Disclaimer from "@/components/Disclaimer";
import FAQ, { type FAQItem } from "@/components/FAQ";
import PageHero from "@/components/PageHero";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Medicare FAQ – Common Questions in Spokane",
  description:
    "Answers to common Medicare questions for Spokane-area beneficiaries: eligibility, enrollment, employer coverage, doctors, Part C, Part D, creditable coverage, and more.",
  alternates: { canonical: `${siteConfig.url}/medicare-faq` },
  openGraph: {
    title: "Medicare FAQ – Common Questions in Spokane",
    description:
      "Answers to common Medicare questions for Spokane-area beneficiaries.",
    url: `${siteConfig.url}/medicare-faq`,
  },
};

const faqs: FAQItem[] = [
  {
    question: "When am I eligible to enroll in Medicare?",
    answer:
      "Most people first become eligible during their Initial Enrollment Period — the seven-month window that begins three months before the month you turn 65 and ends three months after. People who qualify due to disability or certain conditions may become eligible earlier.",
  },
  {
    question: "Can a dependent spouse be covered under my Medicare?",
    answer:
      "No. Medicare is individual coverage. Each spouse enrolls on their own once they qualify. We can help coordinate the timing of each spouse’s enrollment.",
  },
  {
    question: "Can I keep my employer (or my spouse’s employer) coverage?",
    answer:
      "Often yes, but it depends on the employer’s size and how the plan coordinates with Medicare. We can review your situation and help you decide whether to delay Medicare Part B, enroll in Part A only, or transition fully to Medicare.",
  },
  {
    question: "Do I need both Part A and Part B?",
    answer:
      "Most people end up with both. Part A (hospital) is usually premium-free if you or your spouse worked enough quarters. Part B (medical) has a monthly premium and may be delayed in some situations without penalty if you have other creditable coverage.",
  },
  {
    question: "Can I keep my doctors after switching to Medicare?",
    answer:
      "It depends on the type of plan you choose. With Original Medicare plus a Medicare Supplement you can generally see any provider in the U.S. who accepts Medicare. Medicare Advantage plans use networks, so we will help you confirm whether your doctors are in-network for the plans we represent.",
  },
  {
    question: "Does Medicare cover nursing home care?",
    answer:
      "Medicare provides limited skilled nursing facility coverage after a qualifying hospital stay, but it does not pay for long-term custodial care. Long-term care is generally covered by long-term care insurance, Medicaid (if eligible), or out-of-pocket.",
  },
  {
    question: "What if I miss my enrollment window?",
    answer:
      "If you miss your Initial Enrollment Period and do not qualify for a Special Enrollment Period, you may have to wait for the General Enrollment Period and may owe a late enrollment penalty. We can help you understand your options.",
  },
  {
    question: "What is Part C?",
    answer:
      "Part C is Medicare Advantage — an alternative way to receive your Medicare benefits through a private insurance carrier approved by Medicare. Most plans bundle Parts A, B, and D plus extra benefits.",
  },
  {
    question: "What is Part D?",
    answer:
      "Part D is the prescription drug benefit. It is offered through standalone Part D plans (often paired with Original Medicare and a Medigap plan) or as part of most Medicare Advantage plans.",
  },
  {
    question: "What is ‘creditable coverage’?",
    answer:
      "Creditable coverage is prescription drug coverage that pays, on average, at least as much as standard Medicare Part D. Maintaining creditable coverage helps you avoid the Part D late enrollment penalty if you delay enrolling in Part D.",
  },
  {
    question: "Are you affiliated with the government?",
    answer:
      "No. Health Insurance Options LLC is a licensed independent insurance agency. We are not affiliated with or endorsed by CMS, Medicare.gov, the Social Security Administration, or HHS.",
  },
];

export default function MedicareFaqPage() {
  return (
    <>
      <PageHero
        title="Medicare FAQ"
        subtitle="Plain-English answers to the questions we hear most often from Spokane-area beneficiaries and their families."
        crumbs={[{ href: "/", label: "Home" }, { label: "Medicare FAQ" }]}
      />

      <FAQ items={faqs} heading="Common Medicare Questions" />

      <section className="py-10 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <Disclaimer />
        </div>
      </section>

      <CTASection
        heading="Have a Question We Did Not Cover?"
        subheading={`Call ${siteConfig.phone} for a no-cost answer from a licensed insurance professional.`}
      />
    </>
  );
}
