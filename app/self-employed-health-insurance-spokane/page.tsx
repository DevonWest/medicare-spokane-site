import type { Metadata } from "next";
import FocusedHealthInsuranceLandingPage, {
  type FocusedHealthInsurancePageConfig,
} from "@/components/FocusedHealthInsuranceLandingPage";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Self-Employed Health Insurance Spokane WA | Health Insurance Options",
  description:
    "Self-employed in Spokane? Get local help reviewing health insurance coverage options, premiums, deductibles, provider access, and enrollment timing.",
  alternates: { canonical: `${siteConfig.url}/self-employed-health-insurance-spokane` },
  openGraph: {
    title: "Self-Employed Health Insurance Spokane WA | Health Insurance Options",
    description:
      "Self-employed in Spokane? Get local help reviewing health insurance coverage options, premiums, deductibles, provider access, and enrollment timing.",
    url: `${siteConfig.url}/self-employed-health-insurance-spokane`,
  },
};

const config: FocusedHealthInsurancePageConfig = {
  slug: "self-employed-health-insurance-spokane",
  source: "self-employed-health-insurance-spokane",
  eyebrow: "Self-Employed Health Insurance",
  title: "Self-Employed Health Insurance Help in Spokane, WA",
  intro:
    "Local help for self-employed workers, contractors, small business owners, and people without employer coverage reviewing health insurance options.",
  forTitle: "Who this page is for",
  forItems: [
    {
      title: "Freelancers and contractors",
      body: "Independent workers reviewing coverage options outside an employer plan.",
    },
    {
      title: "Small business owners",
      body: "Owners who need individual coverage for themselves or family members.",
    },
    {
      title: "People without employer coverage",
      body: "Spokane-area residents who need to review available options on their own.",
    },
    {
      title: "Workers with changing income",
      body: "Self-employed people who want to understand how household details may affect available options.",
    },
  ],
  reviewItems: [
    "Premiums and deductibles",
    "Copays and out-of-pocket costs",
    "Provider access",
    "Prescription coverage",
    "Household and income considerations",
    "Enrollment timing",
  ],
  processSteps: [
    "Tell us about your work situation and coverage timing",
    "Review household, provider, prescription, and budget needs",
    "Compare costs and coverage for plans we represent and available options",
    "Ask questions and decide whether to apply",
  ],
  faqs: [
    {
      question: "Can you help if I am self-employed in Spokane?",
      answer:
        "Yes. We help self-employed workers, contractors, and small business owners review health insurance coverage options and enrollment timing.",
    },
    {
      question: "Can you help compare premiums and deductibles?",
      answer:
        "Yes. We can help you compare costs and coverage, including premiums, deductibles, copays, out-of-pocket costs, provider access, and prescriptions.",
    },
    {
      question: "Can you review available options?",
      answer:
        "Yes. We can review plans we represent and other available options so you can compare costs and coverage.",
    },
    {
      question: "What if I am nearing Medicare age?",
      answer:
        "Turning 65 or already on Medicare? Your options are different. Visit our Medicare Help in Spokane and Turning 65 in Spokane pages for Medicare-specific guidance.",
    },
  ],
  formHeading: "Request Self-Employed Health Insurance Help",
  formSubheading:
    "Tell us about your self-employed or non-employer coverage needs and a licensed local agent will follow up.",
};

export default function SelfEmployedHealthInsuranceSpokanePage() {
  return <FocusedHealthInsuranceLandingPage config={config} />;
}
