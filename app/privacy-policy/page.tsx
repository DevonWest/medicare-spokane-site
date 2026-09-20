import type { Metadata } from "next";
import { siteConfig, telHref } from "@/lib/site";

const pageUrl = `${siteConfig.url}/privacy-policy`;

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Learn how ${siteConfig.legalName} collects, uses, and protects information submitted through this website and our advertising forms.`,
  alternates: { canonical: pageUrl },
};

const sections = [
  {
    title: "Information we collect",
    body: [
      "We may collect information you provide to us, including your name, email address, phone number, ZIP code, contact preferences, and the type of insurance or Medicare-related help you request.",
      "We may also collect basic technical information about visits to our website, such as browser type, device type, pages viewed, referral source, and campaign parameters. We use analytics and similar technologies to understand site performance and improve our services.",
      "Please do not submit Social Security numbers, Medicare numbers, payment information, medical records, diagnoses, or treatment information through our website or advertising forms.",
    ],
  },
  {
    title: "How we use information",
    body: [
      "We use the information you provide to respond to your request, arrange a consultation, answer questions, communicate about products or services you asked about, maintain our records, improve our website and advertising, and meet legal or regulatory obligations.",
      "Submitting a request does not require you to enroll in a plan, and consent to be contacted is not a condition of purchasing any product or service.",
    ],
  },
  {
    title: "How we share information",
    body: [
      "We do not sell or rent your personal information. We may share it with licensed agents working with our agency and with service providers that help us operate our website, advertising, communications, customer relationship management, analytics, or data security. These parties may use the information only to provide services to us or respond to your request, subject to applicable law.",
      "We may also disclose information when required by law, to protect rights or safety, or in connection with a business transaction involving our agency.",
    ],
  },
  {
    title: "Advertising forms and third-party platforms",
    body: [
      "If you submit information through a form hosted by Facebook, Instagram, or another advertising platform, that platform may also collect and use your information under its own privacy policy. After the platform sends the form response to us, we handle it as described in this policy.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "You may ask us to access, correct, or delete personal information we maintain about you, subject to legal recordkeeping requirements. You may also ask us to stop marketing communications. Reply STOP to opt out of text messages when that option is available, or contact us using the details below.",
    ],
  },
  {
    title: "Security and retention",
    body: [
      "We use reasonable administrative, technical, and physical safeguards designed to protect personal information. No method of transmission or storage is completely secure. We retain information only as long as reasonably necessary for the purposes described here and to meet legal, regulatory, and business requirements.",
    ],
  },
  {
    title: "Children's privacy",
    body: [
      "Our services are not directed to children under 13, and we do not knowingly collect personal information from children under 13 through this website.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <section className="bg-slate-50 px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">Legal</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950">Privacy Policy</h1>
        <p className="mt-3 text-sm text-slate-500">Effective September 20, 2026</p>

        <p className="mt-7 text-base leading-7 text-slate-700">
          This policy explains how {siteConfig.legalName} collects, uses, shares, and protects
          information received through this website, our advertising forms, and related communications.
        </p>

        <div className="mt-10 space-y-9">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-2xl font-bold text-slate-950">{section.title}</h2>
              <div className="mt-3 space-y-3">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-base leading-7 text-slate-700">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <section>
            <h2 className="text-2xl font-bold text-slate-950">Contact us</h2>
            <p className="mt-3 text-base leading-7 text-slate-700">
              Questions or privacy requests may be sent to {siteConfig.legalName} at{" "}
              <a className="font-semibold text-blue-800 underline underline-offset-2" href={`mailto:${siteConfig.email}`}>
                {siteConfig.email}
              </a>
              , by phone at{" "}
              <a className="font-semibold text-blue-800 underline underline-offset-2" href={telHref}>
                {siteConfig.phone}
              </a>
              , or by mail at {siteConfig.address.streetAddress}, {siteConfig.address.addressLocality},{" "}
              {siteConfig.address.addressRegion} {siteConfig.address.postalCode}.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-950">Changes to this policy</h2>
            <p className="mt-3 text-base leading-7 text-slate-700">
              We may update this policy from time to time. The effective date above shows when the
              current version took effect.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
