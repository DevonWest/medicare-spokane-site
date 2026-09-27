import type { LeadSource } from "./leadSources";
import type { UtmParams } from "./utm";
import { contactReason } from "./contactReasons";

export interface LeadFormFields {
  fullName: string;
  email: string;
  phone: string;
  zip?: string;
  message?: string;
}

export interface LeadRequestPayload extends LeadFormFields {
  source: LeadSource;
  sourcePath: string;
  referrer?: string;
  utm?: UtmParams;
  clientSubmittedAt: string;
}

export function buildLeadFormFields(formData: FormData, showMessage: boolean, showRequestReason = false): LeadFormFields {
  const zip = String(formData.get("zip") ?? "");
  const message = showMessage ? String(formData.get("message") ?? "") : undefined;
  const reason = showRequestReason ? contactReason(formData.get("requestReason")) : undefined;

  return {
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    zip: zip.trim() ? zip : undefined,
    // Keep the existing API/CRM contract: the selected reason accompanies the message.
    message: reason ? [`Request reason: ${reason}`, message].filter(Boolean).join("\n\n") : message,
  };
}

export function buildLeadRequestPayload({
  fields,
  source,
  sourcePath,
  referrer,
  utm,
  clientSubmittedAt,
}: {
  fields: LeadFormFields;
  source: LeadSource;
  sourcePath: string;
  referrer?: string;
  utm?: UtmParams;
  clientSubmittedAt: string;
}): LeadRequestPayload {
  return {
    ...fields,
    source,
    sourcePath,
    referrer,
    utm,
    clientSubmittedAt,
  };
}
