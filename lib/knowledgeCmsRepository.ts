import "server-only";

import type {
  DocumentData,
  DocumentReference,
  Firestore,
  Transaction,
} from "firebase-admin/firestore";
import { getFirestoreAdmin } from "./firebase-admin";
import {
  KNOWLEDGE_CMS_COLLECTIONS,
  buildKnowledgeCmsSearchDocument,
  cloneKnowledgeCmsRecord,
  parseKnowledgeCmsRecord,
  type KnowledgeCmsRecord,
  type KnowledgeCmsRecordKind,
  type KnowledgeCmsStatus,
} from "./knowledgeCms";

export type KnowledgeCmsAuditEvent =
  | "create"
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

export class KnowledgeCmsDisabledError extends Error {
  readonly code = "knowledge_cms_disabled";

  constructor() {
    super(
      "The Knowledge CMS is disabled. Set KNOWLEDGE_CMS_ENABLED=true only after the authenticated admin surface is ready.",
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
  return value?.trim() === "true";
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
}

export class FirestoreKnowledgeCmsRepository
  implements KnowledgeCmsRepository
{
  private readonly db: Firestore;

  constructor(options: FirestoreKnowledgeCmsRepositoryOptions = {}) {
    assertKnowledgeCmsEnabled();
    this.db = options.db ?? getFirestoreAdmin();
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

    await this.db.runTransaction(async (transaction) => {
      const currentSnapshot = await transaction.get(recordRef);
      const current = parseSnapshotData(
        currentSnapshot.exists,
        () => currentSnapshot.data(),
      );
      assertExpectedRevision(current, options);
      assertSequentialRevision(current, nextRecord);

      const nextSlugSnapshot = await transaction.get(nextSlugRef);
      assertSlugAvailable(nextSlugSnapshot.data(), nextRecord);

      const priorSlugRef =
        current && current.slug !== nextRecord.slug
          ? this.db
              .collection(KNOWLEDGE_CMS_COLLECTIONS.slugs)
              .doc(slugLockId(current))
          : undefined;
      const priorSlugSnapshot = priorSlugRef
        ? await transaction.get(priorSlugRef)
        : undefined;

      transaction.set(recordRef, toFirestoreData(nextRecord));
      transaction.set(nextSlugRef, {
        kind: nextRecord.kind,
        recordId: nextRecord.id,
        slug: nextRecord.slug,
        updatedAt: nextRecord.audit.updatedAt,
      });

      if (
        priorSlugRef &&
        priorSlugSnapshot?.data()?.recordId === nextRecord.id
      ) {
        transaction.delete(priorSlugRef);
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
}

export function createKnowledgeCmsRepository(
  options: FirestoreKnowledgeCmsRepositoryOptions = {},
): KnowledgeCmsRepository {
  return new FirestoreKnowledgeCmsRepository(options);
}
