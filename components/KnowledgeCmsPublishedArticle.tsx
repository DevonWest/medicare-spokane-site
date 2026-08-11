import Link from "next/link";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import Disclaimer from "@/components/Disclaimer";
import KnowledgePageEnhancements from "@/components/KnowledgePageEnhancements";
import LeadForm from "@/components/LeadForm";
import type { KnowledgeCmsArticle } from "@/lib/knowledgeCms";
import { LEAD_SOURCES, type LeadSource } from "@/lib/leadSources";
import { siteConfig, telHref } from "@/lib/site";

function leadSourceForPath(path: string): LeadSource {
  const candidate = path.replace(/^\//, "");
  return (LEAD_SOURCES as readonly string[]).includes(candidate)
    ? (candidate as LeadSource)
    : "unknown";
}

function sourceDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(parsed);
}

export default function KnowledgeCmsPublishedArticle({
  article,
  path,
}: {
  article: KnowledgeCmsArticle;
  path: string;
}) {
  return (
    <div
      data-knowledge-cms-article={article.id}
      data-knowledge-cms-revision={article.audit.revision}
    >
      <section className="bg-gradient-to-br from-blue-800 to-blue-600 px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-blue-200">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/resources" className="hover:text-white">
              Resources
            </Link>
            <span className="mx-2">/</span>
            <span>{article.title}</span>
          </nav>
          <div className="max-w-4xl">
            <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">
              {article.title}
            </h1>
            <p className="mt-5 max-w-3xl text-xl leading-8 text-blue-100">
              {article.summary}
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href={telHref}
                className="inline-flex items-center justify-center rounded-lg bg-white px-7 py-3 text-lg font-semibold text-blue-800 transition-colors hover:bg-blue-50"
              >
                Call {siteConfig.phone}
              </a>
              <Link
                href="#cms-article-help"
                className="inline-flex items-center justify-center rounded-lg border border-blue-300 bg-blue-900 px-7 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-950"
              >
                Request Local Help
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="bg-white px-4 py-14 sm:py-16">
        <article className="mx-auto max-w-3xl text-gray-800">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            urlTransform={defaultUrlTransform}
            components={{
              h1: ({ children }) => (
                <h2 className="mb-4 mt-10 text-3xl font-bold leading-tight text-gray-950 first:mt-0">
                  {children}
                </h2>
              ),
              h2: ({ children }) => (
                <h2 className="mb-4 mt-10 text-3xl font-bold leading-tight text-gray-950 first:mt-0">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mb-3 mt-8 text-2xl font-bold leading-tight text-gray-950">
                  {children}
                </h3>
              ),
              h4: ({ children }) => (
                <h4 className="mb-2 mt-6 text-xl font-semibold text-gray-950">
                  {children}
                </h4>
              ),
              p: ({ children }) => (
                <p className="my-4 text-lg leading-8 text-gray-700">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="my-5 list-disc space-y-2 pl-7 text-lg leading-8 text-gray-700">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="my-5 list-decimal space-y-2 pl-7 text-lg leading-8 text-gray-700">
                  {children}
                </ol>
              ),
              blockquote: ({ children }) => (
                <blockquote className="my-6 border-l-4 border-blue-600 bg-blue-50 px-5 py-3 text-blue-950">
                  {children}
                </blockquote>
              ),
              a: ({ href = "", children }) => {
                const external = /^https?:\/\//i.test(href);
                return (
                  <a
                    href={href}
                    className="font-semibold text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900"
                    {...(external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {children}
                  </a>
                );
              },
              table: ({ children }) => (
                <div className="my-7 overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-slate-100 text-slate-900">{children}</thead>
              ),
              th: ({ children }) => (
                <th className="px-4 py-3 font-semibold">{children}</th>
              ),
              td: ({ children }) => (
                <td className="border-t border-slate-200 px-4 py-3 align-top leading-6">
                  {children}
                </td>
              ),
              hr: () => <hr className="my-9 border-slate-200" />,
              strong: ({ children }) => (
                <strong className="font-bold text-gray-950">{children}</strong>
              ),
            }}
          >
            {article.body}
          </ReactMarkdown>

          {article.sources.length > 0 ? (
            <section className="mt-12 border-t border-slate-200 pt-8" aria-labelledby="cms-sources-heading">
              <h2 id="cms-sources-heading" className="text-2xl font-bold text-gray-950">
                Official sources
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-700">
                {article.sources.map((source) => (
                  <li key={source.id}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900"
                    >
                      {source.title}
                    </a>{" "}
                    — {source.publisher}; checked {sourceDate(source.checkedAt)}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </article>
      </main>

      <section id="cms-article-help" className="border-y border-blue-100 bg-blue-50 px-4 py-14">
        <div className="mx-auto max-w-3xl">
          <LeadForm
            source={leadSourceForPath(path)}
            heading="Request Local Help"
            subheading="Share a few details and a licensed local agent can help you understand the options we represent."
            showMessage
          />
        </div>
      </section>

      <section className="bg-white px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <Disclaimer />
        </div>
      </section>

      <KnowledgePageEnhancements
        currentPath={path}
        includeCmsParityContent
      />
    </div>
  );
}
