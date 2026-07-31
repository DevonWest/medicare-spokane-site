import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentKnowledgeCmsActor } from "@/lib/knowledgeCmsAdminAuth";
import { getKnowledgeCmsAdminOperationalReadiness } from "@/lib/knowledgeCmsOperationalReadinessDal";
import { isKnowledgeCmsEnabled } from "@/lib/knowledgeCmsRepository";
import type {
  KnowledgeCmsOperationalCheckStatus,
  KnowledgeCmsOperationalTargetStatus,
} from "@/lib/knowledgeCmsOperationalReadiness";

const checkStyles: Record<KnowledgeCmsOperationalCheckStatus, string> = {
  pass: "border-emerald-200 bg-emerald-50 text-emerald-950",
  blocked: "border-red-200 bg-red-50 text-red-950",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  not_applicable: "border-slate-200 bg-slate-50 text-slate-700",
};

const targetStyles: Record<KnowledgeCmsOperationalTargetStatus, string> = {
  prepared_absent: "bg-blue-100 text-blue-900",
  verified_private_draft: "bg-emerald-100 text-emerald-900",
  verified_advanced_record: "bg-violet-100 text-violet-900",
  blocked: "bg-red-100 text-red-900",
};

function label(value: string): string {
  return value.replaceAll("_", " ");
}

export default async function KnowledgeCmsReadinessPage() {
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

  const report = await getKnowledgeCmsAdminOperationalReadiness();
  const ready = report.overall === "ready_for_guarded_private_operations";
  const roleDirectory = report.authorization.roleDirectory;

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
            href="/admin/knowledge/migration-preview"
          >
            Migration preview
          </Link>
          <Link
            className="text-sm font-semibold text-blue-700 hover:underline"
            href="/admin/knowledge/beta-activation"
          >
            Beta activation preview
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
            Authenticated · read only · zero writes
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Knowledge CMS operational readiness
          </h1>
          <p className="mt-3 text-lg font-bold text-slate-950">
            {ready
              ? "Ready for guarded private operations"
              : "Blocked—review the findings below"}
          </p>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-700">
            This fresh report checks deployment configuration, aggregate Firebase
            role coverage, deterministic migration controls, execution history,
            and every current post-create artifact receipt. It does not assign a
            role, repair a record, run a migration, publish, index, or change a
            public route.
          </p>
        </header>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Object.entries(report.capabilities).map(([name, status]) => (
            <div
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              key={name}
            >
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {label(name)}
              </p>
              <p
                className={`mt-3 text-lg font-bold capitalize ${
                  ["ready", "available", "complete"].includes(status)
                    ? "text-emerald-700"
                    : status === "disabled"
                      ? "text-slate-700"
                      : "text-red-700"
                }`}
              >
                {label(status)}
              </p>
            </div>
          ))}
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-bold text-slate-950">Readiness checks</h2>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {report.checks.map((item) => (
              <div
                className={`rounded-xl border p-4 ${checkStyles[item.status]}`}
                key={item.code}
              >
                <p className="text-xs font-bold uppercase tracking-wider">
                  {label(item.code)} · {label(item.status)}
                </p>
                <p className="mt-2 text-sm leading-6">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-slate-950">
              Deployment configuration
            </h2>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-slate-500">CMS gate</dt>
                <dd className="mt-1 font-bold capitalize text-slate-900">
                  {report.configuration.cmsGate}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">
                  Article execution gate
                </dt>
                <dd className="mt-1 font-bold capitalize text-slate-900">
                  {report.configuration.articleMigrationExecutionGate}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">
                  Topic/FAQ execution gate
                </dt>
                <dd className="mt-1 font-bold capitalize text-slate-900">
                  {report.configuration.supportingMigrationExecutionGate}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">
                  Requested renderer
                </dt>
                <dd className="mt-1 font-bold capitalize text-slate-900">
                  {report.configuration.renderer.requestedMode}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">
                  Effective public renderer
                </dt>
                <dd className="mt-1 font-bold text-emerald-700">static</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Admin SDK</dt>
                <dd className="mt-1 font-bold text-slate-900">
                  {report.configuration.firebase.adminConfigured
                    ? "Configured"
                    : "Blocked"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">
                  Browser Auth / project
                </dt>
                <dd className="mt-1 font-bold capitalize text-slate-900">
                  {report.configuration.firebase.browserAuthConfigured
                    ? "configured"
                    : "blocked"}{" "}
                  · {report.configuration.firebase.projectAlignment}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-bold text-slate-950">
              Aggregate role coverage
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Identity details are not exposed. Counts come from a read-only,
              paginated Firebase Auth scan and current licensed-reviewer evidence.
            </p>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
              {[
                ["Accounts scanned", roleDirectory.accountsScanned],
                ["Active CMS accounts", roleDirectory.activeRoleAccounts],
                ["Authoring", roleDirectory.capabilities.authoringAccounts],
                ["Reviewer claims", roleDirectory.capabilities.reviewerClaimAccounts],
                ["Verified reviewers", roleDirectory.capabilities.verifiedReviewerAccounts],
                ["Publishers", roleDirectory.capabilities.publisherAccounts],
              ].map(([name, value]) => (
                <div key={name}>
                  <dt className="font-semibold text-slate-500">{name}</dt>
                  <dd className="mt-1 text-2xl font-bold text-slate-950">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-800">
              Reviewer/publisher separation: {roleDirectory.capabilities.reviewerPublisherSeparationReady
                ? "verified"
                : "blocked"} · directory pages: {roleDirectory.pagesRead} · writes: {roleDirectory.writeCount}
            </p>
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-bold text-slate-950">
            Complete governed migration evidence
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            All 22 articles, 12 topics, and 11 FAQs are classified. Prepared
            targets are absent with verified controls; created targets pass their
            current audit, record, required lock, and search-projection checks.
          </p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {[
              ["All records", report.migration.targets.total],
              ["Articles", report.migration.inventory.articles],
              ["Topics", report.migration.inventory.topics],
              ["FAQs", report.migration.inventory.faqs],
              ["Prepared", report.migration.targets.preparedAbsent],
              ["Private drafts", report.migration.targets.verifiedPrivateDrafts],
              ["Advanced", report.migration.targets.verifiedAdvancedRecords],
              ["Blocked", report.migration.targets.blocked],
              ["Invalid events", report.migration.history.invalidEvents],
            ].map(([name, value]) => (
              <div
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                key={name}
              >
                <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {name}
                </dt>
                <dd className="mt-1 text-2xl font-bold text-slate-950">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          {report.migration.targetEvidence.length === 0 ? (
            <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">
              Migration inventory is unavailable.
            </p>
          ) : (
            <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-5 py-4">Record</th>
                    <th className="px-5 py-4">State</th>
                    <th className="px-5 py-4">Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.migration.targetEvidence.map((target) => (
                    <tr className="align-top" key={target.id}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-950">
                          {target.title}
                        </p>
                        <p className="mt-1 font-mono text-xs text-slate-500">
                          {target.kind}:{target.id}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${targetStyles[target.status]}`}
                        >
                          {label(target.status)}
                        </span>
                      </td>
                      <td className="max-w-xl px-5 py-4 text-sm leading-6 text-slate-700">
                        {target.detail}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-bold text-blue-950">
            Deterministic one-record operator sequence
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-blue-950">
            Status: {label(report.migration.completion.status)} · prepared:{" "}
            {report.migration.completion.prepared} · verified:{" "}
            {report.migration.completion.verified} · next step:{" "}
            {report.migration.completion.nextStep ?? "none"}. Topics come first,
            then FAQs, then articles. The report authorizes no execution and must
            be refreshed after every separately confirmed transaction.
          </p>
          <p className="mt-3 text-sm font-semibold text-blue-950">
            Bulk execution: blocked · report writes:{" "}
            {report.migration.completion.writeCount} · execution authorized: no
          </p>
          <div className="mt-6 max-h-[42rem] overflow-auto rounded-xl border border-blue-200 bg-white">
            <table className="min-w-full divide-y divide-blue-100 text-left text-sm">
              <thead className="sticky top-0 bg-blue-100 text-xs font-bold uppercase tracking-wider text-blue-950">
                <tr>
                  <th className="px-5 py-4">Step</th>
                  <th className="px-5 py-4">Target</th>
                  <th className="px-5 py-4">Action</th>
                  <th className="px-5 py-4">Boundary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {report.migration.completion.steps.map((step) => (
                  <tr className="align-top" key={`${step.kind}:${step.id}`}>
                    <td className="px-5 py-4 font-bold text-slate-950">
                      {step.order}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-950">{step.title}</p>
                      <p className="mt-1 font-mono text-xs text-slate-500">
                        {step.kind}:{step.id}
                      </p>
                    </td>
                    <td className="px-5 py-4 capitalize text-slate-800">
                      {label(step.action)}
                    </td>
                    <td className="px-5 py-4 text-xs leading-6 text-slate-700">
                      {step.expectedAtomicWrites} expected write(s) · refresh
                      required · {step.executionGate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-bold text-emerald-950">
            Read receipt and public safeguards
          </h2>
          <p className="mt-3 text-sm leading-7 text-emerald-950">
            Auth directory: {report.readBoundary.authDirectoryPages} page(s) ·
            Firestore inventory/history: {report.readBoundary.firestoreInventoryCollectionReads + report.readBoundary.firestoreHistoryCollectionReads} collection reads ·
            verification transactions: {report.readBoundary.verificationTransactions} ·
            verified artifacts: {report.readBoundary.verifiedArtifactReads} ·
            writes: {report.readBoundary.writeCount}
          </p>
          <p className="mt-3 text-sm font-semibold text-emerald-950">
            Static public source · no public CMS body · no indexing change · no
            sitemap change · no bulk execution · cutover prohibited
          </p>
          <p className="mt-4 break-all font-mono text-xs leading-6 text-emerald-950">
            sha256:{report.fingerprint.value}
          </p>
        </section>
      </div>
    </section>
  );
}
