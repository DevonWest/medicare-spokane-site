import type { Metadata } from "next";
import FocusedHealthInsuranceLandingPage, {
  type FocusedHealthInsurancePageConfig,
} from "@/components/FocusedHealthInsuranceLandingPage";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Health Insurance Agent Spokane WA | Health Insurance Options",
  description:
    "Work with a local Spokane health insurance agent to review coverage options for individuals, families, self-employed workers, and people losing employer coverage before Medicare.",
  alternates: { canonical: `${siteConfig.url}/health-insurance-agent-spokane` },
  openGraph: {
    title: "Health Insurance Agent Spokane WA | Health Insurance Options",
    description:
      "Work with a local Spokane health insurance agent to review coverage options for individuals, families, self-employed workers, and people losing employer coverage before Medicare.",
    url: `${siteConfig.url}/health-insurance-agent-spokane`,
  },
};

const config: FocusedHealthInsurancePageConfig = {
  slug: "health-insurance-agent-spokane",
  source: "health-insurance-agent-spokane",
  eyebrow: "Local Health Insurance Agent",
  title: "Health Insurance Agent in Spokane, WA",
  intro:
    "Work with a local Spokane health insurance agent to review coverage options for individuals, families, self-employed workers, and people losing employer coverage before Medicare.",
  forTitle: "Who this page is for",
  forItems: [
    {
      title: "People looking for a local agent",
      body: "Spokane-area residents who want to sit down with a licensed local agent instead of sorting through options alone.",
    },
    {
      title: "Individuals and families",
      body: "Households buying their own coverage who want local guidance comparing costs and coverage for available options.",
    },
    {
      title: "Self-employed workers",
      body: "Freelancers, contractors, and small business owners reviewing available options outside an employer plan.",
    },
    {
      title: "People losing employer coverage",
      body: "Workers leaving a job, retiring early, or coming off a spouse's plan who need to understand enrollment timing before Medicare.",
    },
  ],
  reviewItems: [
    "Monthly premiums",
    "Deductibles and out-of-pocket costs",
    "Doctor and provider access",
    "Prescription coverage",
    "Household and income considerations",
    "Enrollment timing and special enrollment situations",
  ],
  processSteps: [
    "Reach out by phone or the form and tell us what coverage you need",
    "Review household, provider, prescription, and budget details with a local agent",
    "Compare costs and coverage for plans we represent and other available options",
    "Ask questions and decide whether to apply",
  ],
  faqs: [
    {
      question: "What does a local Spokane health insurance agent do?",
      answer:
        "A local licensed agent can help you review coverage options, compare costs and coverage, understand enrollment timing, and explain plan details in plain language so you can decide what fits your household.",
    },
    {
      question: "Is there a cost to work with a local agent?",
      answer:
        "We offer a no-cost consultation for Spokane-area residents. Our role is to help you review available options and understand the plans we represent and other available options.",
    },
    {
      question: "Do you promise lower costs or approval?",
      answer:
        "No. Lower costs or approval are not promised. We help you review available options and compare costs and coverage so you can make an informed decision.",
    },
    {
      question: "What if I am turning 65 or already on Medicare?",
      answer:
        "Turning 65 or already on Medicare? Your options are different. Visit our Medicare Help in Spokane and Turning 65 in Spokane pages for Medicare-specific guidance.",
    },
  ],
  formHeading: "Request Help From a Local Health Insurance Agent",
  formSubheading:
    "Tell us a little about your coverage needs and a licensed local agent will follow up to help you review health insurance options.",
  relatedLinks: [
    {
      href: "/health-insurance-spokane",
      label: "Health Insurance Help in Spokane",
      body: "Broader local health insurance guidance for individuals, families, self-employed workers, and people between coverage.",
    },
    {
      href: "/individual-family-health-insurance-spokane",
      label: "Individual & Family Health Insurance",
      body: "Local help for Spokane-area individuals and families reviewing coverage options before Medicare.",
    },
    {
      href: "/self-employed-health-insurance-spokane",
      label: "Self-Employed Health Insurance",
      body: "Guidance for self-employed workers, contractors, and small business owners without employer coverage.",
    },
    {
      href: "/health-insurance-special-enrollment-spokane",
      label: "Special Enrollment Health Insurance",
      body: "Help understanding enrollment timing after lost coverage, a move, or another qualifying life event.",
    },
    {
      href: "/contact",
      label: "Contact Our Spokane Office",
      body: "Reach our Spokane-based team by phone or request a no-cost consultation.",
    },
    {
      href: "/resources",
      label: "Resource Library",
      body: "Browse Medicare and health insurance guides for Spokane-area residents.",
    },
    {
      href: "/medicare-spokane",
      label: "Medicare Help in Spokane",
      body: "Local Medicare guidance for Spokane-area residents who are turning 65 or already on Medicare.",
    },
  ],
};

export default function HealthInsuranceAgentSpokanePage() {
  return <FocusedHealthInsuranceLandingPage config={config} />;
}
