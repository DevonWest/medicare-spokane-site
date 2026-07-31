import "server-only";

import { requireKnowledgeCmsActor } from "./knowledgeCmsAdminAuth";
import type {
  KnowledgeCmsNativeRepresentationExecutionRequest,
} from "./knowledgeCmsNativeRepresentationExecution";
import { createKnowledgeCmsRepository } from "./knowledgeCmsRepository";

export async function executeKnowledgeCmsAdminNativeRepresentation(
  request: KnowledgeCmsNativeRepresentationExecutionRequest,
): Promise<{
  id: string;
  entryId: string;
  articleId: string;
  articleRevision: number;
}> {
  const actor = await requireKnowledgeCmsActor();
  const artifact = await createKnowledgeCmsRepository()
    .createArticleRendering(actor, request);
  return {
    id: artifact.id,
    entryId: artifact.entryId,
    articleId: artifact.article.id,
    articleRevision: artifact.article.revision,
  };
}
