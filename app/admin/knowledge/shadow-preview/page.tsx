import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentKnowledgeCmsActor } from "@/lib/knowledgeCmsAdminAuth";
import { getKnowledgeCmsAdminShadowPreview } from "@/lib/knowledgeCmsShadowDal";
import { isKnowledgeCmsEnabled } from "@/lib/knowledgeCmsRepository";
import {
  isKnowledgeCmsPrivateShadowEnabled,
  type KnowledgeCmsShadowResultStatus,
} from "@/lib/knowledgeCmsShadowRenderer";
import KnowledgeCmsNativeRepresentationRenderer from "@/lib/knowledgeCmsNativeRepresentationRenderer";
import {
  getKnowledgeCmsNativeRepresentationControl,
} from "@/lib/knowledgeCmsNativeRepresentation";
import {
  getKnowledgeCmsNativeRepresentationConfirmationPhrase,
  isKnowledgeCmsNativeRepresentationExecutionEnabled,
} from "@/lib/knowledgeCmsNativeRepresentationExecution";
import KnowledgeNativeRepresentationExecutionControl from "../components/KnowledgeNativeRepresentationExecutionControl";

const statusStyles: Record<KnowledgeCmsShadowResultStatus, string> = {
  candidate_missing: "bg-slate-100 text-slate-700",
  candidate_not_published: "bg-amber-100 text-amber-800",
  parity_failed: "bg-red-100 text-red-800",
  parity_passed: "bg-emerald-100 text-emerald-800",
  record_contract_mismatch: "bg-amber-100 text-amber-800",
  representation_control_invalid: "bg-red-100 text-red-800",
  representation_invalid: "bg-red-100 text-red-800",
  representation_missing: "bg-slate-100 text-slate-700",
  representation_stale: "bg-amber-100 text-amber-800",
};

function formatStatus(value: KnowledgeCmsShadowResultStatus): string {
  return value.replaceAll("_", " ");
}

export default async function KnowledgeShadowPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{
    entry?: string | string[];
  }>;
}) {
  if (
    !isKnowledgeCmsEnabled() ||
    !isKnowledgeCmsPrivateShadowEnabled()
  ) {
    notFound();
  }
  const actor = await getCurrentKnowledgeCmsActor();
  if (!actor) {
    redirect("/admin/knowledge/login");
  }
  if (!actor.roles.some((role) => ["publisher", "admin"].includes(role))) {
    notFound();
  }

  const preview = await getKnowledgeCmsAdminShadowPreview();
  const requestedEntry = (await searchParams).entry;
  if (Array.isArray(requestedEntry)) {
    notFound();
  }
  const selected = requestedEntry
    ? preview.results.find((result) => result.entryId === requestedEntry)
    : undefined;
  if (requestedEntry && !selected) {
    notFound();
  }
  const representationControl = selected
    ? getKnowledgeCmsNativeRepresentationControl(selected.entryId)
    : undefined;
  const representationExecutionEnabled =
    isKnowledgeCmsNativeRepresentationExecutionEnabled();

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
            Authenticated private shadow
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Knowledge CMS renderer comparison
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
            This workspace checks governed published CMS records against the
            exact CMS-owned lossless artifact, metadata, canonical, schema,
            form, FAQ, and body-hash contracts for the existing Resource
            Library. The candidate no longer imports a legacy page module.
            Public requests continue to use the verified static routes.
          </p>
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
            Preview write count: {preview.writeCount}. Effective public
            renderer: {preview.rendererMode.effectiveMode}. Candidate body:{" "}
            {preview.bodySource}. CMS content rendered publicly: no. Cutover
            eligible: no.
          </div>
        </header>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {[
            ["Routes", preview.summary.total],
            ["Controls ready", preview.summary.controlsReady],
            ["CMS records", preview.summary.candidatesPresent],
            ["Artifacts", preview.summary.representationsPresent],
            ["Unexpected", preview.summary.unexpectedRepresentations],
            ["Compared", preview.summary.compared],
            ["Exact passes", preview.summary.passed],
            ["Blocked", preview.summary.blocked],
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

        <section
          className={`mt-8 rounded-2xl border p-6 shadow-sm md:p-8 ${
            preview.betaParityApproval.status === "verified"
              ? "border-emerald-300 bg-emerald-50"
              : "border-amber-300 bg-amber-50"
          }`}
        >
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-700">
            Beta shadow-parity approval
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-950">
            {preview.betaParityApproval.status === "verified"
              ? "All 22 CMS-native candidates match"
              : `${preview.betaParityApproval.exactPasses} of ${preview.betaParityApproval.routeCount} candidates match`}
          </h2>
          <p className="mt-3 break-all font-mono text-xs text-slate-700">
            sha256:{preview.betaParityApproval.fingerprint}
          </p>
          <p className="mt-3 text-sm font-semibold text-slate-800">
            Execution authority: no · public cutover authority: no · static
            rollback retained
          </p>
        </section>

        {selected ? (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Selected comparison
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  {selected.title}
                </h2>
                <p className="mt-2 font-mono text-xs text-slate-500">
                  {selected.path} · {selected.recordId}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyles[selected.status]}`}
              >
                {formatStatus(selected.status)}
              </span>
            </div>

            {selected.errors.length > 0 ? (
              <ul className="mt-5 list-disc space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-5 pl-10 text-sm text-amber-950">
                {selected.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            ) : null}

            {selected.artifact ? (
              <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-slate-500">Revision</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {selected.artifact.record.revision}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Rendered bytes</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {selected.artifact.renderedBody.bytes.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Schema</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {selected.artifact.renderedBody.schemaTypes.join(", ") ||
                      "none"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Forms / FAQs</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {selected.artifact.renderedBody.formCount} /{" "}
                    {selected.artifact.renderedBody.faqDisclosureCount}
                  </dd>
                </div>
                <div className="sm:col-span-2 lg:col-span-4">
                  <dt className="text-slate-500">SHA-256</dt>
                  <dd className="mt-1 break-all font-mono text-xs text-slate-900">
                    {selected.artifact.renderedBody.sha256}
                  </dd>
                </div>
                <div className="sm:col-span-2 lg:col-span-4">
                  <dt className="text-slate-500">CMS artifact</dt>
                  <dd className="mt-1 break-all font-mono text-xs text-slate-900">
                    {selected.representationId} · sha256:
                    {selected.representationArtifact?.fingerprint.value}
                  </dd>
                </div>
              </dl>
            ) : null}

            {["representation_missing", "representation_stale"].includes(
              selected.status,
            ) &&
            selected.recordRevision &&
            representationControl ? (
              representationExecutionEnabled ? (
                <KnowledgeNativeRepresentationExecutionControl
                  confirmationPhrase={getKnowledgeCmsNativeRepresentationConfirmationPhrase(
                    selected.path.slice(1),
                  )}
                  controlFingerprint={
                    representationControl.fingerprint.value
                  }
                  controlId={representationControl.controlId}
                  expectedArticleRevision={selected.recordRevision}
                  targetTitle={selected.title}
                />
              ) : (
                <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  Private rendering artifact execution is disabled. The
                  deterministic control remains zero-write until the separate
                  server-only gate is enabled for beta.
                </p>
              )
            ) : null}

            {selected.status === "parity_passed" &&
            selected.representationArtifact ? (
              <div className="mt-8">
                <div className="rounded-t-xl border border-slate-300 bg-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                  Inert private render · links and forms disabled
                </div>
                <div
                  className="max-h-[70vh] overflow-auto rounded-b-xl border-x border-b border-slate-300 bg-white"
                  inert
                >
                  <KnowledgeCmsNativeRepresentationRenderer
                    artifact={selected.representationArtifact}
                  />
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6 md:p-8">
            <h2 className="text-xl font-bold text-slate-950">
              Route-by-route evidence
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              A comparison runs only for a matching published CMS article and
              immutable rendering artifact. Missing, stale, malformed, or
              mismatched evidence fails closed without a write.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-5 py-4">Route</th>
                  <th className="px-5 py-4">CMS record</th>
                  <th className="px-5 py-4">Result</th>
                  <th className="px-5 py-4">Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preview.results.map((result) => (
                  <tr className="align-top" key={result.entryId}>
                    <td className="px-5 py-5">
                      <Link
                        className="font-semibold text-blue-700 hover:underline"
                        href={`/admin/knowledge/shadow-preview?entry=${encodeURIComponent(result.entryId)}`}
                      >
                        {result.title}
                      </Link>
                      <p className="mt-1 font-mono text-xs text-slate-500">
                        {result.path}
                      </p>
                    </td>
                    <td className="px-5 py-5 text-slate-700">
                      <p className="font-mono text-xs">{result.recordId}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {result.recordRevision
                          ? `revision ${result.recordRevision}`
                          : "not present"}
                      </p>
                    </td>
                    <td className="px-5 py-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyles[result.status]}`}
                      >
                        {formatStatus(result.status)}
                      </span>
                    </td>
                    <td className="min-w-80 px-5 py-5 text-xs leading-5 text-slate-600">
                      {result.artifact ? (
                        <>
                          <p className="font-semibold text-emerald-700">
                            Exact contract match
                          </p>
                          <p className="mt-1 break-all font-mono">
                            {result.artifact.renderedBody.sha256}
                          </p>
                        </>
                      ) : (
                        <p>{result.errors[0] ?? "Comparison blocked."}</p>
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
