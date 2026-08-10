import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getLegacyDirectoryRedirect,
  getLegacyPathResolution,
  isKnownDirectoryPath,
} from "@/lib/legacyRedirects";
import {
  KNOWLEDGE_CMS_INTERNAL_RENDERER_PREFIX,
  KNOWLEDGE_CMS_PUBLIC_CUTOVER_PROOF_HEADER,
  KNOWLEDGE_CMS_PUBLIC_CUTOVER_RESPONSE_HEADER,
  KNOWLEDGE_CMS_PUBLIC_CUTOVER_ROUTE_HEADER,
  createKnowledgeCmsPublicCutoverRouteProof,
  getKnowledgeCmsEntryIdForPublicPath,
  getKnowledgeCmsEntryIdForInternalRendererPath,
  isKnowledgeCmsInternalRendererPath,
  resolveKnowledgeCmsPublicRouting,
  validateKnowledgeCmsInternalRendererRequest,
} from "@/lib/knowledgeCmsPublicRouting";

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

  // Enforce the same slashless URL shape used by page canonicals, internal
  // links, and the sitemap. Preserve meaningful query parameters.
  if (pathname.length > 1 && pathname.endsWith("/")) {
    const redirectUrl = new URL(request.url);
    redirectUrl.pathname = stripTrailingSlash(pathname);

    return NextResponse.redirect(redirectUrl, 301);
  }

  if (isKnowledgeCmsInternalRendererPath(pathname)) {
    const internalEntryId =
      getKnowledgeCmsEntryIdForInternalRendererPath(pathname);
    if (
      internalEntryId &&
      validateKnowledgeCmsInternalRendererRequest({
        entryId: internalEntryId,
        pathHeader: request.headers.get(
          KNOWLEDGE_CMS_PUBLIC_CUTOVER_ROUTE_HEADER,
        ),
        proofHeader: request.headers.get(
          KNOWLEDGE_CMS_PUBLIC_CUTOVER_PROOF_HEADER,
        ),
      })
    ) {
      const response = NextResponse.next();
      response.headers.set(
        KNOWLEDGE_CMS_PUBLIC_CUTOVER_RESPONSE_HEADER,
        "routed",
      );
      response.headers.set("Cache-Control", "no-store");
      return response;
    }
    return new NextResponse(null, {
      status: 404,
      headers: {
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  }

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

  const publicRouting = resolveKnowledgeCmsPublicRouting();
  const cutoverEntryId = publicRouting.routingEnabled
    ? getKnowledgeCmsEntryIdForPublicPath(pathname)
    : undefined;
  if (cutoverEntryId) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `${KNOWLEDGE_CMS_INTERNAL_RENDERER_PREFIX}/${cutoverEntryId}`;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(
      KNOWLEDGE_CMS_PUBLIC_CUTOVER_ROUTE_HEADER,
      pathname,
    );
    requestHeaders.set(
      KNOWLEDGE_CMS_PUBLIC_CUTOVER_PROOF_HEADER,
      createKnowledgeCmsPublicCutoverRouteProof({
        entryId: cutoverEntryId,
        path: pathname,
        receipt: publicRouting.approvalReceipt!,
      }),
    );
    const response = NextResponse.rewrite(rewriteUrl, {
      request: { headers: requestHeaders },
    });
    response.headers.set(
      KNOWLEDGE_CMS_PUBLIC_CUTOVER_RESPONSE_HEADER,
      "routed",
    );
    response.headers.set("Cache-Control", "no-store");
    return response;
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
