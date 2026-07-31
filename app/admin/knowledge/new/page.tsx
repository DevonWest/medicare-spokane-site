import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import KnowledgeRecordForm from "../components/KnowledgeRecordForm";
import {
  isKnowledgeCmsRecordKind,
  KNOWLEDGE_CMS_RECORD_KINDS,
} from "@/lib/knowledgeCmsAdmin";
import { getCurrentKnowledgeCmsActor } from "@/lib/knowledgeCmsAdminAuth";
import { getKnowledgeCmsAuthorizationDecision } from "@/lib/knowledgeCms";
import { isKnowledgeCmsEnabled } from "@/lib/knowledgeCmsRepository";

export default async function NewKnowledgeRecordPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  if (!isKnowledgeCmsEnabled()) {
    notFound();
  }
  const actor = await getCurrentKnowledgeCmsActor();
  if (!actor) {
    redirect("/admin/knowledge/login");
  }
  const { kind: requestedKind } = await searchParams;
  const kind = isKnowledgeCmsRecordKind(requestedKind)
    ? requestedKind
    : "article";
  const canCreate = getKnowledgeCmsAuthorizationDecision(actor, "create").allowed;

  return (
    <section className="bg-slate-50 px-5 py-10 md:py-14">
      <div className="mx-auto max-w-5xl">
        <Link
          className="text-sm font-semibold text-blue-700 hover:underline"
          href="/admin/knowledge"
        >
          ← Back to drafts
        </Link>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">
            New private draft
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Create a {kind}
          </h1>
          <div className="mt-5 flex flex-wrap gap-2">
            {KNOWLEDGE_CMS_RECORD_KINDS.map((candidate) => (
              <Link
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  candidate === kind
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                href={`/admin/knowledge/new?kind=${candidate}`}
                key={candidate}
              >
                {candidate}
              </Link>
            ))}
          </div>
        </div>

        {!canCreate ? (
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            Your assigned CMS roles do not allow draft creation.
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <KnowledgeRecordForm key={kind} kind={kind} mode="create" />
          </div>
        )}
      </div>
    </section>
  );
}
