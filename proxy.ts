import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getLegacyRedirectDestination } from "@/lib/legacyRedirects";

export function proxy(request: NextRequest) {
  const destination = getLegacyRedirectDestination(request.nextUrl.pathname);

  if (!destination) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = destination;

  return NextResponse.redirect(redirectUrl, 301);
}
