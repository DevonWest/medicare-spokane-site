import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import FAQ from "@/components/FAQ";
import Disclaimer from "@/components/Disclaimer";
import LeadForm from "@/components/LeadForm";
import { getCityBySlug, getLocalMedicarePath } from "@/lib/cities";
import type { LeadSource } from "@/lib/leadSources";
import { siteConfig, telHref } from "@/lib/site";

const internalResources = [
  {
    href: "/medicare-advantage",
    title: "Medicare Advantage",
    body: "Review the Medicare Advantage plans we represent and compare network rules, copays, and extra benefits.",
  },
  {
    href: "/medicare-supplements",
    title: "Medicare Supplements",
    body: "Compare Medicare Supplement options that can help with deductibles, coinsurance, and other Original Medicare cost gaps.",
  },
  {
    href: "/medicare-part-d",
    title: "Medicare Part D",
    body: "Look at standalone Part D options and understand how formularies, tiers, and pharmacy pricing affect your prescriptions.",
  },
  {
    href: "/rx-drug-review",
    title: "Prescription Review",
    body: "Bring your current medications and preferred pharmacies so we can help you review prescription coverage before you enroll.",
  },
  {
    href: "/contact",
    title: "Request Medicare Help",
    body: "Schedule a no-cost consultation with our Spokane-based team if you want in-person, phone, or remote Medicare guidance.",
  },
] as const;

const localLeadSourceByCitySlug: Record<string, LeadSource> = {
  spokane: "medicare-spokane",
  "spokane-valley": "medicare-spokane-valley",
  "liberty-lake": "medicare-liberty-lake",
  cheney: "medicare-cheney",
  "airway-heights": "medicare-airway-heights",
  "medical-lake": "medicare-medical-lake",
  mead: "medicare-mead",
  "deer-park": "medicare-deer-park",
};

function joinList(values: string[], fallback: string) {
  if (values.length <= 1) {
    return values[0] ?? fallback;
  }

  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function getPrimaryNearbyCommunities(values: string[], fallback: string) {
  const primary = values[0] ?? fallback;
  const secondary = values[1] ?? primary;

  return { primary, secondary };
}

export function getLocalMedicareMetadata(citySlug: string): Metadata {
  const city = getCityBySlug(citySlug);

  if (!city) {
    return { title: "Not Found" };
  }

  const canonicalPath = getLocalMedicarePath(city.slug);
  const title = `Medicare Help in ${city.name}, ${city.stateCode}`;
  const { primary, secondary } = getPrimaryNearbyCommunities(city.nearbyCommunities, city.name);
  const description = `Compare Medicare Advantage, Medicare Supplement, Part D, and supplemental insurance options in ${city.name}, ${city.stateCode} with no-cost help from a Spokane-based licensed independent insurance agency serving ${primary} and ${secondary}.`;

  return {
    title,
    description,
    keywords: [
      `Medicare ${city.name}`,
      `Medicare help ${city.name} WA`,
      `Medicare Advantage ${city.name}`,
      `Medicare Supplement ${city.name}`,
      `Medicare Part D ${city.name}`,
    ],
    alternates: {
      canonical: `${siteConfig.url}${canonicalPath}`,
    },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}${canonicalPath}`,
    },
  };
}

interface LocalMedicarePageProps {
  citySlug: string;
}

export default function LocalMedicarePage({ citySlug }: LocalMedicarePageProps) {
  const city = getCityBySlug(citySlug);

  if (!city) {
    notFound();
  }

  const canonicalPath = getLocalMedicarePath(city.slug);
  const nearbyCommunities = joinList(city.nearbyCommunities, city.name);
  const { primary, secondary } = getPrimaryNearbyCommunities(city.nearbyCommunities, city.name);
  const zipCodes = joinList(city.zipCodes, city.zipCodes[0] ?? city.name);
  const zipLabel = city.zipCodes.length > 1 ? "ZIP codes" : "ZIP code";
  const zipLabelLower = city.zipCodes.length > 1 ? "zip codes" : "zip code";
  const leadSource = localLeadSourceByCitySlug[city.slug];
  const faqItems = [
    {
      question: `Can I get help comparing Medicare plans in ${city.name}?`,
      answer: `${city.faqLocalContext} We can help you compare Medicare Advantage, Medicare Supplement, Part D, and supplemental insurance options and explain the plans we represent in plain language.`,
    },
    {
      question: "Do Medicare plan options vary by ZIP code?",
        answer: `Yes. Plan availability can vary by ZIP code, county, and carrier service area. In ${city.name}, we review the ${zipLabelLower} ${zipCodes} in ${city.county} so you can see which plans are actually available where you live.`,
    },
    {
      question: `Can you help review my prescriptions if I live in ${city.name}?`,
      answer: `Yes. We can review your prescriptions, explain how drug tiers and pharmacy networks work, and compare how the Part D and Medicare Advantage plans we represent may cover the medications you take.`,
    },
    {
      question: `Can I meet in person if I live in ${city.name}?`,
      answer: `Yes. Our Spokane office is located inside the Providence Medical Building. Many clients from ${city.name} meet with us there, and we also offer phone consultations and remote help when that is more convenient.`,
    },
    {
      question: "Can you help me compare the plans you represent?",
      answer: `Yes. We can help you compare the plans we represent for ${city.name}. ${siteConfig.disclaimer}`,
    },
  ];

  const localSchema = {
    "@context": "https://schema.org",
    "@type": ["InsuranceAgency", "LocalBusiness"],
    "@id": `${siteConfig.url}${canonicalPath}`,
    name: `${siteConfig.legalName} – Medicare Help in ${city.name}`,
    description: city.localIntro,
    url: `${siteConfig.url}${canonicalPath}`,
    telephone: siteConfig.phone,
    areaServed: {
      "@type": "City",
      name: city.name,
      containedInPlace: {
        "@type": "AdministrativeArea",
        name: `${city.county}, ${city.state}`,
      },
    },
    serviceType: [
      "Medicare Advantage",
      "Medicare Supplement",
      "Medicare Part D",
      "Supplemental insurance",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localSchema) }}
      />

      <section className="bg-gradient-to-br from-blue-800 to-blue-600 px-4 py-16 text-white">
        <div className="mx-auto max-w-5xl">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-blue-200">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span>Medicare Help in {city.name}</span>
          </nav>
          <h1 className="mb-4 text-4xl font-extrabold leading-tight md:text-5xl">
            Medicare Help in {city.name}, {city.stateCode}
          </h1>
          <p className="max-w-3xl text-xl text-blue-100">{city.heroSummary}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={telHref}
              className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-blue-700 transition-colors hover:bg-blue-50"
            >
              Call {siteConfig.phone}
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg border border-blue-200 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Request Medicare Help
            </Link>
          </div>
          <p className="mt-4 text-sm text-blue-100">
            No-cost consultations are available in person in Spokane, by phone, or remotely.
          </p>
        </div>
      </section>

      <section className="bg-white px-4 py-14">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.4fr_0.9fr]">
          <div>
            <h2 className="mb-4 text-3xl font-bold text-gray-900">
              Medicare guidance for {city.name} residents
            </h2>
            <p className="mb-4 text-lg leading-relaxed text-gray-700">{city.localIntro}</p>
            <p className="text-lg leading-relaxed text-gray-700">{city.serviceAreaContext}</p>
          </div>
          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-8 shadow-sm">
            <h2 className="mb-5 text-2xl font-bold text-gray-900">Local details we review</h2>
            <ul className="space-y-4 text-sm leading-relaxed text-gray-700">
              <li>
                <span className="font-semibold text-gray-900">County:</span> {city.county}
              </li>
              <li>
                <span className="font-semibold text-gray-900">Common {zipLabel}:</span>{" "}
                {zipCodes}
              </li>
              <li>
                <span className="font-semibold text-gray-900">Nearby communities:</span>{" "}
                {nearbyCommunities}
              </li>
              <li>
                <span className="font-semibold text-gray-900">Meeting options:</span> In-person in
                Spokane, phone consultations, or remote Medicare help
              </li>
              <li>
                <span className="font-semibold text-gray-900">Agency:</span> Spokane-based licensed
                independent insurance agency with no-cost consultations
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            What {city.name} Residents Should Consider When Comparing Medicare Options
          </h2>
          <p className="mb-10 max-w-3xl text-lg leading-relaxed text-gray-700">
            The right comparison usually starts with how you use care in {city.name} and the nearby
            Spokane-area communities you visit most often.
          </p>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[
              {
                title: "Provider networks",
                body: `If you use doctors in ${city.name} but also visit specialists in ${primary} or ${secondary}, confirm that the plans you compare line up with those providers and referral rules.`,
              },
              {
                title: "Prescription coverage",
                body: `Review how your medications are covered, whether they fall into higher-cost tiers, and whether prior authorization or step therapy could affect the Part D or Medicare Advantage plans you compare.`,
              },
              {
                title: "Pharmacies",
                body: `Check whether the pharmacies you use in ${city.name}, ${primary}, or ${secondary} are in-network and preferred for lower copays.`,
              },
              {
                title: "Out-of-pocket costs",
                body: "Look past the monthly premium and compare deductibles, specialist copays, coinsurance, and the maximum out-of-pocket exposure that could matter during a busy medical year.",
              },
              {
                title: "ZIP code and county availability",
                body: `Plan choices can vary by ZIP code, county, carrier service area, and enrollment period. We review what is available in ${city.county} for the ZIP codes tied to your address before you make a decision.`,
              },
              {
                title: "How you want to get help",
                body: `Some people in ${city.name} want an in-person meeting in Spokane, while others prefer phone or remote help from home. We can work the way that is most comfortable for you.`,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="mb-3 text-xl font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-gray-700">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            Helpful Medicare resources for {city.name}
          </h2>
          <p className="mb-10 max-w-3xl text-lg leading-relaxed text-gray-700">
            Use these pages if you want to dig deeper into plan types, prescription reviews, or the
            next step for getting personal help.
          </p>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            {internalResources.map((resource) => (
              <Link
                key={resource.href}
                href={resource.href}
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
              >
                <h3 className="mb-3 text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-700">
                  {resource.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-700">{resource.body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-blue-50 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            Local Spokane support with no-cost consultations
          </h2>
          <p className="max-w-3xl text-lg leading-relaxed text-gray-700">
            We are a Spokane-based licensed independent insurance agency. Our Spokane office is
            located inside the Providence Medical Building. We offer no-cost consultations, and you
            can choose an in-person meeting, a phone consultation, or remote help.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: "Independent local guidance",
                body: "Health Insurance Options LLC is a licensed independent insurance agency serving Spokane and surrounding communities.",
              },
              {
                title: "Spokane office",
                body: "Meet with us in Spokane inside the Providence Medical Building if you want face-to-face Medicare help.",
              },
              {
                title: "Flexible appointments",
                body: `If traveling from ${city.name} is not ideal, we can also help by phone or remotely.`,
              },
              {
                title: "No-cost consultations",
                body: "There is no cost to sit down with us and compare the plans we represent for your situation.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm"
              >
                <h3 className="mb-3 text-xl font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-gray-700">{item.body}</p>
              </div>
            ))}
          </div>
          <Disclaimer className="mt-10" />
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-start">
            <div>
              <h2 className="mb-4 text-3xl font-bold text-gray-900">Request Medicare help for {city.name}</h2>
              <p className="text-lg leading-relaxed text-gray-700">
                Tell us a little about what you want to review in {city.name}, and a licensed local Medicare agent will
                follow up. We can help by phone, remotely, or with an in-person appointment in Spokane.
              </p>
            </div>
            <LeadForm
              source={leadSource}
              heading={`Request Medicare Help in ${city.name}`}
              subheading={`Share your questions about Medicare coverage in ${city.name}, and our Spokane team will follow up.`}
              showMessage
            />
          </div>
        </div>
      </section>

      <FAQ items={faqItems} heading={`FAQs About Medicare Help in ${city.name}`} />

      <section className="bg-blue-700 px-4 py-16 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold">Talk with a local Medicare advisor</h2>
          <p className="mb-8 text-lg text-blue-100">
            Get no-cost Medicare guidance from a Spokane-based team that helps residents in {city.name} and nearby communities.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href={telHref}
              className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3 text-lg font-semibold text-blue-700 transition-colors hover:bg-blue-50"
            >
              Call {siteConfig.phone}
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg border border-blue-200 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-800"
            >
              Request Medicare Help
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
