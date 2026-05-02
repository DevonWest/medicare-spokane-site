import { cleanString, normalizeEmail, normalizePhone } from "./leadValidation";

export const GOOGLE_REVIEW_URL = "https://g.page/r/CWQwLoKlN3KFEBM/review";

const CONTROL_CHAR_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALIDATION_ERROR_ORDER = ["fullName", "email", "rating", "message", "sourcePath"] as const;

export interface ReviewFeedbackInput {
  fullName?: string;
  email?: string;
  phone?: string;
  agentSlug?: string;
  rating?: number;
  message?: string;
  sourcePath?: string;
}

export interface ReviewFeedbackValidationResult {
  ok: boolean;
  errors: Record<string, string>;
  error?: string;
}

export function sanitizeReviewString(raw: string | undefined | null): string | undefined {
  if (raw === undefined || raw === null) return undefined;
  return cleanString(String(raw).replace(CONTROL_CHAR_RE, ""));
}

export function sanitizeReviewSlug(raw: string | undefined | null): string | undefined {
  const value = sanitizeReviewString(raw);
  if (!value) return undefined;
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getReviewRatingValue(raw: unknown): number | undefined {
  if (typeof raw === "number" && Number.isInteger(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    const parsed = Number.parseInt(raw, 10);
    return Number.isInteger(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function isInternalFeedbackRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 4;
}

export function getReviewRatingLabel(rating: number): string {
  return `${rating} star${rating === 1 ? "" : "s"}`;
}

export function getReviewValidationErrorMessage(errors: Record<string, string>): string {
  for (const field of VALIDATION_ERROR_ORDER) {
    const error = errors[field];
    if (error) return error;
  }
  return "Please review your feedback and try again.";
}

export function validateReviewFeedbackInput(input: ReviewFeedbackInput): ReviewFeedbackValidationResult {
  const errors: Record<string, string> = {};

  const fullName = sanitizeReviewString(input.fullName);
  if (!fullName || fullName.length < 2) errors.fullName = "Name is required.";
  else if (fullName.length > 200) errors.fullName = "Name is too long.";

  const email = normalizeEmail(sanitizeReviewString(input.email));
  if (!email) errors.email = "Email is required.";
  else if (!EMAIL_RE.test(email) || email.length > 200) errors.email = "Email is invalid.";

  const phoneDigits = normalizePhone(sanitizeReviewString(input.phone));
  if (phoneDigits && (phoneDigits.length < 7 || phoneDigits.length > 15)) {
    errors.phone = "Phone is invalid.";
  }

  if (!isInternalFeedbackRating(input.rating ?? NaN)) {
    errors.rating = "Please choose a rating between 1 and 4 stars.";
  }

  const message = sanitizeReviewString(input.message);
  if (!message) errors.message = "Please share what happened.";
  else if (message.length > 2000) errors.message = "Message is too long.";

  const sourcePath = sanitizeReviewString(input.sourcePath);
  if (sourcePath && !sourcePath.startsWith("/")) {
    errors.sourcePath = "Please refresh the page and try again.";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    error: getReviewValidationErrorMessage(errors),
  };
}

export function getReviewRatingDestination(agentSlug: string | undefined, rating: number): string {
  if (rating === 5) return GOOGLE_REVIEW_URL;

  const params = new URLSearchParams();
  const cleanAgentSlug = sanitizeReviewSlug(agentSlug);
  if (cleanAgentSlug) params.set("agent", cleanAgentSlug);
  params.set("rating", String(rating));

  return `/review/feedback?${params.toString()}`;
}
