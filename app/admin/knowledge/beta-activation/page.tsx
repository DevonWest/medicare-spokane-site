import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentKnowledgeCmsActor } from "@/lib/knowledgeCmsAdminAuth";
import { getKnowledgeCmsAdminBetaActivationPreview } from "@/lib/knowledgeCmsBetaActivationDal";
import { isKnowledgeCmsEnabled } from "@/lib/knowledgeCmsRepository";
import type { KnowledgeCmsBetaActivationCheckStatus } from "@/lib/knowledgeCmsBetaActivation";

const checkStyles: Record<KnowledgeCmsBetaActivationCheckStatus, string> = {
  pass: "border-emerald-200 bg-emerald-50 text-emerald-950",
  blocked: "border-red-200 bg-red-50 text-red-950",
};

function label(value: string): string {
  return value.replaceAll("_", " ");
}

export default async function KnowledgeCmsBetaActivationPage() {
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

  const preview = await getKnowledgeCmsAdminBetaActivationPreview();
  const ready = preview.eligibility === "ready_for_private_beta_activation";

  return (
    <section className="bg-slate-50 px-5 py-10 md:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap gap-4">
          <Link
            className="text-sm font-semibold text-blue-700 hover:underline"
            href="/admin/knowledge"
          >
            ← Back to Knowledge CMS
          </Link>
          <Link
            className="text-sm font-semibold text-blue-700 hover:underline"
            href="/admin/knowledge/readiness"
          >
            Operational readiness
          </Link>
          <Link
            className="text-sm font-semibold text-blue-700 hover:underline"
            href="/admin/knowledge/migration-preview"
          >
            Migration preview
          </Link>
        </div>

        <header
          className={`mt-5 rounded-2xl border p-6 shadow-sm md:p-8 ${
            ready
              ? "border-emerald-300 bg-emerald-50"
              : "border-red-300 bg-red-50"
          }`}
        >
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">
            Beta only · preview only · zero mutations
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Knowledge CMS beta activation preview
          </h1>
          <p className="mt-3 text-lg font-bold text-slate-950">
            {ready
              ? "Ready to review for private beta activation"
              : "Blocked—do not change the beta deployment"}
          </p>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-700">
            This page binds the exact beta environment to a fresh operational
            readiness receipt, previews the private-only configuration, and
            supplies an ordered rollback contract. It does not change a variable,
            deploy a revision, route traffic, assign a role, mutate a CMS record,
            enable public rendering, or authorize production.
          </p>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-slate-950">
              Environment scope
            </h2>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-slate-500">Target</dt>
                <dd className="mt-1 font-bold capitalize text-slate-950">
                  {preview.environment.target}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Status</dt>
                <dd
                  className={`mt-1 font-bold ${
                    preview.environment.verified
                      ? "text-emerald-700"
                      : "text-red-700"
                  }`}
                >
                  {preview.environment.verified ? "Verified beta" : "Blocked"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">
                  Expected environment
                </dt>
                <dd className="mt-1 font-mono text-xs font-bold text-slate-900">
                  {preview.environment.expectedSiteEnvironment}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">
                  Observed environment
                </dt>
                <dd className="mt-1 font-mono text-xs font-bold text-slate-900">
                  {preview.environment.observedSiteEnvironment}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-semibold text-slate-500">
                  Expected origin
                </dt>
                <dd className="mt-1 break-all font-mono text-xs font-bold text-slate-900">
                  {preview.environment.expectedSiteOrigin}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-semibold text-slate-500">
                  Observed origin class
                </dt>
                <dd className="mt-1 font-mono text-xs font-bold text-slate-900">
                  {preview.environment.observedSiteOrigin}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-slate-950">
              Bound readiness receipt
            </h2>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-slate-500">Outcome</dt>
                <dd className="mt-1 font-bold capitalize text-slate-950">
                  {label(preview.readinessBinding.overall)}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Receipt age</dt>
                <dd className="mt-1 font-bold text-slate-950">
                  {preview.readinessBinding.ageMilliseconds === null
                    ? "Invalid"
                    : `${preview.readinessBinding.ageMilliseconds} ms`}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Integrity</dt>
                <dd className="mt-1 font-bold text-slate-950">
                  {preview.readinessBinding.valid ? "Valid" : "Blocked"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Freshness</dt>
                <dd className="mt-1 font-bold text-slate-950">
                  {preview.readinessBinding.fresh ? "Fresh" : "Blocked"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-semibold text-slate-500">Observed</dt>
                <dd className="mt-1 font-mono text-xs text-slate-900">
                  {preview.readinessBinding.observedAt}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-semibold text-slate-500">SHA-256</dt>
                <dd className="mt-1 break-all font-mono text-xs text-slate-900">
                  {preview.readinessBinding.fingerprint}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-bold text-slate-950">
            Activation checks
          </h2>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {preview.checks.map((item) => (
              <div
                className={`rounded-xl border p-4 ${checkStyles[item.status]}`}
                key={item.code}
              >
                <p className="text-xs font-bold uppercase tracking-wider">
                  {label(item.code)} · {item.status}
                </p>
                <p className="mt-2 text-sm leading-6">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-blue-950">
                Proposed beta-only configuration
              </h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-blue-950">
                These values are a plan, not an action. Production is not an
                authorized target, and the public renderer stays static.
              </p>
            </div>
            <span className="rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-blue-900">
              {preview.activation.changesRequired} change(s) required
            </span>
          </div>
          <div className="mt-6 overflow-x-auto rounded-xl border border-blue-200 bg-white">
            <table className="min-w-full divide-y divide-blue-100 text-left text-sm">
              <thead className="bg-blue-100 text-xs font-bold uppercase tracking-wider text-blue-900">
                <tr>
                  <th className="px-5 py-4">Variable</th>
                  <th className="px-5 py-4">Current</th>
                  <th className="px-5 py-4">Proposed</th>
                  <th className="px-5 py-4">Effect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {preview.activation.variables.map((item) => (
                  <tr className="align-top" key={item.name}>
                    <td className="px-5 py-4 font-mono text-xs font-bold text-slate-950">
                      {item.name}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-700">
                      {item.current}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs font-bold text-blue-900">
                      {item.proposed}
                      {item.changeRequired ? " · change" : " · unchanged"}
                    </td>
                    <td className="max-w-xl px-5 py-4 leading-6 text-slate-700">
                      {item.effect}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ol className="mt-6 grid gap-4 lg:grid-cols-2">
            {preview.activation.steps.map((step) => (
              <li
                className="rounded-xl border border-blue-200 bg-white p-5"
                key={step.code}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Step {step.order} · {label(step.code)}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-800">
                  {step.action}
                </p>
                <p className="mt-3 text-xs font-semibold leading-5 text-slate-600">
                  Evidence: {step.expectedEvidence}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-bold text-amber-950">
            Deterministic rollback checklist
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-amber-950">
            Any trigger below stops the beta exercise. Rollback preserves CMS
            records and restores the static public source before broader disable
            or revision recovery is considered.
          </p>

          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            {preview.rollback.triggers.map((trigger) => (
              <div
                className="rounded-xl border border-amber-200 bg-white p-4"
                key={trigger.code}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  {label(trigger.code)}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {trigger.detail}
                </p>
              </div>
            ))}
          </div>

          <ol className="mt-6 space-y-4">
            {preview.rollback.steps.map((step) => (
              <li
                className="rounded-xl border border-amber-200 bg-white p-5"
                key={step.code}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Rollback {step.order} · {label(step.code)}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-800">
                  {step.action}
                </p>
                <p className="mt-3 text-xs font-semibold leading-5 text-slate-600">
                  Expected: {step.expectedEvidence}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-6 rounded-xl border border-amber-200 bg-white p-5">
            <h3 className="font-bold text-slate-950">Rollback verification</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
              {preview.rollback.verification.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-bold text-emerald-950">
            Preview receipt and immutable boundaries
          </h2>
          <p className="mt-3 text-sm font-semibold leading-7 text-emerald-950">
            Additional reads: {preview.mutationBoundary.additionalReads} · writes: {preview.mutationBoundary.writeCount} · variables changed: no · deployments started: no · traffic changed: no · roles changed: no · CMS records changed: no
          </p>
          <p className="mt-3 text-sm font-semibold text-emerald-950">
            Beta only · static public source · no public CMS body · no indexing
            change · no sitemap change · no production authority · cutover prohibited
          </p>
          <p className="mt-4 break-all font-mono text-xs leading-6 text-emerald-950">
            sha256:{preview.fingerprint.value}
          </p>
        </section>
      </div>
    </section>
  );
}
