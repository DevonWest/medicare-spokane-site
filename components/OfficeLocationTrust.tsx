import Link from "next/link";
import FriendlyIllustration from "@/components/FriendlyIllustration";
import { siteConfig, telHref } from "@/lib/site";

const officeBullets = [
  "In-person consultations available",
  "Convenient Spokane medical district location",
  "Licensed local insurance agents",
  "No-cost Medicare consultations",
];

export default function OfficeLocationTrust() {
  return (
    <section className="bg-slate-100 py-16 px-4 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-blue-50 shadow-sm">
          <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
            <div className="p-8 md:p-12">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-700">
                Spokane Office Location
              </p>
              <h2 className="mb-5 text-3xl font-bold text-gray-900 md:text-4xl">
                Local Medicare Help at Our Spokane Office
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-gray-700 md:text-lg">
                <p>
                  Our Spokane office is located in the Providence Medical Building at 820
                  South McClellan, making it easy for local residents to meet with a licensed
                  insurance agent in person. Whether you prefer to meet face-to-face or get help
                  by phone, our team is here to guide you through your Medicare options with
                  clarity and confidence.
                </p>
              </div>

              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {officeBullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-white p-4"
                  >
                    <span
                      className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-700 text-white"
                      aria-hidden="true"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 5.292a1 1 0 010 1.416l-7.5 7.5a1 1 0 01-1.416 0l-3.5-3.5a1 1 0 111.416-1.416L8.5 12.088l6.79-6.796a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <span className="text-sm font-medium text-gray-800 md:text-base">{bullet}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-800"
                >
                  Schedule an In-Person Meeting
                </Link>
                <a
                  href={telHref}
                  className="inline-flex items-center justify-center rounded-lg border-2 border-blue-700 bg-white px-6 py-3 text-base font-semibold text-blue-700 transition-colors hover:bg-blue-50"
                >
                  Call 509-353-0476
                </a>
              </div>
            </div>

            <div className="flex items-center justify-center border-t border-slate-200 bg-slate-900 p-8 lg:border-t-0 lg:border-l">
              <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-8 shadow-lg">
                <div className="mb-6 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <FriendlyIllustration name="officeLocation" />
                </div>

                <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Visit Our Spokane Office
                </p>
                <div className="mt-4 space-y-3 text-gray-800">
                  <p className="text-2xl font-bold text-gray-900">{siteConfig.address.buildingName}</p>
                  <address className="not-italic text-base leading-relaxed text-gray-700">
                    {siteConfig.address.streetAddress}
                    <br />
                    {siteConfig.address.addressLocality}, {siteConfig.address.addressRegion}{" "}
                    {siteConfig.address.postalCode}
                    <br />
                    <a href={telHref} className="font-semibold text-blue-700 hover:underline">
                      {siteConfig.phone}
                    </a>
                  </address>
                </div>

                <p className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
                  Located in the Providence Medical Building for convenient in-person Medicare
                  consultations in Spokane.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
