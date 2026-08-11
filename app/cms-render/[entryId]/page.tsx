import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import KnowledgeCmsPublishedArticle from "@/components/KnowledgeCmsPublishedArticle";
import {
  getKnowledgeCmsNativeRepresentationControl,
  validateKnowledgeCmsNativeRepresentationArtifact,
} from "@/lib/knowledgeCmsNativeRepresentation";
import {
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
  const result = await loadKnowledgeCmsPublicRoute({ entryId });
  const article = result.outcome === "cms_candidate" ? result.article : undefined;
  const metadata = control.target.metadata;
  const canonicalUrl = article?.discoverability.canonicalPath
    ? new URL(article.discoverability.canonicalPath, metadata.canonicalUrl).toString()
    : metadata.canonicalUrl;
  return {
    title: article?.discoverability.pageTitle ?? metadata.pageTitle,
    description: article?.discoverability.description ?? metadata.description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: article?.discoverability.pageTitle ?? metadata.openGraphTitle,
      description:
        article?.discoverability.description ?? metadata.openGraphDescription,
      url: canonicalUrl,
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
  if (result.outcome === "cms_candidate") {
    // Keep the immutable artifact validation as the fail-closed structure,
    // form, schema, canonical, and rollback proof. The approved article is
    // the public editorial body once that proof passes.
    const artifactErrors = validateKnowledgeCmsNativeRepresentationArtifact(
      result.artifact,
      result.article,
    );
    if (artifactErrors.length > 0) {
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
    return (
      <KnowledgeCmsPublishedArticle
        article={result.article}
        path={expectedPath}
      />
    );
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
