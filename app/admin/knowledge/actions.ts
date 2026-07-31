"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  KNOWLEDGE_CMS_ADMIN_PATH,
  KnowledgeCmsAdminInputError,
  parseKnowledgeCmsCreateForm,
  parseKnowledgeCmsUpdateForm,
  type KnowledgeCmsAdminActionState,
} from "@/lib/knowledgeCmsAdmin";
import {
  createKnowledgeCmsAdminRecord,
  updateKnowledgeCmsAdminRecord,
} from "@/lib/knowledgeCmsAdminDal";
import { KnowledgeCmsAuthenticationError } from "@/lib/knowledgeCmsAdminAuth";
import {
  KnowledgeCmsAuthorizationError,
  KnowledgeCmsValidationError,
  type KnowledgeCmsRecordKind,
} from "@/lib/knowledgeCms";
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
      message: "This draft is not valid yet.",
      errors: error.errors,
    };
  }
  if (error instanceof KnowledgeCmsConflictError) {
    return {
      ok: false,
      message: "This draft changed in another session. Reload before saving.",
      conflict: true,
    };
  }
  if (
    error instanceof KnowledgeCmsAuthenticationError ||
    error instanceof KnowledgeCmsAuthorizationError
  ) {
    return {
      ok: false,
      message: "Your session cannot perform this action. Sign in again or contact an administrator.",
    };
  }
  if (error instanceof KnowledgeCmsNotFoundError) {
    return {
      ok: false,
      message: "This draft no longer exists.",
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
    message: "The draft could not be saved. Try again.",
  };
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
