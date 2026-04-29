import type { Metadata } from "next";
import Link from "next/link";
import LeadForm from "@/components/LeadForm";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact a Licensed Spokane Medicare Agent",
  description:
    "Contact Medicare in Spokane — a licensed independent insurance agency helping Spokane-area residents with Medicare Advantage, Medicare Supplement, and Part D options.",
  alternates: { canonical: `${siteConfig.url}/contact` },
  openGraph: {
    title: "Contact a Licensed Spokane Medicare Agent",
    description:
      "Reach a licensed independent insurance agency for Medicare help in Spokane, WA.",
    url: `${siteConfig.url}/contact`,
  },
};

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-800 to-blue-600 text-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <nav aria-label="Breadcrumb" className="text-blue-200 text-sm mb-4">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span>Contact</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
            Contact Us
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Talk to a licensed independent Medicare agent serving Spokane, Spokane Valley, Liberty Lake, Cheney, Airway
            Heights, Medical Lake, Mead, Deer Park, and the surrounding Eastern Washington area.
          </p>
        </div>
      </section>

      <section className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Contact info */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>

            <div className="space-y-5 text-gray-800">
              <div>
                <p className="text-sm uppercase tracking-wide text-gray-500 mb-1">Phone</p>
                <a
                  href={`tel:${siteConfig.phone.replace(/\D/g, "")}`}
                  className="text-2xl font-semibold text-blue-700 hover:underline"
                >
                  {siteConfig.phone}
                </a>
                <p className="text-sm text-gray-500 mt-1">Mon – Fri, 9:00 AM – 5:00 PM Pacific</p>
              </div>

              <div>
                <p className="text-sm uppercase tracking-wide text-gray-500 mb-1">Email</p>
                <a href={`mailto:${siteConfig.email}`} className="text-blue-700 hover:underline">
                  {siteConfig.email}
                </a>
              </div>

              <div>
                <p className="text-sm uppercase tracking-wide text-gray-500 mb-1">Office</p>
                <address className="not-italic">
                  {siteConfig.address.streetAddress}
                  <br />
                  {siteConfig.address.addressLocality}, {siteConfig.address.addressRegion}{" "}
                  {siteConfig.address.postalCode}
                </address>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-900 leading-relaxed">
              <p className="font-semibold mb-1">Compliance note</p>
              <p>{siteConfig.disclaimer}</p>
              <p className="mt-2">{siteConfig.nonAffiliation}</p>
            </div>
          </div>

          {/* Form */}
          <div>
            <LeadForm
              source="contact"
              heading="Send Us a Message"
              subheading="Share a few details and a licensed agent will get back to you."
              showMessage
            />
          </div>
        </div>
      </section>
    </>
  );
}
