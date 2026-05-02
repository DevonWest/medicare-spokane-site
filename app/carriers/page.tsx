import type { Metadata } from "next";
import CTASection from "@/components/CTASection";
import Disclaimer from "@/components/Disclaimer";
import PageHero from "@/components/PageHero";
import { CarrierOptionsIllustration } from "@/components/Illustrations";
import { carriers } from "@/lib/carriers";
import { siteConfig, telHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Medicare Carriers We Represent in Spokane",
  description:
    "Health Insurance Options LLC currently represents 8 organizations offering 75 products in the Spokane area, including Medicare Advantage, Medicare Supplement, Part D, dental, and vision carriers.",
  alternates: { canonical: `${siteConfig.url}/carriers` },
  openGraph: {
    title: "Medicare Carriers We Represent in Spokane",
    description:
      "The carriers we currently represent for Medicare Advantage, Medicare Supplement, Part D, and supplemental coverage.",
    url: `${siteConfig.url}/carriers`,
  },
};

export default function CarriersPage() {
  return (
    <>
      <PageHero
        title="Carriers We Represent"
        subtitle="The insurance organizations we currently work with for Medicare Advantage, Medicare Supplement, Part D, dental, vision, and other supplemental coverage in the Spokane area."
        crumbs={[{ href: "/", label: "Home" }, { label: "Carriers" }]}
        illustration={<CarrierOptionsIllustration />}
      />

      <section className="py-12 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 text-sm text-amber-900 leading-relaxed mb-8">
            <p className="font-semibold mb-1">A note on availability</p>
            <p>
              Carrier and plan availability may vary by county, product type, and enrollment
              period. The list below reflects the organizations we currently represent — not every
              plan from every carrier will be available to every Spokane-area resident. A licensed
              insurance professional can confirm what is available at your address and during the
              current enrollment period.
            </p>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {carriers.map((c) => (
              <li
                key={c.name}
                className="bg-gray-50 border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{c.name}</h2>
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Offers</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {c.productTypes.join(" · ")}
                </p>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-sm text-gray-600 leading-relaxed">
            Carrier names and product lines are subject to change. For the most current information
            on what is available in your ZIP code, please call us at{" "}
            <a href={telHref} className="text-blue-700 underline">
              {siteConfig.phone}
            </a>
            .
          </p>
        </div>
      </section>

      <section className="py-10 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <Disclaimer />
        </div>
      </section>

      <CTASection
        heading="Not Sure Which Carrier Fits Your Needs?"
        subheading="A licensed insurance professional can help you compare the carriers and plans we represent."
      />
    </>
  );
}
