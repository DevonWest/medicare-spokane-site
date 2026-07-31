import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import type {
  DecodedIdToken,
  UserRecord,
} from "firebase-admin/auth";
import { getFirebaseAuthAdmin } from "./firebase-admin";
import {
  getKnowledgeCmsAuthorizationDecision,
  type KnowledgeCmsActor,
  type KnowledgeCmsRole,
} from "./knowledgeCms";
import { assertKnowledgeCmsEnabled } from "./knowledgeCmsRepository";

export const KNOWLEDGE_CMS_SESSION_COOKIE =
  "mis_knowledge_cms_session";
export const KNOWLEDGE_CMS_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
export const KNOWLEDGE_CMS_RECENT_SIGN_IN_SECONDS = 5 * 60;

const cmsRoles = new Set<KnowledgeCmsRole>([
  "author",
  "editor",
  "reviewer",
  "publisher",
  "admin",
]);
const agentSlugPattern = /^(?=.{1,200}$)[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type KnowledgeCmsAuthenticationReason =
  | "missing_session"
  | "invalid_session"
  | "recent_sign_in_required"
  | "verified_email_required"
  | "account_disabled"
  | "cms_role_required";

export class KnowledgeCmsAuthenticationError extends Error {
  readonly code = "knowledge_cms_authentication";

  constructor(readonly reason: KnowledgeCmsAuthenticationReason) {
    super("Knowledge CMS authentication failed.");
    this.name = "KnowledgeCmsAuthenticationError";
  }
}

export interface KnowledgeCmsUserIdentity {
  uid: string;
  emailVerified: boolean;
  disabled: boolean;
  customClaims?: Record<string, unknown>;
}

export interface KnowledgeCmsAuthProvider {
  verifyIdToken(idToken: string): Promise<DecodedIdToken>;
  createSessionCookie(
    idToken: string,
    options: { expiresIn: number },
  ): Promise<string>;
  verifySessionCookie(
    sessionCookie: string,
    checkRevoked?: boolean,
  ): Promise<DecodedIdToken>;
  getUser(uid: string): Promise<UserRecord>;
}

export interface KnowledgeCmsSessionResult {
  actor: KnowledgeCmsActor;
  sessionCookie: string;
}

function normalizeRoles(value: unknown): KnowledgeCmsRole[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > cmsRoles.size) {
    throw new KnowledgeCmsAuthenticationError("cms_role_required");
  }

  const roles: KnowledgeCmsRole[] = [];
  for (const candidate of value) {
    if (typeof candidate !== "string" || !cmsRoles.has(candidate as KnowledgeCmsRole)) {
      throw new KnowledgeCmsAuthenticationError("cms_role_required");
    }
    const role = candidate as KnowledgeCmsRole;
    if (!roles.includes(role)) {
      roles.push(role);
    }
  }

  if (roles.length === 0) {
    throw new KnowledgeCmsAuthenticationError("cms_role_required");
  }

  return roles;
}

export function resolveKnowledgeCmsActor(
  user: KnowledgeCmsUserIdentity,
): KnowledgeCmsActor {
  if (user.disabled) {
    throw new KnowledgeCmsAuthenticationError("account_disabled");
  }
  if (!user.emailVerified) {
    throw new KnowledgeCmsAuthenticationError("verified_email_required");
  }

  const roles = normalizeRoles(user.customClaims?.knowledgeCmsRoles);
  const rawAgentSlug = user.customClaims?.knowledgeCmsAgentSlug;
  const agentSlug =
    typeof rawAgentSlug === "string" && agentSlugPattern.test(rawAgentSlug)
      ? rawAgentSlug
      : undefined;
  const actor: KnowledgeCmsActor = {
    id: user.uid,
    roles,
    ...(agentSlug ? { agentSlug } : {}),
  };

  if (!getKnowledgeCmsAuthorizationDecision(actor, "read").allowed) {
    throw new KnowledgeCmsAuthenticationError("cms_role_required");
  }

  return actor;
}

async function resolveCurrentActor(
  uid: string,
  auth: KnowledgeCmsAuthProvider,
): Promise<KnowledgeCmsActor> {
  const user = await auth.getUser(uid);
  return resolveKnowledgeCmsActor({
    uid: user.uid,
    emailVerified: user.emailVerified,
    disabled: user.disabled,
    customClaims: user.customClaims,
  });
}

export async function createKnowledgeCmsSession(
  idToken: string,
  options: {
    auth?: KnowledgeCmsAuthProvider;
    now?: () => Date;
  } = {},
): Promise<KnowledgeCmsSessionResult> {
  assertKnowledgeCmsEnabled();
  const auth = options.auth ?? getFirebaseAuthAdmin();
  const now = options.now?.() ?? new Date();
  let decoded: DecodedIdToken;
  try {
    decoded = await auth.verifyIdToken(idToken);
  } catch {
    throw new KnowledgeCmsAuthenticationError("invalid_session");
  }
  const ageSeconds = Math.floor(now.getTime() / 1_000) - decoded.auth_time;

  if (
    !Number.isFinite(ageSeconds) ||
    ageSeconds < 0 ||
    ageSeconds > KNOWLEDGE_CMS_RECENT_SIGN_IN_SECONDS
  ) {
    throw new KnowledgeCmsAuthenticationError("recent_sign_in_required");
  }

  let actor: KnowledgeCmsActor;
  let sessionCookie: string;
  try {
    actor = await resolveCurrentActor(decoded.uid, auth);
    sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: KNOWLEDGE_CMS_SESSION_MAX_AGE_SECONDS * 1_000,
    });
  } catch (error) {
    if (error instanceof KnowledgeCmsAuthenticationError) {
      throw error;
    }
    throw new KnowledgeCmsAuthenticationError("invalid_session");
  }

  return { actor, sessionCookie };
}

export async function verifyKnowledgeCmsSession(
  sessionCookie: string,
  auth: KnowledgeCmsAuthProvider = getFirebaseAuthAdmin(),
): Promise<KnowledgeCmsActor> {
  assertKnowledgeCmsEnabled();
  try {
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    return await resolveCurrentActor(decoded.uid, auth);
  } catch (error) {
    if (error instanceof KnowledgeCmsAuthenticationError) {
      throw error;
    }
    throw new KnowledgeCmsAuthenticationError("invalid_session");
  }
}

export const getCurrentKnowledgeCmsActor = cache(
  async (): Promise<KnowledgeCmsActor | undefined> => {
    assertKnowledgeCmsEnabled();
    const sessionCookie = (await cookies()).get(
      KNOWLEDGE_CMS_SESSION_COOKIE,
    )?.value;
    if (!sessionCookie) {
      return undefined;
    }

    try {
      return await verifyKnowledgeCmsSession(sessionCookie);
    } catch {
      return undefined;
    }
  },
);

export async function requireKnowledgeCmsActor(): Promise<KnowledgeCmsActor> {
  const actor = await getCurrentKnowledgeCmsActor();
  if (!actor) {
    throw new KnowledgeCmsAuthenticationError("missing_session");
  }
  return actor;
}

export function getKnowledgeCmsSessionCookieOptions(
  production = process.env.NODE_ENV === "production",
) {
  return {
    httpOnly: true,
    secure: production,
    sameSite: "strict" as const,
    path: "/admin/knowledge",
    maxAge: KNOWLEDGE_CMS_SESSION_MAX_AGE_SECONDS,
    priority: "high" as const,
  };
}

function firstHeaderValue(value: string | null): string | undefined {
  return value?.split(",")[0]?.trim() || undefined;
}

export function isSameOriginKnowledgeCmsRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }

  const requestUrl = new URL(request.url);
  const host = firstHeaderValue(request.headers.get("host"));
  const forwardedProto = firstHeaderValue(
    request.headers.get("x-forwarded-proto"),
  );
  const expectedOrigins = new Set([requestUrl.origin]);
  if (host) {
    expectedOrigins.add(
      `${forwardedProto ?? requestUrl.protocol.slice(0, -1)}://${host}`,
    );
  }
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (configuredSiteUrl) {
    try {
      expectedOrigins.add(new URL(configuredSiteUrl).origin);
    } catch {
      // Invalid deployment configuration must not weaken the origin check.
    }
  }

  try {
    return expectedOrigins.has(new URL(origin).origin);
  } catch {
    return false;
  }
}
