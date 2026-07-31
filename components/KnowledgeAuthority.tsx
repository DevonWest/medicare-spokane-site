import Link from "next/link";
import { getKnowledgeGraph } from "@/lib/knowledgeCenter";
import { siteConfig } from "@/lib/site";
import { getTeamMemberProfilePath } from "@/lib/team";

interface KnowledgeAuthorityProps {
  currentPath: string;
  className?: string;
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

export default function KnowledgeAuthority({
  currentPath,
  className = "",
}: KnowledgeAuthorityProps) {
  const graph = getKnowledgeGraph(currentPath);

  if (!graph) {
    return null;
  }

  const review =
    graph.entry.review?.status === "reviewed"
      ? graph.entry.review
      : undefined;

  if (graph.sources.length === 0 && (!review || !graph.reviewer)) {
    return null;
  }

  return (
    <aside
      aria-label="Reference and review information"
      className={`rounded-2xl border border-slate-200 bg-slate-50 p-6 ${className}`}
    >
      {review && graph.reviewer ? (
        <div className="border-b border-slate-200 pb-5">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            Reviewed for accuracy
          </p>
          <p className="mt-2 text-base text-gray-700">
            Reviewed by{" "}
            <Link
              href={getTeamMemberProfilePath(graph.reviewer)}
              className="font-semibold text-blue-700 hover:underline"
            >
              {graph.reviewer.name}
            </Link>
            , {graph.reviewer.title}, on{" "}
            <time dateTime={review.reviewedAt}>
              {formatDate(review.reviewedAt)}
            </time>
            .
          </p>
        </div>
      ) : null}

      {graph.sources.length > 0 ? (
        <div className={review && graph.reviewer ? "pt-5" : undefined}>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            Official reference sources
          </p>
          <ul className="mt-3 space-y-3">
            {graph.sources.map((source) => (
              <li key={source.id} className="text-sm leading-relaxed text-gray-700">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-700 hover:underline"
                >
                  {source.title}
                </a>{" "}
                <span className="text-gray-500">
                  ({source.publisher}; checked{" "}
                  <time dateTime={source.lastChecked}>
                    {formatDate(source.lastChecked)}
                  </time>
                  )
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-5 border-t border-slate-200 pt-5">
        <Link
          href={siteConfig.editorialStandardsPath}
          className="text-sm font-semibold text-blue-700 hover:underline"
        >
          How we research, review, and correct our educational pages
        </Link>
      </div>
    </aside>
  );
}
