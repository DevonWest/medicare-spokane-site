import Link from "next/link";
import { siteConfig, telHref } from "@/lib/site";

const topics = {
  providence: {
    heading: "Need help preparing for a Medicare coverage change?",
    description: "Our local licensed agents can help you understand your next steps and prepare for a Medicare coverage review. New and existing clients are welcome.",
    direction: "For a question about a Providence notice or your current policy, use the member-service number on your insurance card. Our team can help with reviewing your Medicare options.",
  },
  supplement: {
    heading: "Want help reviewing your Medicare Supplement options?",
    description: "Our local licensed agents can help you review your current Supplement coverage and available options. A request for help does not enroll you in a plan or reserve the proposed Costco and SCAN product.",
    direction: "For Costco membership or an existing SCAN policy, contact those organizations directly. Our team provides independent insurance guidance.",
  },
  network: {
    heading: "Reviewing Medicare coverage with your doctors in mind?",
    description: "Our local licensed agents can help you consider provider participation as part of a Medicare coverage review. New and existing clients are welcome; exact plan and provider details need confirmation.",
    direction: "For appointments, medical records or treatment questions, contact your care team. For a coverage decision under your current policy, contact your insurer. Existing agency clients can also ask us for insurance support.",
  },
} as const;

/** Static HTML: no overlay, delayed insertion, form gate, or extra client bundle. */
export default function ArticleHelp({
  topic,
  compact = false,
}: {
  topic: keyof typeof topics;
  compact?: boolean;
}) {
  const copy = topics[topic];

  if (compact) {
    return (
      <aside aria-label="Local Medicare insurance help" data-article-help="compact" className="my-6 border-l-4 border-blue-600 bg-blue-50 p-4 text-base leading-7 text-slate-800">
        <p><strong>{copy.heading}</strong>{" "}<Link href="/contact#contact-form" className="font-semibold text-blue-700 underline underline-offset-2">Ask our Spokane insurance team for help</Link>. No cost or obligation.</p>
      </aside>
    );
  }

  return (
    <aside aria-label="Request a Medicare coverage review" data-article-help="full" className="my-8 rounded-xl border border-blue-200 bg-blue-50 p-5 text-slate-800 sm:p-6">
      <p className="text-sm font-semibold text-blue-900">Health Insurance Options LLC · Licensed independent insurance agency</p>
      <h2 className="mt-3 text-2xl font-bold text-slate-950">{copy.heading}</h2>
      <p className="mt-3 text-base leading-7">{copy.description}</p>
      <p className="mt-2 text-base leading-7">Serving Spokane and surrounding Eastern Washington communities. No cost or obligation.</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link href="/contact#contact-form" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-700 px-5 py-3 text-base font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
          Request a Medicare Coverage Review
        </Link>
        <a href={telHref} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-blue-700 bg-white px-5 py-3 text-base font-semibold text-blue-800 hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
          Call our insurance team: {siteConfig.phone}
        </a>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-700">{copy.direction}</p>
    </aside>
  );
}
