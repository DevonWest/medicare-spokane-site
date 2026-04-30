import Image from "next/image";
import Link from "next/link";
import { siteConfig, telHref } from "@/lib/site";

const primaryNav: Array<{ href: string; label: string }> = [
  { href: "/our-team", label: "Our Team" },
  { href: "/medicare-advantage", label: "Medicare Advantage" },
  { href: "/medicare-supplements", label: "Medicare Supplements" },
  { href: "/medicare-part-d", label: "Part D" },
  { href: "/supplemental-insurance", label: "Supplemental" },
  { href: "/carriers", label: "Carriers" },
  { href: "/medicare-faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <Image
              src="/brand/hio-logo.png"
              alt="Health Insurance Options logo"
              width={512}
              height={512}
              className="h-8 w-auto object-contain sm:h-11 lg:h-12"
              priority
            />
            <span className="text-blue-700 font-bold text-lg sm:text-xl tracking-tight leading-tight">
              Medicare in Spokane
              <span className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                by Health Insurance Options
              </span>
            </span>
          </Link>

          <nav
            aria-label="Primary"
            className="hidden lg:flex items-center gap-5 text-sm font-medium text-gray-700"
          >
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-blue-700 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <a
            href={telHref}
            className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shrink-0"
            aria-label={`Call ${siteConfig.legalName} at ${siteConfig.phone}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z"
              />
            </svg>
            <span className="hidden sm:inline">{siteConfig.phone}</span>
            <span className="sm:hidden">Call</span>
          </a>
        </div>
        {/* Compact mobile / tablet nav */}
        <nav
          aria-label="Primary mobile"
          className="lg:hidden flex flex-wrap gap-x-4 gap-y-1 pb-3 text-sm font-medium text-gray-700"
        >
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-blue-700 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
