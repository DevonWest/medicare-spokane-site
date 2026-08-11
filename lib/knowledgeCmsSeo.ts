import type {
  KnowledgeCmsRecord,
  KnowledgeCmsRecordKind,
} from "./knowledgeCms";

export const KNOWLEDGE_CMS_SEO_SCAN_SCHEMA_VERSION = 1 as const;
export const KNOWLEDGE_CMS_PUBLIC_HEALTH_PATH =
  "/api/deployment-health" as const;

export type KnowledgeCmsSeoPriority = "critical" | "high" | "medium" | "low";
export type KnowledgeCmsSeoOpportunityKind =
  | "declining_performance"
  | "low_click_through_rate"
  | "record_quality"
  | "source_freshness"
  | "striking_distance"
  | "technical";

export interface KnowledgeCmsSearchMetricRow {
  page: string;
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface KnowledgeCmsSearchMetricComparison
  extends KnowledgeCmsSearchMetricRow {
  previousClicks: number;
  previousImpressions: number;
  previousCtr: number;
  previousPosition: number;
}

export interface KnowledgeCmsSearchMetricsSummary {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  previousClicks: number;
  previousImpressions: number;
  clickChange: number | null;
  impressionChange: number | null;
}

export interface KnowledgeCmsSeoOpportunity {
  id: string;
  kind: KnowledgeCmsSeoOpportunityKind;
  priority: KnowledgeCmsSeoPriority;
  title: string;
  reason: string;
  recommendation: string;
  score: number;
  page?: string;
  query?: string;
  recordId?: string;
  recordKind?: KnowledgeCmsRecordKind;
  metrics?: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    previousClicks?: number;
    previousImpressions?: number;
  };
}

export interface KnowledgeCmsSeoPageObservation {
  path: string;
  status: number | null;
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  h1Count: number;
  internalLinkCount: number;
  errorCode?: "fetch_failed" | "invalid_content_type" | "response_too_large";
}

export interface KnowledgeCmsSeoSiteObservation {
  robotsOk: boolean;
  sitemapOk: boolean;
  healthOk: boolean;
}

export interface KnowledgeCmsSeoIntervention {
  path: string;
  effectiveDate: string;
  evaluateAfter: string;
}

export const KNOWLEDGE_CMS_SEO_INTERVENTIONS: ReadonlyArray<KnowledgeCmsSeoIntervention> = [
  {
    path: "/",
    effectiveDate: "2026-08-10",
    evaluateAfter: "2026-08-24",
  },
  {
    path: "/contact",
    effectiveDate: "2026-08-10",
    evaluateAfter: "2026-08-24",
  },
  {
    path: "/medicare-spokane",
    effectiveDate: "2026-08-10",
    evaluateAfter: "2026-08-24",
  },
  {
    path: "/our-team",
    effectiveDate: "2026-08-10",
    evaluateAfter: "2026-08-24",
  },
  {
    path: "/resources",
    effectiveDate: "2026-08-10",
    evaluateAfter: "2026-08-24",
  },
];

export interface KnowledgeCmsSeoScanSummary {
  totalOpportunities: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  recordsAudited: number;
  pagesAudited: number;
}

function stableHash(value: string): string {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function opportunityId(
  kind: KnowledgeCmsSeoOpportunityKind,
  ...parts: Array<string | undefined>
): string {
  return `${kind}--${stableHash(parts.filter(Boolean).join("\u0000"))}`;
}

function finiteNonNegative(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function finitePosition(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function comparisonKey(
  row: Pick<KnowledgeCmsSearchMetricRow, "page" | "query">,
): string {
  return `${row.page}\u0000${row.query}`;
}

export function compareKnowledgeCmsSearchMetrics(
  currentRows: ReadonlyArray<KnowledgeCmsSearchMetricRow>,
  previousRows: ReadonlyArray<KnowledgeCmsSearchMetricRow>,
): KnowledgeCmsSearchMetricComparison[] {
  const previousByKey = new Map(
    previousRows.map((row) => [comparisonKey(row), row]),
  );

  return currentRows.map((row) => {
    const previous = previousByKey.get(comparisonKey(row));
    return {
      page: row.page,
      query: row.query,
      clicks: finiteNonNegative(row.clicks),
      impressions: finiteNonNegative(row.impressions),
      ctr: finiteNonNegative(row.ctr),
      position: finitePosition(row.position),
      previousClicks: finiteNonNegative(previous?.clicks ?? 0),
      previousImpressions: finiteNonNegative(previous?.impressions ?? 0),
      previousCtr: finiteNonNegative(previous?.ctr ?? 0),
      previousPosition: finitePosition(previous?.position ?? 0),
    };
  });
}

function percentageChange(current: number, previous: number): number | null {
  if (previous <= 0) {
    return null;
  }
  return (current - previous) / previous;
}

export function summarizeKnowledgeCmsSearchMetrics(
  comparisons: ReadonlyArray<KnowledgeCmsSearchMetricComparison>,
): KnowledgeCmsSearchMetricsSummary {
  let clicks = 0;
  let impressions = 0;
  let weightedPosition = 0;
  let previousClicks = 0;
  let previousImpressions = 0;

  for (const row of comparisons) {
    clicks += row.clicks;
    impressions += row.impressions;
    weightedPosition += row.position * row.impressions;
    previousClicks += row.previousClicks;
    previousImpressions += row.previousImpressions;
  }

  return {
    clicks,
    impressions,
    ctr: impressions > 0 ? clicks / impressions : 0,
    position: impressions > 0 ? weightedPosition / impressions : 0,
    previousClicks,
    previousImpressions,
    clickChange: percentageChange(clicks, previousClicks),
    impressionChange: percentageChange(impressions, previousImpressions),
  };
}

function pagePath(page: string): string {
  try {
    const parsed = new URL(page);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return page;
  }
}

function searchImpact(row: KnowledgeCmsSearchMetricComparison): number {
  const positionFactor = Math.max(1, 21 - Math.min(row.position, 20));
  return Math.round(row.impressions * positionFactor + row.previousClicks * 25);
}

export function buildKnowledgeCmsSearchOpportunities(
  comparisons: ReadonlyArray<KnowledgeCmsSearchMetricComparison>,
  options: {
    evidenceThrough?: string;
    interventions?: ReadonlyArray<KnowledgeCmsSeoIntervention>;
  } = {},
): KnowledgeCmsSeoOpportunity[] {
  const opportunities: KnowledgeCmsSeoOpportunity[] = [];
  const interventions = options.interventions ?? KNOWLEDGE_CMS_SEO_INTERVENTIONS;

  for (const row of comparisons) {
    const path = pagePath(row.page);
    if (/\bfmo\b/i.test(row.query)) {
      continue;
    }
    const intervention = interventions.find((item) => item.path === path);
    if (
      intervention &&
      (!options.evidenceThrough ||
        options.evidenceThrough < intervention.evaluateAfter)
    ) {
      continue;
    }
    const score = searchImpact(row);

    if (
      row.impressions >= 50 &&
      row.position > 0 &&
      row.position <= 10 &&
      row.ctr < 0.03
    ) {
      opportunities.push({
        id: opportunityId("low_click_through_rate", row.page, row.query),
        kind: "low_click_through_rate",
        priority: row.impressions >= 250 ? "high" : "medium",
        title: `Improve the search result for “${row.query}”`,
        reason: `${path} appears on page one but earns ${(row.ctr * 100).toFixed(1)}% CTR from ${Math.round(row.impressions)} impressions.`,
        recommendation:
          "Align the title and description with the query's intent, make the local value clearer, and verify that the page answers the query immediately.",
        score: score + 500,
        page: row.page,
        query: row.query,
        metrics: {
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
          previousClicks: row.previousClicks,
          previousImpressions: row.previousImpressions,
        },
      });
    }

    if (
      row.impressions >= 25 &&
      row.position > 4 &&
      row.position <= 20
    ) {
      opportunities.push({
        id: opportunityId("striking_distance", row.page, row.query),
        kind: "striking_distance",
        priority:
          row.impressions >= 200 && row.position <= 12 ? "high" : "medium",
        title: `Move “${row.query}” into stronger visibility`,
        reason: `${path} averages position ${row.position.toFixed(1)} with ${Math.round(row.impressions)} impressions.`,
        recommendation:
          "Strengthen the relevant section, add useful Spokane-specific expertise, improve internal links to this page, and keep the answer focused on visitor needs.",
        score: score + 300,
        page: row.page,
        query: row.query,
        metrics: {
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
          previousClicks: row.previousClicks,
          previousImpressions: row.previousImpressions,
        },
      });
    }

    const clicksDeclined =
      row.previousClicks >= 5 && row.clicks <= row.previousClicks * 0.7;
    const impressionsDeclined =
      row.previousImpressions >= 100 &&
      row.impressions <= row.previousImpressions * 0.65;
    if (clicksDeclined || impressionsDeclined) {
      opportunities.push({
        id: opportunityId("declining_performance", row.page, row.query),
        kind: "declining_performance",
        priority:
          row.previousClicks >= 20 || row.previousImpressions >= 500
            ? "high"
            : "medium",
        title: `Investigate decline for “${row.query}”`,
        reason: `${path} changed from ${Math.round(row.previousClicks)} to ${Math.round(row.clicks)} clicks and ${Math.round(row.previousImpressions)} to ${Math.round(row.impressions)} impressions between comparison periods.`,
        recommendation:
          "Check whether search intent, competing results, page content, or technical visibility changed before editing. Preserve content that still serves visitors well.",
        score: score + 700,
        page: row.page,
        query: row.query,
        metrics: {
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
          previousClicks: row.previousClicks,
          previousImpressions: row.previousImpressions,
        },
      });
    }
  }

  return opportunities.sort(
    (left, right) => right.score - left.score || left.title.localeCompare(right.title),
  );
}

function recordTitle(record: KnowledgeCmsRecord): string {
  return record.kind === "faq" ? record.question : record.title;
}

function daysUntil(dateOnly: string, asOf: Date): number {
  const target = Date.parse(`${dateOnly}T00:00:00.000Z`);
  const today = Date.UTC(
    asOf.getUTCFullYear(),
    asOf.getUTCMonth(),
    asOf.getUTCDate(),
  );
  if (!Number.isFinite(target)) {
    return Number.NEGATIVE_INFINITY;
  }
  return Math.floor((target - today) / 86_400_000);
}

function words(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function addRecordOpportunity(
  opportunities: KnowledgeCmsSeoOpportunity[],
  record: KnowledgeCmsRecord,
  input: Omit<
    KnowledgeCmsSeoOpportunity,
    "id" | "recordId" | "recordKind" | "score"
  > & { score: number; discriminator: string },
): void {
  opportunities.push({
    id: opportunityId(
      input.kind,
      record.kind,
      record.id,
      input.discriminator,
    ),
    kind: input.kind,
    priority: input.priority,
    title: input.title,
    reason: input.reason,
    recommendation: input.recommendation,
    score: input.score,
    recordId: record.id,
    recordKind: record.kind,
    page: record.discoverability.canonicalPath,
  });
}

export function buildKnowledgeCmsRecordOpportunities(
  records: ReadonlyArray<KnowledgeCmsRecord>,
  asOf: Date = new Date(),
): KnowledgeCmsSeoOpportunity[] {
  const opportunities: KnowledgeCmsSeoOpportunity[] = [];

  for (const record of records) {
    const title = recordTitle(record);
    const titleLength = record.discoverability.pageTitle?.length ?? 0;
    const descriptionLength = record.discoverability.description?.length ?? 0;

    if ((record.kind === "article" || record.kind === "faq") && record.sources.length === 0) {
      addRecordOpportunity(opportunities, record, {
        discriminator: "missing-sources",
        kind: "source_freshness",
        priority: "high",
        title: `Add governed sources to ${title}`,
        reason: "The record has no source that can support factual review.",
        recommendation:
          "Add a current official or first-party source before asking for editorial review.",
        score: 900,
      });
    }

    for (const source of record.sources) {
      const remaining = daysUntil(source.reviewDueAt, asOf);
      if (remaining < 0) {
        addRecordOpportunity(opportunities, record, {
          discriminator: `expired-source:${source.id}`,
          kind: "source_freshness",
          priority: record.status === "published" ? "critical" : "high",
          title: `Recheck ${source.title}`,
          reason: `The source review date for ${title} has expired.`,
          recommendation:
            "Open the source, verify that the record remains accurate, update the checked date, and record any required content change.",
          score: record.status === "published" ? 1_500 : 1_100,
        });
      } else if (remaining <= 30) {
        addRecordOpportunity(opportunities, record, {
          discriminator: `due-source:${source.id}`,
          kind: "source_freshness",
          priority: "medium",
          title: `Schedule a source review for ${source.title}`,
          reason: `The source review for ${title} is due in ${remaining} day${remaining === 1 ? "" : "s"}.`,
          recommendation:
            "Review the source before its due date so time-sensitive Medicare guidance does not become stale.",
          score: 650 + (30 - remaining),
        });
      }
    }

    if (record.review) {
      const remaining = daysUntil(record.review.reviewDueAt, asOf);
      if (remaining < 0) {
        addRecordOpportunity(opportunities, record, {
          discriminator: "expired-review",
          kind: "source_freshness",
          priority: record.status === "published" ? "critical" : "high",
          title: `Renew the editorial review for ${title}`,
          reason: "The licensed editorial review is no longer current.",
          recommendation:
            "Recheck the content against every current source and complete a new review before relying on this record for public rendering.",
          score: record.status === "published" ? 1_600 : 1_100,
        });
      } else if (remaining <= 30) {
        addRecordOpportunity(opportunities, record, {
          discriminator: "due-review",
          kind: "source_freshness",
          priority: "medium",
          title: `Plan the next review for ${title}`,
          reason: `The approved review expires in ${remaining} day${remaining === 1 ? "" : "s"}.`,
          recommendation:
            "Queue the record for source verification and editorial approval before the current review expires.",
          score: 700 + (30 - remaining),
        });
      }
    }

    if (!record.discoverability.canonicalPath && record.kind === "article") {
      addRecordOpportunity(opportunities, record, {
        discriminator: "missing-canonical",
        kind: "record_quality",
        priority: "high",
        title: `Set the intended path for ${title}`,
        reason: "The article has no future canonical path.",
        recommendation:
          "Choose one stable public path before publication or migration planning.",
        score: 950,
      });
    }

    if (titleLength === 0 || titleLength < 25 || titleLength > 65) {
      addRecordOpportunity(opportunities, record, {
        discriminator: "page-title-length",
        kind: "record_quality",
        priority: titleLength === 0 ? "high" : "medium",
        title: `Refine the search title for ${title}`,
        reason:
          titleLength === 0
            ? "No search title is set."
            : `The search title is ${titleLength} characters; it may be too vague or truncate in results.`,
        recommendation:
          "Write a specific, natural title that reflects visitor intent and the page's Spokane relevance without keyword stuffing.",
        score: titleLength === 0 ? 900 : 520,
      });
    }

    if (
      descriptionLength === 0 ||
      descriptionLength < 90 ||
      descriptionLength > 170
    ) {
      addRecordOpportunity(opportunities, record, {
        discriminator: "description-length",
        kind: "record_quality",
        priority: descriptionLength === 0 ? "high" : "medium",
        title: `Refine the search description for ${title}`,
        reason:
          descriptionLength === 0
            ? "No search description is set."
            : `The search description is ${descriptionLength} characters and may not communicate the page value clearly in results.`,
        recommendation:
          "Summarize the concrete help on the page in plain language and give searchers a truthful reason to click.",
        score: descriptionLength === 0 ? 850 : 500,
      });
    }

    if (record.searchTerms.length === 0) {
      addRecordOpportunity(opportunities, record, {
        discriminator: "missing-search-terms",
        kind: "record_quality",
        priority: "medium",
        title: `Clarify the search intent for ${title}`,
        reason: "No search terms are recorded for editorial planning.",
        recommendation:
          "Add a small set of real visitor intents; do not generate repetitive keyword variants.",
        score: 480,
      });
    }

    if (record.kind === "article") {
      const bodyWords = words(record.body);
      const isPublishedPrivateControl =
        record.status === "published" &&
        record.discoverability.indexing === "blocked";
      if (bodyWords < 350 && !isPublishedPrivateControl) {
        addRecordOpportunity(opportunities, record, {
          discriminator: "thin-article",
          kind: "record_quality",
          priority: "high",
          title: `Build out the useful content in ${title}`,
          reason: `The CMS body contains about ${bodyWords} words and is unlikely to be a complete visitor resource.`,
          recommendation:
            "Create a complete, expert-led answer with practical next steps and original local value before CMS public cutover.",
          score: 1_000 - Math.min(bodyWords, 300),
        });
      }

      const relationshipCount = Object.values(record.relationships).reduce(
        (total, values) => total + values.length,
        0,
      );
      if (relationshipCount === 0) {
        addRecordOpportunity(opportunities, record, {
          discriminator: "missing-relationships",
          kind: "record_quality",
          priority: "medium",
          title: `Connect ${title} to the knowledge center`,
          reason: "The article has no topic, FAQ, city, agent, carrier, or existing-page relationships.",
          recommendation:
            "Link only genuinely related resources so visitors and search engines can understand the site's topic structure.",
          score: 550,
        });
      }
    }
  }

  return opportunities.sort(
    (left, right) => right.score - left.score || left.title.localeCompare(right.title),
  );
}

function technicalOpportunity(
  input: Omit<KnowledgeCmsSeoOpportunity, "id" | "kind"> & {
    discriminator: string;
  },
): KnowledgeCmsSeoOpportunity {
  const { discriminator, ...opportunity } = input;
  return {
    ...opportunity,
    id: opportunityId("technical", input.page, discriminator),
    kind: "technical",
  };
}

export function buildKnowledgeCmsTechnicalOpportunities(
  pages: ReadonlyArray<KnowledgeCmsSeoPageObservation>,
  site: KnowledgeCmsSeoSiteObservation,
  options: { expectIndexing?: boolean } = {},
): KnowledgeCmsSeoOpportunity[] {
  const opportunities: KnowledgeCmsSeoOpportunity[] = [];

  if (!site.healthOk) {
    opportunities.push(
      technicalOpportunity({
        discriminator: "health",
        priority: "critical",
        title: "Repair the public deployment health check",
        reason:
          "The public deployment-health endpoint did not return a successful response.",
        recommendation:
          `Restore ${KNOWLEDGE_CMS_PUBLIC_HEALTH_PATH} before relying on automated crawling or public rollout verification. Keep /healthz reserved for container probes.`,
        score: 2_000,
        page: KNOWLEDGE_CMS_PUBLIC_HEALTH_PATH,
      }),
    );
  }
  if (!site.sitemapOk) {
    opportunities.push(
      technicalOpportunity({
        discriminator: "sitemap",
        priority: "critical",
        title: "Repair the XML sitemap",
        reason: "The sitemap was unavailable or did not look like XML.",
        recommendation:
          "Restore a valid public sitemap and confirm it contains the canonical indexable routes.",
        score: 1_900,
        page: "/sitemap.xml",
      }),
    );
  }
  if (!site.robotsOk) {
    opportunities.push(
      technicalOpportunity({
        discriminator: "robots",
        priority: "high",
        title: "Repair robots.txt",
        reason: "The robots policy was unavailable or malformed.",
        recommendation:
          "Restore robots.txt and verify production crawling is allowed while private CMS routes remain blocked.",
        score: 1_400,
        page: "/robots.txt",
      }),
    );
  }

  const titleOwners = new Map<string, string[]>();
  const descriptionOwners = new Map<string, string[]>();
  for (const page of pages) {
    if (page.title) {
      const key = page.title.trim().toLocaleLowerCase("en-US");
      titleOwners.set(key, [...(titleOwners.get(key) ?? []), page.path]);
    }
    if (page.description) {
      const key = page.description.trim().toLocaleLowerCase("en-US");
      descriptionOwners.set(key, [
        ...(descriptionOwners.get(key) ?? []),
        page.path,
      ]);
    }

    if (page.status !== 200) {
      opportunities.push(
        technicalOpportunity({
          discriminator: `status:${page.status ?? page.errorCode ?? "unknown"}`,
          priority: "critical",
          title: `Repair ${page.path}`,
          reason: `The canonical page returned ${page.status ?? page.errorCode ?? "no usable response"}.`,
          recommendation:
            "Restore a successful canonical response and verify that redirects, deployment routing, and page rendering are intentional.",
          score: 1_800,
          page: page.path,
        }),
      );
      continue;
    }

    if (!page.title) {
      opportunities.push(
        technicalOpportunity({
          discriminator: "missing-title",
          priority: "high",
          title: `Add a rendered title to ${page.path}`,
          reason: "The public HTML has no usable title element.",
          recommendation:
            "Render one accurate page title and keep it consistent with the canonical CMS metadata.",
          score: 1_100,
          page: page.path,
        }),
      );
    }
    if (!page.description) {
      opportunities.push(
        technicalOpportunity({
          discriminator: "missing-description",
          priority: "high",
          title: `Add a rendered description to ${page.path}`,
          reason: "The public HTML has no usable meta description.",
          recommendation:
            "Render a concise, truthful description of the page's visitor value.",
          score: 1_000,
          page: page.path,
        }),
      );
    }
    if (!page.canonical) {
      opportunities.push(
        technicalOpportunity({
          discriminator: "missing-canonical",
          priority: "high",
          title: `Add a canonical URL to ${page.path}`,
          reason: "The public HTML has no canonical link.",
          recommendation:
            "Render the single preferred HTTPS URL for this content.",
          score: 1_050,
          page: page.path,
        }),
      );
    } else {
      try {
        const canonical = new URL(page.canonical);
        if (
          canonical.protocol !== "https:" ||
          canonical.username ||
          canonical.password ||
          `${canonical.pathname}${canonical.search}` !== page.path
        ) {
          opportunities.push(
            technicalOpportunity({
              discriminator: `canonical-mismatch:${page.canonical}`,
              priority: "high",
              title: `Correct the canonical URL on ${page.path}`,
              reason: "The rendered canonical does not identify this page's matching HTTPS path.",
              recommendation:
                "Render the one preferred HTTPS URL whose path exactly matches this public page.",
              score: 1_040,
              page: page.path,
            }),
          );
        }
      } catch {
        opportunities.push(
          technicalOpportunity({
            discriminator: `canonical-invalid:${page.canonical}`,
            priority: "high",
            title: `Correct the canonical URL on ${page.path}`,
            reason: "The rendered canonical is not a valid absolute URL.",
            recommendation:
              "Render one valid preferred HTTPS URL for this public page.",
            score: 1_040,
            page: page.path,
          }),
        );
      }
    }
    if (page.h1Count !== 1) {
      opportunities.push(
        technicalOpportunity({
          discriminator: `h1:${page.h1Count}`,
          priority: "medium",
          title: `Clarify the main heading on ${page.path}`,
          reason: `The page renders ${page.h1Count} H1 headings instead of one clear primary heading.`,
          recommendation:
            "Use one descriptive H1 and organize supporting sections with lower-level headings.",
          score: 650,
          page: page.path,
        }),
      );
    }
    if (
      options.expectIndexing !== false &&
      (page.robots ?? "").toLowerCase().includes("noindex")
    ) {
      opportunities.push(
        technicalOpportunity({
          discriminator: "noindex",
          priority: "critical",
          title: `Remove unintended noindex from ${page.path}`,
          reason: "The public production page instructs search engines not to index it.",
          recommendation:
            "Confirm the route is meant to be public, then remove the noindex directive without exposing private CMS routes.",
          score: 1_700,
          page: page.path,
        }),
      );
    }
  }

  for (const paths of titleOwners.values()) {
    if (paths.length > 1) {
      for (const path of paths) {
        opportunities.push(
          technicalOpportunity({
            discriminator: `duplicate-title:${paths.join("|")}`,
            priority: "medium",
            title: `Differentiate the title on ${path}`,
            reason: `The same rendered title appears on ${paths.length} audited pages.`,
            recommendation:
              "Give each page a specific title that reflects its distinct visitor purpose.",
            score: 600,
            page: path,
          }),
        );
      }
    }
  }

  for (const paths of descriptionOwners.values()) {
    if (paths.length > 1) {
      for (const path of paths) {
        opportunities.push(
          technicalOpportunity({
            discriminator: `duplicate-description:${paths.join("|")}`,
            priority: "medium",
            title: `Differentiate the description on ${path}`,
            reason: `The same rendered description appears on ${paths.length} audited pages.`,
            recommendation:
              "Describe the unique value and intent of this page instead of reusing generic metadata.",
            score: 560,
            page: path,
          }),
        );
      }
    }
  }

  return opportunities.sort(
    (left, right) => right.score - left.score || left.title.localeCompare(right.title),
  );
}

export function summarizeKnowledgeCmsSeoOpportunities(
  opportunities: ReadonlyArray<KnowledgeCmsSeoOpportunity>,
  recordsAudited: number,
  pagesAudited: number,
): KnowledgeCmsSeoScanSummary {
  return {
    totalOpportunities: opportunities.length,
    critical: opportunities.filter((item) => item.priority === "critical").length,
    high: opportunities.filter((item) => item.priority === "high").length,
    medium: opportunities.filter((item) => item.priority === "medium").length,
    low: opportunities.filter((item) => item.priority === "low").length,
    recordsAudited,
    pagesAudited,
  };
}

export function sortAndLimitKnowledgeCmsSeoOpportunities(
  opportunities: ReadonlyArray<KnowledgeCmsSeoOpportunity>,
  limit = 150,
): KnowledgeCmsSeoOpportunity[] {
  const priorityWeight: Record<KnowledgeCmsSeoPriority, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  return [...opportunities]
    .sort(
      (left, right) =>
        priorityWeight[right.priority] - priorityWeight[left.priority] ||
        right.score - left.score ||
        left.title.localeCompare(right.title),
    )
    .slice(0, Math.max(1, Math.min(limit, 500)));
}
