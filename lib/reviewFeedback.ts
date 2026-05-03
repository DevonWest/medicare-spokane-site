import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { DocumentReference, Firestore } from "firebase-admin/firestore";
import { submitCrmLeadForm, type CrmSubmissionResult } from "./crm";
import { CRM_PUBLIC_FORM_SUBMISSION_PATH } from "./crmPaths";
import { getFirebaseAdminEnvSummary, getFirestoreAdmin } from "./firebase-admin";
import { CRM_SYNC_STATUS, SITE_SOURCE } from "./leadConstants";
import { getSafeErrorDetails } from "./leadLogging";
import { normalizeEmail, normalizePhone } from "./leadValidation";
import {
  REVIEW_FEEDBACK_SOURCE_PATH,
  sanitizeReviewSlug,
  sanitizeReviewString,
  type ReviewFeedbackInput,
  validateReviewFeedbackInput,
} from "./reviewFlow";
import { siteConfig } from "./site";
import { getTeamMemberBySlug, getTeamMemberSlug, isReviewableTeamMember } from "./team";

const COLLECTION = process.env.REVIEW_FEEDBACK_COLLECTION?.trim() || "review_feedback";
const GENERIC_ERROR = `We couldn't submit your feedback. Please call us at ${siteConfig.phone}.`;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function stripUndefinedDeep<T>(value: T | undefined): T | undefined {
  if (value === undefined) return undefined;
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

export interface ReviewFeedbackPayload {
  fullName: string;
  email: string;
  phone?: string;
  agentSlug?: string;
  rating: number;
  message: string;
  sourcePath?: string;
}

export interface ReviewFeedbackDocument {
  fullName: string;
  email: string;
  emailNorm: string;
  phone: string | null;
  phoneNorm: string | null;
  agentSlug: string | null;
  agentName: string | null;
  rating: number;
  message: string;
  sourcePath: string;
  submittedAt: Timestamp;
  submittedAtIso: string;
  createdAt: ReturnType<typeof FieldValue.serverTimestamp>;
  status: "new";
  crmSyncStatus: "pending" | "synced" | "failed";
  crmSyncAttempts: number;
  crmContactId: string | null;
  crmSyncedAt: ReturnType<typeof FieldValue.serverTimestamp> | null;
  crmSyncedAtIso: string | null;
  crmSyncFailedAt: ReturnType<typeof FieldValue.serverTimestamp> | null;
  crmSyncFailedAtIso: string | null;
  crmSyncErrorSafe: string | null;
  crmResponseStatus: number | null;
  crmLastAttemptAt: ReturnType<typeof FieldValue.serverTimestamp> | null;
  crmLastAttemptAtIso: string | null;
  crmLastError: string | null;
  crmLastResponseStatus: number | null;
  crmEndpointPath: string | null;
  siteSource: typeof SITE_SOURCE;
}

export interface ReviewFeedbackResult {
  ok: boolean;
  id?: string;
  crmSyncStatus?: "synced" | "failed";
  error?: string;
  errorType?: "validation" | "server";
}

interface ReviewFeedbackDependencies {
  getFirestoreAdmin?: () => Firestore;
  sendNotification?: (feedback: Record<string, unknown> & { id: string }) => Promise<void>;
  submitCrmLeadForm?: typeof submitCrmLeadForm;
  now?: () => number;
}

function getReviewFeedbackLogContext(payload: ReviewFeedbackPayload): Record<string, unknown> {
  const firebase = getFirebaseAdminEnvSummary();

  return {
    agentSlug: sanitizeReviewSlug(payload.agentSlug) ?? null,
    rating: payload.rating,
    sourcePath: sanitizeReviewString(payload.sourcePath) ?? null,
    hasPhone: Boolean(sanitizeReviewString(payload.phone)),
    firebaseAdminConfigured: firebase.configured,
    hasFirebaseProjectId: firebase.hasFirebaseProjectId,
    firestoreCollection: COLLECTION,
    runtimeEnvironment: process.env.NODE_ENV ?? "development",
  };
}

function sanitizeReviewFeedbackPayload(payload: ReviewFeedbackInput): ReviewFeedbackPayload {
  return {
    fullName: sanitizeReviewString(payload.fullName) ?? "",
    email: sanitizeReviewString(payload.email) ?? "",
    phone: sanitizeReviewString(payload.phone),
    agentSlug: sanitizeReviewSlug(payload.agentSlug),
    rating: payload.rating ?? NaN,
    message: sanitizeReviewString(payload.message) ?? "",
    sourcePath: sanitizeReviewString(payload.sourcePath),
  };
}

function buildReviewFeedbackCrmMessage(reviewPayload: ReviewFeedbackPayload): string {
  const agentSlug = sanitizeReviewSlug(reviewPayload.agentSlug);
  const sourcePath = sanitizeReviewString(reviewPayload.sourcePath);
  const details = [
    `Feedback rating: ${reviewPayload.rating} star${reviewPayload.rating === 1 ? "" : "s"}`,
    agentSlug ? `Agent: ${agentSlug}` : undefined,
    sourcePath ? `Source path: ${sourcePath}` : undefined,
  ].filter((value): value is string => Boolean(value));

  return [details.join("\n"), sanitizeReviewString(reviewPayload.message) ?? ""].filter(Boolean).join("\n\n");
}

export function buildReviewFeedbackDocument(payload: ReviewFeedbackPayload, nowMs: number): ReviewFeedbackDocument {
  const resolvedMember = payload.agentSlug ? getTeamMemberBySlug(payload.agentSlug) : undefined;
  const reviewableMember = resolvedMember && isReviewableTeamMember(resolvedMember) ? resolvedMember : undefined;
  const agentSlug = reviewableMember
    ? getTeamMemberSlug(reviewableMember)
    : sanitizeReviewSlug(payload.agentSlug) ?? null;
  const agentName = reviewableMember?.name ?? null;
  const email = normalizeEmail(payload.email);
  const phone = sanitizeReviewString(payload.phone);
  const phoneNorm = phone ? normalizePhone(phone) : null;
  const sanitizedSourcePath = sanitizeReviewString(payload.sourcePath) ?? REVIEW_FEEDBACK_SOURCE_PATH;

  return stripUndefinedDeep({
    fullName: sanitizeReviewString(payload.fullName) ?? "",
    email,
    emailNorm: email,
    phone: phone ?? null,
    phoneNorm,
    agentSlug,
    agentName,
    rating: payload.rating,
    message: sanitizeReviewString(payload.message) ?? "",
    sourcePath: sanitizedSourcePath,
    submittedAt: Timestamp.fromMillis(nowMs),
    submittedAtIso: new Date(nowMs).toISOString(),
    createdAt: FieldValue.serverTimestamp(),
    status: "new",
    crmSyncStatus: CRM_SYNC_STATUS.pending,
    crmSyncAttempts: 0,
    crmContactId: null,
    crmSyncedAt: null,
    crmSyncedAtIso: null,
    crmSyncFailedAt: null,
    crmSyncFailedAtIso: null,
    crmSyncErrorSafe: null,
    crmResponseStatus: null,
    crmLastAttemptAt: null,
    crmLastAttemptAtIso: null,
    crmLastError: null,
    crmLastResponseStatus: null,
    crmEndpointPath: null,
    siteSource: SITE_SOURCE,
  }) as ReviewFeedbackDocument;
}

async function updateReviewFeedbackCrmStatus(
  ref: DocumentReference,
  payload: ReviewFeedbackPayload,
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
  } catch (error) {
    console.error("[review-feedback] Failed to update CRM sync status in Firestore.", {
      ...getReviewFeedbackLogContext(payload),
      id: ref.id,
      ...getSafeErrorDetails(error),
    });
  }
}

async function syncReviewFeedbackToCrm(
  ref: DocumentReference,
  payload: ReviewFeedbackPayload,
  submitCrmLeadFormImpl: typeof submitCrmLeadForm,
): Promise<ReviewFeedbackResult> {
  let crmResult: CrmSubmissionResult;

  try {
    crmResult = await submitCrmLeadFormImpl({
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone ?? "",
      message: buildReviewFeedbackCrmMessage(payload),
      source: "review-feedback",
      sourcePath: payload.sourcePath,
    });
  } catch (error) {
    console.error("[review-feedback] CRM submission threw after Firestore save.", {
      ...getReviewFeedbackLogContext(payload),
      id: ref.id,
      ...getSafeErrorDetails(error),
    });
    crmResult = {
      ok: false,
      path: CRM_PUBLIC_FORM_SUBMISSION_PATH,
      error: "CRM request failed after the feedback was saved.",
    };
  }

  await updateReviewFeedbackCrmStatus(ref, payload, crmResult, 1);

  if (!crmResult.ok) {
    console.error("[review-feedback] CRM submission failed.", {
      ...getReviewFeedbackLogContext(payload),
      id: ref.id,
      crmSyncStatus: CRM_SYNC_STATUS.failed,
      crmResponseStatus: crmResult.status ?? null,
      crmEndpointPath: crmResult.path ?? null,
      crmSyncErrorSafe: crmResult.error ?? null,
    });
    return { ok: true, id: ref.id, crmSyncStatus: CRM_SYNC_STATUS.failed };
  }

  return { ok: true, id: ref.id, crmSyncStatus: CRM_SYNC_STATUS.synced };
}

export async function submitReviewFeedbackWithDeps(
  payload: ReviewFeedbackInput,
  deps: ReviewFeedbackDependencies = {},
): Promise<ReviewFeedbackResult> {
  const cleanPayload = sanitizeReviewFeedbackPayload(payload);
  const validation = validateReviewFeedbackInput(cleanPayload);

  if (!validation.ok) {
    console.warn("[review-feedback] Validation failed.", {
      ...getReviewFeedbackLogContext(cleanPayload),
      errors: validation.errors,
    });
    return { ok: false, error: validation.error, errorType: "validation" };
  }

  const nowMs = (deps.now ?? Date.now)();
  const doc = buildReviewFeedbackDocument(cleanPayload, nowMs);
  const submitCrmLeadFormImpl = deps.submitCrmLeadForm ?? submitCrmLeadForm;

  let db: Firestore;
  try {
    db = (deps.getFirestoreAdmin ?? getFirestoreAdmin)();
  } catch (error) {
    console.error("[review-feedback] Failed to initialize Firestore admin.", {
      ...getReviewFeedbackLogContext(cleanPayload),
      ...getSafeErrorDetails(error),
    });
    return { ok: false, error: GENERIC_ERROR, errorType: "server" };
  }

  try {
    const ref = await db.collection(COLLECTION).add(doc);

    if (deps.sendNotification) {
      try {
        await deps.sendNotification({ id: ref.id, ...doc });
      } catch (error) {
        console.error("[review-feedback] Notification failed after Firestore save.", {
          ...getReviewFeedbackLogContext(cleanPayload),
          id: ref.id,
          ...getSafeErrorDetails(error),
        });
      }
    }

    return await syncReviewFeedbackToCrm(ref, cleanPayload, submitCrmLeadFormImpl);
  } catch (error) {
    console.error("[review-feedback] Firestore save failed.", {
      ...getReviewFeedbackLogContext(cleanPayload),
      ...getSafeErrorDetails(error),
    });
    return { ok: false, error: GENERIC_ERROR, errorType: "server" };
  }
}

export async function submitReviewFeedback(payload: ReviewFeedbackInput): Promise<ReviewFeedbackResult> {
  return submitReviewFeedbackWithDeps(payload);
}
