import type { Metadata } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  getKnowledgeCmsNativeRepresentationControl,
} from "@/lib/knowledgeCmsNativeRepresentation";
import {
  renderKnowledgeCmsNativeRepresentation,
  renderKnowledgeCmsNativeRepresentationBody,
} from "@/lib/knowledgeCmsNativeRepresentationRenderer";
import {
  emitKnowledgeCmsPublicRendererEvent,
  loadKnowledgeCmsPublicRoute,
  type KnowledgeCmsPublicRendererResult,
} from "@/lib/knowledgeCmsPublicRenderer";
import {
  KNOWLEDGE_CMS_PUBLIC_CUTOVER_PROOF_HEADER,
  KNOWLEDGE_CMS_PUBLIC_CUTOVER_ROUTE_HEADER,
  getKnowledgeCmsPublicPathForEntryId,
  validateKnowledgeCmsInternalRendererRequest,
} from "@/lib/knowledgeCmsPublicRouting";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{ entryId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { entryId } = await params;
  const control = getKnowledgeCmsNativeRepresentationControl(entryId);
  if (!control) {
    return {
      robots: { index: false, follow: false, nocache: true },
    };
  }
  const metadata = control.target.metadata;
  return {
    title: metadata.pageTitle,
    description: metadata.description,
    alternates: { canonical: metadata.canonicalUrl },
    openGraph: {
      title: metadata.openGraphTitle,
      description: metadata.openGraphDescription,
      url: metadata.openGraphUrl,
    },
  };
}

export default async function KnowledgeCmsPublicRoute({ params }: PageProps) {
  const { entryId } = await params;
  const control = getKnowledgeCmsNativeRepresentationControl(entryId);
  const expectedPath = getKnowledgeCmsPublicPathForEntryId(entryId);
  if (!control || !expectedPath) {
    notFound();
  }
  const requestHeaders = await headers();
  if (
    !validateKnowledgeCmsInternalRendererRequest({
      entryId,
      pathHeader: requestHeaders.get(
        KNOWLEDGE_CMS_PUBLIC_CUTOVER_ROUTE_HEADER,
      ),
      proofHeader: requestHeaders.get(
        KNOWLEDGE_CMS_PUBLIC_CUTOVER_PROOF_HEADER,
      ),
    })
  ) {
    notFound();
  }

  let result = await loadKnowledgeCmsPublicRoute({ entryId });
  let renderedCandidate: ReactNode | undefined;
  if (result.outcome === "cms_candidate") {
    try {
      renderedCandidate = renderKnowledgeCmsNativeRepresentation(
        result.artifact,
        result.article,
      );
    } catch {
      result = {
        outcome: "static_fallback",
        entryId,
        path: expectedPath,
        reason: "artifact_invalid",
        elapsedMilliseconds: result.elapsedMilliseconds,
      } satisfies KnowledgeCmsPublicRendererResult;
    }
  }
  if (result.outcome === "cms_candidate") {
    emitKnowledgeCmsPublicRendererEvent(result);
    return <>{renderedCandidate}</>;
  }
  emitKnowledgeCmsPublicRendererEvent(result);
  return (
    <>
      {renderKnowledgeCmsNativeRepresentationBody(
        control.target.body,
        entryId,
      )}
    </>
  );
}
