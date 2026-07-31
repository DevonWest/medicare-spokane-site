"use client";

import { useActionState, useState } from "react";
import { initialKnowledgeCmsAdminActionState } from "@/lib/knowledgeCmsAdmin";
import { createKnowledgeCmsPublicCutoverApprovalAction } from "../actions";

export default function KnowledgePublicCutoverApprovalControl({
  receipt,
  confirmationPhrase,
}: {
  receipt: string;
  confirmationPhrase: string;
}) {
  const [confirmation, setConfirmation] = useState("");
  const boundAction = createKnowledgeCmsPublicCutoverApprovalAction.bind(
    null,
    receipt,
  );
  const [state, formAction, pending] = useActionState(
    boundAction,
    initialKnowledgeCmsAdminActionState,
  );
  const confirmed = confirmation === confirmationPhrase;

  return (
    <form
      action={formAction}
      className="mt-6 rounded-xl border border-red-300 bg-red-50 p-5"
    >
      <p className="font-bold text-red-950">
        Create one expiring cutover approval
      </p>
      <p className="mt-2 text-xs leading-5 text-red-900">
        This writes only an immutable approval and audit event after a fresh
        server-side reread of all 22 article revisions and rendering artifacts.
        It does not deploy, route traffic, change a CMS record, or enable public
        rendering. Only an authenticated administrator may submit it.
      </p>
      <label
        className="mt-3 block text-xs font-semibold text-slate-800"
        htmlFor="public-cutover-confirmation"
      >
        Type <span className="break-all font-mono">{confirmationPhrase}</span>
      </label>
      <input
        autoComplete="off"
        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-950 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100"
        id="public-cutover-confirmation"
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
        className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={!confirmed || pending || state.conflict}
        type="submit"
      >
        {pending ? "Creating approval…" : "Create guarded approval"}
      </button>
    </form>
  );
}
