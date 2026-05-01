export interface LeadSuccessResponse {
  ok: true;
  id: string;
}

export interface LeadErrorResponse {
  ok: false;
  error: string;
}

export type LeadApiResponse = LeadSuccessResponse | LeadErrorResponse;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isLeadSuccessResponse(value: unknown): value is LeadSuccessResponse {
  return isRecord(value) && value.ok === true && typeof value.id === "string" && value.id.trim().length > 0;
}

export function isLeadErrorResponse(value: unknown): value is LeadErrorResponse {
  return isRecord(value) && value.ok === false && typeof value.error === "string" && value.error.trim().length > 0;
}
