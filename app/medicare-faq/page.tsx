import type { Metadata } from "next";
import CTASection from "@/components/CTASection";
import Disclaimer from "@/components/Disclaimer";
import FAQ from "@/components/FAQ";
import KnowledgePageEnhancements from "@/components/KnowledgePageEnhancements";
import PageHero from "@/components/PageHero";
import { getKnowledgeFaqsForPath } from "@/lib/knowledgeCenter";
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

const faqs = getKnowledgeFaqsForPath("/medicare-faq");

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

      <KnowledgePageEnhancements
        currentPath="/medicare-faq"
        includeBreadcrumbSchema={false}
      />

      <CTASection
        heading="Have a Question We Did Not Cover?"
        subheading={`Call ${siteConfig.phone} for a no-cost answer from a licensed insurance professional.`}
      />
    </>
  );
}
