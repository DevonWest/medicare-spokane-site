import { siteConfig } from "@/lib/site";

interface CTASectionProps {
  heading?: string;
  subheading?: string;
}

export default function CTASection({
  heading = "Ready to Find the Right Medicare Plan?",
  subheading = "Speak with a licensed Medicare agent in Spokane — no cost, no obligation.",
}: CTASectionProps) {
  return (
    <section className="bg-blue-700 text-white py-16 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">{heading}</h2>
        <p className="text-blue-100 text-lg mb-8">{subheading}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={`tel:${siteConfig.phone.replace(/\D/g, "")}`}
            className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors text-lg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z"
              />
            </svg>
            Call {siteConfig.phone}
          </a>
        </div>
      </div>
    </section>
  );
}
