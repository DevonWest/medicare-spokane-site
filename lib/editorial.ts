import {
  getTeamMemberBySlug,
  isLicensedTeamMember,
  type TeamMember,
} from "./team";

export const EDITORIAL_REVIEWER_VERIFICATION_MAX_AGE_DAYS = 365;

export type EditorialReviewerVerification = {
  id: string;
  agentSlug: string;
  status: "superseded" | "verified";
  credentialName: string;
  jurisdiction: string;
  verifiedAt: string;
  validThrough?: string;
  verificationSourceUrl: string;
};

/**
 * A reviewer must be explicitly added here after their active license and
 * educational-review role are checked. An empty registry intentionally keeps
 * all "Reviewed by" claims disabled.
 */
export const editorialReviewerVerifications: EditorialReviewerVerification[] = [];

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function addUtcDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function resolveAsOfDate(asOf: string | Date): Date {
  const parsed =
    asOf instanceof Date
      ? asOf
      : /^\d{4}-\d{2}-\d{2}$/.test(asOf)
        ? parseDateOnly(asOf)
        : new Date(asOf);
  if (Number.isNaN(parsed.getTime())) {
    return parsed;
  }
  return parseDateOnly(parsed.toISOString().slice(0, 10));
}

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = parseDateOnly(value);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

export function getEditorialReviewerVerificationValidThrough(
  verification: EditorialReviewerVerification,
): string | undefined {
  if (
    !isValidDateOnly(verification.verifiedAt) ||
    (verification.validThrough &&
      !isValidDateOnly(verification.validThrough))
  ) {
    return undefined;
  }

  const maximumValidThrough = addUtcDays(
    parseDateOnly(verification.verifiedAt),
    EDITORIAL_REVIEWER_VERIFICATION_MAX_AGE_DAYS,
  )
    .toISOString()
    .slice(0, 10);
  if (
    verification.validThrough &&
    verification.validThrough > maximumValidThrough
  ) {
    return undefined;
  }

  return verification.validThrough ?? maximumValidThrough;
}

export function isEditorialReviewerVerificationExpired(
  verification: EditorialReviewerVerification,
  asOf: string | Date = new Date(),
): boolean {
  if (verification.status !== "verified") {
    return true;
  }

  const validThrough = getEditorialReviewerVerificationValidThrough(
    verification,
  );
  if (!validThrough) {
    return true;
  }

  return (
    resolveAsOfDate(asOf).getTime() >
    parseDateOnly(validThrough).getTime()
  );
}

export function resolveVerifiedEditorialReviewer(
  agentSlug: string,
  verificationId: string,
  asOf: string | Date = new Date(),
  verifications: EditorialReviewerVerification[] = editorialReviewerVerifications,
): TeamMember | undefined {
  const verification = verifications.find(
    (candidate) =>
      candidate.id === verificationId &&
      candidate.agentSlug === agentSlug,
  );

  if (
    !verification ||
    isEditorialReviewerVerificationExpired(verification, asOf)
  ) {
    return undefined;
  }

  const member = getTeamMemberBySlug(agentSlug);
  return member && isLicensedTeamMember(member) ? member : undefined;
}

export function resolveCurrentEditorialReviewerVerification(
  agentSlug: string,
  asOf: string | Date = new Date(),
  verifications: EditorialReviewerVerification[] = editorialReviewerVerifications,
): EditorialReviewerVerification | undefined {
  const matches = verifications.filter(
    (verification) =>
      verification.agentSlug === agentSlug &&
      Boolean(
        resolveVerifiedEditorialReviewer(
          agentSlug,
          verification.id,
          asOf,
          verifications,
        ),
      ),
  );

  return matches.length === 1 ? matches[0] : undefined;
}

export function validateEditorialReviewerVerifications(
  asOf: string | Date = new Date(),
  verifications: EditorialReviewerVerification[] = editorialReviewerVerifications,
): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const verification of verifications) {
    if (ids.has(verification.id)) {
      errors.push(`Duplicate editorial reviewer verification id: ${verification.id}.`);
    }
    ids.add(verification.id);

    const member = getTeamMemberBySlug(verification.agentSlug);
    if (!member || !isLicensedTeamMember(member)) {
      errors.push(
        `Editorial reviewer verification ${verification.id} must reference an active licensed agent.`,
      );
    }

    if (!verification.credentialName.trim()) {
      errors.push(`Editorial reviewer verification ${verification.id} is missing a credential name.`);
    }

    if (!verification.jurisdiction.trim()) {
      errors.push(`Editorial reviewer verification ${verification.id} is missing a jurisdiction.`);
    }

    if (!isValidDateOnly(verification.verifiedAt)) {
      errors.push(`Editorial reviewer verification ${verification.id} has an invalid verifiedAt date.`);
    }

    if (
      verification.validThrough &&
      !isValidDateOnly(verification.validThrough)
    ) {
      errors.push(
        `Editorial reviewer verification ${verification.id} has an invalid validThrough date.`,
      );
    }

    if (!verification.verificationSourceUrl.startsWith("https://")) {
      errors.push(
        `Editorial reviewer verification ${verification.id} must use an HTTPS verification source.`,
      );
    }

    if (
      isValidDateOnly(verification.verifiedAt) &&
      verification.validThrough &&
      isValidDateOnly(verification.validThrough) &&
      parseDateOnly(verification.validThrough).getTime() <
        parseDateOnly(verification.verifiedAt).getTime()
    ) {
      errors.push(
        `Editorial reviewer verification ${verification.id} expires before it was verified.`,
      );
    }

    if (
      isValidDateOnly(verification.verifiedAt) &&
      verification.validThrough &&
      isValidDateOnly(verification.validThrough) &&
      parseDateOnly(verification.validThrough).getTime() >
        addUtcDays(
          parseDateOnly(verification.verifiedAt),
          EDITORIAL_REVIEWER_VERIFICATION_MAX_AGE_DAYS,
        ).getTime()
    ) {
      errors.push(
        `Editorial reviewer verification ${verification.id} cannot exceed ${EDITORIAL_REVIEWER_VERIFICATION_MAX_AGE_DAYS} days.`,
      );
    }

    if (
      verification.status === "verified" &&
      isEditorialReviewerVerificationExpired(verification, asOf)
    ) {
      errors.push(
        `Editorial reviewer verification ${verification.id} is expired.`,
      );
    }
  }

  return errors;
}
