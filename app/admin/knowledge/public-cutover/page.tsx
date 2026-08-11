import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentKnowledgeCmsActor } from "@/lib/knowledgeCmsAdminAuth";
import {
  getKnowledgeCmsPublicCutoverConfirmationPhrase,
  getKnowledgeCmsPublicCutoverReceipt,
  type KnowledgeCmsPublicCutoverCheckStatus,
} from "@/lib/knowledgeCmsPublicCutover";
import {
  getKnowledgeCmsAdminPublicCutoverPreview,
  isKnowledgeCmsPublicCutoverApprovalExecutionEnabled,
} from "@/lib/knowledgeCmsPublicCutoverDal";
import { isKnowledgeCmsEnabled } from "@/lib/knowledgeCmsRepository";
import { isKnowledgeCmsPrivateShadowEnabled } from "@/lib/knowledgeCmsShadowRenderer";
import KnowledgePublicCutoverApprovalControl from "../components/KnowledgePublicCutoverApprovalControl";

const checkStyles: Record<KnowledgeCmsPublicCutoverCheckStatus, string> = {
  pass: "border-emerald-200 bg-emerald-50 text-emerald-950",
  blocked: "border-red-200 bg-red-50 text-red-950",
};

function label(value: string): string {
  return value.replaceAll("_", " ");
}

export default async function KnowledgeCmsPublicCutoverPage({
  searchParams,
}: {
  searchParams: Promise<{ approved?: string }>;
}) {
  if (!isKnowledgeCmsEnabled() || !isKnowledgeCmsPrivateShadowEnabled()) {
    notFound();
  }
  const actor = await getCurrentKnowledgeCmsActor();
  if (!actor) {
    redirect("/admin/knowledge/login");
  }
  if (!actor.roles.some((role) => ["publisher", "admin"].includes(role))) {
    notFound();
  }
  const preview = await getKnowledgeCmsAdminPublicCutoverPreview();
  const receipt = getKnowledgeCmsPublicCutoverReceipt(
    preview.approvalControl,
  );
  const { approved } = await searchParams;
  const ready = preview.eligibility === "ready_for_admin_approval";
  const canApprove =
    ready &&
    actor.roles.includes("admin") &&
    isKnowledgeCmsPublicCutoverApprovalExecutionEnabled();

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
            href="/admin/knowledge/shadow-preview"
          >
            Shadow parity
          </Link>
        </div>

        <header
          className={`mt-5 rounded-2xl border p-6 shadow-sm md:p-8 ${
            ready
              ? "border-emerald-300 bg-emerald-50"
              : "border-red-300 bg-red-50"
          }`}
        >
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-700">
            Guarded public cutover · read-only preview
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Knowledge CMS public cutover
          </h1>
          <p className="mt-3 text-lg font-bold text-slate-950">
            {ready
              ? "Evidence is ready for an administrator approval"
              : "Blocked—keep public rendering static"}
          </p>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-700">
            This preview binds the complete 45-record migration to all 22 exact
            revision-specific rendering artifacts. It creates no approval,
            changes no variable, starts no deployment, and moves no traffic.
            Production cutover deployments are required to start with no
            traffic, and every request retains a verified local static fallback.
          </p>
        </header>

        {approved === receipt ? (
          <div className="mt-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">
            The immutable approval was created. Set the approval-execution gate
            back to false before any cutover deployment. No deployment or
            traffic change occurred.
          </div>
        ) : null}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-bold text-slate-950">Bound approval</h2>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="font-semibold text-slate-500">Records</dt>
              <dd className="mt-1 font-bold text-slate-950">
                {preview.approvalControl.evidence.recordsVerified}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Routes</dt>
              <dd className="mt-1 font-bold text-slate-950">
                {preview.approvalControl.evidence.routesVerified}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Valid from</dt>
              <dd className="mt-1 font-mono text-xs text-slate-950">
                {preview.approvalControl.validity.validFrom}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Expires</dt>
              <dd className="mt-1 font-mono text-xs text-slate-950">
                {preview.approvalControl.validity.expiresAt}
              </dd>
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <dt className="font-semibold text-slate-500">
                Deployment receipt
              </dt>
              <dd className="mt-1 break-all font-mono text-xs text-slate-950">
                {receipt}
              </dd>
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <dt className="font-semibold text-slate-500">
                Control fingerprint
              </dt>
              <dd className="mt-1 break-all font-mono text-xs text-slate-950">
                {preview.approvalControl.fingerprint.value}
              </dd>
            </div>
          </dl>

          {canApprove ? (
            <KnowledgePublicCutoverApprovalControl
              confirmationPhrase={getKnowledgeCmsPublicCutoverConfirmationPhrase(
                receipt,
              )}
              receipt={receipt}
            />
          ) : (
            <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              Approval execution is unavailable. It requires an administrator,
              exact private shadow mode, all three migration/artifact gates false,
              the cutover gate false, and the separate approval gate true.
            </p>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-bold text-slate-950">Approval checks</h2>
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

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-slate-950">
              Activation values
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Apply only after the matching immutable approval exists. Beta is
              the first selected route batch; the production candidate deploys with no traffic.
            </p>
            <ul className="mt-5 space-y-2">
              {preview.activation.variables.map((variable) => (
                <li
                  className="break-all rounded-lg bg-slate-950 p-3 font-mono text-xs text-white"
                  key={variable}
                >
                  {variable}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-red-950">
              Immediate rollback
            </h2>
            <ol className="mt-5 space-y-3 text-sm leading-6 text-red-950">
              <li>1. {preview.rollback.trafficAction.replaceAll("_", " ")}.</li>
              <li>2. {preview.rollback.immediateValue}.</li>
              <li>3. {preview.rollback.rendererValue}.</li>
              {preview.rollback.verification.map((item, index) => (
                <li key={item}>{index + 4}. {item}</li>
              ))}
            </ol>
            <p className="mt-5 text-sm font-bold text-red-950">
              CMS data preserved: yes · rollback writes: 0
            </p>
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-bold text-blue-950">
            Production monitoring boundary
          </h2>
          <p className="mt-3 text-sm leading-7 text-blue-950">
            Cloud Run emits one structured {preview.monitoring.structuredLogEvent}
            event per governed request with either cms_candidate or
            static_fallback. Any fallback during a production route batch is a rollback trigger.
            The approval expires automatically, and the homepage,
            /medicare-spokane, and /resources remain protected static paths.
          </p>
        </section>
      </div>
    </section>
  );
}
