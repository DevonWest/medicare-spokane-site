import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getLegacyRedirectDestination } from "@/lib/legacyRedirects";

const apexHostname = "medicareinspokane.com";
const canonicalHostname = "www.medicareinspokane.com";

function normalizeHostname(hostname: string | null): string | null {
  if (!hostname) {
    return null;
  }

  const candidate = hostname.split(",")[0]?.trim();

  if (!candidate) {
    return null;
  }

  try {
    return new URL(`http://${candidate}`).hostname.toLowerCase();
  } catch {
    return candidate.replace(/:\d+$/, "").toLowerCase();
  }
}

function getRequestHostname(request: NextRequest): string {
  return (
    normalizeHostname(request.headers.get("x-forwarded-host")) ??
    normalizeHostname(request.headers.get("host")) ??
    request.nextUrl.hostname
  );
}

export function proxy(request: NextRequest) {
  if (getRequestHostname(request) === apexHostname) {
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
