import { NextResponse } from "next/server";
import { submitLead, type LeadPayload, type LeadSource } from "@/lib/leads";

const ALLOWED_SOURCES: LeadSource[] = [
  "homepage",
  "medicare-spokane",
  "turning-65",
  "advantage-vs-supplement",
  "contact",
  "unknown",
];

export async function POST(request: Request) {
  let body: Partial<LeadPayload> & Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const source: LeadSource = ALLOWED_SOURCES.includes(body.source as LeadSource)
    ? (body.source as LeadSource)
    : "unknown";

  const payload: LeadPayload = {
    fullName: String(body.fullName ?? "").slice(0, 200),
    email: String(body.email ?? "").slice(0, 200),
    phone: String(body.phone ?? "").slice(0, 50),
    zip: body.zip ? String(body.zip).slice(0, 10) : undefined,
    message: body.message ? String(body.message).slice(0, 2000) : undefined,
    source,
  };

  const result = await submitLead(payload);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
