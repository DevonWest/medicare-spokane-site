import "server-only";

import { buildCrmRequestVariants, extractCrmContactId, joinCrmUrl, type CrmLeadInput } from "./crmPayload";
import { CRM_CONTACT_PATHS } from "./crmPaths";
import { env, readRecordString } from "./runtimeValues";
const CRM_TIMEOUT_MS = 10_000;
const MAX_ERROR_MESSAGE_LENGTH = 500;

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

function extractCrmError(value: unknown, fallbackText: string): string | undefined {
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return (
      readRecordString(record, "error") ??
      readRecordString(record, "message") ??
      readRecordString(record, "detail") ??
      extractCrmError(record.error, fallbackText) ??
      extractCrmError(record.details, fallbackText)
    );
  }

  const trimmed = fallbackText.trim();
  return trimmed ? trimmed.slice(0, MAX_ERROR_MESSAGE_LENGTH) : undefined;
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
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify(variant.body),
          signal: AbortSignal.timeout(CRM_TIMEOUT_MS),
        });
      } catch (error) {
        lastFailure = {
          ok: false,
          path,
          error: error instanceof Error ? error.message : "CRM request failed.",
        };
        continue;
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

      // Some CRM implementations expect the contact fields to be nested under
      // `contact`, so retry once with the wrapped variant on validation errors.
      if ((response.status === 400 || response.status === 422) && variantIndex === 0) {
        continue;
      }

      return lastFailure;
    }
  }

  return lastFailure;
}
