import "server-only";

import {
  getFirebaseAdminEnvSummary,
  getFirebaseAuthAdmin,
} from "./firebase-admin";
import {
  assertKnowledgeCmsActionAllowed,
  type KnowledgeCmsActor,
} from "./knowledgeCms";
import { requireKnowledgeCmsActor } from "./knowledgeCmsAdminAuth";
import {
  KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED_ENV,
} from "./knowledgeCmsArticleMigrationExecution";
import {
  previewKnowledgeCmsArticleMaterialization,
} from "./knowledgeCmsMigrationDal";
import {
  buildKnowledgeCmsOperationalReadinessReport,
  scanKnowledgeCmsRoleDirectory,
  type KnowledgeCmsBooleanGateState,
  type KnowledgeCmsOperationalConfiguration,
  type KnowledgeCmsOperationalReadinessReport,
  type KnowledgeCmsOperationalVerificationRead,
  type KnowledgeCmsOperationalWorkspaceEvidence,
  type KnowledgeCmsRoleDirectoryProvider,
} from "./knowledgeCmsOperationalReadiness";
import {
  KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE_ENV,
  resolveKnowledgeCmsPublicRendererMode,
} from "./knowledgeCmsRendererContract";
import {
  createKnowledgeCmsRepository,
  type KnowledgeCmsArticleMigrationRepository,
  type KnowledgeCmsRepository,
} from "./knowledgeCmsRepository";
import { env } from "./runtimeValues";

export type KnowledgeCmsOperationalReadinessRepository =
  Pick<KnowledgeCmsRepository, "list"> &
  Pick<
    KnowledgeCmsArticleMigrationRepository,
    "listArticleMigrationExecutions" | "verifyArticleMigrationExecution"
  >;

function booleanGateState(value: string | undefined): KnowledgeCmsBooleanGateState {
  if (value === undefined || value === "false") {
    return "disabled";
  }
  return value === "true" ? "enabled" : "invalid";
}

function serverFirebaseProjectId(): string | undefined {
  return (
    env("FIREBASE_PROJECT_ID") ??
    env("GOOGLE_CLOUD_PROJECT") ??
    env("GCLOUD_PROJECT") ??
    env("GCP_PROJECT")
  );
}

export function getKnowledgeCmsOperationalConfiguration(): KnowledgeCmsOperationalConfiguration {
  // These direct references are intentionally build-time replaceable. The
  // standalone runtime image does not need to retain public Firebase values.
  const browserApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  const browserAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
  const browserProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const serverProjectId = serverFirebaseProjectId();
  const browserAuthConfigured = Boolean(
    browserApiKey && browserAuthDomain && browserProjectId,
  );

  return {
    cmsGate: booleanGateState(process.env.KNOWLEDGE_CMS_ENABLED),
    articleMigrationExecutionGate: booleanGateState(
      process.env[
        KNOWLEDGE_CMS_ARTICLE_MIGRATION_EXECUTION_ENABLED_ENV
      ],
    ),
    renderer: resolveKnowledgeCmsPublicRendererMode(
      process.env[KNOWLEDGE_CMS_PUBLIC_RENDERER_MODE_ENV],
    ),
    firebase: {
      adminConfigured: getFirebaseAdminEnvSummary().configured,
      browserAuthConfigured,
      projectAlignment:
        browserProjectId && serverProjectId
          ? browserProjectId === serverProjectId
            ? "matched"
            : "mismatch"
          : "unverifiable",
    },
  };
}

async function readWorkspaceEvidence(
  repository: KnowledgeCmsOperationalReadinessRepository,
  actor: KnowledgeCmsActor,
  now: Date,
): Promise<KnowledgeCmsOperationalWorkspaceEvidence> {
  let workspace;
  try {
    workspace = await previewKnowledgeCmsArticleMaterialization(
      repository,
      actor,
      now,
    );
  } catch {
    return {
      status: "unavailable",
      reason: "firestore_inventory_unavailable",
    };
  }

  const verifications: KnowledgeCmsOperationalVerificationRead[] =
    await Promise.all(
      workspace.executionHistory.entries.map(async (entry) => {
        try {
          const result = await repository.verifyArticleMigrationExecution(
            actor,
            entry.recordId,
          );
          return result
            ? {
                recordId: entry.recordId,
                status: "available" as const,
                result,
              }
            : {
                recordId: entry.recordId,
                status: "missing" as const,
              };
        } catch {
          return {
            recordId: entry.recordId,
            status: "unavailable" as const,
          };
        }
      }),
    );

  return {
    status: "available",
    workspace,
    verifications,
  };
}

export async function readKnowledgeCmsOperationalReadiness(input: {
  actor: KnowledgeCmsActor;
  repository: KnowledgeCmsOperationalReadinessRepository;
  roleDirectoryProvider: KnowledgeCmsRoleDirectoryProvider;
  configuration: KnowledgeCmsOperationalConfiguration;
  now?: Date;
}): Promise<KnowledgeCmsOperationalReadinessReport> {
  assertKnowledgeCmsActionAllowed(input.actor, "preview_migration");
  const now = input.now ?? new Date();
  if (Number.isNaN(now.getTime())) {
    throw new Error("Knowledge CMS readiness requires a valid server clock.");
  }

  const [roleDirectory, workspaceEvidence] = await Promise.all([
    scanKnowledgeCmsRoleDirectory(input.roleDirectoryProvider, now),
    readWorkspaceEvidence(input.repository, input.actor, now),
  ]);
  return buildKnowledgeCmsOperationalReadinessReport({
    actor: input.actor,
    observedAt: now,
    configuration: input.configuration,
    roleDirectory,
    workspaceEvidence,
  });
}

export async function getKnowledgeCmsOperationalReadinessForActor(
  actor: KnowledgeCmsActor,
  now: Date = new Date(),
): Promise<KnowledgeCmsOperationalReadinessReport> {
  return readKnowledgeCmsOperationalReadiness({
    actor,
    repository: createKnowledgeCmsRepository(),
    roleDirectoryProvider: getFirebaseAuthAdmin(),
    configuration: getKnowledgeCmsOperationalConfiguration(),
    now,
  });
}

export async function getKnowledgeCmsAdminOperationalReadiness(): Promise<KnowledgeCmsOperationalReadinessReport> {
  const actor = await requireKnowledgeCmsActor();
  return getKnowledgeCmsOperationalReadinessForActor(actor);
}
