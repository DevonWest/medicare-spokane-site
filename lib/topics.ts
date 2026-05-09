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
      "Medicare Advantage plans are offered by Medicare-approved private insurers and may combine hospital, medical, drug, and other benefits.",
    longDescription:
      "Medicare Advantage (Part C) is an alternative to Original Medicare offered by Medicare-approved private insurance companies. These plans must cover everything Original Medicare covers and may include benefits like dental, vision, hearing, and prescription drug coverage. Plan benefits, networks, costs, and drug coverage vary by plan and ZIP code.",
    keywords: ["Medicare Advantage", "Part C", "Medicare Advantage plans Spokane", "HMO Medicare", "PPO Medicare"],
    benefits: [
      "One plan may include hospital, medical, and other benefits",
      "Some plans include dental, vision, and hearing benefits",
      "Many plans include prescription drug coverage, but not all",
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
      "Medicare Supplement insurance (Medigap) is sold by private companies to help pay some out-of-pocket costs in Original Medicare. If you have Original Medicare and a Medigap policy, Medicare pays its share of approved costs, then your Medigap policy pays its share based on the plan letter you choose. You can generally see any doctor in the U.S. who accepts Medicare.",
    keywords: ["Medigap", "Medicare Supplement", "Medicare Supplement plans Spokane WA", "Plan G", "Plan N"],
    benefits: [
      "More predictable out-of-pocket costs for some services",
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
      "Medicare Part D prescription drug plans help pay for covered medications, with details that vary by plan.",
    longDescription:
      "Medicare Part D helps pay for prescription drugs and is offered through private insurance companies approved by Medicare. Each plan has its own formulary, pharmacy network, tiers, and costs. Spokane-area residents with Original Medicare can add a standalone Part D plan, while many Medicare Advantage plans include drug coverage.",
    keywords: ["Medicare Part D", "prescription drug plan", "Medicare drug coverage Spokane", "PDP"],
    benefits: [
      "Covers brand-name and generic prescription drugs",
      "Helps with covered prescription drug costs",
      "Available as standalone PDP or included in many Medicare Advantage plans",
      "Each plan has its own formulary and pharmacy rules",
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
      "Turn 65 soon? Get plain-English help reviewing Medicare options in the Spokane area.",
    longDescription:
      "Turning 65 is a major Medicare milestone. When you become eligible, you can review Original Medicare (Parts A and B), Medicare Advantage (Part C), Medicare Supplement (Medigap), and Part D drug plans. A licensed Medicare agent in Spokane can help you understand your options, compare the plans we represent, and choose coverage based on your health needs and budget — at no cost to you.",
    keywords: ["Medicare turning 65", "Medicare for seniors", "new to Medicare Spokane", "Medicare 65 enrollment"],
    benefits: [
      "Understand Medicare options at 65",
      "Compare Original Medicare vs. Medicare Advantage",
      "No-cost consultation with a licensed local agent",
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
      "Review new plan benefits when available",
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
