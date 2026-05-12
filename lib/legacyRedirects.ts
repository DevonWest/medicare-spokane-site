import { getAllDirectorySlugs, getDirectoryPath } from "./cities";

export const legacyRedirects = {
  "/about": "/our-team",
  "/home": "/",
  "/lynn-wold": "/our-team",
  "/craig-lenhart": "/our-team",
  "/meg-shumaker": "/our-team",
  "/rose-records": "/our-team",
  "/profiles/rose-records": "/our-team",
  "/sheryl-manchester": "/our-team",
  "/karen-christensen": "/our-team",
  "/karen-speerstra": "/our-team",
  "/profiles/karen-speerstra": "/our-team",
  "/medicare-supplement-insurance-plans": "/medicare-supplements",
  "/medicare-part-d-prescription-plans": "/medicare-part-d",
  "/videos": "/resources",
  "/rx-drug-lookup": "/rx-drug-review",
  "/rx-drug-lookup-form": "/rx-drug-review",
  "/request-a-quote": "/contact",
  "/request-contact": "/contact",
  "/7-things-to-know-about-working-past-65": "/working-past-65-medicare",
} as const;

export type LegacyRedirectPath = keyof typeof legacyRedirects;

export const localDirectoryPages = Object.fromEntries(
  getAllDirectorySlugs().map((directorySlug) => [
    `/directory/${directorySlug}`,
    getDirectoryPath(directorySlug),
  ]),
) as Record<`/directory/${string}`, `/directory/${string}`>;

type LocalDirectoryPath = keyof typeof localDirectoryPages;

// Legacy /directory/* URLs from the prior site that map to a relevant local
// Medicare page. These take precedence over the generic 410 Gone response we
// otherwise return for unknown directory paths so Search Console crawls land
// on the closest active local page.
export const legacyDirectoryRedirects: Record<string, string> = {
  "/directory/mica-wa": "/medicare-spokane",
  "/directory/newman-lake-wa": "/medicare-spokane-valley",
  "/directory/fairfield-wa": "/medicare-spokane",
  "/directory/freeman-wa": "/medicare-spokane",
  "/directory/four-lakes-wa": "/medicare-spokane",
};

// Removed/irrelevant legacy paths that should return 410 Gone so search
// engines drop them. /directory/* paths that are not in the known directory
// set and not in legacyDirectoryRedirects also return 410 by default.
const legacyGonePaths = new Set<string>([
  "/charlie-howell",
]);

export type LegacyPathResolution =
  | { type: "redirect"; destination: string; preserveQuery: boolean }
  | { type: "gone" };

function normalizeLegacyPath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

export function getCanonicalDirectoryDestination(pathname: string): string | null {
  const normalizedPath = normalizeLegacyPath(pathname);

  if (!normalizedPath.toLowerCase().startsWith("/directory/")) {
    return null;
  }

  return normalizedPath.toLowerCase();
}

export function isKnownDirectoryPath(pathname: string): boolean {
  const normalizedPath = normalizeLegacyPath(pathname).toLowerCase();

  return Boolean(localDirectoryPages[normalizedPath as LocalDirectoryPath]);
}

export function getLegacyDirectoryRedirect(pathname: string): string | null {
  const normalizedPath = normalizeLegacyPath(pathname).toLowerCase();

  return legacyDirectoryRedirects[normalizedPath] ?? null;
}

export function getLegacyPathResolution(pathname: string): LegacyPathResolution | null {
  const normalizedPath = normalizeLegacyPath(pathname).toLowerCase();

  if (legacyGonePaths.has(normalizedPath)) {
    return { type: "gone" };
  }

  const directDestination = legacyRedirects[normalizedPath as LegacyRedirectPath];

  if (directDestination) {
    return { type: "redirect", destination: directDestination, preserveQuery: true };
  }

  return null;
}

export function getLegacyRedirectDestination(pathname: string): string | null {
  const resolution = getLegacyPathResolution(pathname);

  return resolution?.type === "redirect" ? resolution.destination : null;
}
