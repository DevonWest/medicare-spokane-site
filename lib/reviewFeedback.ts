import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import { getFirebaseAdminEnvSummary, getFirestoreAdmin } from "./firebase-admin";
import { SITE_SOURCE } from "./leadConstants";
import { getSafeErrorDetails } from "./leadLogging";
import { normalizeEmail, normalizePhone } from "./leadValidation";
import {
  sanitizeReviewSlug,
  sanitizeReviewString,
  type ReviewFeedbackInput,
  validateReviewFeedbackInput,
} from "./reviewFlow";
import { getTeamMemberBySlug, getTeamMemberSlug, isReviewableTeamMember } from "./team";

const COLLECTION = process.env.REVIEW_FEEDBACK_COLLECTION?.trim() || "review_feedback";
const GENERIC_ERROR = "We couldn't submit your feedback. Please call us at 509-353-0476.";

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

export interface ReviewFeedbackPayload {
  fullName: string;
  email: string;
  phone?: string;
  agentSlug?: string;
  rating: number;
  message: string;
  sourcePath?: string;
}

export interface ReviewFeedbackResult {
  ok: boolean;
  id?: string;
  error?: string;
  errorType?: "validation" | "server";
}

interface ReviewFeedbackDependencies {
  getFirestoreAdmin?: () => Firestore;
  sendNotification?: (feedback: Record<string, unknown> & { id: string }) => Promise<void>;
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

export function buildReviewFeedbackDocument(payload: ReviewFeedbackPayload, nowMs: number): Record<string, unknown> {
  const resolvedMember = payload.agentSlug ? getTeamMemberBySlug(payload.agentSlug) : undefined;
  const reviewableMember = resolvedMember && isReviewableTeamMember(resolvedMember) ? resolvedMember : undefined;
  const agentSlug = reviewableMember
    ? getTeamMemberSlug(reviewableMember)
    : sanitizeReviewSlug(payload.agentSlug) ?? null;
  const agentName = reviewableMember?.name ?? null;
  const email = normalizeEmail(payload.email);
  const phone = sanitizeReviewString(payload.phone);
  const phoneNorm = phone ? normalizePhone(phone) : null;

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
    sourcePath: sanitizeReviewString(payload.sourcePath) ?? "/review/feedback",
    submittedAt: Timestamp.fromMillis(nowMs),
    submittedAtIso: new Date(nowMs).toISOString(),
    createdAt: FieldValue.serverTimestamp(),
    status: "new",
    siteSource: SITE_SOURCE,
  });
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

    return { ok: true, id: ref.id };
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
