// Only public, known article paths may be stored or sent to analytics.
export const ARTICLE_PATHS = [
  "/providence-health-plan-ending-2027-washington",
  "/costco-scan-medicare-spokane",
  "/unitedhealthcare-providence-medicare-advantage-2027-spokane",
  "/multicare-rockwood-clinic-closures-spokane",
  "/spokane-medicare-provider-networks",
] as const;

const storageKey = "spokane:last-article";
const maxAgeMs = 30 * 60 * 1000;

export function isArticlePath(path: unknown): path is typeof ARTICLE_PATHS[number] {
  return typeof path === "string" && ARTICLE_PATHS.some((article) => article === path);
}

export function rememberArticle(path: string): void {
  if (!isArticlePath(path) || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify({ path, at: Date.now() }));
  } catch {
    // Storage restrictions must never affect reading or contacting the agency.
  }
}

export function lastArticlePath(): string | undefined {
  if (typeof window === "undefined") return undefined;
  if (isArticlePath(window.location.pathname)) return window.location.pathname;
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(storageKey) || "null");
    const age = Date.now() - stored?.at;
    if (isArticlePath(stored?.path) && Number.isFinite(age) && age >= 0 && age <= maxAgeMs) {
      return stored.path;
    }
  } catch {
    // Tracking is optional, including when storage is blocked or malformed.
  }
  return undefined;
}
