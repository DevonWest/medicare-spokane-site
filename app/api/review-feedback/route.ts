import { NextResponse } from "next/server";
import { submitReviewFeedback, type ReviewFeedbackResult } from "@/lib/reviewFeedback";
import {
  getReviewRatingValue,
  REVIEW_FEEDBACK_SOURCE_PATH,
  sanitizeReviewSlug,
  sanitizeReviewString,
} from "@/lib/reviewFlow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clip(value: unknown, max: number): string | undefined {
  if (value === undefined || value === null) return undefined;
  const str = String(value);
  if (!str) return undefined;
  return str.slice(0, max);
}

function getReviewFeedbackResponseStatus(result: ReviewFeedbackResult): number {
  return result.ok ? 200 : result.errorType === "validation" ? 400 : 500;
}

export async function handleReviewFeedbackPost(
  request: Request,
  deps: { submitReviewFeedback?: typeof submitReviewFeedback } = {},
) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const payload = {
    fullName: sanitizeReviewString(clip(body.fullName, 200)) ?? "",
    email: sanitizeReviewString(clip(body.email, 200)) ?? "",
    phone: sanitizeReviewString(clip(body.phone, 50)),
    agentSlug: sanitizeReviewSlug(clip(body.agentSlug, 100)),
    rating: getReviewRatingValue(body.rating),
    message: sanitizeReviewString(clip(body.message, 2000)) ?? "",
    sourcePath: sanitizeReviewString(clip(body.sourcePath, 500)) ?? REVIEW_FEEDBACK_SOURCE_PATH,
  };

  const result = await (deps.submitReviewFeedback ?? submitReviewFeedback)(payload);
  if (result.ok) {
    return NextResponse.json(
      { ok: true, id: result.id, crmSyncStatus: result.crmSyncStatus },
      { status: getReviewFeedbackResponseStatus(result) },
    );
  }

  return NextResponse.json({ ok: false, error: result.error }, { status: getReviewFeedbackResponseStatus(result) });
}

export async function POST(request: Request) {
  return handleReviewFeedbackPost(request);
}
