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
import type { Firestore } from "firebase-admin/firestore";
import {
  DUPLICATE_WINDOW_MS,
  cleanString,
  getLeadValidationErrorMessage,
  normalizeEmail,
  normalizePhone,
  validateLead,
} from "./leadValidation";
import { getFirestoreAdmin, getFirebaseAdminEnvSummary } from "./firebase-admin";
import { getSafeErrorDetails } from "./leadLogging";
import type { UtmParams } from "./utm";

export type LeadSource =
  | "homepage"
  | "medicare-spokane"
  | "turning-65"
  | "turning-65-medicare-spokane"
  | "medicare-appointment-checklist"
  | "medicare-plan-review-spokane"
  | "compare-medicare-options"
  | "helping-parent-with-medicare"
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
  errorType?: "validation" | "server";
}

/** Firestore collection name. Override with `LEADS_COLLECTION` env var. */
const COLLECTION = process.env.LEADS_COLLECTION?.trim() || "website_leads";

/** Canonical site identifier stored on every doc — handy when this DB serves multiple sites. */
const SITE_SOURCE = "medicareinspokane.com";

/** Generic error message we're willing to show users. */
const GENERIC_ERROR = "We couldn't submit your request. Please call us at 509-353-0476.";

function getLeadLogContext(payload: LeadPayload): Record<string, unknown> {
  const firebase = getFirebaseAdminEnvSummary();

  return {
    source: payload.source,
    sourcePath: cleanString(payload.sourcePath) ?? null,
    hasZip: Boolean(cleanString(payload.zip)),
    hasMessage: Boolean(cleanString(payload.message)),
    hasReferrer: Boolean(cleanString(payload.referrer)),
    utmKeys: payload.utm ? Object.keys(payload.utm) : [],
    hasClientSubmittedAt: Boolean(cleanString(payload.clientSubmittedAt)),
    firebaseAdminConfigured: firebase.configured,
    hasFirebaseProjectId: firebase.hasFirebaseProjectId,
    firestoreCollection: COLLECTION,
    runtimeEnvironment: process.env.NODE_ENV ?? "development",
  };
}

function logLeadWarning(message: string, payload: LeadPayload, extra?: Record<string, unknown>) {
  console.warn(message, { ...getLeadLogContext(payload), ...extra });
}

function logLeadError(message: string, payload: LeadPayload, error: unknown, extra?: Record<string, unknown>) {
  console.error(message, { ...getLeadLogContext(payload), ...getSafeErrorDetails(error), ...extra });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function stripUndefinedDeep<T>(value: T): T {
  if (value === undefined) return undefined as T;
  if (Array.isArray(value)) {
    return value
      .filter((item): item is Exclude<typeof item, undefined> => item !== undefined)
      .map((item) => stripUndefinedDeep(item)) as T;
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      if (nestedValue === undefined) continue;
      out[key] = stripUndefinedDeep(nestedValue);
    }
    return out as T;
  }
  return value;
}

export function buildLeadFirestoreDocument(payload: LeadPayload, nowMs: number): Record<string, unknown> {
  const emailNorm = normalizeEmail(payload.email);
  const phoneNorm = normalizePhone(payload.phone);
  const nameClean = cleanString(payload.fullName) ?? "";
  const zipClean = cleanString(payload.zip);
  const messageClean = cleanString(payload.message);
  const utm = stripUndefinedDeep(payload.utm);
  const submittedAtIso = new Date(nowMs).toISOString();

  return stripUndefinedDeep({
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
    utm: utm && Object.keys(utm).length ? utm : null,
    clientSubmittedAt: cleanString(payload.clientSubmittedAt) ?? null,
    // Server-stamped
    submittedAt: Timestamp.fromMillis(nowMs),
    submittedAtIso,
    createdAt: FieldValue.serverTimestamp(),
    // Workflow
    status: "new",
    siteSource: SITE_SOURCE,
  });
}

function shouldUseDevFallback(): boolean {
  return process.env.NODE_ENV !== "production";
}

function getDevFallbackResult(payload: LeadPayload, reason: string, error?: unknown): LeadResult {
  console.warn("[leads] Firestore unavailable; using non-production placeholder.", {
    ...getLeadLogContext(payload),
    reason,
    ...(error ? getSafeErrorDetails(error) : {}),
  });
  return { ok: true, id: `placeholder-${Date.now()}` };
}

/**
 * Submit a lead. Validates strictly, dedupes recent submissions, and
 * writes to Firestore via the admin SDK.
 */
export async function submitLead(payload: LeadPayload): Promise<LeadResult> {
  // 1) Validate.
  const validation = validateLead(payload);
  if (!validation.ok) {
    logLeadWarning("[leads] validation failed.", payload, { errors: validation.errors });
    return { ok: false, error: getLeadValidationErrorMessage(validation.errors), errorType: "validation" };
  }

  const emailNorm = normalizeEmail(payload.email);
  const phoneNorm = normalizePhone(payload.phone);

  let db: Firestore;
  try {
    db = getFirestoreAdmin();
  } catch (err) {
    if (shouldUseDevFallback()) {
      return getDevFallbackResult(payload, "firestore-admin-init-failed", err);
    }
    logLeadError("[leads] Failed to initialize Firestore admin.", payload, err, {
      firebaseAdminConfigured: getFirebaseAdminEnvSummary().configured,
    });
    return { ok: false, error: GENERIC_ERROR, errorType: "server" };
  }

  const nowMs = Date.now();

  try {
    // 3) Dedupe — look for any lead in the last 10 minutes whose normalized
    // email OR phone matches. We run two small queries because Firestore
    // doesn't support OR across different fields without a composite query.
    const cutoff = Timestamp.fromMillis(nowMs - DUPLICATE_WINDOW_MS);
    const col = db.collection(COLLECTION);

    const dedupeChecks = [
      emailNorm ? { field: "emailNorm", value: emailNorm } : null,
      phoneNorm ? { field: "phoneNorm", value: phoneNorm } : null,
    ].filter((check): check is { field: "emailNorm" | "phoneNorm"; value: string } => Boolean(check));

    for (const check of dedupeChecks) {
      let snap;
      try {
        snap = await col.where(check.field, "==", check.value).where("submittedAt", ">=", cutoff).limit(1).get();
      } catch (err) {
        logLeadError("[leads] Firestore duplicate check failed.", payload, err, { dedupeField: check.field });
        return { ok: false, error: GENERIC_ERROR, errorType: "server" };
      }

      const doc = snap.docs[0];
      if (doc) {
        console.info("[leads] duplicate within window — returning existing id", {
          id: doc.id,
          source: payload.source,
          sourcePath: cleanString(payload.sourcePath) ?? null,
        });
        return { ok: true, id: doc.id, duplicate: true };
      }
    }

    // 4) Build the doc. Strip undefined fields so Firestore doesn't reject them.
    const doc = buildLeadFirestoreDocument(payload, nowMs);

    const ref = await col.add(doc);
    console.info("[leads] new lead written", {
      id: ref.id,
      source: payload.source,
      sourcePath: cleanString(payload.sourcePath) ?? null,
      hasZip: Boolean(cleanString(payload.zip)),
    });
    return { ok: true, id: ref.id };
  } catch (err) {
    if (shouldUseDevFallback()) {
      return getDevFallbackResult(payload, "firestore-write-failed", err);
    }
    logLeadError("[leads] Firestore query/write failed.", payload, err);
    return { ok: false, error: GENERIC_ERROR, errorType: "server" };
  }
}
