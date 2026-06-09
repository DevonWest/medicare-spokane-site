import type { Metadata } from "next";
import FocusedHealthInsuranceLandingPage, {
  type FocusedHealthInsurancePageConfig,
} from "@/components/FocusedHealthInsuranceLandingPage";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Special Enrollment Health Insurance Spokane WA | Health Insurance Options",
  description:
    "Lost employer coverage or had a qualifying life event? Get local help understanding health insurance special enrollment options in Spokane, WA.",
  alternates: { canonical: `${siteConfig.url}/health-insurance-special-enrollment-spokane` },
  openGraph: {
    title: "Special Enrollment Health Insurance Spokane WA | Health Insurance Options",
    description:
      "Lost employer coverage or had a qualifying life event? Get local help understanding health insurance special enrollment options in Spokane, WA.",
    url: `${siteConfig.url}/health-insurance-special-enrollment-spokane`,
  },
};

const config: FocusedHealthInsurancePageConfig = {
  slug: "health-insurance-special-enrollment-spokane",
  source: "health-insurance-special-enrollment-spokane",
  eyebrow: "Health Insurance Special Enrollment",
  title: "Special Enrollment Health Insurance Help in Spokane, WA",
  intro:
    "Local help understanding health insurance enrollment timing after losing coverage, moving, household changes, aging off a parent’s plan, or another qualifying event.",
  forTitle: "Who this page is for",
  forItems: [
    {
      title: "People losing employer coverage",
      body: "Workers leaving a job, losing benefits, or coming off a spouse's employer plan.",
    },
    {
      title: "People who moved",
      body: "New Spokane-area residents reviewing health insurance options after a move.",
    },
    {
      title: "Households with changes",
      body: "People with marriage, divorce, birth, adoption, or other household changes.",
    },
    {
      title: "Young adults aging off a parent’s plan",
      body: "Adults who need to review coverage options when parent-plan coverage ends.",
    },
  ],
  reviewItems: [
    "Special enrollment timing",
    "Coverage start date goals",
    "Available options after a life event",
    "Premiums and deductibles",
    "Provider and prescription needs",
    "What information may be needed to apply",
  ],
  processSteps: [
    "Tell us what changed and when it happened",
    "Review timing, coverage needs, doctors, and prescriptions",
    "Compare costs and coverage for plans we represent and available options",
    "Ask questions and decide whether to apply",
  ],
  faqs: [
    {
      question: "What is a health insurance Special Enrollment Period?",
      answer:
        "A Special Enrollment Period is a time outside the regular open enrollment window when certain life events may let someone review and apply for coverage. We can help you understand timing, but approval is not promised.",
    },
    {
      question: "Can you help if I lost employer coverage?",
      answer:
        "Yes. Losing employer coverage may create a special enrollment opportunity. We can help you review available options and timing.",
    },
    {
      question: "Can you help after a move or household change?",
      answer:
        "Yes. Moves and household changes may affect health insurance enrollment timing. We can help you review what changed and what options may be available.",
    },
    {
      question: "What if I am turning 65 soon?",
      answer:
        "Turning 65 or already on Medicare? Your options are different. Visit our Medicare Help in Spokane and Turning 65 in Spokane pages for Medicare-specific guidance.",
    },
  ],
  formHeading: "Request Special Enrollment Health Insurance Help",
  formSubheading:
    "Tell us what changed and when it happened, and a licensed local agent will follow up to help you review enrollment timing and available options.",
};

export default function HealthInsuranceSpecialEnrollmentSpokanePage() {
  return <FocusedHealthInsuranceLandingPage config={config} />;
}
