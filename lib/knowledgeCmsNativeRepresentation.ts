import "server-only";

import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import generatedManifest from "./generated/knowledgeCmsNativeRepresentations.json";
import {
  KNOWLEDGE_CMS_COLLECTIONS,
  type KnowledgeCmsArticle,
} from "./knowledgeCms";
import {
  getKnowledgeCmsRendererContract,
} from "./knowledgeCmsRendererContract";
import {
  getKnowledgeCmsRouteParity,
  type KnowledgeCmsRoutePreservationRequirement,
  type KnowledgeCmsRouteSchemaType,
} from "./knowledgeCmsRouteParity";

export const KNOWLEDGE_CMS_NATIVE_REPRESENTATION_VERSION = 1 as const;
export const KNOWLEDGE_CMS_NATIVE_REPRESENTATION_FORMAT =
  "react_static_markup_v1" as const;
export const KNOWLEDGE_CMS_NATIVE_REPRESENTATION_ENCODING =
  "gzip_base64" as const;
export const KNOWLEDGE_CMS_NATIVE_REPRESENTATION_HASH_ALGORITHM =
  "sha256" as const;
export const KNOWLEDGE_CMS_NATIVE_REPRESENTATION_CANONICALIZATION =
  "recursive_sorted_keys" as const;
export const KNOWLEDGE_CMS_NATIVE_REPRESENTATION_CONTROL_WRITE_COUNT =
  0 as const;
export const KNOWLEDGE_CMS_NATIVE_REPRESENTATION_MAX_HTML_BYTES =
  200_000 as const;

interface GeneratedRepresentation {
  entryId: string;
  path: string;
  sourceFile: string;
  encoding: typeof KNOWLEDGE_CMS_NATIVE_REPRESENTATION_ENCODING;
  compressedBody: string;
  renderedBodySha256: string;
  renderedBodyBytes: number;
}

interface GeneratedManifest {
  version: typeof KNOWLEDGE_CMS_NATIVE_REPRESENTATION_VERSION;
  representations: GeneratedRepresentation[];
}

export interface KnowledgeCmsNativeRepresentationBody {
  format: typeof KNOWLEDGE_CMS_NATIVE_REPRESENTATION_FORMAT;
  encoding: typeof KNOWLEDGE_CMS_NATIVE_REPRESENTATION_ENCODING;
  compressedBody: string;
  renderedBodySha256: string;
  renderedBodyBytes: number;
}

export interface KnowledgeCmsNativeRepresentationMetadata {
  pageTitle: string;
  description: string;
  canonicalUrl: string;
  openGraphTitle: string;
  openGraphDescription: string;
  openGraphUrl: string;
}

export interface KnowledgeCmsNativeRepresentationControl {
  version: typeof KNOWLEDGE_CMS_NATIVE_REPRESENTATION_VERSION;
  mode: "control_only";
  controlId: string;
  operation: "create_private_article_rendering";
  origin: {
    entryId: string;
    path: string;
    sourceFile: string;
  };
  target: {
    collection: typeof KNOWLEDGE_CMS_COLLECTIONS.articleRenderings;
    idPrefix: string;
    idTemplate: `${string}{articleRevision}`;
    articleId: string;
    expectedRevision: null;
    conflictPolicy: "fail_if_present";
    body: KnowledgeCmsNativeRepresentationBody;
    metadata: KnowledgeCmsNativeRepresentationMetadata;
  };
  provenance: {
    routeParityVersion: number;
    rendererContractVersion: number;
    preservationRequirements: KnowledgeCmsRoutePreservationRequirement[];
    capture: "generated_from_verified_static_route";
  };
  execution: {
    status: "disabled";
    readyToExecute: false;
    writeCount: typeof KNOWLEDGE_CMS_NATIVE_REPRESENTATION_CONTROL_WRITE_COUNT;
    reason: "control_is_not_execution_authority";
  };
  rollout: {
    publicSource: "verified_static_route";
    privateShadowOnly: true;
    indexing: "blocked";
    cutoverEligible: false;
  };
  fingerprint: {
    algorithm: typeof KNOWLEDGE_CMS_NATIVE_REPRESENTATION_HASH_ALGORITHM;
    canonicalization: typeof KNOWLEDGE_CMS_NATIVE_REPRESENTATION_CANONICALIZATION;
    value: string;
  };
}

export interface KnowledgeCmsNativeRepresentationArtifact {
  version: typeof KNOWLEDGE_CMS_NATIVE_REPRESENTATION_VERSION;
  id: string;
  entryId: string;
  path: string;
  status: "private_shadow";
  article: {
    id: string;
    revision: number;
    status: "published";
  };
  body: KnowledgeCmsNativeRepresentationBody;
  metadata: KnowledgeCmsNativeRepresentationMetadata;
  control: {
    id: string;
    fingerprint: string;
  };
  renderer: {
    routeParityVersion: number;
    rendererContractVersion: number;
    preservationRequirements: KnowledgeCmsRoutePreservationRequirement[];
  };
  audit: {
    createdAt: string;
    createdBy: string;
  };
  rollout: {
    publicSource: "verified_static_route";
    privateShadowOnly: true;
    indexing: "blocked";
    cutoverEligible: false;
  };
  fingerprint: {
    algorithm: typeof KNOWLEDGE_CMS_NATIVE_REPRESENTATION_HASH_ALGORITHM;
    canonicalization: typeof KNOWLEDGE_CMS_NATIVE_REPRESENTATION_CANONICALIZATION;
    value: string;
  };
}

export interface KnowledgeCmsNativeRenderedBodyEvidence {
  html: string;
  sha256: string;
  bytes: number;
  h1: string;
  h1Count: number;
  schemaTypes: KnowledgeCmsRouteSchemaType[];
  formCount: number;
  faqDisclosureCount: number;
}

type UnsignedControl = Omit<
  KnowledgeCmsNativeRepresentationControl,
  "fingerprint"
>;
type UnsignedArtifact = Omit<
  KnowledgeCmsNativeRepresentationArtifact,
  "fingerprint"
>;

const manifest = generatedManifest as GeneratedManifest;
const sha256Pattern = /^[a-f0-9]{64}$/;
const identifierPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;

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
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
    .join(",")}}`;
}

function fingerprint(value: unknown): string {
  return createHash(KNOWLEDGE_CMS_NATIVE_REPRESENTATION_HASH_ALGORITHM)
    .update(canonicalJson(value))
    .digest("hex");
}

function hasExactKeys(
  value: unknown,
  keys: readonly string[],
): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const actual = Object.keys(value as Record<string, unknown>).sort();
  const expected = [...keys].sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const item of Object.values(value as Record<string, unknown>)) {
      deepFreeze(item);
    }
    Object.freeze(value);
  }
  return value;
}

function decodeRenderedText(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replaceAll("&amp;", "&")
    .replaceAll("&#x27;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x2F;", "/")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSchemaTypes(html: string): KnowledgeCmsRouteSchemaType[] {
  return [
    ...html.matchAll(
      /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
    ),
  ].flatMap((match) => {
    const parsed = JSON.parse(match[1]) as
      | Record<string, unknown>
      | Array<Record<string, unknown>>;
    return (Array.isArray(parsed) ? parsed : [parsed]).flatMap((schema) =>
      schema["@type"] === "FAQPage" || schema["@type"] === "WebPage"
        ? [schema["@type"]]
        : [],
    );
  });
}

export function decodeKnowledgeCmsNativeRepresentationBody(
  body: KnowledgeCmsNativeRepresentationBody,
): KnowledgeCmsNativeRenderedBodyEvidence {
  if (
    body.format !== KNOWLEDGE_CMS_NATIVE_REPRESENTATION_FORMAT ||
    body.encoding !== KNOWLEDGE_CMS_NATIVE_REPRESENTATION_ENCODING ||
    !sha256Pattern.test(body.renderedBodySha256) ||
    !Number.isInteger(body.renderedBodyBytes) ||
    body.renderedBodyBytes < 1 ||
    body.renderedBodyBytes >
      KNOWLEDGE_CMS_NATIVE_REPRESENTATION_MAX_HTML_BYTES ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(body.compressedBody) ||
    Buffer.from(body.compressedBody, "base64").toString("base64") !==
      body.compressedBody
  ) {
    throw new Error("The CMS-native rendering body envelope is invalid.");
  }

  let html: string;
  try {
    html = gunzipSync(Buffer.from(body.compressedBody, "base64"), {
      maxOutputLength:
        KNOWLEDGE_CMS_NATIVE_REPRESENTATION_MAX_HTML_BYTES,
    }).toString("utf8");
  } catch {
    throw new Error("The CMS-native rendering body could not be decoded.");
  }

  const bytes = Buffer.byteLength(html);
  const sha256 = createHash("sha256").update(html).digest("hex");
  if (
    bytes !== body.renderedBodyBytes ||
    sha256 !== body.renderedBodySha256
  ) {
    throw new Error("The CMS-native rendering body integrity check failed.");
  }
  const allScripts = html.match(/<script\b/gi) ?? [];
  const jsonLdScripts = html.match(
    /<script\b[^>]*type="application\/ld\+json"[^>]*>/g,
  ) ?? [];
  if (
    allScripts.length !== jsonLdScripts.length ||
    /\s(?:on[a-z]+)\s*=/i.test(html) ||
    /javascript\s*:/i.test(html) ||
    /<(?:iframe|object|embed|base)\b/i.test(html)
  ) {
    throw new Error(
      "The CMS-native rendering body contains an unsafe executable surface.",
    );
  }

  const h1s = [
    ...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g),
  ].map((match) => decodeRenderedText(match[1]));
  let schemaTypes: KnowledgeCmsRouteSchemaType[];
  try {
    schemaTypes = extractSchemaTypes(html);
  } catch {
    throw new Error(
      "The CMS-native rendering body contains invalid structured data.",
    );
  }
  return {
    html,
    sha256,
    bytes,
    h1: h1s[0] ?? "",
    h1Count: h1s.length,
    schemaTypes,
    formCount: (html.match(/<form\b/g) ?? []).length,
    faqDisclosureCount: (html.match(/<details\b/g) ?? []).length,
  };
}

function generatedForEntry(entryId: string): GeneratedRepresentation | undefined {
  return manifest.representations.find((entry) => entry.entryId === entryId);
}

function buildUnsignedControl(entryId: string): UnsignedControl {
  const generated = generatedForEntry(entryId);
  const parity = getKnowledgeCmsRouteParity(entryId);
  const contract = getKnowledgeCmsRendererContract(entryId);
  if (!generated || !parity || !contract) {
    throw new Error(
      `CMS-native representation "${entryId}" has no complete governed source.`,
    );
  }
  if (
    manifest.version !== KNOWLEDGE_CMS_NATIVE_REPRESENTATION_VERSION ||
    generated.path !== parity.path ||
    generated.sourceFile !== parity.sourceFile ||
    generated.encoding !== KNOWLEDGE_CMS_NATIVE_REPRESENTATION_ENCODING ||
    generated.renderedBodySha256 !== parity.renderedBody.sha256 ||
    generated.renderedBodyBytes !== parity.renderedBody.bytes ||
    contract.path !== parity.path
  ) {
    throw new Error(
      `CMS-native representation "${entryId}" does not match route parity.`,
    );
  }
  const body: KnowledgeCmsNativeRepresentationBody = {
    format: KNOWLEDGE_CMS_NATIVE_REPRESENTATION_FORMAT,
    encoding: KNOWLEDGE_CMS_NATIVE_REPRESENTATION_ENCODING,
    compressedBody: generated.compressedBody,
    renderedBodySha256: generated.renderedBodySha256,
    renderedBodyBytes: generated.renderedBodyBytes,
  };
  const evidence = decodeKnowledgeCmsNativeRepresentationBody(body);
  if (
    evidence.h1 !== parity.renderedBody.h1 ||
    evidence.h1Count !== parity.renderedBody.h1Count ||
    canonicalJson(evidence.schemaTypes) !==
      canonicalJson(parity.renderedBody.schemaTypes) ||
    evidence.formCount !== parity.renderedBody.formCount ||
    evidence.faqDisclosureCount !==
      parity.renderedBody.faqDisclosureCount
  ) {
    throw new Error(
      `CMS-native representation "${entryId}" does not preserve route capabilities.`,
    );
  }
  return {
    version: KNOWLEDGE_CMS_NATIVE_REPRESENTATION_VERSION,
    mode: "control_only",
    controlId: `resource-library-rendering-control--${entryId}`,
    operation: "create_private_article_rendering",
    origin: {
      entryId,
      path: parity.path,
      sourceFile: parity.sourceFile,
    },
    target: {
      collection: KNOWLEDGE_CMS_COLLECTIONS.articleRenderings,
      idPrefix: `resource-rendering--${entryId}--r`,
      idTemplate: `resource-rendering--${entryId}--r{articleRevision}`,
      articleId: contract.record.id,
      expectedRevision: null,
      conflictPolicy: "fail_if_present",
      body,
      metadata: {
        pageTitle: parity.metadata.pageTitle,
        description: parity.metadata.description,
        canonicalUrl: parity.metadata.canonicalUrl,
        openGraphTitle: parity.metadata.openGraphTitle,
        openGraphDescription: parity.metadata.openGraphDescription,
        openGraphUrl: parity.metadata.openGraphUrl,
      },
    },
    provenance: {
      routeParityVersion: parity.version,
      rendererContractVersion: contract.version,
      preservationRequirements: [
        ...parity.cmsRepresentation.preservationRequirements,
      ],
      capture: "generated_from_verified_static_route",
    },
    execution: {
      status: "disabled",
      readyToExecute: false,
      writeCount: KNOWLEDGE_CMS_NATIVE_REPRESENTATION_CONTROL_WRITE_COUNT,
      reason: "control_is_not_execution_authority",
    },
    rollout: {
      publicSource: "verified_static_route",
      privateShadowOnly: true,
      indexing: "blocked",
      cutoverEligible: false,
    },
  };
}

export function buildKnowledgeCmsNativeRepresentationControl(
  entryId: string,
): KnowledgeCmsNativeRepresentationControl {
  const unsigned = buildUnsignedControl(entryId);
  return deepFreeze({
    ...unsigned,
    fingerprint: {
      algorithm: KNOWLEDGE_CMS_NATIVE_REPRESENTATION_HASH_ALGORITHM,
      canonicalization:
        KNOWLEDGE_CMS_NATIVE_REPRESENTATION_CANONICALIZATION,
      value: fingerprint(unsigned),
    },
  });
}

export const knowledgeCmsNativeRepresentationControls: ReadonlyArray<KnowledgeCmsNativeRepresentationControl> =
  Object.freeze(
    manifest.representations.map((entry) =>
      buildKnowledgeCmsNativeRepresentationControl(entry.entryId),
    ),
  );

export function getKnowledgeCmsNativeRepresentationControl(
  entryId: string,
): KnowledgeCmsNativeRepresentationControl | undefined {
  return knowledgeCmsNativeRepresentationControls.find(
    (control) => control.origin.entryId === entryId,
  );
}

export function getKnowledgeCmsNativeRepresentationArtifactId(
  entryId: string,
  articleRevision: number,
): string {
  const control = getKnowledgeCmsNativeRepresentationControl(entryId);
  if (
    !control ||
    !Number.isInteger(articleRevision) ||
    articleRevision < 1 ||
    articleRevision > 9_999_999_999
  ) {
    throw new Error(
      "A CMS-native representation ID requires a governed entry and positive article revision.",
    );
  }
  return `${control.target.idPrefix}${String(articleRevision).padStart(10, "0")}`;
}

export function isKnowledgeCmsNativeRepresentationArtifactId(
  value: string,
): boolean {
  return knowledgeCmsNativeRepresentationControls.some(
    (control) => {
      const revision = value.slice(control.target.idPrefix.length);
      return (
        value.startsWith(control.target.idPrefix) &&
        /^\d{10}$/.test(revision) &&
        Number(revision) >= 1
      );
    },
  );
}

export function validateKnowledgeCmsNativeRepresentationControls(): string[] {
  const errors: string[] = [];
  const seenEntries = new Set<string>();
  const seenIdPrefixes = new Set<string>();
  if (
    manifest.version !== KNOWLEDGE_CMS_NATIVE_REPRESENTATION_VERSION ||
    knowledgeCmsNativeRepresentationControls.length !== 22
  ) {
    errors.push(
      "CMS-native representation controls must cover all 22 article routes.",
    );
  }
  for (const control of knowledgeCmsNativeRepresentationControls) {
    if (seenEntries.has(control.origin.entryId)) {
      errors.push(
        `CMS-native representation entry "${control.origin.entryId}" is duplicated.`,
      );
    }
    if (seenIdPrefixes.has(control.target.idPrefix)) {
      errors.push(
        `CMS-native representation target prefix "${control.target.idPrefix}" is duplicated.`,
      );
    }
    seenEntries.add(control.origin.entryId);
    seenIdPrefixes.add(control.target.idPrefix);
    let expected: KnowledgeCmsNativeRepresentationControl | undefined;
    try {
      expected = buildKnowledgeCmsNativeRepresentationControl(
        control.origin.entryId,
      );
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
    if (expected && canonicalJson(expected) !== canonicalJson(control)) {
      errors.push(
        `CMS-native representation control "${control.controlId}" is not deterministic.`,
      );
    }
    if (
      control.execution.status !== "disabled" ||
      control.execution.readyToExecute ||
      control.execution.writeCount !== 0 ||
      control.target.expectedRevision !== null ||
      control.target.conflictPolicy !== "fail_if_present" ||
      !control.rollout.privateShadowOnly ||
      control.rollout.cutoverEligible
    ) {
      errors.push(
        `CMS-native representation control "${control.controlId}" must remain private, create-only, zero-write, and cutover-ineligible.`,
      );
    }
  }
  return [...new Set(errors)];
}

export function buildKnowledgeCmsNativeRepresentationArtifact(input: {
  control: KnowledgeCmsNativeRepresentationControl;
  article: KnowledgeCmsArticle;
  actorId: string;
  createdAt: string;
}): KnowledgeCmsNativeRepresentationArtifact {
  if (
    !identifierPattern.test(input.actorId) ||
    Number.isNaN(new Date(input.createdAt).getTime()) ||
    input.article.id !== input.control.target.articleId ||
    input.article.status !== "published" ||
    !Number.isInteger(input.article.audit.revision) ||
    input.article.audit.revision < 1
  ) {
    throw new Error(
      "A CMS-native representation requires a matching published article, authenticated actor, and server clock.",
    );
  }
  const unsigned: UnsignedArtifact = {
    version: KNOWLEDGE_CMS_NATIVE_REPRESENTATION_VERSION,
    id: getKnowledgeCmsNativeRepresentationArtifactId(
      input.control.origin.entryId,
      input.article.audit.revision,
    ),
    entryId: input.control.origin.entryId,
    path: input.control.origin.path,
    status: "private_shadow",
    article: {
      id: input.article.id,
      revision: input.article.audit.revision,
      status: "published",
    },
    body: { ...input.control.target.body },
    metadata: { ...input.control.target.metadata },
    control: {
      id: input.control.controlId,
      fingerprint: input.control.fingerprint.value,
    },
    renderer: {
      routeParityVersion: input.control.provenance.routeParityVersion,
      rendererContractVersion:
        input.control.provenance.rendererContractVersion,
      preservationRequirements: [
        ...input.control.provenance.preservationRequirements,
      ],
    },
    audit: {
      createdAt: input.createdAt,
      createdBy: input.actorId,
    },
    rollout: { ...input.control.rollout },
  };
  return deepFreeze({
    ...unsigned,
    fingerprint: {
      algorithm: KNOWLEDGE_CMS_NATIVE_REPRESENTATION_HASH_ALGORITHM,
      canonicalization:
        KNOWLEDGE_CMS_NATIVE_REPRESENTATION_CANONICALIZATION,
      value: fingerprint(unsigned),
    },
  });
}

function validateKnowledgeCmsNativeRepresentationArtifactUnsafe(
  artifact: KnowledgeCmsNativeRepresentationArtifact,
  article?: KnowledgeCmsArticle,
): string[] {
  const errors: string[] = [];
  if (
    !hasExactKeys(artifact, [
      "version",
      "id",
      "entryId",
      "path",
      "status",
      "article",
      "body",
      "metadata",
      "control",
      "renderer",
      "audit",
      "rollout",
      "fingerprint",
    ]) ||
    !hasExactKeys(artifact.article, ["id", "revision", "status"]) ||
    !hasExactKeys(artifact.body, [
      "format",
      "encoding",
      "compressedBody",
      "renderedBodySha256",
      "renderedBodyBytes",
    ]) ||
    !hasExactKeys(artifact.metadata, [
      "pageTitle",
      "description",
      "canonicalUrl",
      "openGraphTitle",
      "openGraphDescription",
      "openGraphUrl",
    ]) ||
    !hasExactKeys(artifact.control, ["id", "fingerprint"]) ||
    !hasExactKeys(artifact.renderer, [
      "routeParityVersion",
      "rendererContractVersion",
      "preservationRequirements",
    ]) ||
    !hasExactKeys(artifact.audit, ["createdAt", "createdBy"]) ||
    !hasExactKeys(artifact.rollout, [
      "publicSource",
      "privateShadowOnly",
      "indexing",
      "cutoverEligible",
    ]) ||
    !hasExactKeys(artifact.fingerprint, [
      "algorithm",
      "canonicalization",
      "value",
    ])
  ) {
    return ["The stored CMS-native representation schema is invalid."];
  }
  const control = getKnowledgeCmsNativeRepresentationControl(
    artifact.entryId,
  );
  if (!control) {
    return ["The CMS-native representation has no governed control."];
  }
  if (
    artifact.version !== KNOWLEDGE_CMS_NATIVE_REPRESENTATION_VERSION ||
    artifact.id !==
      getKnowledgeCmsNativeRepresentationArtifactId(
        artifact.entryId,
        artifact.article.revision,
      ) ||
    artifact.path !== control.origin.path ||
    artifact.status !== "private_shadow" ||
    artifact.article.id !== control.target.articleId ||
    artifact.article.status !== "published" ||
    !Number.isInteger(artifact.article.revision) ||
    artifact.article.revision < 1 ||
    canonicalJson(artifact.body) !== canonicalJson(control.target.body) ||
    canonicalJson(artifact.metadata) !==
      canonicalJson(control.target.metadata) ||
    artifact.control.id !== control.controlId ||
    artifact.control.fingerprint !== control.fingerprint.value ||
    canonicalJson(artifact.renderer.preservationRequirements) !==
      canonicalJson(control.provenance.preservationRequirements) ||
    artifact.renderer.routeParityVersion !==
      control.provenance.routeParityVersion ||
    artifact.renderer.rendererContractVersion !==
      control.provenance.rendererContractVersion ||
    !artifact.rollout.privateShadowOnly ||
    artifact.rollout.cutoverEligible ||
    artifact.rollout.indexing !== "blocked" ||
    !identifierPattern.test(artifact.audit.createdBy) ||
    Number.isNaN(new Date(artifact.audit.createdAt).getTime())
  ) {
    errors.push(
      "The CMS-native representation does not match its immutable control.",
    );
  }
  if (
    article &&
    (article.id !== artifact.article.id ||
      article.status !== "published" ||
      article.audit.revision !== artifact.article.revision)
  ) {
    errors.push(
      "The CMS-native representation is stale for the current published article revision.",
    );
  }
  try {
    decodeKnowledgeCmsNativeRepresentationBody(artifact.body);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  if (
    artifact.fingerprint.algorithm !==
      KNOWLEDGE_CMS_NATIVE_REPRESENTATION_HASH_ALGORITHM ||
    artifact.fingerprint.canonicalization !==
      KNOWLEDGE_CMS_NATIVE_REPRESENTATION_CANONICALIZATION
  ) {
    errors.push("The CMS-native representation fingerprint is invalid.");
  } else {
    const unsigned = Object.fromEntries(
      Object.entries(artifact).filter(([key]) => key !== "fingerprint"),
    ) as UnsignedArtifact;
    if (fingerprint(unsigned) !== artifact.fingerprint.value) {
      errors.push(
        "The CMS-native representation fingerprint does not match its contents.",
      );
    }
  }
  return [...new Set(errors)];
}

export function validateKnowledgeCmsNativeRepresentationArtifact(
  artifact: KnowledgeCmsNativeRepresentationArtifact,
  article?: KnowledgeCmsArticle,
): string[] {
  try {
    return validateKnowledgeCmsNativeRepresentationArtifactUnsafe(
      artifact,
      article,
    );
  } catch {
    return ["The stored CMS-native representation is malformed."];
  }
}

export function parseKnowledgeCmsNativeRepresentationArtifact(
  value: unknown,
): KnowledgeCmsNativeRepresentationArtifact {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Stored CMS-native representation is invalid.");
  }
  const artifact = value as KnowledgeCmsNativeRepresentationArtifact;
  const errors = validateKnowledgeCmsNativeRepresentationArtifact(artifact);
  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }
  return deepFreeze(structuredClone(artifact));
}
