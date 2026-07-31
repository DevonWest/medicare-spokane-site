"use client";

import { useActionState } from "react";
import {
  createKnowledgeCmsArticleMigrationDraftAction,
} from "../actions";
import {
  initialKnowledgeCmsAdminActionState,
} from "@/lib/knowledgeCmsAdmin";

export interface KnowledgeArticleMigrationExecutionControlProps {
  controlId: string;
  controlFingerprint: string;
  confirmationPhrase: string;
  targetTitle: string;
}

export default function KnowledgeArticleMigrationExecutionControl({
  controlId,
  controlFingerprint,
  confirmationPhrase,
  targetTitle,
}: KnowledgeArticleMigrationExecutionControlProps) {
  const boundAction =
    createKnowledgeCmsArticleMigrationDraftAction.bind(
      null,
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
      className="rounded-xl border border-amber-300 bg-amber-50 p-4"
    >
      <p className="font-bold text-amber-950">
        Create one private draft
      </p>
      <p className="mt-2 text-xs leading-5 text-amber-900">
        This creates only the CMS draft and its transactional locks and audit
        event, then opens a fresh read-only verification receipt. The verified
        static page stays public, indexing stays blocked, and no other control
        is executed.
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
        className="mt-3 rounded-lg bg-amber-700 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={pending}
        type="submit"
      >
        {pending ? "Creating private draft…" : `Create ${targetTitle}`}
      </button>
    </form>
  );
}
