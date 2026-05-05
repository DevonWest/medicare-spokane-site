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

export const localDirectoryRedirects = {
  "/directory/spokane-wa": "/medicare-spokane",
  "/Directory/spokane-wa": "/medicare-spokane",
  "/directory/spokane-valley-wa": "/medicare-spokane-valley",
  "/Directory/spokane-valley-wa": "/medicare-spokane-valley",
  "/directory/cheney-wa": "/medicare-cheney",
  "/Directory/cheney-wa": "/medicare-cheney",
  "/directory/airway-heights-wa": "/medicare-airway-heights",
  "/Directory/airway-heights-wa": "/medicare-airway-heights",
  "/directory/liberty-lake-wa": "/medicare-liberty-lake",
  "/Directory/liberty-lake-wa": "/medicare-liberty-lake",
  "/directory/medical-lake-wa": "/medicare-medical-lake",
  "/Directory/medical-lake-wa": "/medicare-medical-lake",
  "/directory/mead-wa": "/medicare-mead",
  "/Directory/mead-wa": "/medicare-mead",
  "/directory/deer-park-wa": "/medicare-deer-park",
  "/Directory/deer-park-wa": "/medicare-deer-park",
} as const;

type LocalDirectoryRedirectPath = keyof typeof localDirectoryRedirects;

const goneLegacyPaths = new Set(["/charlie-howell"]);

export type LegacyPathResolution =
  | { type: "redirect"; destination: string; preserveQuery: boolean }
  | { type: "gone" };

function normalizeLegacyPath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function isUnknownDirectoryPath(pathname: string): boolean {
  return pathname.startsWith("/directory/") || pathname.startsWith("/Directory/");
}

export function getLegacyPathResolution(pathname: string): LegacyPathResolution | null {
  const normalizedPath = normalizeLegacyPath(pathname);

  if (goneLegacyPaths.has(normalizedPath)) {
    return { type: "gone" };
  }

  const directDestination = legacyRedirects[normalizedPath as LegacyRedirectPath];

  if (directDestination) {
    return { type: "redirect", destination: directDestination, preserveQuery: true };
  }

  const localDirectoryDestination =
    localDirectoryRedirects[normalizedPath as LocalDirectoryRedirectPath];

  if (localDirectoryDestination) {
    return { type: "redirect", destination: localDirectoryDestination, preserveQuery: false };
  }

  if (isUnknownDirectoryPath(normalizedPath)) {
    return { type: "gone" };
  }

  return null;
}

export function getLegacyRedirectDestination(pathname: string): string | null {
  const resolution = getLegacyPathResolution(pathname);

  return resolution?.type === "redirect" ? resolution.destination : null;
}
