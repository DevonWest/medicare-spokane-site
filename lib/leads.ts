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
 *
 * Captured fields include attribution data (UTM params, referrer, source
 * page path) and a server-side `submittedAt` timestamp so the future
 * Firebase document is analytics-ready out of the box.
 */

import type { UtmParams } from "./utm";

export type LeadSource =
  | "homepage"
  | "medicare-spokane"
  | "turning-65"
  | "advantage-vs-supplement"
  | "contact"
  | "unknown";

export interface LeadAttribution {
  /** Pathname of the page the form was submitted from (e.g. "/contact"). */
  sourcePath?: string;
  /** `document.referrer` at submit time, if available. */
  referrer?: string;
  /** Parsed UTM parameters captured from the visitor's session. */
  utm?: UtmParams;
  /** ISO timestamp captured client-side when the form was submitted. */
  clientSubmittedAt?: string;
}

export interface LeadPayload extends LeadAttribution {
  fullName: string;
  email: string;
  phone: string;
  zip?: string;
  message?: string;
  source: LeadSource;
}

/** What we actually persist – includes server-stamped fields. */
export interface PersistedLead extends LeadPayload {
  /** Server-side ISO timestamp. Authoritative for sorting/reporting. */
  submittedAt: string;
}

export interface LeadResult {
  ok: boolean;
  id?: string;
  error?: string;
}

/**
 * Submit a lead. Replace this implementation with a real backend call
 * (Firebase, an email API, etc.) when ready. The shape of `PersistedLead`
 * is intended to map directly to a Firestore document.
 */
export async function submitLead(payload: LeadPayload): Promise<LeadResult> {
  // Basic validation – mirror what the UI enforces, in case the API is
  // ever called directly.
  if (!payload.fullName?.trim() || !payload.phone?.trim() || !payload.email?.trim()) {
    return { ok: false, error: "Name, email, and phone are required." };
  }

  const persisted: PersistedLead = {
    ...payload,
    submittedAt: new Date().toISOString(),
  };

  // Placeholder: log a sanitized summary to the server console. Do NOT
  // log full PII in production – this is just a development stub.
  if (process.env.NODE_ENV !== "production") {
    console.log("[leads] received placeholder lead:", {
      source: persisted.source,
      sourcePath: persisted.sourcePath,
      referrer: persisted.referrer,
      utm: persisted.utm,
      hasZip: Boolean(persisted.zip),
      hasMessage: Boolean(persisted.message),
      submittedAt: persisted.submittedAt,
    });
  }

  return {
    ok: true,
    id: `placeholder-${Date.now()}`,
  };
}
