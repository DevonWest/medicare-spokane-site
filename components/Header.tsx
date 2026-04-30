"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { siteConfig, telHref } from "@/lib/site";

const primaryNav: Array<{ href: string; label: string }> = [
  { href: "/", label: "Home" },
  { href: "/medicare-spokane", label: "Medicare Help" },
  { href: "/our-team", label: "Our Team" },
  { href: "/resources", label: "Resources" },
  { href: "/contact", label: "Contact" },
];

const mobileMenuId = "primary-mobile-menu";
const headerRowClassName =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-3 lg:flex lg:h-16 lg:items-center lg:justify-between lg:gap-4 lg:py-0";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuClassName = isMobileMenuOpen
    ? "block border-t border-gray-200 py-4 lg:hidden"
    : "hidden border-t border-gray-200 py-4 lg:hidden";

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={headerRowClassName}>
          <Link
            href="/"
            className="col-span-2 flex min-w-0 items-center lg:col-auto"
            aria-label="Medicare in Spokane home page"
          >
            <Image
              src="/brand/logo-horizontal.png"
              alt="Medicare in Spokane by Health Insurance Options"
              width={1324}
              height={216}
              priority
              className="h-auto w-[240px] object-contain sm:w-[280px] lg:w-[320px] xl:w-[360px]"
            />
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
            className="inline-flex h-11 items-center justify-center gap-2 justify-self-end rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
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

          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 justify-self-end rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50 lg:hidden"
            aria-expanded={isMobileMenuOpen}
            aria-controls={mobileMenuId}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
            <span>Menu</span>
          </button>
        </div>

        <nav
          id={mobileMenuId}
          aria-label="Primary mobile"
          className={mobileMenuClassName}
        >
          <div className="space-y-3">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-11 items-center rounded-xl px-4 text-base font-semibold text-gray-900 transition-colors hover:bg-blue-50 hover:text-blue-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <a
              href={telHref}
              className="flex min-h-11 items-center rounded-xl px-4 text-base font-semibold text-blue-700 transition-colors hover:bg-blue-50"
              aria-label={`Call ${siteConfig.legalName} at ${siteConfig.phone}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Call {siteConfig.phone}
            </a>
            <Link
              href="/request-contact"
              className="flex min-h-11 items-center justify-center rounded-xl bg-blue-700 px-4 text-base font-semibold text-white transition-colors hover:bg-blue-800"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Request Help
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
