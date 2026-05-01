import type { LeadSource } from "./leads";
import type { UtmParams } from "./utm";

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

export function buildLeadFormFields(formData: FormData, showMessage: boolean): LeadFormFields {
  const zip = String(formData.get("zip") ?? "");

  return {
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    zip: zip.trim() ? zip : undefined,
    message: showMessage ? String(formData.get("message") ?? "") : undefined,
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
