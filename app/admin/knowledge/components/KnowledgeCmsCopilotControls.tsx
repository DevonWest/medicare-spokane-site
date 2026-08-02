"use client";

import { useActionState, useState } from "react";
import {
  applyKnowledgeCmsAiRunAction,
  createKnowledgeCmsAiRunAction,
  runKnowledgeCmsCopilotActivationCheckAction,
  runKnowledgeCmsSeoScanAction,
} from "../actions";
import {
  initialKnowledgeCmsAdminActionState,
  type KnowledgeCmsAdminActionState,
} from "@/lib/knowledgeCmsAdmin";
import type { KnowledgeCmsAiMode } from "@/lib/knowledgeCmsAi";

function ActionMessage({ state }: { state: KnowledgeCmsAdminActionState }) {
  if (!state.message) return null;
  return (
    <div
      className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
        state.ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-red-200 bg-red-50 text-red-900"
      }`}
      role={state.ok ? "status" : "alert"}
    >
      <p>{state.message}</p>
      {state.errors?.length ? (
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {state.errors.map((error) => <li key={error}>{error}</li>)}
        </ul>
      ) : null}
    </div>
  );
}

export function KnowledgeCmsSeoScanControl({ enabled }: { enabled: boolean }) {
  const [state, action, pending] = useActionState(
    runKnowledgeCmsSeoScanAction,
    initialKnowledgeCmsAdminActionState,
  );
  return (
    <form action={action}>
      <button
        className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={!enabled || pending}
        type="submit"
      >
        {pending ? "Scanning site…" : "Run fresh SEO scan"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

export function KnowledgeCmsActivationCheckControl() {
  const [state, action, pending] = useActionState(
    runKnowledgeCmsCopilotActivationCheckAction,
    initialKnowledgeCmsAdminActionState,
  );
  return (
    <form action={action}>
      <button
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={pending}
        type="submit"
      >
        {pending ? "Verifying connections…" : "Verify live connections"}
      </button>
      <p className="mt-2 max-w-xl text-xs text-slate-500">
        Uses one read-only Search Console query and OpenAI model metadata. It
        sends no CMS article, prompt, client data, or generation request.
      </p>
      <ActionMessage state={state} />
    </form>
  );
}

export interface KnowledgeCmsCopilotArticleOption {
  id: string;
  title: string;
  revision: number;
  status: "draft" | "published";
}

export function KnowledgeCmsAiRequestControl({
  articles,
  enabled,
  initialPrompt,
}: {
  articles: KnowledgeCmsCopilotArticleOption[];
  enabled: boolean;
  initialPrompt?: string;
}) {
  const [mode, setMode] = useState("site_strategy");
  const [state, action, pending] = useActionState(
    createKnowledgeCmsAiRunAction,
    initialKnowledgeCmsAdminActionState,
  );
  return (
    <form action={action} className="space-y-5">
      <label className="block text-sm font-semibold text-slate-800">
        Task
        <select
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
          name="mode"
          onChange={(event) => setMode(event.target.value)}
          value={mode}
        >
          <option value="site_strategy">Analyze SEO strategy</option>
          <option value="new_article">Create a complete article draft</option>
          <option value="improve_article">Improve an existing article</option>
        </select>
      </label>
      {mode === "improve_article" ? (
        <label className="block text-sm font-semibold text-slate-800">
          Article
          <select
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
            name="targetRecordId"
            required
          >
            <option value="">Choose an article</option>
            {articles.map((article) => (
              <option key={article.id} value={article.id}>
                {article.title} · {article.status} · revision {article.revision}
              </option>
            ))}
          </select>
          <span className="mt-2 block font-normal text-slate-600">
            Draft changes can be applied to the private draft. Published articles
            produce a private revision proposal; after review, you can explicitly
            open it as an editable draft while the current static website page stays
            unchanged.
          </span>
        </label>
      ) : null}
      <label className="block text-sm font-semibold text-slate-800">
        What outcome do you want?
        <textarea
          className="mt-2 min-h-36 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
          maxLength={4_000}
          minLength={10}
          name="prompt"
          placeholder="For example: Find our highest-impact Spokane Medicare SEO opportunity and prepare the strongest evidence-backed next step."
          required
          defaultValue={initialPrompt}
        />
      </label>
      <label className="flex items-start gap-3 text-sm text-slate-700">
        <input className="mt-1" name="deepResearch" type="checkbox" value="true" />
        <span>
          Use deeper research for a more thorough strategy pass. This takes longer
          and uses the higher-capability model.
        </span>
      </label>
      <button
        className="rounded-lg bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={!enabled || pending}
        type="submit"
      >
        {pending ? "Researching and preparing proposal…" : "Ask AI copilot"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

export function KnowledgeCmsAiApplyControl({
  revisionProposal = false,
  runId,
}: {
  revisionProposal?: boolean;
  runId: string;
}) {
  const boundAction = applyKnowledgeCmsAiRunAction.bind(null, runId);
  const [state, action, pending] = useActionState(
    boundAction,
    initialKnowledgeCmsAdminActionState,
  );
  return (
    <form action={action} className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-5">
      <label className="flex items-start gap-3 text-sm font-semibold text-amber-950">
        <input
          className="mt-1"
          name="confirmation"
          required
          type="checkbox"
          value={revisionProposal ? "start_private_revision" : "apply_private_draft"}
        />
        <span>
          {revisionProposal
            ? "I reviewed this proposal and understand it will preserve the current published CMS revision as an immutable snapshot, remove its private search projection, and open the proposal as an indexing-blocked draft. The verified static public page stays unchanged, and the revision still requires normal review and publishing."
            : "I reviewed this proposal and understand it will only create or update a private draft. It will not submit, approve, publish, or enable indexing."}
        </span>
      </label>
      <button
        className="mt-4 rounded-lg bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-800 disabled:bg-slate-400"
        disabled={pending}
        type="submit"
      >
        {pending
          ? revisionProposal
            ? "Starting private revision…"
            : "Applying private draft…"
          : revisionProposal
            ? "Start private working revision"
            : "Apply as private draft"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

export function KnowledgeCmsAiRefineControl({
  enabled,
  mode,
  runId,
  targetRecordId,
}: {
  enabled: boolean;
  mode: KnowledgeCmsAiMode;
  runId: string;
  targetRecordId?: string;
}) {
  const [state, action, pending] = useActionState(
    createKnowledgeCmsAiRunAction,
    initialKnowledgeCmsAdminActionState,
  );
  return (
    <form action={action} className="mt-6 rounded-xl border border-violet-200 bg-violet-50 p-5">
      <input name="mode" type="hidden" value={mode} />
      <input name="parentRunId" type="hidden" value={runId} />
      {targetRecordId ? (
        <input name="targetRecordId" type="hidden" value={targetRecordId} />
      ) : null}
      <label className="block text-sm font-semibold text-violet-950">
        Continue refining this proposal
        <textarea
          className="mt-2 min-h-28 w-full rounded-lg border border-violet-200 bg-white px-3 py-2 font-normal text-slate-900"
          maxLength={4_000}
          minLength={10}
          name="prompt"
          placeholder="For example: Keep the structure, but make the opening clearer and add a stronger Spokane-specific checklist."
          required
        />
      </label>
      <label className="mt-3 flex items-start gap-3 text-sm text-violet-900">
        <input className="mt-1" name="deepResearch" type="checkbox" value="true" />
        <span>Use the deeper model and a broader research pass for this refinement.</span>
      </label>
      <button
        className="mt-4 rounded-lg bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={!enabled || pending}
        type="submit"
      >
        {pending ? "Refining proposal…" : "Refine with AI"}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}
