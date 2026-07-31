export interface FAQItem {
  id?: string;
  question: string;
  answer: string;
  schemaEligible?: boolean;
}

interface FAQProps {
  heading?: string;
  items: readonly FAQItem[];
  /** When true, emit a FAQPage JSON-LD script. */
  includeSchema?: boolean;
}

export function buildFaqPageSchema(
  items: readonly FAQItem[],
): Record<string, unknown> | undefined {
  const schemaItems = items.filter(
    (item) => item.schemaEligible !== false,
  );

  if (schemaItems.length === 0) {
    return undefined;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: schemaItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export default function FAQ({
  heading = "Frequently Asked Questions",
  items,
  includeSchema = true,
}: FAQProps) {
  const schema = buildFaqPageSchema(items);
  const schemaJson = schema
    ? JSON.stringify(schema).replace(/</g, "\\u003c")
    : undefined;

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{heading}</h2>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <details
              key={item.id ?? item.question}
              className="group bg-white rounded-lg border border-gray-200 overflow-hidden"
              open={idx === 0}
            >
              <summary className="cursor-pointer list-none p-5 flex justify-between items-start gap-4 hover:bg-gray-50">
                <span className="font-semibold text-gray-900">{item.question}</span>
                <span
                  className="text-blue-600 text-xl leading-none mt-0.5 transition-transform group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <div className="px-5 pb-5 text-gray-700 leading-relaxed border-t border-gray-100 pt-4">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>

      {includeSchema && schemaJson ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemaJson }}
        />
      ) : null}
    </section>
  );
}
