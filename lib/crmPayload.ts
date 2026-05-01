import { readRecordString } from "./runtimeValues";
import { SITE_SOURCE } from "./leadConstants";
import { cleanString, normalizeEmail } from "./leadValidation";
import type { UtmParams } from "./utm";

export interface CrmLeadInput {
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

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is Exclude<typeof item, undefined> => item !== undefined)
      .map((item) => stripUndefined(item)) as T;
  }

  if (value && Object.prototype.toString.call(value) === "[object Object]") {
    const out: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      if (nestedValue === undefined) continue;
      out[key] = stripUndefined(nestedValue);
    }
    return out as T;
  }

  return value;
}

export function joinCrmUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export function buildCrmFormSubmissionPayload(lead: CrmLeadInput): Record<string, unknown> {
  return stripUndefined({
    fullName: cleanString(lead.fullName) ?? "",
    email: normalizeEmail(lead.email),
    phone: cleanString(lead.phone) ?? "",
    zip: cleanString(lead.zip),
    message: cleanString(lead.message),
    source: lead.source,
    sourcePath: cleanString(lead.sourcePath),
    referrer: cleanString(lead.referrer),
    utm: lead.utm,
    clientSubmittedAt: cleanString(lead.clientSubmittedAt),
    siteSource: SITE_SOURCE,
  });
}

export function extractCrmContactId(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;

  const record = value as Record<string, unknown>;

  return (
    readRecordString(record, "id") ??
    readRecordString(record, "contactId") ??
    extractCrmContactId(record.contact) ??
    extractCrmContactId(record.data)
  );
}
