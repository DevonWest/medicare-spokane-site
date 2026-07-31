import "server-only";

import {
  KNOWLEDGE_CMS_RECORD_KINDS,
} from "./knowledgeCmsAdmin";
import { requireKnowledgeCmsActor } from "./knowledgeCmsAdminAuth";
import {
  assertKnowledgeCmsActionAllowed,
  type KnowledgeCmsActor,
  type KnowledgeCmsRecord,
} from "./knowledgeCms";
import {
  buildKnowledgeCmsMigrationPreview,
  type KnowledgeCmsMigrationPreview,
} from "./knowledgeCmsMigration";
import {
  buildKnowledgeCmsArticleMaterializationDryRun,
  type KnowledgeCmsArticleMaterializationDryRun,
} from "./knowledgeCmsArticleMigrationDryRun";
import type {
  KnowledgeCmsArticleMigrationExecutionRequest,
} from "./knowledgeCmsArticleMigrationExecution";
import {
  KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE_ENV,
} from "./knowledgeCmsRendererContract";
import {
  createKnowledgeCmsRepository,
  type KnowledgeCmsRepository,
} from "./knowledgeCmsRepository";

export async function readKnowledgeCmsMigrationInventory(
  repository: Pick<KnowledgeCmsRepository, "list">,
): Promise<KnowledgeCmsRecord[]> {
  return (
    await Promise.all(
      KNOWLEDGE_CMS_RECORD_KINDS.map((kind) =>
        repository.list({ kind }),
      ),
    )
  ).flat();
}

export async function previewKnowledgeCmsMigration(
  repository: Pick<KnowledgeCmsRepository, "list">,
  actor: KnowledgeCmsActor,
  asOf: Date = new Date(),
): Promise<KnowledgeCmsMigrationPreview> {
  assertKnowledgeCmsActionAllowed(actor, "preview_migration");
  const existingRecords =
    await readKnowledgeCmsMigrationInventory(repository);
  return buildKnowledgeCmsMigrationPreview({
    asOf,
    existingRecords,
    rendererMode:
      process.env[KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE_ENV],
  });
}

export interface KnowledgeCmsMigrationWorkspacePreview {
  preview: KnowledgeCmsMigrationPreview;
  articleMaterializationDryRun: KnowledgeCmsArticleMaterializationDryRun;
}

export async function previewKnowledgeCmsArticleMaterialization(
  repository: Pick<KnowledgeCmsRepository, "list">,
  actor: KnowledgeCmsActor,
  now: Date = new Date(),
): Promise<KnowledgeCmsMigrationWorkspacePreview> {
  assertKnowledgeCmsActionAllowed(actor, "preview_migration");
  const existingRecords =
    await readKnowledgeCmsMigrationInventory(repository);
  const preview = buildKnowledgeCmsMigrationPreview({
    asOf: now,
    existingRecords,
    rendererMode:
      process.env[KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE_ENV],
  });
  return {
    preview,
    articleMaterializationDryRun:
      buildKnowledgeCmsArticleMaterializationDryRun({
        preview,
        existingRecords,
        actor,
        now,
      }),
  };
}

export async function getKnowledgeCmsAdminMigrationPreview(): Promise<KnowledgeCmsMigrationPreview> {
  const actor = await requireKnowledgeCmsActor();
  return previewKnowledgeCmsMigration(
    createKnowledgeCmsRepository(),
    actor,
  );
}

export async function getKnowledgeCmsAdminMigrationWorkspacePreview(): Promise<KnowledgeCmsMigrationWorkspacePreview> {
  const actor = await requireKnowledgeCmsActor();
  return previewKnowledgeCmsArticleMaterialization(
    createKnowledgeCmsRepository(),
    actor,
  );
}

export async function executeKnowledgeCmsAdminArticleMigrationDraft(
  request: KnowledgeCmsArticleMigrationExecutionRequest,
): Promise<{
  id: string;
  kind: "article";
  revision: 1;
  status: "draft";
}> {
  const actor = await requireKnowledgeCmsActor();
  const record = await createKnowledgeCmsRepository()
    .createArticleMigrationDraft(actor, request);
  return {
    id: record.id,
    kind: "article",
    revision: 1,
    status: "draft",
  };
}
