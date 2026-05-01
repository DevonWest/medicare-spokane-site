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

interface CrmRequestVariant {
  label: "flat" | "wrapped";
  body: Record<string, unknown>;
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

function readString(record: Record<string, unknown>, key: string): string | undefined {
  return readRecordString(record, key);
}

export function joinCrmUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export function splitFullName(fullName: string): { firstName: string; lastName?: string } {
  const parts = (cleanString(fullName) ?? "").split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    throw new Error(`Full name is required to build the CRM contact payload. Received: '${fullName}'`);
  }
  if (parts.length === 1) return { firstName: parts[0] };

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export function buildCrmContactPayload(lead: CrmLeadInput): Record<string, unknown> {
  const { firstName, lastName } = splitFullName(lead.fullName);

  return stripUndefined({
    fullName: cleanString(lead.fullName) ?? "",
    firstName: cleanString(firstName) ?? "",
    lastName: cleanString(lastName),
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

export function buildCrmRequestVariants(lead: CrmLeadInput): CrmRequestVariant[] {
  const payload = buildCrmContactPayload(lead);
  return [
    { label: "flat", body: payload },
    { label: "wrapped", body: { contact: payload } },
  ];
}

export function extractCrmContactId(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;

  const record = value as Record<string, unknown>;

  return (
    readString(record, "id") ??
    readString(record, "contactId") ??
    extractCrmContactId(record.contact) ??
    extractCrmContactId(record.data)
  );
}
