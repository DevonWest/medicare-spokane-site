import Image from "next/image";
import Link from "next/link";
import { telHref } from "@/lib/site";

const officeBullets = [
  "In-person consultations available",
  "Convenient Spokane location",
  "Work with licensed local agents",
  "No-cost Medicare consultations",
];

export default function OfficeLocationTrust() {
  return (
    <section className="bg-slate-50 py-16 px-4 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-8 md:p-12">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-700">
                Spokane Office Location
              </p>
              <h2 className="mb-5 text-3xl font-bold text-gray-900 md:text-4xl">
                Located Inside a Trusted Providence Medical Building
              </h2>
              <div className="space-y-4 text-base leading-relaxed text-gray-700 md:text-lg">
                <p>
                  We are conveniently located inside a Providence medical building in Spokane,
                  making it easy for local residents to meet with a licensed insurance agent in a
                  trusted healthcare setting.
                </p>
                <p>
                  Whether you prefer to meet in person or get help over the phone, our team is
                  here to guide you through your Medicare options with clarity and confidence.
                </p>
              </div>

              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {officeBullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
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
                  href="/request-contact"
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

            <div className="relative min-h-[320px] bg-slate-100 lg:min-h-full">
              {/* TODO: Replace with an actual building photo, office interior photo, or map screenshot. */}
              <Image
                src="/images/providence-placeholder.jpg"
                alt="Placeholder exterior image representing the Spokane office location"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent p-6">
                <p className="text-sm font-medium text-white/90 md:text-base">
                  Meet with a licensed local agent in Spokane or get Medicare guidance by phone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
