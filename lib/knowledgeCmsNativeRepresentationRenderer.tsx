import "server-only";

import parse from "html-react-parser";
import type { ReactNode } from "react";
import type { KnowledgeCmsArticle } from "./knowledgeCms";
import { replaceKnowledgeCmsPublicLeadForm } from "./knowledgeCmsPublicLeadFormAdapter";
import {
  decodeKnowledgeCmsNativeRepresentationBody,
  validateKnowledgeCmsNativeRepresentationArtifact,
  type KnowledgeCmsNativeRepresentationArtifact,
  type KnowledgeCmsNativeRepresentationBody,
} from "./knowledgeCmsNativeRepresentation";

export function renderKnowledgeCmsNativeRepresentationBody(
  body: KnowledgeCmsNativeRepresentationBody,
  entryId?: string,
): ReactNode {
  return parse(decodeKnowledgeCmsNativeRepresentationBody(body).html, {
    replace: entryId
      ? (node, index) =>
          replaceKnowledgeCmsPublicLeadForm(entryId, node, index)
      : undefined,
  });
}

export function renderKnowledgeCmsNativeRepresentation(
  artifact: KnowledgeCmsNativeRepresentationArtifact,
  article?: KnowledgeCmsArticle,
): ReactNode {
  const errors = validateKnowledgeCmsNativeRepresentationArtifact(
    artifact,
    article,
  );
  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }
  return renderKnowledgeCmsNativeRepresentationBody(
    artifact.body,
    artifact.entryId,
  );
}

export default function KnowledgeCmsNativeRepresentationRenderer({
  artifact,
  article,
}: {
  artifact: KnowledgeCmsNativeRepresentationArtifact;
  article?: KnowledgeCmsArticle;
}) {
  return <>{renderKnowledgeCmsNativeRepresentation(artifact, article)}</>;
}
