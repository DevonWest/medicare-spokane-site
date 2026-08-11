import "server-only";

import { createHash, randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import { getFirestoreAdmin } from "./firebase-admin";
import {
  KNOWLEDGE_CMS_COLLECTIONS,
  KnowledgeCmsAuthorizationError,
  getKnowledgeCmsAuthorizationDecision,
  type KnowledgeCmsActor,
} from "./knowledgeCms";
import {
  getKnowledgeCmsCopilotReadiness,
  resolveKnowledgeCmsAiModels,
  type KnowledgeCmsCopilotReadinessCheck,
  type KnowledgeCmsCopilotRuntimeEnvironment,
} from "./knowledgeCmsCopilotReadiness";
import {
  verifyKnowledgeCmsOpenAiAccess,
  type KnowledgeCmsOpenAiAccessCheck,
} from "./knowledgeCmsAiOpenAi";
import { requireKnowledgeCmsActor } from "./knowledgeCmsAdminAuth";
import {
  verifyKnowledgeCmsSearchConsoleAccess,
  type KnowledgeCmsSearchConsoleAccessCheck,
} from "./knowledgeCmsSearchConsole";

export const KNOWLEDGE_CMS_COPILOT_ACTIVATION_SCHEMA_VERSION = 1 as const;
export const KNOWLEDGE_CMS_COPILOT_ACTIVATION_MAX_AGE_DAYS = 35;

export type KnowledgeCmsCopilotActivationCheckId =
  | "ai"
  | "cms"
  | "continuous"
  | "search_console"
  | "seo";

export type KnowledgeCmsCopilotActivationCheckState =
  | "blocked"
  | "disabled"
  | "verified";

export interface KnowledgeCmsCopilotActivationCheck {
  id: KnowledgeCmsCopilotActivationCheckId;
  label: string;
  state: KnowledgeCmsCopilotActivationCheckState;
  verification: "configuration" | "live";
  detail: string;
  errorCode?: string;
}

export interface KnowledgeCmsCopilotActivationEvidence {
  id: string;
  schemaVersion: typeof KNOWLEDGE_CMS_COPILOT_ACTIVATION_SCHEMA_VERSION;
  checkedAt: string;
  expiresAt: string;
  initiatedBy: string;
  environment: string;
  origin: string;
  configurationFingerprint: string;
  checks: KnowledgeCmsCopilotActivationCheck[];
  readyCount: number;
  totalCount: number;
  readyForAi: boolean;
  readyForContinuousSeo: boolean;
}

export interface KnowledgeCmsCopilotActivationEvidenceView {
  id: string;
  schemaVersion: typeof KNOWLEDGE_CMS_COPILOT_ACTIVATION_SCHEMA_VERSION;
  checkedAt: string;
  expiresAt: string;
  environment: string;
  origin: string;
  checks: KnowledgeCmsCopilotActivationCheck[];
  readyCount: number;
  totalCount: number;
  readyForAi: boolean;
  readyForContinuousSeo: boolean;
}

export interface KnowledgeCmsCopilotActivationStatus {
  evidence: KnowledgeCmsCopilotActivationEvidenceView;
  currentConfiguration: boolean;
  expired: boolean;
}

export interface KnowledgeCmsCopilotActivationStore {
  getCurrent(input: {
    environment: string;
    origin: string;
  }): Promise<KnowledgeCmsCopilotActivationEvidence | undefined>;
  save(evidence: KnowledgeCmsCopilotActivationEvidence): Promise<void>;
}

export interface KnowledgeCmsCopilotActivationDependencies {
  actor?: KnowledgeCmsActor;
  now?: () => Date;
  openAi?: () => Promise<KnowledgeCmsOpenAiAccessCheck>;
  runtime?: KnowledgeCmsCopilotRuntimeEnvironment;
  searchConsole?: () => Promise<KnowledgeCmsSearchConsoleAccessCheck>;
  store?: KnowledgeCmsCopilotActivationStore;
}

export class KnowledgeCmsCopilotActivationError extends Error {
  readonly code = "knowledge_cms_copilot_activation";

  constructor(readonly reason: "invalid_clock" | "unavailable") {
    super(`Knowledge CMS copilot activation check failed (${reason}).`);
    this.name = "KnowledgeCmsCopilotActivationError";
  }
}

function deploymentIdentity(runtime: KnowledgeCmsCopilotRuntimeEnvironment): {
  environment: string;
  origin: string;
} {
  const environment = runtime.NEXT_PUBLIC_SITE_ENV?.trim() || "production";
  const configuredOrigin = runtime.NEXT_PUBLIC_SITE_URL?.trim();
  let origin = "unconfigured";
  if (configuredOrigin) {
    try {
      const parsed = new URL(configuredOrigin);
      if (
        (parsed.protocol === "https:" ||
          (parsed.protocol === "http:" &&
            (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1"))) &&
        !parsed.username &&
        !parsed.password &&
        parsed.pathname === "/" &&
        !parsed.search &&
        !parsed.hash
      ) {
        origin = parsed.origin;
      }
    } catch {
      // The invalid value is represented only as an unconfigured state.
    }
  }
  return { environment, origin };
}

function configurationFingerprint(
  runtime: KnowledgeCmsCopilotRuntimeEnvironment,
): string {
  const identity = deploymentIdentity(runtime);
  const { routineModel, deepModel } = resolveKnowledgeCmsAiModels(runtime);
  return createHash("sha256")
    .update(
      JSON.stringify({
        ...identity,
        cms: runtime.KNOWLEDGE_CMS_ENABLED === "true",
        seo: runtime.KNOWLEDGE_CMS_SEO_ENABLED === "true",
        searchConsole:
          runtime.KNOWLEDGE_CMS_SEARCH_CONSOLE_ENABLED === "true",
        searchConsoleSite: runtime.SEARCH_CONSOLE_SITE_URL?.trim() || null,
        ai: runtime.KNOWLEDGE_CMS_AI_ENABLED === "true",
        routineModel: routineModel ?? null,
        deepModel: deepModel ?? null,
        openAiKeyAttached: Boolean(runtime.OPENAI_API_KEY?.trim()),
        continuous:
          runtime.KNOWLEDGE_CMS_CONTINUOUS_SEO_ENABLED === "true",
        schedulerRepository:
          runtime.KNOWLEDGE_CMS_SEO_SCHEDULER_REPOSITORY?.trim() || null,
      }),
    )
    .digest("hex");
}

function evidenceDocumentId(environment: string, origin: string): string {
  return `current--${createHash("sha256")
    .update(`${environment}\n${origin}`)
    .digest("hex")
    .slice(0, 32)}`;
}

function isIsoInstant(value: unknown): value is string {
  return (
    typeof value === "string" &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}

function isActivationCheck(value: unknown): value is KnowledgeCmsCopilotActivationCheck {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const check = value as Partial<KnowledgeCmsCopilotActivationCheck>;
  return Boolean(
    ["ai", "cms", "continuous", "search_console", "seo"].includes(
      check.id ?? "",
    ) &&
      typeof check.label === "string" &&
      check.label.length >= 1 &&
      check.label.length <= 100 &&
      ["blocked", "disabled", "verified"].includes(check.state ?? "") &&
      ["configuration", "live"].includes(check.verification ?? "") &&
      typeof check.detail === "string" &&
      check.detail.length >= 1 &&
      check.detail.length <= 1_000 &&
      (check.errorCode === undefined ||
        (typeof check.errorCode === "string" &&
          /^[a-z0-9_]{1,80}$/.test(check.errorCode))),
  );
}

function isActivationEvidence(
  value: unknown,
): value is KnowledgeCmsCopilotActivationEvidence {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const evidence = value as Partial<KnowledgeCmsCopilotActivationEvidence>;
  const checks = Array.isArray(evidence.checks) ? evidence.checks : [];
  const checkIds = new Set(
    checks.filter(isActivationCheck).map((check) => check.id),
  );
  const verified = (id: KnowledgeCmsCopilotActivationCheckId) =>
    checks.find((check) => isActivationCheck(check) && check.id === id)?.state ===
    "verified";
  const verifiedCount = checks.filter(
    (check) => isActivationCheck(check) && check.state === "verified",
  ).length;
  const readyForAi = verified("cms") && verified("seo") && verified("ai");
  const readyForContinuousSeo =
    verified("cms") &&
    verified("seo") &&
    verified("search_console") &&
    verified("continuous");
  return Boolean(
    evidence.schemaVersion ===
      KNOWLEDGE_CMS_COPILOT_ACTIVATION_SCHEMA_VERSION &&
      typeof evidence.id === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        evidence.id,
      ) &&
      isIsoInstant(evidence.checkedAt) &&
      isIsoInstant(evidence.expiresAt) &&
      Date.parse(evidence.expiresAt ?? "") -
        Date.parse(evidence.checkedAt ?? "") ===
        KNOWLEDGE_CMS_COPILOT_ACTIVATION_MAX_AGE_DAYS *
          24 *
          60 *
          60 *
          1_000 &&
      typeof evidence.initiatedBy === "string" &&
      evidence.initiatedBy.length >= 1 &&
      evidence.initiatedBy.length <= 200 &&
      typeof evidence.environment === "string" &&
      evidence.environment.length >= 1 &&
      evidence.environment.length <= 100 &&
      typeof evidence.origin === "string" &&
      evidence.origin.length >= 1 &&
      evidence.origin.length <= 500 &&
      typeof evidence.configurationFingerprint === "string" &&
      /^[a-f0-9]{64}$/.test(evidence.configurationFingerprint) &&
      checks.length === 5 &&
      checks.every(isActivationCheck) &&
      checkIds.size === 5 &&
      typeof evidence.readyCount === "number" &&
      Number.isSafeInteger(evidence.readyCount) &&
      evidence.readyCount === verifiedCount &&
      evidence.totalCount === 5 &&
      evidence.readyForAi === readyForAi &&
      evidence.readyForContinuousSeo === readyForContinuousSeo,
  );
}

export class FirestoreKnowledgeCmsCopilotActivationStore
  implements KnowledgeCmsCopilotActivationStore
{
  constructor(private readonly db: Firestore = getFirestoreAdmin()) {}

  async getCurrent(input: {
    environment: string;
    origin: string;
  }): Promise<KnowledgeCmsCopilotActivationEvidence | undefined> {
    const snapshot = await this.db
      .collection(KNOWLEDGE_CMS_COLLECTIONS.copilotActivation)
      .doc(evidenceDocumentId(input.environment, input.origin))
      .get();
    const value = snapshot.data();
    return isActivationEvidence(value) ? value : undefined;
  }

  async save(evidence: KnowledgeCmsCopilotActivationEvidence): Promise<void> {
    await this.db
      .collection(KNOWLEDGE_CMS_COLLECTIONS.copilotActivation)
      .doc(evidenceDocumentId(evidence.environment, evidence.origin))
      .set(evidence);
  }
}

function configurationCheck(
  configured: KnowledgeCmsCopilotReadinessCheck,
): KnowledgeCmsCopilotActivationCheck {
  return {
    id: configured.id,
    label: configured.label,
    state:
      configured.state === "ready"
        ? "verified"
        : configured.state === "disabled"
          ? "disabled"
          : "blocked",
    verification: "configuration",
    detail: configured.detail,
  };
}

const searchConsoleErrorDetails: Record<string, string> = {
  access_denied:
    "The runtime identity cannot read the configured Search Console property.",
  invalid_configuration:
    "The Search Console property configuration is invalid.",
  quota_exceeded: "Search Console temporarily rejected the verification quota.",
  request_failed: "Search Console did not complete the read-only verification.",
  site_not_found:
    "The configured Search Console property was not found for this runtime identity.",
};

function searchConsoleCheck(
  configured: KnowledgeCmsCopilotReadinessCheck,
  result?: KnowledgeCmsSearchConsoleAccessCheck,
): KnowledgeCmsCopilotActivationCheck {
  if (configured.state !== "ready" || !result) return configurationCheck(configured);
  if (result.status === "available") {
    return {
      id: "search_console",
      label: configured.label,
      state: "verified",
      verification: "live",
      detail: `Read-only analytics access verified for ${result.siteUrl}.`,
    };
  }
  const errorCode = result.errorCode ?? "request_failed";
  return {
    id: "search_console",
    label: configured.label,
    state: result.status === "disabled" ? "disabled" : "blocked",
    verification: "live",
    detail: searchConsoleErrorDetails[errorCode] ?? searchConsoleErrorDetails.request_failed,
    errorCode,
  };
}

const openAiErrorDetails: Record<string, string> = {
  access_denied: "The attached OpenAI API key was rejected.",
  invalid_configuration: "The OpenAI key or model configuration is incomplete.",
  model_not_found:
    "The attached OpenAI project cannot access one or more configured models.",
  quota_exceeded:
    "OpenAI temporarily rejected the metadata check because of an account limit.",
  request_failed: "OpenAI did not complete the model metadata verification.",
};

function openAiCheck(
  configured: KnowledgeCmsCopilotReadinessCheck,
  result?: KnowledgeCmsOpenAiAccessCheck,
): KnowledgeCmsCopilotActivationCheck {
  if (configured.state !== "ready" || !result) return configurationCheck(configured);
  if (result.status === "available") {
    return {
      id: "ai",
      label: configured.label,
      state: "verified",
      verification: "live",
      detail: `Model access verified for routine ${result.routineModel} and deep research ${result.deepModel}. No generation request was made.`,
    };
  }
  const errorCode = result.errorCode ?? "request_failed";
  return {
    id: "ai",
    label: configured.label,
    state: result.status === "disabled" ? "disabled" : "blocked",
    verification: "live",
    detail: openAiErrorDetails[errorCode] ?? openAiErrorDetails.request_failed,
    errorCode,
  };
}

function assertAuthorized(actor: KnowledgeCmsActor): void {
  const decision = getKnowledgeCmsAuthorizationDecision(actor, "use_ai_copilot");
  if (!decision.allowed) {
    throw new KnowledgeCmsAuthorizationError("use_ai_copilot", decision.reason);
  }
}

function viewEvidence(
  evidence: KnowledgeCmsCopilotActivationEvidence,
): KnowledgeCmsCopilotActivationEvidenceView {
  return {
    id: evidence.id,
    schemaVersion: evidence.schemaVersion,
    checkedAt: evidence.checkedAt,
    expiresAt: evidence.expiresAt,
    environment: evidence.environment,
    origin: evidence.origin,
    checks: evidence.checks,
    readyCount: evidence.readyCount,
    totalCount: evidence.totalCount,
    readyForAi: evidence.readyForAi,
    readyForContinuousSeo: evidence.readyForContinuousSeo,
  };
}

function evidenceStatus(
  evidence: KnowledgeCmsCopilotActivationEvidence,
  runtime: KnowledgeCmsCopilotRuntimeEnvironment,
  now: Date,
): KnowledgeCmsCopilotActivationStatus {
  return {
    evidence: viewEvidence(evidence),
    currentConfiguration:
      evidence.configurationFingerprint === configurationFingerprint(runtime),
    expired: Date.parse(evidence.expiresAt) < now.getTime(),
  };
}

export async function runKnowledgeCmsCopilotActivationCheck(
  dependencies: KnowledgeCmsCopilotActivationDependencies = {},
): Promise<KnowledgeCmsCopilotActivationEvidenceView> {
  const runtime = dependencies.runtime ?? process.env;
  const actor = dependencies.actor ?? (await requireKnowledgeCmsActor());
  assertAuthorized(actor);
  const now = (dependencies.now ?? (() => new Date()))();
  if (!Number.isFinite(now.getTime())) {
    throw new KnowledgeCmsCopilotActivationError("invalid_clock");
  }

  const readiness = getKnowledgeCmsCopilotReadiness(runtime);
  const configured = new Map(readiness.checks.map((item) => [item.id, item]));
  const searchConfigured = configured.get("search_console");
  const aiConfigured = configured.get("ai");
  if (!searchConfigured || !aiConfigured) {
    throw new KnowledgeCmsCopilotActivationError("unavailable");
  }

  const [searchConsole, openAi] = await Promise.all([
    searchConfigured.state === "ready"
      ? (dependencies.searchConsole ?? (() =>
          verifyKnowledgeCmsSearchConsoleAccess({
            enabled: runtime.KNOWLEDGE_CMS_SEARCH_CONSOLE_ENABLED,
            siteUrl: runtime.SEARCH_CONSOLE_SITE_URL,
            now,
          })))()
      : Promise.resolve(undefined),
    aiConfigured.state === "ready"
      ? (dependencies.openAi ?? (() =>
          verifyKnowledgeCmsOpenAiAccess({ runtime })))()
      : Promise.resolve(undefined),
  ]);

  const checks = readiness.checks.map((item) => {
    if (item.id === "search_console") {
      return searchConsoleCheck(item, searchConsole);
    }
    if (item.id === "ai") return openAiCheck(item, openAi);
    return configurationCheck(item);
  });
  const checkById = new Map(checks.map((item) => [item.id, item]));
  const verified = (id: KnowledgeCmsCopilotActivationCheckId) =>
    checkById.get(id)?.state === "verified";
  const identity = deploymentIdentity(runtime);
  const checkedAt = now.toISOString();
  const expiresAt = new Date(
    now.getTime() +
      KNOWLEDGE_CMS_COPILOT_ACTIVATION_MAX_AGE_DAYS * 24 * 60 * 60 * 1_000,
  ).toISOString();
  const evidence: KnowledgeCmsCopilotActivationEvidence = {
    id: randomUUID(),
    schemaVersion: KNOWLEDGE_CMS_COPILOT_ACTIVATION_SCHEMA_VERSION,
    checkedAt,
    expiresAt,
    initiatedBy: actor.id,
    ...identity,
    configurationFingerprint: configurationFingerprint(runtime),
    checks,
    readyCount: checks.filter((item) => item.state === "verified").length,
    totalCount: checks.length,
    readyForAi: verified("cms") && verified("seo") && verified("ai"),
    readyForContinuousSeo:
      verified("cms") &&
      verified("seo") &&
      verified("search_console") &&
      verified("continuous"),
  };
  const store = dependencies.store ?? new FirestoreKnowledgeCmsCopilotActivationStore();
  await store.save(evidence);
  return viewEvidence(evidence);
}

export async function getKnowledgeCmsCopilotActivationStatus(
  dependencies: Pick<
    KnowledgeCmsCopilotActivationDependencies,
    "actor" | "now" | "runtime" | "store"
  > = {},
): Promise<KnowledgeCmsCopilotActivationStatus | undefined> {
  const runtime = dependencies.runtime ?? process.env;
  const actor = dependencies.actor ?? (await requireKnowledgeCmsActor());
  assertAuthorized(actor);
  const now = (dependencies.now ?? (() => new Date()))();
  if (!Number.isFinite(now.getTime())) {
    throw new KnowledgeCmsCopilotActivationError("invalid_clock");
  }
  const identity = deploymentIdentity(runtime);
  const store = dependencies.store ?? new FirestoreKnowledgeCmsCopilotActivationStore();
  const evidence = await store.getCurrent(identity);
  return evidence && isActivationEvidence(evidence)
    ? evidenceStatus(evidence, runtime, now)
    : undefined;
}

export async function hasCurrentKnowledgeCmsContinuousSeoActivation(
  dependencies: Pick<
    KnowledgeCmsCopilotActivationDependencies,
    "now" | "runtime" | "store"
  > = {},
): Promise<boolean> {
  const runtime = dependencies.runtime ?? process.env;
  const now = (dependencies.now ?? (() => new Date()))();
  if (!Number.isFinite(now.getTime())) return false;
  const identity = deploymentIdentity(runtime);
  const store = dependencies.store ?? new FirestoreKnowledgeCmsCopilotActivationStore();
  const evidence = await store.getCurrent(identity);
  if (!evidence || !isActivationEvidence(evidence)) return false;
  const status = evidenceStatus(evidence, runtime, now);
  return Boolean(
    status.currentConfiguration &&
      !status.expired &&
      evidence.readyForContinuousSeo,
  );
}
