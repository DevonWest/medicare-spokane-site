import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { spokaneAreaCities } from "@/lib/cities";
import { medicareTopics } from "@/lib/topics";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <span className="text-white font-bold text-lg">
              Medicare<span className="text-blue-400">InSpokane</span>
            </span>
            <p className="mt-3 text-sm text-gray-400 leading-relaxed">
              {siteConfig.legalName} is a licensed independent insurance agency serving Spokane and surrounding
              Eastern Washington communities.
            </p>
            <div className="mt-4 space-y-1 text-sm">
              <p>
                <a href={`tel:${siteConfig.phone.replace(/\D/g, "")}`} className="hover:text-white transition-colors">
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
            </div>
          </div>

          {/* Main Pages */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Medicare Help</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/medicare-spokane" className="hover:text-white transition-colors">
                  Medicare in Spokane
                </Link>
              </li>
              <li>
                <Link href="/turning-65-medicare-spokane" className="hover:text-white transition-colors">
                  Turning 65 &amp; Medicare
                </Link>
              </li>
              <li>
                <Link
                  href="/medicare-advantage-vs-supplement-spokane"
                  className="hover:text-white transition-colors"
                >
                  Advantage vs. Supplement
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Topics */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Medicare Topics</h3>
            <ul className="space-y-2 text-sm">
              {medicareTopics.map((topic) => (
                <li key={topic.slug}>
                  <Link href={`/topics/${topic.slug}`} className="hover:text-white transition-colors">
                    {topic.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cities */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Areas We Serve</h3>
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

        <div className="mt-10 pt-8 border-t border-gray-800 text-xs text-gray-500 flex flex-col sm:flex-row justify-between gap-2">
          <p>© {currentYear} {siteConfig.legalName}. All rights reserved.</p>
          <p>
            {siteConfig.legalName} is a licensed independent insurance agency. We do not offer every plan available in
            your area. Any information we provide is limited to the plans we do offer in your area. Please contact
            Medicare.gov or 1-800-MEDICARE (TTY 1-877-486-2048), 24 hours a day/7 days a week, to get information on
            all of your options.
          </p>
        </div>
      </div>
    </footer>
  );
}
