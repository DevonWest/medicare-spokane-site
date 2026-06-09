import type { Metadata } from "next";
import FocusedHealthInsuranceLandingPage, {
  type FocusedHealthInsurancePageConfig,
} from "@/components/FocusedHealthInsuranceLandingPage";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Individual & Family Health Insurance Spokane WA | Health Insurance Options",
  description:
    "Get local help reviewing individual and family health insurance options in Spokane, WA. Compare coverage, costs, provider access, and enrollment timing before Medicare.",
  alternates: { canonical: `${siteConfig.url}/individual-family-health-insurance-spokane` },
  openGraph: {
    title: "Individual & Family Health Insurance Spokane WA | Health Insurance Options",
    description:
      "Get local help reviewing individual and family health insurance options in Spokane, WA. Compare coverage, costs, provider access, and enrollment timing before Medicare.",
    url: `${siteConfig.url}/individual-family-health-insurance-spokane`,
  },
};

const config: FocusedHealthInsurancePageConfig = {
  slug: "individual-family-health-insurance-spokane",
  source: "individual-family-health-insurance-spokane",
  eyebrow: "Individual and Family Health Insurance",
  title: "Individual & Family Health Insurance Help in Spokane, WA",
  intro:
    "Local help for Spokane-area individuals and families reviewing health insurance coverage options before Medicare.",
  forTitle: "Who this page is for",
  forItems: [
    {
      title: "Individuals buying their own coverage",
      body: "People without employer coverage who need to review available options for themselves.",
    },
    {
      title: "Families with dependents",
      body: "Households comparing costs and coverage for spouses, children, or other family members.",
    },
    {
      title: "People between jobs",
      body: "Spokane-area residents reviewing available options while employer coverage is not active.",
    },
    {
      title: "People not yet eligible for Medicare",
      body: "Adults under 65 who want health insurance guidance before Medicare becomes a factor.",
    },
  ],
  reviewItems: [
    "Monthly premiums",
    "Deductibles and out-of-pocket costs",
    "Doctor and provider access",
    "Prescription coverage",
    "Household coverage needs",
    "Enrollment timing",
  ],
  processSteps: [
    "Tell us who needs coverage and when it should start",
    "Review household, provider, and prescription needs",
    "Compare costs and coverage for plans we represent and available options",
    "Ask questions and decide whether to apply",
  ],
  faqs: [
    {
      question: "Can you help with individual and family health insurance before Medicare?",
      answer:
        "Yes. We help Spokane-area individuals and families review coverage options, compare costs and coverage, and understand enrollment timing before Medicare.",
    },
    {
      question: "Do you promise lower costs or approval?",
      answer:
        "No. Lower costs or approval are not promised. We can help you review available options and explain plan details in plain language.",
    },
    {
      question: "Can you review doctors and prescriptions?",
      answer:
        "Yes. Provider access and prescription coverage are important parts of reviewing health insurance options, and we can help you look at those details.",
    },
    {
      question: "What if I am turning 65 soon?",
      answer:
        "Turning 65 or already on Medicare? Your options are different. Visit our Medicare Help in Spokane and Turning 65 in Spokane pages for Medicare-specific guidance.",
    },
  ],
  formHeading: "Request Individual or Family Health Insurance Help",
  formSubheading:
    "Tell us a little about your coverage needs and a licensed local agent will follow up to help you review health insurance options.",
};

export default function IndividualFamilyHealthInsuranceSpokanePage() {
  return <FocusedHealthInsuranceLandingPage config={config} />;
}
