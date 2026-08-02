import "server-only";

export type KnowledgeCmsCopilotReadinessState =
  | "blocked"
  | "disabled"
  | "ready";

export interface KnowledgeCmsCopilotReadinessCheck {
  id: "ai" | "cms" | "continuous" | "search_console" | "seo";
  label: string;
  state: KnowledgeCmsCopilotReadinessState;
  detail: string;
}

export interface KnowledgeCmsCopilotReadiness {
  checks: KnowledgeCmsCopilotReadinessCheck[];
  readyCount: number;
  totalCount: number;
}

type RuntimeEnvironment = Record<string, string | undefined>;

function enabled(value: string | undefined): boolean {
  return value === "true";
}

function configured(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function validModel(value: string | undefined, fallback: string): string | undefined {
  const candidate = value?.trim() || fallback;
  return /^gpt-[A-Za-z0-9._-]{1,80}$/.test(candidate) ? candidate : undefined;
}

function validSearchConsoleSite(value: string | undefined): string | undefined {
  const candidate = value?.trim();
  if (!candidate || candidate.length > 500 || /\s/.test(candidate)) {
    return undefined;
  }
  if (/^sc-domain:[a-z0-9.-]+$/i.test(candidate)) {
    return candidate.toLowerCase();
  }
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password
      ? parsed.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function check(
  id: KnowledgeCmsCopilotReadinessCheck["id"],
  label: string,
  state: KnowledgeCmsCopilotReadinessState,
  detail: string,
): KnowledgeCmsCopilotReadinessCheck {
  return { id, label, state, detail };
}

export function getKnowledgeCmsCopilotReadiness(
  runtime: RuntimeEnvironment = process.env,
): KnowledgeCmsCopilotReadiness {
  const cmsEnabled = enabled(runtime.KNOWLEDGE_CMS_ENABLED);
  const seoEnabled = enabled(runtime.KNOWLEDGE_CMS_SEO_ENABLED);
  const searchConsoleEnabled = enabled(
    runtime.KNOWLEDGE_CMS_SEARCH_CONSOLE_ENABLED,
  );
  const aiEnabled = enabled(runtime.KNOWLEDGE_CMS_AI_ENABLED);
  const continuousEnabled = enabled(
    runtime.KNOWLEDGE_CMS_CONTINUOUS_SEO_ENABLED,
  );
  const searchConsoleSite = validSearchConsoleSite(
    runtime.SEARCH_CONSOLE_SITE_URL,
  );
  const routineModel = validModel(
    runtime.KNOWLEDGE_CMS_AI_MODEL,
    "gpt-5.6-terra",
  );
  const deepModel = validModel(
    runtime.KNOWLEDGE_CMS_AI_DEEP_MODEL,
    "gpt-5.6-sol",
  );

  const checks: KnowledgeCmsCopilotReadinessCheck[] = [
    check(
      "cms",
      "Private CMS",
      cmsEnabled ? "ready" : "blocked",
      cmsEnabled
        ? "The authenticated editorial workspace is enabled."
        : "Enable the private CMS before activating copilot features.",
    ),
    check(
      "seo",
      "SEO evidence scanner",
      !seoEnabled ? "disabled" : cmsEnabled ? "ready" : "blocked",
      !seoEnabled
        ? "The scanner gate is off."
        : cmsEnabled
          ? "Manual technical, content, and source-freshness scans are available."
          : "The scanner requires the private CMS gate.",
    ),
    check(
      "search_console",
      "Search Console evidence",
      !searchConsoleEnabled
        ? "disabled"
        : cmsEnabled && seoEnabled && searchConsoleSite
          ? "ready"
          : "blocked",
      !searchConsoleEnabled
        ? "Search Console collection is off."
        : !cmsEnabled || !seoEnabled
          ? "Search Console evidence requires both the CMS and SEO scanner."
          : searchConsoleSite
            ? `Configured for ${searchConsoleSite}; a completed scan verifies access.`
            : "Set a valid Search Console domain property or HTTPS site URL.",
    ),
    check(
      "ai",
      "AI research and drafting",
      !aiEnabled
        ? "disabled"
        : cmsEnabled &&
            seoEnabled &&
            configured(runtime.OPENAI_API_KEY) &&
            routineModel &&
            deepModel
          ? "ready"
          : "blocked",
      !aiEnabled
        ? "The AI copilot gate is off."
        : !cmsEnabled || !seoEnabled
          ? "AI requires both the private CMS and SEO scanner."
          : !configured(runtime.OPENAI_API_KEY)
            ? "The server-side OpenAI API key is not attached."
            : !routineModel || !deepModel
              ? "One or more configured model IDs are invalid."
              : `Routine ${routineModel}; deep research ${deepModel}.`,
    ),
    check(
      "continuous",
      "Recurring evidence scans",
      !continuousEnabled
        ? "disabled"
        : cmsEnabled &&
            seoEnabled &&
            (runtime.KNOWLEDGE_CMS_SEO_CRON_TOKEN?.length ?? 0) >= 32
          ? "ready"
          : "blocked",
      !continuousEnabled
        ? "The scheduled endpoint gate is off."
        : !cmsEnabled || !seoEnabled
          ? "Recurring scans require both the private CMS and SEO scanner."
          : (runtime.KNOWLEDGE_CMS_SEO_CRON_TOKEN?.length ?? 0) < 32
            ? "The server-side scheduler token is missing or too short."
            : "The protected scheduled-scan endpoint is configured.",
    ),
  ];

  return {
    checks,
    readyCount: checks.filter((item) => item.state === "ready").length,
    totalCount: checks.length,
  };
}
