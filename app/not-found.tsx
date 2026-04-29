import Link from "next/link";
import { siteConfig } from "@/lib/site";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h1 className="text-6xl font-extrabold text-blue-700 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-900 mb-3">Page Not Found</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        We couldn&apos;t find the page you were looking for. Try returning home or call us for Medicare help.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors"
        >
          Return Home
        </Link>
        <a
          href={`tel:${siteConfig.phone.replace(/\D/g, "")}`}
          className="bg-white border border-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Call {siteConfig.phone}
        </a>
      </div>
    </div>
  );
}
