"use client";

import Link from "next/link";
import { useState } from "react";

export interface HeaderNavItem {
  href: string;
  label: string;
}

interface HeaderMobileMenuProps {
  items: HeaderNavItem[];
  phone: string;
  telHref: string;
}

const mobileMenuId = "primary-mobile-menu";

export default function HeaderMobileMenu({
  items,
  phone,
  telHref,
}: HeaderMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const mobileMenuClassName = isOpen
    ? "col-span-full block border-t border-gray-200 py-3 lg:hidden"
    : "col-span-full hidden border-t border-gray-200 py-3 lg:hidden";

  return (
    <>
      <button
        type="button"
        className="inline-flex h-11 min-h-11 items-center justify-center gap-1.5 justify-self-end rounded-lg border border-gray-300 px-3 text-[15px] font-semibold text-gray-900 transition-colors hover:bg-gray-50 landscape-mobile:h-8 landscape-mobile:px-2 landscape-mobile:text-xs lg:hidden"
        aria-expanded={isOpen}
        aria-controls={mobileMenuId}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        onClick={() => setIsOpen((open) => !open)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          {isOpen ? (
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

      <nav
        id={mobileMenuId}
        aria-label="Primary mobile"
        className={mobileMenuClassName}
      >
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-11 items-center rounded-xl px-4 text-base font-semibold text-gray-900 transition-colors hover:bg-blue-50 hover:text-blue-700"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <a
            href={telHref}
            className="flex min-h-11 items-center rounded-xl px-4 text-base font-semibold text-blue-700 transition-colors hover:bg-blue-50"
            aria-label={`Call ${phone}`}
            onClick={() => setIsOpen(false)}
          >
            Call {phone}
          </a>
          <Link
            href="/contact"
            className="flex min-h-11 items-center justify-center rounded-xl bg-blue-700 px-4 text-base font-semibold text-white transition-colors hover:bg-blue-800"
            onClick={() => setIsOpen(false)}
          >
            Request Help
          </Link>
        </div>
      </nav>
    </>
  );
}
