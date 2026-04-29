/**
 * UTM + attribution helpers.
 *
 * UTMs are parsed once on first arrival and persisted in `sessionStorage`
 * so they survive client-side navigation and remain attached to whichever
 * page the visitor finally converts on.
 */

export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

const STORAGE_KEY = "mis_utm_v1";

/**
 * Parse UTM params from a query string (or `window.location.search`)
 * into a typed object. Empty values are dropped.
 */
export function parseUtmParams(search: string): UtmParams {
  if (!search) return {};
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const utm: UtmParams = {};
  const map: Array<[string, keyof UtmParams]> = [
    ["utm_source", "source"],
    ["utm_medium", "medium"],
    ["utm_campaign", "campaign"],
    ["utm_term", "term"],
    ["utm_content", "content"],
  ];
  for (const [qsKey, key] of map) {
    const value = params.get(qsKey);
    if (value) utm[key] = value.slice(0, 200);
  }
  return utm;
}

/**
 * Read previously-captured UTMs from sessionStorage. Safe on the server
 * (returns an empty object).
 */
export function getStoredUtm(): UtmParams {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as UtmParams;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Capture UTM params from the current URL (if any) and merge them with
 * the previously-stored values. Existing values are preserved unless
 * the new URL provides a fresh value, which mirrors typical analytics
 * "first-touch with refresh" behavior at the session level.
 *
 * Call once at app mount (e.g. from a small client component in the
 * root layout) or inline from any client component that needs it.
 */
export function captureUtmFromLocation(): UtmParams {
  if (typeof window === "undefined") return {};
  const fromUrl = parseUtmParams(window.location.search);
  const stored = getStoredUtm();
  const merged: UtmParams = { ...stored, ...fromUrl };
  try {
    if (Object.keys(merged).length > 0) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    }
  } catch {
    // sessionStorage may be unavailable (private mode, etc.) – ignore.
  }
  return merged;
}
