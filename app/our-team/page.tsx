import type { Metadata } from "next";
import CTASection from "@/components/CTASection";
import Disclaimer from "@/components/Disclaimer";
import PageHero from "@/components/PageHero";
import TeamSection from "@/components/TeamSection";
import { siteConfig } from "@/lib/site";
import { getActiveTeamMembers } from "@/lib/team";

export const metadata: Metadata = {
  title: "Meet Our Spokane Medicare Team | Health Insurance Options",
  description:
    "Meet the local licensed insurance professionals at Health Insurance Options LLC who help Spokane-area residents compare Medicare Advantage, Medicare Supplement, Part D, and supplemental insurance options.",
  alternates: { canonical: `${siteConfig.url}/our-team` },
  openGraph: {
    title: "Meet Our Spokane Medicare Team | Health Insurance Options",
    description:
      "Meet the local licensed insurance professionals at Health Insurance Options LLC who help Spokane-area residents compare Medicare Advantage, Medicare Supplement, Part D, and supplemental insurance options.",
    url: `${siteConfig.url}/our-team`,
  },
};

const teamSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Health Insurance Options LLC — Medicare Team",
  itemListElement: getActiveTeamMembers().map((member, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "Person",
      name: member.name,
      jobTitle: member.title,
      worksFor: {
        "@type": "InsuranceAgency",
        name: siteConfig.legalName,
        url: siteConfig.url,
      },
      image: member.image ? `${siteConfig.url}${member.image}` : undefined,
      ...(member.email ? { email: member.email } : {}),
      ...(member.phone ? { telephone: member.phone } : {}),
    },
  })),
};

export default function OurTeamPage() {
  const members = getActiveTeamMembers();

  return (
    <>
      {/* Person schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(teamSchema) }}
      />

      <PageHero
        title="Meet Your Local Medicare Team in Spokane"
        subtitle="Licensed insurance professionals helping Spokane-area residents compare Medicare options — at no cost."
        crumbs={[{ href: "/", label: "Home" }, { label: "Our Team" }]}
      />

      {/* Intro */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-lg text-gray-700 leading-relaxed space-y-5">
          <p>
            {siteConfig.legalName} is a locally owned, licensed independent insurance agency based
            in Spokane, WA. Our team of licensed insurance professionals is dedicated to helping
            Spokane-area residents understand and compare Medicare options — including Medicare
            Advantage, Medicare Supplement, Medicare Part D, and supplemental insurance — with
            friendly, no-pressure guidance.
          </p>
          <p>
            Every member of our team lives and works in the Spokane community. When you call us, you
            are talking to a neighbor who knows the local healthcare landscape, the area&apos;s
            carrier networks, and what matters most to people here. We offer no-cost consultations
            and stay available year-round — not just during enrollment season.
          </p>
          <p>
            Our team has over{" "}
            <strong className="text-gray-900">
              40 years of combined Medicare-related insurance experience
            </strong>
            . Whether you are turning 65, retiring, moving off an employer plan, or simply reviewing
            your current coverage, we are here to help you review plan choices and find coverage
            that fits your needs.
          </p>
        </div>
      </section>

      {/* Team grid */}
      <section className="py-14 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-3">Our Licensed Team</h2>
          <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
            Our Spokane team includes licensed insurance agents and office coordinators who help
            local clients compare options and stay connected year-round.
          </p>
          <TeamSection members={members} showContactCTA />
        </div>
      </section>

      {/* Why local guidance matters */}
      <section className="py-14 px-4 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Why Local Medicare Guidance Matters
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                title: "We know your area's plans",
                body:
                  "Plan availability, networks, and benefits vary by county. Our team works specifically in Spokane County and Eastern Washington, so we know which plans are available here and how they compare.",
              },
              {
                title: "Your doctors and pharmacies matter",
                body:
                  "We help you review whether your current providers are in-network on the plans we represent — so you are not surprised after you enroll.",
              },
              {
                title: "Prescription review at no cost",
                body:
                  "Bring your medication list. We can help you compare how Medicare Advantage and Part D plans we represent would cover your drugs, including preferred pharmacies and estimated costs.",
              },
              {
                title: "Available year-round",
                body:
                  "Medicare questions don't only come up in October. Our team is available Monday through Friday, year-round, for plan changes, billing questions, and Annual Enrollment reviews.",
              },
              {
                title: "No-cost, no-obligation",
                body:
                  "Our consultations are always free. We are paid by the insurance carriers we represent — your premium is the same whether you enroll through us or on your own.",
              },
              {
                title: "Independent and unbiased",
                body:
                  "We are not affiliated with any government Medicare program. We represent multiple carriers so we can help you compare options rather than push a single plan.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-blue-50 rounded-xl p-6 border border-blue-100"
              >
                <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
                <p className="text-gray-700 text-base leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-10 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <Disclaimer />
        </div>
      </section>

      {/* Bottom CTA */}
      <CTASection
        heading="Ready to Talk With Our Team?"
        subheading="No cost, no pressure — just straightforward Medicare guidance from local Spokane professionals."
      />
    </>
  );
}
