import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { isKnowledgeCmsEnabled } from "@/lib/knowledgeCmsRepository";
import {
  isKnowledgeCmsSeoEnabled,
  runKnowledgeCmsSeoScan,
} from "@/lib/knowledgeCmsSeoDal";
import { env } from "@/lib/runtimeValues";
import { hasCurrentKnowledgeCmsContinuousSeoActivation } from "@/lib/knowledgeCmsCopilotActivation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function continuousSeoEnabled(): boolean {
  return process.env.KNOWLEDGE_CMS_CONTINUOUS_SEO_ENABLED === "true";
}

function suppliedToken(request: Request): string | undefined {
  const authorization = request.headers.get("authorization")?.trim();
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim() || undefined;
  }
  return request.headers.get("x-knowledge-cms-seo-token")?.trim() || undefined;
}

function validToken(request: Request): boolean {
  const expected = env("KNOWLEDGE_CMS_SEO_CRON_TOKEN");
  const supplied = suppliedToken(request);
  if (!expected || expected.length < 32 || !supplied) return false;
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  return (
    expectedBytes.length === suppliedBytes.length &&
    timingSafeEqual(expectedBytes, suppliedBytes)
  );
}

export async function POST(request: Request) {
  if (
    !isKnowledgeCmsEnabled() ||
    !isKnowledgeCmsSeoEnabled() ||
    !continuousSeoEnabled()
  ) {
    return new NextResponse(null, { status: 404 });
  }
  if (!validToken(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!(await hasCurrentKnowledgeCmsContinuousSeoActivation())) {
    return NextResponse.json(
      { error: "activation_unverified" },
      { status: 503 },
    );
  }

  try {
    const scan = await runKnowledgeCmsSeoScan({
      trigger: "scheduled",
      actor: {
        id: "knowledge-cms-seo-scheduler",
        roles: ["admin"],
      },
    });
    if (
      process.env.KNOWLEDGE_CMS_SEARCH_CONSOLE_ENABLED === "true" &&
      scan.searchConsoleStatus !== "available"
    ) {
      return NextResponse.json(
        { error: "search_console_unavailable" },
        { status: 503 },
      );
    }
    return NextResponse.json({
      status: "ok",
      scanId: scan.id,
      completedAt: scan.completedAt,
      opportunities: scan.summary.totalOpportunities,
      critical: scan.summary.critical,
      high: scan.summary.high,
    });
  } catch (error) {
    console.error("[knowledge-cms-seo] Scheduled scan failed.", {
      error: error instanceof Error ? error.name : "unknown",
    });
    return NextResponse.json({ error: "scan_failed" }, { status: 503 });
  }
}
