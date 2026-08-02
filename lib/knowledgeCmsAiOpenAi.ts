import "server-only";

import { createHash } from "node:crypto";
import OpenAI from "openai";
import {
  KNOWLEDGE_CMS_AI_RESPONSE_SCHEMA,
  KNOWLEDGE_CMS_AI_TRUSTED_DOMAINS,
  KnowledgeCmsAiInputError,
  KnowledgeCmsAiProviderError,
  parseKnowledgeCmsAiProposal,
  type KnowledgeCmsAiContext,
  type KnowledgeCmsAiProvider,
  type KnowledgeCmsAiUsage,
} from "./knowledgeCmsAi";
import {
  resolveKnowledgeCmsAiModels,
  type KnowledgeCmsCopilotRuntimeEnvironment,
} from "./knowledgeCmsCopilotReadiness";
import { env } from "./runtimeValues";

const SYSTEM_INSTRUCTIONS = `You are the private AI Content & SEO Copilot for MedicareInSpokane.com, a licensed independent insurance agency in Spokane, Washington.

Produce helpful, accurate, people-first work for an owner/editor. Never publish, approve, enable indexing, claim guaranteed rankings, provide individualized plan recommendations, or imply affiliation with Medicare or any government agency. Never invent facts, credentials, citations, performance data, or local experience. Preserve required Medicare disclaimers and distinguish editorial analysis from verified facts.

For article drafts, use only current official government or first-party sources supplied by web search. Every factual Medicare claim must be supportable by the returned sources. Write original, plain-language Markdown with useful Spokane context, clear next steps, and no keyword stuffing. Keep source review windows within 180 days. Return a complete response matching the JSON schema.

When currentArticle is supplied, preserve its established slug and canonical path unless the administrator explicitly requests a route change and the evidence supports it. When previousProposal is supplied, treat the request as a follow-up: retain its useful work, apply the requested refinement, recheck every factual statement and source, and return a complete replacement proposal rather than a partial patch.

For site strategy, evaluate evidence before recommending changes. Search competitors only to identify search intent and content gaps; never copy their language. A strategy response must set draft to null.`;

function configuredInteger(
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const value = Number(env(name));
  return Number.isSafeInteger(value) && value >= minimum && value <= maximum
    ? value
    : fallback;
}

export type KnowledgeCmsOpenAiAccessStatus =
  | "available"
  | "disabled"
  | "unavailable"
  | "unconfigured";

export type KnowledgeCmsOpenAiAccessErrorCode =
  | "access_denied"
  | "invalid_configuration"
  | "model_not_found"
  | "quota_exceeded"
  | "request_failed";

export interface KnowledgeCmsOpenAiAccessCheck {
  status: KnowledgeCmsOpenAiAccessStatus;
  routineModel?: string;
  deepModel?: string;
  errorCode?: KnowledgeCmsOpenAiAccessErrorCode;
}

export interface KnowledgeCmsOpenAiModelClient {
  models: {
    retrieve(model: string): Promise<{ id: string }>;
  };
}

export interface VerifyKnowledgeCmsOpenAiAccessOptions {
  client?: KnowledgeCmsOpenAiModelClient;
  runtime?: KnowledgeCmsCopilotRuntimeEnvironment;
}

function openAiErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const candidate = error as { status?: unknown; code?: unknown };
  const value = candidate.status ?? candidate.code;
  return typeof value === "number" ? value : Number(value) || undefined;
}

function classifyOpenAiAccessError(
  error: unknown,
): KnowledgeCmsOpenAiAccessErrorCode {
  const status = openAiErrorStatus(error);
  if (status === 401 || status === 403) return "access_denied";
  if (status === 404) return "model_not_found";
  if (status === 429) return "quota_exceeded";
  return "request_failed";
}

export async function verifyKnowledgeCmsOpenAiAccess(
  options: VerifyKnowledgeCmsOpenAiAccessOptions = {},
): Promise<KnowledgeCmsOpenAiAccessCheck> {
  const runtime = options.runtime ?? process.env;
  if (runtime.KNOWLEDGE_CMS_AI_ENABLED !== "true") {
    return { status: "disabled" };
  }
  const { routineModel, deepModel } = resolveKnowledgeCmsAiModels(runtime);
  const apiKey = runtime.OPENAI_API_KEY?.trim();
  if (!apiKey || !routineModel || !deepModel) {
    return {
      status: "unconfigured",
      ...(routineModel ? { routineModel } : {}),
      ...(deepModel ? { deepModel } : {}),
      errorCode: "invalid_configuration",
    };
  }

  const client: KnowledgeCmsOpenAiModelClient =
    options.client ??
    new OpenAI({
      apiKey,
      maxRetries: 0,
      timeout: 15_000,
    });
  try {
    await Promise.all(
      [...new Set([routineModel, deepModel])].map(async (model) => {
        const result = await client.models.retrieve(model);
        if (!result?.id) throw new Error("OpenAI model metadata was empty.");
      }),
    );
    return { status: "available", routineModel, deepModel };
  } catch (error) {
    const errorCode = classifyOpenAiAccessError(error);
    console.error("[knowledge-cms-ai] OpenAI access verification failed.", {
      errorCode,
    });
    return {
      status: "unavailable",
      routineModel,
      deepModel,
      errorCode,
    };
  }
}

function usageFromResponse(
  response: {
    output: Array<{ type: string }>;
    usage?: {
      input_tokens: number;
      input_tokens_details: { cached_tokens: number };
      output_tokens: number;
      output_tokens_details: { reasoning_tokens: number };
      total_tokens: number;
    };
  },
  maxOutputTokens: number,
): KnowledgeCmsAiUsage | undefined {
  if (!response.usage) return undefined;
  return {
    inputTokens: response.usage.input_tokens,
    cachedInputTokens: response.usage.input_tokens_details.cached_tokens,
    outputTokens: response.usage.output_tokens,
    reasoningTokens: response.usage.output_tokens_details.reasoning_tokens,
    totalTokens: response.usage.total_tokens,
    webSearchCalls: response.output.filter(
      (item) => item.type === "web_search_call",
    ).length,
    maxOutputTokens,
  };
}

function compactContext(context: KnowledgeCmsAiContext): string {
  const scan = context.latestScan;
  const article = context.currentArticle;
  return JSON.stringify({
    task: {
      mode: context.request.mode,
      prompt: context.request.prompt,
      deepResearch: context.request.deepResearch,
    },
    previousProposal: context.previousProposal ?? null,
    currentArticle: article
      ? {
          id: article.id,
          title: article.title,
          summary: article.summary,
          body: article.body,
          slug: article.slug,
          status: article.status,
          revision: article.audit.revision,
          searchTerms: article.searchTerms,
          relationships: article.relationships,
          sources: article.sources,
          discoverability: article.discoverability,
        }
      : null,
    articleInventory: context.articleInventory.slice(0, 100),
    seoEvidence: scan
      ? {
          completedAt: scan.completedAt,
          environment: scan.environment,
          searchConsoleStatus: scan.searchConsoleStatus,
          searchMetrics: scan.searchMetrics,
          summary: scan.summary,
          opportunities: scan.opportunities.slice(0, 40),
        }
      : null,
  });
}

export class OpenAiKnowledgeCmsProvider implements KnowledgeCmsAiProvider {
  private readonly client: OpenAI;

  constructor(client?: OpenAI) {
    const apiKey = env("OPENAI_API_KEY");
    if (!client && !apiKey) {
      throw new KnowledgeCmsAiProviderError("unconfigured");
    }
    this.client =
      client ??
      new OpenAI({
        apiKey,
        maxRetries: 1,
        timeout: configuredInteger(
          "KNOWLEDGE_CMS_AI_TIMEOUT_MS",
          180_000,
          30_000,
          240_000,
        ),
      });
  }

  async generate(context: KnowledgeCmsAiContext, options: { actorId: string }) {
    const deep = context.request.deepResearch;
    const { routineModel, deepModel } = resolveKnowledgeCmsAiModels();
    const model = deep ? deepModel : routineModel;
    if (!model) {
      throw new KnowledgeCmsAiProviderError("unconfigured");
    }
    const strategy = context.request.mode === "site_strategy";
    const maxOutputTokens = deep
      ? configuredInteger(
          "KNOWLEDGE_CMS_AI_DEEP_MAX_OUTPUT_TOKENS",
          24_000,
          4_000,
          40_000,
        )
      : configuredInteger(
          "KNOWLEDGE_CMS_AI_MAX_OUTPUT_TOKENS",
          16_000,
          4_000,
          40_000,
        );
    let response;
    try {
      response = await this.client.responses.create({
        model,
        instructions: SYSTEM_INSTRUCTIONS,
        input: compactContext(context),
        store: false,
        max_output_tokens: maxOutputTokens,
        safety_identifier: createHash("sha256")
          .update(`knowledge-cms:${options.actorId}`)
          .digest("hex"),
        reasoning: { effort: deep ? "high" : "medium" },
        tools: [
          {
            type: "web_search",
            search_context_size: deep ? "high" : "medium",
            ...(strategy
              ? {}
              : { filters: { allowed_domains: [...KNOWLEDGE_CMS_AI_TRUSTED_DOMAINS] } }),
            user_location: {
              type: "approximate",
              country: "US",
              region: "Washington",
              city: "Spokane",
            },
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "knowledge_cms_ai_proposal",
            strict: true,
            schema: KNOWLEDGE_CMS_AI_RESPONSE_SCHEMA,
          },
        },
      });
    } catch (error) {
      console.error("[knowledge-cms-ai] OpenAI request failed.", {
        error: error instanceof Error ? error.name : "unknown",
      });
      throw new KnowledgeCmsAiProviderError("unavailable");
    }
    if (!response.output_text) {
      throw new KnowledgeCmsAiProviderError("invalid_response");
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(response.output_text);
    } catch {
      throw new KnowledgeCmsAiProviderError("invalid_response");
    }
    let proposal;
    try {
      proposal = parseKnowledgeCmsAiProposal(parsed, context.request.mode);
    } catch (error) {
      if (error instanceof KnowledgeCmsAiInputError) {
        console.error("[knowledge-cms-ai] Structured response failed validation.", {
          errorCount: error.errors.length,
        });
        throw new KnowledgeCmsAiProviderError("invalid_response");
      }
      throw error;
    }
    const usage = usageFromResponse(response, maxOutputTokens);
    return {
      model,
      proposal,
      ...(usage ? { usage } : {}),
    };
  }
}
