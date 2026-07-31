import {
  getKnowledgeCmsAuthorizationDecision,
  type KnowledgeCmsCreateInput,
  type KnowledgeCmsActor,
  type KnowledgeCmsDiscoverability,
  type KnowledgeCmsRecord,
  type KnowledgeCmsRecordKind,
  type KnowledgeCmsSource,
  type KnowledgeCmsUpdateInput,
} from "./knowledgeCms";
import type {
  KnowledgeCmsArticleMigrationExecutionRequest,
} from "./knowledgeCmsArticleMigrationExecution";
import type {
  KnowledgeCmsSupportingMigrationExecutionRequest,
} from "./knowledgeCmsSupportingMigrationExecution";

export const KNOWLEDGE_CMS_ADMIN_PATH = "/admin/knowledge";
export const KNOWLEDGE_CMS_RECORD_KINDS: KnowledgeCmsRecordKind[] = [
  "article",
  "topic",
  "faq",
];

export interface KnowledgeCmsAdminRecordSummaryDto {
  id: string;
  kind: KnowledgeCmsRecordKind;
  slug: string;
  status: KnowledgeCmsRecord["status"];
  title: string;
  updatedAt: string;
  revision: number;
  editable: boolean;
  ownedByCurrentUser: boolean;
}

export interface KnowledgeCmsAdminChangeRequestDto {
  feedback: string;
  requestedAt: string;
}

export interface KnowledgeCmsAdminReviewDto {
  reviewerAgentSlug: string;
  reviewedAt: string;
  reviewDueAt: string;
  decisionNote?: string;
}

export interface KnowledgeCmsAdminWorkflowActionsDto {
  approve: boolean;
  publish: boolean;
  submitForReview: boolean;
  requestChanges: boolean;
  unpublish: boolean;
}

type KnowledgeCmsAdminRecordDtoFor<
  RecordType extends KnowledgeCmsRecord,
> = RecordType extends KnowledgeCmsRecord
  ? Omit<
      RecordType,
      "ownerId" | "audit" | "changeRequest" | "review" | "publication"
    > & {
      changeRequest?: KnowledgeCmsAdminChangeRequestDto;
      editable: boolean;
      ownedByCurrentUser: boolean;
      review?: KnowledgeCmsAdminReviewDto;
      revision: number;
      createdAt: string;
      updatedAt: string;
      workflowActions: KnowledgeCmsAdminWorkflowActionsDto;
    }
  : never;

export type KnowledgeCmsAdminRecordDto =
  KnowledgeCmsAdminRecordDtoFor<KnowledgeCmsRecord>;

export interface KnowledgeCmsAdminActionState {
  ok: boolean;
  message: string;
  errors?: string[];
  revision?: number;
  conflict?: boolean;
}

export const initialKnowledgeCmsAdminActionState: KnowledgeCmsAdminActionState =
  {
    ok: false,
    message: "",
  };

export class KnowledgeCmsAdminInputError extends Error {
  readonly code = "knowledge_cms_admin_input";

  constructor(readonly errors: string[]) {
    super(errors.join(" "));
    this.name = "KnowledgeCmsAdminInputError";
  }
}

function recordTitle(record: KnowledgeCmsRecord): string {
  return record.kind === "faq" ? record.question : record.title;
}

export function toKnowledgeCmsAdminRecordSummaryDto(
  record: KnowledgeCmsRecord,
  actor: KnowledgeCmsActor,
): KnowledgeCmsAdminRecordSummaryDto {
  return {
    id: record.id,
    kind: record.kind,
    slug: record.slug,
    status: record.status,
    title: recordTitle(record),
    updatedAt: record.audit.updatedAt,
    revision: record.audit.revision,
    editable: getKnowledgeCmsAuthorizationDecision(actor, "update", record)
      .allowed,
    ownedByCurrentUser: record.ownerId === actor.id,
  };
}

export function toKnowledgeCmsAdminRecordDto(
  record: KnowledgeCmsRecord,
  actor: KnowledgeCmsActor,
  options: { reviewerVerified?: boolean } = {},
): KnowledgeCmsAdminRecordDto {
  const audit = record.audit;
  const changeRequest = record.changeRequest;
  const safeRecord = { ...record } as Partial<KnowledgeCmsRecord> & {
    audit?: KnowledgeCmsRecord["audit"];
    changeRequest?: KnowledgeCmsRecord["changeRequest"];
    ownerId?: string;
    publication?: KnowledgeCmsRecord["publication"];
    review?: KnowledgeCmsRecord["review"];
  };
  delete safeRecord.audit;
  delete safeRecord.changeRequest;
  delete safeRecord.ownerId;
  delete safeRecord.publication;
  delete safeRecord.review;
  return {
    ...safeRecord,
    editable: getKnowledgeCmsAuthorizationDecision(actor, "update", record)
      .allowed,
    ...(changeRequest
      ? {
          changeRequest: {
            feedback: changeRequest.feedback,
            requestedAt: changeRequest.requestedAt,
          },
        }
      : {}),
    ownedByCurrentUser: record.ownerId === actor.id,
    ...(record.review
      ? {
          review: {
            reviewerAgentSlug: record.review.reviewerAgentSlug,
            reviewedAt: record.review.reviewedAt,
            reviewDueAt: record.review.reviewDueAt,
            ...(record.review.decisionNote
              ? { decisionNote: record.review.decisionNote }
              : {}),
          },
        }
      : {}),
    revision: audit.revision,
    createdAt: audit.createdAt,
    updatedAt: audit.updatedAt,
    workflowActions: {
      approve:
        record.status === "in_review" &&
        options.reviewerVerified === true &&
        getKnowledgeCmsAuthorizationDecision(actor, "approve", record)
          .allowed,
      publish:
        record.status === "approved" &&
        Boolean(record.review?.reviewedBy) &&
        getKnowledgeCmsAuthorizationDecision(actor, "publish", record)
          .allowed,
      submitForReview:
        record.status === "draft" &&
        getKnowledgeCmsAuthorizationDecision(
          actor,
          "submit_for_review",
          record,
        ).allowed,
      requestChanges:
        record.status === "in_review" &&
        options.reviewerVerified === true &&
        getKnowledgeCmsAuthorizationDecision(
          actor,
          "request_changes",
          record,
        ).allowed,
      unpublish:
        record.status === "published" &&
        getKnowledgeCmsAuthorizationDecision(actor, "unpublish", record)
          .allowed,
    },
  } as KnowledgeCmsAdminRecordDto;
}

export function isKnowledgeCmsRecordKind(
  value: unknown,
): value is KnowledgeCmsRecordKind {
  return (
    typeof value === "string" &&
    KNOWLEDGE_CMS_RECORD_KINDS.includes(value as KnowledgeCmsRecordKind)
  );
}

const knowledgeCmsRecordIdPattern =
  /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;

export function isKnowledgeCmsRecordId(value: unknown): value is string {
  return (
    typeof value === "string" && knowledgeCmsRecordIdPattern.test(value)
  );
}

function readString(
  formData: FormData,
  name: string,
  options: { required?: boolean; maxLength?: number } = {},
): string | undefined {
  const value = formData.get(name);
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) {
    if (options.required) {
      throw new KnowledgeCmsAdminInputError([`${name} is required.`]);
    }
    return undefined;
  }
  if (text.length > (options.maxLength ?? 10_000)) {
    throw new KnowledgeCmsAdminInputError([`${name} is too long.`]);
  }
  return text;
}

function readInteger(
  formData: FormData,
  name: string,
  options: { required?: boolean; min?: number; max?: number } = {},
): number | undefined {
  const raw = readString(formData, name, { required: options.required });
  if (raw === undefined) {
    return undefined;
  }
  const value = Number(raw);
  if (
    !Number.isInteger(value) ||
    value < (options.min ?? Number.MIN_SAFE_INTEGER) ||
    value > (options.max ?? Number.MAX_SAFE_INTEGER)
  ) {
    throw new KnowledgeCmsAdminInputError([`${name} is invalid.`]);
  }
  return value;
}

function readLines(
  formData: FormData,
  name: string,
  max = 100,
): string[] {
  const raw = readString(formData, name, { maxLength: 20_000 });
  if (!raw) {
    return [];
  }
  const values = [
    ...new Set(
      raw
        .split(/[\n,]/)
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];
  if (values.length > max || values.some((value) => value.length > 500)) {
    throw new KnowledgeCmsAdminInputError([`${name} has too many values.`]);
  }
  return values;
}

function readSources(formData: FormData): KnowledgeCmsSource[] {
  const raw = readString(formData, "sources", { maxLength: 40_000 });
  if (!raw) {
    return [];
  }

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new KnowledgeCmsAdminInputError(["Sources could not be read."]);
  }

  if (!Array.isArray(value) || value.length > 20) {
    throw new KnowledgeCmsAdminInputError([
      "Sources must contain no more than 20 entries.",
    ]);
  }

  return value.map((source, index) => {
    if (!source || typeof source !== "object" || Array.isArray(source)) {
      throw new KnowledgeCmsAdminInputError([
        `Source ${index + 1} is invalid.`,
      ]);
    }
    const candidate = source as Record<string, unknown>;
    const required = [
      "id",
      "kind",
      "title",
      "publisher",
      "url",
      "checkedAt",
      "reviewDueAt",
    ] as const;
    if (
      required.some(
        (key) =>
          typeof candidate[key] !== "string" ||
          !(candidate[key] as string).trim(),
      ) ||
      (candidate.kind !== "official" && candidate.kind !== "first_party")
    ) {
      throw new KnowledgeCmsAdminInputError([
        `Source ${index + 1} is incomplete.`,
      ]);
    }

    return {
      id: (candidate.id as string).trim(),
      kind: candidate.kind,
      title: (candidate.title as string).trim(),
      publisher: (candidate.publisher as string).trim(),
      url: (candidate.url as string).trim(),
      checkedAt: (candidate.checkedAt as string).trim(),
      reviewDueAt: (candidate.reviewDueAt as string).trim(),
    };
  });
}

function readCommonInput(formData: FormData) {
  return {
    slug: readString(formData, "slug", { maxLength: 200 }),
    searchTerms: readLines(formData, "searchTerms"),
    relationships: {
      articleIds: readLines(formData, "articleIds"),
      topicIds: readLines(formData, "topicIds"),
      faqIds: readLines(formData, "faqIds"),
      citySlugs: readLines(formData, "citySlugs"),
      agentSlugs: readLines(formData, "agentSlugs"),
      carrierNames: readLines(formData, "carrierNames"),
      existingPaths: readLines(formData, "existingPaths"),
    },
    sources: readSources(formData),
    discoverability: {
      pageTitle: readString(formData, "pageTitle", { maxLength: 300 }),
      description: readString(formData, "description", { maxLength: 1_000 }),
      canonicalPath: readString(formData, "canonicalPath", { maxLength: 500 }),
    },
  };
}

export function parseKnowledgeCmsArticleMigrationExecutionForm(
  controlIdValue: unknown,
  controlFingerprintValue: unknown,
  formData: FormData,
): KnowledgeCmsArticleMigrationExecutionRequest {
  const controlId =
    typeof controlIdValue === "string" ? controlIdValue.trim() : "";
  const controlFingerprint =
    typeof controlFingerprintValue === "string"
      ? controlFingerprintValue.trim()
      : "";
  const confirmation = readString(formData, "confirmation", {
    required: true,
    maxLength: 300,
  })!;

  if (
    !/^resource-library-article-control--[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
      controlId,
    ) ||
    !/^[a-f0-9]{64}$/.test(controlFingerprint)
  ) {
    throw new KnowledgeCmsAdminInputError([
      "The selected article migration control is invalid.",
    ]);
  }

  return {
    controlId,
    controlFingerprint,
    confirmation,
  };
}

export function parseKnowledgeCmsSupportingMigrationExecutionForm(
  kindValue: unknown,
  controlIdValue: unknown,
  controlFingerprintValue: unknown,
  formData: FormData,
): KnowledgeCmsSupportingMigrationExecutionRequest {
  const kind = kindValue === "topic" || kindValue === "faq" ? kindValue : "";
  const controlId =
    typeof controlIdValue === "string" ? controlIdValue.trim() : "";
  const controlFingerprint =
    typeof controlFingerprintValue === "string"
      ? controlFingerprintValue.trim()
      : "";
  const confirmation = readString(formData, "confirmation", {
    required: true,
    maxLength: 300,
  })!;
  if (
    !kind ||
    !new RegExp(
      `^resource-library-${kind}-control--[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$`,
    ).test(controlId) ||
    !/^[a-f0-9]{64}$/.test(controlFingerprint)
  ) {
    throw new KnowledgeCmsAdminInputError([
      "The selected topic or FAQ migration control is invalid.",
    ]);
  }
  return { kind, controlId, controlFingerprint, confirmation };
}

export function parseKnowledgeCmsCreateForm(
  formData: FormData,
): KnowledgeCmsCreateInput {
  const kind = readString(formData, "kind", { required: true });
  if (!isKnowledgeCmsRecordKind(kind)) {
    throw new KnowledgeCmsAdminInputError(["Record kind is invalid."]);
  }
  const common = readCommonInput(formData);

  if (kind === "article") {
    return {
      ...common,
      kind,
      title: readString(formData, "title", {
        required: true,
        maxLength: 300,
      })!,
      summary: readString(formData, "summary", {
        required: true,
        maxLength: 2_000,
      })!,
      body: readString(formData, "body", {
        required: true,
        maxLength: 200_000,
      })!,
    };
  }

  if (kind === "topic") {
    return {
      ...common,
      kind,
      title: readString(formData, "title", {
        required: true,
        maxLength: 300,
      })!,
      description: readString(formData, "topicDescription", {
        required: true,
        maxLength: 5_000,
      })!,
      parentTopicId: readString(formData, "parentTopicId", { maxLength: 200 }),
      order: readInteger(formData, "order", { min: -10_000, max: 10_000 }),
    };
  }

  return {
    ...common,
    kind,
    question: readString(formData, "question", {
      required: true,
      maxLength: 1_000,
    })!,
    answer: readString(formData, "answer", {
      required: true,
      maxLength: 20_000,
    })!,
    categoryId: readString(formData, "categoryId", {
      required: true,
      maxLength: 200,
    })!,
    factIds: readLines(formData, "factIds"),
    schemaEligible: formData.get("schemaEligible") === "on",
  };
}

export function parseKnowledgeCmsUpdateForm(
  formData: FormData,
  expectedKind: KnowledgeCmsRecordKind,
): { input: KnowledgeCmsUpdateInput; expectedRevision: number } {
  const input = parseKnowledgeCmsCreateForm(formData);
  if (input.kind !== expectedKind) {
    throw new KnowledgeCmsAdminInputError(["Record kind cannot be changed."]);
  }
  const expectedRevision = readInteger(formData, "expectedRevision", {
    required: true,
    min: 1,
  })!;
  return { input, expectedRevision };
}

export type KnowledgeCmsAdminWorkflowAction =
  | "submit_for_review"
  | "approve"
  | "request_changes"
  | "publish"
  | "unpublish";

export function parseKnowledgeCmsWorkflowForm(
  formData: FormData,
  action: KnowledgeCmsAdminWorkflowAction,
): {
  expectedRevision: number;
  decisionNote?: string;
  indexing?: KnowledgeCmsDiscoverability["indexing"];
  canonicalPathConfirmation?: string;
} {
  const expectedRevision = readInteger(formData, "expectedRevision", {
    required: true,
    min: 1,
  })!;

  if (action === "publish") {
    const indexing = readString(formData, "indexing", { required: true });
    if (indexing !== "blocked" && indexing !== "eligible") {
      throw new KnowledgeCmsAdminInputError([
        "indexing must be blocked or eligible.",
      ]);
    }
    return {
      expectedRevision,
      indexing,
      decisionNote: readString(formData, "publicationNote", {
        required: true,
        maxLength: 2_000,
      }),
      ...(indexing === "eligible"
        ? {
            canonicalPathConfirmation: readString(
              formData,
              "canonicalPathConfirmation",
              {
                required: true,
                maxLength: 500,
              },
            ),
          }
        : {}),
    };
  }

  if (action === "unpublish") {
    return {
      expectedRevision,
      decisionNote: readString(formData, "unpublishReason", {
        required: true,
        maxLength: 2_000,
      }),
    };
  }

  if (action === "approve" || action === "request_changes") {
    return {
      expectedRevision,
      decisionNote: readString(
        formData,
        action === "approve" ? "approvalNote" : "feedback",
        {
          required: true,
          maxLength: 2_000,
        },
      ),
    };
  }

  return { expectedRevision };
}

export function validateKnowledgeCmsPublicationDecision(
  record: Pick<KnowledgeCmsRecord, "discoverability">,
  decision: {
    indexing: KnowledgeCmsDiscoverability["indexing"];
    canonicalPathConfirmation?: string;
  },
): string[] {
  if (decision.indexing === "blocked") {
    return [];
  }

  const canonicalPath = record.discoverability.canonicalPath;
  if (!canonicalPath) {
    return [
      "Indexing eligibility requires an approved canonical path on the record.",
    ];
  }
  if (decision.canonicalPathConfirmation !== canonicalPath) {
    return [
      "Canonical path confirmation must exactly match the approved record.",
    ];
  }
  return [];
}
