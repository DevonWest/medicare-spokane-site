import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { cleanString, normalizeEmail, normalizePhone } from "./leadValidation";
import { CRM_SYNC_STATUS, SITE_SOURCE } from "./leadConstants";
import type { UtmParams } from "./utm";

export interface LeadFirestoreDocumentInput {
  fullName: string;
  email: string;
  phone: string;
  zip?: string;
  message?: string;
  source: string;
  sourcePath?: string;
  referrer?: string;
  utm?: UtmParams;
  clientSubmittedAt?: string;
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

export function buildLeadFirestoreDocument(payload: LeadFirestoreDocumentInput, nowMs: number): Record<string, unknown> {
  const emailNorm = normalizeEmail(payload.email);
  const phoneNorm = normalizePhone(payload.phone);
  const nameClean = cleanString(payload.fullName) ?? "";
  const zipClean = cleanString(payload.zip);
  const messageClean = cleanString(payload.message);
  const utm = stripUndefinedDeep(payload.utm);

  return stripUndefinedDeep({
    fullName: nameClean,
    email: emailNorm,
    phone: payload.phone.trim(),
    emailNorm,
    phoneNorm,
    zip: zipClean ?? null,
    message: messageClean ?? null,
    source: payload.source,
    sourcePath: cleanString(payload.sourcePath) ?? null,
    referrer: cleanString(payload.referrer) ?? null,
    utm: utm && Object.keys(utm).length ? utm : null,
    clientSubmittedAt: cleanString(payload.clientSubmittedAt) ?? null,
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
  });
}
