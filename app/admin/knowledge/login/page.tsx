import { notFound, redirect } from "next/navigation";
import FirebaseLoginButton from "../components/FirebaseLoginButton";
import { getCurrentKnowledgeCmsActor } from "@/lib/knowledgeCmsAdminAuth";
import { isKnowledgeCmsEnabled } from "@/lib/knowledgeCmsRepository";

export default async function KnowledgeAdminLoginPage() {
  if (!isKnowledgeCmsEnabled()) {
    notFound();
  }
  const actor = await getCurrentKnowledgeCmsActor();
  if (actor) {
    redirect("/admin/knowledge");
  }

  return (
    <section className="bg-slate-50 px-5 py-16 md:py-24">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:p-12">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">
          Private editorial workspace
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
          Sign in to manage Knowledge Center drafts
        </h1>
        <p className="mt-5 leading-7 text-slate-600">
          Access requires a verified Firebase account with explicit Knowledge
          CMS roles. Drafts do not publish to the public website.
        </p>
        <div className="mt-8">
          <FirebaseLoginButton />
        </div>
      </div>
    </section>
  );
}
