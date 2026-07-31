import "server-only";

import { requireKnowledgeCmsActor } from "./knowledgeCmsAdminAuth";
import {
  assertKnowledgeCmsActionAllowed,
  type KnowledgeCmsActor,
  type KnowledgeCmsArticle,
} from "./knowledgeCms";
import {
  createKnowledgeCmsRepository,
  type KnowledgeCmsRepository,
} from "./knowledgeCmsRepository";
import {
  buildKnowledgeCmsShadowPreview,
  isKnowledgeCmsPrivateShadowEnabled,
  type KnowledgeCmsShadowPreview,
} from "./knowledgeCmsShadowRenderer";

export class KnowledgeCmsPrivateShadowDisabledError extends Error {
  readonly code = "knowledge_cms_private_shadow_disabled";

  constructor() {
    super(
      "Private Knowledge CMS shadow rendering requires exact shadow mode.",
    );
    this.name = "KnowledgeCmsPrivateShadowDisabledError";
  }
}

export async function previewKnowledgeCmsShadow(
  repository: Pick<KnowledgeCmsRepository, "list">,
  actor: KnowledgeCmsActor,
  options: {
    asOf?: Date;
    rendererMode?: string;
  } = {},
): Promise<KnowledgeCmsShadowPreview> {
  assertKnowledgeCmsActionAllowed(
    actor,
    "preview_shadow_rendering",
  );
  const rendererMode =
    options.rendererMode ??
    process.env.KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE;
  if (!isKnowledgeCmsPrivateShadowEnabled(rendererMode)) {
    throw new KnowledgeCmsPrivateShadowDisabledError();
  }

  const records = await repository.list({
    kind: "article",
  });
  const articles = records.filter(
    (record): record is KnowledgeCmsArticle =>
      record.kind === "article",
  );
  return buildKnowledgeCmsShadowPreview(articles, {
    asOf: options.asOf,
    rendererMode,
  });
}

export async function getKnowledgeCmsAdminShadowPreview(): Promise<KnowledgeCmsShadowPreview> {
  const actor = await requireKnowledgeCmsActor();
  return previewKnowledgeCmsShadow(
    createKnowledgeCmsRepository(),
    actor,
  );
}
