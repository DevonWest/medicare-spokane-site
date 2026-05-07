import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getCanonicalDirectoryDestination,
  getLegacyPathResolution,
  isKnownDirectoryPath,
} from "@/lib/legacyRedirects";

const apexHostname = "medicareinspokane.com";
const canonicalHostname = "www.medicareinspokane.com";

function getRequestHostCandidate(hostHeader: string | null): string | null {
  if (!hostHeader) {
    return null;
  }

  const firstValue = hostHeader.split(",")[0];

  if (!firstValue) {
    return null;
  }

  const candidate = firstValue.trim().toLowerCase();

  return candidate || null;
}

function getRequestHost(request: NextRequest): string {
  return (
    getRequestHostCandidate(request.headers.get("x-forwarded-host")) ??
    getRequestHostCandidate(request.headers.get("host")) ??
    request.nextUrl.host.toLowerCase()
  );
}

export function proxy(request: NextRequest) {
  const requestHost = getRequestHost(request);

  if (requestHost === apexHostname || requestHost === `${apexHostname}:8080`) {
    const redirectUrl = new URL(request.url);
    redirectUrl.protocol = "https:";
    redirectUrl.hostname = canonicalHostname;
    redirectUrl.port = "";

    return NextResponse.redirect(redirectUrl, 301);
  }

  const canonicalDirectoryDestination = getCanonicalDirectoryDestination(request.nextUrl.pathname);

  if (canonicalDirectoryDestination) {
    const redirectUrl = new URL(request.url);
    const shouldRedirect = request.nextUrl.pathname !== canonicalDirectoryDestination;

    redirectUrl.pathname = canonicalDirectoryDestination;

    if (redirectUrl.searchParams.has("from")) {
      redirectUrl.searchParams.delete("from");
    }

    if (
      shouldRedirect ||
      redirectUrl.search !== request.nextUrl.search
    ) {
      if (!redirectUrl.searchParams.size) {
        redirectUrl.search = "";
      }

      return NextResponse.redirect(redirectUrl, 301);
    }

    if (!isKnownDirectoryPath(request.nextUrl.pathname)) {
      return new NextResponse(null, { status: 410 });
    }

    return NextResponse.next();
  }

  const legacyResolution = getLegacyPathResolution(request.nextUrl.pathname);

  if (!legacyResolution) {
    return NextResponse.next();
  }

  if (legacyResolution.type === "gone") {
    return new NextResponse(null, { status: 410 });
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = legacyResolution.destination;

  if (!legacyResolution.preserveQuery) {
    redirectUrl.search = "";
  }

  return NextResponse.redirect(redirectUrl, 301);
}
