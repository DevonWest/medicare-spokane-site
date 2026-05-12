import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getLegacyDirectoryRedirect,
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

function stripTrailingSlash(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
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

  const pathname = request.nextUrl.pathname;
  const lowerPathname = pathname.toLowerCase();

  if (lowerPathname.startsWith("/directory/")) {
    const normalizedLowerPath = stripTrailingSlash(lowerPathname);

    // Legacy directory paths that should redirect to the closest active
    // local Medicare page take precedence over the generic 410 response.
    const legacyDirectoryDestination = getLegacyDirectoryRedirect(normalizedLowerPath);

    if (legacyDirectoryDestination) {
      const redirectUrl = new URL(request.url);
      redirectUrl.pathname = legacyDirectoryDestination;
      redirectUrl.search = "";

      return NextResponse.redirect(redirectUrl, 301);
    }

    if (isKnownDirectoryPath(normalizedLowerPath)) {
      const needsPathRewrite = pathname !== normalizedLowerPath;
      const hasFromQuery = request.nextUrl.searchParams.has("from");

      if (needsPathRewrite || hasFromQuery) {
        const redirectUrl = new URL(request.url);
        redirectUrl.pathname = normalizedLowerPath;

        if (hasFromQuery) {
          redirectUrl.searchParams.delete("from");
        }

        if (!redirectUrl.searchParams.size) {
          redirectUrl.search = "";
        }

        return NextResponse.redirect(redirectUrl, 301);
      }

      return NextResponse.next();
    }

    // Unknown legacy /directory/* path → 410 Gone regardless of case or
    // query string so Search Console drops it cleanly without producing a
    // soft-404 redirect chain.
    return new NextResponse(null, { status: 410 });
  }

  const legacyResolution = getLegacyPathResolution(pathname);

  if (!legacyResolution) {
    return NextResponse.next();
  }

  if (legacyResolution.type === "gone") {
    return new NextResponse(null, { status: 410 });
  }

  const redirectUrl = new URL(request.url);
  redirectUrl.pathname = legacyResolution.destination;

  if (!legacyResolution.preserveQuery) {
    redirectUrl.search = "";
  }

  return NextResponse.redirect(redirectUrl, 301);
}
