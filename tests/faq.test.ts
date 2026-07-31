import assert from "node:assert/strict";
import test from "node:test";
import { buildFaqPageSchema, type FAQItem } from "../components/FAQ";
import { getKnowledgeFaqsForPath } from "../lib/knowledgeCenter";

test("FAQ schema contains the same governed questions and answers rendered on the page", () => {
  const faqs = getKnowledgeFaqsForPath("/medicare-faq");
  const schema = buildFaqPageSchema(faqs);

  assert.ok(schema);

  const entities = schema.mainEntity as Array<{
    name: string;
    acceptedAnswer: { text: string };
  }>;

  assert.deepEqual(
    entities.map((entity) => ({
      question: entity.name,
      answer: entity.acceptedAnswer.text,
    })),
    faqs.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
    })),
  );
});

test("visible FAQ records can be explicitly excluded from structured data", () => {
  const items: FAQItem[] = [
    {
      id: "eligible",
      question: "Included question?",
      answer: "Included answer.",
      schemaEligible: true,
    },
    {
      id: "not-eligible",
      question: "Visible but excluded question?",
      answer: "Visible but excluded answer.",
      schemaEligible: false,
    },
  ];
  const schema = buildFaqPageSchema(items);

  assert.ok(schema);

  const entities = schema.mainEntity as Array<{ name: string }>;
  assert.deepEqual(
    entities.map((entity) => entity.name),
    ["Included question?"],
  );
});

test("FAQ schema is omitted when no visible record is schema eligible", () => {
  assert.equal(
    buildFaqPageSchema([
      {
        question: "Visible question?",
        answer: "Visible answer.",
        schemaEligible: false,
      },
    ]),
    undefined,
  );
});
