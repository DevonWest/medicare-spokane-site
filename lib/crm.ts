import "server-only";

import { buildCrmFormSubmissionPayload, extractCrmContactId, joinCrmUrl, type CrmLeadInput } from "./crmPayload";
import { CRM_PUBLIC_FORM_SUBMISSION_PATH } from "./crmPaths";
import { env, readRecordString } from "./runtimeValues";
const CRM_TIMEOUT_MS = 10_000;
const MAX_ERROR_MESSAGE_LENGTH = 500;

export interface CrmSubmissionResult {
  ok: boolean;
  contactId?: string;
  status?: number;
  path?: string;
  error?: string;
}

interface CrmConfig {
  baseUrl: string;
}

function getCrmConfig(): CrmConfig | null {
  const baseUrl = env("CRM_API_BASE_URL");

  if (!baseUrl) return null;

  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
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

/**
 * Submit a website lead to the CRM's public form endpoint.
 *
 * Returns the HTTP status and endpoint path for Firestore sync tracking, plus
 * any contact id the CRM chooses to expose in its response body.
 */
export async function submitCrmLeadForm(lead: CrmLeadInput): Promise<CrmSubmissionResult> {
  const config = getCrmConfig();
  if (!config) {
    return { ok: false, error: "CRM API is not configured." };
  }

  const path = CRM_PUBLIC_FORM_SUBMISSION_PATH;
  const url = joinCrmUrl(config.baseUrl, path);
  const payload = buildCrmFormSubmissionPayload(lead);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
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

  return {
    ok: false,
    path,
    status: response.status,
    error: extractCrmError(responseBody, responseText) ?? `CRM request failed with status ${response.status}.`,
  };
}
