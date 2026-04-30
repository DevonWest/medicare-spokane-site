import Link from "next/link";
import { telHref } from "@/lib/site";

export default function MobileStickyCTA() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-gray-200 bg-white/95 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] backdrop-blur-sm md:hidden print:hidden">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <a
          href={telHref}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-800"
          aria-label="Call Health Insurance Options"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
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
          <span>Call</span>
        </a>
        <Link
          href="/contact"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-blue-700 bg-white px-4 py-3 text-base font-semibold text-blue-700 transition-colors hover:bg-blue-50"
          aria-label="Request Help with Medicare"
        >
          Request Help
        </Link>
      </div>
    </div>
  );
}
