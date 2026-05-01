import "server-only";

import { buildCrmRequestVariants, extractCrmContactId, joinCrmUrl, type CrmLeadInput } from "./crmPayload";

const CRM_CONTACT_PATHS = ["contacts", "api/contacts", "developer-api/contacts", "api/developer/contacts"] as const;
const CRM_TIMEOUT_MS = 10_000;

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

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
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
