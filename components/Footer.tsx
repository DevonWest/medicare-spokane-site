import Image from "next/image";
import Link from "next/link";
import { siteConfig, telHref } from "@/lib/site";
import { spokaneAreaCities } from "@/lib/cities";

const helpLinks: Array<{ href: string; label: string }> = [
  { href: "/medicare-advantage", label: "Medicare Advantage" },
  { href: "/medicare-supplements", label: "Medicare Supplements" },
  { href: "/medicare-part-d", label: "Medicare Part D" },
  { href: "/supplemental-insurance", label: "Supplemental Insurance" },
  { href: "/carriers", label: "Carriers" },
  { href: "/medicare-faq", label: "Medicare FAQ" },
  { href: "/medicare-enrollment-resources", label: "Enrollment Resources" },
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
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              {/* TODO: Swap to a dark-background logo asset if footer/theme styling removes the light logo backdrop. */}
              <Image
                src="/brand/hio-logo.png"
                alt="Health Insurance Options logo"
                width={48}
                height={48}
                className="h-12 w-auto rounded bg-white p-1 object-contain"
              />
              <div>
                <span className="text-white font-bold text-lg block">
                  {siteConfig.legalName}
                </span>
                <p className="text-xs uppercase tracking-wider text-gray-400 mt-1">
                  Licensed Independent Insurance Agency
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Medicare in Spokane
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-400 leading-relaxed">
              {siteConfig.legalName} is {siteConfig.agencyDescriptor} serving Spokane and the
              surrounding Eastern Washington communities.
            </p>
            <div className="mt-4 space-y-1 text-sm">
              <p>
                <a href={telHref} className="hover:text-white transition-colors">
                  {siteConfig.phone}
                </a>
              </p>
              <p>
                <a href={`mailto:${siteConfig.email}`} className="hover:text-white transition-colors">
                  {siteConfig.email}
                </a>
              </p>
              <p className="text-gray-500 text-xs">{siteConfig.address.streetAddress}</p>
              <p className="text-gray-500 text-xs">
                {siteConfig.address.addressLocality}, {siteConfig.address.addressRegion}{" "}
                {siteConfig.address.postalCode}
              </p>
              <p className="text-gray-500 text-xs">{siteConfig.hours}</p>
            </div>
          </div>

          {/* Medicare Help */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              Medicare Help
            </h3>
            <ul className="space-y-2 text-sm">
              {helpLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              About Our Agency
            </h3>
            <ul className="space-y-2 text-sm">
              {aboutLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              Areas We Serve
            </h3>
            <ul className="space-y-2 text-sm">
              {spokaneAreaCities.map((city) => (
                <li key={city.slug}>
                  <Link href={`/cities/${city.slug}`} className="hover:text-white transition-colors">
                    {city.name}, {city.stateCode}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-800 text-xs text-gray-400 space-y-3">
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
