import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isKnowledgeCmsRecordId } from "@/lib/knowledgeCmsAdmin";
import { getCurrentKnowledgeCmsActor } from "@/lib/knowledgeCmsAdminAuth";
import { getKnowledgeCmsAdminArticleMigrationVerification } from "@/lib/knowledgeCmsMigrationDal";
import { isKnowledgeCmsEnabled } from "@/lib/knowledgeCmsRepository";

const statusStyles = {
  verified_private_draft:
    "border-emerald-300 bg-emerald-50 text-emerald-950",
  record_advanced: "border-blue-300 bg-blue-50 text-blue-950",
  failed: "border-red-300 bg-red-50 text-red-950",
} as const;

const statusLabels = {
  verified_private_draft: "Verified private draft",
  record_advanced: "Verified history · record advanced",
  failed: "Verification failed",
} as const;

const checkStyles = {
  verified: "border-emerald-200 bg-emerald-50 text-emerald-900",
  failed: "border-red-200 bg-red-50 text-red-900",
  not_applicable: "border-slate-200 bg-slate-50 text-slate-700",
} as const;

export default async function KnowledgeMigrationVerificationPage({
  params,
}: {
  params: Promise<{ recordId: string }>;
}) {
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

  const { recordId } = await params;
  if (!isKnowledgeCmsRecordId(recordId)) {
    notFound();
  }
  const verification =
    await getKnowledgeCmsAdminArticleMigrationVerification(recordId);
  if (!verification) {
    notFound();
  }

  return (
    <section className="bg-slate-50 px-5 py-10 md:py-14">
      <div className="mx-auto max-w-5xl">
        <Link
          className="text-sm font-semibold text-blue-700 hover:underline"
          href="/admin/knowledge/migration-preview"
        >
          ← Back to migration history
        </Link>

        <header
          className={`mt-5 rounded-2xl border p-6 shadow-sm md:p-8 ${statusStyles[verification.status]}`}
          id="migration-verification"
        >
          <p className="text-sm font-bold uppercase tracking-[0.2em]">
            Post-create verification
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            {verification.history?.title ?? verification.recordId}
          </h1>
          <p className="mt-3 text-lg font-bold">
            {statusLabels[verification.status]}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7">
            This is a fresh, read-only Firestore snapshot. It checks the
            migration audit event, deterministic control, current article,
            slug lock, canonical lock, and search projection. It performs no
            repair, retry, publication, indexing, or cutover action.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-bold text-slate-950">
            Artifact checks
          </h2>
          <div className="mt-5 grid gap-3">
            {verification.checks.map((item) => (
              <div
                className={`rounded-xl border p-4 ${checkStyles[item.status]}`}
                key={item.code}
              >
                <p className="text-xs font-bold uppercase tracking-wider">
                  {item.code.replaceAll("_", " ")} · {item.status.replaceAll("_", " ")}
                </p>
                <p className="mt-2 text-sm leading-6">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-bold text-slate-950">
            Verification receipt
          </h2>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-slate-500">Record</dt>
              <dd className="mt-1 font-mono text-slate-900">
                {verification.recordId}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">
                Current revision
              </dt>
              <dd className="mt-1 text-slate-900">
                {verification.currentRevision ?? "unavailable"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Observed</dt>
              <dd className="mt-1 text-slate-900">
                {new Date(verification.observedAt).toLocaleString("en-US", {
                  timeZone: "America/Los_Angeles",
                })}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">
                Snapshot boundary
              </dt>
              <dd className="mt-1 text-slate-900">
                {verification.artifacts.readCount} reads · {verification.artifacts.writeCount} writes
              </dd>
            </div>
            {verification.history ? (
              <>
                <div>
                  <dt className="font-semibold text-slate-500">
                    Execution actor
                  </dt>
                  <dd className="mt-1 font-mono text-slate-900">
                    {verification.history.actorId}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-500">
                    Executed
                  </dt>
                  <dd className="mt-1 text-slate-900">
                    {new Date(
                      verification.history.occurredAt,
                    ).toLocaleString("en-US", {
                      timeZone: "America/Los_Angeles",
                    })}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-semibold text-slate-500">
                    Deterministic control
                  </dt>
                  <dd className="mt-1 break-all font-mono text-xs leading-6 text-slate-900">
                    {verification.history.control.id}
                    <br />
                    sha256:{verification.history.control.fingerprint}
                  </dd>
                </div>
              </>
            ) : null}
            <div className="sm:col-span-2">
              <dt className="font-semibold text-slate-500">
                Read receipt
              </dt>
              <dd className="mt-1 break-all font-mono text-xs leading-6 text-slate-900">
                sha256:{verification.fingerprint.value}
              </dd>
            </div>
          </dl>
          <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-800">
            Public source: verified static route · CMS body public: no ·
            indexing changed: no · cutover eligible: no
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"
              href={`/admin/knowledge/article/${encodeURIComponent(verification.recordId)}`}
            >
              Open CMS record
            </Link>
            <Link
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100"
              href="/admin/knowledge/migration-preview"
            >
              Return to history
            </Link>
          </div>
        </section>
      </div>
    </section>
  );
}
