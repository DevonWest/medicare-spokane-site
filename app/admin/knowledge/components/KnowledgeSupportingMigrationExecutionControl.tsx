"use client";

import { useActionState } from "react";
import { initialKnowledgeCmsAdminActionState } from "@/lib/knowledgeCmsAdmin";
import { createKnowledgeCmsSupportingMigrationDraftAction } from "../actions";

export interface KnowledgeSupportingMigrationExecutionControlProps {
  kind: "topic" | "faq";
  controlId: string;
  controlFingerprint: string;
  confirmationPhrase: string;
  targetTitle: string;
}

export default function KnowledgeSupportingMigrationExecutionControl({
  kind,
  controlId,
  controlFingerprint,
  confirmationPhrase,
  targetTitle,
}: KnowledgeSupportingMigrationExecutionControlProps) {
  const boundAction = createKnowledgeCmsSupportingMigrationDraftAction.bind(
    null,
    kind,
    controlId,
    controlFingerprint,
  );
  const [state, formAction, pending] = useActionState(
    boundAction,
    initialKnowledgeCmsAdminActionState,
  );
  return (
    <form
      action={formAction}
      className="min-w-0 rounded-xl border border-violet-300 bg-violet-50 p-4"
    >
      <p className="font-bold text-violet-950">
        Create one private {kind} draft
      </p>
      <p className="mt-2 text-xs leading-5 text-violet-900">
        The server reconstructs this governed control and atomically checks the
        document, slug, optional canonical path, search projection, and audit
        event. No public experience, indexing, or other candidate changes.
      </p>
      <input
        name="confirmation"
        type="hidden"
        value={confirmationPhrase}
      />
      {state.message ? (
        <p
          aria-live="polite"
          className={`mt-3 text-xs font-semibold ${
            state.ok ? "text-emerald-800" : "text-red-800"
          }`}
        >
          {state.message}
        </p>
      ) : null}
      <button
        className="mt-3 w-full rounded-lg bg-violet-700 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={pending}
        type="submit"
      >
        {pending ? "Creating private draft…" : `Create ${targetTitle}`}
      </button>
    </form>
  );
}
