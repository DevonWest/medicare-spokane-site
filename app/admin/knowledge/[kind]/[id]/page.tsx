import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import KnowledgeRecordForm from "@/app/admin/knowledge/components/KnowledgeRecordForm";
import {
  isKnowledgeCmsRecordKind,
} from "@/lib/knowledgeCmsAdmin";
import { getCurrentKnowledgeCmsActor } from "@/lib/knowledgeCmsAdminAuth";
import { getKnowledgeCmsAdminRecord } from "@/lib/knowledgeCmsAdminDal";
import {
  isKnowledgeCmsEnabled,
  KnowledgeCmsNotFoundError,
} from "@/lib/knowledgeCmsRepository";

const recordIdPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;

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
  if (!isKnowledgeCmsRecordKind(kind) || !recordIdPattern.test(id)) {
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
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <KnowledgeRecordForm
            key={`${kind}:${id}`}
            kind={kind}
            mode="edit"
            record={record}
          />
        </div>
      </div>
    </section>
  );
}
