import "server-only";

import { createHash } from "node:crypto";
import type {
  DocumentData,
  DocumentReference,
  Firestore,
  Transaction,
} from "firebase-admin/firestore";
import { getFirestoreAdmin } from "./firebase-admin";
import {
  KNOWLEDGE_CMS_ARTICLE_REVISION_SNAPSHOT_SCHEMA_VERSION,
  KNOWLEDGE_CMS_COLLECTIONS,
  assertKnowledgeCmsActionAllowed,
  buildKnowledgeCmsSearchDocument,
  cloneKnowledgeCmsRecord,
  parseKnowledgeCmsRecord,
  type KnowledgeCmsActor,
  type KnowledgeCmsArticle,
  type KnowledgeCmsArticleRevisionSnapshot,
  type KnowledgeCmsFaq,
  type KnowledgeCmsRecord,
  type KnowledgeCmsRecordKind,
  type KnowledgeCmsStatus,
  type KnowledgeCmsTopic,
} from "./knowledgeCms";
import {
  assertKnowledgeCmsArticleMigrationExecutionEnabled,
  buildKnowledgeCmsArticleMigrationExecutionPlan,
  type KnowledgeCmsArticleMigrationExecutionRequest,
} from "./knowledgeCmsArticleMigrationExecution";
import {
  buildKnowledgeCmsArticleMigrationExecutionHistory,
  buildKnowledgeCmsArticleMigrationPostCreateVerification,
  fingerprintKnowledgeCmsArticleMigrationRecord,
  getKnowledgeCmsArticleMigrationAuditDocumentId,
  parseKnowledgeCmsArticleMigrationAuditEvidence,
  type KnowledgeCmsArticleMigrationExecutionHistory,
  type KnowledgeCmsArticleMigrationPostCreateVerification,
} from "./knowledgeCmsArticleMigrationVerification";
import {
  assertKnowledgeCmsSupportingMigrationExecutionEnabled,
  buildKnowledgeCmsSupportingMigrationExecutionPlan,
  type KnowledgeCmsSupportingMigrationExecutionRequest,
} from "./knowledgeCmsSupportingMigrationExecution";
import {
  fingerprintKnowledgeCmsSupportingMigrationRecord,
  type KnowledgeCmsSupportingMigrationKind,
} from "./knowledgeCmsSupportingMigrationControl";
import {
  buildKnowledgeCmsSupportingMigrationExecutionHistory,
  buildKnowledgeCmsSupportingMigrationPostCreateVerification,
  getKnowledgeCmsSupportingMigrationAuditDocumentId,
  parseKnowledgeCmsSupportingMigrationAuditEvidence,
  type KnowledgeCmsSupportingMigrationExecutionHistory,
  type KnowledgeCmsSupportingMigrationPostCreateVerification,
} from "./knowledgeCmsSupportingMigrationVerification";
import {
  knowledgeCmsNativeRepresentationControls,
  type KnowledgeCmsNativeRepresentationArtifact,
} from "./knowledgeCmsNativeRepresentation";
import {
  KnowledgeCmsNativeRepresentationExecutionError,
  assertKnowledgeCmsNativeRepresentationExecutionEnabled,
  buildKnowledgeCmsNativeRepresentationExecutionPlan,
  getKnowledgeCmsNativeRepresentationAuditDocumentId,
  type KnowledgeCmsNativeRepresentationExecutionRequest,
} from "./knowledgeCmsNativeRepresentationExecution";
import type {
  KnowledgeCmsNativeRepresentationDocument,
} from "./knowledgeCmsShadowRenderer";

export type KnowledgeCmsAuditEvent =
  | "create"
  | "migration_create_private_draft"
  | "migration_create_private_supporting_draft"
  | "create_private_article_rendering"
  | "create_public_cutover_approval"
  | "start_revision"
  | "update"
  | "submit_for_review"
  | "approve"
  | "request_changes"
  | "publish"
  | "unpublish"
  | "archive"
  | "restore";

export interface KnowledgeCmsListQuery {
  kind: KnowledgeCmsRecordKind;
  statuses?: KnowledgeCmsStatus[];
}

export interface KnowledgeCmsSaveOptions {
  expectedRevision: number | null;
  event: KnowledgeCmsAuditEvent;
  actorId: string;
  note?: string;
}

export interface KnowledgeCmsRepository {
  get(
    kind: KnowledgeCmsRecordKind,
    id: string,
  ): Promise<KnowledgeCmsRecord | undefined>;
  list(query: KnowledgeCmsListQuery): Promise<KnowledgeCmsRecord[]>;
  save(
    record: KnowledgeCmsRecord,
    options: KnowledgeCmsSaveOptions,
  ): Promise<void>;
}

export interface KnowledgeCmsArticleMigrationRepository {
  createArticleMigrationDraft(
    actor: KnowledgeCmsActor,
    request: KnowledgeCmsArticleMigrationExecutionRequest,
  ): Promise<KnowledgeCmsArticle>;
  listArticleMigrationExecutions(
    actor: KnowledgeCmsActor,
  ): Promise<KnowledgeCmsArticleMigrationExecutionHistory>;
  verifyArticleMigrationExecution(
    actor: KnowledgeCmsActor,
    recordId: string,
  ): Promise<KnowledgeCmsArticleMigrationPostCreateVerification | undefined>;
}

export interface KnowledgeCmsSupportingMigrationRepository {
  createSupportingMigrationDraft(
    actor: KnowledgeCmsActor,
    request: KnowledgeCmsSupportingMigrationExecutionRequest,
  ): Promise<KnowledgeCmsTopic | KnowledgeCmsFaq>;
  listSupportingMigrationExecutions(
    actor: KnowledgeCmsActor,
  ): Promise<KnowledgeCmsSupportingMigrationExecutionHistory>;
  verifySupportingMigrationExecution(
    actor: KnowledgeCmsActor,
    kind: KnowledgeCmsSupportingMigrationKind,
    recordId: string,
  ): Promise<KnowledgeCmsSupportingMigrationPostCreateVerification | undefined>;
}

export interface KnowledgeCmsNativeRepresentationRepository {
  createArticleRendering(
    actor: KnowledgeCmsActor,
    request: KnowledgeCmsNativeRepresentationExecutionRequest,
  ): Promise<KnowledgeCmsNativeRepresentationArtifact>;
  listArticleRenderings(
    actor: KnowledgeCmsActor,
  ): Promise<KnowledgeCmsNativeRepresentationDocument[]>;
}

export class KnowledgeCmsDisabledError extends Error {
  readonly code = "knowledge_cms_disabled";

  constructor() {
    super(
      "The Knowledge CMS is disabled. Set KNOWLEDGE_CMS_ENABLED=true only after Firebase Auth, authorized domains, and explicit CMS roles are configured.",
    );
    this.name = "KnowledgeCmsDisabledError";
  }
}

export class KnowledgeCmsConflictError extends Error {
  readonly code = "knowledge_cms_conflict";

  constructor(message: string) {
    super(message);
    this.name = "KnowledgeCmsConflictError";
  }
}

export class KnowledgeCmsNotFoundError extends Error {
  readonly code = "knowledge_cms_not_found";

  constructor(kind: KnowledgeCmsRecordKind, id: string) {
    super(`Knowledge CMS ${kind} record "${id}" was not found.`);
    this.name = "KnowledgeCmsNotFoundError";
  }
}

export function isKnowledgeCmsEnabled(
  value: string | undefined = process.env.KNOWLEDGE_CMS_ENABLED,
): boolean {
  return value === "true";
}

export function assertKnowledgeCmsEnabled(
  value: string | undefined = process.env.KNOWLEDGE_CMS_ENABLED,
): void {
  if (!isKnowledgeCmsEnabled(value)) {
    throw new KnowledgeCmsDisabledError();
  }
}

function collectionForKind(kind: KnowledgeCmsRecordKind): string {
  return KNOWLEDGE_CMS_COLLECTIONS[kind];
}

function slugLockId(record: Pick<KnowledgeCmsRecord, "kind" | "slug">): string {
  return `${record.kind}--${record.slug}`;
}

function canonicalPathLockId(canonicalPath: string): string {
  return createHash("sha256").update(canonicalPath).digest("hex");
}

function searchDocumentId(
  record: Pick<KnowledgeCmsRecord, "kind" | "id">,
): string {
  return `${record.kind}--${record.id}`;
}

function auditDocumentId(
  record: Pick<KnowledgeCmsRecord, "kind" | "id" | "audit">,
): string {
  return `${record.kind}--${record.id}--${String(record.audit.revision).padStart(10, "0")}`;
}

function articleRevisionSnapshotDocumentId(
  articleId: string,
  sourceRevision: number,
): string {
  return `article--${articleId}--${String(sourceRevision).padStart(10, "0")}`;
}

function toFirestoreData(value: unknown): DocumentData {
  return JSON.parse(JSON.stringify(value)) as DocumentData;
}

function getExistingRevision(record: KnowledgeCmsRecord | undefined): number | null {
  return record?.audit.revision ?? null;
}

function assertExpectedRevision(
  current: KnowledgeCmsRecord | undefined,
  options: KnowledgeCmsSaveOptions,
): void {
  const actual = getExistingRevision(current);

  if (options.expectedRevision === null && actual !== null) {
    throw new KnowledgeCmsConflictError(
      `Knowledge CMS record already exists at revision ${actual}.`,
    );
  }

  if (
    options.expectedRevision !== null &&
    actual !== options.expectedRevision
  ) {
    throw new KnowledgeCmsConflictError(
      `Knowledge CMS revision changed (expected ${options.expectedRevision}, found ${actual ?? "missing"}).`,
    );
  }
}

function assertSequentialRevision(
  current: KnowledgeCmsRecord | undefined,
  next: KnowledgeCmsRecord,
): void {
  const expected = (current?.audit.revision ?? 0) + 1;
  if (next.audit.revision !== expected) {
    throw new KnowledgeCmsConflictError(
      `Knowledge CMS revision must advance to ${expected}.`,
    );
  }
}

function assertPublishedArticleRevisionStart(
  current: KnowledgeCmsRecord | undefined,
  next: KnowledgeCmsRecord,
): asserts current is KnowledgeCmsArticle {
  if (
    !current ||
    current.kind !== "article" ||
    current.status !== "published" ||
    next.kind !== "article" ||
    next.status !== "draft" ||
    !next.workingRevision ||
    next.workingRevision.sourceRevision !== current.audit.revision ||
    next.workingRevision.sourcePublishedAt !== current.publication?.publishedAt ||
    next.workingRevision.sourcePublishedBy !== current.publication?.publishedBy ||
    next.workingRevision.startedAt !== next.audit.updatedAt ||
    next.workingRevision.startedBy !== next.audit.updatedBy ||
    next.slug !== current.slug ||
    next.discoverability.canonicalPath !==
      current.discoverability.canonicalPath ||
    next.discoverability.indexing !== "blocked" ||
    next.review !== undefined ||
    next.publication !== undefined
  ) {
    throw new KnowledgeCmsConflictError(
      "A working revision must atomically replace one exact published article with an indexing-blocked draft on the same route.",
    );
  }
}

function assertWorkingRevisionContinuity(
  current: KnowledgeCmsRecord | undefined,
  next: KnowledgeCmsRecord,
  event: KnowledgeCmsAuditEvent,
): void {
  if (event === "start_revision") {
    assertPublishedArticleRevisionStart(current, next);
    return;
  }
  if (current?.kind !== "article" || next.kind !== "article") {
    if (next.kind === "article" && next.workingRevision) {
      throw new KnowledgeCmsConflictError(
        "Working-revision metadata may be created only by start_revision.",
      );
    }
    return;
  }
  if (
    next.workingRevision &&
    JSON.stringify(next.workingRevision) !==
      JSON.stringify(current.workingRevision)
  ) {
    throw new KnowledgeCmsConflictError(
      "Working-revision metadata is immutable after the revision starts.",
    );
  }
  if (
    current.workingRevision &&
    !next.workingRevision &&
    event !== "publish"
  ) {
    throw new KnowledgeCmsConflictError(
      "Only publication may close a working revision.",
    );
  }
}

function parseSnapshotData(
  exists: boolean,
  data: (() => DocumentData | undefined) | undefined,
): KnowledgeCmsRecord | undefined {
  if (!exists || !data) {
    return undefined;
  }

  const value = data();
  return value ? parseKnowledgeCmsRecord(value) : undefined;
}

function assertSlugAvailable(
  lockData: DocumentData | undefined,
  record: KnowledgeCmsRecord,
): void {
  if (
    lockData &&
    (lockData.recordId !== record.id || lockData.kind !== record.kind)
  ) {
    throw new KnowledgeCmsConflictError(
      `Slug "${record.slug}" is already assigned to another ${record.kind} record.`,
    );
  }
}

function assertCanonicalPathAvailable(
  lockData: DocumentData | undefined,
  record: KnowledgeCmsRecord,
): void {
  const canonicalPath = record.discoverability.canonicalPath;
  if (
    canonicalPath &&
    lockData &&
    (lockData.recordId !== record.id || lockData.kind !== record.kind)
  ) {
    throw new KnowledgeCmsConflictError(
      `Canonical path "${canonicalPath}" is already assigned to another Knowledge CMS record.`,
    );
  }
}

const knowledgeCmsRecordKinds: KnowledgeCmsRecordKind[] = [
  "article",
  "topic",
  "faq",
];

async function queryRecordsByField(
  transaction: Transaction,
  db: Firestore,
  kinds: ReadonlyArray<KnowledgeCmsRecordKind>,
  fieldPath: string,
  value: string,
): Promise<KnowledgeCmsRecord[]> {
  const records: KnowledgeCmsRecord[] = [];
  for (const kind of kinds) {
    const snapshot = await transaction.get(
      db.collection(collectionForKind(kind)).where(fieldPath, "==", value),
    );
    for (const document of snapshot.docs) {
      const record = parseSnapshotData(
        document.exists,
        () => document.data(),
      );
      if (record) {
        records.push(record);
      }
    }
  }
  return records;
}

function assertOnlyExpectedOwner(
  records: ReadonlyArray<KnowledgeCmsRecord>,
  nextRecord: KnowledgeCmsRecord,
  fieldLabel: "slug" | "canonical path",
): void {
  const conflicting = records.find(
    (record) =>
      record.kind !== nextRecord.kind || record.id !== nextRecord.id,
  );
  if (conflicting) {
    throw new KnowledgeCmsConflictError(
      `Knowledge CMS ${fieldLabel} is already owned by ${conflicting.kind} "${conflicting.id}".`,
    );
  }
}

function writeSearchProjection(
  transaction: Transaction,
  searchRef: DocumentReference,
  record: KnowledgeCmsRecord,
): void {
  const searchDocument = buildKnowledgeCmsSearchDocument(record);
  if (searchDocument) {
    transaction.set(searchRef, toFirestoreData(searchDocument));
  } else {
    transaction.delete(searchRef);
  }
}

export interface FirestoreKnowledgeCmsRepositoryOptions {
  db?: Firestore;
  now?: () => Date;
}

export class FirestoreKnowledgeCmsRepository
  implements
    KnowledgeCmsRepository,
    KnowledgeCmsArticleMigrationRepository,
    KnowledgeCmsSupportingMigrationRepository,
    KnowledgeCmsNativeRepresentationRepository
{
  private readonly db: Firestore;
  private readonly now: () => Date;

  constructor(options: FirestoreKnowledgeCmsRepositoryOptions = {}) {
    assertKnowledgeCmsEnabled();
    this.db = options.db ?? getFirestoreAdmin();
    this.now = options.now ?? (() => new Date());
  }

  async get(
    kind: KnowledgeCmsRecordKind,
    id: string,
  ): Promise<KnowledgeCmsRecord | undefined> {
    const snapshot = await this.db.collection(collectionForKind(kind)).doc(id).get();
    const record = parseSnapshotData(snapshot.exists, () => snapshot.data());
    if (record && record.kind !== kind) {
      throw new KnowledgeCmsConflictError(
        `Stored record kind "${record.kind}" does not match collection "${kind}".`,
      );
    }
    return record ? cloneKnowledgeCmsRecord(record) : undefined;
  }

  async list(query: KnowledgeCmsListQuery): Promise<KnowledgeCmsRecord[]> {
    const snapshot = await this.db
      .collection(collectionForKind(query.kind))
      .get();
    const statuses = query.statuses ? new Set(query.statuses) : undefined;

    return snapshot.docs
      .map((document) =>
        parseSnapshotData(document.exists, () => document.data()),
      )
      .filter(
        (record): record is KnowledgeCmsRecord =>
          Boolean(
            record &&
              record.kind === query.kind &&
              (!statuses || statuses.has(record.status)),
          ),
      )
      .sort((left, right) =>
        right.audit.updatedAt.localeCompare(left.audit.updatedAt),
      )
      .map(cloneKnowledgeCmsRecord);
  }

  async save(
    record: KnowledgeCmsRecord,
    options: KnowledgeCmsSaveOptions,
  ): Promise<void> {
    const nextRecord = parseKnowledgeCmsRecord(record);
    if (nextRecord.audit.updatedBy !== options.actorId) {
      throw new KnowledgeCmsConflictError(
        "The audit actor must match the record's updatedBy value.",
      );
    }
    if ((options.expectedRevision === null) !== (options.event === "create")) {
      throw new KnowledgeCmsConflictError(
        "Only a create event may write a new Knowledge CMS record.",
      );
    }
    const auditNote = options.note?.trim();
    if (auditNote && auditNote.length > 2_000) {
      throw new KnowledgeCmsConflictError(
        "Knowledge CMS audit notes cannot exceed 2,000 characters.",
      );
    }

    const collection = this.db.collection(collectionForKind(nextRecord.kind));
    const recordRef = collection.doc(nextRecord.id);
    const nextSlugRef = this.db
      .collection(KNOWLEDGE_CMS_COLLECTIONS.slugs)
      .doc(slugLockId(nextRecord));
    const searchRef = this.db
      .collection(KNOWLEDGE_CMS_COLLECTIONS.search)
      .doc(searchDocumentId(nextRecord));
    const auditRef = this.db
      .collection(KNOWLEDGE_CMS_COLLECTIONS.audit)
      .doc(auditDocumentId(nextRecord));
    const revisionSnapshotId =
      options.event === "start_revision" &&
      nextRecord.kind === "article" &&
      options.expectedRevision !== null
        ? articleRevisionSnapshotDocumentId(
            nextRecord.id,
            options.expectedRevision,
          )
        : undefined;
    const revisionSnapshotRef = revisionSnapshotId
      ? this.db
          .collection(KNOWLEDGE_CMS_COLLECTIONS.articleRevisionSnapshots)
          .doc(revisionSnapshotId)
      : undefined;

    await this.db.runTransaction(async (transaction) => {
      const currentSnapshot = await transaction.get(recordRef);
      const current = parseSnapshotData(
        currentSnapshot.exists,
        () => currentSnapshot.data(),
      );
      assertExpectedRevision(current, options);
      assertSequentialRevision(current, nextRecord);
      assertWorkingRevisionContinuity(current, nextRecord, options.event);
      const revisionSnapshot = revisionSnapshotRef
        ? await transaction.get(revisionSnapshotRef)
        : undefined;
      if (revisionSnapshot?.exists) {
        throw new KnowledgeCmsConflictError(
          "The immutable published-article revision snapshot already exists.",
        );
      }

      const nextSlugSnapshot = await transaction.get(nextSlugRef);
      if (options.expectedRevision === null && nextSlugSnapshot.exists) {
        throw new KnowledgeCmsConflictError(
          `Slug "${nextRecord.slug}" already has a lock and cannot be used for a new record.`,
        );
      }
      assertSlugAvailable(nextSlugSnapshot.data(), nextRecord);
      const slugOwners = await queryRecordsByField(
        transaction,
        this.db,
        [nextRecord.kind],
        "slug",
        nextRecord.slug,
      );
      assertOnlyExpectedOwner(slugOwners, nextRecord, "slug");

      const nextCanonicalPath =
        nextRecord.discoverability.canonicalPath;
      const nextCanonicalRef = nextCanonicalPath
        ? this.db
            .collection(KNOWLEDGE_CMS_COLLECTIONS.canonicalPaths)
            .doc(canonicalPathLockId(nextCanonicalPath))
        : undefined;
      const nextCanonicalSnapshot = nextCanonicalRef
        ? await transaction.get(nextCanonicalRef)
        : undefined;
      if (
        options.expectedRevision === null &&
        nextCanonicalSnapshot?.exists
      ) {
        throw new KnowledgeCmsConflictError(
          `Canonical path "${nextCanonicalPath}" already has a lock and cannot be used for a new record.`,
        );
      }
      assertCanonicalPathAvailable(
        nextCanonicalSnapshot?.data(),
        nextRecord,
      );
      const canonicalOwners = nextCanonicalPath
        ? await queryRecordsByField(
            transaction,
            this.db,
            knowledgeCmsRecordKinds,
            "discoverability.canonicalPath",
            nextCanonicalPath,
          )
        : [];
      assertOnlyExpectedOwner(
        canonicalOwners,
        nextRecord,
        "canonical path",
      );

      const priorSlugRef =
        current && current.slug !== nextRecord.slug
          ? this.db
              .collection(KNOWLEDGE_CMS_COLLECTIONS.slugs)
              .doc(slugLockId(current))
          : undefined;
      const priorSlugSnapshot = priorSlugRef
        ? await transaction.get(priorSlugRef)
        : undefined;
      const priorCanonicalPath =
        current?.discoverability.canonicalPath;
      const priorCanonicalRef =
        priorCanonicalPath && priorCanonicalPath !== nextCanonicalPath
          ? this.db
              .collection(KNOWLEDGE_CMS_COLLECTIONS.canonicalPaths)
              .doc(canonicalPathLockId(priorCanonicalPath))
          : undefined;
      const priorCanonicalSnapshot = priorCanonicalRef
        ? await transaction.get(priorCanonicalRef)
        : undefined;

      transaction.set(recordRef, toFirestoreData(nextRecord));
      if (
        revisionSnapshotRef &&
        revisionSnapshotId &&
        current?.kind === "article" &&
        nextRecord.kind === "article" &&
        nextRecord.workingRevision
      ) {
        const snapshot: KnowledgeCmsArticleRevisionSnapshot = {
          schemaVersion:
            KNOWLEDGE_CMS_ARTICLE_REVISION_SNAPSHOT_SCHEMA_VERSION,
          id: revisionSnapshotId,
          articleId: current.id,
          sourceRevision: current.audit.revision,
          sourceStatus: "published",
          sourceAiRunId: nextRecord.workingRevision.sourceAiRunId,
          createdAt: nextRecord.audit.updatedAt,
          createdBy: options.actorId,
          record: cloneKnowledgeCmsRecord(current) as KnowledgeCmsArticle,
        };
        transaction.set(revisionSnapshotRef, toFirestoreData(snapshot));
      }
      transaction.set(nextSlugRef, {
        kind: nextRecord.kind,
        recordId: nextRecord.id,
        slug: nextRecord.slug,
        updatedAt: nextRecord.audit.updatedAt,
      });
      if (nextCanonicalRef && nextCanonicalPath) {
        transaction.set(nextCanonicalRef, {
          canonicalPath: nextCanonicalPath,
          kind: nextRecord.kind,
          recordId: nextRecord.id,
          updatedAt: nextRecord.audit.updatedAt,
        });
      }

      if (
        priorSlugRef &&
        priorSlugSnapshot?.data()?.recordId === nextRecord.id
      ) {
        transaction.delete(priorSlugRef);
      }
      if (
        priorCanonicalRef &&
        priorCanonicalSnapshot?.data()?.recordId === nextRecord.id &&
        priorCanonicalSnapshot.data()?.kind === nextRecord.kind
      ) {
        transaction.delete(priorCanonicalRef);
      }

      writeSearchProjection(transaction, searchRef, nextRecord);
      transaction.set(auditRef, {
        event: options.event,
        actorId: options.actorId,
        kind: nextRecord.kind,
        recordId: nextRecord.id,
        revision: nextRecord.audit.revision,
        status: nextRecord.status,
        slug: nextRecord.slug,
        occurredAt: nextRecord.audit.updatedAt,
        ...(auditNote ? { note: auditNote } : {}),
      });
    });
  }

  async createArticleMigrationDraft(
    actor: KnowledgeCmsActor,
    request: KnowledgeCmsArticleMigrationExecutionRequest,
  ): Promise<KnowledgeCmsArticle> {
    assertKnowledgeCmsArticleMigrationExecutionEnabled();

    return this.db.runTransaction(async (transaction) => {
      const plan = buildKnowledgeCmsArticleMigrationExecutionPlan({
        actor,
        request,
        now: this.now(),
      });
      const record = plan.record;
      const recordRef = this.db
        .collection(KNOWLEDGE_CMS_COLLECTIONS.article)
        .doc(record.id);
      const slugRef = this.db
        .collection(KNOWLEDGE_CMS_COLLECTIONS.slugs)
        .doc(slugLockId(record));
      const canonicalRef = this.db
        .collection(KNOWLEDGE_CMS_COLLECTIONS.canonicalPaths)
        .doc(canonicalPathLockId(plan.target.canonicalPath));
      const searchRef = this.db
        .collection(KNOWLEDGE_CMS_COLLECTIONS.search)
        .doc(searchDocumentId(record));
      const auditRef = this.db
        .collection(KNOWLEDGE_CMS_COLLECTIONS.audit)
        .doc(auditDocumentId(record));

      const currentSnapshot = await transaction.get(recordRef);
      const slugSnapshot = await transaction.get(slugRef);
      const canonicalSnapshot = await transaction.get(canonicalRef);
      const searchSnapshot = await transaction.get(searchRef);
      const auditSnapshot = await transaction.get(auditRef);
      const slugOwners = await queryRecordsByField(
        transaction,
        this.db,
        ["article"],
        "slug",
        record.slug,
      );
      const canonicalOwners = await queryRecordsByField(
        transaction,
        this.db,
        knowledgeCmsRecordKinds,
        "discoverability.canonicalPath",
        plan.target.canonicalPath,
      );

      if (currentSnapshot.exists) {
        const current = parseSnapshotData(
          currentSnapshot.exists,
          () => currentSnapshot.data(),
        );
        throw new KnowledgeCmsConflictError(
          `Article migration target already exists at revision ${current?.audit.revision ?? "unknown"}.`,
        );
      }
      if (slugSnapshot.exists || slugOwners.length > 0) {
        throw new KnowledgeCmsConflictError(
          `Article migration slug "${record.slug}" is no longer available.`,
        );
      }
      if (canonicalSnapshot.exists || canonicalOwners.length > 0) {
        throw new KnowledgeCmsConflictError(
          `Article migration canonical path "${plan.target.canonicalPath}" is no longer available.`,
        );
      }
      if (searchSnapshot.exists) {
        throw new KnowledgeCmsConflictError(
          "An unexpected private search projection already exists for the migration target.",
        );
      }
      if (auditSnapshot.exists) {
        throw new KnowledgeCmsConflictError(
          "An unexpected revision-one audit event already exists for the migration target.",
        );
      }

      transaction.set(recordRef, toFirestoreData(record));
      transaction.set(slugRef, {
        kind: record.kind,
        recordId: record.id,
        slug: record.slug,
        updatedAt: plan.transaction.serverTimestamp,
      });
      transaction.set(canonicalRef, {
        canonicalPath: plan.target.canonicalPath,
        kind: record.kind,
        recordId: record.id,
        updatedAt: plan.transaction.serverTimestamp,
      });
      transaction.set(auditRef, {
        event: "migration_create_private_draft",
        actorId: actor.id,
        kind: record.kind,
        recordId: record.id,
        revision: record.audit.revision,
        status: record.status,
        slug: record.slug,
        occurredAt: plan.transaction.serverTimestamp,
        migrationControlId: plan.control.id,
        migrationControlFingerprint: plan.control.fingerprint,
        migrationExecutionVersion: plan.version,
        migrationWriteCount: plan.transaction.writeCount,
        migrationRecordFingerprint:
          fingerprintKnowledgeCmsArticleMigrationRecord(record),
        canonicalPath: plan.target.canonicalPath,
        publicSource: plan.rollout.publicSource,
        note:
          "Created one private, indexing-blocked draft from the deterministic Resource Library migration control. The verified static route remains public.",
      });

      return cloneKnowledgeCmsRecord(record) as KnowledgeCmsArticle;
    });
  }

  async listArticleMigrationExecutions(
    actor: KnowledgeCmsActor,
  ): Promise<KnowledgeCmsArticleMigrationExecutionHistory> {
    assertKnowledgeCmsActionAllowed(actor, "preview_migration");
    const snapshot = await this.db
      .collection(KNOWLEDGE_CMS_COLLECTIONS.audit)
      .where("event", "==", "migration_create_private_draft")
      .get();
    return buildKnowledgeCmsArticleMigrationExecutionHistory(
      snapshot.docs.map((document) => ({
        id: document.id,
        data: document.data(),
      })),
    );
  }

  async verifyArticleMigrationExecution(
    actor: KnowledgeCmsActor,
    recordId: string,
  ): Promise<KnowledgeCmsArticleMigrationPostCreateVerification | undefined> {
    assertKnowledgeCmsActionAllowed(actor, "preview_migration");
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(recordId)) {
      return undefined;
    }

    const auditDocumentId =
      getKnowledgeCmsArticleMigrationAuditDocumentId(recordId);
    const auditRef = this.db
      .collection(KNOWLEDGE_CMS_COLLECTIONS.audit)
      .doc(auditDocumentId);
    const recordRef = this.db
      .collection(KNOWLEDGE_CMS_COLLECTIONS.article)
      .doc(recordId);

    return this.db.runTransaction(async (transaction) => {
      const auditSnapshot = await transaction.get(auditRef);
      if (!auditSnapshot.exists) {
        return undefined;
      }
      const auditData = auditSnapshot.data();
      if (auditData?.event !== "migration_create_private_draft") {
        return undefined;
      }

      const recordSnapshot = await transaction.get(recordRef);
      const recordData = recordSnapshot.data();
      let record: KnowledgeCmsArticle | undefined;
      try {
        const parsed = recordData
          ? parseKnowledgeCmsRecord(recordData)
          : undefined;
        record = parsed?.kind === "article" ? parsed : undefined;
      } catch {
        record = undefined;
      }
      const evidence =
        parseKnowledgeCmsArticleMigrationAuditEvidence(
          auditDocumentId,
          auditData,
        );
      const fallbackKey = createHash("sha256")
        .update(recordId)
        .digest("hex");
      const slug = record?.slug ?? evidence?.slug ?? fallbackKey;
      const canonicalPath =
        record?.discoverability.canonicalPath ??
        evidence?.canonicalPath ??
        `/invalid-${fallbackKey}`;
      const slugRef = this.db
        .collection(KNOWLEDGE_CMS_COLLECTIONS.slugs)
        .doc(`article--${slug}`);
      const canonicalRef = this.db
        .collection(KNOWLEDGE_CMS_COLLECTIONS.canonicalPaths)
        .doc(canonicalPathLockId(canonicalPath));
      const searchRef = this.db
        .collection(KNOWLEDGE_CMS_COLLECTIONS.search)
        .doc(`article--${recordId}`);
      const slugSnapshot = await transaction.get(slugRef);
      const canonicalSnapshot = await transaction.get(canonicalRef);
      const searchSnapshot = await transaction.get(searchRef);

      return buildKnowledgeCmsArticleMigrationPostCreateVerification({
        auditDocumentId,
        auditData,
        recordData,
        slugLockData: slugSnapshot.exists
          ? slugSnapshot.data()
          : undefined,
        canonicalLockData: canonicalSnapshot.exists
          ? canonicalSnapshot.data()
          : undefined,
        searchData: searchSnapshot.exists
          ? searchSnapshot.data()
          : undefined,
        observedAt: this.now(),
      });
    });
  }

  async createSupportingMigrationDraft(
    actor: KnowledgeCmsActor,
    request: KnowledgeCmsSupportingMigrationExecutionRequest,
  ): Promise<KnowledgeCmsTopic | KnowledgeCmsFaq> {
    assertKnowledgeCmsSupportingMigrationExecutionEnabled();

    return this.db.runTransaction(async (transaction) => {
      const plan = buildKnowledgeCmsSupportingMigrationExecutionPlan({
        actor,
        request,
        now: this.now(),
      });
      const record = plan.record;
      const recordRef = this.db
        .collection(collectionForKind(record.kind))
        .doc(record.id);
      const slugRef = this.db
        .collection(KNOWLEDGE_CMS_COLLECTIONS.slugs)
        .doc(slugLockId(record));
      const canonicalPath = record.discoverability.canonicalPath;
      const canonicalRef = canonicalPath
        ? this.db
            .collection(KNOWLEDGE_CMS_COLLECTIONS.canonicalPaths)
            .doc(canonicalPathLockId(canonicalPath))
        : undefined;
      const searchRef = this.db
        .collection(KNOWLEDGE_CMS_COLLECTIONS.search)
        .doc(searchDocumentId(record));
      const auditRef = this.db
        .collection(KNOWLEDGE_CMS_COLLECTIONS.audit)
        .doc(auditDocumentId(record));

      const currentSnapshot = await transaction.get(recordRef);
      const slugSnapshot = await transaction.get(slugRef);
      const canonicalSnapshot = canonicalRef
        ? await transaction.get(canonicalRef)
        : undefined;
      const searchSnapshot = await transaction.get(searchRef);
      const auditSnapshot = await transaction.get(auditRef);
      const slugOwners = await queryRecordsByField(
        transaction,
        this.db,
        [record.kind],
        "slug",
        record.slug,
      );
      const canonicalOwners = canonicalPath
        ? await queryRecordsByField(
            transaction,
            this.db,
            knowledgeCmsRecordKinds,
            "discoverability.canonicalPath",
            canonicalPath,
          )
        : [];

      if (currentSnapshot.exists) {
        throw new KnowledgeCmsConflictError(
          `${record.kind} migration target already exists and cannot be overwritten.`,
        );
      }
      if (slugSnapshot.exists || slugOwners.length > 0) {
        throw new KnowledgeCmsConflictError(
          `${record.kind} migration slug "${record.slug}" is no longer available.`,
        );
      }
      if (
        (canonicalSnapshot?.exists ?? false) ||
        canonicalOwners.length > 0
      ) {
        throw new KnowledgeCmsConflictError(
          `${record.kind} migration canonical path "${canonicalPath}" is no longer available.`,
        );
      }
      if (searchSnapshot.exists) {
        throw new KnowledgeCmsConflictError(
          "An unexpected search projection already exists for the private migration target.",
        );
      }
      if (auditSnapshot.exists) {
        throw new KnowledgeCmsConflictError(
          "An unexpected revision-one audit event already exists for the migration target.",
        );
      }

      transaction.set(recordRef, toFirestoreData(record));
      transaction.set(slugRef, {
        kind: record.kind,
        recordId: record.id,
        slug: record.slug,
        updatedAt: plan.transaction.serverTimestamp,
      });
      if (canonicalRef && canonicalPath) {
        transaction.set(canonicalRef, {
          canonicalPath,
          kind: record.kind,
          recordId: record.id,
          updatedAt: plan.transaction.serverTimestamp,
        });
      }
      transaction.set(auditRef, {
        event: "migration_create_private_supporting_draft",
        actorId: actor.id,
        kind: record.kind,
        recordId: record.id,
        revision: 1,
        status: "draft",
        slug: record.slug,
        occurredAt: plan.transaction.serverTimestamp,
        migrationControlId: plan.control.id,
        migrationControlFingerprint: plan.control.fingerprint,
        migrationExecutionVersion: plan.version,
        migrationWriteCount: plan.transaction.writeCount,
        migrationRecordFingerprint:
          fingerprintKnowledgeCmsSupportingMigrationRecord(record),
        ...(canonicalPath ? { canonicalPath } : {}),
        publicSource: plan.rollout.publicSource,
        note:
          "Created one private, indexing-blocked topic or FAQ draft from a deterministic governed-static control. No public experience changed.",
      });

      return cloneKnowledgeCmsRecord(record) as
        | KnowledgeCmsTopic
        | KnowledgeCmsFaq;
    });
  }

  async listSupportingMigrationExecutions(
    actor: KnowledgeCmsActor,
  ): Promise<KnowledgeCmsSupportingMigrationExecutionHistory> {
    assertKnowledgeCmsActionAllowed(actor, "preview_migration");
    const snapshot = await this.db
      .collection(KNOWLEDGE_CMS_COLLECTIONS.audit)
      .where("event", "==", "migration_create_private_supporting_draft")
      .get();
    return buildKnowledgeCmsSupportingMigrationExecutionHistory(
      snapshot.docs.map((document) => ({
        id: document.id,
        data: document.data(),
      })),
    );
  }

  async verifySupportingMigrationExecution(
    actor: KnowledgeCmsActor,
    kind: KnowledgeCmsSupportingMigrationKind,
    recordId: string,
  ): Promise<KnowledgeCmsSupportingMigrationPostCreateVerification | undefined> {
    assertKnowledgeCmsActionAllowed(actor, "preview_migration");
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(recordId)) {
      return undefined;
    }
    const auditDocumentId =
      getKnowledgeCmsSupportingMigrationAuditDocumentId(kind, recordId);
    const auditRef = this.db
      .collection(KNOWLEDGE_CMS_COLLECTIONS.audit)
      .doc(auditDocumentId);
    const recordRef = this.db.collection(collectionForKind(kind)).doc(recordId);

    return this.db.runTransaction(async (transaction) => {
      const auditSnapshot = await transaction.get(auditRef);
      if (!auditSnapshot.exists) {
        return undefined;
      }
      const auditData = auditSnapshot.data();
      if (auditData?.event !== "migration_create_private_supporting_draft") {
        return undefined;
      }
      const recordSnapshot = await transaction.get(recordRef);
      const recordData = recordSnapshot.data();
      let record: KnowledgeCmsRecord | undefined;
      try {
        record = recordData ? parseKnowledgeCmsRecord(recordData) : undefined;
      } catch {
        record = undefined;
      }
      const evidence = parseKnowledgeCmsSupportingMigrationAuditEvidence(
        auditDocumentId,
        auditData,
      );
      const fallbackKey = createHash("sha256").update(recordId).digest("hex");
      const slug = record?.slug ?? evidence?.slug ?? fallbackKey;
      const canonicalPath =
        record?.discoverability.canonicalPath ?? evidence?.canonicalPath;
      const slugRef = this.db
        .collection(KNOWLEDGE_CMS_COLLECTIONS.slugs)
        .doc(`${kind}--${slug}`);
      const canonicalRef = canonicalPath
        ? this.db
            .collection(KNOWLEDGE_CMS_COLLECTIONS.canonicalPaths)
            .doc(canonicalPathLockId(canonicalPath))
        : undefined;
      const searchRef = this.db
        .collection(KNOWLEDGE_CMS_COLLECTIONS.search)
        .doc(`${kind}--${recordId}`);
      const slugSnapshot = await transaction.get(slugRef);
      const canonicalSnapshot = canonicalRef
        ? await transaction.get(canonicalRef)
        : undefined;
      const searchSnapshot = await transaction.get(searchRef);

      return buildKnowledgeCmsSupportingMigrationPostCreateVerification({
        kind,
        auditDocumentId,
        auditData,
        recordData,
        slugLockData: slugSnapshot.exists
          ? slugSnapshot.data()
          : undefined,
        ...(canonicalSnapshot?.exists
          ? { canonicalLockData: canonicalSnapshot.data() }
          : {}),
        searchData: searchSnapshot.exists
          ? searchSnapshot.data()
          : undefined,
        observedAt: this.now(),
      });
    });
  }

  async createArticleRendering(
    actor: KnowledgeCmsActor,
    request: KnowledgeCmsNativeRepresentationExecutionRequest,
  ): Promise<KnowledgeCmsNativeRepresentationArtifact> {
    assertKnowledgeCmsNativeRepresentationExecutionEnabled();
    assertKnowledgeCmsActionAllowed(actor, "execute_article_rendering");
    const control = knowledgeCmsNativeRepresentationControls.find(
      (candidate) => candidate.controlId === request.controlId,
    );
    if (!control) {
      throw new KnowledgeCmsNativeRepresentationExecutionError(
        "control_not_found",
        "The requested CMS-native rendering control was not found.",
      );
    }
    const articleRef = this.db
      .collection(KNOWLEDGE_CMS_COLLECTIONS.article)
      .doc(control.target.articleId);

    return this.db.runTransaction(async (transaction) => {
      const articleSnapshot = await transaction.get(articleRef);
      const record = parseSnapshotData(
        articleSnapshot.exists,
        () => articleSnapshot.data(),
      );
      if (!record || record.kind !== "article") {
        throw new KnowledgeCmsNativeRepresentationExecutionError(
          "article_not_eligible",
          "The matching published article does not exist.",
        );
      }
      const plan = buildKnowledgeCmsNativeRepresentationExecutionPlan({
        actor,
        request,
        article: record,
        now: this.now(),
      });
      const representationRef = this.db
        .collection(KNOWLEDGE_CMS_COLLECTIONS.articleRenderings)
        .doc(plan.target.id);
      const auditRef = this.db
        .collection(KNOWLEDGE_CMS_COLLECTIONS.audit)
        .doc(
          getKnowledgeCmsNativeRepresentationAuditDocumentId(
            plan.target.id,
          ),
        );
      const representationSnapshot = await transaction.get(
        representationRef,
      );
      const auditSnapshot = await transaction.get(auditRef);
      if (representationSnapshot.exists) {
        throw new KnowledgeCmsConflictError(
          "The CMS-native rendering artifact already exists and cannot be overwritten.",
        );
      }
      if (auditSnapshot.exists) {
        throw new KnowledgeCmsConflictError(
          "The CMS-native rendering audit event already exists.",
        );
      }
      transaction.set(
        representationRef,
        toFirestoreData(plan.artifact),
      );
      transaction.set(auditRef, {
        event: "create_private_article_rendering",
        actorId: actor.id,
        kind: "article",
        recordId: record.id,
        revision: record.audit.revision,
        status: record.status,
        occurredAt: plan.transaction.serverTimestamp,
        representationId: plan.artifact.id,
        representationFingerprint: plan.artifact.fingerprint.value,
        renderingControlId: plan.control.id,
        renderingControlFingerprint: plan.control.fingerprint,
        renderingExecutionVersion: plan.version,
        renderingWriteCount: plan.transaction.writeCount,
        renderedBodySha256: plan.artifact.body.renderedBodySha256,
        publicSource: plan.rollout.publicSource,
        note:
          "Created one immutable private-shadow rendering artifact for a matching published article. Public routes remain static.",
      });
      return plan.artifact;
    });
  }

  async listArticleRenderings(
    actor: KnowledgeCmsActor,
  ): Promise<KnowledgeCmsNativeRepresentationDocument[]> {
    assertKnowledgeCmsActionAllowed(actor, "preview_shadow_rendering");
    const snapshot = await this.db
      .collection(KNOWLEDGE_CMS_COLLECTIONS.articleRenderings)
      .get();
    return snapshot.docs.map((document) => ({
      id: document.id,
      data: document.data(),
    }));
  }
}

export function createKnowledgeCmsRepository(
  options: FirestoreKnowledgeCmsRepositoryOptions = {},
): KnowledgeCmsRepository &
  KnowledgeCmsArticleMigrationRepository &
  KnowledgeCmsSupportingMigrationRepository &
  KnowledgeCmsNativeRepresentationRepository {
  return new FirestoreKnowledgeCmsRepository(options);
}
