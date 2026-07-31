"use client";

import { useActionState } from "react";
import {
  requestKnowledgeCmsChangesAction,
  submitKnowledgeCmsForReviewAction,
} from "../actions";
import {
  initialKnowledgeCmsAdminActionState,
  type KnowledgeCmsAdminActionState,
} from "@/lib/knowledgeCmsAdmin";
import type { KnowledgeCmsRecordKind } from "@/lib/knowledgeCms";

type WorkflowAction = (
  state: KnowledgeCmsAdminActionState,
  formData: FormData,
) => Promise<KnowledgeCmsAdminActionState>;

interface KnowledgeWorkflowControlsProps {
  canRequestChanges: boolean;
  canSubmitForReview: boolean;
  id: string;
  kind: KnowledgeCmsRecordKind;
  revision: number;
}

function ActionMessage({ state }: { state: KnowledgeCmsAdminActionState }) {
  if (!state.message) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className={`mt-4 rounded-lg border p-4 text-sm leading-6 ${
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
  );
}

function SubmitForReviewControl({
  id,
  kind,
  revision,
}: Pick<KnowledgeWorkflowControlsProps, "id" | "kind" | "revision">) {
  const action: WorkflowAction = submitKnowledgeCmsForReviewAction.bind(
    null,
    kind,
    id,
  );
  const [state, formAction, pending] = useActionState(
    action,
    initialKnowledgeCmsAdminActionState,
  );

  return (
    <form action={formAction}>
      <input
        name="expectedRevision"
        type="hidden"
        value={state.revision ?? revision}
      />
      <p className="text-sm leading-6 text-slate-600">
        Submission uses the last saved revision, so save any edits above first.
        It then locks draft editing and checks required content, current
        sources, and source review dates on the server.
      </p>
      <button
        className="mt-4 min-h-12 rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending || state.conflict}
        type="submit"
      >
        {pending ? "Submitting…" : "Submit for review"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

function RequestChangesControl({
  id,
  kind,
  revision,
}: Pick<KnowledgeWorkflowControlsProps, "id" | "kind" | "revision">) {
  const action: WorkflowAction = requestKnowledgeCmsChangesAction.bind(
    null,
    kind,
    id,
  );
  const [state, formAction, pending] = useActionState(
    action,
    initialKnowledgeCmsAdminActionState,
  );

  return (
    <form action={formAction}>
      <label className="block text-sm font-semibold text-slate-800">
        Required feedback
        <span className="mt-1 block font-normal leading-5 text-slate-500">
          Tell the author exactly what must change. The feedback remains visible
          on the returned draft and is also written to the audit history.
        </span>
        <textarea
          className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          disabled={pending || state.conflict}
          maxLength={2_000}
          name="feedback"
          required
          rows={6}
        />
      </label>
      <input
        name="expectedRevision"
        type="hidden"
        value={state.revision ?? revision}
      />
      <button
        className="mt-4 min-h-12 rounded-lg bg-amber-700 px-6 py-3 font-semibold text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending || state.conflict}
        type="submit"
      >
        {pending ? "Returning draft…" : "Request changes"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

export default function KnowledgeWorkflowControls({
  canRequestChanges,
  canSubmitForReview,
  id,
  kind,
  revision,
}: KnowledgeWorkflowControlsProps) {
  if (!canRequestChanges && !canSubmitForReview) {
    return null;
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">
        Editorial workflow
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
        {canSubmitForReview ? "Ready for review?" : "Review decision"}
      </h2>
      <div className="mt-5">
        {canSubmitForReview ? (
          <SubmitForReviewControl id={id} kind={kind} revision={revision} />
        ) : null}
        {canRequestChanges ? (
          <RequestChangesControl id={id} kind={kind} revision={revision} />
        ) : null}
      </div>
    </section>
  );
}
