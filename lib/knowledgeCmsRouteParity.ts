import { knowledgeEntries } from "./knowledgeCenter";
import { siteConfig } from "./site";

export const KNOWLEDGE_CMS_ROUTE_PARITY_VERSION = 1 as const;
export const KNOWLEDGE_CMS_ROUTE_PARITY_MODE = "read_only" as const;
export const KNOWLEDGE_CMS_ROUTE_PARITY_HASH_ALGORITHM = "sha256" as const;
export const KNOWLEDGE_CMS_ROUTE_PARITY_CAPTURE =
  "react-dom/server:renderToStaticMarkup" as const;
export const KNOWLEDGE_CMS_ROUTE_PARITY_CANONICAL_ORIGIN =
  "https://www.medicareinspokane.com" as const;

export type KnowledgeCmsRouteSchemaType =
  | "BreadcrumbList"
  | "FAQPage"
  | "WebPage";
export type KnowledgeCmsRoutePreservationRequirement =
  | "faq_disclosures"
  | "governed_faq_registry"
  | "lead_form"
  | "react_component_tree"
  | "related_content"
  | "represented_carrier_registry"
  | "structured_data";

interface KnowledgeCmsRouteParitySnapshot {
  pageTitle: string;
  description: string;
  openGraphTitle: string;
  openGraphDescription: string;
  h1: string;
  renderedSha256: string;
  renderedBytes: number;
  schemaTypes: KnowledgeCmsRouteSchemaType[];
  formCount: number;
  faqDisclosureCount: number;
}

const routePathByEntryId: Record<string, string> = {
  "turning-65-spokane": "/turning-65-medicare-spokane",
  "compare-options": "/compare-medicare-options",
  "medicare-advantage": "/medicare-advantage",
  "medicare-supplements": "/medicare-supplements",
  "appointment-checklist": "/medicare-appointment-checklist",
  "annual-plan-review": "/medicare-plan-review-spokane",
  "annual-enrollment-spokane": "/medicare-annual-enrollment-spokane",
  "prescription-review": "/rx-drug-review",
  "part-d": "/medicare-part-d",
  "helping-parent": "/helping-parent-with-medicare",
  "working-past-65": "/working-past-65-medicare",
  "health-insurance-spokane": "/health-insurance-spokane",
  "health-insurance-agent": "/health-insurance-agent-spokane",
  "individual-family-health-insurance":
    "/individual-family-health-insurance-spokane",
  "self-employed-health-insurance":
    "/self-employed-health-insurance-spokane",
  "special-enrollment-health-insurance":
    "/health-insurance-special-enrollment-spokane",
  "enrollment-resources": "/medicare-enrollment-resources",
  "moving-to-spokane": "/moving-to-spokane-medicare",
  "medicare-savings-extra-help":
    "/medicare-savings-program-extra-help-washington",
  "medicare-faq": "/medicare-faq",
  "advantage-vs-supplement":
    "/medicare-advantage-vs-supplement-spokane",
  "represented-carriers": "/carriers",
};

export interface KnowledgeCmsRouteParityManifestEntry {
  version: typeof KNOWLEDGE_CMS_ROUTE_PARITY_VERSION;
  mode: typeof KNOWLEDGE_CMS_ROUTE_PARITY_MODE;
  entryId: string;
  path: string;
  sourceFile: string;
  metadata: {
    pageTitle: string;
    description: string;
    canonicalUrl: string;
    openGraphTitle: string;
    openGraphDescription: string;
    openGraphUrl: string;
    status: "verified";
  };
  renderedBody: {
    capture: typeof KNOWLEDGE_CMS_ROUTE_PARITY_CAPTURE;
    hashAlgorithm: typeof KNOWLEDGE_CMS_ROUTE_PARITY_HASH_ALGORITHM;
    sha256: string;
    bytes: number;
    h1: string;
    h1Count: 1;
    schemaTypes: KnowledgeCmsRouteSchemaType[];
    formCount: number;
    faqDisclosureCount: number;
    status: "verified";
  };
  cmsRepresentation: {
    bodyFormat: "markdown";
    status: "blocked";
    preservationRequirements: KnowledgeCmsRoutePreservationRequirement[];
    reason: string;
  };
}

const routeSnapshotsByEntryId: Record<
  string,
  KnowledgeCmsRouteParitySnapshot
> = {
  "turning-65-spokane": {
    pageTitle: "Turning 65 Medicare Help Spokane",
    description:
      "Turning 65 in Spokane? Get local help understanding Medicare enrollment, Medicare Advantage, Medicare Supplement, and Part D options from a licensed insurance agent.",
    openGraphTitle: "Turning 65 Medicare Help Spokane",
    openGraphDescription:
      "Turning 65 in Spokane? Get local help understanding Medicare enrollment, Medicare Advantage, Medicare Supplement, and Part D options from a licensed insurance agent.",
    h1: "Turning 65 in Spokane? Get Help Understanding Medicare",
    renderedSha256:
      "3901bac6bada43c0a89e88ecd943febd9bc5a8cc6bcf8dea1227c96a7fe7ec34",
    renderedBytes: 30062,
    schemaTypes: ["BreadcrumbList","WebPage","FAQPage"],
    formCount: 1,
    faqDisclosureCount: 5,
  },
  "compare-options": {
    pageTitle: "Compare Medicare Options Spokane",
    description:
      "Compare Medicare Advantage, Medicare Supplement, Part D, and supplemental insurance options in Spokane with help from a local licensed insurance agent.",
    openGraphTitle:
      "Compare Medicare Options Spokane | Medicare in Spokane",
    openGraphDescription:
      "Compare Medicare Advantage, Medicare Supplement, Part D, and supplemental insurance options in Spokane with help from a local licensed insurance agent.",
    h1: "Compare Medicare Options in Spokane",
    renderedSha256:
      "f3507aed6d3347c191c290222afbdd2ce965d44fceb3fe0c6a0436a3bcb5291a",
    renderedBytes: 29823,
    schemaTypes: ["FAQPage","WebPage","BreadcrumbList"],
    formCount: 1,
    faqDisclosureCount: 5,
  },
  "medicare-advantage": {
    pageTitle: "Medicare Advantage Plans in Spokane, WA",
    description:
      "Compare Medicare Advantage (Part C) plans in Spokane with a licensed independent insurance agency. We help you review network, drug, and benefit differences across the carriers we represent.",
    openGraphTitle: "Medicare Advantage Plans in Spokane, WA",
    openGraphDescription:
      "Compare Medicare Advantage (Part C) options with a local Spokane licensed independent insurance agency.",
    h1: "Medicare Advantage in Spokane",
    renderedSha256:
      "8bea20000f01fc3050fb9d8494e781e2304a9dbb4fbbaa5d2bcf1f3afb704783",
    renderedBytes: 14228,
    schemaTypes: ["BreadcrumbList","FAQPage"],
    formCount: 1,
    faqDisclosureCount: 3,
  },
  "medicare-supplements": {
    pageTitle: "Medicare Supplement (Medigap) Plans in Spokane",
    description:
      "Help comparing Medicare Supplement (Medigap) options in Spokane. Plans work alongside Original Medicare to help with deductibles, coinsurance, and other out-of-pocket costs.",
    openGraphTitle: "Medicare Supplement (Medigap) Plans in Spokane",
    openGraphDescription:
      "Compare Medicare Supplement options with a local Spokane licensed independent insurance agency.",
    h1: "Medicare Supplements (Medigap)",
    renderedSha256:
      "2f4833520ef7ad40549f1b939ac9224306690f9e5f6312dc91809f90b7284aeb",
    renderedBytes: 14144,
    schemaTypes: ["BreadcrumbList","FAQPage"],
    formCount: 1,
    faqDisclosureCount: 3,
  },
  "appointment-checklist": {
    pageTitle: "Medicare Appointment Checklist Spokane",
    description:
      "Prepare for your Medicare appointment in Spokane. See what to bring, including prescription lists, doctors, pharmacies, current coverage, and questions for a licensed local insurance agent.",
    openGraphTitle: "Medicare Appointment Checklist Spokane",
    openGraphDescription:
      "Prepare for your Medicare appointment in Spokane. See what to bring, including prescription lists, doctors, pharmacies, current coverage, and questions for a licensed local insurance agent.",
    h1: "What to Bring to Your Medicare Appointment",
    renderedSha256:
      "0b3a727522a65c1920b0fb117d5e495a910a5d30b0bc6bcba4013d3ef40884fe",
    renderedBytes: 27255,
    schemaTypes: ["FAQPage","WebPage","BreadcrumbList"],
    formCount: 1,
    faqDisclosureCount: 5,
  },
  "annual-plan-review": {
    pageTitle: "Annual Medicare Plan Review Spokane",
    description:
      "Review your Medicare plan in Spokane with help from a local licensed insurance agent. Check prescriptions, doctors, pharmacies, premiums, copays, and plan options.",
    openGraphTitle:
      "Annual Medicare Plan Review Spokane | Medicare in Spokane",
    openGraphDescription:
      "Review your Medicare plan in Spokane with help from a local licensed insurance agent. Check prescriptions, doctors, pharmacies, premiums, copays, and plan options.",
    h1: "Annual Medicare Plan Review in Spokane",
    renderedSha256:
      "6984094503c8502cc54ca79665fec10cbf8528e116f553035a195b1b21733710",
    renderedBytes: 30438,
    schemaTypes: ["FAQPage","WebPage","BreadcrumbList"],
    formCount: 1,
    faqDisclosureCount: 5,
  },
  "annual-enrollment-spokane": {
    pageTitle: "Medicare Annual Enrollment Help in Spokane",
    description:
      "Medicare's Annual Enrollment Period runs October 15 through December 7 each year. A local Spokane licensed independent insurance agency can help you review prescriptions, doctors, pharmacies, premiums, copays, and plan changes.",
    openGraphTitle:
      "Medicare Annual Enrollment Help in Spokane | Medicare in Spokane",
    openGraphDescription:
      "Plain-language overview of the Medicare Annual Enrollment Period (Oct 15 – Dec 7) with help reviewing prescriptions, doctors, pharmacies, and the plans we represent in Spokane.",
    h1: "Medicare Annual Enrollment Help in Spokane",
    renderedSha256:
      "a26fadf31fa03cfbf9f16b25a1b860f894bb8115c85ea15968e185db4f24c776",
    renderedBytes: 28687,
    schemaTypes: ["FAQPage","WebPage","BreadcrumbList"],
    formCount: 1,
    faqDisclosureCount: 5,
  },
  "prescription-review": {
    pageTitle: "Prescription Drug Plan Review Spokane",
    description:
      "Get local help reviewing prescription drug coverage for Medicare Advantage and Part D plans in Spokane. Bring your medication list and compare options with a licensed insurance agent.",
    openGraphTitle: "Prescription Drug Plan Review Spokane",
    openGraphDescription:
      "Get local help reviewing prescription drug coverage for Medicare Advantage and Part D plans in Spokane.",
    h1: "Bring Your Prescription List — We’ll Help Review Your Options",
    renderedSha256:
      "8cc4b4b99b855c1d2836b8f6bb6636a5433f35b5d68ff40b017c9be7e5134411",
    renderedBytes: 23789,
    schemaTypes: ["FAQPage","WebPage","BreadcrumbList"],
    formCount: 1,
    faqDisclosureCount: 4,
  },
  "part-d": {
    pageTitle: "Medicare Part D Prescription Drug Plans in Spokane",
    description:
      "Compare Medicare Part D prescription drug plans in Spokane. We help you review your medications and how each plan we represent would cover them, including preferred pharmacies.",
    openGraphTitle: "Medicare Part D Prescription Drug Plans in Spokane",
    openGraphDescription:
      "Help comparing standalone Medicare Part D plans, including a prescription review.",
    h1: "Medicare Part D in Spokane",
    renderedSha256:
      "5af990b607a693938f9271ab9bdb97977a343d4804df7ef826d1d61d792655ee",
    renderedBytes: 21340,
    schemaTypes: ["BreadcrumbList","FAQPage","WebPage"],
    formCount: 1,
    faqDisclosureCount: 3,
  },
  "helping-parent": {
    pageTitle: "Helping a Parent with Medicare Spokane",
    description:
      "Helping a parent or loved one with Medicare in Spokane? Get local guidance reviewing Medicare Advantage, Medicare Supplement, Part D, prescriptions, doctors, and plan options.",
    openGraphTitle: "Helping a Parent with Medicare Spokane",
    openGraphDescription:
      "Helping a parent or loved one with Medicare in Spokane? Get local guidance reviewing Medicare Advantage, Medicare Supplement, Part D, prescriptions, doctors, and plan options.",
    h1: "Helping a Parent with Medicare in Spokane?",
    renderedSha256:
      "9ec2336b8f88f8355583f6439008aa8d51f1cf94c479bbd7765326123308ff0f",
    renderedBytes: 28732,
    schemaTypes: ["BreadcrumbList","WebPage","FAQPage"],
    formCount: 1,
    faqDisclosureCount: 5,
  },
  "working-past-65": {
    pageTitle: "Working Past 65 and Medicare Spokane",
    description:
      "Still working at 65? Get local help understanding Medicare timing, employer coverage questions, Part B, Part D, and Medicare plan options in Spokane.",
    openGraphTitle:
      "Working Past 65 and Medicare Spokane | Medicare in Spokane",
    openGraphDescription:
      "Still working at 65? Get local help understanding Medicare timing, employer coverage questions, Part B, Part D, and Medicare plan options in Spokane.",
    h1: "Working Past 65? Understand Your Medicare Options",
    renderedSha256:
      "5c98ffbc66b0629d1d809f355b7a033e6a6aa9e2056f289beb810855dc1316ea",
    renderedBytes: 27397,
    schemaTypes: ["BreadcrumbList","WebPage","FAQPage"],
    formCount: 1,
    faqDisclosureCount: 5,
  },
  "health-insurance-spokane": {
    pageTitle:
      "Affordable Health Insurance Help in Spokane, WA | Health Insurance Options",
    description:
      "Get local help reviewing individual and family health insurance options in Spokane, WA. Health Insurance Options LLC helps people compare coverage, costs, provider access, and enrollment timing before Medicare.",
    openGraphTitle:
      "Affordable Health Insurance Help in Spokane, WA | Health Insurance Options",
    openGraphDescription:
      "Get local help reviewing individual and family health insurance options in Spokane, WA. Health Insurance Options LLC helps people compare coverage, costs, provider access, and enrollment timing before Medicare.",
    h1: "Health Insurance Help in Spokane, WA",
    renderedSha256:
      "f2122923f6d83e3091c60f506ca16a676289b1b280024f6e49e8af52cd7a6b9b",
    renderedBytes: 28162,
    schemaTypes: ["BreadcrumbList","FAQPage","WebPage"],
    formCount: 1,
    faqDisclosureCount: 5,
  },
  "health-insurance-agent": {
    pageTitle:
      "Health Insurance Agent Spokane WA | Health Insurance Options",
    description:
      "Work with a local Spokane health insurance agent to review coverage options for individuals, families, self-employed workers, and people losing employer coverage before Medicare.",
    openGraphTitle:
      "Health Insurance Agent Spokane WA | Health Insurance Options",
    openGraphDescription:
      "Work with a local Spokane health insurance agent to review coverage options for individuals, families, self-employed workers, and people losing employer coverage before Medicare.",
    h1: "Health Insurance Agent in Spokane, WA",
    renderedSha256:
      "537dd006993bfe1e60adf795352745c463f66acb4745f04ca01db43deef62d4d",
    renderedBytes: 25009,
    schemaTypes: ["FAQPage","WebPage","BreadcrumbList"],
    formCount: 1,
    faqDisclosureCount: 4,
  },
  "individual-family-health-insurance": {
    pageTitle:
      "Individual & Family Health Insurance Spokane WA | Health Insurance Options",
    description:
      "Get local help reviewing individual and family health insurance options in Spokane, WA. Compare coverage, costs, provider access, and enrollment timing before Medicare.",
    openGraphTitle:
      "Individual & Family Health Insurance Spokane WA | Health Insurance Options",
    openGraphDescription:
      "Get local help reviewing individual and family health insurance options in Spokane, WA. Compare coverage, costs, provider access, and enrollment timing before Medicare.",
    h1: "Individual & Family Health Insurance Help in Spokane, WA",
    renderedSha256:
      "10b066bdd0898aad77ecb704886ceb59448ba3d1d84d2b458dd360e26fc46b2c",
    renderedBytes: 24672,
    schemaTypes: ["FAQPage","WebPage","BreadcrumbList"],
    formCount: 1,
    faqDisclosureCount: 4,
  },
  "self-employed-health-insurance": {
    pageTitle:
      "Self-Employed Health Insurance Spokane WA | Health Insurance Options",
    description:
      "Self-employed in Spokane? Get local help reviewing health insurance coverage options, premiums, deductibles, provider access, and enrollment timing.",
    openGraphTitle:
      "Self-Employed Health Insurance Spokane WA | Health Insurance Options",
    openGraphDescription:
      "Self-employed in Spokane? Get local help reviewing health insurance coverage options, premiums, deductibles, provider access, and enrollment timing.",
    h1: "Self-Employed Health Insurance Help in Spokane, WA",
    renderedSha256:
      "18a64fcf6aadf53c1eab78840a239eccca881c8dbe3b236f26a0c13e4b57d2da",
    renderedBytes: 24219,
    schemaTypes: ["FAQPage","WebPage","BreadcrumbList"],
    formCount: 1,
    faqDisclosureCount: 4,
  },
  "special-enrollment-health-insurance": {
    pageTitle:
      "Special Enrollment Health Insurance Spokane WA | Health Insurance Options",
    description:
      "Lost employer coverage or had a qualifying life event? Get local help understanding health insurance special enrollment options in Spokane, WA.",
    openGraphTitle:
      "Special Enrollment Health Insurance Spokane WA | Health Insurance Options",
    openGraphDescription:
      "Lost employer coverage or had a qualifying life event? Get local help understanding health insurance special enrollment options in Spokane, WA.",
    h1: "Special Enrollment Health Insurance Help in Spokane, WA",
    renderedSha256:
      "5ca0ba78e9dd82e5b6878320c6a682925cbd6dcce904a64a8e2ca2330eb7971b",
    renderedBytes: 24194,
    schemaTypes: ["FAQPage","WebPage","BreadcrumbList"],
    formCount: 1,
    faqDisclosureCount: 4,
  },
  "enrollment-resources": {
    pageTitle: "Medicare Enrollment Resources for Spokane Beneficiaries",
    description:
      "Step-by-step Medicare enrollment resources for Spokane-area beneficiaries — Initial Enrollment Period, Annual Enrollment, Special Enrollment Periods, late enrollment penalties, and how to apply through Social Security.",
    openGraphTitle:
      "Medicare Enrollment Resources for Spokane Beneficiaries",
    openGraphDescription:
      "Initial Enrollment, Annual Enrollment, Special Enrollment Periods, and how to apply through Social Security.",
    h1: "Medicare Enrollment Resources",
    renderedSha256:
      "f121f825c30a4dc733bc552c0b5aba1755461e153acd55b90017878c86e61165",
    renderedBytes: 18366,
    schemaTypes: ["BreadcrumbList","WebPage"],
    formCount: 1,
    faqDisclosureCount: 0,
  },
  "moving-to-spokane": {
    pageTitle: "Moving to Spokane? Review Your Medicare Coverage Options",
    description:
      "Moving to Spokane or Spokane County? Medicare Advantage and Part D options can vary by county, ZIP code, provider network, and pharmacy. Talk with a local licensed independent insurance agency about your options.",
    openGraphTitle:
      "Moving to Spokane? Review Your Medicare Coverage Options | Medicare in Spokane",
    openGraphDescription:
      "Medicare Advantage and Part D plans, networks, and pharmacy availability can change when you move to a new county or ZIP code. Review the plans we represent in Spokane and Spokane County.",
    h1: "Moving to Spokane? Review Your Medicare Coverage Options",
    renderedSha256:
      "2d4d90cd5702ca09c7213ef560ce9f15e57fd23a16f6facefb5776f2a0163f37",
    renderedBytes: 28606,
    schemaTypes: ["FAQPage","WebPage","BreadcrumbList"],
    formCount: 1,
    faqDisclosureCount: 5,
  },
  "medicare-savings-extra-help": {
    pageTitle: "Medicare Savings Program and Extra Help in Washington",
    description:
      "Learn how Medicare Savings Programs, Medicaid through Washington DSHS, and the federal Extra Help (LIS) program may help some Medicare beneficiaries with costs. Educational overview from a Spokane licensed independent insurance agency.",
    openGraphTitle:
      "Medicare Savings Program and Extra Help in Washington | Medicare in Spokane",
    openGraphDescription:
      "Educational overview of Medicare Savings Programs, Washington Medicaid through DSHS, and the federal Extra Help (LIS) program. Eligibility is determined by the state and federal agencies that administer these programs.",
    h1: "Medicare Savings Program and Extra Help in Washington",
    renderedSha256:
      "9f3c870bfac5345ef80b627e9efe7de95f59aeeb706487db4a59b66cb9565b2c",
    renderedBytes: 29802,
    schemaTypes: ["FAQPage","WebPage","BreadcrumbList"],
    formCount: 1,
    faqDisclosureCount: 5,
  },
  "medicare-faq": {
    pageTitle: "Medicare FAQ – Common Questions in Spokane",
    description:
      "Answers to common Medicare questions for Spokane-area beneficiaries: eligibility, enrollment, employer coverage, doctors, Part C, Part D, creditable coverage, and more.",
    openGraphTitle: "Medicare FAQ – Common Questions in Spokane",
    openGraphDescription:
      "Answers to common Medicare questions for Spokane-area beneficiaries.",
    h1: "Medicare FAQ",
    renderedSha256:
      "59ead8c5165ebd4cd418128e62306c13aeed8e178f007213b8f5a70638f97a9d",
    renderedBytes: 27735,
    schemaTypes: ["BreadcrumbList","FAQPage","WebPage"],
    formCount: 0,
    faqDisclosureCount: 11,
  },
  "advantage-vs-supplement": {
    pageTitle: "Medicare Advantage vs. Medicare Supplement in Spokane, WA",
    description:
      "Compare Medicare Advantage (Part C) and Medicare Supplement (Medigap) in Spokane, WA. Understand the trade-offs in cost, networks, and flexibility with help from a licensed independent insurance agency.",
    openGraphTitle:
      "Medicare Advantage vs. Medicare Supplement in Spokane",
    openGraphDescription:
      "Side-by-side comparison of Medicare Advantage and Medicare Supplement plans for Spokane-area residents.",
    h1: "Medicare Advantage vs. Medicare Supplement in Spokane",
    renderedSha256:
      "fa686d4e90cb95d85c3e66062141cf288518288811c1fbf660aead7d48f4e20d",
    renderedBytes: 22417,
    schemaTypes: ["FAQPage","WebPage","BreadcrumbList"],
    formCount: 1,
    faqDisclosureCount: 4,
  },
  "represented-carriers": {
    pageTitle: "Medicare Carriers We Represent in Spokane",
    description:
      "Health Insurance Options LLC currently represents 8 organizations offering 75 products in the Spokane area, including Medicare Advantage, Medicare Supplement, Part D, dental, and vision carriers.",
    openGraphTitle: "Medicare Carriers We Represent in Spokane",
    openGraphDescription:
      "The carriers we currently represent for Medicare Advantage, Medicare Supplement, Part D, and supplemental coverage.",
    h1: "Carriers We Represent",
    renderedSha256:
      "23aa771cc4476046d7932026311bfecfa1452083516dbc884bacfb72d8ad2d2d",
    renderedBytes: 16967,
    schemaTypes: ["BreadcrumbList","WebPage"],
    formCount: 0,
    faqDisclosureCount: 0,
  },
};

function preservationRequirements(
  entryId: string,
  snapshot: KnowledgeCmsRouteParitySnapshot,
): KnowledgeCmsRoutePreservationRequirement[] {
  const requirements = new Set<KnowledgeCmsRoutePreservationRequirement>([
    "react_component_tree",
    "related_content",
  ]);
  if (snapshot.schemaTypes.length > 0) {
    requirements.add("structured_data");
  }
  if (snapshot.formCount > 0) {
    requirements.add("lead_form");
  }
  if (snapshot.faqDisclosureCount > 0) {
    requirements.add("faq_disclosures");
  }
  if (entryId === "medicare-faq") {
    requirements.add("governed_faq_registry");
  }
  if (entryId === "represented-carriers") {
    requirements.add("represented_carrier_registry");
  }
  return [...requirements].sort();
}

function freezeManifestEntry(
  entry: KnowledgeCmsRouteParityManifestEntry,
): KnowledgeCmsRouteParityManifestEntry {
  Object.freeze(entry.metadata);
  Object.freeze(entry.renderedBody.schemaTypes);
  Object.freeze(entry.renderedBody);
  Object.freeze(entry.cmsRepresentation.preservationRequirements);
  Object.freeze(entry.cmsRepresentation);
  return Object.freeze(entry);
}

export const knowledgeCmsRouteParityManifest: ReadonlyArray<KnowledgeCmsRouteParityManifestEntry> =
  Object.freeze(knowledgeEntries.flatMap((entry) => {
    const snapshot = routeSnapshotsByEntryId[entry.id];
    const path = routePathByEntryId[entry.id];
    if (!snapshot || !path) {
      return [];
    }
    const canonicalUrl =
      `${KNOWLEDGE_CMS_ROUTE_PARITY_CANONICAL_ORIGIN}${path}`;
    return [
      freezeManifestEntry({
        version: KNOWLEDGE_CMS_ROUTE_PARITY_VERSION,
        mode: KNOWLEDGE_CMS_ROUTE_PARITY_MODE,
        entryId: entry.id,
        path,
        sourceFile: `app${path}/page.tsx`,
        metadata: {
          pageTitle: snapshot.pageTitle,
          description: snapshot.description,
          canonicalUrl,
          openGraphTitle: snapshot.openGraphTitle,
          openGraphDescription: snapshot.openGraphDescription,
          openGraphUrl: canonicalUrl,
          status: "verified",
        },
        renderedBody: {
          capture: KNOWLEDGE_CMS_ROUTE_PARITY_CAPTURE,
          hashAlgorithm: KNOWLEDGE_CMS_ROUTE_PARITY_HASH_ALGORITHM,
          sha256: snapshot.renderedSha256,
          bytes: snapshot.renderedBytes,
          h1: snapshot.h1,
          h1Count: 1,
          schemaTypes: [...snapshot.schemaTypes],
          formCount: snapshot.formCount,
          faqDisclosureCount: snapshot.faqDisclosureCount,
          status: "verified",
        },
        cmsRepresentation: {
          bodyFormat: "markdown",
          status: "blocked",
          preservationRequirements: preservationRequirements(
            entry.id,
            snapshot,
          ),
          reason:
            "The editable CMS Markdown field is not a public body source. A separate revision-bound CMS-native artifact may reproduce this verified route privately, but public cutover still requires fresh all-route parity and reviewed rollback evidence.",
        },
      }),
    ];
  }));

export function getKnowledgeCmsRouteParity(
  entryId: string,
): KnowledgeCmsRouteParityManifestEntry | undefined {
  return knowledgeCmsRouteParityManifest.find(
    (entry) => entry.entryId === entryId,
  );
}

export function validateKnowledgeCmsRouteParityManifest(): string[] {
  const errors: string[] = [];
  const expectedById = new Map(
    knowledgeEntries.map((entry) => [entry.id, entry]),
  );
  const seenIds = new Set<string>();
  const seenPaths = new Set<string>();
  const sha256Pattern = /^[a-f0-9]{64}$/;

  if (
    Object.keys(routeSnapshotsByEntryId).length !== knowledgeEntries.length ||
    Object.keys(routePathByEntryId).length !== knowledgeEntries.length
  ) {
    errors.push(
      "Route parity snapshot count must match the Resource Library entry count.",
    );
  }
  if (siteConfig.url !== KNOWLEDGE_CMS_ROUTE_PARITY_CANONICAL_ORIGIN) {
    errors.push(
      "Route parity canonical origin does not match the production site URL.",
    );
  }

  for (const entry of knowledgeCmsRouteParityManifest) {
    const expected = expectedById.get(entry.entryId);
    if (!expected) {
      errors.push(
        `Route parity entry "${entry.entryId}" does not exist in the Resource Library.`,
      );
      continue;
    }
    if (seenIds.has(entry.entryId)) {
      errors.push(`Route parity entry "${entry.entryId}" is duplicated.`);
    }
    if (seenPaths.has(entry.path)) {
      errors.push(`Route parity path "${entry.path}" is duplicated.`);
    }
    seenIds.add(entry.entryId);
    seenPaths.add(entry.path);

    if (entry.path !== expected.path) {
      errors.push(
        `Route parity entry "${entry.entryId}" does not match its public path.`,
      );
    }
    if (entry.sourceFile !== `app${expected.path}/page.tsx`) {
      errors.push(
        `Route parity entry "${entry.entryId}" has an invalid source file.`,
      );
    }
    if (
      entry.metadata.canonicalUrl !==
        `${KNOWLEDGE_CMS_ROUTE_PARITY_CANONICAL_ORIGIN}${expected.path}` ||
      entry.metadata.openGraphUrl !==
        entry.metadata.canonicalUrl
    ) {
      errors.push(
        `Route parity entry "${entry.entryId}" has invalid canonical metadata.`,
      );
    }
    if (
      !entry.metadata.pageTitle.trim() ||
      !entry.metadata.description.trim() ||
      !entry.metadata.openGraphTitle.trim() ||
      !entry.metadata.openGraphDescription.trim()
    ) {
      errors.push(
        `Route parity entry "${entry.entryId}" has incomplete metadata.`,
      );
    }
    if (
      !sha256Pattern.test(entry.renderedBody.sha256) ||
      entry.renderedBody.bytes <= 0 ||
      !entry.renderedBody.h1.trim() ||
      entry.renderedBody.h1Count !== 1
    ) {
      errors.push(
        `Route parity entry "${entry.entryId}" has an invalid rendered snapshot.`,
      );
    }
    if (
      entry.cmsRepresentation.status !== "blocked" ||
      entry.cmsRepresentation.bodyFormat !== "markdown" ||
      entry.cmsRepresentation.preservationRequirements.length === 0
    ) {
      errors.push(
        `Route parity entry "${entry.entryId}" must fail closed until a lossless renderer exists.`,
      );
    }
  }

  for (const expected of knowledgeEntries) {
    if (!seenIds.has(expected.id)) {
      errors.push(
        `Resource Library entry "${expected.id}" has no route parity snapshot.`,
      );
    }
  }
  for (const protectedPath of ["/", "/medicare-spokane"]) {
    if (seenPaths.has(protectedPath)) {
      errors.push(
        `Protected ranking path "${protectedPath}" must not be a migration target.`,
      );
    }
  }

  return errors;
}
