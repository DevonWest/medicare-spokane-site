"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  KNOWLEDGE_CMS_ADMIN_PATH,
  KnowledgeCmsAdminInputError,
  isKnowledgeCmsRecordId,
  isKnowledgeCmsRecordKind,
  parseKnowledgeCmsArticleMigrationExecutionForm,
  parseKnowledgeCmsNativeRepresentationExecutionForm,
  parseKnowledgeCmsPublicCutoverApprovalForm,
  parseKnowledgeCmsSupportingMigrationExecutionForm,
  parseKnowledgeCmsCreateForm,
  parseKnowledgeCmsUpdateForm,
  parseKnowledgeCmsWorkflowForm,
  type KnowledgeCmsAdminActionState,
} from "@/lib/knowledgeCmsAdmin";
import {
  approveKnowledgeCmsAdminRecord,
  createKnowledgeCmsAdminRecord,
  publishKnowledgeCmsAdminRecord,
  requestKnowledgeCmsAdminRecordChanges,
  submitKnowledgeCmsAdminRecordForReview,
  unpublishKnowledgeCmsAdminRecord,
  updateKnowledgeCmsAdminRecord,
} from "@/lib/knowledgeCmsAdminDal";
import {
  executeKnowledgeCmsAdminArticleMigrationDraft,
  executeKnowledgeCmsAdminSupportingMigrationDraft,
} from "@/lib/knowledgeCmsMigrationDal";
import { KnowledgeCmsAuthenticationError } from "@/lib/knowledgeCmsAdminAuth";
import {
  KnowledgeCmsAuthorizationError,
  KnowledgeCmsValidationError,
  type KnowledgeCmsRecordKind,
} from "@/lib/knowledgeCms";
import {
  KnowledgeCmsArticleMigrationExecutionError,
} from "@/lib/knowledgeCmsArticleMigrationExecution";
import {
  KnowledgeCmsSupportingMigrationExecutionError,
} from "@/lib/knowledgeCmsSupportingMigrationExecution";
import {
  KnowledgeCmsNativeRepresentationExecutionError,
} from "@/lib/knowledgeCmsNativeRepresentationExecution";
import {
  executeKnowledgeCmsAdminNativeRepresentation,
} from "@/lib/knowledgeCmsNativeRepresentationDal";
import {
  KnowledgeCmsPublicCutoverApprovalError,
  executeKnowledgeCmsPublicCutoverApproval,
} from "@/lib/knowledgeCmsPublicCutoverDal";
import {
  KnowledgeCmsReviewerVerificationError,
  KnowledgeCmsStateError,
} from "@/lib/knowledgeCmsWorkflow";
import {
  KnowledgeCmsConflictError,
  KnowledgeCmsDisabledError,
  KnowledgeCmsNotFoundError,
} from "@/lib/knowledgeCmsRepository";

function errorState(error: unknown): KnowledgeCmsAdminActionState {
  if (error instanceof KnowledgeCmsAdminInputError) {
    return {
      ok: false,
      message: "Check the highlighted content and try again.",
      errors: error.errors,
    };
  }
  if (error instanceof KnowledgeCmsValidationError) {
    return {
      ok: false,
      message: "This record is not ready for that action.",
      errors: error.errors,
    };
  }
  if (error instanceof KnowledgeCmsArticleMigrationExecutionError) {
    if (error.reason === "execution_disabled") {
      return {
        ok: false,
        message: "Private-draft migration execution is not enabled.",
      };
    }
    if (error.reason === "confirmation_mismatch") {
      return {
        ok: false,
        message:
          "The confirmation phrase did not exactly match this private draft.",
      };
    }
    return {
      ok: false,
      message:
        "This migration control changed or is no longer valid. Reload the migration preview before continuing.",
      conflict: true,
    };
  }
  if (error instanceof KnowledgeCmsSupportingMigrationExecutionError) {
    if (error.reason === "execution_disabled") {
      return {
        ok: false,
        message: "Topic and FAQ private-draft migration is not enabled.",
      };
    }
    if (error.reason === "confirmation_mismatch") {
      return {
        ok: false,
        message:
          "The confirmation phrase did not exactly match this private draft.",
      };
    }
    return {
      ok: false,
      message:
        "This topic or FAQ control changed or is no longer valid. Reload the migration preview before continuing.",
      conflict: true,
    };
  }
  if (error instanceof KnowledgeCmsNativeRepresentationExecutionError) {
    if (error.reason === "execution_disabled") {
      return {
        ok: false,
        message: "Private rendering artifact execution is not enabled.",
      };
    }
    if (error.reason === "confirmation_mismatch") {
      return {
        ok: false,
        message:
          "The confirmation phrase did not exactly match this private rendering.",
      };
    }
    return {
      ok: false,
      message:
        "This rendering control or published article changed. Reload the shadow workspace before continuing.",
      conflict: true,
    };
  }
  if (error instanceof KnowledgeCmsPublicCutoverApprovalError) {
    if (error.reason === "approval_disabled") {
      return {
        ok: false,
        message: "Public cutover approval execution is not enabled.",
      };
    }
    if (error.reason === "confirmation_mismatch") {
      return {
        ok: false,
        message: "The public cutover approval phrase did not match exactly.",
      };
    }
    return {
      ok: false,
      message:
        "The cutover evidence changed or the immutable approval already exists. Refresh the preview.",
      conflict: true,
    };
  }
  if (error instanceof KnowledgeCmsConflictError) {
    return {
      ok: false,
      message: "This record changed in another session. Reload before continuing.",
      conflict: true,
    };
  }
  if (error instanceof KnowledgeCmsStateError) {
    return {
      ok: false,
      message:
        "This record is no longer in the required workflow state. Reload before trying again.",
      conflict: true,
    };
  }
  if (error instanceof KnowledgeCmsReviewerVerificationError) {
    return {
      ok: false,
      message:
        "A current verified licensed-reviewer identity is required for this action.",
    };
  }
  if (
    error instanceof KnowledgeCmsAuthenticationError ||
    error instanceof KnowledgeCmsAuthorizationError
  ) {
    if (
      error instanceof KnowledgeCmsAuthorizationError &&
      error.reason === "reviewer_publisher_separation_required"
    ) {
      return {
        ok: false,
        message:
          "The approving reviewer cannot publish the same record. A different authorized publisher is required.",
      };
    }
    return {
      ok: false,
      message: "Your session cannot perform this action. Sign in again or contact an administrator.",
    };
  }
  if (error instanceof KnowledgeCmsNotFoundError) {
    return {
      ok: false,
      message: "This record no longer exists.",
    };
  }
  if (error instanceof KnowledgeCmsDisabledError) {
    return {
      ok: false,
      message: "The editorial workspace is not enabled.",
    };
  }

  console.error("[knowledge-cms] Admin action failed.", error);
  return {
    ok: false,
    message: "The record could not be updated. Try again.",
  };
}

function assertValidRecordTarget(
  kind: unknown,
  id: unknown,
): asserts kind is KnowledgeCmsRecordKind {
  if (!isKnowledgeCmsRecordKind(kind) || !isKnowledgeCmsRecordId(id)) {
    throw new KnowledgeCmsAdminInputError([
      "The requested CMS record is invalid.",
    ]);
  }
}

export async function createKnowledgeCmsDraftAction(
  _previousState: KnowledgeCmsAdminActionState,
  formData: FormData,
): Promise<KnowledgeCmsAdminActionState> {
  let destination: string;
  try {
    const input = parseKnowledgeCmsCreateForm(formData);
    const created = await createKnowledgeCmsAdminRecord(input);
    destination = `${KNOWLEDGE_CMS_ADMIN_PATH}/${created.kind}/${encodeURIComponent(created.id)}`;
  } catch (error) {
    return errorState(error);
  }

  revalidatePath(KNOWLEDGE_CMS_ADMIN_PATH);
  redirect(destination);
}

export async function updateKnowledgeCmsDraftAction(
  kind: KnowledgeCmsRecordKind,
  id: string,
  _previousState: KnowledgeCmsAdminActionState,
  formData: FormData,
): Promise<KnowledgeCmsAdminActionState> {
  try {
    assertValidRecordTarget(kind, id);
    const { input, expectedRevision } = parseKnowledgeCmsUpdateForm(
      formData,
      kind,
    );
    const updated = await updateKnowledgeCmsAdminRecord(
      kind,
      id,
      input,
      expectedRevision,
    );
    revalidatePath(KNOWLEDGE_CMS_ADMIN_PATH);
    revalidatePath(
      `${KNOWLEDGE_CMS_ADMIN_PATH}/${kind}/${encodeURIComponent(id)}`,
    );
    return {
      ok: true,
      message: "Draft saved.",
      revision: updated.revision,
    };
  } catch (error) {
    return errorState(error);
  }
}

export async function submitKnowledgeCmsForReviewAction(
  kind: KnowledgeCmsRecordKind,
  id: string,
  _previousState: KnowledgeCmsAdminActionState,
  formData: FormData,
): Promise<KnowledgeCmsAdminActionState> {
  try {
    assertValidRecordTarget(kind, id);
    const { expectedRevision } = parseKnowledgeCmsWorkflowForm(
      formData,
      "submit_for_review",
    );
    const updated = await submitKnowledgeCmsAdminRecordForReview(
      kind,
      id,
      expectedRevision,
    );
    revalidatePath(KNOWLEDGE_CMS_ADMIN_PATH);
    revalidatePath(
      `${KNOWLEDGE_CMS_ADMIN_PATH}/${kind}/${encodeURIComponent(id)}`,
    );
    return {
      ok: true,
      message: "Submitted for review.",
      revision: updated.revision,
    };
  } catch (error) {
    return errorState(error);
  }
}

export async function requestKnowledgeCmsChangesAction(
  kind: KnowledgeCmsRecordKind,
  id: string,
  _previousState: KnowledgeCmsAdminActionState,
  formData: FormData,
): Promise<KnowledgeCmsAdminActionState> {
  try {
    assertValidRecordTarget(kind, id);
    const { expectedRevision, decisionNote } =
      parseKnowledgeCmsWorkflowForm(formData, "request_changes");
    const updated = await requestKnowledgeCmsAdminRecordChanges(
      kind,
      id,
      expectedRevision,
      decisionNote!,
    );
    revalidatePath(KNOWLEDGE_CMS_ADMIN_PATH);
    revalidatePath(
      `${KNOWLEDGE_CMS_ADMIN_PATH}/${kind}/${encodeURIComponent(id)}`,
    );
    return {
      ok: true,
      message: "Changes requested and returned to draft.",
      revision: updated.revision,
    };
  } catch (error) {
    return errorState(error);
  }
}

export async function approveKnowledgeCmsRecordAction(
  kind: KnowledgeCmsRecordKind,
  id: string,
  _previousState: KnowledgeCmsAdminActionState,
  formData: FormData,
): Promise<KnowledgeCmsAdminActionState> {
  try {
    assertValidRecordTarget(kind, id);
    const { expectedRevision, decisionNote } =
      parseKnowledgeCmsWorkflowForm(formData, "approve");
    const updated = await approveKnowledgeCmsAdminRecord(
      kind,
      id,
      expectedRevision,
      decisionNote!,
    );
    revalidatePath(KNOWLEDGE_CMS_ADMIN_PATH);
    revalidatePath(
      `${KNOWLEDGE_CMS_ADMIN_PATH}/${kind}/${encodeURIComponent(id)}`,
    );
    return {
      ok: true,
      message:
        "Approved for publisher review. This record is still private and unpublished.",
      revision: updated.revision,
    };
  } catch (error) {
    return errorState(error);
  }
}

export async function publishKnowledgeCmsRecordAction(
  kind: KnowledgeCmsRecordKind,
  id: string,
  _previousState: KnowledgeCmsAdminActionState,
  formData: FormData,
): Promise<KnowledgeCmsAdminActionState> {
  try {
    assertValidRecordTarget(kind, id);
    const {
      expectedRevision,
      indexing,
      canonicalPathConfirmation,
      decisionNote,
    } = parseKnowledgeCmsWorkflowForm(formData, "publish");
    const updated = await publishKnowledgeCmsAdminRecord(
      kind,
      id,
      expectedRevision,
      indexing!,
      canonicalPathConfirmation,
      decisionNote!,
    );
    revalidatePath(KNOWLEDGE_CMS_ADMIN_PATH);
    revalidatePath(
      `${KNOWLEDGE_CMS_ADMIN_PATH}/${kind}/${encodeURIComponent(id)}`,
    );
    return {
      ok: true,
      message:
        "CMS publication recorded. This still does not add a public website page.",
      revision: updated.revision,
    };
  } catch (error) {
    return errorState(error);
  }
}

export async function unpublishKnowledgeCmsRecordAction(
  kind: KnowledgeCmsRecordKind,
  id: string,
  _previousState: KnowledgeCmsAdminActionState,
  formData: FormData,
): Promise<KnowledgeCmsAdminActionState> {
  try {
    assertValidRecordTarget(kind, id);
    const { expectedRevision, decisionNote } =
      parseKnowledgeCmsWorkflowForm(formData, "unpublish");
    const updated = await unpublishKnowledgeCmsAdminRecord(
      kind,
      id,
      expectedRevision,
      decisionNote!,
    );
    revalidatePath(KNOWLEDGE_CMS_ADMIN_PATH);
    revalidatePath(
      `${KNOWLEDGE_CMS_ADMIN_PATH}/${kind}/${encodeURIComponent(id)}`,
    );
    return {
      ok: true,
      message:
        "CMS publication withdrawn and its search projection removed. The record is now a draft.",
      revision: updated.revision,
    };
  } catch (error) {
    return errorState(error);
  }
}

export async function createKnowledgeCmsArticleMigrationDraftAction(
  controlId: string,
  controlFingerprint: string,
  _previousState: KnowledgeCmsAdminActionState,
  formData: FormData,
): Promise<KnowledgeCmsAdminActionState> {
  let destination: string;
  try {
    const request = parseKnowledgeCmsArticleMigrationExecutionForm(
      controlId,
      controlFingerprint,
      formData,
    );
    const created =
      await executeKnowledgeCmsAdminArticleMigrationDraft(request);
    destination = `${KNOWLEDGE_CMS_ADMIN_PATH}/migration-preview/${encodeURIComponent(created.id)}`;
  } catch (error) {
    return errorState(error);
  }

  revalidatePath(KNOWLEDGE_CMS_ADMIN_PATH);
  revalidatePath(`${KNOWLEDGE_CMS_ADMIN_PATH}/migration-preview`);
  redirect(destination);
}

export async function createKnowledgeCmsSupportingMigrationDraftAction(
  kind: "topic" | "faq",
  controlId: string,
  controlFingerprint: string,
  _previousState: KnowledgeCmsAdminActionState,
  formData: FormData,
): Promise<KnowledgeCmsAdminActionState> {
  let destination: string;
  try {
    const request = parseKnowledgeCmsSupportingMigrationExecutionForm(
      kind,
      controlId,
      controlFingerprint,
      formData,
    );
    const created =
      await executeKnowledgeCmsAdminSupportingMigrationDraft(request);
    destination = `${KNOWLEDGE_CMS_ADMIN_PATH}/migration-preview/supporting/${created.kind}/${encodeURIComponent(created.id)}`;
  } catch (error) {
    return errorState(error);
  }

  revalidatePath(KNOWLEDGE_CMS_ADMIN_PATH);
  revalidatePath(`${KNOWLEDGE_CMS_ADMIN_PATH}/migration-preview`);
  redirect(destination);
}

export async function createKnowledgeCmsNativeRepresentationAction(
  controlId: string,
  controlFingerprint: string,
  expectedArticleRevision: number,
  _previousState: KnowledgeCmsAdminActionState,
  formData: FormData,
): Promise<KnowledgeCmsAdminActionState> {
  let destination: string;
  try {
    const request = parseKnowledgeCmsNativeRepresentationExecutionForm(
      controlId,
      controlFingerprint,
      expectedArticleRevision,
      formData,
    );
    const created =
      await executeKnowledgeCmsAdminNativeRepresentation(request);
    destination = `${KNOWLEDGE_CMS_ADMIN_PATH}/shadow-preview?entry=${encodeURIComponent(created.entryId)}`;
  } catch (error) {
    return errorState(error);
  }

  revalidatePath(KNOWLEDGE_CMS_ADMIN_PATH);
  revalidatePath(`${KNOWLEDGE_CMS_ADMIN_PATH}/shadow-preview`);
  redirect(destination);
}

export async function createKnowledgeCmsPublicCutoverApprovalAction(
  receipt: string,
  _previousState: KnowledgeCmsAdminActionState,
  formData: FormData,
): Promise<KnowledgeCmsAdminActionState> {
  try {
    const request = parseKnowledgeCmsPublicCutoverApprovalForm(
      receipt,
      formData,
    );
    await executeKnowledgeCmsPublicCutoverApproval(request);
  } catch (error) {
    return errorState(error);
  }
  revalidatePath(`${KNOWLEDGE_CMS_ADMIN_PATH}/public-cutover`);
  redirect(
    `${KNOWLEDGE_CMS_ADMIN_PATH}/public-cutover?approved=${encodeURIComponent(receipt)}`,
  );
}
