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
} from "./knowledgeCmsAi";
import { env } from "./runtimeValues";

const SYSTEM_INSTRUCTIONS = `You are the private AI Content & SEO Copilot for MedicareInSpokane.com, a licensed independent insurance agency in Spokane, Washington.

Produce helpful, accurate, people-first work for an owner/editor. Never publish, approve, enable indexing, claim guaranteed rankings, provide individualized plan recommendations, or imply affiliation with Medicare or any government agency. Never invent facts, credentials, citations, performance data, or local experience. Preserve required Medicare disclaimers and distinguish editorial analysis from verified facts.

For article drafts, use only current official government or first-party sources supplied by web search. Every factual Medicare claim must be supportable by the returned sources. Write original, plain-language Markdown with useful Spokane context, clear next steps, and no keyword stuffing. Keep source review windows within 180 days. Return a complete response matching the JSON schema.

For site strategy, evaluate evidence before recommending changes. Search competitors only to identify search intent and content gaps; never copy their language. A strategy response must set draft to null.`;

function configuredModel(name: string, fallback: string): string {
  const value = env(name);
  return value && /^gpt-[A-Za-z0-9._-]{1,80}$/.test(value) ? value : fallback;
}

function compactContext(context: KnowledgeCmsAiContext): string {
  const scan = context.latestScan;
  const article = context.currentArticle;
  return JSON.stringify({
    task: context.request,
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
    this.client = client ?? new OpenAI({ apiKey });
  }

  async generate(context: KnowledgeCmsAiContext, options: { actorId: string }) {
    const deep = context.request.deepResearch;
    const model = deep
      ? configuredModel("KNOWLEDGE_CMS_AI_DEEP_MODEL", "gpt-5.6-sol")
      : configuredModel("KNOWLEDGE_CMS_AI_MODEL", "gpt-5.6-terra");
    const strategy = context.request.mode === "site_strategy";
    let response;
    try {
      response = await this.client.responses.create({
        model,
        instructions: SYSTEM_INSTRUCTIONS,
        input: compactContext(context),
        store: false,
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
    return {
      model,
      proposal,
    };
  }
}
