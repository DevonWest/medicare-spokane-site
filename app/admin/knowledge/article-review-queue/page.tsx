import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import KnowledgeArticleEditorialRolloutControl from "../components/KnowledgeArticleEditorialRolloutControl";
import {
  KNOWLEDGE_CMS_ARTICLE_EDITORIAL_APPROVAL_NOTE,
  KNOWLEDGE_CMS_ARTICLE_EDITORIAL_PUBLICATION_NOTE,
} from "@/lib/knowledgeCmsArticleEditorialRollout";
import { getCurrentKnowledgeCmsActor } from "@/lib/knowledgeCmsAdminAuth";
import { getKnowledgeCmsArticleEditorialRolloutPreview } from "@/lib/knowledgeCmsArticleEditorialRolloutDal";
import { isKnowledgeCmsEnabled } from "@/lib/knowledgeCmsRepository";

function statusLabel(status: string): string {
  return status.replaceAll("_", " ");
}

export default async function KnowledgeCmsArticleReviewQueuePage() {
  if (!isKnowledgeCmsEnabled()) {
    notFound();
  }
  const actor = await getCurrentKnowledgeCmsActor();
  if (!actor) {
    redirect("/admin/knowledge/login");
  }
  if (!actor.roles.includes("admin")) {
    notFound();
  }

  const preview =
    await getKnowledgeCmsArticleEditorialRolloutPreview();

  return (
    <section className="bg-slate-50 px-5 py-10 md:py-14">
      <div className="mx-auto max-w-7xl">
        <Link
          className="text-sm font-semibold text-blue-700 hover:underline"
          href="/admin/knowledge"
        >
          ← Back to editorial workspace
        </Link>
        <header className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-700">
            Private one-record workflow
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Governed article review queue
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">
            Advance one of the 22 migrated articles at a time. The server
            rechecks the immutable migrated route identity, current edited
            revision, sources, reviewer evidence, and static-route rollback
            contract before every action. Each article still receives separate
            review-submission, approval, and private-publication audit events.
          </p>
        </header>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Governed articles", preview.summary.total],
            ["Privately published", preview.summary.published],
            ["Remaining", preview.summary.remaining],
            ["Blocked", preview.summary.blocked],
          ].map(([label, value]) => (
            <div
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              key={label}
            >
              <p className="text-sm font-semibold text-slate-600">{label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">
                {value}
              </p>
            </div>
          ))}
        </div>

        <aside className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6 text-blue-950 shadow-sm md:p-8">
          <h2 className="text-lg font-bold">Public safety remains locked</h2>
          <p className="mt-3 text-sm leading-7">
            Indexing is forced to <strong>blocked</strong>. This queue cannot
            change renderer mode, activate a CMS route, alter the sitemap,
            deploy a revision, move traffic, or authorize public cutover. The
            verified static React pages remain public.
          </p>
        </aside>

        {preview.summary.blocked > 0 ? (
          <aside className="mt-8 rounded-2xl border border-red-300 bg-red-50 p-6 text-red-950 shadow-sm md:p-8">
            <h2 className="text-lg font-bold">Queue blocked</h2>
            <p className="mt-3 text-sm leading-7">
              At least one governed article has route-identity drift or stale
              workflow evidence. No queue action is available until the
              blocked rows below are resolved.
            </p>
          </aside>
        ) : preview.next ? (
          <section className="mt-8 rounded-2xl border border-violet-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-700">
              Next governed article
            </p>
            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                  {preview.next.title}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {preview.next.canonicalPath} · {preview.next.sourceCount}{" "}
                  source{preview.next.sourceCount === 1 ? "" : "s"} · revision{" "}
                  {preview.next.revision} · {statusLabel(preview.next.status)}
                </p>
              </div>
              <Link
                className="text-sm font-semibold text-blue-700 hover:underline"
                href={`/admin/knowledge/article/${encodeURIComponent(preview.next.id)}`}
              >
                Inspect full record
              </Link>
            </div>
            <KnowledgeArticleEditorialRolloutControl
              key={`${preview.next.id}:${preview.next.revision}`}
              approvalNote={KNOWLEDGE_CMS_ARTICLE_EDITORIAL_APPROVAL_NOTE}
              publicationNote={KNOWLEDGE_CMS_ARTICLE_EDITORIAL_PUBLICATION_NOTE}
              target={preview.next}
            />
          </section>
        ) : (
          <section className="mt-8 rounded-2xl border border-emerald-300 bg-emerald-50 p-6 text-emerald-950 shadow-sm md:p-8">
            <h2 className="text-xl font-bold">
              All 22 governed articles are privately published
            </h2>
            <p className="mt-3 text-sm leading-7">
              The next stage is private rendering-artifact parity on beta.
              Public rendering and indexing remain unchanged until the later,
              separately gated cutover workflow.
            </p>
          </section>
        )}

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6 md:p-8">
            <h2 className="text-xl font-bold text-slate-950">
              Governed article inventory
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The order is deterministic. A blocked row stops the queue rather
              than being skipped.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-100 text-xs font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-5 py-4">Article</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Revision</th>
                  <th className="px-5 py-4">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preview.targets.map((target) => (
                  <tr key={target.id}>
                    <td className="px-5 py-4">
                      <Link
                        className="font-semibold text-blue-700 hover:underline"
                        href={`/admin/knowledge/article/${encodeURIComponent(target.id)}`}
                      >
                        {target.title}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">
                        {target.canonicalPath}
                      </p>
                    </td>
                    <td className="px-5 py-4 capitalize text-slate-700">
                      {statusLabel(target.status)}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {target.revision ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      {target.issues.length === 0 ? (
                        <span className="font-semibold text-emerald-700">
                          Verified
                        </span>
                      ) : (
                        <ul className="min-w-72 list-disc space-y-1 pl-5 text-xs leading-5 text-red-800">
                          {target.issues.map((issue) => (
                            <li key={issue}>{issue}</li>
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
