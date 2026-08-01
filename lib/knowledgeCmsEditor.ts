import {
  KNOWLEDGE_CMS_MAX_SOURCE_AGE_DAYS,
  type KnowledgeCmsSource,
} from "./knowledgeCms";

const publisherNames = new Map<string, string>([
  ["medicare.gov", "Medicare.gov"],
  ["cms.gov", "Centers for Medicare & Medicaid Services"],
  ["ssa.gov", "Social Security Administration"],
  ["insurance.wa.gov", "Washington Office of the Insurance Commissioner"],
  ["hca.wa.gov", "Washington State Health Care Authority"],
  ["dshs.wa.gov", "Washington State Department of Social and Health Services"],
  ["wahealthplanfinder.org", "Washington Healthplanfinder"],
  ["healthcare.gov", "HealthCare.gov"],
]);

function dateOnly(value: Date): string {
  if (Number.isNaN(value.getTime())) {
    throw new Error("A valid date is required for a source draft.");
  }
  return [
    String(value.getFullYear()).padStart(4, "0"),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0"),
  ].join("-");
}

function addCalendarDays(value: Date, days: number): string {
  const result = new Date(
    Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()),
  );
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

function sourceIdentifier(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[’']/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 200)
    .replace(/-+$/g, "");
}

function sourceHostname(value: string): string {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function matchesDomain(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function suggestKnowledgeCmsSourcePublisher(url: string): string {
  const hostname = sourceHostname(url);
  if (!hostname) {
    return "";
  }

  for (const [domain, publisher] of publisherNames) {
    if (matchesDomain(hostname, domain)) {
      return publisher;
    }
  }

  return hostname;
}

export function suggestKnowledgeCmsSourceId(
  source: Pick<KnowledgeCmsSource, "title" | "url">,
): string {
  const titleId = sourceIdentifier(source.title);
  if (titleId) {
    return titleId;
  }

  try {
    const url = new URL(source.url);
    return sourceIdentifier(`${url.hostname} ${url.pathname}`);
  } catch {
    return "";
  }
}

export function createKnowledgeCmsSourceDraft(
  now: Date = new Date(),
): KnowledgeCmsSource {
  return {
    id: "",
    kind: "official",
    title: "",
    publisher: "",
    url: "",
    checkedAt: dateOnly(now),
    reviewDueAt: addCalendarDays(now, KNOWLEDGE_CMS_MAX_SOURCE_AGE_DAYS),
  };
}

export function prepareKnowledgeCmsSourcesForSubmission(
  sources: KnowledgeCmsSource[],
): KnowledgeCmsSource[] {
  return sources.map((source) => ({
    ...source,
    id: source.id.trim() || suggestKnowledgeCmsSourceId(source),
    publisher:
      source.publisher.trim() || suggestKnowledgeCmsSourcePublisher(source.url),
  }));
}
