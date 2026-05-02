import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getLegacyRedirectDestination } from "@/lib/legacyRedirects";

const apexHostname = "medicareinspokane.com";
const canonicalHostname = "www.medicareinspokane.com";

export function proxy(request: NextRequest) {
  if (request.nextUrl.hostname === apexHostname) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.protocol = "https";
    redirectUrl.hostname = canonicalHostname;

    return NextResponse.redirect(redirectUrl, 301);
  }

  const destination = getLegacyRedirectDestination(request.nextUrl.pathname);

  if (!destination) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = destination;

  return NextResponse.redirect(redirectUrl, 301);
}
