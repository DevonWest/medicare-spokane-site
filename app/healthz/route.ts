import { NextResponse } from "next/server";
import { resolveKnowledgeCmsPublicRouting } from "@/lib/knowledgeCmsPublicRouting";

// Lightweight liveness probe for Cloud Run / uptime checks.
// Intentionally avoids any I/O (no Firestore, no external calls) so it stays
// fast and cannot fail because of downstream dependencies.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  const publicRenderer = resolveKnowledgeCmsPublicRouting();
  return NextResponse.json(
    {
      status: "ok",
      uptime: process.uptime(),
      knowledgeCmsPublicRenderer: {
        requestedMode: publicRenderer.requestedMode,
        effectiveMode: publicRenderer.effectiveMode,
        routingEnabled: publicRenderer.routingEnabled,
        configurationValid: publicRenderer.configurationValid,
        environment: publicRenderer.environment,
        reason: publicRenderer.reason,
      },
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
