import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  KnowledgeCmsActivationCheckControl,
  KnowledgeCmsAiApplyControl,
  KnowledgeCmsAiRefineControl,
  KnowledgeCmsAiRequestControl,
  KnowledgeCmsSeoScanControl,
} from "../components/KnowledgeCmsCopilotControls";
import { listKnowledgeCmsAdminRecords } from "@/lib/knowledgeCmsAdminDal";
import { getCurrentKnowledgeCmsActor } from "@/lib/knowledgeCmsAdminAuth";
import {
  getKnowledgeCmsAiRun,
  isKnowledgeCmsAiEnabled,
  listKnowledgeCmsAiRuns,
  type KnowledgeCmsAiRun,
} from "@/lib/knowledgeCmsAiDal";
import {
  getKnowledgeCmsCopilotReadiness,
  type KnowledgeCmsCopilotReadiness,
  type KnowledgeCmsCopilotReadinessState,
} from "@/lib/knowledgeCmsCopilotReadiness";
import {
  getKnowledgeCmsCopilotActivationStatus,
  type KnowledgeCmsCopilotActivationCheckState,
  type KnowledgeCmsCopilotActivationStatus,
} from "@/lib/knowledgeCmsCopilotActivation";
import { isKnowledgeCmsEnabled } from "@/lib/knowledgeCmsRepository";
import {
  getRecentKnowledgeCmsSeoScans,
  isKnowledgeCmsSeoEnabled,
  type KnowledgeCmsSeoScan,
} from "@/lib/knowledgeCmsSeoDal";
import type {
  KnowledgeCmsSearchMetricComparison,
  KnowledgeCmsSeoPriority,
} from "@/lib/knowledgeCmsSeo";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Los_Angeles",
  }).format(new Date(value));
}

function formatDateOnly(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function percent(value: number | null): string {
  if (value === null) return "Not comparable";
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
}

function metricPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function evidenceLabel(
  row: KnowledgeCmsSearchMetricComparison,
  dimension: "page" | "query",
): string {
  if (dimension === "query") return row.query;
  try {
    const url = new URL(row.page);
    return `${url.pathname}${url.search}`;
  } catch {
    return row.page;
  }
}

function googleIndexLabel(
  inspection: NonNullable<KnowledgeCmsSeoScan["watchedPages"]>[number]["inspection"],
): string {
  if (!inspection) return "No inspection evidence";
  if (inspection.status === "unavailable") return "Inspection unavailable";
  if (inspection.verdict === "PASS") return "Indexed";
  return inspection.coverageState ?? inspection.verdict ?? "Not indexed";
}

function canonicalStatus(
  inspection: NonNullable<KnowledgeCmsSeoScan["watchedPages"]>[number]["inspection"],
): string {
  if (!inspection || inspection.status === "unavailable") return "Not verified";
  if (!inspection.googleCanonical) return "No Google canonical yet";
  try {
    return new URL(inspection.googleCanonical).toString() ===
      new URL(inspection.url).toString()
      ? "Canonical matches"
      : "Canonical differs";
  } catch {
    return "Canonical differs";
  }
}

const priorityClasses: Record<KnowledgeCmsSeoPriority, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  high: "border-orange-200 bg-orange-50 text-orange-800",
  medium: "border-amber-200 bg-amber-50 text-amber-900",
  low: "border-slate-200 bg-slate-50 text-slate-700",
};

const readinessClasses: Record<KnowledgeCmsCopilotReadinessState, string> = {
  blocked: "border-red-200 bg-red-50 text-red-900",
  disabled: "border-slate-200 bg-slate-50 text-slate-700",
  ready: "border-emerald-200 bg-emerald-50 text-emerald-900",
};

const activationClasses: Record<
  KnowledgeCmsCopilotActivationCheckState,
  string
> = {
  blocked: "border-red-200 bg-red-50 text-red-900",
  disabled: "border-slate-200 bg-slate-50 text-slate-700",
  verified: "border-emerald-200 bg-emerald-50 text-emerald-900",
};

function ReadinessPanel({
  activation,
  readiness,
}: {
  activation?: KnowledgeCmsCopilotActivationStatus;
  readiness: KnowledgeCmsCopilotReadiness;
}) {
  const liveCurrent = Boolean(
    activation?.currentConfiguration && !activation.expired,
  );
  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Activation readiness</h2>
          <p className="mt-2 text-sm text-slate-600">
            Configuration status is shown without exposing keys, tokens, account IDs,
            or other secret values.
          </p>
        </div>
        <div className="space-y-3">
          <span className="block rounded-full bg-blue-100 px-3 py-1 text-center text-sm font-semibold text-blue-800">
            {readiness.readyCount} of {readiness.totalCount} configured
          </span>
          <KnowledgeCmsActivationCheckControl />
        </div>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {readiness.checks.map((item) => (
          <article className={`rounded-xl border p-4 ${readinessClasses[item.state]}`} key={item.id}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold">{item.label}</h3>
              <span className="text-xs font-bold uppercase tracking-wider">{item.state}</span>
            </div>
            <p className="mt-2 text-sm">{item.detail}</p>
          </article>
        ))}
      </div>
      <div className="mt-7 border-t border-slate-200 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-950">
              Last live verification
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Configuration is not treated as working access until these
              external checks pass.
            </p>
          </div>
          {activation ? (
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                liveCurrent
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-900"
              }`}
            >
              {liveCurrent ? "current" : "refresh required"}
            </span>
          ) : null}
        </div>
        {!activation ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            No live activation evidence exists for this deployment. Run the
            connection check before enabling recurring monitoring.
          </p>
        ) : (
          <>
            <p className="mt-4 text-sm text-slate-600">
              Checked {formatDate(activation.evidence.checkedAt)} for{" "}
              {activation.evidence.environment} at {activation.evidence.origin}.{" "}
              Evidence expires {formatDate(activation.evidence.expiresAt)}.
            </p>
            {!activation.currentConfiguration ? (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                The deployment configuration changed after this check. Verify
                the live connections again.
              </p>
            ) : null}
            {activation.expired ? (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                This evidence is older than the activation window. Verify the
                connections again before recurring monitoring can run.
              </p>
            ) : null}
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {activation.evidence.checks.map((item) => (
                <article
                  className={`rounded-xl border p-4 ${activationClasses[item.state]}`}
                  key={item.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-bold">{item.label}</h4>
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {item.state}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">{item.detail}</p>
                  <p className="mt-2 text-xs uppercase tracking-wider opacity-75">
                    {item.verification} check
                  </p>
                </article>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              <span
                className={`rounded-full px-3 py-1 ${
                  activation.evidence.readyForAi
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                AI {activation.evidence.readyForAi ? "live" : "not live"}
              </span>
              <span
                className={`rounded-full px-3 py-1 ${
                  activation.evidence.readyForContinuousSeo
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                Recurring monitoring{" "}
                {activation.evidence.readyForContinuousSeo
                  ? "verified"
                  : "not verified"}
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function ScanDashboard({
  history,
  scan,
}: {
  history: KnowledgeCmsSeoScan[];
  scan: KnowledgeCmsSeoScan;
}) {
  const metrics = scan.searchMetrics;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Prioritized items", scan.summary.totalOpportunities],
          ["Search clicks", Math.round(metrics.clicks)],
          ["Search impressions", Math.round(metrics.impressions)],
          ["Click change", percent(metrics.clickChange)],
        ].map(([label, value]) => (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4" key={label}>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p>
          Last scan: {formatDate(scan.completedAt)} · {scan.summary.pagesAudited} public pages · {scan.summary.recordsAudited} CMS records
        </p>
        <p className="mt-1">
          Search Console: {scan.searchConsoleStatus.replaceAll("_", " ")}
          {scan.currentPeriod ? ` · ${scan.currentPeriod.startDate} through ${scan.currentPeriod.endDate}` : ""}
        </p>
        <p className="mt-1">
          Site totals include Search Console data that cannot be attributed to a
          named query. Page and query tables below are diagnostic evidence and
          may therefore add up to less than the site total.
        </p>
      </div>
      {scan.watchedPages ? (
        <section className="overflow-hidden rounded-xl border border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h3 className="font-bold text-slate-950">Watched market pages</h3>
            <p className="mt-1 text-xs text-slate-600">
              Exact Google index evidence and attributed 28-day search performance.
              Index inspection: {scan.urlInspectionStatus?.replaceAll("_", " ") ?? "not collected"}.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2">Page</th>
                  <th className="px-3 py-2">Google index</th>
                  <th className="px-3 py-2">Last crawl</th>
                  <th className="px-3 py-2 text-right">Impressions</th>
                  <th className="px-3 py-2 text-right">Clicks</th>
                  <th className="px-3 py-2 text-right">Position</th>
                  <th className="px-3 py-2">Top queries</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {scan.watchedPages.map((item) => (
                  <tr key={item.path}>
                    <td className="max-w-64 break-words px-3 py-3 align-top">
                      <Link className="font-semibold text-blue-800 hover:underline" href={item.path}>
                        {item.path}
                      </Link>
                      {item.inspection?.inspectionResultLink ? (
                        <a
                          className="mt-1 block text-xs text-violet-700 hover:underline"
                          href={item.inspection.inspectionResultLink}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Open URL Inspection ↗
                        </a>
                      ) : null}
                    </td>
                    <td className="max-w-64 px-3 py-3 align-top">
                      <span className="font-semibold text-slate-900">
                        {googleIndexLabel(item.inspection)}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {canonicalStatus(item.inspection)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 align-top">
                      {item.inspection?.lastCrawlTime
                        ? formatDate(item.inspection.lastCrawlTime)
                        : "Not reported"}
                    </td>
                    <td className="px-3 py-3 text-right align-top">
                      {item.searchMetrics
                        ? Math.round(item.searchMetrics.impressions)
                        : "—"}
                    </td>
                    <td className="px-3 py-3 text-right align-top">
                      {item.searchMetrics
                        ? Math.round(item.searchMetrics.clicks)
                        : "—"}
                    </td>
                    <td className="px-3 py-3 text-right align-top">
                      {item.searchMetrics?.position
                        ? item.searchMetrics.position.toFixed(1)
                        : "—"}
                    </td>
                    <td className="max-w-72 px-3 py-3 align-top text-xs">
                      {item.queries.length > 0 ? (
                        <ul className="space-y-1">
                          {item.queries.slice(0, 3).map((query) => (
                            <li key={query.query}>
                              <span className="font-medium text-slate-900">
                                {query.query}
                              </span>{" "}
                              · {Math.round(query.impressions)} impressions · position{" "}
                              {query.position.toFixed(1)}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        "No attributed queries yet"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            Google index evidence reflects the version currently in Google, not a live
            URL test. Search Console can delay performance data and withhold some query
            details for privacy.
          </p>
        </section>
      ) : null}
      {scan.searchEvidence ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {(
            [
              ["Top pages", "page", scan.searchEvidence.pages],
              ["Top queries", "query", scan.searchEvidence.queries],
            ] as const
          ).map(([title, dimension, rows]) => (
            <section
              className="overflow-hidden rounded-xl border border-slate-200"
              key={dimension}
            >
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <h3 className="font-bold text-slate-950">{title}</h3>
                <p className="mt-1 text-xs text-slate-600">
                  Current 28-day evidence, ordered by impressions.
                </p>
              </div>
              {rows.length === 0 ? (
                <p className="p-4 text-sm text-slate-600">
                  No attributed {dimension} evidence was returned.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-3 py-2">{dimension}</th>
                        {dimension === "query" ? (
                          <th className="px-3 py-2">Owning page</th>
                        ) : null}
                        <th className="px-3 py-2 text-right">Clicks</th>
                        <th className="px-3 py-2 text-right">Impressions</th>
                        <th className="px-3 py-2 text-right">CTR</th>
                        <th className="px-3 py-2 text-right">Position</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {rows.slice(0, 12).map((row) => (
                        <tr key={`${dimension}-${evidenceLabel(row, dimension)}`}>
                          <td className="max-w-64 break-words px-3 py-2 font-medium text-slate-900">
                            {evidenceLabel(row, dimension)}
                          </td>
                          {dimension === "query" ? (
                            <td className="max-w-48 break-words px-3 py-2 text-slate-600">
                              {evidenceLabel(row, "page") || "Unattributed"}
                            </td>
                          ) : null}
                          <td className="px-3 py-2 text-right">
                            {Math.round(row.clicks)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {Math.round(row.impressions)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {metricPercent(row.ctr)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {row.position.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          This scan predates page and query evidence. Run a fresh SEO scan after
          the evidence upgrade is deployed.
        </p>
      )}
      {scan.observationHolds?.length ? (
        <section className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-blue-950">
          <h3 className="font-bold">Observation holds</h3>
          <p className="mt-1 text-sm">
            These pages changed recently. Search opportunities stay suppressed
            until the listed evidence date so the scanner does not react to
            pre-change performance.
          </p>
          <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {scan.observationHolds.map((hold) => (
              <li className="rounded-lg border border-blue-200 bg-white/70 px-3 py-2" key={hold.path}>
                <span className="font-semibold">{hold.path}</span>
                <span className="block text-xs text-blue-800">
                  Evaluate after {formatDateOnly(hold.evaluateAfter)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <div className="space-y-3">
        {scan.opportunities.length === 0 ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
            No prioritized issues were found in this scan.
          </p>
        ) : (
          scan.opportunities.slice(0, 40).map((opportunity) => (
            <article className="rounded-xl border border-slate-200 p-5" key={opportunity.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="font-bold text-slate-950">{opportunity.title}</h3>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase ${priorityClasses[opportunity.priority]}`}>
                  {opportunity.priority}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-700">{opportunity.reason}</p>
              <p className="mt-2 text-sm font-medium text-slate-900">{opportunity.recommendation}</p>
              {opportunity.page || opportunity.query ? (
                <p className="mt-3 break-all text-xs text-slate-500">
                  {[opportunity.page, opportunity.query ? `query: ${opportunity.query}` : undefined]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
              <Link
                className="mt-3 inline-flex text-sm font-semibold text-violet-700 hover:underline"
                href={`/admin/knowledge/copilot?opportunity=${encodeURIComponent(opportunity.id)}#ask-copilot`}
              >
                Analyze this with AI →
              </Link>
            </article>
          ))
        )}
      </div>
      {history.length > 1 ? (
        <details className="rounded-xl border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer font-semibold text-blue-800">
            View {history.length} recent scans
          </summary>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2">Completed</th>
                  <th className="px-3 py-2">Trigger</th>
                  <th className="px-3 py-2">Priorities</th>
                  <th className="px-3 py-2">Clicks</th>
                  <th className="px-3 py-2">Impressions</th>
                  <th className="px-3 py-2">Search Console</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {history.map((item) => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap px-3 py-2">{formatDate(item.completedAt)}</td>
                    <td className="px-3 py-2">{item.trigger}</td>
                    <td className="px-3 py-2">{item.summary.totalOpportunities}</td>
                    <td className="px-3 py-2">{Math.round(item.searchMetrics.clicks)}</td>
                    <td className="px-3 py-2">{Math.round(item.searchMetrics.impressions)}</td>
                    <td className="px-3 py-2">{item.searchConsoleStatus.replaceAll("_", " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
    </div>
  );
}

function Proposal({
  aiEnabled,
  run,
}: {
  aiEnabled: boolean;
  run: KnowledgeCmsAiRun;
}) {
  const draft = run.proposal.draft;
  return (
    <section className="mt-8 rounded-2xl border border-violet-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-700">AI proposal</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">{run.proposal.summary}</h2>
        </div>
        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800">
          {run.model} · {run.status.replaceAll("_", " ")}
        </span>
      </div>
      {run.status === "revision_proposal" ? (
        <p className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          This proposal has not changed the published CMS article. After you review it,
          the working-revision control can preserve that publication as an immutable
          snapshot and open this version as a private draft. The verified static public
          page remains unchanged throughout the review cycle.
        </p>
      ) : null}
      {run.usage ? (
        <p className="mt-4 text-xs text-slate-500">
          API usage: {run.usage.inputTokens.toLocaleString("en-US")} input ·{" "}
          {run.usage.outputTokens.toLocaleString("en-US")} output ·{" "}
          {run.usage.reasoningTokens.toLocaleString("en-US")} reasoning ·{" "}
          {run.usage.webSearchCalls} web search
          {run.usage.webSearchCalls === 1 ? "" : "es"} · output capped at{" "}
          {run.usage.maxOutputTokens.toLocaleString("en-US")} tokens
        </p>
      ) : null}
      <p className="mt-5 whitespace-pre-wrap text-slate-700">{run.proposal.reasoning}</p>
      {run.proposal.recommendedActions.length ? (
        <ol className="mt-5 list-decimal space-y-2 pl-6 text-slate-800">
          {run.proposal.recommendedActions.map((action) => <li key={action}>{action}</li>)}
        </ol>
      ) : null}
      {draft ? (
        <div className="mt-7 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Proposed private article draft</p>
          <h3 className="mt-2 text-xl font-bold text-slate-950">{draft.title}</h3>
          <p className="mt-2 text-sm text-slate-700">{draft.summary}</p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="font-semibold text-slate-900">Path</dt><dd className="break-all text-slate-600">{draft.canonicalPath}</dd></div>
            <div><dt className="font-semibold text-slate-900">Search title</dt><dd className="text-slate-600">{draft.pageTitle}</dd></div>
            <div className="sm:col-span-2"><dt className="font-semibold text-slate-900">Description</dt><dd className="text-slate-600">{draft.description}</dd></div>
          </dl>
          <details className="mt-5">
            <summary className="cursor-pointer font-semibold text-blue-800">Preview full Markdown</summary>
            <pre className="mt-3 max-h-[36rem] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-sm text-slate-100">{draft.body}</pre>
          </details>
          <details className="mt-4">
            <summary className="cursor-pointer font-semibold text-blue-800">
              Review {draft.sources.length} governed source{draft.sources.length === 1 ? "" : "s"}
            </summary>
            <ul className="mt-3 space-y-3 text-sm text-slate-700">
              {draft.sources.map((source) => (
                <li key={source.id}>
                  <a className="font-semibold text-blue-700 hover:underline" href={source.url} rel="noreferrer" target="_blank">{source.title}</a>
                  <span> · {source.publisher} · checked {source.checkedAt} · review due {source.reviewDueAt}</span>
                </li>
              ))}
            </ul>
          </details>
        </div>
      ) : null}
      {run.proposal.citations.length ? (
        <div className="mt-7">
          <h3 className="font-bold text-slate-950">Evidence reviewed</h3>
          <ul className="mt-3 space-y-3">
            {run.proposal.citations.map((citation) => (
              <li className="text-sm text-slate-700" key={`${citation.url}:${citation.note}`}>
                <a className="font-semibold text-blue-700 hover:underline" href={citation.url} rel="noreferrer" target="_blank">{citation.title}</a>
                <span> · {citation.publisher}. {citation.note}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {(run.status === "pending" || run.status === "revision_proposal") && draft ? (
        <KnowledgeCmsAiApplyControl
          revisionProposal={run.status === "revision_proposal"}
          runId={run.id}
        />
      ) : null}
      {run.status === "applied" && run.appliedRecordId ? (
        <Link className="mt-6 inline-flex font-semibold text-blue-700 hover:underline" href={`/admin/knowledge/article/${encodeURIComponent(run.appliedRecordId)}`}>
          {run.targetStatus === "published"
            ? "Open the private working revision →"
            : "Open the applied private draft →"}
        </Link>
      ) : null}
      <KnowledgeCmsAiRefineControl
        enabled={aiEnabled}
        mode={run.mode}
        runId={run.id}
        targetRecordId={run.targetRecordId}
      />
    </section>
  );
}

function RunHistory({ runs }: { runs: KnowledgeCmsAiRun[] }) {
  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <h2 className="text-2xl font-bold text-slate-950">AI proposal history</h2>
      <p className="mt-2 text-sm text-slate-600">
        Reopen prior strategy, draft, and published-article revision proposals without
        rerunning research or re-entering the request.
      </p>
      {runs.length === 0 ? (
        <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5 text-slate-700">
          No saved AI proposals yet.
        </p>
      ) : (
        <div className="mt-5 divide-y divide-slate-200 rounded-xl border border-slate-200">
          {runs.map((item) => (
            <Link
              className="block p-4 hover:bg-slate-50"
              href={`/admin/knowledge/copilot?run=${encodeURIComponent(item.id)}`}
              key={item.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950">{item.proposal.summary}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDate(item.createdAt)} · {item.mode.replaceAll("_", " ")} · {item.model}
                  </p>
                </div>
                <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800">
                  {item.status.replaceAll("_", " ")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function KnowledgeCmsCopilotPage({
  searchParams,
}: {
  searchParams: Promise<{
    opportunity?: string | string[];
    run?: string | string[];
  }>;
}) {
  if (!isKnowledgeCmsEnabled()) notFound();
  const actor = await getCurrentKnowledgeCmsActor();
  if (!actor) redirect("/admin/knowledge/login");
  if (!actor.roles.includes("admin")) notFound();

  const query = await searchParams;
  const runId = typeof query.run === "string" ? query.run : undefined;
  const opportunityId =
    typeof query.opportunity === "string" ? query.opportunity : undefined;
  const seoEnabled = isKnowledgeCmsSeoEnabled();
  const aiFlagEnabled = isKnowledgeCmsAiEnabled();
  const readiness = getKnowledgeCmsCopilotReadiness();
  const aiEnabled =
    readiness.checks.find((item) => item.id === "ai")?.state === "ready";
  const [records, scans, run, runHistory, activation] = await Promise.all([
    listKnowledgeCmsAdminRecords(),
    seoEnabled ? getRecentKnowledgeCmsSeoScans(8) : Promise.resolve([]),
    runId && aiFlagEnabled ? getKnowledgeCmsAiRun(runId) : Promise.resolve(undefined),
    aiFlagEnabled ? listKnowledgeCmsAiRuns(12) : Promise.resolve([]),
    getKnowledgeCmsCopilotActivationStatus({ actor }),
  ]);
  const scan = scans[0];
  const articles = records
    .filter(
      (record) =>
        record.kind === "article" &&
        (record.status === "draft" || record.status === "published"),
    )
    .map((record) => ({
      id: record.id,
      title: record.title,
      revision: record.revision,
      status: record.status as "draft" | "published",
    }));
  const selectedOpportunity = scan?.opportunities.find(
    (opportunity) => opportunity.id === opportunityId,
  );
  const initialPrompt = selectedOpportunity
    ? `Analyze this prioritized evidence and recommend the strongest evidence-backed next action: ${selectedOpportunity.title}. Evidence: ${selectedOpportunity.reason} Suggested direction: ${selectedOpportunity.recommendation}`
    : undefined;

  return (
    <section className="bg-slate-50 px-5 py-10 md:py-14">
      <div className="mx-auto max-w-6xl">
        <Link className="text-sm font-semibold text-blue-700 hover:underline" href="/admin/knowledge">← Back to drafts</Link>
        <header className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-700">Private AI and SEO workspace</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Content & SEO Copilot</h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            Continuously measure the site, research opportunities, and prepare complete CMS drafts. AI output always requires your review and cannot publish or change a public page.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
            <span className={`rounded-full px-3 py-1 ${seoEnabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>SEO scanner {seoEnabled ? "enabled" : "disabled"}</span>
            <span className={`rounded-full px-3 py-1 ${aiEnabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>AI copilot {aiEnabled ? "enabled" : "not configured"}</span>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-800">Human-controlled draft changes</span>
          </div>
        </header>

        <ReadinessPanel activation={activation} readiness={readiness} />

        {run ? <Proposal aiEnabled={aiEnabled} run={run} /> : runId ? (
          <p className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-red-900">That proposal is unavailable or does not belong to this session.</p>
        ) : null}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8" id="ask-copilot">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">Continuous SEO evidence</h2>
              <p className="mt-2 text-sm text-slate-600">Search performance, technical rendering, CMS quality, and source freshness are evaluated together.</p>
            </div>
            <KnowledgeCmsSeoScanControl enabled={seoEnabled} />
          </div>
          <div className="mt-7">
            {scan ? <ScanDashboard history={scans} scan={scan} /> : (
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-slate-700">No saved scan yet. Enable the scanner and run the first evidence pass.</p>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-2xl font-bold text-slate-950">Ask the copilot</h2>
          <p className="mt-2 text-sm text-slate-600">The copilot uses current site evidence, web research, and the CMS inventory. Do not enter client, lead, health, prescription, or other sensitive personal information.</p>
          <div className="mt-6">
            {selectedOpportunity ? (
              <p className="mb-5 rounded-lg border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
                Loaded opportunity: <strong>{selectedOpportunity.title}</strong>
              </p>
            ) : null}
            <KnowledgeCmsAiRequestControl
              articles={articles}
              enabled={aiEnabled}
              initialPrompt={initialPrompt}
            />
          </div>
        </section>

        <RunHistory runs={runHistory} />
      </div>
    </section>
  );
}
