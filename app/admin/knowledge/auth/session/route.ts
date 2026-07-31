import { NextResponse } from "next/server";
import {
  KnowledgeCmsAuthenticationError,
  createKnowledgeCmsSession,
  getKnowledgeCmsSessionCookieOptions,
  isSameOriginKnowledgeCmsRequest,
  KNOWLEDGE_CMS_SESSION_COOKIE,
} from "@/lib/knowledgeCmsAdminAuth";
import {
  isKnowledgeCmsEnabled,
  KnowledgeCmsDisabledError,
} from "@/lib/knowledgeCmsRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(
  body: Record<string, unknown>,
  status: number,
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!isKnowledgeCmsEnabled()) {
    return json({ ok: false }, 404);
  }
  if (!isSameOriginKnowledgeCmsRequest(request)) {
    return json({ ok: false }, 403);
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return json({ ok: false }, 415);
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > 20_000) {
    return json({ ok: false }, 413);
  }

  try {
    const body = (await request.json()) as { idToken?: unknown };
    if (
      typeof body.idToken !== "string" ||
      body.idToken.length < 100 ||
      body.idToken.length > 15_000
    ) {
      return json({ ok: false }, 400);
    }

    const session = await createKnowledgeCmsSession(body.idToken);
    const response = json(
      {
        ok: true,
      },
      200,
    );
    response.cookies.set(
      KNOWLEDGE_CMS_SESSION_COOKIE,
      session.sessionCookie,
      getKnowledgeCmsSessionCookieOptions(),
    );
    return response;
  } catch (error) {
    if (
      error instanceof KnowledgeCmsAuthenticationError ||
      error instanceof KnowledgeCmsDisabledError
    ) {
      return json({ ok: false }, 401);
    }
    console.error("[knowledge-cms] Session exchange failed.", error);
    return json({ ok: false }, 503);
  }
}
