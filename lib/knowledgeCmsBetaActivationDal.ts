import "server-only";

import {
  assertKnowledgeCmsActionAllowed,
  type KnowledgeCmsActor,
} from "./knowledgeCms";
import { requireKnowledgeCmsActor } from "./knowledgeCmsAdminAuth";
import {
  buildKnowledgeCmsBetaActivationPreview,
  type KnowledgeCmsBetaActivationPreview,
  type KnowledgeCmsBetaDeploymentInput,
} from "./knowledgeCmsBetaActivation";
import type { KnowledgeCmsOperationalReadinessReport } from "./knowledgeCmsOperationalReadiness";
import { getKnowledgeCmsOperationalReadinessForActor } from "./knowledgeCmsOperationalReadinessDal";

export interface KnowledgeCmsBetaReadinessProvider {
  read(
    actor: KnowledgeCmsActor,
    now: Date,
  ): Promise<KnowledgeCmsOperationalReadinessReport>;
}

export function getKnowledgeCmsBetaDeploymentInput(): KnowledgeCmsBetaDeploymentInput {
  // Direct public-env references are intentionally build-time replaceable in
  // the standalone image. They identify the public beta deployment and are
  // never accepted as an authorization source by themselves.
  return {
    siteEnvironment: process.env.NEXT_PUBLIC_SITE_ENV,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  };
}

export async function readKnowledgeCmsBetaActivationPreview(input: {
  actor: KnowledgeCmsActor;
  readinessProvider: KnowledgeCmsBetaReadinessProvider;
  deployment: KnowledgeCmsBetaDeploymentInput;
  now?: Date;
}): Promise<KnowledgeCmsBetaActivationPreview> {
  assertKnowledgeCmsActionAllowed(input.actor, "preview_migration");
  const now = input.now ?? new Date();
  if (Number.isNaN(now.getTime())) {
    throw new Error("Knowledge CMS beta activation preview requires a valid server clock.");
  }
  const readiness = await input.readinessProvider.read(input.actor, now);
  return buildKnowledgeCmsBetaActivationPreview({
    actor: input.actor,
    readiness,
    deployment: input.deployment,
    observedAt: now,
  });
}

export async function getKnowledgeCmsAdminBetaActivationPreview(): Promise<KnowledgeCmsBetaActivationPreview> {
  const actor = await requireKnowledgeCmsActor();
  return readKnowledgeCmsBetaActivationPreview({
    actor,
    readinessProvider: {
      read: getKnowledgeCmsOperationalReadinessForActor,
    },
    deployment: getKnowledgeCmsBetaDeploymentInput(),
  });
}
