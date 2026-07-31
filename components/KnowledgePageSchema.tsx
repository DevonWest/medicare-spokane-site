import { buildKnowledgePageSchema } from "@/lib/knowledgeCenter";

interface KnowledgePageSchemaProps {
  currentPath: string;
}

export default function KnowledgePageSchema({
  currentPath,
}: KnowledgePageSchemaProps) {
  const schema = buildKnowledgePageSchema(currentPath);

  if (!schema) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
      }}
    />
  );
}
