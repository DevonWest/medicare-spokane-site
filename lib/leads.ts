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
 *   4. Submit the full lead payload to the CRM public form endpoint after
 *      the Firestore backup is saved.
 *
 * Errors are logged on the server with context but never surfaced to the
 * end user beyond a generic message.
 */

import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { DocumentReference, Firestore } from "firebase-admin/firestore";
import {
  DUPLICATE_WINDOW_MS,
  cleanString,
  getLeadValidationErrorMessage,
  normalizeEmail,
  normalizePhone,
  validateLead,
} from "./leadValidation";
import { submitCrmLeadForm, type CrmSubmissionResult } from "./crm";
import { CRM_PUBLIC_FORM_SUBMISSION_PATH } from "./crmPaths";
import { CRM_SYNC_STATUS } from "./leadConstants";
import { getFirestoreAdmin, getFirebaseAdminEnvSummary } from "./firebase-admin";
import { buildLeadFirestoreDocument } from "./leadFirestore";
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
  crmSyncStatus?: "synced" | "failed";
  emailStatus?: "sent" | "failed";
  /** User-facing error message (no internal details). */
  error?: string;
  errorType?: "validation" | "server";
}

interface SubmitLeadDependencies {
  submitCrmLeadForm?: typeof submitCrmLeadForm;
  getFirestoreAdmin?: () => Firestore;
  now?: () => number;
  useDevFallback?: () => boolean;
}

/** Firestore collection name. Override with `LEADS_COLLECTION` env var. */
const COLLECTION = process.env.LEADS_COLLECTION?.trim() || "website_leads";

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

function extractCrmSyncStatus(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function extractCrmSyncAttempts(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

async function updateCrmStatus(
  ref: DocumentReference,
  payload: LeadPayload,
  result: CrmSubmissionResult,
  attempts: number,
) {
  const nowIso = new Date().toISOString();

  try {
    await ref.update({
      crmSyncStatus: result.ok ? CRM_SYNC_STATUS.synced : CRM_SYNC_STATUS.failed,
      crmSyncAttempts: attempts,
      crmContactId: result.ok ? result.contactId ?? null : null,
      crmSyncedAt: result.ok ? FieldValue.serverTimestamp() : null,
      crmSyncedAtIso: result.ok ? nowIso : null,
      crmSyncFailedAt: result.ok ? null : FieldValue.serverTimestamp(),
      crmSyncFailedAtIso: result.ok ? null : nowIso,
      crmSyncErrorSafe: result.ok ? null : result.error ?? null,
      crmResponseStatus: result.status ?? null,
      crmLastAttemptAt: FieldValue.serverTimestamp(),
      crmLastAttemptAtIso: nowIso,
      crmLastError: result.ok ? null : result.error ?? null,
      crmLastResponseStatus: result.status ?? null,
      crmEndpointPath: result.path ?? null,
    });
  } catch (err) {
    logLeadError("[leads] Failed to update CRM sync status in Firestore.", payload, err, {
      leadId: ref.id,
      crmSyncStatus: result.ok ? CRM_SYNC_STATUS.synced : CRM_SYNC_STATUS.failed,
    });
  }
}

async function syncLeadToCrm(
  ref: DocumentReference,
  payload: LeadPayload,
  submitCrmLeadFormImpl: typeof submitCrmLeadForm,
  priorAttempts = 0,
): Promise<LeadResult> {
  let crmResult: CrmSubmissionResult;
  try {
    crmResult = await submitCrmLeadFormImpl(payload);
  } catch (err) {
    logLeadError("[leads] CRM form submission threw after Firestore save.", payload, err, {
      leadId: ref.id,
      crmSyncAttempts: priorAttempts + 1,
    });
    crmResult = {
      ok: false,
      path: CRM_PUBLIC_FORM_SUBMISSION_PATH,
      error: "CRM request failed after the lead was saved.",
    };
  }
  await updateCrmStatus(ref, payload, crmResult, priorAttempts + 1);

  if (!crmResult.ok) {
    console.error("[leads] CRM form submission failed.", {
      ...getLeadLogContext(payload),
      leadId: ref.id,
      crmSyncStatus: CRM_SYNC_STATUS.failed,
      crmSyncAttempts: priorAttempts + 1,
      crmResponseStatus: crmResult.status ?? null,
      crmEndpointPath: crmResult.path ?? null,
      crmSyncErrorSafe: crmResult.error ?? null,
    });
    return { ok: true, id: ref.id, crmSyncStatus: CRM_SYNC_STATUS.failed };
  }

  console.info("[leads] CRM form submitted", {
    id: ref.id,
    crmContactId: crmResult.contactId ?? null,
    crmSyncStatus: CRM_SYNC_STATUS.synced,
    source: payload.source,
    sourcePath: cleanString(payload.sourcePath) ?? null,
  });

  return { ok: true, id: ref.id, crmSyncStatus: CRM_SYNC_STATUS.synced };
}

/**
 * Submit a lead. Validates strictly, dedupes recent submissions, and
 * writes to Firestore via the admin SDK.
 */
export async function submitLeadWithDeps(payload: LeadPayload, deps: SubmitLeadDependencies = {}): Promise<LeadResult> {
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
    db = (deps.getFirestoreAdmin ?? getFirestoreAdmin)();
  } catch (err) {
    if ((deps.useDevFallback ?? shouldUseDevFallback)()) {
      return getDevFallbackResult(payload, "firestore-admin-init-failed", err);
    }
    logLeadError("[leads] Failed to initialize Firestore admin.", payload, err, {
      firebaseAdminConfigured: getFirebaseAdminEnvSummary().configured,
    });
    return { ok: false, error: GENERIC_ERROR, errorType: "server" };
  }

  const nowMs = (deps.now ?? Date.now)();
  const submitCrmLeadFormImpl = deps.submitCrmLeadForm ?? submitCrmLeadForm;

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
        if ((deps.useDevFallback ?? shouldUseDevFallback)()) {
          return getDevFallbackResult(payload, "firestore-duplicate-check-failed", err);
        }
        logLeadError("[leads] Firestore duplicate check failed.", payload, err, { dedupeField: check.field });
        return { ok: false, error: GENERIC_ERROR, errorType: "server" };
      }

      const doc = snap.docs[0];
      if (doc) {
        const existing = doc.data();
        const crmSyncStatus = extractCrmSyncStatus(existing.crmSyncStatus);
        const crmSyncAttempts = extractCrmSyncAttempts(existing.crmSyncAttempts);

        if (crmSyncStatus !== CRM_SYNC_STATUS.synced) {
          console.info("[leads] duplicate lead found but CRM is not synced — retrying CRM sync", {
            id: doc.id,
            source: payload.source,
            sourcePath: cleanString(payload.sourcePath) ?? null,
            crmSyncStatus: crmSyncStatus ?? "unknown",
          });
          return {
            ...(await syncLeadToCrm(doc.ref, payload, submitCrmLeadFormImpl, crmSyncAttempts)),
            duplicate: true,
          };
        }

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
    return await syncLeadToCrm(ref, payload, submitCrmLeadFormImpl);
  } catch (err) {
    if ((deps.useDevFallback ?? shouldUseDevFallback)()) {
      return getDevFallbackResult(payload, "firestore-write-failed", err);
    }
    logLeadError("[leads] Firestore query/write failed.", payload, err);
    return { ok: false, error: GENERIC_ERROR, errorType: "server" };
  }
}

export async function submitLead(payload: LeadPayload): Promise<LeadResult> {
  return submitLeadWithDeps(payload);
}
