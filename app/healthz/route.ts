import { NextResponse } from "next/server";

// Lightweight liveness probe for Cloud Run / uptime checks.
// Intentionally avoids any I/O (no Firestore, no external calls) so it stays
// fast and cannot fail because of downstream dependencies.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { status: "ok", uptime: process.uptime() },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
