import type { LeadRequestPayload } from "./leadPayload";

export const LEAD_GENERIC_ERROR_MESSAGE = "Something went wrong. Please call us instead.";
export const LEAD_NETWORK_ERROR_MESSAGE = "Network error. Please call us instead.";

export interface LeadSubmissionApiResponse {
  ok?: boolean;
  id?: string;
  error?: string;
  crmSyncStatus?: "synced" | "failed";
  emailStatus?: "sent" | "failed";
}

export type LeadSubmissionResult =
  | { kind: "success"; data: LeadSubmissionApiResponse & { ok: true } }
  | { kind: "api-error"; message: string }
  | { kind: "network-error"; message: string };

function getApiErrorMessage(data: unknown): string {
  if (data && typeof data === "object") {
    const error = (data as { error?: unknown }).error;
    if (typeof error === "string" && error.trim()) {
      return error.trim();
    }
  }

  return LEAD_GENERIC_ERROR_MESSAGE;
}

export function interpretLeadSubmissionResponse(
  response: Pick<Response, "status">,
  data: unknown,
): LeadSubmissionResult {
  if (
    (response.status === 200 || response.status === 201) &&
    data &&
    typeof data === "object" &&
    (data as LeadSubmissionApiResponse).ok === true
  ) {
    return { kind: "success", data: data as LeadSubmissionApiResponse & { ok: true } };
  }

  return {
    kind: "api-error",
    message: getApiErrorMessage(data),
  };
}

export async function submitLeadRequest(
  fetchImpl: typeof fetch,
  requestPayload: LeadRequestPayload,
): Promise<LeadSubmissionResult> {
  try {
    const response = await fetchImpl("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload),
    });

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      return { kind: "api-error", message: LEAD_GENERIC_ERROR_MESSAGE };
    }

    return interpretLeadSubmissionResponse(response, data);
  } catch {
    return { kind: "network-error", message: LEAD_NETWORK_ERROR_MESSAGE };
  }
}
