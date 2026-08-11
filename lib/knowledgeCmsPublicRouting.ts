import { createHash } from "node:crypto";
import { knowledgeCmsRendererContracts } from "./knowledgeCmsRendererContract";

export const KNOWLEDGE_CMS_PUBLIC_CUTOVER_ENABLED_ENV =
  "KNOWLEDGE_CMS_PUBLIC_CUTOVER_ENABLED" as const;
export const KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_RECEIPT_ENV =
  "KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_RECEIPT" as const;
export const KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_EXECUTION_ENABLED_ENV =
  "KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_EXECUTION_ENABLED" as const;
export const KNOWLEDGE_CMS_PUBLIC_CUTOVER_ROUTES_ENV =
  "KNOWLEDGE_CMS_PUBLIC_CUTOVER_ROUTES" as const;
export const KNOWLEDGE_CMS_INTERNAL_RENDERER_PREFIX =
  "/cms-render" as const;
export const KNOWLEDGE_CMS_PUBLIC_CUTOVER_ROUTE_HEADER =
  "x-knowledge-cms-cutover-route" as const;
export const KNOWLEDGE_CMS_PUBLIC_CUTOVER_PROOF_HEADER =
  "x-knowledge-cms-cutover-proof" as const;
export const KNOWLEDGE_CMS_PUBLIC_CUTOVER_RESPONSE_HEADER =
  "x-knowledge-cms-cutover" as const;

export interface KnowledgeCmsPublicRoutingEnvironment {
  cmsEnabled?: string;
  rendererMode?: string;
  cutoverEnabled?: string;
  approvalReceipt?: string;
  approvalExecutionEnabled?: string;
  cutoverRoutes?: string;
  articleMigrationExecutionEnabled?: string;
  supportingMigrationExecutionEnabled?: string;
  nativeRepresentationExecutionEnabled?: string;
  siteEnvironment?: string;
  siteUrl?: string;
}

export interface KnowledgeCmsPublicRoutingResolution {
  requestedMode: "cutover" | "invalid" | "shadow" | "static";
  effectiveMode: "cutover" | "static";
  routingEnabled: boolean;
  configurationValid: boolean;
  environment: "beta" | "invalid" | "production";
  activeEntryIds: readonly string[];
  approvalReceipt?: string;
  reason:
    | "cutover_approved"
    | "cutover_no_routes"
    | "cutover_configuration_invalid"
    | "default_static"
    | "explicit_static"
    | "invalid_mode"
    | "private_shadow";
}

const receiptPattern = /^[a-f0-9]{64}$/;
const routeByPath = new Map(
  knowledgeCmsRendererContracts.map((contract) => [
    contract.path,
    contract.entryId,
  ]),
);
const pathByEntry = new Map(
  knowledgeCmsRendererContracts.map((contract) => [
    contract.entryId,
    contract.path,
  ]),
);

function parseCutoverRoutes(value: string | undefined): {
  activeEntryIds: string[];
  valid: boolean;
} {
  if (value === undefined || value.trim() === "") {
    return { activeEntryIds: [], valid: true };
  }
  const activeEntryIds = [...new Set(
    value.split(/[|,]/).map((item) => item.trim()).filter(Boolean),
  )];
  return {
    activeEntryIds,
    valid:
      activeEntryIds.length > 0 &&
      activeEntryIds.every((entryId) => pathByEntry.has(entryId)),
  };
}

function deploymentEnvironment(
  siteEnvironment: string | undefined,
  siteUrl: string | undefined,
): KnowledgeCmsPublicRoutingResolution["environment"] {
  if (
    siteEnvironment === "staging" &&
    siteUrl === "https://beta.medicareinspokane.com"
  ) {
    return "beta";
  }
  if (
    siteEnvironment === "production" &&
    siteUrl === "https://www.medicareinspokane.com"
  ) {
    return "production";
  }
  return "invalid";
}

export function getKnowledgeCmsPublicRoutingEnvironment(): KnowledgeCmsPublicRoutingEnvironment {
  return {
    cmsEnabled: process.env.KNOWLEDGE_CMS_ENABLED,
    rendererMode: process.env.KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE,
    cutoverEnabled:
      process.env[KNOWLEDGE_CMS_PUBLIC_CUTOVER_ENABLED_ENV],
    approvalReceipt:
      process.env[KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_RECEIPT_ENV],
    approvalExecutionEnabled:
      process.env[
        KNOWLEDGE_CMS_PUBLIC_CUTOVER_APPROVAL_EXECUTION_ENABLED_ENV
      ],
    cutoverRoutes: process.env[KNOWLEDGE_CMS_PUBLIC_CUTOVER_ROUTES_ENV],
    articleMigrationExecutionEnabled:
      process.env.KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED,
    supportingMigrationExecutionEnabled:
      process.env.KNOWLEDGE_CMS_SUPPORTING_MIGRATION_EXECUTION_ENABLED,
    nativeRepresentationExecutionEnabled:
      process.env.KNOWLEDGE_CMS_NATIVE_REPRESENTATION_EXECUTION_ENABLED,
    siteEnvironment: process.env.NEXT_PUBLIC_SITE_ENV,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  };
}

export function resolveKnowledgeCmsPublicRouting(
  environment: KnowledgeCmsPublicRoutingEnvironment =
    getKnowledgeCmsPublicRoutingEnvironment(),
): KnowledgeCmsPublicRoutingResolution {
  const requestedMode = ["static", "shadow", "cutover"].includes(
    environment.rendererMode ?? "static",
  )
    ? (environment.rendererMode ?? "static") as
        | "cutover"
        | "shadow"
        | "static"
    : "invalid";
  const target = deploymentEnvironment(
    environment.siteEnvironment,
    environment.siteUrl,
  );
  const routes = parseCutoverRoutes(environment.cutoverRoutes);

  if (requestedMode === "invalid") {
    return {
      requestedMode,
      effectiveMode: "static",
      routingEnabled: false,
      configurationValid: false,
      environment: target,
      activeEntryIds: [],
      reason: "invalid_mode",
    };
  }
  if (requestedMode !== "cutover") {
    const cutoverGateSafe =
      environment.cutoverEnabled === undefined ||
      environment.cutoverEnabled === "false";
    const approvalGateSafe =
      environment.approvalExecutionEnabled === undefined ||
      ["false", "true"].includes(
        environment.approvalExecutionEnabled,
      );
    return {
      requestedMode,
      effectiveMode: "static",
      routingEnabled: false,
      configurationValid: cutoverGateSafe && approvalGateSafe,
      environment: target,
      activeEntryIds: [],
      ...(environment.approvalReceipt
        ? { approvalReceipt: environment.approvalReceipt }
        : {}),
      reason:
        environment.rendererMode === undefined
          ? "default_static"
          : requestedMode === "static"
            ? "explicit_static"
            : "private_shadow",
    };
  }

  const baseValid = Boolean(
    environment.cmsEnabled === "true" &&
      environment.cutoverEnabled === "true" &&
      environment.approvalExecutionEnabled === "false" &&
      environment.articleMigrationExecutionEnabled === "false" &&
      environment.supportingMigrationExecutionEnabled === "false" &&
      environment.nativeRepresentationExecutionEnabled === "false" &&
      target === "production" &&
      routes.valid &&
      environment.approvalReceipt &&
      receiptPattern.test(environment.approvalReceipt),
  );
  const valid = baseValid && routes.activeEntryIds.length > 0;
  return {
    requestedMode,
    effectiveMode: valid ? "cutover" : "static",
    routingEnabled: valid,
    configurationValid: baseValid,
    environment: target,
    activeEntryIds: valid ? routes.activeEntryIds : [],
    ...(environment.approvalReceipt
      ? { approvalReceipt: environment.approvalReceipt }
      : {}),
    reason: valid
      ? "cutover_approved"
      : baseValid
        ? "cutover_no_routes"
        : "cutover_configuration_invalid",
  };
}

export function isKnowledgeCmsPublicRouteEnabled(
  entryId: string,
  routing: KnowledgeCmsPublicRoutingResolution,
): boolean {
  return routing.routingEnabled && routing.activeEntryIds.includes(entryId);
}

export function getKnowledgeCmsEntryIdForPublicPath(
  pathname: string,
): string | undefined {
  return routeByPath.get(pathname);
}

export function getKnowledgeCmsPublicPathForEntryId(
  entryId: string,
): string | undefined {
  return pathByEntry.get(entryId);
}

export function getKnowledgeCmsEntryIdForInternalRendererPath(
  pathname: string,
): string | undefined {
  const prefix = `${KNOWLEDGE_CMS_INTERNAL_RENDERER_PREFIX}/`;
  if (!pathname.startsWith(prefix)) {
    return undefined;
  }
  const entryId = pathname.slice(prefix.length);
  return entryId && !entryId.includes("/") && pathByEntry.has(entryId)
    ? entryId
    : undefined;
}

export function createKnowledgeCmsPublicCutoverRouteProof(input: {
  entryId: string;
  path: string;
  receipt: string;
}): string {
  if (
    !receiptPattern.test(input.receipt) ||
    pathByEntry.get(input.entryId) !== input.path
  ) {
    return "";
  }
  return createHash("sha256")
    .update(
      `knowledge-cms-public-cutover-v1\0${input.receipt}\0${input.entryId}\0${input.path}`,
    )
    .digest("hex");
}

export function validateKnowledgeCmsInternalRendererRequest(input: {
  entryId: string;
  pathHeader: string | null;
  proofHeader: string | null;
  environment?: KnowledgeCmsPublicRoutingEnvironment;
}): boolean {
  const routing = resolveKnowledgeCmsPublicRouting(input.environment);
  const expectedPath = pathByEntry.get(input.entryId);
  if (
    !routing.routingEnabled ||
    !isKnowledgeCmsPublicRouteEnabled(input.entryId, routing) ||
    !routing.approvalReceipt ||
    !expectedPath ||
    input.pathHeader !== expectedPath
  ) {
    return false;
  }
  return (
    input.proofHeader ===
    createKnowledgeCmsPublicCutoverRouteProof({
      entryId: input.entryId,
      path: expectedPath,
      receipt: routing.approvalReceipt,
    })
  );
}

export function isKnowledgeCmsInternalRendererPath(
  pathname: string,
): boolean {
  return (
    pathname === KNOWLEDGE_CMS_INTERNAL_RENDERER_PREFIX ||
    pathname.startsWith(`${KNOWLEDGE_CMS_INTERNAL_RENDERER_PREFIX}/`)
  );
}
