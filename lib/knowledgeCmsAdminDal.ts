import "server-only";

import {
  KNOWLEDGE_CMS_RECORD_KINDS,
  toKnowledgeCmsAdminRecordDto,
  toKnowledgeCmsAdminRecordSummaryDto,
  type KnowledgeCmsAdminRecordDto,
  type KnowledgeCmsAdminRecordSummaryDto,
} from "./knowledgeCmsAdmin";
import { resolveCurrentEditorialReviewerVerification } from "./editorial";
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
  const reviewerVerified = actor.agentSlug
    ? Boolean(
        resolveCurrentEditorialReviewerVerification(
          actor.agentSlug,
          new Date(),
        ),
      )
    : false;
  return toKnowledgeCmsAdminRecordDto(record, actor, {
    reviewerVerified,
  });
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

export async function submitKnowledgeCmsAdminRecordForReview(
  kind: KnowledgeCmsRecordKind,
  id: string,
  expectedRevision: number,
): Promise<{ revision: number; status: "in_review" }> {
  const actor = await requireKnowledgeCmsActor();
  const record = await createWorkflow().transition(
    kind,
    id,
    {
      action: "submit_for_review",
      expectedRevision,
    },
    actor,
  );
  return { revision: record.audit.revision, status: "in_review" };
}

export async function requestKnowledgeCmsAdminRecordChanges(
  kind: KnowledgeCmsRecordKind,
  id: string,
  expectedRevision: number,
  feedback: string,
): Promise<{ revision: number; status: "draft" }> {
  const actor = await requireKnowledgeCmsActor();
  const now = new Date();
  const verification = actor.agentSlug
    ? resolveCurrentEditorialReviewerVerification(actor.agentSlug, now)
    : undefined;
  const workflow = new KnowledgeCmsWorkflow(createKnowledgeCmsRepository(), {
    now: () => now,
  });
  const record = await workflow.transition(
    kind,
    id,
    {
      action: "request_changes",
      expectedRevision,
      decisionNote: feedback,
      reviewerVerificationId: verification?.id,
    },
    actor,
  );
  return { revision: record.audit.revision, status: "draft" };
}
