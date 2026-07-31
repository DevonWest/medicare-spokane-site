import Link from "next/link";
import { getRelatedKnowledgeEntries } from "@/lib/knowledgeCenter";

interface RelatedKnowledgeProps {
  currentPath: string;
  heading?: string;
  intro?: string;
  limit?: number;
  tone?: "muted" | "white";
}

export default function RelatedKnowledge({
  currentPath,
  heading = "Related Medicare guides",
  intro = "Keep learning with these related guides and comparison pages.",
  limit = 6,
  tone = "muted",
}: RelatedKnowledgeProps) {
  const entries = getRelatedKnowledgeEntries(currentPath, limit);

  if (entries.length === 0) {
    return null;
  }

  const sectionClassName =
    tone === "white"
      ? "bg-white px-4 py-16"
      : "border-y border-slate-100 bg-slate-50 px-4 py-16";
  const cardClassName =
    tone === "white"
      ? "bg-slate-50"
      : "bg-white";

  return (
    <section className={sectionClassName}>
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold text-gray-900">{heading}</h2>
          <p className="mt-3 text-lg text-gray-600">{intro}</p>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry) => (
            <Link
              key={entry.path}
              href={entry.path}
              className={`group rounded-2xl border border-slate-200 p-6 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md ${cardClassName}`}
            >
              <h3 className="text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-700">
                {entry.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-700">
                {entry.summary}
              </p>
              <span className="mt-4 inline-block text-sm font-medium text-blue-700 group-hover:underline">
                Read guide →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
