"use client";

import { useActionState, useState } from "react";
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
  const [confirmation, setConfirmation] = useState("");
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
  const confirmed = confirmation === confirmationPhrase;

  return (
    <form
      action={formAction}
      className="rounded-xl border border-violet-300 bg-violet-50 p-4"
    >
      <p className="font-bold text-violet-950">
        Create one private {kind} draft
      </p>
      <p className="mt-2 text-xs leading-5 text-violet-900">
        The server reconstructs this governed control and atomically checks the
        document, slug, optional canonical path, search projection, and audit
        event. No public experience, indexing, or other candidate changes.
      </p>
      <label
        className="mt-3 block text-xs font-semibold text-slate-800"
        htmlFor={`supporting-migration-confirmation-${controlId}`}
      >
        Type <span className="font-mono">{confirmationPhrase}</span>
      </label>
      <input
        autoComplete="off"
        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-950 outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
        id={`supporting-migration-confirmation-${controlId}`}
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
        className="mt-3 rounded-lg bg-violet-700 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={!confirmed || pending}
        type="submit"
      >
        {pending ? "Creating private draft…" : `Create ${targetTitle}`}
      </button>
    </form>
  );
}
