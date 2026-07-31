"use client";

import { useActionState, useState } from "react";
import {
  createKnowledgeCmsDraftAction,
  updateKnowledgeCmsDraftAction,
} from "../actions";
import {
  initialKnowledgeCmsAdminActionState,
  type KnowledgeCmsAdminActionState,
  type KnowledgeCmsAdminRecordDto,
} from "@/lib/knowledgeCmsAdmin";
import type {
  KnowledgeCmsRecordKind,
  KnowledgeCmsSource,
} from "@/lib/knowledgeCms";

type FormAction = (
  state: KnowledgeCmsAdminActionState,
  formData: FormData,
) => Promise<KnowledgeCmsAdminActionState>;

interface KnowledgeRecordFormProps {
  kind: KnowledgeCmsRecordKind;
  mode: "create" | "edit";
  record?: KnowledgeCmsAdminRecordDto;
}

const inputClass =
  "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-600";
const labelClass = "block text-sm font-semibold text-slate-800";

function lines(values: string[] | undefined): string {
  return values?.join("\n") ?? "";
}

function emptySource(): KnowledgeCmsSource {
  return {
    id: "",
    kind: "official",
    title: "",
    publisher: "",
    url: "",
    checkedAt: "",
    reviewDueAt: "",
  };
}

function TextField({
  defaultValue,
  disabled,
  label,
  maxLength,
  name,
  required,
  type = "text",
}: {
  defaultValue?: string | number;
  disabled: boolean;
  label: string;
  maxLength?: number;
  name: string;
  required?: boolean;
  type?: "text" | "number" | "url";
}) {
  return (
    <label className={labelClass}>
      {label}
      <input
        className={inputClass}
        defaultValue={defaultValue}
        disabled={disabled}
        maxLength={maxLength}
        name={name}
        required={required}
        type={type}
      />
    </label>
  );
}

function TextAreaField({
  defaultValue,
  disabled,
  help,
  label,
  name,
  required,
  rows = 5,
}: {
  defaultValue?: string;
  disabled: boolean;
  help?: string;
  label: string;
  name: string;
  required?: boolean;
  rows?: number;
}) {
  return (
    <label className={labelClass}>
      {label}
      {help ? (
        <span className="mt-1 block font-normal leading-5 text-slate-500">
          {help}
        </span>
      ) : null}
      <textarea
        className={inputClass}
        defaultValue={defaultValue}
        disabled={disabled}
        name={name}
        required={required}
        rows={rows}
      />
    </label>
  );
}

function SourceFields({
  disabled,
  initialSources,
}: {
  disabled: boolean;
  initialSources: KnowledgeCmsSource[];
}) {
  const [sources, setSources] = useState<KnowledgeCmsSource[]>(initialSources);

  function update(index: number, patch: Partial<KnowledgeCmsSource>) {
    setSources((current) =>
      current.map((source, sourceIndex) =>
        sourceIndex === index ? { ...source, ...patch } : source,
      ),
    );
  }

  return (
    <fieldset className="rounded-xl border border-slate-200 p-5">
      <legend className="px-2 text-lg font-semibold text-slate-950">
        Sources
      </legend>
      <p className="mb-4 text-sm leading-6 text-slate-600">
        Articles and FAQs need at least one current source before review. Saving
        a draft does not submit it for review.
      </p>
      <input name="sources" type="hidden" value={JSON.stringify(sources)} />
      <div className="space-y-5">
        {sources.map((source, index) => (
          <div
            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            key={index}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className={labelClass}>
                Source ID
                <input
                  className={inputClass}
                  disabled={disabled}
                  onChange={(event) => update(index, { id: event.target.value })}
                  required
                  value={source.id}
                />
              </label>
              <label className={labelClass}>
                Source type
                <select
                  className={inputClass}
                  disabled={disabled}
                  onChange={(event) =>
                    update(index, {
                      kind: event.target.value as KnowledgeCmsSource["kind"],
                    })
                  }
                  value={source.kind}
                >
                  <option value="official">Official</option>
                  <option value="first_party">First-party disclosure</option>
                </select>
              </label>
              <label className={labelClass}>
                Title
                <input
                  className={inputClass}
                  disabled={disabled}
                  onChange={(event) =>
                    update(index, { title: event.target.value })
                  }
                  required
                  value={source.title}
                />
              </label>
              <label className={labelClass}>
                Publisher
                <input
                  className={inputClass}
                  disabled={disabled}
                  onChange={(event) =>
                    update(index, { publisher: event.target.value })
                  }
                  required
                  value={source.publisher}
                />
              </label>
              <label className={`${labelClass} md:col-span-2`}>
                HTTPS URL
                <input
                  className={inputClass}
                  disabled={disabled}
                  onChange={(event) => update(index, { url: event.target.value })}
                  required
                  type="url"
                  value={source.url}
                />
              </label>
              <label className={labelClass}>
                Checked date
                <input
                  className={inputClass}
                  disabled={disabled}
                  onChange={(event) =>
                    update(index, { checkedAt: event.target.value })
                  }
                  required
                  type="date"
                  value={source.checkedAt}
                />
              </label>
              <label className={labelClass}>
                Review due
                <input
                  className={inputClass}
                  disabled={disabled}
                  onChange={(event) =>
                    update(index, { reviewDueAt: event.target.value })
                  }
                  required
                  type="date"
                  value={source.reviewDueAt}
                />
              </label>
            </div>
            {!disabled ? (
              <button
                className="mt-4 text-sm font-semibold text-red-700 hover:text-red-900"
                onClick={() =>
                  setSources((current) =>
                    current.filter((_, sourceIndex) => sourceIndex !== index),
                  )
                }
                type="button"
              >
                Remove source
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {!disabled ? (
        <button
          className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          onClick={() =>
            setSources((current) => [...current, emptySource()])
          }
          type="button"
        >
          Add source
        </button>
      ) : null}
    </fieldset>
  );
}

export default function KnowledgeRecordForm({
  kind,
  mode,
  record,
}: KnowledgeRecordFormProps) {
  const editable = mode === "create" || record?.editable === true;
  const boundAction: FormAction =
    mode === "create"
      ? createKnowledgeCmsDraftAction
      : updateKnowledgeCmsDraftAction.bind(null, kind, record!.id);
  const [state, formAction, pending] = useActionState(
    boundAction,
    initialKnowledgeCmsAdminActionState,
  );
  const article = record?.kind === "article" ? record : undefined;
  const topic = record?.kind === "topic" ? record : undefined;
  const faq = record?.kind === "faq" ? record : undefined;
  const relationships = record?.relationships;

  return (
    <form action={formAction} className="space-y-6">
      <input name="kind" type="hidden" value={kind} />
      {record ? (
        <input
          name="expectedRevision"
          type="hidden"
          value={state.revision ?? record.revision}
        />
      ) : null}

      {!editable ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          This record is read-only. Only drafts may be edited, and authors may
          edit only drafts they own.
        </div>
      ) : null}

      <fieldset className="rounded-xl border border-slate-200 p-5">
        <legend className="px-2 text-lg font-semibold text-slate-950">
          Content
        </legend>
        <div className="grid gap-5">
          {kind === "article" ? (
            <>
              <TextField
                defaultValue={article?.title}
                disabled={!editable}
                label="Title"
                maxLength={300}
                name="title"
                required
              />
              <TextAreaField
                defaultValue={article?.summary}
                disabled={!editable}
                label="Summary"
                name="summary"
                required
                rows={4}
              />
              <TextAreaField
                defaultValue={article?.body}
                disabled={!editable}
                help="Markdown is stored as authored. This release does not render CMS records publicly."
                label="Body"
                name="body"
                required
                rows={24}
              />
            </>
          ) : null}

          {kind === "topic" ? (
            <>
              <TextField
                defaultValue={topic?.title}
                disabled={!editable}
                label="Title"
                maxLength={300}
                name="title"
                required
              />
              <TextAreaField
                defaultValue={topic?.description}
                disabled={!editable}
                label="Description"
                name="topicDescription"
                required
              />
              <div className="grid gap-5 md:grid-cols-2">
                <TextField
                  defaultValue={topic?.parentTopicId}
                  disabled={!editable}
                  label="Parent topic ID"
                  name="parentTopicId"
                />
                <TextField
                  defaultValue={topic?.order ?? 0}
                  disabled={!editable}
                  label="Display order"
                  name="order"
                  type="number"
                />
              </div>
            </>
          ) : null}

          {kind === "faq" ? (
            <>
              <TextAreaField
                defaultValue={faq?.question}
                disabled={!editable}
                label="Question"
                name="question"
                required
                rows={3}
              />
              <TextAreaField
                defaultValue={faq?.answer}
                disabled={!editable}
                label="Answer"
                name="answer"
                required
                rows={8}
              />
              <TextField
                defaultValue={faq?.categoryId}
                disabled={!editable}
                label="Category ID"
                name="categoryId"
                required
              />
              <TextAreaField
                defaultValue={lines(faq?.factIds)}
                disabled={!editable}
                help="One factual-claim ID per line."
                label="Fact IDs"
                name="factIds"
                rows={4}
              />
              <label className="flex items-start gap-3 text-sm font-semibold text-slate-800">
                <input
                  className="mt-1 size-4"
                  defaultChecked={faq?.schemaEligible}
                  disabled={!editable}
                  name="schemaEligible"
                  type="checkbox"
                />
                Eligible for FAQ schema after publication and visible rendering
              </label>
            </>
          ) : null}
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-slate-200 p-5">
        <legend className="px-2 text-lg font-semibold text-slate-950">
          Slug and search
        </legend>
        <div className="grid gap-5">
          <TextField
            defaultValue={record?.slug}
            disabled={!editable}
            label="Slug"
            maxLength={200}
            name="slug"
          />
          <TextAreaField
            defaultValue={lines(record?.searchTerms)}
            disabled={!editable}
            help="One term per line. These remain private until a later public migration."
            label="Search terms"
            name="searchTerms"
            rows={5}
          />
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-slate-200 p-5">
        <legend className="px-2 text-lg font-semibold text-slate-950">
          Discoverability metadata
        </legend>
        <p className="mb-4 text-sm leading-6 text-slate-600">
          Drafts always remain blocked from indexing. These fields prepare a
          future reviewed publication.
        </p>
        <div className="grid gap-5">
          <TextField
            defaultValue={record?.discoverability.pageTitle}
            disabled={!editable}
            label="Page title"
            maxLength={300}
            name="pageTitle"
          />
          <TextAreaField
            defaultValue={record?.discoverability.description}
            disabled={!editable}
            label="Description"
            name="description"
            rows={3}
          />
          <TextField
            defaultValue={record?.discoverability.canonicalPath}
            disabled={!editable}
            label="Future canonical path"
            maxLength={500}
            name="canonicalPath"
          />
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-slate-200 p-5">
        <legend className="px-2 text-lg font-semibold text-slate-950">
          Relationships
        </legend>
        <p className="mb-4 text-sm leading-6 text-slate-600">
          Enter one identifier, slug, carrier name, or existing site path per
          line.
        </p>
        <div className="grid gap-5 md:grid-cols-2">
          <TextAreaField
            defaultValue={lines(relationships?.articleIds)}
            disabled={!editable}
            label="Article IDs"
            name="articleIds"
            rows={4}
          />
          <TextAreaField
            defaultValue={lines(relationships?.topicIds)}
            disabled={!editable}
            label="Topic IDs"
            name="topicIds"
            rows={4}
          />
          <TextAreaField
            defaultValue={lines(relationships?.faqIds)}
            disabled={!editable}
            label="FAQ IDs"
            name="faqIds"
            rows={4}
          />
          <TextAreaField
            defaultValue={lines(relationships?.citySlugs)}
            disabled={!editable}
            label="City slugs"
            name="citySlugs"
            rows={4}
          />
          <TextAreaField
            defaultValue={lines(relationships?.agentSlugs)}
            disabled={!editable}
            label="Agent slugs"
            name="agentSlugs"
            rows={4}
          />
          <TextAreaField
            defaultValue={lines(relationships?.carrierNames)}
            disabled={!editable}
            label="Carrier names"
            name="carrierNames"
            rows={4}
          />
          <div className="md:col-span-2">
            <TextAreaField
              defaultValue={lines(relationships?.existingPaths)}
              disabled={!editable}
              label="Existing site paths"
              name="existingPaths"
              rows={4}
            />
          </div>
        </div>
      </fieldset>

      <SourceFields
        disabled={!editable}
        initialSources={record?.sources ?? []}
      />

      {state.message ? (
        <div
          aria-live="polite"
          className={`rounded-xl border p-4 text-sm leading-6 ${
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

      {editable ? (
        <div className="sticky bottom-4 flex justify-end rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
          <button
            className="min-h-12 rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending || state.conflict}
            type="submit"
          >
            {pending
              ? "Saving…"
              : mode === "create"
                ? "Create private draft"
                : "Save draft"}
          </button>
        </div>
      ) : null}
    </form>
  );
}
