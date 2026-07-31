import "server-only";

import parse from "html-react-parser";
import type { ReactNode } from "react";
import type { KnowledgeCmsArticle } from "./knowledgeCms";
import {
  decodeKnowledgeCmsNativeRepresentationBody,
  validateKnowledgeCmsNativeRepresentationArtifact,
  type KnowledgeCmsNativeRepresentationArtifact,
} from "./knowledgeCmsNativeRepresentation";

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
  const evidence = decodeKnowledgeCmsNativeRepresentationBody(
    artifact.body,
  );
  return parse(evidence.html);
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
