import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import LogoutButton from "./components/LogoutButton";
import { getCurrentKnowledgeCmsActor } from "@/lib/knowledgeCmsAdminAuth";
import { listKnowledgeCmsAdminRecords } from "@/lib/knowledgeCmsAdminDal";
import { isKnowledgeCmsEnabled } from "@/lib/knowledgeCmsRepository";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Los_Angeles",
  }).format(new Date(value));
}

export default async function KnowledgeAdminPage() {
  if (!isKnowledgeCmsEnabled()) {
    notFound();
  }
  const actor = await getCurrentKnowledgeCmsActor();
  if (!actor) {
    redirect("/admin/knowledge/login");
  }
  const records = await listKnowledgeCmsAdminRecords();
  const canCreate = actor.roles.some((role) =>
    ["author", "editor", "admin"].includes(role),
  );
  const canPreviewMigration = actor.roles.some((role) =>
    ["publisher", "admin"].includes(role),
  );

  return (
    <section className="bg-slate-50 px-5 py-10 md:py-14">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">
              Private editorial workspace
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
              Knowledge CMS drafts
            </h1>
            <p className="mt-3 text-sm text-slate-600">
              Roles: {actor.roles.join(", ")}. No record is rendered publicly
              by this workspace.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {canCreate ? (
              <>
                <Link
                  className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                  href="/admin/knowledge/new?kind=article"
                >
                  New article
                </Link>
                <Link
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  href="/admin/knowledge/new?kind=topic"
                >
                  New topic
                </Link>
                <Link
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  href="/admin/knowledge/new?kind=faq"
                >
                  New FAQ
                </Link>
              </>
            ) : null}
            {canPreviewMigration ? (
              <Link
                className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-100"
                href="/admin/knowledge/migration-preview"
              >
                Migration preview
              </Link>
            ) : null}
            <LogoutButton />
          </div>
        </header>

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {records.length === 0 ? (
            <div className="p-10 text-center">
              <h2 className="text-xl font-semibold text-slate-950">
                No CMS records yet
              </h2>
              <p className="mt-3 text-slate-600">
                Create a private article, topic, or FAQ draft to begin.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-5 py-4">Record</th>
                    <th className="px-5 py-4">Kind</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Updated</th>
                    <th className="px-5 py-4">Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((record) => (
                    <tr className="hover:bg-slate-50" key={`${record.kind}:${record.id}`}>
                      <td className="px-5 py-4">
                        <Link
                          className="font-semibold text-blue-700 hover:text-blue-900 hover:underline"
                          href={`/admin/knowledge/${record.kind}/${encodeURIComponent(record.id)}`}
                        >
                          {record.title}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">
                          {record.slug} · revision {record.revision}
                        </p>
                      </td>
                      <td className="px-5 py-4 capitalize text-slate-700">
                        {record.kind}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                          {record.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {formatDate(record.updatedAt)}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {record.editable
                          ? "Editable"
                          : record.ownedByCurrentUser
                            ? "Read only"
                            : "Read only · another owner"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
