import BreadcrumbSchema from "@/components/BreadcrumbSchema";
import FAQ from "@/components/FAQ";
import KnowledgeAuthority from "@/components/KnowledgeAuthority";
import KnowledgePageSchema from "@/components/KnowledgePageSchema";
import RelatedKnowledge from "@/components/RelatedKnowledge";
import { getKnowledgeGraph } from "@/lib/knowledgeCenter";

interface KnowledgePageEnhancementsProps {
  currentPath: string;
  includeCmsParityContent?: boolean;
  relatedLimit?: number;
}

export default function KnowledgePageEnhancements({
  currentPath,
  includeCmsParityContent = false,
  relatedLimit,
}: KnowledgePageEnhancementsProps) {
  const graph = getKnowledgeGraph(currentPath);

  if (!graph) {
    return null;
  }

  const isHealthInsurance =
    graph.entry.categoryId === "health-insurance";
  const resolvedRelatedLimit =
    relatedLimit ?? (isHealthInsurance ? 4 : 6);
  const review =
    graph.entry.review?.status === "reviewed"
      ? graph.entry.review
      : undefined;
  const hasAuthority =
    graph.sources.length > 0 || Boolean(review && graph.reviewer);

  return (
    <>
      <KnowledgePageSchema currentPath={currentPath} />
      {includeCmsParityContent ? (
        <BreadcrumbSchema
          items={[
            { name: "Home", path: "/" },
            { name: "Resources", path: "/resources" },
            { name: graph.entry.title },
          ]}
        />
      ) : null}

      {includeCmsParityContent && graph.faqs.length > 0 ? (
        <FAQ items={graph.faqs} />
      ) : null}

      {hasAuthority ? (
        <section className="bg-white px-4 py-12">
          <div className="mx-auto max-w-3xl">
            <KnowledgeAuthority currentPath={currentPath} />
          </div>
        </section>
      ) : null}

      <RelatedKnowledge
        currentPath={currentPath}
        heading={
          isHealthInsurance
            ? "Related health insurance guides"
            : "Related Medicare guides"
        }
        intro={
          isHealthInsurance
            ? "Continue with related Spokane-area health insurance guidance."
            : "Continue with related Spokane Medicare guides and comparison pages."
        }
        limit={resolvedRelatedLimit}
      />
    </>
  );
}
