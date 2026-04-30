/**
 * Lead capture service.
 *
 * Writes sanitized leads to a Firestore collection (`website_leads` by
 * default). The Firestore admin SDK is loaded lazily and only on the
 * server — see `lib/firebase-admin.ts`.
 *
 * Behavior summary:
 *   1. Validate + normalize the payload (`lib/leadValidation.ts`).
 *   2. Look up any lead with the same normalized email OR phone in the
 *      last `DUPLICATE_WINDOW_MS` (10 min) — if found, return its id with
 *      `duplicate: true` instead of writing a new doc.
 *   3. Otherwise, create a new doc with `status: "new"` and the canonical
 *      `source: "medicareinspokane.com"` plus all attribution fields.
 *
 * Errors are logged on the server with context but never surfaced to the
 * end user beyond a generic message.
 */

import "server-only";

import { Timestamp, FieldValue } from "firebase-admin/firestore";
import {
  DUPLICATE_WINDOW_MS,
  cleanString,
  normalizeEmail,
  normalizePhone,
  validateLead,
} from "./leadValidation";
import { getFirestoreAdmin, isFirebaseAdminConfigured } from "./firebase-admin";
import type { UtmParams } from "./utm";

export type LeadSource =
  | "homepage"
  | "medicare-spokane"
  | "turning-65"
  | "turning-65-medicare-spokane"
  | "medicare-appointment-checklist"
  | "medicare-plan-review-spokane"
  | "compare-medicare-options"
  | "working-past-65-medicare"
  | "advantage-vs-supplement"
  | "medicare-advantage"
  | "medicare-supplements"
  | "medicare-part-d"
  | "supplemental-insurance"
  | "carriers"
  | "testimonials"
  | "about"
  | "request-contact"
  | "medicare-faq"
  | "medicare-enrollment-resources"
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

export interface PersistedLead extends LeadPayload {
  /** Server-side ISO timestamp. Authoritative for sorting/reporting. */
  submittedAt: string;
}

export interface LeadResult {
  ok: boolean;
  id?: string;
  /** True when an existing recent lead was matched instead of creating a new one. */
  duplicate?: boolean;
  /** User-facing error message (no internal details). */
  error?: string;
}

/** Firestore collection name. Override with `LEADS_COLLECTION` env var. */
const COLLECTION = process.env.LEADS_COLLECTION?.trim() || "website_leads";

/** Canonical site identifier stored on every doc — handy when this DB serves multiple sites. */
const SITE_SOURCE = "medicareinspokane.com";

/** Generic error message we're willing to show users. */
const GENERIC_ERROR = "We couldn't submit your request. Please try again or call us.";

/**
 * Submit a lead. Validates strictly, dedupes recent submissions, and
 * writes to Firestore via the admin SDK.
 */
export async function submitLead(payload: LeadPayload): Promise<LeadResult> {
  // 1) Validate.
  const validation = validateLead(payload);
  if (!validation.ok) {
    // Log internally; surface a single generic message.
    console.warn("[leads] validation failed:", validation.errors);
    return { ok: false, error: "Please double-check your name, email, and phone number." };
  }

  const emailNorm = normalizeEmail(payload.email);
  const phoneNorm = normalizePhone(payload.phone);
  const nameClean = cleanString(payload.fullName) ?? "";
  const zipClean = cleanString(payload.zip);
  const messageClean = cleanString(payload.message);

  // 2) Get Firestore (or fail soft in dev when creds are absent).
  if (!isFirebaseAdminConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[leads] Firebase admin not configured — logging placeholder:", {
        source: payload.source,
        sourcePath: payload.sourcePath,
        utm: payload.utm,
        emailDomain: emailNorm.split("@")[1],
      });
      return { ok: true, id: `placeholder-${Date.now()}` };
    }
    // In production we treat missing creds as a hard server error but
    // never leak that to the client.
    console.error("[leads] Firebase admin credentials missing in production.");
    return { ok: false, error: GENERIC_ERROR };
  }

  let db;
  try {
    db = getFirestoreAdmin();
  } catch (err) {
    console.error("[leads] failed to init Firestore admin:", err);
    return { ok: false, error: GENERIC_ERROR };
  }

  const nowMs = Date.now();
  const submittedAtIso = new Date(nowMs).toISOString();

  try {
    // 3) Dedupe — look for any lead in the last 10 minutes whose normalized
    // email OR phone matches. We run two small queries because Firestore
    // doesn't support OR across different fields without a composite query.
    const cutoff = Timestamp.fromMillis(nowMs - DUPLICATE_WINDOW_MS);
    const col = db.collection(COLLECTION);

    const dedupeQueries = [];
    if (emailNorm) {
      dedupeQueries.push(
        col.where("emailNorm", "==", emailNorm).where("submittedAt", ">=", cutoff).limit(1).get(),
      );
    }
    if (phoneNorm) {
      dedupeQueries.push(
        col.where("phoneNorm", "==", phoneNorm).where("submittedAt", ">=", cutoff).limit(1).get(),
      );
    }
    const dedupeResults = await Promise.all(dedupeQueries);
    for (const snap of dedupeResults) {
      const doc = snap.docs[0];
      if (doc) {
        console.info("[leads] duplicate within window — returning existing id", {
          id: doc.id,
          source: payload.source,
        });
        return { ok: true, id: doc.id, duplicate: true };
      }
    }

    // 4) Build the doc. Strip undefined fields so Firestore doesn't reject them.
    const doc: Record<string, unknown> = {
      // Identity
      fullName: nameClean,
      email: emailNorm,
      phone: payload.phone.trim(),
      // Normalized fields used for dedupe / future search.
      emailNorm,
      phoneNorm,
      // Optional fields
      zip: zipClean ?? null,
      message: messageClean ?? null,
      // Attribution
      source: payload.source,
      sourcePath: cleanString(payload.sourcePath) ?? null,
      referrer: cleanString(payload.referrer) ?? null,
      utm: payload.utm ?? null,
      clientSubmittedAt: cleanString(payload.clientSubmittedAt) ?? null,
      // Server-stamped
      submittedAt: Timestamp.fromMillis(nowMs),
      submittedAtIso: submittedAtIso,
      createdAt: FieldValue.serverTimestamp(),
      // Workflow
      status: "new",
      siteSource: SITE_SOURCE,
    };

    const ref = await col.add(doc);
    console.info("[leads] new lead written", {
      id: ref.id,
      source: payload.source,
      sourcePath: payload.sourcePath,
    });
    return { ok: true, id: ref.id };
  } catch (err) {
    console.error("[leads] Firestore write failed:", err);
    return { ok: false, error: GENERIC_ERROR };
  }
}
