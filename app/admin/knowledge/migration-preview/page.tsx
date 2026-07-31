import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentKnowledgeCmsActor } from "@/lib/knowledgeCmsAdminAuth";
import {
  getKnowledgeCmsAdminMigrationPreview,
} from "@/lib/knowledgeCmsMigrationDal";
import { isKnowledgeCmsEnabled } from "@/lib/knowledgeCmsRepository";
import type {
  KnowledgeCmsMigrationCandidateState,
  KnowledgeCmsMigrationIssueSeverity,
} from "@/lib/knowledgeCmsMigration";

const stateStyles: Record<KnowledgeCmsMigrationCandidateState, string> = {
  ready: "bg-emerald-100 text-emerald-800",
  blocked: "bg-red-100 text-red-800",
  already_present: "bg-blue-100 text-blue-800",
};

const severityStyles: Record<KnowledgeCmsMigrationIssueSeverity, string> = {
  blocker: "border-red-200 bg-red-50 text-red-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-blue-200 bg-blue-50 text-blue-900",
};

function formatState(value: KnowledgeCmsMigrationCandidateState): string {
  return value.replace("_", " ");
}

export default async function KnowledgeMigrationPreviewPage() {
  if (!isKnowledgeCmsEnabled()) {
    notFound();
  }
  const actor = await getCurrentKnowledgeCmsActor();
  if (!actor) {
    redirect("/admin/knowledge/login");
  }
  if (!actor.roles.some((role) => ["publisher", "admin"].includes(role))) {
    notFound();
  }

  const preview = await getKnowledgeCmsAdminMigrationPreview();

  return (
    <section className="bg-slate-50 px-5 py-10 md:py-14">
      <div className="mx-auto max-w-7xl">
        <Link
          className="text-sm font-semibold text-blue-700 hover:underline"
          href="/admin/knowledge"
        >
          ← Back to Knowledge CMS
        </Link>

        <header className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">
            Read-only migration planner
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Resource Library migration preview
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
            This inventory compares the static Resource Library with existing
            Knowledge CMS records. It never writes Firestore data, changes a
            public route, or enables CMS rendering.
          </p>
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
            Write count: {preview.writeCount}. Closing this page leaves every
            system unchanged.
          </div>
        </header>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Candidates", preview.summary.total],
            ["Ready metadata", preview.summary.ready],
            ["Blocked", preview.summary.blocked],
            ["Already present", preview.summary.alreadyPresent],
          ].map(([label, value]) => (
            <div
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              key={label}
            >
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {label}
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {(["article", "topic", "faq"] as const).map((kind) => {
            const summary = preview.summary.byKind[kind];
            return (
              <div
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                key={kind}
              >
                <h2 className="text-lg font-bold capitalize text-slate-950">
                  {kind}s
                </h2>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-slate-500">Total</dt>
                    <dd className="font-semibold text-slate-900">
                      {summary.total}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Ready</dt>
                    <dd className="font-semibold text-emerald-700">
                      {summary.ready}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Blocked</dt>
                    <dd className="font-semibold text-red-700">
                      {summary.blocked}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Existing</dt>
                    <dd className="font-semibold text-blue-700">
                      {summary.alreadyPresent}
                    </dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-bold text-slate-950">Release gates</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
            <li>
              {preview.summary.blockers} blockers and{" "}
              {preview.summary.warnings} warnings were found as of{" "}
              {preview.asOf}.
            </li>
            <li>
              {preview.summary.sourceRecords} unique source records are mapped
              with explicit review dates.
            </li>
            <li>
              Article bodies must be extracted and compared to rendered public
              pages before any import can be proposed.
            </li>
            <li>
              Public rendering, URL cutover, sitemap changes, and migration
              execution remain outside this preview.
            </li>
          </ul>
          {preview.issues.length > 0 ? (
            <div className="mt-6 space-y-3">
              {preview.issues.map((item) => (
                <p
                  className={`rounded-lg border p-3 text-sm ${severityStyles[item.severity]}`}
                  key={`${item.code}:${item.message}`}
                >
                  <span className="font-bold uppercase">
                    {item.severity}:
                  </span>{" "}
                  {item.message}
                </p>
              ))}
            </div>
          ) : null}
        </section>

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6 md:p-8">
            <h2 className="text-xl font-bold text-slate-950">
              Proposed record inventory
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Every target stays a private, indexing-blocked draft. Rows are
              informational only.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-5 py-4">Target</th>
                  <th className="px-5 py-4">Origin</th>
                  <th className="px-5 py-4">State</th>
                  <th className="px-5 py-4">Canonical / relationships</th>
                  <th className="px-5 py-4">Findings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preview.candidates.map((candidate) => (
                  <tr className="align-top" key={candidate.key}>
                    <td className="px-5 py-5">
                      <p className="font-semibold text-slate-950">
                        {candidate.target.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {candidate.target.kind}:{candidate.target.id}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        slug: {candidate.target.slug}
                      </p>
                    </td>
                    <td className="px-5 py-5 text-slate-700">
                      <p>{candidate.origin.kind.replaceAll("_", " ")}</p>
                      {"path" in candidate.origin ? (
                        <p className="mt-1 font-mono text-xs text-slate-500">
                          {candidate.origin.path}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${stateStyles[candidate.state]}`}
                      >
                        {formatState(candidate.state)}
                      </span>
                    </td>
                    <td className="px-5 py-5 text-xs leading-6 text-slate-600">
                      <p>
                        Canonical:{" "}
                        {candidate.target.canonicalPath ?? "none proposed"}
                      </p>
                      <p>
                        Sources: {candidate.target.sources.length} · Articles:{" "}
                        {candidate.target.relationships.articleIds.length} ·
                        Topics:{" "}
                        {candidate.target.relationships.topicIds.length} · FAQs:{" "}
                        {candidate.target.relationships.faqIds.length}
                      </p>
                    </td>
                    <td className="min-w-80 px-5 py-5">
                      {candidate.issues.length === 0 ? (
                        <p className="text-sm font-semibold text-emerald-700">
                          No mapping conflicts.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {candidate.issues.map((item) => (
                            <li
                              className={`rounded-lg border p-3 text-xs leading-5 ${severityStyles[item.severity]}`}
                              key={`${item.code}:${item.message}`}
                            >
                              <span className="font-bold uppercase">
                                {item.severity}:
                              </span>{" "}
                              {item.message}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
