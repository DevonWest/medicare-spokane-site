/**
 * Pure, dependency-free helpers for validating and normalizing lead
 * submissions. Kept separate from `lib/leads.ts` (which talks to
 * Firestore) so they can be unit-tested without any backend.
 */

/** Window in which a repeat submission from the same person is treated as a duplicate. */
export const DUPLICATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

/** Strip everything except digits — what we use as the canonical phone identity. */
export function normalizePhone(raw: string | undefined): string {
  if (!raw) return "";
  return raw.replace(/\D+/g, "");
}

/** Lower-case + trim email; the canonical email identity. */
export function normalizeEmail(raw: string | undefined): string {
  if (!raw) return "";
  return raw.trim().toLowerCase();
}

/** Trim a free-form string, returning `undefined` if it ends up empty. */
export function cleanString(raw: string | undefined | null): string | undefined {
  if (raw === undefined || raw === null) return undefined;
  const s = String(raw).trim();
  return s.length ? s : undefined;
}

/** Loose but defensible email regex (must contain `@` and a dot in the domain). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** US-style 5-digit ZIP. */
const ZIP_RE = /^\d{5}$/;
const VALIDATION_ERROR_ORDER = ["fullName", "email", "phone", "zip", "message", "sourcePath", "clientSubmittedAt"];

export interface LeadValidationInput {
  fullName?: string;
  email?: string;
  phone?: string;
  zip?: string;
  message?: string;
}

export interface LeadRequestValidationInput extends LeadValidationInput {
  sourcePath?: string;
  clientSubmittedAt?: string;
}

export interface LeadValidationResult {
  ok: boolean;
  /** Field-level errors, suitable for internal logging only. */
  errors: Record<string, string>;
  /** First safe validation error suitable for users. */
  error?: string;
}

export function getLeadValidationErrorMessage(errors: Record<string, string>): string {
  for (const field of VALIDATION_ERROR_ORDER) {
    const error = errors[field];
    if (error) return error;
  }
  return "Please review your submission and try again.";
}

/**
 * Validate the user-provided portion of a lead. Pure function — no I/O.
 *
 * Rules:
 *  - `fullName` is required, 2..200 chars after trim.
 *  - `email` is required and must look like an email.
 *  - `phone` is required and must contain at least 7 digits (strip non-digits first).
 *  - `zip`, if provided, must be a 5-digit US ZIP.
 *  - `message`, if present, max 2000 chars.
 */
export function validateLead(input: LeadValidationInput): LeadValidationResult {
  const errors: Record<string, string> = {};

  const name = cleanString(input.fullName);
  if (!name || name.length < 2) errors.fullName = "Full name is required.";
  else if (name.length > 200) errors.fullName = "Name is too long.";

  const email = normalizeEmail(input.email);
  if (!email) errors.email = "Email is required.";
  else if (!EMAIL_RE.test(email) || email.length > 200) errors.email = "Email is invalid.";

  const phoneDigits = normalizePhone(input.phone);
  if (!phoneDigits) errors.phone = "Phone is required.";
  else if (phoneDigits.length < 7 || phoneDigits.length > 15) errors.phone = "Phone is invalid.";

  const zip = cleanString(input.zip);
  if (zip && !ZIP_RE.test(zip)) errors.zip = "ZIP code must be 5 digits.";

  const message = cleanString(input.message);
  if (message && message.length > 2000) errors.message = "Message is too long.";

  return { ok: Object.keys(errors).length === 0, errors, error: getLeadValidationErrorMessage(errors) };
}

export function validateLeadRequest(input: LeadRequestValidationInput): LeadValidationResult {
  const base = validateLead(input);
  const errors = { ...base.errors };

  const sourcePath = cleanString(input.sourcePath);
  if (!sourcePath || !sourcePath.startsWith("/")) {
    errors.sourcePath = "Please refresh the page and try again.";
  }

  const clientSubmittedAt = cleanString(input.clientSubmittedAt);
  if (!clientSubmittedAt || Number.isNaN(Date.parse(clientSubmittedAt))) {
    errors.clientSubmittedAt = "Please refresh the page and try again.";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    error: getLeadValidationErrorMessage(errors),
  };
}

/**
 * Decide whether a lead should be treated as a duplicate of `existing`,
 * given the current time. Uses a fixed window so it can be unit tested
 * deterministically.
 */
export function isDuplicateWithinWindow(
  existingSubmittedAtMs: number,
  nowMs: number,
  windowMs: number = DUPLICATE_WINDOW_MS,
): boolean {
  if (!Number.isFinite(existingSubmittedAtMs) || !Number.isFinite(nowMs)) return false;
  return nowMs - existingSubmittedAtMs < windowMs && nowMs - existingSubmittedAtMs >= 0;
}
