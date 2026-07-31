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
import type {
  KnowledgeCmsArticleMigrationExecutionHistory,
  KnowledgeCmsArticleMigrationPostCreateVerification,
} from "./knowledgeCmsArticleMigrationVerification";
import type {
  KnowledgeCmsSupportingMigrationExecutionRequest,
} from "./knowledgeCmsSupportingMigrationExecution";
import type {
  KnowledgeCmsSupportingMigrationKind,
} from "./knowledgeCmsSupportingMigrationControl";
import {
  buildKnowledgeCmsSupportingMigrationExecutionHistory,
  type KnowledgeCmsSupportingMigrationExecutionHistory,
  type KnowledgeCmsSupportingMigrationPostCreateVerification,
} from "./knowledgeCmsSupportingMigrationVerification";
import {
  KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE_ENV,
} from "./knowledgeCmsRendererContract";
import {
  createKnowledgeCmsRepository,
  type KnowledgeCmsArticleMigrationRepository,
  type KnowledgeCmsRepository,
  type KnowledgeCmsSupportingMigrationRepository,
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
  executionHistory: KnowledgeCmsArticleMigrationExecutionHistory;
  supportingExecutionHistory?: KnowledgeCmsSupportingMigrationExecutionHistory;
}

export async function previewKnowledgeCmsArticleMaterialization(
  repository: Pick<KnowledgeCmsRepository, "list"> &
    Pick<
      KnowledgeCmsArticleMigrationRepository,
      "listArticleMigrationExecutions"
    > &
    Partial<Pick<
      KnowledgeCmsSupportingMigrationRepository,
      "listSupportingMigrationExecutions"
    >>,
  actor: KnowledgeCmsActor,
  now: Date = new Date(),
): Promise<KnowledgeCmsMigrationWorkspacePreview> {
  assertKnowledgeCmsActionAllowed(actor, "preview_migration");
  const [existingRecords, executionHistory, supportingExecutionHistory] =
    await Promise.all([
    readKnowledgeCmsMigrationInventory(repository),
    repository.listArticleMigrationExecutions(actor),
    repository.listSupportingMigrationExecutions
      ? repository.listSupportingMigrationExecutions(actor)
      : Promise.resolve(
          buildKnowledgeCmsSupportingMigrationExecutionHistory([]),
        ),
  ]);
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
    executionHistory,
    supportingExecutionHistory,
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

export async function getKnowledgeCmsAdminArticleMigrationVerification(
  recordId: string,
): Promise<KnowledgeCmsArticleMigrationPostCreateVerification | undefined> {
  const actor = await requireKnowledgeCmsActor();
  return createKnowledgeCmsRepository()
    .verifyArticleMigrationExecution(actor, recordId);
}

export async function executeKnowledgeCmsAdminSupportingMigrationDraft(
  request: KnowledgeCmsSupportingMigrationExecutionRequest,
): Promise<{
  id: string;
  kind: KnowledgeCmsSupportingMigrationKind;
  revision: 1;
  status: "draft";
}> {
  const actor = await requireKnowledgeCmsActor();
  const record = await createKnowledgeCmsRepository()
    .createSupportingMigrationDraft(actor, request);
  return {
    id: record.id,
    kind: record.kind,
    revision: 1,
    status: "draft",
  };
}

export async function getKnowledgeCmsAdminSupportingMigrationVerification(
  kind: KnowledgeCmsSupportingMigrationKind,
  recordId: string,
): Promise<KnowledgeCmsSupportingMigrationPostCreateVerification | undefined> {
  const actor = await requireKnowledgeCmsActor();
  return createKnowledgeCmsRepository()
    .verifySupportingMigrationExecution(actor, kind, recordId);
}
