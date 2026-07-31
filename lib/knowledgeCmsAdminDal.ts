import "server-only";

import {
  KNOWLEDGE_CMS_RECORD_KINDS,
  toKnowledgeCmsAdminRecordDto,
  toKnowledgeCmsAdminRecordSummaryDto,
  type KnowledgeCmsAdminRecordDto,
  type KnowledgeCmsAdminRecordSummaryDto,
} from "./knowledgeCmsAdmin";
import type {
  KnowledgeCmsCreateInput,
  KnowledgeCmsRecordKind,
  KnowledgeCmsUpdateInput,
} from "./knowledgeCms";
import { requireKnowledgeCmsActor } from "./knowledgeCmsAdminAuth";
import {
  KnowledgeCmsNotFoundError,
  createKnowledgeCmsRepository,
} from "./knowledgeCmsRepository";
import { KnowledgeCmsWorkflow } from "./knowledgeCmsWorkflow";

function createWorkflow(): KnowledgeCmsWorkflow {
  return new KnowledgeCmsWorkflow(createKnowledgeCmsRepository());
}

export async function listKnowledgeCmsAdminRecords(): Promise<
  KnowledgeCmsAdminRecordSummaryDto[]
> {
  const actor = await requireKnowledgeCmsActor();
  const workflow = createWorkflow();
  const records = (
    await Promise.all(
      KNOWLEDGE_CMS_RECORD_KINDS.map((kind) =>
        workflow.list({ kind }, actor),
      ),
    )
  ).flat();

  return records
    .map((record) => toKnowledgeCmsAdminRecordSummaryDto(record, actor))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function getKnowledgeCmsAdminRecord(
  kind: KnowledgeCmsRecordKind,
  id: string,
): Promise<KnowledgeCmsAdminRecordDto> {
  const actor = await requireKnowledgeCmsActor();
  const record = await createWorkflow().get(kind, id, actor);
  if (!record) {
    throw new KnowledgeCmsNotFoundError(kind, id);
  }
  return toKnowledgeCmsAdminRecordDto(record, actor);
}

export async function createKnowledgeCmsAdminRecord(
  input: KnowledgeCmsCreateInput,
): Promise<{ id: string; kind: KnowledgeCmsRecordKind; revision: number }> {
  const actor = await requireKnowledgeCmsActor();
  const record = await createWorkflow().create(input, actor);
  return {
    id: record.id,
    kind: record.kind,
    revision: record.audit.revision,
  };
}

export async function updateKnowledgeCmsAdminRecord(
  kind: KnowledgeCmsRecordKind,
  id: string,
  input: KnowledgeCmsUpdateInput,
  expectedRevision: number,
): Promise<{ revision: number }> {
  const actor = await requireKnowledgeCmsActor();
  const record = await createWorkflow().update(
    kind,
    id,
    input,
    expectedRevision,
    actor,
  );
  return { revision: record.audit.revision };
}
