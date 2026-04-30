import Link from "next/link";
import { siteConfig, telHref } from "@/lib/site";

interface Step {
  number: string;
  title: string;
  body: string;
}

const steps: Step[] = [
  {
    number: "1",
    title: "Understand your needs",
    body: "We start with a relaxed conversation about your doctors, prescriptions, budget, and what matters most to you.",
  },
  {
    number: "2",
    title: "Compare your options",
    body: "We walk you through the Medicare Advantage, Medicare Supplement, and Part D options we represent so you can review choices side-by-side.",
  },
  {
    number: "3",
    title: "Enroll with confidence",
    body: "When you are ready, we help you complete enrollment paperwork accurately — at your own pace, with no pressure.",
  },
  {
    number: "4",
    title: "Ongoing support year-round",
    body: "We are here long after enrollment for billing questions, ID card help, plan changes, and Annual Enrollment reviews.",
  },
];

export default function ProcessSection() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="inline-block text-blue-700 text-sm font-semibold uppercase tracking-wider mb-3">
            How We Help You
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            A Simple, Pressure-Free Process
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Helping Spokane-area residents navigate Medicare year-round — from your first questions
            through every Annual Enrollment after.
          </p>
        </div>

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <li
              key={step.number}
              className="relative bg-blue-50/60 border border-blue-100 rounded-2xl p-6 flex flex-col"
            >
              <div
                className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-700 text-white font-bold text-lg mb-4 shadow-sm"
                aria-hidden="true"
              >
                {step.number}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug">
                {step.title}
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={telHref}
            className="inline-flex items-center justify-center bg-blue-700 hover:bg-blue-800 text-white font-semibold px-7 py-3 rounded-lg transition-colors text-base"
            aria-label={`Call ${siteConfig.phone}`}
          >
            Call {siteConfig.phone}
          </a>
          <Link
            href="/request-contact"
            className="inline-flex items-center justify-center bg-white text-blue-700 border-2 border-blue-700 hover:bg-blue-50 font-semibold px-7 py-3 rounded-lg transition-colors text-base"
          >
            Get Help Choosing
          </Link>
        </div>
      </div>
    </section>
  );
}
