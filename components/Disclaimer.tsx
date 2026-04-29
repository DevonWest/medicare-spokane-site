import { siteConfig } from "@/lib/site";

interface DisclaimerProps {
  /** Show the non-affiliation paragraph in addition to the plan disclosure. */
  includeNonAffiliation?: boolean;
  className?: string;
}

/**
 * CMS-aligned plan-availability disclosure used across the site. Source of truth
 * is `siteConfig.disclaimer` so the wording can be updated in a single place.
 */
export default function Disclaimer({
  includeNonAffiliation = true,
  className = "",
}: DisclaimerProps) {
  return (
    <aside
      className={`bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-900 leading-relaxed space-y-2 ${className}`}
      aria-label="Plan availability disclosure"
    >
      <p className="font-semibold">Plan availability</p>
      <p>{siteConfig.disclaimer}</p>
      {includeNonAffiliation ? <p>{siteConfig.nonAffiliation}</p> : null}
    </aside>
  );
}
