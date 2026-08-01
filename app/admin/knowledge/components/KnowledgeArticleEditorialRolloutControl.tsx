"use client";

import { useActionState } from "react";
import { publishNextGovernedKnowledgeCmsArticleAction } from "../actions";
import {
  initialKnowledgeCmsAdminActionState,
  type KnowledgeCmsAdminActionState,
} from "@/lib/knowledgeCmsAdmin";
import type {
  KnowledgeCmsArticleEditorialRolloutTarget,
} from "@/lib/knowledgeCmsArticleEditorialRollout";

type RolloutAction = (
  state: KnowledgeCmsAdminActionState,
  formData: FormData,
) => Promise<KnowledgeCmsAdminActionState>;

interface KnowledgeArticleEditorialRolloutControlProps {
  approvalNote: string;
  publicationNote: string;
  target: KnowledgeCmsArticleEditorialRolloutTarget;
}

function actionLabel(
  action: KnowledgeCmsArticleEditorialRolloutTarget["action"],
): string {
  if (action === "submit_approve_publish") {
    return "Submit, approve, and privately publish this article";
  }
  if (action === "approve_publish") {
    return "Approve and privately publish this article";
  }
  return "Privately publish this article";
}

export default function KnowledgeArticleEditorialRolloutControl({
  approvalNote,
  publicationNote,
  target,
}: KnowledgeArticleEditorialRolloutControlProps) {
  const action: RolloutAction =
    publishNextGovernedKnowledgeCmsArticleAction.bind(null, target.id);
  const [state, formAction, pending] = useActionState(
    action,
    initialKnowledgeCmsAdminActionState,
  );

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <input
        name="expectedRevision"
        type="hidden"
        value={target.revision}
      />
      <label className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
        <input
          className="mt-1 size-4 shrink-0"
          disabled={pending || state.conflict}
          name="reviewAttestation"
          required
          type="checkbox"
          value="confirmed"
        />
        <span>
          I reviewed this article&apos;s private migration record, current
          sources, metadata, and pinned static-route evidence. I am approving
          this specific revision for indexing-blocked private publication.
        </span>
      </label>
      <label className="block text-sm font-semibold text-slate-800">
        Approval audit note
        <textarea
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal text-slate-950 shadow-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          defaultValue={approvalNote}
          disabled={pending || state.conflict}
          maxLength={2_000}
          name="approvalNote"
          required
          rows={3}
        />
      </label>
      <label className="block text-sm font-semibold text-slate-800">
        Publication audit note
        <textarea
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal text-slate-950 shadow-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          defaultValue={publicationNote}
          disabled={pending || state.conflict}
          maxLength={2_000}
          name="publicationNote"
          required
          rows={3}
        />
      </label>
      <p className="text-sm leading-6 text-slate-600">
        This action advances only <strong>{target.title}</strong>. Each workflow
        state receives its own revision and audit event. It cannot enable
        indexing, public CMS routing, deployment, or cutover.
      </p>
      <button
        className="min-h-12 rounded-lg bg-violet-700 px-6 py-3 font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending || state.conflict || !target.action}
        type="submit"
      >
        {pending ? "Processing one article…" : actionLabel(target.action)}
      </button>
      {state.message ? (
        <div
          aria-live="polite"
          className={`rounded-lg border p-4 text-sm leading-6 ${
            state.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          <p className="font-semibold">{state.message}</p>
          {state.errors?.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {state.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
