import { createHash } from "node:crypto";
import {
  KNOWLEDGE_CMS_COLLECTIONS,
  KNOWLEDGE_CMS_SCHEMA_VERSION,
  validateKnowledgeCmsRecord,
  type KnowledgeCmsRelationships,
  type KnowledgeCmsSource,
} from "./knowledgeCms";
import type {
  KnowledgeCmsRendererContractEntry,
} from "./knowledgeCmsRendererContract";
import type {
  KnowledgeCmsRouteParityManifestEntry,
} from "./knowledgeCmsRouteParity";

export const KNOWLEDGE_CMS_ARTICLE_MIGRATION_CONTROL_VERSION = 2 as const;
export const KNOWLEDGE_CMS_ARTICLE_MIGRATION_CONTROL_MODE =
  "control_only" as const;
export const KNOWLEDGE_CMS_ARTICLE_MIGRATION_CONTROL_HASH_ALGORITHM =
  "sha256" as const;
export const KNOWLEDGE_CMS_ARTICLE_MIGRATION_CONTROL_CANONICALIZATION =
  "recursive_sorted_keys" as const;
export const KNOWLEDGE_CMS_ARTICLE_MIGRATION_CONTROL_WRITE_COUNT = 0 as const;

export interface KnowledgeCmsArticleMigrationControlTarget {
  id: string;
  kind: "article";
  slug: string;
  title: string;
  summary: string;
  searchTerms: string[];
  relationships: KnowledgeCmsRelationships;
  sources: KnowledgeCmsSource[];
  canonicalPath: string;
  pageTitle: string;
  description: string;
}

export interface KnowledgeCmsArticleMigrationControlInput {
  target: KnowledgeCmsArticleMigrationControlTarget;
  routeParity: KnowledgeCmsRouteParityManifestEntry;
  rendererContract: KnowledgeCmsRendererContractEntry;
}

export interface KnowledgeCmsArticleMigrationDraftPayload {
  schemaVersion: typeof KNOWLEDGE_CMS_SCHEMA_VERSION;
  id: string;
  kind: "article";
  slug: string;
  status: "draft";
  title: string;
  summary: string;
  body: string;
  bodyFormat: "markdown";
  searchTerms: string[];
  relationships: KnowledgeCmsRelationships;
  sources: KnowledgeCmsSource[];
  discoverability: {
    pageTitle: string;
    description: string;
    canonicalPath: string;
    indexing: "blocked";
  };
}

export interface KnowledgeCmsArticleMigrationControlRecord {
  version: typeof KNOWLEDGE_CMS_ARTICLE_MIGRATION_CONTROL_VERSION;
  mode: typeof KNOWLEDGE_CMS_ARTICLE_MIGRATION_CONTROL_MODE;
  controlId: string;
  operation: "create_private_draft";
  origin: {
    kind: "resource_entry";
    entryId: string;
    path: string;
    sourceFile: string;
  };
  target: {
    collection: typeof KNOWLEDGE_CMS_COLLECTIONS.article;
    expectedRevision: null;
    conflictPolicy: "fail_if_present";
    payload: KnowledgeCmsArticleMigrationDraftPayload;
    serverMaterialization: {
      recordIdSource: "control_record";
      ownerIdSource: "authenticated_actor";
      auditSource: "server_clock";
      requiredServerFields: readonly [
        "ownerId",
        "audit.createdAt",
        "audit.createdBy",
        "audit.updatedAt",
        "audit.updatedBy",
      ];
    };
  };
  provenance: {
    routeParityVersion: number;
    rendererContractVersion: number;
    renderedBodySha256: string;
    renderedBodyBytes: number;
    publicBodySource: "verified_static_route";
    draftBodyPurpose: "migration_control_note";
  };
  execution: {
    status: "disabled";
    readyToExecute: false;
    writeCount: typeof KNOWLEDGE_CMS_ARTICLE_MIGRATION_CONTROL_WRITE_COUNT;
    reason: "control_record_is_not_execution_authority";
  };
  rollout: {
    publicSource: "verified_static_route";
    cmsBodyPubliclyRendered: false;
    indexing: "blocked";
    cutoverEligible: false;
  };
  fingerprint: {
    algorithm: typeof KNOWLEDGE_CMS_ARTICLE_MIGRATION_CONTROL_HASH_ALGORITHM;
    canonicalization:
      typeof KNOWLEDGE_CMS_ARTICLE_MIGRATION_CONTROL_CANONICALIZATION;
    value: string;
  };
}

type UnsignedKnowledgeCmsArticleMigrationControl = Omit<
  KnowledgeCmsArticleMigrationControlRecord,
  "fingerprint"
>;

function cloneRelationships(
  value: KnowledgeCmsRelationships,
): KnowledgeCmsRelationships {
  return {
    articleIds: [...value.articleIds],
    topicIds: [...value.topicIds],
    faqIds: [...value.faqIds],
    citySlugs: [...value.citySlugs],
    agentSlugs: [...value.agentSlugs],
    carrierNames: [...value.carrierNames],
    existingPaths: [...value.existingPaths],
  };
}

function cloneSources(
  value: ReadonlyArray<KnowledgeCmsSource>,
): KnowledgeCmsSource[] {
  return value.map((source) => ({ ...source }));
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([left], [right]) =>
      left < right ? -1 : left > right ? 1 : 0,
    );
  return `{${entries
    .map(
      ([key, item]) =>
        `${JSON.stringify(key)}:${canonicalJson(item)}`,
    )
    .join(",")}}`;
}

function fingerprintControl(
  value: UnsignedKnowledgeCmsArticleMigrationControl,
): string {
  return createHash(
    KNOWLEDGE_CMS_ARTICLE_MIGRATION_CONTROL_HASH_ALGORITHM,
  )
    .update(canonicalJson(value))
    .digest("hex");
}

function deepFreeze<T>(value: T): T {
  if (
    value &&
    typeof value === "object" &&
    !Object.isFrozen(value)
  ) {
    for (const item of Object.values(value as Record<string, unknown>)) {
      deepFreeze(item);
    }
    Object.freeze(value);
  }
  return value;
}

function buildPrivateControlBody(
  input: KnowledgeCmsArticleMigrationControlInput,
): string {
  return [
    `# ${input.target.title}`,
    "",
    "Private migration control record.",
    "",
    `The live public page remains the verified static React route at \`${input.routeParity.path}\`.`,
    `Its rendered body is pinned to \`sha256:${input.routeParity.renderedBody.sha256}\` by route parity manifest v${input.routeParity.version}.`,
    "",
    "This Markdown is an editorial control note only. It is not the public page body, is blocked from indexing, and is not approved for CMS cutover.",
  ].join("\n");
}

function validateInputAlignment(
  input: KnowledgeCmsArticleMigrationControlInput,
): string[] {
  const { rendererContract, routeParity, target } = input;
  const errors: string[] = [];
  if (
    target.kind !== "article" ||
    target.id !== rendererContract.record.id ||
    target.slug !== rendererContract.path.slice(1)
  ) {
    errors.push(
      "The control target identity or slug does not match the renderer contract.",
    );
  }
  if (
    target.canonicalPath !== routeParity.path ||
    target.canonicalPath !== rendererContract.path
  ) {
    errors.push(
      "The control canonical path does not match route parity and the renderer contract.",
    );
  }
  if (
    target.pageTitle !== routeParity.metadata.pageTitle ||
    target.description !== routeParity.metadata.description
  ) {
    errors.push(
      "The control metadata does not match the route parity manifest.",
    );
  }
  if (
    routeParity.entryId !== rendererContract.entryId ||
    rendererContract.legacy.renderedSha256 !==
      routeParity.renderedBody.sha256 ||
    rendererContract.rollback.renderedSha256 !==
      routeParity.renderedBody.sha256
  ) {
    errors.push(
      "The control provenance does not share one verified route snapshot.",
    );
  }
  if (
    routeParity.cmsRepresentation.status !== "blocked" ||
    rendererContract.candidate.cmsBodyPubliclyRendered ||
    rendererContract.rollout.cutoverEligible
  ) {
    errors.push(
      "The control requires a blocked CMS body representation and disabled public cutover.",
    );
  }
  return errors;
}

function buildUnsignedControl(
  input: KnowledgeCmsArticleMigrationControlInput,
): UnsignedKnowledgeCmsArticleMigrationControl {
  const alignmentErrors = validateInputAlignment(input);
  if (alignmentErrors.length > 0) {
    throw new Error(alignmentErrors.join(" "));
  }

  const { rendererContract, routeParity, target } = input;
  return {
    version: KNOWLEDGE_CMS_ARTICLE_MIGRATION_CONTROL_VERSION,
    mode: KNOWLEDGE_CMS_ARTICLE_MIGRATION_CONTROL_MODE,
    controlId: `resource-library-article-control--${routeParity.entryId}`,
    operation: "create_private_draft",
    origin: {
      kind: "resource_entry",
      entryId: routeParity.entryId,
      path: routeParity.path,
      sourceFile: routeParity.sourceFile,
    },
    target: {
      collection: KNOWLEDGE_CMS_COLLECTIONS.article,
      expectedRevision: null,
      conflictPolicy: "fail_if_present",
      payload: {
        schemaVersion: KNOWLEDGE_CMS_SCHEMA_VERSION,
        id: target.id,
        kind: "article",
        slug: target.slug,
        status: "draft",
        title: target.title,
        summary: target.summary,
        body: buildPrivateControlBody(input),
        bodyFormat: "markdown",
        searchTerms: [...target.searchTerms],
        relationships: cloneRelationships(target.relationships),
        sources: cloneSources(target.sources),
        discoverability: {
          pageTitle: target.pageTitle,
          description: target.description,
          canonicalPath: target.canonicalPath,
          indexing: "blocked",
        },
      },
      serverMaterialization: {
        recordIdSource: "control_record",
        ownerIdSource: "authenticated_actor",
        auditSource: "server_clock",
        requiredServerFields: [
          "ownerId",
          "audit.createdAt",
          "audit.createdBy",
          "audit.updatedAt",
          "audit.updatedBy",
        ],
      },
    },
    provenance: {
      routeParityVersion: routeParity.version,
      rendererContractVersion: rendererContract.version,
      renderedBodySha256: routeParity.renderedBody.sha256,
      renderedBodyBytes: routeParity.renderedBody.bytes,
      publicBodySource: "verified_static_route",
      draftBodyPurpose: "migration_control_note",
    },
    execution: {
      status: "disabled",
      readyToExecute: false,
      writeCount:
        KNOWLEDGE_CMS_ARTICLE_MIGRATION_CONTROL_WRITE_COUNT,
      reason: "control_record_is_not_execution_authority",
    },
    rollout: {
      publicSource: "verified_static_route",
      cmsBodyPubliclyRendered: false,
      indexing: "blocked",
      cutoverEligible: false,
    },
  };
}

export function buildKnowledgeCmsArticleMigrationControl(
  input: KnowledgeCmsArticleMigrationControlInput,
): KnowledgeCmsArticleMigrationControlRecord {
  const unsigned = buildUnsignedControl(input);
  return deepFreeze({
    ...unsigned,
    fingerprint: {
      algorithm:
        KNOWLEDGE_CMS_ARTICLE_MIGRATION_CONTROL_HASH_ALGORITHM,
      canonicalization:
        KNOWLEDGE_CMS_ARTICLE_MIGRATION_CONTROL_CANONICALIZATION,
      value: fingerprintControl(unsigned),
    },
  });
}

export function validateKnowledgeCmsArticleMigrationControl(
  control: KnowledgeCmsArticleMigrationControlRecord,
  input: KnowledgeCmsArticleMigrationControlInput,
): string[] {
  const errors: string[] = [];
  let expected:
    | KnowledgeCmsArticleMigrationControlRecord
    | undefined;
  try {
    expected = buildKnowledgeCmsArticleMigrationControl(input);
  } catch (error) {
    errors.push(
      error instanceof Error
        ? error.message
        : "The article migration control input is invalid.",
    );
  }

  if (
    expected &&
    canonicalJson(control) !== canonicalJson(expected)
  ) {
    errors.push(
      `Article migration control "${control.controlId}" does not match its deterministic source inputs.`,
    );
  }

  const { payload } = control.target;
  if (
    "ownerId" in payload ||
    "audit" in payload ||
    "review" in payload ||
    "publication" in payload
  ) {
    errors.push(
      `Article migration control "${control.controlId}" contains server-owned workflow fields.`,
    );
  }
  const projectedRecord = {
    ...payload,
    ownerId: "migration-control-validation",
    audit: {
      revision: 1,
      createdAt: "2000-01-01T00:00:00.000Z",
      createdBy: "migration-control-validation",
      updatedAt: "2000-01-01T00:00:00.000Z",
      updatedBy: "migration-control-validation",
    },
  };
  for (const message of validateKnowledgeCmsRecord(projectedRecord)) {
    errors.push(
      `Article migration control "${control.controlId}" has an invalid draft payload: ${message}`,
    );
  }
  if (
    control.execution.status !== "disabled" ||
    control.execution.readyToExecute ||
    control.execution.writeCount !== 0 ||
    control.target.expectedRevision !== null ||
    control.target.conflictPolicy !== "fail_if_present"
  ) {
    errors.push(
      `Article migration control "${control.controlId}" must remain disabled, zero-write, create-only, and fail if the target exists.`,
    );
  }
  if (
    control.rollout.cmsBodyPubliclyRendered ||
    control.rollout.indexing !== "blocked" ||
    control.rollout.cutoverEligible ||
    !control.target.payload.body.includes(
      "It is not the public page body",
    )
  ) {
    errors.push(
      `Article migration control "${control.controlId}" must keep Markdown private, indexing blocked, and cutover disabled.`,
    );
  }
  if (
    control.fingerprint.algorithm !==
      KNOWLEDGE_CMS_ARTICLE_MIGRATION_CONTROL_HASH_ALGORITHM ||
    control.fingerprint.canonicalization !==
      KNOWLEDGE_CMS_ARTICLE_MIGRATION_CONTROL_CANONICALIZATION ||
    !/^[a-f0-9]{64}$/.test(control.fingerprint.value)
  ) {
    errors.push(
      `Article migration control "${control.controlId}" has an invalid fingerprint.`,
    );
  } else {
    const unsigned = Object.fromEntries(
      Object.entries(control).filter(
        ([key]) => key !== "fingerprint",
      ),
    ) as UnsignedKnowledgeCmsArticleMigrationControl;
    if (fingerprintControl(unsigned) !== control.fingerprint.value) {
      errors.push(
        `Article migration control "${control.controlId}" fingerprint does not match its canonical contents.`,
      );
    }
  }

  return [...new Set(errors)];
}
