import { NextResponse } from "next/server";
import { submitLead, type LeadPayload, type LeadSource } from "@/lib/leads";
import type { UtmParams } from "@/lib/utm";

// firebase-admin requires Node APIs — opt out of the Edge runtime explicitly.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_SOURCES: LeadSource[] = [
  "homepage",
  "medicare-spokane",
  "turning-65",
  "compare-medicare-options",
  "working-past-65-medicare",
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

export async function POST(request: Request) {
  let body: Partial<LeadPayload> & Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
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

  try {
    const result = await submitLead(payload);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    // submitLead is supposed to catch its own errors, but belt-and-suspenders.
    console.error("[api/leads] unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: "We couldn't submit your request. Please try again or call us." },
      { status: 500 },
    );
  }
}
