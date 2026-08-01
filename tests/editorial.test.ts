import assert from "node:assert/strict";
import test from "node:test";
import sitemap from "../app/sitemap";
import {
  editorialReviewerVerifications,
  isEditorialReviewerVerificationExpired,
  resolveCurrentEditorialReviewerVerification,
  resolveVerifiedEditorialReviewer,
  validateEditorialReviewerVerifications,
  type EditorialReviewerVerification,
} from "../lib/editorial";
import { siteConfig } from "../lib/site";
import {
  buildTeamListSchema,
  buildTeamMemberPersonSchema,
  getActiveLicensedTeamMembers,
  getLicensedYears,
  getTeamMemberBySlug,
  getTeamMemberPersonId,
  isLicensedTeamMember,
  isTeamAuthorityProfileVerified,
  validateTeamAuthorityProfiles,
  type TeamMember,
} from "../lib/team";

const currentReviewerVerification: EditorialReviewerVerification = {
  id: "test-lynn-wold-wa-license",
  agentSlug: "lynn-wold",
  status: "verified",
  credentialName: "Washington insurance producer license",
  jurisdiction: "Washington",
  verifiedAt: "2026-01-01",
  validThrough: "2026-06-30",
  verificationSourceUrl: "https://example.gov/license/lynn-wold",
};

test("Devon West has the current licensed-reviewer evidence required by the CMS", () => {
  assert.equal(editorialReviewerVerifications.length, 1);
  assert.equal(
    editorialReviewerVerifications[0]?.id,
    "devon-west-wa-oic-2026-07-31",
  );
  assert.equal(
    resolveCurrentEditorialReviewerVerification(
      "devon-west",
      "2026-07-31",
    )?.id,
    "devon-west-wa-oic-2026-07-31",
  );
  assert.equal(
    resolveVerifiedEditorialReviewer(
      "devon-west",
      "devon-west-wa-oic-2026-07-31",
      "2026-07-31",
    )?.name,
    "Devon West",
  );
  assert.equal(
    resolveVerifiedEditorialReviewer(
      "lynn-wold",
      "missing-verification",
      "2026-07-30",
    ),
    undefined,
  );
  assert.deepEqual(
    validateEditorialReviewerVerifications("2026-07-31"),
    [],
  );
});

test("reviewer verification requires the matching active licensed agent and current record", () => {
  const reviewer = resolveVerifiedEditorialReviewer(
    "lynn-wold",
    currentReviewerVerification.id,
    "2026-06-30",
    [currentReviewerVerification],
  );

  assert.equal(reviewer?.name, "Lynn Wold");
  assert.equal(
    resolveCurrentEditorialReviewerVerification(
      "lynn-wold",
      "2026-06-30",
      [currentReviewerVerification],
    )?.id,
    currentReviewerVerification.id,
  );
  assert.equal(
    resolveVerifiedEditorialReviewer(
      "craig-lenhart",
      currentReviewerVerification.id,
      "2026-06-30",
      [currentReviewerVerification],
    ),
    undefined,
  );
  assert.equal(
    resolveVerifiedEditorialReviewer(
      "lynn-wold",
      currentReviewerVerification.id,
      "2026-07-01",
      [currentReviewerVerification],
    ),
    undefined,
  );
  assert.equal(
    resolveCurrentEditorialReviewerVerification(
      "lynn-wold",
      "2026-06-30",
      [
        currentReviewerVerification,
        {
          ...currentReviewerVerification,
          id: "second-current-verification",
        },
      ],
    ),
    undefined,
  );
});

test("reviewer verification expires after its explicit or default verification window", () => {
  assert.equal(
    isEditorialReviewerVerificationExpired(
      currentReviewerVerification,
      "2026-06-30",
    ),
    false,
  );
  assert.equal(
    isEditorialReviewerVerificationExpired(
      currentReviewerVerification,
      new Date("2026-06-30T23:59:59.999Z"),
    ),
    false,
  );
  assert.equal(
    isEditorialReviewerVerificationExpired(
      currentReviewerVerification,
      "2026-07-01",
    ),
    true,
  );

  const defaultWindow = {
    ...currentReviewerVerification,
    id: "test-default-window",
    validThrough: undefined,
  };

  assert.equal(
    isEditorialReviewerVerificationExpired(defaultWindow, "2027-01-01"),
    false,
  );
  assert.equal(
    isEditorialReviewerVerificationExpired(defaultWindow, "2027-01-02"),
    true,
  );

  const impossibleCalendarDate = {
    ...currentReviewerVerification,
    id: "test-impossible-date",
    validThrough: "2026-02-31",
  };
  assert.equal(
    isEditorialReviewerVerificationExpired(
      impossibleCalendarDate,
      "2026-02-01",
    ),
    true,
  );
  assert.match(
    validateEditorialReviewerVerifications(
      "2026-02-01",
      [impossibleCalendarDate],
    ).join(" "),
    /invalid validThrough date/i,
  );

  const overlongWindow = {
    ...currentReviewerVerification,
    id: "test-overlong-window",
    validThrough: "2027-01-02",
  };
  assert.equal(
    resolveCurrentEditorialReviewerVerification(
      "lynn-wold",
      "2026-06-30",
      [overlongWindow],
    ),
    undefined,
  );
  assert.match(
    validateEditorialReviewerVerifications(
      "2026-06-30",
      [overlongWindow],
    ).join(" "),
    /cannot exceed 365 days/i,
  );
});

test("team authority uses explicit licensing and stable Person identifiers", () => {
  assert.deepEqual(validateTeamAuthorityProfiles("2026-07-30"), []);
  assert.equal(
    isLicensedTeamMember({
      name: "Unverified Title",
      title: "Licensed Insurance Agent",
      shortBio: "A title alone must not establish licensing.",
      active: true,
      sortOrder: 100,
    }),
    false,
  );

  const licensedMembers = getActiveLicensedTeamMembers();
  assert.ok(licensedMembers.length > 0);

  const ids = licensedMembers.map(getTeamMemberPersonId);
  assert.equal(new Set(ids).size, ids.length);

  const lynn = getTeamMemberBySlug("lynn-wold");
  assert.ok(lynn);

  const schema = buildTeamMemberPersonSchema(lynn, "2026-07-30");
  assert.equal(schema["@id"], `${siteConfig.url}/our-team#lynn-wold`);
  assert.equal(schema.url, `${siteConfig.url}/our-team#lynn-wold`);
  assert.ok(
    (schema.knowsAbout as string[]).includes("Medicare Advantage"),
  );
  assert.equal(
    schema.publishingPrinciples,
    `${siteConfig.url}${siteConfig.editorialStandardsPath}`,
  );
  assert.equal("hasCredential" in schema, false);
});

test("verified optional authority fields map to Person schema without inventing them for real agents", () => {
  const member: TeamMember = {
    name: "Example Agent",
    title: "Licensed Insurance Agent",
    shortBio: "Example profile used to test structured authority fields.",
    specialties: ["Medicare Part D"],
    licensed: true,
    active: true,
    sortOrder: 99,
    authority: {
      expertise: ["Prescription Reviews"],
      languages: ["en", "es"],
      counties: ["Spokane County, Washington"],
      licensedSinceYear: 2020,
      authoredKnowledgePaths: ["/medicare-part-d"],
      answeredFaqIds: ["part-d-basics"],
      lastVerifiedAt: "2026-07-30",
      certifications: [
        {
          name: "Washington insurance producer license",
          category: "insurance-license",
          issuer: "Washington State Office of the Insurance Commissioner",
          jurisdiction: "Washington",
          identifier: "EXAMPLE",
          verifiedAt: "2026-07-30",
          verificationUrl: "https://example.gov/license/example-agent",
          public: true,
        },
      ],
    },
  };

  const schema = buildTeamMemberPersonSchema(member, "2026-07-30");
  assert.equal(
    isTeamAuthorityProfileVerified(member, "2027-07-30"),
    true,
  );
  assert.equal(
    isTeamAuthorityProfileVerified(member, "2027-07-31"),
    false,
  );
  assert.deepEqual(schema.knowsLanguage, ["en", "es"]);
  assert.deepEqual(schema.knowsAbout, [
    "Medicare Part D",
    "Prescription Reviews",
  ]);
  assert.equal(getLicensedYears(member, "2026-07-30"), 6);
  assert.equal(
    (schema.hasCredential as Array<Record<string, unknown>>)[0]?.name,
    "Washington insurance producer license",
  );
});

test("team ItemList and sitemap expose the authority and standards destinations", () => {
  const schema = buildTeamListSchema("2026-07-30");
  const items = schema.itemListElement as Array<{
    item: Record<string, unknown>;
  }>;

  assert.equal(items.length, 11);
  assert.equal(
    new Set(items.map((item) => item.item["@id"])).size,
    items.length,
  );

  const sitemapUrls = new Set(sitemap().map((entry) => entry.url));
  assert.ok(
    sitemapUrls.has(
      `${siteConfig.url}${siteConfig.editorialStandardsPath}`,
    ),
  );
});
