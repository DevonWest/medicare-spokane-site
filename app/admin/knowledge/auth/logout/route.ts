import { NextResponse } from "next/server";
import {
  getKnowledgeCmsSessionCookieOptions,
  isSameOriginKnowledgeCmsRequest,
  KNOWLEDGE_CMS_SESSION_COOKIE,
} from "@/lib/knowledgeCmsAdminAuth";
import { isKnowledgeCmsEnabled } from "@/lib/knowledgeCmsRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  if (!isKnowledgeCmsEnabled()) {
    return new NextResponse(null, { status: 404 });
  }
  if (!isSameOriginKnowledgeCmsRequest(request)) {
    return NextResponse.json(
      { ok: false },
      {
        status: 403,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  const response = NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
  response.cookies.set(KNOWLEDGE_CMS_SESSION_COOKIE, "", {
    ...getKnowledgeCmsSessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}
