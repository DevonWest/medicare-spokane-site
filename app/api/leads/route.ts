import { NextResponse } from "next/server";
import { submitLead, type LeadPayload, type LeadSource } from "@/lib/leads";
import { getFirebaseAdminEnvSummary } from "@/lib/firebase-admin";
import { getSafeErrorDetails } from "@/lib/leadLogging";
import type { LeadRequestPayload } from "@/lib/leadPayload";
import type { LeadErrorResponse, LeadSuccessResponse } from "@/lib/leadResponse";
import { cleanString, validateLeadRequest } from "@/lib/leadValidation";
import type { UtmParams } from "@/lib/utm";

// firebase-admin requires Node APIs — opt out of the Edge runtime explicitly.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_SOURCES: LeadSource[] = [
  "homepage",
  "medicare-spokane",
  "turning-65",
  "helping-parent-with-medicare",
  "compare-medicare-options",
  "working-past-65-medicare",
  "turning-65-medicare-spokane",
  "medicare-appointment-checklist",
  "medicare-plan-review-spokane",
  "advantage-vs-supplement",
  "medicare-advantage",
  "medicare-supplements",
  "medicare-part-d",
  "supplemental-insurance",
  "carriers",
  "testimonials",
  "about",
  "request-contact",
  "medicare-faq",
  "medicare-enrollment-resources",
  "contact",
  "unknown",
];

const UTM_KEYS: Array<keyof UtmParams> = ["source", "medium", "campaign", "term", "content"];

function clip(value: unknown, max: number): string | undefined {
  if (value === undefined || value === null) return undefined;
  const str = String(value);
  if (!str) return undefined;
  return str.slice(0, max);
}

function sanitizeUtm(value: unknown): UtmParams | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Record<string, unknown>;
  const out: UtmParams = {};
  for (const key of UTM_KEYS) {
    const v = clip(raw[key], 200);
    if (v) out[key] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

function getRequestLogContext(payload: Partial<LeadPayload>, source: LeadSource): Record<string, unknown> {
  const firebase = getFirebaseAdminEnvSummary();

  return {
    source,
    sourcePath: cleanString(payload.sourcePath) ?? null,
    hasZip: Boolean(cleanString(payload.zip)),
    hasMessage: Boolean(cleanString(payload.message)),
    hasReferrer: Boolean(cleanString(payload.referrer)),
    utmKeys: payload.utm ? Object.keys(payload.utm) : [],
    hasClientSubmittedAt: Boolean(cleanString(payload.clientSubmittedAt)),
    firebaseAdminConfigured: firebase.configured,
    hasFirebaseProjectId: firebase.hasFirebaseProjectId,
  };
}

export async function POST(request: Request) {
  let body: Partial<LeadRequestPayload> & Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    const firebase = getFirebaseAdminEnvSummary();
    console.warn("[api/leads] Invalid JSON payload.", {
      contentType: request.headers.get("content-type") ?? null,
      firebaseAdminConfigured: firebase.configured,
      hasFirebaseProjectId: firebase.hasFirebaseProjectId,
    });
    return NextResponse.json<LeadErrorResponse>({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const source: LeadSource = ALLOWED_SOURCES.includes(body.source as LeadSource)
    ? (body.source as LeadSource)
    : "unknown";

  const payload: LeadPayload = {
    fullName: clip(body.fullName, 200) ?? "",
    email: clip(body.email, 200) ?? "",
    phone: clip(body.phone, 50) ?? "",
    zip: clip(body.zip, 10),
    message: clip(body.message, 2000),
    source,
    sourcePath: clip(body.sourcePath, 500),
    referrer: clip(body.referrer, 500),
    utm: sanitizeUtm(body.utm),
    clientSubmittedAt: clip(body.clientSubmittedAt, 40),
  };

  const validation = validateLeadRequest(payload);
  if (!validation.ok) {
    console.warn("[api/leads] Validation failed.", {
      ...getRequestLogContext(payload, source),
      errors: validation.errors,
    });
    return NextResponse.json<LeadErrorResponse>({ ok: false, error: validation.error! }, { status: 400 });
  }

  try {
    const result = await submitLead(payload);
    if (result.ok) {
      return NextResponse.json<LeadSuccessResponse>({ ok: true, id: result.id }, { status: 200 });
    }

    return NextResponse.json<LeadErrorResponse>(
      { ok: false, error: result.error },
      { status: result.errorType === "validation" ? 400 : 500 },
    );
  } catch (err) {
    // submitLead is supposed to catch its own errors, but belt-and-suspenders.
    console.error("[api/leads] Unexpected route error.", {
      ...getRequestLogContext(payload, source),
      ...getSafeErrorDetails(err),
    });
    return NextResponse.json<LeadErrorResponse>(
      { ok: false, error: "We couldn't submit your request. Please call us at 509-353-0476." },
      { status: 500 },
    );
  }
}
