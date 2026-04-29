import Link from "next/link";
import { siteConfig } from "@/lib/site";

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-blue-700 font-bold text-xl tracking-tight">
              Medicare<span className="text-blue-500">Spokane</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/topics/medicare-advantage" className="hover:text-blue-700 transition-colors">
              Medicare Advantage
            </Link>
            <Link href="/topics/medicare-supplement" className="hover:text-blue-700 transition-colors">
              Medigap
            </Link>
            <Link href="/topics/medicare-part-d" className="hover:text-blue-700 transition-colors">
              Part D
            </Link>
            <Link href="/topics/medicare-enrollment" className="hover:text-blue-700 transition-colors">
              Enrollment
            </Link>
          </nav>

          <a
            href={`tel:${siteConfig.phone.replace(/\D/g, "")}`}
            className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
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
            {siteConfig.phone}
          </a>
        </div>
      </div>
    </header>
  );
}
