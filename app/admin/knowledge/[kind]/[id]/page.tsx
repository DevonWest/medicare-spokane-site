import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import KnowledgeRecordForm from "@/app/admin/knowledge/components/KnowledgeRecordForm";
import KnowledgeWorkflowControls from "@/app/admin/knowledge/components/KnowledgeWorkflowControls";
import {
  isKnowledgeCmsRecordId,
  isKnowledgeCmsRecordKind,
} from "@/lib/knowledgeCmsAdmin";
import { getCurrentKnowledgeCmsActor } from "@/lib/knowledgeCmsAdminAuth";
import { getKnowledgeCmsAdminRecord } from "@/lib/knowledgeCmsAdminDal";
import {
  isKnowledgeCmsEnabled,
  KnowledgeCmsNotFoundError,
} from "@/lib/knowledgeCmsRepository";

export default async function KnowledgeRecordPage({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  if (!isKnowledgeCmsEnabled()) {
    notFound();
  }
  const actor = await getCurrentKnowledgeCmsActor();
  if (!actor) {
    redirect("/admin/knowledge/login");
  }
  const { kind, id } = await params;
  if (!isKnowledgeCmsRecordKind(kind) || !isKnowledgeCmsRecordId(id)) {
    notFound();
  }

  let record;
  try {
    record = await getKnowledgeCmsAdminRecord(kind, id);
  } catch (error) {
    if (error instanceof KnowledgeCmsNotFoundError) {
      notFound();
    }
    throw error;
  }

  const title = record.kind === "faq" ? record.question : record.title;

  return (
    <section className="bg-slate-50 px-5 py-10 md:py-14">
      <div className="mx-auto max-w-5xl">
        <Link
          className="text-sm font-semibold text-blue-700 hover:underline"
          href="/admin/knowledge"
        >
          ← Back to drafts
        </Link>
        <header className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wider text-slate-600">
            <span>{record.kind}</span>
            <span>•</span>
            <span>{record.status.replace("_", " ")}</span>
            <span>•</span>
            <span>Revision {record.revision}</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            {title}
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            {record.ownedByCurrentUser ? "Owned by you" : "Owned by another editor"} ·
            last updated {new Date(record.updatedAt).toLocaleString("en-US", {
              timeZone: "America/Los_Angeles",
            })}
          </p>
        </header>
        {record.changeRequest ? (
          <aside className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-950 shadow-sm md:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em]">
              Changes requested
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7">
              {record.changeRequest.feedback}
            </p>
            <p className="mt-4 text-xs font-semibold text-amber-800">
              Returned{" "}
              {new Date(record.changeRequest.requestedAt).toLocaleString(
                "en-US",
                {
                  timeZone: "America/Los_Angeles",
                },
              )}
            </p>
          </aside>
        ) : null}
        {record.review ? (
          <aside className="mt-8 rounded-2xl border border-emerald-300 bg-emerald-50 p-6 text-emerald-950 shadow-sm md:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em]">
              Approved review
            </p>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="font-semibold text-emerald-800">Reviewer</dt>
                <dd className="mt-1 capitalize">
                  {record.review.reviewerAgentSlug.replaceAll("-", " ")}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-emerald-800">Reviewed</dt>
                <dd className="mt-1">
                  {new Date(record.review.reviewedAt).toLocaleDateString(
                    "en-US",
                    { timeZone: "UTC" },
                  )}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-emerald-800">
                  Review valid through
                </dt>
                <dd className="mt-1">
                  {new Date(
                    `${record.review.reviewDueAt}T00:00:00.000Z`,
                  ).toLocaleDateString("en-US", { timeZone: "UTC" })}
                </dd>
              </div>
            </dl>
            {record.review.decisionNote ? (
              <p className="mt-5 whitespace-pre-wrap border-t border-emerald-200 pt-5 text-sm leading-7">
                {record.review.decisionNote}
              </p>
            ) : null}
          </aside>
        ) : null}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <KnowledgeRecordForm
            key={`${kind}:${id}`}
            kind={kind}
            mode="edit"
            record={record}
          />
        </div>
        <KnowledgeWorkflowControls
          key={`${kind}:${id}:${record.revision}`}
          canApprove={record.workflowActions.approve}
          canPublish={record.workflowActions.publish}
          canRequestChanges={record.workflowActions.requestChanges}
          canSubmitForReview={record.workflowActions.submitForReview}
          canUnpublish={record.workflowActions.unpublish}
          canonicalPath={record.discoverability.canonicalPath}
          id={id}
          kind={kind}
          revision={record.revision}
        />
      </div>
    </section>
  );
}
