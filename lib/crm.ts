import "server-only";

import { cleanString, normalizeEmail } from "./leadValidation";
import type { UtmParams } from "./utm";

const CRM_CONTACT_PATHS = ["contacts", "api/contacts", "developer-api/contacts", "api/developer/contacts"] as const;
const CRM_TIMEOUT_MS = 10_000;

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

export interface CrmContactResult {
  ok: boolean;
  contactId?: string;
  status?: number;
  path?: string;
  error?: string;
}

interface CrmConfig {
  baseUrl: string;
  apiKey: string;
}

interface CrmRequestVariant {
  label: "flat" | "wrapped";
  body: Record<string, unknown>;
}

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
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

function getCrmConfig(): CrmConfig | null {
  const baseUrl = env("CRM_API_BASE_URL");
  const apiKey = env("CRM_API_KEY");

  if (!baseUrl || !apiKey) return null;

  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    apiKey,
  };
}

export function joinCrmUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export function splitFullName(fullName: string): { firstName: string; lastName?: string } {
  const parts = (cleanString(fullName) ?? "").split(/\s+/).filter(Boolean);

  if (parts.length === 0) return { firstName: "" };
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
    siteSource: "medicareinspokane.com",
  });
}

export function buildCrmRequestVariants(lead: CrmLeadInput): CrmRequestVariant[] {
  const payload = buildCrmContactPayload(lead);
  return [
    { label: "flat", body: payload },
    { label: "wrapped", body: { contact: payload } },
  ];
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
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

function extractCrmError(value: unknown, fallbackText: string): string | undefined {
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return (
      readString(record, "error") ??
      readString(record, "message") ??
      readString(record, "detail") ??
      extractCrmError(record.error, fallbackText) ??
      extractCrmError(record.details, fallbackText)
    );
  }

  const trimmed = fallbackText.trim();
  return trimmed ? trimmed.slice(0, 500) : undefined;
}

export async function createCrmContact(lead: CrmLeadInput): Promise<CrmContactResult> {
  const config = getCrmConfig();
  if (!config) {
    return { ok: false, error: "CRM API is not configured." };
  }

  const requestVariants = buildCrmRequestVariants(lead);
  let lastFailure: CrmContactResult = { ok: false, error: "CRM request failed." };

  for (const path of CRM_CONTACT_PATHS) {
    const url = joinCrmUrl(config.baseUrl, path);

    for (const [variantIndex, variant] of requestVariants.entries()) {
      let response: Response;
      try {
        response = await fetch(url, {
          method: "POST",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "x-api-key": config.apiKey,
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify(variant.body),
          signal: AbortSignal.timeout(CRM_TIMEOUT_MS),
        });
      } catch (error) {
        return {
          ok: false,
          path,
          error: error instanceof Error ? error.message : "CRM request failed.",
        };
      }

      const responseText = await response.text();
      const responseBody = tryParseJson(responseText);

      if (response.ok) {
        return {
          ok: true,
          path,
          status: response.status,
          contactId: extractCrmContactId(responseBody),
        };
      }

      lastFailure = {
        ok: false,
        path,
        status: response.status,
        error: extractCrmError(responseBody, responseText) ?? `CRM request failed with status ${response.status}.`,
      };

      if (response.status === 404 || response.status === 405) {
        break;
      }

      if ((response.status === 400 || response.status === 422) && variantIndex === 0) {
        continue;
      }

      return lastFailure;
    }
  }

  return lastFailure;
}
