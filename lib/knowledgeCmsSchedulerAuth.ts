import "server-only";

import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
} from "jose";

export interface KnowledgeCmsSchedulerRuntimeEnvironment {
  NEXT_PUBLIC_SITE_URL?: string;
  KNOWLEDGE_CMS_SEO_SCHEDULER_REPOSITORY?: string;
}

export interface KnowledgeCmsSchedulerAuthDependencies {
  runtime?: KnowledgeCmsSchedulerRuntimeEnvironment;
  verifyIdToken?: (
    idToken: string,
    audience: string,
  ) => Promise<JWTPayload | undefined>;
}

const schedulerPath = "/api/knowledge-cms/seo-scan";
const schedulerWorkflowPath = ".github/workflows/weekly-seo-scan.yml";
const githubOidcIssuer = "https://token.actions.githubusercontent.com";
const githubOidcKeys = createRemoteJWKSet(
  new URL(`${githubOidcIssuer}/.well-known/jwks`),
);
const repositoryPattern = /^[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}$/;

export function isValidKnowledgeCmsSchedulerRepository(
  value: string | undefined,
): boolean {
  return repositoryPattern.test(value?.trim() ?? "");
}

function schedulerAudience(
  runtime: KnowledgeCmsSchedulerRuntimeEnvironment,
): string | undefined {
  const configuredOrigin = runtime.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configuredOrigin) return undefined;
  try {
    const parsed = new URL(configuredOrigin);
    if (
      parsed.protocol !== "https:" ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) {
      return undefined;
    }
    return new URL(schedulerPath, parsed.origin).toString();
  } catch {
    return undefined;
  }
}

function bearerToken(request: Request): string | undefined {
  const authorization = request.headers.get("authorization")?.trim();
  if (!authorization?.startsWith("Bearer ")) return undefined;
  const token = authorization.slice("Bearer ".length).trim();
  if (
    token.length < 20 ||
    token.length > 8_192 ||
    /\s/.test(token) ||
    token.split(".").length !== 3
  ) {
    return undefined;
  }
  return token;
}

async function verifyGitHubIdToken(
  idToken: string,
  audience: string,
): Promise<JWTPayload | undefined> {
  const { payload } = await jwtVerify(idToken, githubOidcKeys, {
    issuer: githubOidcIssuer,
    audience,
  });
  return payload;
}

export async function isAuthorizedKnowledgeCmsSchedulerRequest(
  request: Request,
  dependencies: KnowledgeCmsSchedulerAuthDependencies = {},
): Promise<boolean> {
  const runtime = dependencies.runtime ?? {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    KNOWLEDGE_CMS_SEO_SCHEDULER_REPOSITORY:
      process.env.KNOWLEDGE_CMS_SEO_SCHEDULER_REPOSITORY,
  };
  const expectedRepository =
    runtime.KNOWLEDGE_CMS_SEO_SCHEDULER_REPOSITORY?.trim();
  const audience = schedulerAudience(runtime);
  const idToken = bearerToken(request);
  if (
    !audience ||
    !idToken ||
    !isValidKnowledgeCmsSchedulerRepository(expectedRepository)
  ) {
    return false;
  }

  try {
    const identity = await (dependencies.verifyIdToken ?? verifyGitHubIdToken)(
      idToken,
      audience,
    );
    if (!identity) return false;
    const expectedWorkflow =
      `${expectedRepository}/${schedulerWorkflowPath}@refs/heads/main`;
    return (
      identity.repository === expectedRepository &&
      identity.ref === "refs/heads/main" &&
      identity.workflow_ref === expectedWorkflow &&
      (identity.event_name === "schedule" ||
        identity.event_name === "workflow_dispatch" ||
        identity.event_name === "workflow_run")
    );
  } catch {
    return false;
  }
}
