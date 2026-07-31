"use client";

import { useActionState, useState } from "react";
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
  const [confirmation, setConfirmation] = useState("");
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
  const confirmed = confirmation === confirmationPhrase;

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
        event. The verified static page stays public, indexing stays blocked,
        and no other control is executed.
      </p>
      <label
        className="mt-3 block text-xs font-semibold text-slate-800"
        htmlFor={`migration-confirmation-${controlId}`}
      >
        Type <span className="font-mono">{confirmationPhrase}</span>
      </label>
      <input
        autoComplete="off"
        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        id={`migration-confirmation-${controlId}`}
        maxLength={300}
        name="confirmation"
        onChange={(event) => setConfirmation(event.target.value)}
        required
        spellCheck={false}
        type="text"
        value={confirmation}
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
        disabled={!confirmed || pending}
        type="submit"
      >
        {pending ? "Creating private draft…" : `Create ${targetTitle}`}
      </button>
    </form>
  );
}
