import "server-only";

import { Element, type DOMNode } from "html-react-parser";
import LeadForm from "@/components/LeadForm";
import type { LeadSource } from "./leadSources";

interface KnowledgeCmsLeadFormAdapter {
  source: LeadSource;
  heading: string;
  subheading: string;
  showMessage?: boolean;
  submitLabel?: string;
  successBody?: string;
  zipHelperText?: string;
  disclosureText?: string;
  className?: string;
}

const healthInsuranceFormDefaults = Object.freeze({
  showMessage: true,
  submitLabel: "Request Health Insurance Help",
  successBody:
    "A licensed local agent will review your information and contact you soon. We typically respond the same business day during business hours.",
  zipHelperText:
    "Optional, but helpful because available health insurance options can vary by ZIP code.",
  disclosureText:
    "By submitting, you agree to be contacted by a licensed insurance professional about health insurance options. We can help review coverage options, compare costs and coverage, and discuss plans we represent and other available options. Lower costs or approval are not promised.",
});

const adapters: Readonly<Record<string, KnowledgeCmsLeadFormAdapter>> =
  Object.freeze({
    "turning-65-spokane": {
      source: "turning-65-medicare-spokane",
      heading: "Request Turning 65 Help",
      subheading:
        "Tell us a little about your situation and a licensed local agent will follow up to help you understand your Medicare options.",
      showMessage: true,
    },
    "compare-options": {
      source: "compare-medicare-options",
      heading: "Request Help Online",
      subheading:
        "Share a few details and a licensed local agent will follow up to review your Medicare options.",
      showMessage: true,
    },
    "medicare-advantage": {
      source: "medicare-advantage",
      heading: "Compare Medicare Advantage Plans",
      subheading:
        "Share a few details and a licensed insurance professional will help compare the Medicare Advantage plans we represent in your area.",
      showMessage: true,
    },
    "medicare-supplements": {
      source: "medicare-supplements",
      heading: "Compare Medicare Supplement Plans",
      subheading:
        "A licensed insurance professional will help you compare the Medicare Supplement plans we represent.",
      showMessage: true,
    },
    "appointment-checklist": {
      source: "medicare-appointment-checklist",
      heading: "Request Help Online",
      subheading:
        "Share a few details and a licensed local agent can help you prepare for your Medicare appointment.",
      showMessage: true,
    },
    "annual-plan-review": {
      source: "medicare-plan-review-spokane",
      heading: "Request a Plan Review",
      subheading:
        "Tell us how to reach you and a licensed local agent will contact you to schedule your Medicare review.",
      showMessage: true,
    },
    "annual-enrollment-spokane": {
      source: "medicare-annual-enrollment-spokane",
      heading: "Request Help Online",
      subheading:
        "Share a few details and a licensed local agent will contact you to schedule your Annual Enrollment review.",
      showMessage: true,
    },
    "prescription-review": {
      source: "rx-drug-review",
      heading: "Request an RX Drug Review",
      subheading:
        "Share your prescription review questions and a licensed local agent will follow up.",
      showMessage: true,
      className: "text-gray-900",
    },
    "part-d": {
      source: "medicare-part-d",
      heading: "Request a No-Cost Prescription Review",
      subheading:
        "Tell us how to reach you and a licensed insurance professional will help compare Part D plans for your medications.",
      showMessage: true,
    },
    "helping-parent": {
      source: "helping-parent-with-medicare",
      heading: "Request Help for a Parent",
      subheading:
        "Share a few basics about what your family wants help with. Please do not include sensitive medical details in the form.",
      showMessage: true,
      className: "h-fit",
    },
    "working-past-65": {
      source: "working-past-65-medicare",
      heading: "Request Medicare Help",
      subheading:
        "Share a few details and a licensed local agent will follow up to review your Medicare options.",
      showMessage: true,
    },
    "health-insurance-spokane": {
      source: "health-insurance-spokane",
      heading: "Request Health Insurance Help",
      subheading:
        "Tell us a little about your situation and a licensed local agent will follow up to help you review health insurance options.",
      showMessage: true,
    },
    "health-insurance-agent": {
      source: "health-insurance-agent-spokane",
      heading: "Request Help From a Local Health Insurance Agent",
      subheading:
        "Tell us a little about your coverage needs and a licensed local agent will follow up to help you review health insurance options.",
      ...healthInsuranceFormDefaults,
    },
    "individual-family-health-insurance": {
      source: "individual-family-health-insurance-spokane",
      heading: "Request Individual or Family Health Insurance Help",
      subheading:
        "Tell us a little about your coverage needs and a licensed local agent will follow up to help you review health insurance options.",
      ...healthInsuranceFormDefaults,
    },
    "self-employed-health-insurance": {
      source: "self-employed-health-insurance-spokane",
      heading: "Request Self-Employed Health Insurance Help",
      subheading:
        "Tell us about your self-employed or non-employer coverage needs and a licensed local agent will follow up.",
      ...healthInsuranceFormDefaults,
    },
    "special-enrollment-health-insurance": {
      source: "health-insurance-special-enrollment-spokane",
      heading: "Request Special Enrollment Health Insurance Help",
      subheading:
        "Tell us what changed and when it happened, and a licensed local agent will follow up to help you review enrollment timing and available options.",
      ...healthInsuranceFormDefaults,
    },
    "enrollment-resources": {
      source: "medicare-enrollment-resources",
      heading: "Get Help With Medicare Enrollment",
      subheading:
        "Tell us where you are in the process and a licensed insurance professional will follow up.",
      showMessage: true,
    },
    "moving-to-spokane": {
      source: "moving-to-spokane-medicare",
      heading: "Request Help Online",
      subheading:
        "Share a few details about your move and a local licensed agent will reach out to review your Medicare options.",
      showMessage: true,
    },
    "medicare-savings-extra-help": {
      source: "medicare-savings-program-extra-help-washington",
      heading: "Request Help Online",
      subheading:
        "Tell us how to reach you and a local licensed agent will follow up with general information and answer your questions.",
      showMessage: true,
    },
    "advantage-vs-supplement": {
      source: "advantage-vs-supplement",
      heading: "Compare Plans for Your Situation",
      subheading:
        "A licensed agent will walk through Medicare Advantage and Medigap options with you.",
    },
  } satisfies Record<string, KnowledgeCmsLeadFormAdapter>);

const leadFormRootClass =
  "scroll-mt-[calc(var(--mobile-header-offset)+0.75rem)]";

function isLeadFormRoot(node: DOMNode): node is Element {
  return (
    node instanceof Element &&
    node.name === "div" &&
    (node.attribs.class ?? "").split(/\s+/).includes(leadFormRootClass)
  );
}

export function replaceKnowledgeCmsPublicLeadForm(
  entryId: string,
  node: DOMNode,
  index: number,
) {
  const adapter = adapters[entryId];
  if (!adapter || !isLeadFormRoot(node)) {
    return undefined;
  }
  return <LeadForm key={`knowledge-cms-lead-form-${index}`} {...adapter} />;
}

export function hasKnowledgeCmsPublicLeadFormAdapter(
  entryId: string,
): boolean {
  return entryId in adapters;
}
