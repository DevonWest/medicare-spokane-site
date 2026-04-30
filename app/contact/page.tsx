import type { Metadata } from "next";
import Link from "next/link";
import LeadForm from "@/components/LeadForm";
import { siteConfig, telHref } from "@/lib/site";

const directionsHref =
  "https://www.google.com/maps/search/?api=1&query=Providence%20Medical%20Building%20820%20South%20McClellan%20Spokane%20WA%2099204";

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
          <div className="space-y-6">
            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6 shadow-sm sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
                Visit Our Spokane Office
              </p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">
                Meet with a licensed local insurance agent in person.
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-gray-700">
                Our office is located inside the Providence Medical Building in Spokane. You can
                meet with a licensed insurance agent in person or request help by phone.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href={telHref}
                  className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-800"
                >
                  Call 509-353-0476
                </a>
                <a
                  href={directionsHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-white px-5 py-3 text-base font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                >
                  Get Directions
                </a>
                <Link
                  href="#contact-form"
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-base font-semibold text-gray-900 transition-colors hover:bg-gray-50"
                >
                  Request Help Online
                </Link>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                <h3 className="text-2xl font-bold text-gray-900">{siteConfig.address.buildingName}</h3>
                <address className="mt-5 not-italic text-base leading-8 text-gray-800">
                  <p>{siteConfig.address.streetAddress}</p>
                  <p>
                    {siteConfig.address.addressLocality}, {siteConfig.address.addressRegion}{" "}
                    {siteConfig.address.postalCode}
                  </p>
                  <p>
                    Phone:{" "}
                    <a href={telHref} className="font-semibold text-blue-700 hover:underline">
                      {siteConfig.phone}
                    </a>
                  </p>
                  <p>
                    Email:{" "}
                    <a
                      href={`mailto:${siteConfig.email}`}
                      className="font-semibold text-blue-700 hover:underline"
                    >
                      {siteConfig.email}
                    </a>
                  </p>
                  <p>Hours: {siteConfig.hours}</p>
                </address>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-slate-50 p-6 shadow-sm sm:p-8">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-6 w-6"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 21s6-5.686 6-11a6 6 0 10-12 0c0 5.314 6 11 6 11z"
                    />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                </div>
                <h3 className="mt-4 text-2xl font-bold text-gray-900">Office map & directions</h3>
                <p className="mt-3 text-base leading-relaxed text-gray-700">
                  Located inside the Providence Medical Building. Use Google Maps for turn-by-turn
                  directions to our Spokane office.
                </p>
                <div className="mt-5 rounded-2xl border border-dashed border-blue-200 bg-white p-5 text-gray-700">
                  <p className="font-semibold text-gray-900">{siteConfig.address.buildingName}</p>
                  <p className="mt-2">
                    {siteConfig.address.streetAddress}
                    <br />
                    {siteConfig.address.addressLocality}, {siteConfig.address.addressRegion}{" "}
                    {siteConfig.address.postalCode}
                  </p>
                </div>
                <a
                  href={directionsHref}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-700 px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-800"
                >
                  Get Directions
                </a>
              </div>
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-relaxed text-blue-900">
              <p className="font-semibold mb-1">Compliance note</p>
              <p>{siteConfig.disclaimer}</p>
              <p className="mt-2">{siteConfig.nonAffiliation}</p>
            </div>
          </div>

          {/* Form */}
          <div id="contact-form">
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
