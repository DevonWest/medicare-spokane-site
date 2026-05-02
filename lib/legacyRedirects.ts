export const legacyRedirects = {
  "/about": "/our-team",
  "/lynn-wold": "/our-team",
  "/craig-lenhart": "/our-team",
  "/meg-shumaker": "/our-team",
  "/rose-records": "/our-team",
  "/sheryl-manchester": "/our-team",
  "/karen-christensen": "/our-team",
  "/karen-speerstra": "/our-team",
  "/medicare-supplement-insurance-plans": "/medicare-supplements",
  "/medicare-part-d-prescription-plans": "/medicare-part-d",
  "/rx-drug-lookup": "/rx-drug-review",
  "/rx-drug-lookup-form": "/rx-drug-review",
  "/request-a-quote": "/contact",
  "/request-contact": "/contact",
  "/7-things-to-know-about-working-past-65": "/working-past-65-medicare",
} as const;

export type LegacyRedirectPath = keyof typeof legacyRedirects;

export function getLegacyRedirectDestination(pathname: string): string | null {
  return legacyRedirects[pathname as LegacyRedirectPath] ?? null;
}
