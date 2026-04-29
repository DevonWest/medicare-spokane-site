import type { Metadata } from "next";
import Disclaimer from "@/components/Disclaimer";
import LeadForm from "@/components/LeadForm";
import PageHero from "@/components/PageHero";
import { siteConfig, telHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Request a Call from a Spokane Medicare Agent",
  description:
    "Request a no-cost call from a licensed insurance professional at Health Insurance Options LLC. We help Spokane-area Medicare beneficiaries compare plans on their schedule.",
  alternates: { canonical: `${siteConfig.url}/request-contact` },
  openGraph: {
    title: "Request a Call from a Spokane Medicare Agent",
    description:
      "No-cost, no-obligation Medicare consultation with a licensed local insurance professional.",
    url: `${siteConfig.url}/request-contact`,
  },
};

export default function RequestContactPage() {
  return (
    <>
      <PageHero
        title="Request a Call Back"
        subtitle="Tell us a little about your situation and a licensed insurance professional will reach out — no cost, no pressure."
        crumbs={[{ href: "/", label: "Home" }, { label: "Request a Call" }]}
      />

      <section className="py-12 px-4 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-5 text-gray-800 leading-relaxed">
            <h2 className="text-2xl font-bold text-gray-900">What to expect</h2>
            <ol className="list-decimal list-outside pl-6 space-y-2">
              <li>You submit the form (or call us directly).</li>
              <li>
                A licensed insurance professional from {siteConfig.legalName} reaches out — usually
                the same business day.
              </li>
              <li>
                We schedule a no-cost consultation in our Spokane office, by phone, or by video at a
                time that works for you.
              </li>
              <li>
                We review your situation, answer your questions, and help you compare the Medicare
                plans we represent.
              </li>
            </ol>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 text-sm text-blue-900">
              <p className="font-semibold mb-1">Prefer to talk now?</p>
              <p>
                Call us at{" "}
                <a href={telHref} className="font-semibold underline">
                  {siteConfig.phone}
                </a>
                . {siteConfig.hours}.
              </p>
            </div>

            <Disclaimer />
          </div>

          <div>
            <LeadForm
              source="request-contact"
              heading="Request Your No-Cost Consultation"
              subheading="Share a few details and we will reach out at a time that works for you."
              showMessage
            />
          </div>
        </div>
      </section>
    </>
  );
}
