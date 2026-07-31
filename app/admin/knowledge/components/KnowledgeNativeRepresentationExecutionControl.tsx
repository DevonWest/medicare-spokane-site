"use client";

import { useActionState, useState } from "react";
import { initialKnowledgeCmsAdminActionState } from "@/lib/knowledgeCmsAdmin";
import { createKnowledgeCmsNativeRepresentationAction } from "../actions";

export interface KnowledgeNativeRepresentationExecutionControlProps {
  controlId: string;
  controlFingerprint: string;
  expectedArticleRevision: number;
  confirmationPhrase: string;
  targetTitle: string;
}

export default function KnowledgeNativeRepresentationExecutionControl({
  controlId,
  controlFingerprint,
  expectedArticleRevision,
  confirmationPhrase,
  targetTitle,
}: KnowledgeNativeRepresentationExecutionControlProps) {
  const [confirmation, setConfirmation] = useState("");
  const boundAction = createKnowledgeCmsNativeRepresentationAction.bind(
    null,
    controlId,
    controlFingerprint,
    expectedArticleRevision,
  );
  const [state, formAction, pending] = useActionState(
    boundAction,
    initialKnowledgeCmsAdminActionState,
  );
  const confirmed = confirmation === confirmationPhrase;

  return (
    <form
      action={formAction}
      className="mt-6 rounded-xl border border-fuchsia-300 bg-fuchsia-50 p-5"
    >
      <p className="font-bold text-fuchsia-950">
        Create one immutable private rendering artifact
      </p>
      <p className="mt-2 text-xs leading-5 text-fuchsia-900">
        The server rereads the published article and creates only its exact
        lossless rendering artifact plus one audit event. Existing artifacts
        cannot be updated or overwritten, and this action grants no public
        cutover authority.
      </p>
      <label
        className="mt-3 block text-xs font-semibold text-slate-800"
        htmlFor={`native-rendering-confirmation-${controlId}`}
      >
        Type <span className="font-mono">{confirmationPhrase}</span>
      </label>
      <input
        autoComplete="off"
        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-950 outline-none focus:border-fuchsia-600 focus:ring-2 focus:ring-fuchsia-100"
        id={`native-rendering-confirmation-${controlId}`}
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
        className="mt-3 rounded-lg bg-fuchsia-700 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={!confirmed || pending || state.conflict}
        type="submit"
      >
        {pending ? "Creating private rendering…" : `Create ${targetTitle}`}
      </button>
    </form>
  );
}
