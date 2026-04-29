/**
 * Lead capture service – placeholder.
 *
 * This module defines the public interface our app uses to submit
 * lead data. The current implementation only logs to the server console
 * (and returns a fake reference id) so we can wire up forms today and
 * swap in Firebase / Firestore (or another backend) later without
 * touching any UI code.
 *
 * To swap in Firebase later, replace the body of `submitLead` to write
 * to Firestore (e.g. via `addDoc(collection(db, "leads"), payload)`).
 */

export type LeadSource =
  | "homepage"
  | "medicare-spokane"
  | "turning-65"
  | "advantage-vs-supplement"
  | "contact"
  | "unknown";

export interface LeadPayload {
  fullName: string;
  email: string;
  phone: string;
  zip?: string;
  message?: string;
  source: LeadSource;
}

export interface LeadResult {
  ok: boolean;
  id?: string;
  error?: string;
}

/**
 * Submit a lead. Replace this implementation with a real backend call
 * (Firebase, an email API, etc.) when ready.
 */
export async function submitLead(payload: LeadPayload): Promise<LeadResult> {
  // Basic validation – mirror what the UI enforces, in case the API is
  // ever called directly.
  if (!payload.fullName?.trim() || !payload.phone?.trim() || !payload.email?.trim()) {
    return { ok: false, error: "Name, email, and phone are required." };
  }

  // Placeholder: log to the server console. Do NOT log full PII in
  // production – this is just a development stub.
  if (process.env.NODE_ENV !== "production") {
    console.log("[leads] received placeholder lead:", {
      source: payload.source,
      hasZip: Boolean(payload.zip),
      hasMessage: Boolean(payload.message),
    });
  }

  return {
    ok: true,
    id: `placeholder-${Date.now()}`,
  };
}
