import type {
  KnowledgeCmsArticle,
  KnowledgeCmsSource,
} from "./knowledgeCms";
import type { KnowledgeCmsSeoScan } from "./knowledgeCmsSeoDal";

export const KNOWLEDGE_CMS_AI_RUN_SCHEMA_VERSION = 1 as const;

export const KNOWLEDGE_CMS_AI_TRUSTED_DOMAINS = [
  "medicare.gov",
  "cms.gov",
  "ssa.gov",
  "healthcare.gov",
  "hhs.gov",
  "hca.wa.gov",
  "insurance.wa.gov",
  "medicareinspokane.com",
] as const;

export type KnowledgeCmsAiMode =
  | "improve_article"
  | "new_article"
  | "site_strategy";

export interface KnowledgeCmsAiRequest {
  mode: KnowledgeCmsAiMode;
  prompt: string;
  deepResearch: boolean;
  parentRunId?: string;
  targetRecordId?: string;
}

export interface KnowledgeCmsAiCitation {
  title: string;
  publisher: string;
  url: string;
  note: string;
}

export interface KnowledgeCmsAiArticleDraft {
  title: string;
  summary: string;
  body: string;
  slug: string;
  pageTitle: string;
  description: string;
  canonicalPath: string;
  searchTerms: string[];
  topicIds: string[];
  faqIds: string[];
  existingPaths: string[];
  sources: KnowledgeCmsSource[];
}

export interface KnowledgeCmsAiProposal {
  summary: string;
  reasoning: string;
  recommendedActions: string[];
  draft: KnowledgeCmsAiArticleDraft | null;
  citations: KnowledgeCmsAiCitation[];
}

export interface KnowledgeCmsAiUsage {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  totalTokens: number;
  webSearchCalls: number;
  maxOutputTokens: number;
}

export interface KnowledgeCmsAiContext {
  request: KnowledgeCmsAiRequest;
  currentArticle?: KnowledgeCmsArticle;
  latestScan?: KnowledgeCmsSeoScan;
  previousProposal?: KnowledgeCmsAiProposal;
  articleInventory: Array<{
    id: string;
    title: string;
    status: KnowledgeCmsArticle["status"];
    canonicalPath?: string;
    searchTerms: string[];
  }>;
}

export interface KnowledgeCmsAiProvider {
  generate(
    context: KnowledgeCmsAiContext,
    options: { actorId: string },
  ): Promise<{
    model: string;
    proposal: KnowledgeCmsAiProposal;
    usage?: KnowledgeCmsAiUsage;
  }>;
}

export class KnowledgeCmsAiInputError extends Error {
  readonly code = "knowledge_cms_ai_input";

  constructor(readonly errors: string[]) {
    super(errors.join(" "));
    this.name = "KnowledgeCmsAiInputError";
  }
}

export class KnowledgeCmsAiProviderError extends Error {
  readonly code = "knowledge_cms_ai_provider";

  constructor(readonly reason: "invalid_response" | "unavailable" | "unconfigured") {
    super(`Knowledge CMS AI provider is unavailable (${reason}).`);
    this.name = "KnowledgeCmsAiProviderError";
  }
}

function text(
  value: unknown,
  name: string,
  maxLength: number,
  errors: string[],
): string {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    errors.push(`${name} is invalid.`);
    return "";
  }
  return value.trim();
}

function textArray(
  value: unknown,
  name: string,
  maxItems: number,
  maxLength: number,
  errors: string[],
): string[] {
  if (!Array.isArray(value) || value.length > maxItems) {
    errors.push(`${name} is invalid.`);
    return [];
  }
  return value.map((item, index) =>
    text(item, `${name}[${index}]`, maxLength, errors),
  );
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function safeHttpsUrl(
  value: unknown,
  name: string,
  errors: string[],
  options: { trustedDomain?: boolean } = {},
): string {
  const result = text(value, name, 2_000, errors);
  try {
    const parsed = new URL(result);
    if (
      parsed.protocol !== "https:" ||
      parsed.username ||
      parsed.password ||
      (options.trustedDomain !== false &&
        !KNOWLEDGE_CMS_AI_TRUSTED_DOMAINS.some(
          (domain) =>
            parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`),
        ))
    ) {
      errors.push(`${name} must use a trusted HTTPS source.`);
    }
  } catch {
    errors.push(`${name} must be a valid HTTPS URL.`);
  }
  return result;
}

function dateOnly(value: unknown, name: string, errors: string[]): string {
  const result = text(value, name, 10, errors);
  const parsed = Date.parse(`${result}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || !Number.isFinite(parsed)) {
    errors.push(`${name} must be a valid date.`);
  }
  return result;
}

function parseSources(value: unknown, errors: string[]): KnowledgeCmsSource[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 12) {
    errors.push("draft.sources is invalid.");
    return [];
  }
  return value.map((item, index) => {
    const source = record(item) ?? {};
    if (!record(item)) errors.push(`draft.sources[${index}] is invalid.`);
    const checkedAt = dateOnly(
      source.checkedAt,
      `draft.sources[${index}].checkedAt`,
      errors,
    );
    const reviewDueAt = dateOnly(
      source.reviewDueAt,
      `draft.sources[${index}].reviewDueAt`,
      errors,
    );
    const checked = Date.parse(`${checkedAt}T00:00:00.000Z`);
    const due = Date.parse(`${reviewDueAt}T00:00:00.000Z`);
    if (Number.isFinite(checked) && Number.isFinite(due)) {
      const ageDays = Math.floor((due - checked) / 86_400_000);
      if (ageDays < 0 || ageDays > 180) {
        errors.push(`draft.sources[${index}] review window is invalid.`);
      }
    }
    const kind = source.kind === "first_party" ? "first_party" : "official";
    if (source.kind !== kind) {
      errors.push(`draft.sources[${index}].kind is invalid.`);
    }
    const url = safeHttpsUrl(source.url, `draft.sources[${index}].url`, errors);
    try {
      const hostname = new URL(url).hostname;
      const firstParty =
        hostname === "medicareinspokane.com" ||
        hostname.endsWith(".medicareinspokane.com");
      if ((kind === "first_party") !== firstParty) {
        errors.push(`draft.sources[${index}].kind does not match its publisher domain.`);
      }
    } catch {
      // The URL parser above already records the validation error.
    }
    const id = text(source.id, `draft.sources[${index}].id`, 200, errors);
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(id)) {
      errors.push(`draft.sources[${index}].id is invalid.`);
    }
    return {
      id,
      kind,
      title: text(source.title, `draft.sources[${index}].title`, 500, errors),
      publisher: text(
        source.publisher,
        `draft.sources[${index}].publisher`,
        500,
        errors,
      ),
      url,
      checkedAt,
      reviewDueAt,
    };
  });
}

function parseDraft(
  value: unknown,
  mode: KnowledgeCmsAiMode,
  errors: string[],
): KnowledgeCmsAiArticleDraft | null {
  if (value === null) {
    if (mode !== "site_strategy") errors.push("An article draft is required.");
    return null;
  }
  if (mode === "site_strategy") {
    errors.push("A strategy response cannot include an applyable draft.");
    return null;
  }
  const draft = record(value);
  if (!draft) {
    errors.push("draft is invalid.");
    return null;
  }
  const slug = text(draft.slug, "draft.slug", 200, errors);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.push("draft.slug is invalid.");
  }
  const canonicalPath = text(
    draft.canonicalPath,
    "draft.canonicalPath",
    500,
    errors,
  );
  if (!/^\/(?!\/)[A-Za-z0-9/_-]*$/.test(canonicalPath) || canonicalPath.includes("..")) {
    errors.push("draft.canonicalPath is invalid.");
  }
  return {
    title: text(draft.title, "draft.title", 300, errors),
    summary: text(draft.summary, "draft.summary", 1_000, errors),
    body: text(draft.body, "draft.body", 80_000, errors),
    slug,
    pageTitle: text(draft.pageTitle, "draft.pageTitle", 200, errors),
    description: text(draft.description, "draft.description", 500, errors),
    canonicalPath,
    searchTerms: textArray(draft.searchTerms, "draft.searchTerms", 20, 200, errors),
    topicIds: textArray(draft.topicIds, "draft.topicIds", 30, 200, errors),
    faqIds: textArray(draft.faqIds, "draft.faqIds", 30, 200, errors),
    existingPaths: textArray(
      draft.existingPaths,
      "draft.existingPaths",
      30,
      500,
      errors,
    ),
    sources: parseSources(draft.sources, errors),
  };
}

export function parseKnowledgeCmsAiProposal(
  value: unknown,
  mode: KnowledgeCmsAiMode,
): KnowledgeCmsAiProposal {
  const errors: string[] = [];
  const proposal = record(value);
  if (!proposal) {
    throw new KnowledgeCmsAiInputError(["The AI response is not an object."]);
  }
  const citationsValue = Array.isArray(proposal.citations)
    ? proposal.citations
    : [];
  if (!Array.isArray(proposal.citations) || citationsValue.length > 20) {
    errors.push("citations is invalid.");
  }
  if (mode !== "site_strategy" && citationsValue.length === 0) {
    errors.push("At least one factual citation is required for an article proposal.");
  }
  const citations = citationsValue.slice(0, 20).map((item, index) => {
    const citation = record(item) ?? {};
    if (!record(item)) errors.push(`citations[${index}] is invalid.`);
    return {
      title: text(citation.title, `citations[${index}].title`, 500, errors),
      publisher: text(
        citation.publisher,
        `citations[${index}].publisher`,
        500,
        errors,
      ),
      url: safeHttpsUrl(citation.url, `citations[${index}].url`, errors, {
        trustedDomain: mode !== "site_strategy",
      }),
      note: text(citation.note, `citations[${index}].note`, 1_000, errors),
    };
  });

  const result: KnowledgeCmsAiProposal = {
    summary: text(proposal.summary, "summary", 2_000, errors),
    reasoning: text(proposal.reasoning, "reasoning", 6_000, errors),
    recommendedActions: textArray(
      proposal.recommendedActions,
      "recommendedActions",
      20,
      1_000,
      errors,
    ),
    draft: parseDraft(proposal.draft, mode, errors),
    citations,
  };
  if (errors.length > 0) {
    throw new KnowledgeCmsAiInputError([...new Set(errors)]);
  }
  return result;
}

export function parseKnowledgeCmsAiRequest(formData: FormData): KnowledgeCmsAiRequest {
  const mode = formData.get("mode");
  const parentRunId = formData.get("parentRunId");
  const prompt = formData.get("prompt");
  const targetRecordId = formData.get("targetRecordId");
  const errors: string[] = [];
  if (
    mode !== "site_strategy" &&
    mode !== "new_article" &&
    mode !== "improve_article"
  ) {
    errors.push("Choose a valid copilot task.");
  }
  const normalizedPrompt =
    typeof prompt === "string" ? prompt.trim() : "";
  if (normalizedPrompt.length < 10 || normalizedPrompt.length > 4_000) {
    errors.push("Describe the outcome in 10 to 4,000 characters.");
  }
  const normalizedTarget =
    typeof targetRecordId === "string" ? targetRecordId.trim() : "";
  const normalizedParentRunId =
    typeof parentRunId === "string" ? parentRunId.trim() : "";
  if (
    normalizedParentRunId &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      normalizedParentRunId,
    )
  ) {
    errors.push("Choose a valid prior proposal to refine.");
  }
  if (mode === "improve_article" && !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(normalizedTarget)) {
    errors.push("Choose an article to improve.");
  }
  if (errors.length > 0) throw new KnowledgeCmsAiInputError(errors);
  return {
    mode: mode as KnowledgeCmsAiMode,
    prompt: normalizedPrompt,
    deepResearch: formData.get("deepResearch") === "true",
    ...(normalizedParentRunId ? { parentRunId: normalizedParentRunId } : {}),
    ...(mode === "improve_article" ? { targetRecordId: normalizedTarget } : {}),
  };
}

export const KNOWLEDGE_CMS_AI_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "reasoning", "recommendedActions", "draft", "citations"],
  properties: {
    summary: { type: "string" },
    reasoning: { type: "string" },
    recommendedActions: { type: "array", items: { type: "string" } },
    draft: {
      anyOf: [
        { type: "null" },
        {
          type: "object",
          additionalProperties: false,
          required: [
            "title", "summary", "body", "slug", "pageTitle", "description",
            "canonicalPath", "searchTerms", "topicIds", "faqIds", "existingPaths", "sources",
          ],
          properties: {
            title: { type: "string" },
            summary: { type: "string" },
            body: { type: "string" },
            slug: { type: "string" },
            pageTitle: { type: "string" },
            description: { type: "string" },
            canonicalPath: { type: "string" },
            searchTerms: { type: "array", items: { type: "string" } },
            topicIds: { type: "array", items: { type: "string" } },
            faqIds: { type: "array", items: { type: "string" } },
            existingPaths: { type: "array", items: { type: "string" } },
            sources: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["id", "kind", "title", "publisher", "url", "checkedAt", "reviewDueAt"],
                properties: {
                  id: { type: "string" },
                  kind: { type: "string", enum: ["official", "first_party"] },
                  title: { type: "string" },
                  publisher: { type: "string" },
                  url: { type: "string" },
                  checkedAt: { type: "string" },
                  reviewDueAt: { type: "string" },
                },
              },
            },
          },
        },
      ],
    },
    citations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "publisher", "url", "note"],
        properties: {
          title: { type: "string" },
          publisher: { type: "string" },
          url: { type: "string" },
          note: { type: "string" },
        },
      },
    },
  },
} as const;
