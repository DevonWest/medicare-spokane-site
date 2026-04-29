export type Topic = {
  title: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  keywords: string[];
  benefits: string[];
};

export const medicareTopics: Topic[] = [
  {
    title: "Medicare Advantage (Part C)",
    slug: "medicare-advantage",
    shortDescription:
      "Medicare Advantage plans bundle hospital, medical, and often drug coverage into one convenient plan offered by private insurers.",
    longDescription:
      "Medicare Advantage (Part C) is an alternative to Original Medicare offered by Medicare-approved private insurance companies. These plans must cover everything Original Medicare covers and often include additional benefits like dental, vision, hearing, and prescription drug coverage. Many Spokane-area residents choose Medicare Advantage for its all-in-one convenience and potential cost savings.",
    keywords: ["Medicare Advantage", "Part C", "Medicare Advantage plans Spokane", "HMO Medicare", "PPO Medicare"],
    benefits: [
      "All-in-one coverage bundling hospital and medical",
      "Often includes dental, vision, and hearing benefits",
      "Prescription drug coverage (Part D) typically included",
      "May have $0 or low monthly premiums",
      "Out-of-pocket maximum protection",
    ],
  },
  {
    title: "Medicare Supplement (Medigap)",
    slug: "medicare-supplement",
    shortDescription:
      "Medicare Supplement plans help pay the costs that Original Medicare doesn't cover, like copays, coinsurance, and deductibles.",
    longDescription:
      "Medicare Supplement insurance (Medigap) is sold by private companies to fill the 'gaps' in Original Medicare coverage. If you have Original Medicare and a Medigap policy, Medicare pays its share of approved costs, then your Medigap policy pays its share. This means you can see any doctor in the US who accepts Medicare — with predictable, manageable out-of-pocket costs.",
    keywords: ["Medigap", "Medicare Supplement", "Medicare Supplement plans Spokane WA", "Plan G", "Plan N"],
    benefits: [
      "Predictable, low out-of-pocket costs",
      "See any Medicare-accepting doctor nationwide",
      "No network restrictions",
      "Covers Medicare Part A and B cost-sharing",
      "Guaranteed renewable for life",
    ],
  },
  {
    title: "Medicare Part D (Drug Plans)",
    slug: "medicare-part-d",
    shortDescription:
      "Medicare Part D prescription drug plans help cover the cost of medications, reducing your out-of-pocket drug expenses.",
    longDescription:
      "Medicare Part D is the prescription drug coverage portion of Medicare. It's offered through private insurance companies approved by Medicare. Part D plans help cover the cost of prescription drugs and can lower your medication expenses significantly. Spokane-area residents with Original Medicare can add a standalone Part D plan, while Medicare Advantage plans typically include drug coverage.",
    keywords: ["Medicare Part D", "prescription drug plan", "Medicare drug coverage Spokane", "PDP"],
    benefits: [
      "Covers brand-name and generic prescription drugs",
      "Protects against high medication costs",
      "Available as standalone PDP or included in Medicare Advantage",
      "Formulary covers thousands of medications",
      "Catastrophic coverage for very high drug costs",
    ],
  },
  {
    title: "Medicare Enrollment",
    slug: "medicare-enrollment",
    shortDescription:
      "Learn when and how to enroll in Medicare to avoid late enrollment penalties and get the coverage you need.",
    longDescription:
      "Enrolling in Medicare at the right time is critical to avoid late enrollment penalties and coverage gaps. Your Initial Enrollment Period (IEP) begins 3 months before your 65th birthday and ends 3 months after. There are also Special Enrollment Periods (SEPs) for qualifying life events. Working with a licensed Medicare agent in Spokane can help you navigate enrollment and find a plan that fits your needs.",
    keywords: ["Medicare enrollment", "Medicare signup", "when to enroll in Medicare", "Initial Enrollment Period", "Medicare age 65"],
    benefits: [
      "Avoid late enrollment penalties",
      "Understand Initial, Special, and Annual Enrollment Periods",
      "Get help comparing plan options",
      "Enroll in Medicare Part A, B, C, and D",
      "Coordinate with employer coverage if applicable",
    ],
  },
  {
    title: "Medicare for Seniors 65+",
    slug: "medicare-for-seniors",
    shortDescription:
      "Turn 65 soon? Get a clear guide to Medicare options for new beneficiaries in the Spokane area.",
    longDescription:
      "Turning 65 is a major Medicare milestone. When you become eligible, you'll have access to Original Medicare (Parts A and B), Medicare Advantage (Part C), Medicare Supplement (Medigap), and Part D drug plans. A licensed Medicare broker in Spokane can help you understand your options, compare plans, and enroll in the coverage that best fits your health needs and budget — at no cost to you.",
    keywords: ["Medicare turning 65", "Medicare for seniors", "new to Medicare Spokane", "Medicare 65 enrollment"],
    benefits: [
      "Understand all Medicare options at 65",
      "Compare Original Medicare vs. Medicare Advantage",
      "Free consultation with a licensed local agent",
      "Avoid common Medicare enrollment mistakes",
      "Get coverage tailored to your health and budget",
    ],
  },
  {
    title: "Medicare Annual Enrollment Period",
    slug: "medicare-annual-enrollment",
    shortDescription:
      "The Annual Enrollment Period (Oct 15 – Dec 7) is your chance to review and change your Medicare coverage each year.",
    longDescription:
      "Every year from October 15 to December 7, Medicare beneficiaries have the opportunity to review their current coverage and make changes for the upcoming year. During the Annual Enrollment Period (AEP), you can switch from Original Medicare to Medicare Advantage (or vice versa), change your Medicare Advantage plan, switch your Part D drug plan, or add drug coverage. Changes take effect January 1 of the following year.",
    keywords: ["Medicare Annual Enrollment Period", "AEP", "Medicare open enrollment", "change Medicare plan Spokane"],
    benefits: [
      "Review and update coverage every year",
      "Switch between Original Medicare and Medicare Advantage",
      "Change your Part D prescription drug plan",
      "Take advantage of new plan benefits",
      "Compare updated plan costs and formularies",
    ],
  },
];

export function getTopicBySlug(slug: string): Topic | undefined {
  return medicareTopics.find((t) => t.slug === slug);
}

export function getAllTopicSlugs(): string[] {
  return medicareTopics.map((t) => t.slug);
}
