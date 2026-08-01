"use client";

import { useActionState } from "react";
import {
  approveKnowledgeCmsRecordAction,
  publishKnowledgeCmsRecordAction,
  requestKnowledgeCmsChangesAction,
  submitKnowledgeCmsForReviewAction,
  unpublishKnowledgeCmsRecordAction,
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
  canApprove: boolean;
  canPublish: boolean;
  canRequestChanges: boolean;
  canSubmitForReview: boolean;
  canUnpublish: boolean;
  canonicalPath?: string;
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

function ApproveControl({
  id,
  kind,
  revision,
}: Pick<KnowledgeWorkflowControlsProps, "id" | "kind" | "revision">) {
  const action: WorkflowAction = approveKnowledgeCmsRecordAction.bind(
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
        Required approval note
        <span className="mt-1 block font-normal leading-5 text-slate-500">
          Summarize what you verified against the listed sources. Your verified
          identity and this note are recorded in the private audit history.
        </span>
        <textarea
          className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          disabled={pending || state.conflict}
          maxLength={2_000}
          name="approvalNote"
          required
          rows={5}
        />
      </label>
      <input
        name="expectedRevision"
        type="hidden"
        value={state.revision ?? revision}
      />
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Approval does not publish this record or make it visible on the public
        website. A separate, audited publishing decision is still required.
      </p>
      <button
        className="mt-4 min-h-12 rounded-lg bg-emerald-700 px-6 py-3 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending || state.conflict}
        type="submit"
      >
        {pending ? "Approving…" : "Approve for publishing"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

function PublishControl({
  canonicalPath,
  id,
  kind,
  revision,
}: Pick<
  KnowledgeWorkflowControlsProps,
  "canonicalPath" | "id" | "kind" | "revision"
>) {
  const action: WorkflowAction = publishKnowledgeCmsRecordAction.bind(
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
      <fieldset>
        <legend className="text-sm font-semibold text-slate-800">
          Required indexing decision
        </legend>
        <div className="mt-3 space-y-3">
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4 text-sm text-slate-700">
            <input
              className="mt-1 size-4"
              defaultChecked
              disabled={pending || state.conflict}
              name="indexing"
              type="radio"
              value="blocked"
            />
            <span>
              <strong className="block text-slate-950">
                Keep indexing blocked
              </strong>
              Create the private CMS search projection without marking the
              record eligible for future indexing.
            </span>
          </label>
          <label
            className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${
              canonicalPath
                ? "border-slate-200 text-slate-700"
                : "border-slate-100 bg-slate-50 text-slate-400"
            }`}
          >
            <input
              className="mt-1 size-4"
              disabled={pending || state.conflict || !canonicalPath}
              name="indexing"
              type="radio"
              value="eligible"
            />
            <span>
              <strong className="block text-slate-950">
                Mark eligible for future indexing
              </strong>
              This requires an approved canonical path and exact confirmation
              below. It still does not create or expose a public page.
            </span>
          </label>
        </div>
      </fieldset>
      <label className="mt-5 block text-sm font-semibold text-slate-800">
        Canonical path confirmation
        <span className="mt-1 block font-normal leading-5 text-slate-500">
          Required only when marking the record eligible. Enter the approved
          path exactly:{" "}
          <code className="font-semibold text-slate-700">
            {canonicalPath ?? "No canonical path is approved"}
          </code>
        </span>
        <input
          autoComplete="off"
          className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-950 shadow-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          disabled={pending || state.conflict || !canonicalPath}
          maxLength={500}
          name="canonicalPathConfirmation"
          type="text"
        />
      </label>
      <label className="mt-5 block text-sm font-semibold text-slate-800">
        Required publication note
        <span className="mt-1 block font-normal leading-5 text-slate-500">
          Record what you checked before publication. The note and your
          server-verified identity are written to the append-only audit
          history.
        </span>
        <textarea
          className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          disabled={pending || state.conflict}
          maxLength={2_000}
          name="publicationNote"
          required
          rows={5}
        />
      </label>
      <input
        name="expectedRevision"
        type="hidden"
        value={state.revision ?? revision}
      />
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Publishing changes only the private CMS record and its search
        projection. This release does not render CMS records on the public
        website.
      </p>
      <button
        className="mt-4 min-h-12 rounded-lg bg-violet-700 px-6 py-3 font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending || state.conflict}
        type="submit"
      >
        {pending ? "Publishing…" : "Publish in private CMS"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

function UnpublishControl({
  id,
  kind,
  revision,
}: Pick<KnowledgeWorkflowControlsProps, "id" | "kind" | "revision">) {
  const action: WorkflowAction = unpublishKnowledgeCmsRecordAction.bind(
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
        Required unpublish reason
        <span className="mt-1 block font-normal leading-5 text-slate-500">
          Explain why the CMS publication is being withdrawn. The search
          projection is removed atomically and the reason is audited.
        </span>
        <textarea
          className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          disabled={pending || state.conflict}
          maxLength={2_000}
          name="unpublishReason"
          required
          rows={5}
        />
      </label>
      <input
        name="expectedRevision"
        type="hidden"
        value={state.revision ?? revision}
      />
      <p className="mt-3 text-sm leading-6 text-slate-600">
        The record returns to draft, indexing is blocked, and a new review is
        required before it can be published again.
      </p>
      <button
        className="mt-4 min-h-12 rounded-lg bg-red-700 px-6 py-3 font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending || state.conflict}
        type="submit"
      >
        {pending ? "Withdrawing…" : "Unpublish from private CMS"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

export default function KnowledgeWorkflowControls({
  canApprove,
  canPublish,
  canRequestChanges,
  canSubmitForReview,
  canUnpublish,
  canonicalPath,
  id,
  kind,
  revision,
}: KnowledgeWorkflowControlsProps) {
  if (
    !canApprove &&
    !canPublish &&
    !canRequestChanges &&
    !canSubmitForReview &&
    !canUnpublish
  ) {
    return null;
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">
        Editorial workflow
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
        {canPublish || canUnpublish
          ? "Publication decision"
          : canSubmitForReview
            ? "Ready for review?"
            : "Review decision"}
      </h2>
      <div className="mt-5 space-y-8">
        {canSubmitForReview ? (
          <SubmitForReviewControl id={id} kind={kind} revision={revision} />
        ) : null}
        {canApprove ? (
          <ApproveControl id={id} kind={kind} revision={revision} />
        ) : null}
        {canPublish ? (
          <PublishControl
            canonicalPath={canonicalPath}
            id={id}
            kind={kind}
            revision={revision}
          />
        ) : null}
        {canRequestChanges ? (
          <RequestChangesControl id={id} kind={kind} revision={revision} />
        ) : null}
        {canUnpublish ? (
          <UnpublishControl id={id} kind={kind} revision={revision} />
        ) : null}
      </div>
    </section>
  );
}
