import type { Metadata } from "next";
import Link from "next/link";
import Disclaimer from "@/components/Disclaimer";
import FAQ, { type FAQItem } from "@/components/FAQ";
import LeadForm from "@/components/LeadForm";
import { siteConfig, telHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Medicare Appointment Checklist Spokane | Medicare in Spokane",
  description:
    "Prepare for your Medicare appointment in Spokane. See what to bring, including prescription lists, doctors, pharmacies, current coverage, and questions for a licensed local insurance agent.",
  alternates: { canonical: `${siteConfig.url}/medicare-appointment-checklist` },
  openGraph: {
    title: "Medicare Appointment Checklist Spokane | Medicare in Spokane",
    description:
      "Prepare for your Medicare appointment in Spokane. See what to bring, including prescription lists, doctors, pharmacies, current coverage, and questions for a licensed local insurance agent.",
    url: `${siteConfig.url}/medicare-appointment-checklist`,
  },
};

const checklistItems = [
  "Medicare card, if already enrolled",
  "Current plan card, if applicable",
  "List of prescriptions",
  "Dosage and how often each medication is taken",
  "Preferred pharmacy",
  "Doctor and specialist names",
  "Hospital or clinic preferences",
  "Current employer coverage information, if still working",
  "Medicaid, Extra Help, or LIS information, if applicable",
  "Dental, vision, or hearing needs",
  "Questions or concerns you want answered",
];

const whyItMatters = [
  {
    title: "Prescriptions matter",
    body: "Your prescriptions can affect Part D and Medicare Advantage choices, including which options may fit your medication needs.",
  },
  {
    title: "Doctors and hospitals matter",
    body: "Your doctors, specialists, hospitals, and clinics may affect network decisions when reviewing coverage.",
  },
  {
    title: "Pharmacy choice matters",
    body: "Your preferred pharmacy may affect estimated drug costs and how convenient your coverage feels to use.",
  },
  {
    title: "Employer coverage matters",
    body: "If you are still working, employer coverage can affect Medicare timing and what steps make sense next.",
  },
  {
    title: "Preparation helps",
    body: "Having this information ready helps your agent explain options from the plans we represent more clearly.",
  },
];

const appointmentSteps = [
  "Bring or share your information",
  "Tell us what matters most to you",
  "Review options from the plans we represent",
  "Ask questions and decide what feels right for you",
];

const faqs: FAQItem[] = [
  {
    question: "Do I need all of these items before meeting?",
    answer:
      "No. Bring what you have. Even if you do not have every item ready, we can still talk through your situation and help you understand what information will be most useful to gather next.",
  },
  {
    question: "Can I do the appointment by phone?",
    answer:
      "Yes. Health Insurance Options LLC offers phone appointments for Spokane-area residents, and in-person meetings are also available.",
  },
  {
    question: "Should I bring my prescription list?",
    answer:
      "Yes. Your prescription list, along with dosage and how often you take each medication, can help us review Part D and Medicare Advantage options from the plans we represent.",
  },
  {
    question: "Can you help if I am still working?",
    answer:
      "Yes. If you are still working or covered under an employer plan, we can review how that coverage may affect Medicare timing and what questions you may want to ask your benefits administrator.",
  },
  {
    question: "Is there a cost for the consultation?",
    answer:
      "No. Your consultation is no cost and no obligation. You can ask questions, review your situation, and decide what feels right for you.",
  },
];

const relatedLinks = [
  {
    href: "/rx-drug-review",
    title: "RX Drug Review",
    body: "Use our prescription review page if you want extra help organizing medications and pharmacy details before your appointment.",
  },
  {
    href: "/compare-medicare-options",
    title: "Compare Medicare Options",
    body: "See how doctors, prescriptions, budget, and coverage preferences can shape your Medicare review.",
  },
  {
    href: "/turning-65-medicare-spokane",
    title: "Turning 65 Medicare Spokane",
    body: "Read more if you are preparing for Medicare for the first time and want a Spokane-focused planning guide.",
  },
  {
    href: "/working-past-65-medicare",
    title: "Working Past 65 Medicare",
    body: "Review employer coverage questions if you are still working and want to understand how Medicare timing may apply.",
  },
  {
    href: "/contact",
    title: "Contact Our Spokane Office",
    body: "Reach out if you would rather schedule directly or ask a quick question before your appointment.",
  },
];

export default function MedicareAppointmentChecklistPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-blue-800 to-blue-600 px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-blue-200">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span>Medicare Appointment Checklist</span>
          </nav>
          <div className="max-w-4xl">
            <h1 className="mb-4 text-4xl font-extrabold leading-tight md:text-5xl">
              What to Bring to Your Medicare Appointment
            </h1>
            <p className="max-w-3xl text-xl text-blue-100">
              Having the right information ready can make your Medicare review easier, faster, and more helpful. Use
              this checklist before meeting with one of our local licensed insurance agents.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href={telHref}
                className="inline-flex items-center justify-center rounded-lg bg-white px-7 py-3 text-lg font-semibold text-blue-800 transition-colors hover:bg-blue-50"
              >
                Call 509-353-0476
              </a>
              <Link
                href="#appointment-help-form"
                className="inline-flex items-center justify-center rounded-lg border border-blue-300 bg-blue-900 px-7 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-950"
              >
                Request Help Online
              </Link>
            </div>
            <p className="mt-5 text-base font-semibold text-blue-50">
              No-cost consultation. No pressure. Local Spokane guidance.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Appointment checklist</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">Bring the details that make your review easier</h2>
              <p className="mt-3 text-lg leading-relaxed text-gray-700">
                This checklist is designed to feel practical and easy to use. Bring printed notes, cards, or a phone
                photo of the information if that is easiest for you.
              </p>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
              {checklistItems.map((item) => (
                <div key={item} className="flex rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <span
                    className="mr-4 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border-2 border-blue-700 bg-white text-sm font-bold text-blue-700"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span className="text-base leading-relaxed text-gray-800">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-3xl border border-blue-100 bg-blue-50 p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Local Spokane support</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">In-person or phone appointments</h2>
            <div className="mt-4 space-y-4 text-lg leading-relaxed text-gray-700">
              <p>
                {siteConfig.legalName} is a Spokane-based licensed independent insurance agency helping local residents
                review Medicare coverage questions.
              </p>
              <p>Our Spokane office is located inside the Providence Medical Building.</p>
              <p>Phone appointments are also available if meeting from home is easier.</p>
            </div>
            <div className="mt-6 rounded-2xl border border-blue-100 bg-white p-5 text-sm leading-relaxed text-gray-700">
              <p>
                If you are missing an item on the checklist, you can still start the conversation and gather anything
                else afterward.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900">Why this information matters</h2>
            <p className="mt-3 text-lg text-gray-600">
              A few key details can make your appointment more focused and easier to understand.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
            {whyItMatters.map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-700">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">How the appointment works</h2>
            <p className="mt-3 text-lg leading-relaxed text-gray-700">
              The goal is to keep the conversation simple, clear, and centered on what matters to you.
            </p>
            <ol className="mt-8 space-y-4">
              {appointmentSteps.map((step, index) => (
                <li key={step} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-700 font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="pt-1 text-gray-800">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div id="appointment-help-form">
            <LeadForm
              source="medicare-appointment-checklist"
              heading="Request Help Online"
              subheading="Share a few details and a licensed local agent can help you prepare for your Medicare appointment."
              showMessage
            />
          </div>
        </div>
      </section>

      <FAQ items={faqs} heading="Medicare Appointment Checklist FAQ" />

      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900">Helpful Medicare links</h2>
            <p className="mt-3 text-lg text-gray-600">
              Use these related pages if you want to prepare before your appointment or keep researching afterward.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {relatedLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
              >
                <h3 className="text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-700">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-700">{item.body}</p>
                <span className="mt-4 inline-block text-sm font-medium text-blue-700 group-hover:underline">
                  Visit page →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 pb-12">
        <div className="mx-auto max-w-3xl">
          <Disclaimer />
        </div>
      </section>
    </>
  );
}
