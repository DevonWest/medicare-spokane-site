import Image from "next/image";
import Link from "next/link";
import { getLocalMedicarePath, spokaneAreaCities } from "@/lib/cities";
import { siteConfig, telHref } from "@/lib/site";

const helpLinks: Array<{ href: string; label: string }> = [
  { href: "/medicare-advantage", label: "Medicare Advantage" },
  { href: "/medicare-supplements", label: "Medicare Supplements" },
  { href: "/medicare-part-d", label: "Medicare Part D" },
  { href: "/supplemental-insurance", label: "Supplemental Insurance" },
  { href: "/carriers", label: "Carriers" },
  { href: "/medicare-faq", label: "Medicare FAQ" },
  { href: "/medicare-enrollment-resources", label: "Enrollment Resources" },
];

const resourceLinks: Array<{ href: string; label: string }> = [
  { href: "/resources", label: "Medicare Resource Library" },
  { href: "/turning-65-medicare-spokane", label: "Turning 65 in Spokane" },
  { href: "/compare-medicare-options", label: "Compare Medicare Options" },
  { href: "/medicare-appointment-checklist", label: "Medicare Appointment Checklist" },
  { href: "/rx-drug-review", label: "Prescription Drug Review" },
  { href: "/medicare-plan-review-spokane", label: "Annual Medicare Plan Review" },
  { href: "/helping-parent-with-medicare", label: "Helping a Parent with Medicare" },
  { href: "/working-past-65-medicare", label: "Working Past 65 & Medicare" },
  { href: "/medicare-part-d", label: "Medicare Part D" },
];

const aboutLinks: Array<{ href: string; label: string }> = [
  { href: "/our-team", label: "Our Team" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/contact", label: "Contact" },
  { href: "/request-contact", label: "Request a Call" },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 pb-[calc(env(safe-area-inset-bottom)+5.5rem)] text-gray-300 md:pb-0 print:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/brand/hio-icon.png"
                alt="Health Insurance Options LLC icon"
                width={48}
                height={48}
                className="h-12 w-12 shrink-0 object-contain"
              />
              <div>
                <span className="block text-lg font-bold text-white">{siteConfig.legalName}</span>
                <p className="mt-1 text-xs uppercase tracking-wider text-gray-400">
                  Licensed Independent Insurance Agency
                </p>
                <p className="mt-1 text-xs text-gray-400">Medicare in Spokane</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              {siteConfig.legalName} is {siteConfig.agencyDescriptor} serving Spokane and the
              surrounding Eastern Washington communities.
            </p>
            <div className="mt-4 space-y-1 text-sm">
              <p>
                <a href={telHref} className="transition-colors hover:text-white">
                  {siteConfig.phone}
                </a>
              </p>
              <p>
                <a href={`mailto:${siteConfig.email}`} className="transition-colors hover:text-white">
                  {siteConfig.email}
                </a>
              </p>
              <p className="text-xs text-gray-500">{siteConfig.address.streetAddress}</p>
              <p className="text-xs text-gray-500">
                {siteConfig.address.addressLocality}, {siteConfig.address.addressRegion}{" "}
                {siteConfig.address.postalCode}
              </p>
              <p className="text-xs text-gray-500">{siteConfig.hours}</p>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Medicare Help
            </h3>
            <ul className="space-y-2 text-sm">
              {helpLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition-colors hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Resources
            </h3>
            <ul className="space-y-2 text-sm">
              {resourceLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition-colors hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              About Our Agency
            </h3>
            <ul className="space-y-2 text-sm">
              {aboutLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition-colors hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Areas We Serve
            </h3>
            <ul className="space-y-2 text-sm">
              {spokaneAreaCities.map((city) => (
                <li key={city.slug}>
                  <Link href={getLocalMedicarePath(city.slug)} className="transition-colors hover:text-white">
                    {city.name}, {city.stateCode}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 space-y-3 border-t border-gray-800 pt-8 text-xs text-gray-400">
          <p>
            © {currentYear} {siteConfig.legalName}. All rights reserved. {siteConfig.positioning}
          </p>
          <p>{siteConfig.disclaimer}</p>
          <p>{siteConfig.nonAffiliation}</p>
        </div>
      </div>
    </footer>
  );
}
