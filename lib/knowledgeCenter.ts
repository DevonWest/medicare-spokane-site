import { carriers, type Carrier } from "@/lib/carriers";
import { getCityBySlug, spokaneAreaCities, type City } from "@/lib/cities";
import {
  resolveVerifiedEditorialReviewer,
  validateEditorialReviewerVerifications,
} from "@/lib/editorial";
import { siteConfig } from "@/lib/site";
import {
  getActiveTeamMembers,
  getTeamMemberPersonId,
  getTeamMemberSlug,
  isLicensedTeamMember,
  isTeamAuthorityProfileVerified,
  validateTeamAuthorityProfiles,
  type TeamMember,
} from "@/lib/team";
import { getTopicBySlug, medicareTopics, type Topic } from "@/lib/topics";

export type KnowledgeCategoryId =
  | "getting-started"
  | "reviewing-coverage"
  | "family-caregiver"
  | "working-and-medicare"
  | "health-insurance"
  | "more-resources";

export type KnowledgeEntryKind =
  | "comparison"
  | "faq"
  | "guide"
  | "service";

export type KnowledgeReview =
  | {
      status: "needs-review";
    }
  | {
      status: "reviewed";
      reviewedAt: string;
      reviewedByAgentSlug: string;
      reviewerVerificationId: string;
      reviewDueAt?: string;
    };

export interface KnowledgeSource {
  id: string;
  title: string;
  publisher: string;
  url: string;
  summary: string;
  lastChecked: string;
  featuredInLibrary?: boolean;
}

export const KNOWLEDGE_SOURCE_MAX_AGE_DAYS = 180;
export const KNOWLEDGE_REVIEW_MAX_AGE_DAYS = 365;

export interface KnowledgeFaq {
  id: string;
  question: string;
  answer: string;
  topicSlugs: string[];
  answeredByAgentSlug?: string;
}

export interface KnowledgeVideo {
  id: string;
  title: string;
  url: string;
  topicSlugs: string[];
}

export interface KnowledgeDownload {
  id: string;
  title: string;
  path: string;
  topicSlugs: string[];
}

export interface KnowledgeRelationships {
  agentSlugs?: string[];
  carrierNames?: string[];
  citySlugs?: string[];
  downloadIds?: string[];
  entryPaths?: string[];
  faqIds?: string[];
  videoIds?: string[];
}

export interface KnowledgeEntry {
  id: string;
  path: string;
  title: string;
  summary: string;
  categoryId: KnowledgeCategoryId;
  kind: KnowledgeEntryKind;
  order: number;
  listed?: boolean;
  ctaLabel?: string;
  tags: string[];
  topicSlugs: string[];
  authorAgentSlug?: string;
  sourceIds?: string[];
  review?: KnowledgeReview;
  relationships?: KnowledgeRelationships;
}

export interface KnowledgeCategory {
  id: KnowledgeCategoryId;
  title: string;
  intro: string;
  order: number;
}

export interface KnowledgeSection extends KnowledgeCategory {
  items: KnowledgeEntry[];
}

export interface KnowledgeGraph {
  entry: KnowledgeEntry;
  relatedEntries: KnowledgeEntry[];
  topics: Topic[];
  agents: TeamMember[];
  carriers: Carrier[];
  cities: City[];
  faqs: KnowledgeFaq[];
  videos: KnowledgeVideo[];
  downloads: KnowledgeDownload[];
  sources: KnowledgeSource[];
  author?: TeamMember;
  reviewer?: TeamMember;
}

export const knowledgeCategories: KnowledgeCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started with Medicare",
    intro:
      "Start with Spokane-focused guides for enrollment timing, comparing plan types, and understanding your first Medicare decisions.",
    order: 1,
  },
  {
    id: "reviewing-coverage",
    title: "Reviewing or Changing Coverage",
    intro:
      "Review these pages when you want help with prescriptions, plan types, and coverage details before you make a change.",
    order: 2,
  },
  {
    id: "family-caregiver",
    title: "Family / Caregiver Help",
    intro:
      "Support for adult children, spouses, and caregivers helping a loved one review Medicare options with more clarity.",
    order: 3,
  },
  {
    id: "working-and-medicare",
    title: "Working and Medicare",
    intro:
      "Guidance for Spokane-area residents who are still working and want to understand employer coverage and Medicare timing.",
    order: 4,
  },
  {
    id: "health-insurance",
    title: "Health Insurance Help",
    intro:
      "Help for Spokane-area individuals and families reviewing health insurance options when Medicare is not yet a factor.",
    order: 5,
  },
  {
    id: "more-resources",
    title: "More Spokane Medicare Resources",
    intro:
      "Additional guides and supporting pages for common Medicare questions, plan comparisons, and local agency information.",
    order: 6,
  },
];

export const knowledgeSources: KnowledgeSource[] = [
  {
    id: "medicare-official",
    title: "Medicare.gov",
    publisher: "U.S. Centers for Medicare & Medicaid Services",
    url: "https://www.medicare.gov/",
    summary: "The official U.S. government site for Medicare beneficiaries.",
    lastChecked: "2026-07-30",
    featuredInLibrary: true,
  },
  {
    id: "medicare-get-started",
    title: "Get started with Medicare",
    publisher: "Medicare.gov",
    url: "https://www.medicare.gov/basics/get-started-with-medicare",
    summary: "Official Medicare basics and next steps for people approaching eligibility.",
    lastChecked: "2026-07-30",
  },
  {
    id: "medicare-sign-up",
    title: "When can I sign up for Medicare?",
    publisher: "Medicare.gov",
    url: "https://www.medicare.gov/basics/get-started-with-medicare/sign-up/when-can-i-sign-up-for-medicare",
    summary: "Official guidance for Medicare enrollment timing and eligibility situations.",
    lastChecked: "2026-07-30",
  },
  {
    id: "medicare-working-past-65",
    title: "Working past 65",
    publisher: "Medicare.gov",
    url: "https://www.medicare.gov/basics/get-started-with-medicare/medicare-basics/working-past-65",
    summary: "Official guidance for coordinating Medicare with current job-based coverage.",
    lastChecked: "2026-07-30",
  },
  {
    id: "medicare-coverage-options",
    title: "Your Medicare coverage options",
    publisher: "Medicare.gov",
    url: "https://www.medicare.gov/basics/get-started-with-medicare/get-more-coverage/your-coverage-options",
    summary: "Official overview of Original Medicare and Medicare Advantage coverage paths.",
    lastChecked: "2026-07-30",
  },
  {
    id: "medicare-part-d",
    title: "What's Medicare drug coverage (Part D)?",
    publisher: "Medicare.gov",
    url: "https://www.medicare.gov/health-drug-plans/part-d",
    summary: "Official information about Medicare prescription drug coverage.",
    lastChecked: "2026-07-30",
  },
  {
    id: "medicare-special-enrollment",
    title: "Special Enrollment Periods",
    publisher: "Medicare.gov",
    url: "https://www.medicare.gov/basics/get-started-with-medicare/get-more-coverage/joining-a-plan/special-enrollment-periods",
    summary: "Official guidance on plan changes after qualifying life events.",
    lastChecked: "2026-07-30",
  },
  {
    id: "medicare-open-enrollment",
    title: "Medicare Open Enrollment",
    publisher: "Medicare.gov",
    url: "https://www.medicare.gov/health-drug-plans/open-enrollment",
    summary:
      "Official Medicare guidance for the October 15 through December 7 Open Enrollment period.",
    lastChecked: "2026-07-30",
  },
  {
    id: "medicare-plan-compare",
    title: "Medicare Plan Compare",
    publisher: "Medicare.gov",
    url: "https://www.medicare.gov/plan-compare/",
    summary:
      "Official tool for finding Medicare health and drug plans available by location.",
    lastChecked: "2026-07-30",
  },
  {
    id: "medicare-compare-coverage",
    title: "Compare Original Medicare and Medicare Advantage",
    publisher: "Medicare.gov",
    url: "https://www.medicare.gov/basics/get-started-with-medicare/get-more-coverage/your-coverage-options/compare-original-medicare-medicare-advantage",
    summary:
      "Official comparison of Original Medicare and Medicare Advantage coverage considerations.",
    lastChecked: "2026-07-30",
  },
  {
    id: "medicare-savings-programs",
    title: "Medicare Savings Programs",
    publisher: "Medicare.gov",
    url: "https://www.medicare.gov/basics/costs/help/medicare-savings-programs",
    summary:
      "Official information about programs that may help pay Medicare premiums and other costs.",
    lastChecked: "2026-07-30",
  },
  {
    id: "medicare-extra-help",
    title: "Help with Medicare drug costs",
    publisher: "Medicare.gov",
    url: "https://www.medicare.gov/basics/costs/help/drug-costs",
    summary:
      "Official information about Extra Help for Medicare prescription drug costs.",
    lastChecked: "2026-07-30",
  },
  {
    id: "washington-medicare-savings",
    title: "Washington Medicare Savings Program",
    publisher: "Washington State Health Care Authority",
    url: "https://www.hca.wa.gov/free-or-low-cost-health-care/i-need-medical-dental-or-vision-care/medicare-savings-program",
    summary:
      "Official Washington information about Medicare Savings Program assistance.",
    lastChecked: "2026-07-30",
  },
  {
    id: "wa-healthplanfinder",
    title: "Washington Healthplanfinder",
    publisher: "Washington Health Benefit Exchange",
    url: "https://www.wahealthplanfinder.org/",
    summary:
      "Washington's official marketplace for individual and family health coverage.",
    lastChecked: "2026-07-30",
  },
  {
    id: "wa-individual-family",
    title: "Individuals and families",
    publisher: "Washington Healthplanfinder",
    url: "https://www.wahealthplanfinder.org/us/en/health-coverage/who-can-sign-up/individuals-and-families.html",
    summary:
      "Official Washington guidance for individuals and families seeking health coverage.",
    lastChecked: "2026-07-30",
  },
  {
    id: "wa-self-employed",
    title: "Self-employed people",
    publisher: "Washington Healthplanfinder",
    url: "https://www.wahealthplanfinder.org/us/en/health-coverage/who-can-sign-up/self-employed-people.html",
    summary:
      "Official Washington coverage guidance for self-employed people and contractors.",
    lastChecked: "2026-07-30",
  },
  {
    id: "wa-special-enrollment",
    title: "Open Enrollment vs. Special Enrollment",
    publisher: "Washington Healthplanfinder",
    url: "https://www.wahealthplanfinder.org/us/en/health-coverage/get-started/special-enrollment-en.html",
    summary:
      "Official Washington guidance about open enrollment, qualifying events, and special enrollment.",
    lastChecked: "2026-07-30",
  },
  {
    id: "wa-broker-help",
    title: "Find local health coverage help",
    publisher: "Washington Healthplanfinder",
    url: "https://www.wahealthplanfinder.org/us/en/tools-and-resources/connect-with-us.html",
    summary:
      "Official information about Washington navigators and insurance brokers who can help with enrollment.",
    lastChecked: "2026-07-30",
  },
  {
    id: "wa-oic-individual-plans",
    title: "Individual and family health plans and premiums",
    publisher: "Washington State Office of the Insurance Commissioner",
    url: "https://www.insurance.wa.gov/insurance-resources/health-insurance/health-insurance-coverage/individual-and-family-health-plans-premiums",
    summary:
      "Official Washington information about individual and family plans sold on and off the Exchange.",
    lastChecked: "2026-07-30",
  },
  {
    id: "washington-shiba",
    title: "Washington SHIBA (SHIP)",
    publisher: "Washington State Office of the Insurance Commissioner",
    url: "https://www.insurance.wa.gov/statewide-health-insurance-benefits-advisors-shiba",
    summary:
      "Washington State's Statewide Health Insurance Benefits Advisors — free Medicare counseling through the state's SHIP program.",
    lastChecked: "2026-07-30",
    featuredInLibrary: true,
  },
  {
    id: "social-security-medicare",
    title: "Social Security Administration",
    publisher: "Social Security Administration",
    url: "https://www.ssa.gov/medicare/",
    summary:
      "Apply for Medicare and learn about enrollment timelines through the Social Security Administration.",
    lastChecked: "2026-07-30",
    featuredInLibrary: true,
  },
];

export const knowledgeFaqs: KnowledgeFaq[] = [
  {
    id: "initial-enrollment-period",
    question: "When am I eligible to enroll in Medicare?",
    answer:
      "Most people first become eligible during the seven-month Initial Enrollment Period around the month they turn 65. Some people qualify earlier because of disability or certain conditions.",
    topicSlugs: ["medicare-enrollment", "medicare-for-seniors"],
  },
  {
    id: "employer-coverage",
    question: "Can I keep employer coverage after I become eligible for Medicare?",
    answer:
      "Sometimes. The right timing depends on the job-based coverage, who is actively employed, and how that coverage works with Medicare.",
    topicSlugs: ["medicare-enrollment", "medicare-for-seniors"],
  },
  {
    id: "provider-access",
    question: "Can I keep my doctors after switching to Medicare?",
    answer:
      "Provider access depends on the coverage path and plan. Original Medicare and Medicare Advantage plans use different provider-access rules.",
    topicSlugs: ["medicare-advantage", "medicare-supplement"],
  },
  {
    id: "part-d-basics",
    question: "What is Medicare Part D?",
    answer:
      "Part D is Medicare prescription drug coverage. It is available through private companies approved by Medicare, either as a standalone plan or within many Medicare Advantage plans.",
    topicSlugs: ["medicare-part-d"],
  },
];

export const knowledgeVideos: KnowledgeVideo[] = [];
export const knowledgeDownloads: KnowledgeDownload[] = [];

export const knowledgeEntries: KnowledgeEntry[] = [
  {
    id: "turning-65-spokane",
    path: "/turning-65-medicare-spokane",
    title: "Turning 65 in Spokane",
    summary:
      "Use a local checklist to understand enrollment timing, employer coverage questions, and the next steps before Medicare begins.",
    categoryId: "getting-started",
    kind: "guide",
    order: 1,
    ctaLabel: "Read More",
    tags: ["enrollment", "turning-65", "planning"],
    topicSlugs: ["medicare-enrollment", "medicare-for-seniors"],
    sourceIds: ["medicare-get-started", "medicare-sign-up"],
    review: { status: "needs-review" },
    relationships: {
      citySlugs: ["spokane"],
      entryPaths: [
        "/compare-medicare-options",
        "/medicare-advantage",
        "/medicare-supplements",
        "/medicare-part-d",
        "/rx-drug-review",
      ],
    },
  },
  {
    id: "compare-options",
    path: "/compare-medicare-options",
    title: "Compare Medicare Options",
    summary:
      "Review Medicare Advantage, Medicare Supplement, Part D, and related coverage types from the plans we represent.",
    categoryId: "getting-started",
    kind: "comparison",
    order: 2,
    ctaLabel: "Read More",
    tags: ["comparison", "planning", "plan-types"],
    topicSlugs: [
      "medicare-advantage",
      "medicare-supplement",
      "medicare-part-d",
    ],
    sourceIds: [
      "medicare-coverage-options",
      "medicare-compare-coverage",
      "medicare-part-d",
    ],
    review: { status: "needs-review" },
    relationships: { citySlugs: ["spokane"] },
  },
  {
    id: "medicare-advantage",
    path: "/medicare-advantage",
    title: "Medicare Advantage",
    summary:
      "Learn how Medicare Advantage plans work, including network, cost, prescription, and extra-benefit questions to review.",
    categoryId: "more-resources",
    kind: "guide",
    order: 7,
    listed: false,
    tags: ["networks", "plan-types", "prescriptions"],
    topicSlugs: ["medicare-advantage"],
    sourceIds: ["medicare-coverage-options"],
    review: { status: "needs-review" },
    relationships: { citySlugs: ["spokane"] },
  },
  {
    id: "medicare-supplements",
    path: "/medicare-supplements",
    title: "Medicare Supplements",
    summary:
      "Understand how Medicare Supplement insurance works with Original Medicare and what to compare before choosing a policy.",
    categoryId: "more-resources",
    kind: "guide",
    order: 8,
    listed: false,
    tags: ["costs", "original-medicare", "plan-types"],
    topicSlugs: ["medicare-supplement"],
    sourceIds: ["medicare-coverage-options"],
    review: { status: "needs-review" },
    relationships: { citySlugs: ["spokane"] },
  },
  {
    id: "appointment-checklist",
    path: "/medicare-appointment-checklist",
    title: "What to Bring to Your Medicare Appointment",
    summary:
      "Use this simple checklist to organize prescriptions, doctors, pharmacies, and questions before your visit.",
    categoryId: "getting-started",
    kind: "guide",
    order: 3,
    ctaLabel: "Read More",
    tags: ["checklist", "doctors", "planning", "prescriptions"],
    topicSlugs: ["medicare-enrollment", "medicare-part-d"],
    sourceIds: ["medicare-get-started"],
    review: { status: "needs-review" },
    relationships: { citySlugs: ["spokane"] },
  },
  {
    id: "annual-plan-review",
    path: "/medicare-plan-review-spokane",
    title: "Annual Medicare Plan Review",
    summary:
      "Review plan changes, prescriptions, doctors, pharmacies, and out-of-pocket costs before the next plan year.",
    categoryId: "reviewing-coverage",
    kind: "service",
    order: 1,
    ctaLabel: "Get Help",
    tags: ["annual-review", "costs", "doctors", "prescriptions"],
    topicSlugs: ["medicare-annual-enrollment", "medicare-part-d"],
    sourceIds: ["medicare-open-enrollment", "medicare-part-d"],
    review: { status: "needs-review" },
    relationships: { citySlugs: ["spokane"] },
  },
  {
    id: "annual-enrollment-spokane",
    path: "/medicare-annual-enrollment-spokane",
    title: "Medicare Annual Enrollment Help in Spokane",
    summary:
      "Plain-language overview of the Annual Enrollment Period (Oct 15 – Dec 7) and what to review for the next plan year.",
    categoryId: "reviewing-coverage",
    kind: "guide",
    order: 2,
    ctaLabel: "Get Help",
    tags: ["annual-enrollment", "annual-review", "plan-changes"],
    topicSlugs: ["medicare-annual-enrollment"],
    sourceIds: ["medicare-open-enrollment"],
    review: { status: "needs-review" },
    relationships: { citySlugs: ["spokane"] },
  },
  {
    id: "prescription-review",
    path: "/rx-drug-review",
    title: "Prescription Drug Review",
    summary:
      "Bring your medication list and compare how Medicare Advantage and Part D plans we represent may cover your prescriptions.",
    categoryId: "reviewing-coverage",
    kind: "service",
    order: 3,
    ctaLabel: "Get Help",
    tags: ["pharmacies", "prescriptions", "review"],
    topicSlugs: ["medicare-advantage", "medicare-part-d"],
    sourceIds: ["medicare-part-d"],
    review: { status: "needs-review" },
    relationships: { citySlugs: ["spokane"] },
  },
  {
    id: "part-d",
    path: "/medicare-part-d",
    title: "Medicare Part D",
    summary:
      "Learn how standalone prescription drug coverage works, what changes year to year, and what to review before enrolling.",
    categoryId: "reviewing-coverage",
    kind: "guide",
    order: 4,
    ctaLabel: "Read More",
    tags: ["part-d", "pharmacies", "prescriptions"],
    topicSlugs: ["medicare-part-d"],
    sourceIds: ["medicare-part-d"],
    review: { status: "needs-review" },
    relationships: { citySlugs: ["spokane"] },
  },
  {
    id: "helping-parent",
    path: "/helping-parent-with-medicare",
    title: "Helping a Parent with Medicare",
    summary:
      "Review plan options, prescriptions, doctors, and next steps when you are helping a parent or loved one.",
    categoryId: "family-caregiver",
    kind: "guide",
    order: 1,
    ctaLabel: "Get Help",
    tags: ["caregivers", "doctors", "family", "prescriptions"],
    topicSlugs: [
      "medicare-advantage",
      "medicare-supplement",
      "medicare-part-d",
    ],
    sourceIds: ["medicare-coverage-options", "medicare-part-d"],
    review: { status: "needs-review" },
    relationships: {
      citySlugs: ["spokane"],
      entryPaths: [
        "/compare-medicare-options",
        "/rx-drug-review",
        "/medicare-advantage",
        "/medicare-supplements",
        "/medicare-part-d",
      ],
    },
  },
  {
    id: "working-past-65",
    path: "/working-past-65-medicare",
    title: "Working Past 65 and Medicare",
    summary:
      "Understand Medicare timing, employer coverage questions, Part B, Part D, and HSA-related concerns.",
    categoryId: "working-and-medicare",
    kind: "guide",
    order: 1,
    ctaLabel: "Read More",
    tags: ["employer-coverage", "enrollment", "hsa", "turning-65"],
    topicSlugs: ["medicare-enrollment", "medicare-for-seniors"],
    sourceIds: ["medicare-working-past-65", "medicare-sign-up"],
    review: { status: "needs-review" },
    relationships: {
      citySlugs: ["spokane"],
      entryPaths: [
        "/turning-65-medicare-spokane",
        "/compare-medicare-options",
        "/medicare-part-d",
        "/medicare-supplements",
      ],
    },
  },
  {
    id: "health-insurance-spokane",
    path: "/health-insurance-spokane",
    title: "Health Insurance Help in Spokane",
    summary:
      "Local guidance for individuals, families, self-employed workers, and people not yet eligible for Medicare reviewing health insurance options.",
    categoryId: "health-insurance",
    kind: "service",
    order: 1,
    ctaLabel: "Read More",
    tags: ["families", "health-insurance", "individuals"],
    topicSlugs: [],
    sourceIds: ["wa-healthplanfinder", "wa-oic-individual-plans"],
    review: { status: "needs-review" },
    relationships: { citySlugs: ["spokane"] },
  },
  {
    id: "health-insurance-agent",
    path: "/health-insurance-agent-spokane",
    title: "Health Insurance Agent in Spokane",
    summary:
      "Work with a local Spokane health insurance agent to review coverage options for individuals, families, self-employed workers, and people losing employer coverage.",
    categoryId: "health-insurance",
    kind: "service",
    order: 2,
    ctaLabel: "Read More",
    tags: ["agent", "families", "health-insurance", "individuals"],
    topicSlugs: [],
    sourceIds: ["wa-broker-help", "wa-oic-individual-plans"],
    review: { status: "needs-review" },
    relationships: { citySlugs: ["spokane"] },
  },
  {
    id: "individual-family-health-insurance",
    path: "/individual-family-health-insurance-spokane",
    title: "Individual & Family Health Insurance",
    summary:
      "Help for Spokane-area individuals and families reviewing health insurance options before Medicare.",
    categoryId: "health-insurance",
    kind: "guide",
    order: 3,
    ctaLabel: "Read More",
    tags: ["families", "health-insurance", "individuals"],
    topicSlugs: [],
    sourceIds: ["wa-individual-family", "wa-oic-individual-plans"],
    review: { status: "needs-review" },
    relationships: { citySlugs: ["spokane"] },
  },
  {
    id: "self-employed-health-insurance",
    path: "/self-employed-health-insurance-spokane",
    title: "Self-Employed Health Insurance",
    summary:
      "Guidance for self-employed workers, contractors, small business owners, and people without employer coverage.",
    categoryId: "health-insurance",
    kind: "guide",
    order: 4,
    ctaLabel: "Read More",
    tags: ["health-insurance", "self-employed", "small-business"],
    topicSlugs: [],
    sourceIds: ["wa-self-employed", "wa-healthplanfinder"],
    review: { status: "needs-review" },
    relationships: { citySlugs: ["spokane"] },
  },
  {
    id: "special-enrollment-health-insurance",
    path: "/health-insurance-special-enrollment-spokane",
    title: "Special Enrollment Health Insurance",
    summary:
      "Help understanding enrollment timing after lost coverage, a move, household changes, or another qualifying event.",
    categoryId: "health-insurance",
    kind: "guide",
    order: 5,
    ctaLabel: "Read More",
    tags: ["health-insurance", "lost-coverage", "special-enrollment"],
    topicSlugs: [],
    sourceIds: ["wa-special-enrollment"],
    review: { status: "needs-review" },
    relationships: { citySlugs: ["spokane"] },
  },
  {
    id: "enrollment-resources",
    path: "/medicare-enrollment-resources",
    title: "Medicare Enrollment Resources",
    summary:
      "Initial Enrollment Period, Annual Enrollment Period, and Special Enrollment Periods explained in plain language.",
    categoryId: "more-resources",
    kind: "guide",
    order: 1,
    tags: ["annual-enrollment", "enrollment", "special-enrollment"],
    topicSlugs: ["medicare-enrollment", "medicare-annual-enrollment"],
    sourceIds: [
      "medicare-sign-up",
      "medicare-special-enrollment",
      "social-security-medicare",
    ],
    review: { status: "needs-review" },
    relationships: { citySlugs: ["spokane"] },
  },
  {
    id: "moving-to-spokane",
    path: "/moving-to-spokane-medicare",
    title: "Moving to Spokane & Medicare",
    summary:
      "Why Medicare Advantage and Part D options can vary by county, ZIP code, network, and pharmacy when you move.",
    categoryId: "more-resources",
    kind: "guide",
    order: 2,
    tags: ["moving", "networks", "special-enrollment", "zip-code"],
    topicSlugs: ["medicare-advantage", "medicare-part-d"],
    sourceIds: ["medicare-special-enrollment"],
    review: { status: "needs-review" },
    relationships: {
      citySlugs: spokaneAreaCities.map((city) => city.slug),
    },
  },
  {
    id: "medicare-savings-extra-help",
    path: "/medicare-savings-program-extra-help-washington",
    title: "Medicare Savings Program & Extra Help (Washington)",
    summary:
      "Educational overview of programs that may help with Medicare costs, including Medicare Savings Programs, Apple Health, and Extra Help.",
    categoryId: "more-resources",
    kind: "guide",
    order: 3,
    tags: ["costs", "extra-help", "washington"],
    topicSlugs: ["medicare-part-d"],
    sourceIds: [
      "medicare-savings-programs",
      "medicare-extra-help",
      "washington-medicare-savings",
      "washington-shiba",
    ],
    review: { status: "needs-review" },
    relationships: { citySlugs: ["spokane"] },
  },
  {
    id: "medicare-faq",
    path: "/medicare-faq",
    title: "Medicare FAQ",
    summary:
      "Common Medicare questions we hear from Spokane-area residents — answered without the jargon.",
    categoryId: "more-resources",
    kind: "faq",
    order: 4,
    tags: ["faq", "medicare-basics"],
    topicSlugs: medicareTopics.map((topic) => topic.slug),
    sourceIds: ["medicare-get-started", "medicare-official"],
    review: { status: "needs-review" },
    relationships: {
      citySlugs: ["spokane"],
      faqIds: knowledgeFaqs.map((faq) => faq.id),
    },
  },
  {
    id: "advantage-vs-supplement",
    path: "/medicare-advantage-vs-supplement-spokane",
    title: "Medicare Advantage vs. Medicare Supplement",
    summary:
      "Review how Medicare Advantage and Medicare Supplement coverage compare before choosing a direction.",
    categoryId: "more-resources",
    kind: "comparison",
    order: 5,
    tags: ["comparison", "plan-types"],
    topicSlugs: ["medicare-advantage", "medicare-supplement"],
    sourceIds: [
      "medicare-coverage-options",
      "medicare-compare-coverage",
    ],
    review: { status: "needs-review" },
    relationships: { citySlugs: ["spokane"] },
  },
  {
    id: "represented-carriers",
    path: "/carriers",
    title: "Carriers We Represent",
    summary:
      "See the carriers we currently work with for Medicare Advantage, Medicare Supplement, and Part D coverage in Spokane.",
    categoryId: "more-resources",
    kind: "service",
    order: 6,
    tags: ["carriers", "plan-types"],
    topicSlugs: [
      "medicare-advantage",
      "medicare-supplement",
      "medicare-part-d",
    ],
    sourceIds: ["medicare-plan-compare"],
    review: { status: "needs-review" },
    relationships: {
      citySlugs: ["spokane"],
      carrierNames: carriers.map((carrier) => carrier.name),
    },
  },
];

const entryByPath = new Map(knowledgeEntries.map((entry) => [entry.path, entry]));
const sourceById = new Map(knowledgeSources.map((source) => [source.id, source]));
const faqById = new Map(knowledgeFaqs.map((faq) => [faq.id, faq]));
const videoById = new Map(knowledgeVideos.map((video) => [video.id, video]));
const downloadById = new Map(
  knowledgeDownloads.map((download) => [download.id, download]),
);

const topicCarrierProductTypes: Partial<
  Record<string, Carrier["productTypes"][number]>
> = {
  "medicare-advantage": "Medicare Advantage",
  "medicare-part-d": "Medicare Part D",
  "medicare-supplement": "Medicare Supplement",
};

const topicAgentSpecialties: Partial<Record<string, string[]>> = {
  "medicare-advantage": ["Medicare Advantage"],
  "medicare-annual-enrollment": ["Plan Reviews", "Coverage Reviews"],
  "medicare-enrollment": ["Turning 65", "Local Medicare Guidance"],
  "medicare-for-seniors": ["Turning 65", "Local Medicare Guidance"],
  "medicare-part-d": ["Medicare Part D", "Prescription Reviews"],
  "medicare-supplement": [
    "Medicare Supplement (Medigap)",
    "Medicare Supplement",
  ],
};

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function addUtcDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function resolveAsOfDate(asOf: string | Date): Date {
  return typeof asOf === "string" ? parseDateOnly(asOf) : asOf;
}

export function isKnowledgeSourceExpired(
  source: Pick<KnowledgeSource, "lastChecked">,
  asOf: string | Date = new Date(),
): boolean {
  const checkedAt = parseDateOnly(source.lastChecked);

  if (Number.isNaN(checkedAt.getTime())) {
    return true;
  }

  return (
    resolveAsOfDate(asOf).getTime() >
    addUtcDays(checkedAt, KNOWLEDGE_SOURCE_MAX_AGE_DAYS).getTime()
  );
}

export function isKnowledgeReviewExpired(
  review: KnowledgeReview,
  asOf: string | Date = new Date(),
): boolean {
  if (review.status !== "reviewed") {
    return false;
  }

  const reviewedAt = parseDateOnly(review.reviewedAt);
  const dueAt = review.reviewDueAt
    ? parseDateOnly(review.reviewDueAt)
    : addUtcDays(reviewedAt, KNOWLEDGE_REVIEW_MAX_AGE_DAYS);

  if (
    Number.isNaN(reviewedAt.getTime()) ||
    Number.isNaN(dueAt.getTime())
  ) {
    return true;
  }

  return resolveAsOfDate(asOf).getTime() > dueAt.getTime();
}

function intersectCount(left: string[], right: string[]): number {
  const rightSet = new Set(right);
  return left.filter((value) => rightSet.has(value)).length;
}

function dedupeBy<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getExplicitRelatedIndex(
  entry: KnowledgeEntry,
  candidate: KnowledgeEntry,
): number {
  return entry.relationships?.entryPaths?.indexOf(candidate.path) ?? -1;
}

function getRelationshipScore(
  entry: KnowledgeEntry,
  candidate: KnowledgeEntry,
): number {
  let score = 0;

  if (entry.categoryId === candidate.categoryId) {
    score += 100;
  }

  score += intersectCount(entry.topicSlugs, candidate.topicSlugs) * 40;
  score += intersectCount(entry.tags, candidate.tags) * 10;
  score +=
    intersectCount(
      entry.relationships?.citySlugs ?? [],
      candidate.relationships?.citySlugs ?? [],
    ) * 4;

  return score;
}

export function getKnowledgeEntryByPath(
  path: string,
): KnowledgeEntry | undefined {
  return entryByPath.get(path);
}

export function getKnowledgeSections(): KnowledgeSection[] {
  return [...knowledgeCategories]
    .sort((left, right) => left.order - right.order)
    .map((category) => ({
      ...category,
      items: knowledgeEntries
        .filter(
          (entry) =>
            entry.categoryId === category.id && entry.listed !== false,
        )
        .sort((left, right) => left.order - right.order),
    }));
}

export function getFeaturedKnowledgeSources(): KnowledgeSource[] {
  return knowledgeSources.filter((source) => source.featuredInLibrary);
}

export function getRelatedKnowledgeEntries(
  path: string,
  limit = 6,
): KnowledgeEntry[] {
  const entry = getKnowledgeEntryByPath(path);
  if (!entry || limit <= 0) {
    return [];
  }

  return knowledgeEntries
    .filter((candidate) => candidate.path !== entry.path)
    .map((candidate) => ({
      candidate,
      explicitIndex: getExplicitRelatedIndex(entry, candidate),
      score: getRelationshipScore(entry, candidate),
    }))
    .filter(({ explicitIndex, score }) => explicitIndex >= 0 || score > 0)
    .sort((left, right) => {
      const leftIsExplicit = left.explicitIndex >= 0;
      const rightIsExplicit = right.explicitIndex >= 0;

      if (leftIsExplicit && rightIsExplicit) {
        return left.explicitIndex - right.explicitIndex;
      }

      if (leftIsExplicit !== rightIsExplicit) {
        return leftIsExplicit ? -1 : 1;
      }

      return (
        right.score - left.score ||
        left.candidate.order - right.candidate.order ||
        left.candidate.title.localeCompare(right.candidate.title)
      );
    })
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

function getRelatedTopics(entry: KnowledgeEntry): Topic[] {
  return entry.topicSlugs
    .map((slug) => getTopicBySlug(slug))
    .filter((topic): topic is Topic => Boolean(topic));
}

function getRelatedCities(entry: KnowledgeEntry): City[] {
  return (entry.relationships?.citySlugs ?? [])
    .map((slug) => getCityBySlug(slug))
    .filter((city): city is City => Boolean(city));
}

function getRelatedCarriers(entry: KnowledgeEntry): Carrier[] {
  const explicitNames = new Set(entry.relationships?.carrierNames ?? []);
  const productTypes = new Set(
    entry.topicSlugs
      .map((slug) => topicCarrierProductTypes[slug])
      .filter(
        (
          productType,
        ): productType is Carrier["productTypes"][number] =>
          Boolean(productType),
      ),
  );

  return carriers.filter(
    (carrier) =>
      explicitNames.has(carrier.name) ||
      carrier.productTypes.some((productType) => productTypes.has(productType)),
  );
}

function getRelatedAgents(entry: KnowledgeEntry): TeamMember[] {
  const explicitSlugs = new Set(entry.relationships?.agentSlugs ?? []);
  const specialties = new Set(
    entry.topicSlugs.flatMap((slug) => topicAgentSpecialties[slug] ?? []),
  );

  return getActiveTeamMembers().filter(
    (agent) =>
      isLicensedTeamMember(agent) &&
      (explicitSlugs.has(getTeamMemberSlug(agent)) ||
        (agent.specialties ?? []).some((specialty) =>
          specialties.has(specialty),
        )),
  );
}

function getRelatedFaqs(entry: KnowledgeEntry): KnowledgeFaq[] {
  const explicitFaqs = (entry.relationships?.faqIds ?? [])
    .map((id) => faqById.get(id))
    .filter((faq): faq is KnowledgeFaq => Boolean(faq));
  const topicFaqs = knowledgeFaqs.filter(
    (faq) => intersectCount(entry.topicSlugs, faq.topicSlugs) > 0,
  );

  return dedupeBy([...explicitFaqs, ...topicFaqs], (faq) => faq.id);
}

export function getKnowledgeGraph(path: string): KnowledgeGraph | undefined {
  const entry = getKnowledgeEntryByPath(path);
  if (!entry) {
    return undefined;
  }

  const review =
    entry.review?.status === "reviewed" &&
    !isKnowledgeReviewExpired(entry.review)
      ? entry.review
      : undefined;
  const reviewer = review
    ? resolveVerifiedEditorialReviewer(
        review.reviewedByAgentSlug,
        review.reviewerVerificationId,
      )
    : undefined;
  const author = entry.authorAgentSlug
    ? getActiveTeamMembers().find(
        (agent) =>
          getTeamMemberSlug(agent) === entry.authorAgentSlug &&
          isTeamAuthorityProfileVerified(agent) &&
          agent.authority?.authoredKnowledgePaths?.includes(entry.path),
      )
    : undefined;

  return {
    entry,
    relatedEntries: getRelatedKnowledgeEntries(path),
    topics: getRelatedTopics(entry),
    agents: getRelatedAgents(entry),
    carriers: getRelatedCarriers(entry),
    cities: getRelatedCities(entry),
    faqs: getRelatedFaqs(entry),
    videos: (entry.relationships?.videoIds ?? [])
      .map((id) => videoById.get(id))
      .filter((video): video is KnowledgeVideo => Boolean(video)),
    downloads: (entry.relationships?.downloadIds ?? [])
      .map((id) => downloadById.get(id))
      .filter((download): download is KnowledgeDownload => Boolean(download)),
    sources: (entry.sourceIds ?? [])
      .map((id) => sourceById.get(id))
      .filter((source): source is KnowledgeSource => Boolean(source)),
    author,
    reviewer,
  };
}

export function buildKnowledgePageSchema(
  path: string,
): Record<string, unknown> | undefined {
  const graph = getKnowledgeGraph(path);
  if (!graph) {
    return undefined;
  }

  const review =
    graph.entry.review?.status === "reviewed"
      ? graph.entry.review
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${siteConfig.url}${graph.entry.path}#webpage`,
    url: `${siteConfig.url}${graph.entry.path}`,
    name: graph.entry.title,
    description: graph.entry.summary,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${siteConfig.url}#website`,
      name: siteConfig.name,
      url: siteConfig.url,
    },
    publisher: {
      "@type": "InsuranceAgency",
      "@id": `${siteConfig.url}#organization`,
      name: siteConfig.legalName,
    },
    author: graph.author
      ? {
          "@type": "Person",
          "@id": getTeamMemberPersonId(graph.author),
          name: graph.author.name,
          url: getTeamMemberPersonId(graph.author),
        }
      : {
          "@id": `${siteConfig.url}#organization`,
        },
    publishingPrinciples: `${siteConfig.url}${siteConfig.editorialStandardsPath}`,
    about: [
      ...graph.topics.map((topic) => ({
        "@type": "Thing",
        name: topic.title,
      })),
      ...graph.cities.map((city) => ({
        "@type": "City",
        name: `${city.name}, ${city.stateCode}`,
      })),
    ],
    citation: graph.sources.map((source) => source.url),
    ...(review && graph.reviewer
      ? {
          dateModified: review.reviewedAt,
          reviewedBy: {
            "@type": "Person",
            "@id": getTeamMemberPersonId(graph.reviewer),
            name: graph.reviewer.name,
            jobTitle: graph.reviewer.title,
            url: getTeamMemberPersonId(graph.reviewer),
            worksFor: {
              "@id": `${siteConfig.url}#organization`,
            },
          },
        }
      : {}),
  };
}

export function validateKnowledgeCenter(
  asOf: string | Date = new Date(),
): string[] {
  const errors: string[] = [
    ...validateEditorialReviewerVerifications(asOf),
    ...validateTeamAuthorityProfiles(asOf),
  ];
  const categoryIds = new Set(
    knowledgeCategories.map((category) => category.id),
  );
  const entryIds = new Set<string>();
  const entryPaths = new Set<string>();
  const sourceIds = new Set(knowledgeSources.map((source) => source.id));
  const faqIds = new Set(knowledgeFaqs.map((faq) => faq.id));
  const videoIds = new Set(knowledgeVideos.map((video) => video.id));
  const downloadIds = new Set(
    knowledgeDownloads.map((download) => download.id),
  );
  const carrierNames = new Set(carriers.map((carrier) => carrier.name));
  const agentBySlug = new Map(
    getActiveTeamMembers().map((agent) => [getTeamMemberSlug(agent), agent]),
  );

  for (const source of knowledgeSources) {
    if (!source.url.startsWith("https://")) {
      errors.push(`Source ${source.id} must use HTTPS.`);
    }

    if (Number.isNaN(Date.parse(source.lastChecked))) {
      errors.push(`Source ${source.id} has an invalid lastChecked date.`);
    } else if (isKnowledgeSourceExpired(source, asOf)) {
      errors.push(
        `Source ${source.id} is overdue for its official-link and accuracy check.`,
      );
    }
  }

  for (const faq of knowledgeFaqs) {
    if (!faq.answeredByAgentSlug) {
      continue;
    }

    const answerer = agentBySlug.get(faq.answeredByAgentSlug);
    if (!answerer) {
      errors.push(
        `FAQ ${faq.id} references unknown answerer ${faq.answeredByAgentSlug}.`,
      );
    } else if (!answerer.authority?.answeredFaqIds?.includes(faq.id)) {
      errors.push(
        `FAQ ${faq.id} is missing from ${answerer.name}'s verified answered-question list.`,
      );
    }
  }

  for (const entry of knowledgeEntries) {
    if (entryIds.has(entry.id)) {
      errors.push(`Duplicate entry id: ${entry.id}.`);
    }
    entryIds.add(entry.id);

    if (entryPaths.has(entry.path)) {
      errors.push(`Duplicate entry path: ${entry.path}.`);
    }
    entryPaths.add(entry.path);

    if (!entry.path.startsWith("/") || entry.path.endsWith("/")) {
      errors.push(`Entry ${entry.id} must use a canonical internal path.`);
    }

    if (!categoryIds.has(entry.categoryId)) {
      errors.push(
        `Entry ${entry.id} references unknown category ${entry.categoryId}.`,
      );
    }

    for (const topicSlug of entry.topicSlugs) {
      if (!getTopicBySlug(topicSlug)) {
        errors.push(
          `Entry ${entry.id} references unknown topic ${topicSlug}.`,
        );
      }
    }

    for (const sourceId of entry.sourceIds ?? []) {
      if (!sourceIds.has(sourceId)) {
        errors.push(
          `Entry ${entry.id} references unknown source ${sourceId}.`,
        );
      }
    }

    if (entry.authorAgentSlug) {
      const author = agentBySlug.get(entry.authorAgentSlug);

      if (!author) {
        errors.push(
          `Entry ${entry.id} references unknown author ${entry.authorAgentSlug}.`,
        );
      } else if (
        !author.authority?.authoredKnowledgePaths?.includes(entry.path)
      ) {
        errors.push(
          `Entry ${entry.id} is missing from ${author.name}'s verified authored-page list.`,
        );
      }
    }

    for (const path of entry.relationships?.entryPaths ?? []) {
      if (!entryByPath.has(path)) {
        errors.push(
          `Entry ${entry.id} references unknown related path ${path}.`,
        );
      }

      if (path === entry.path) {
        errors.push(`Entry ${entry.id} cannot relate to itself.`);
      }
    }

    for (const agentSlug of entry.relationships?.agentSlugs ?? []) {
      if (!agentBySlug.has(agentSlug)) {
        errors.push(
          `Entry ${entry.id} references unknown agent ${agentSlug}.`,
        );
      }
    }

    for (const carrierName of entry.relationships?.carrierNames ?? []) {
      if (!carrierNames.has(carrierName)) {
        errors.push(
          `Entry ${entry.id} references unknown carrier ${carrierName}.`,
        );
      }
    }

    for (const citySlug of entry.relationships?.citySlugs ?? []) {
      if (!getCityBySlug(citySlug)) {
        errors.push(
          `Entry ${entry.id} references unknown city ${citySlug}.`,
        );
      }
    }

    for (const faqId of entry.relationships?.faqIds ?? []) {
      if (!faqIds.has(faqId)) {
        errors.push(`Entry ${entry.id} references unknown FAQ ${faqId}.`);
      }
    }

    for (const videoId of entry.relationships?.videoIds ?? []) {
      if (!videoIds.has(videoId)) {
        errors.push(`Entry ${entry.id} references unknown video ${videoId}.`);
      }
    }

    for (const downloadId of entry.relationships?.downloadIds ?? []) {
      if (!downloadIds.has(downloadId)) {
        errors.push(
          `Entry ${entry.id} references unknown download ${downloadId}.`,
        );
      }
    }

    if (entry.review?.status === "reviewed") {
      const reviewer = resolveVerifiedEditorialReviewer(
        entry.review.reviewedByAgentSlug,
        entry.review.reviewerVerificationId,
        asOf,
      );

      if (!reviewer) {
        errors.push(
          `Entry ${entry.id} must reference a current verified editorial reviewer.`,
        );
      }

      if (Number.isNaN(Date.parse(entry.review.reviewedAt))) {
        errors.push(`Entry ${entry.id} has an invalid reviewedAt date.`);
      }

      if (
        entry.review.reviewDueAt &&
        Number.isNaN(Date.parse(entry.review.reviewDueAt))
      ) {
        errors.push(`Entry ${entry.id} has an invalid reviewDueAt date.`);
      }

      if (isKnowledgeReviewExpired(entry.review, asOf)) {
        errors.push(
          `Entry ${entry.id} has an expired licensed-review claim.`,
        );
      }

      if ((entry.sourceIds ?? []).length === 0) {
        errors.push(`Reviewed entry ${entry.id} must include a source.`);
      }
    }
  }

  for (const [agentSlug, agent] of agentBySlug) {
    for (const path of agent.authority?.authoredKnowledgePaths ?? []) {
      const entry = entryByPath.get(path);

      if (!entry) {
        errors.push(`${agent.name} references unknown authored page ${path}.`);
      } else if (entry.authorAgentSlug !== agentSlug) {
        errors.push(
          `${agent.name}'s authored page ${path} does not carry the matching author attribution.`,
        );
      }
    }

    for (const faqId of agent.authority?.answeredFaqIds ?? []) {
      const faq = faqById.get(faqId);

      if (!faq) {
        errors.push(`${agent.name} references unknown answered FAQ ${faqId}.`);
      } else if (faq.answeredByAgentSlug !== agentSlug) {
        errors.push(
          `${agent.name}'s answered FAQ ${faqId} does not carry the matching answer attribution.`,
        );
      }
    }
  }

  return errors;
}
