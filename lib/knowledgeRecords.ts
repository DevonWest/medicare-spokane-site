export type KnowledgeRecordStatus = "draft" | "published";

export type KnowledgeFactEvidence =
  | {
      kind: "official-sources";
      sourceIds: string[];
    }
  | {
      kind: "first-party";
      owner: string;
    };

export interface KnowledgeFact {
  id: string;
  statement: string;
  status: KnowledgeRecordStatus;
  topicSlugs: string[];
  evidence: KnowledgeFactEvidence;
  checkedAt: string;
  reviewDueAt?: string;
}

export type KnowledgeFaqCategoryId =
  | "agency"
  | "coverage"
  | "eligibility"
  | "enrollment"
  | "prescription-drugs";

export interface KnowledgeFaq {
  id: string;
  question: string;
  answer: string;
  status: KnowledgeRecordStatus;
  categoryId: KnowledgeFaqCategoryId;
  topicSlugs: string[];
  factIds: string[];
  searchTerms: string[];
  updatedAt: string;
  schemaEligible: boolean;
  answeredByAgentSlug?: string;
}

export interface KnowledgeSearchDocument {
  id: string;
  kind: "fact" | "faq";
  title: string;
  body: string;
  topicSlugs: string[];
  searchTerms: string[];
  relatedFactIds: string[];
  sourceIds: string[];
}

export const KNOWLEDGE_FACT_MAX_AGE_DAYS = 180;

const checkedAt = "2026-07-30";

export const knowledgeFacts: KnowledgeFact[] = [
  {
    id: "medicare-initial-enrollment-period",
    statement:
      "For most people first eligible for Medicare at 65, the Initial Enrollment Period is a seven-month window that begins three months before the month they turn 65 and ends three months after that month.",
    status: "published",
    topicSlugs: ["medicare-enrollment", "medicare-for-seniors"],
    evidence: {
      kind: "official-sources",
      sourceIds: ["medicare-sign-up"],
    },
    checkedAt,
  },
  {
    id: "medicare-individual-coverage",
    statement:
      "Medicare coverage is individual and does not offer a single plan for a couple or family.",
    status: "published",
    topicSlugs: ["medicare-enrollment", "medicare-for-seniors"],
    evidence: {
      kind: "official-sources",
      sourceIds: ["medicare-how-it-works"],
    },
    checkedAt,
  },
  {
    id: "medicare-and-job-based-coverage",
    statement:
      "The timing of Medicare enrollment for someone with their own or a spouse's current job-based coverage depends on how that coverage coordinates with Medicare; some people may be able to delay Part B without a late enrollment penalty.",
    status: "published",
    topicSlugs: ["medicare-enrollment", "medicare-for-seniors"],
    evidence: {
      kind: "official-sources",
      sourceIds: ["medicare-working-past-65"],
    },
    checkedAt,
  },
  {
    id: "original-medicare-parts-and-costs",
    statement:
      "Original Medicare includes Part A and Part B. Most people do not pay a Part A premium because they or a spouse paid Medicare taxes long enough, while Part B has a monthly premium.",
    status: "published",
    topicSlugs: ["medicare-enrollment", "medicare-for-seniors"],
    evidence: {
      kind: "official-sources",
      sourceIds: ["medicare-parts", "medicare-costs"],
    },
    checkedAt,
  },
  {
    id: "provider-access-varies-by-coverage",
    statement:
      "Original Medicare generally allows care from any doctor or hospital that takes Medicare, while many Medicare Advantage plans use provider networks.",
    status: "published",
    topicSlugs: ["medicare-advantage", "medicare-supplement"],
    evidence: {
      kind: "official-sources",
      sourceIds: ["medicare-parts", "medicare-compare-coverage"],
    },
    checkedAt,
  },
  {
    id: "medicare-nursing-home-limits",
    statement:
      "Medicare may cover short-term skilled nursing facility care when its requirements are met, but it generally does not cover long-term custodial nursing home care.",
    status: "published",
    topicSlugs: ["medicare-for-seniors"],
    evidence: {
      kind: "official-sources",
      sourceIds: ["medicare-nursing-home-care"],
    },
    checkedAt,
  },
  {
    id: "missed-medicare-enrollment-window",
    statement:
      "A person who misses an applicable Medicare enrollment window and does not qualify for a Special Enrollment Period may have to wait to enroll and may owe a late enrollment penalty.",
    status: "published",
    topicSlugs: ["medicare-enrollment", "medicare-for-seniors"],
    evidence: {
      kind: "official-sources",
      sourceIds: ["medicare-coverage-start"],
    },
    checkedAt,
  },
  {
    id: "medicare-advantage-part-c",
    statement:
      "Medicare Advantage, also called Part C, is a Medicare-approved plan from a private company that provides an alternative way to receive Part A and Part B benefits; most plans include Part D and many offer additional benefits.",
    status: "published",
    topicSlugs: ["medicare-advantage"],
    evidence: {
      kind: "official-sources",
      sourceIds: ["medicare-coverage-options"],
    },
    checkedAt,
  },
  {
    id: "medicare-part-d-coverage",
    statement:
      "Medicare Part D is prescription drug coverage offered through Medicare-approved private plans, either as a standalone drug plan or as part of many Medicare Advantage plans.",
    status: "published",
    topicSlugs: ["medicare-part-d"],
    evidence: {
      kind: "official-sources",
      sourceIds: ["medicare-part-d"],
    },
    checkedAt,
  },
  {
    id: "creditable-prescription-drug-coverage",
    statement:
      "Creditable prescription drug coverage is expected to pay, on average, at least as much as Medicare drug coverage and can help a person avoid a Part D late enrollment penalty while delaying Part D.",
    status: "published",
    topicSlugs: ["medicare-enrollment", "medicare-part-d"],
    evidence: {
      kind: "official-sources",
      sourceIds: ["medicare-creditable-coverage"],
    },
    checkedAt,
  },
  {
    id: "agency-government-non-affiliation",
    statement:
      "Health Insurance Options LLC states that it is an independent insurance agency and is not affiliated with or endorsed by CMS, Medicare.gov, the Social Security Administration, or HHS.",
    status: "published",
    topicSlugs: [],
    evidence: {
      kind: "first-party",
      owner: "Health Insurance Options LLC",
    },
    checkedAt,
  },
];

export const knowledgeFaqs: KnowledgeFaq[] = [
  {
    id: "initial-enrollment-period",
    question: "When am I eligible to enroll in Medicare?",
    answer:
      "Most people first become eligible during their Initial Enrollment Period — the seven-month window that begins three months before the month you turn 65 and ends three months after. People who qualify due to disability or certain conditions may become eligible earlier.",
    status: "published",
    categoryId: "eligibility",
    topicSlugs: ["medicare-enrollment", "medicare-for-seniors"],
    factIds: ["medicare-initial-enrollment-period"],
    searchTerms: ["age 65", "initial enrollment period", "Medicare eligibility"],
    updatedAt: checkedAt,
    schemaEligible: true,
  },
  {
    id: "dependent-spouse",
    question: "Can a dependent spouse be covered under my Medicare?",
    answer:
      "No. Medicare is individual coverage. Each spouse enrolls on their own once they qualify. We can help coordinate the timing of each spouse’s enrollment.",
    status: "published",
    categoryId: "eligibility",
    topicSlugs: ["medicare-enrollment", "medicare-for-seniors"],
    factIds: ["medicare-individual-coverage"],
    searchTerms: ["dependent coverage", "Medicare spouse", "married couple"],
    updatedAt: checkedAt,
    schemaEligible: true,
  },
  {
    id: "employer-coverage",
    question: "Can I keep my employer (or my spouse’s employer) coverage?",
    answer:
      "Often yes, but it depends on the employer’s size and how the plan coordinates with Medicare. We can review your situation and help you decide whether to delay Medicare Part B, enroll in Part A only, or transition fully to Medicare.",
    status: "published",
    categoryId: "enrollment",
    topicSlugs: ["medicare-enrollment", "medicare-for-seniors"],
    factIds: ["medicare-and-job-based-coverage"],
    searchTerms: ["employer insurance", "job-based coverage", "working past 65"],
    updatedAt: checkedAt,
    schemaEligible: true,
  },
  {
    id: "parts-a-and-b",
    question: "Do I need both Part A and Part B?",
    answer:
      "Most people end up with both. Part A (hospital) is usually premium-free if you or your spouse worked enough quarters. Part B (medical) has a monthly premium and may be delayed in some situations without penalty if you have other creditable coverage.",
    status: "published",
    categoryId: "coverage",
    topicSlugs: ["medicare-enrollment", "medicare-for-seniors"],
    factIds: [
      "original-medicare-parts-and-costs",
      "medicare-and-job-based-coverage",
    ],
    searchTerms: ["Original Medicare", "Part A", "Part B", "premium-free Part A"],
    updatedAt: checkedAt,
    schemaEligible: true,
  },
  {
    id: "provider-access",
    question: "Can I keep my doctors after switching to Medicare?",
    answer:
      "It depends on the type of plan you choose. With Original Medicare plus a Medicare Supplement you can generally see any provider in the U.S. who accepts Medicare. Medicare Advantage plans use networks, so we will help you confirm whether your doctors are in-network for the plans we represent.",
    status: "published",
    categoryId: "coverage",
    topicSlugs: ["medicare-advantage", "medicare-supplement"],
    factIds: ["provider-access-varies-by-coverage"],
    searchTerms: ["doctor network", "keep my doctor", "provider access"],
    updatedAt: checkedAt,
    schemaEligible: true,
  },
  {
    id: "nursing-home-care",
    question: "Does Medicare cover nursing home care?",
    answer:
      "Medicare provides limited skilled nursing facility coverage after a qualifying hospital stay, but it does not pay for long-term custodial care. Long-term care is generally covered by long-term care insurance, Medicaid (if eligible), or out-of-pocket.",
    status: "published",
    categoryId: "coverage",
    topicSlugs: ["medicare-for-seniors"],
    factIds: ["medicare-nursing-home-limits"],
    searchTerms: ["custodial care", "long-term care", "skilled nursing facility"],
    updatedAt: checkedAt,
    schemaEligible: true,
  },
  {
    id: "missed-enrollment-window",
    question: "What if I miss my enrollment window?",
    answer:
      "If you miss your Initial Enrollment Period and do not qualify for a Special Enrollment Period, you may have to wait for the General Enrollment Period and may owe a late enrollment penalty. We can help you understand your options.",
    status: "published",
    categoryId: "enrollment",
    topicSlugs: ["medicare-enrollment", "medicare-for-seniors"],
    factIds: ["missed-medicare-enrollment-window"],
    searchTerms: ["general enrollment period", "late enrollment penalty", "missed Medicare enrollment"],
    updatedAt: checkedAt,
    schemaEligible: true,
  },
  {
    id: "part-c-basics",
    question: "What is Part C?",
    answer:
      "Part C is Medicare Advantage — an alternative way to receive your Medicare benefits through a private insurance carrier approved by Medicare. Most plans bundle Parts A, B, and D plus extra benefits.",
    status: "published",
    categoryId: "coverage",
    topicSlugs: ["medicare-advantage"],
    factIds: ["medicare-advantage-part-c"],
    searchTerms: ["Medicare Advantage", "Part C"],
    updatedAt: checkedAt,
    schemaEligible: true,
  },
  {
    id: "part-d-basics",
    question: "What is Part D?",
    answer:
      "Part D is the prescription drug benefit. It is offered through standalone Part D plans (often paired with Original Medicare and a Medigap plan) or as part of most Medicare Advantage plans.",
    status: "published",
    categoryId: "prescription-drugs",
    topicSlugs: ["medicare-part-d"],
    factIds: ["medicare-part-d-coverage"],
    searchTerms: ["drug plan", "Medicare Part D", "prescription coverage"],
    updatedAt: checkedAt,
    schemaEligible: true,
  },
  {
    id: "creditable-coverage",
    question: "What is ‘creditable coverage’?",
    answer:
      "Creditable coverage is prescription drug coverage that pays, on average, at least as much as standard Medicare Part D. Maintaining creditable coverage helps you avoid the Part D late enrollment penalty if you delay enrolling in Part D.",
    status: "published",
    categoryId: "prescription-drugs",
    topicSlugs: ["medicare-enrollment", "medicare-part-d"],
    factIds: ["creditable-prescription-drug-coverage"],
    searchTerms: ["creditable drug coverage", "Part D penalty"],
    updatedAt: checkedAt,
    schemaEligible: true,
  },
  {
    id: "government-affiliation",
    question: "Are you affiliated with the government?",
    answer:
      "No. Health Insurance Options LLC is a licensed independent insurance agency. We are not affiliated with or endorsed by CMS, Medicare.gov, the Social Security Administration, or HHS.",
    status: "published",
    categoryId: "agency",
    topicSlugs: [],
    factIds: ["agency-government-non-affiliation"],
    searchTerms: ["CMS affiliation", "government agency", "Medicare.gov affiliation"],
    updatedAt: checkedAt,
    schemaEligible: true,
  },
];

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function addUtcDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function resolveAsOfDate(asOf: string | Date): Date {
  return typeof asOf === "string" ? parseDateOnly(asOf) : asOf;
}

export function isKnowledgeFactExpired(
  fact: Pick<KnowledgeFact, "checkedAt" | "reviewDueAt">,
  asOf: string | Date = new Date(),
): boolean {
  const checkedAtDate = parseDateOnly(fact.checkedAt);
  const maximumDueAt = addUtcDays(
    checkedAtDate,
    KNOWLEDGE_FACT_MAX_AGE_DAYS,
  );
  const requestedDueAt = fact.reviewDueAt
    ? parseDateOnly(fact.reviewDueAt)
    : maximumDueAt;
  const effectiveDueAt =
    requestedDueAt.getTime() < maximumDueAt.getTime()
      ? requestedDueAt
      : maximumDueAt;

  if (
    Number.isNaN(checkedAtDate.getTime()) ||
    Number.isNaN(effectiveDueAt.getTime())
  ) {
    return true;
  }

  return resolveAsOfDate(asOf).getTime() > effectiveDueAt.getTime();
}

export function getKnowledgeFactSourceIds(fact: KnowledgeFact): string[] {
  return fact.evidence.kind === "official-sources"
    ? fact.evidence.sourceIds
    : [];
}

export function getPublishedKnowledgeFacts(
  records: KnowledgeFact[] = knowledgeFacts,
): KnowledgeFact[] {
  return records.filter((fact) => fact.status === "published");
}

export function getPublishedKnowledgeFaqs(
  records: KnowledgeFaq[] = knowledgeFaqs,
): KnowledgeFaq[] {
  return records.filter((faq) => faq.status === "published");
}

export function buildKnowledgeRecordSearchDocuments(
  facts: KnowledgeFact[] = knowledgeFacts,
  faqs: KnowledgeFaq[] = knowledgeFaqs,
): KnowledgeSearchDocument[] {
  const publishedFacts = getPublishedKnowledgeFacts(facts);
  const publishedFactById = new Map(
    publishedFacts.map((fact) => [fact.id, fact]),
  );
  const factDocuments: KnowledgeSearchDocument[] = publishedFacts.map(
    (fact) => ({
      id: `fact:${fact.id}`,
      kind: "fact",
      title: fact.statement,
      body: fact.statement,
      topicSlugs: [...fact.topicSlugs],
      searchTerms: [],
      relatedFactIds: [],
      sourceIds: getKnowledgeFactSourceIds(fact),
    }),
  );
  const faqDocuments: KnowledgeSearchDocument[] = getPublishedKnowledgeFaqs(
    faqs,
  ).map((faq) => ({
    id: `faq:${faq.id}`,
    kind: "faq",
    title: faq.question,
    body: faq.answer,
    topicSlugs: [...faq.topicSlugs],
    searchTerms: [...faq.searchTerms],
    relatedFactIds: faq.factIds.filter((id) => publishedFactById.has(id)),
    sourceIds: [
      ...new Set(
        faq.factIds.flatMap((id) => {
          const fact = publishedFactById.get(id);
          return fact ? getKnowledgeFactSourceIds(fact) : [];
        }),
      ),
    ],
  }));

  return [...faqDocuments, ...factDocuments];
}
