import Link from "next/link";

interface Testimonial {
  quote: string;
  author: string;
  location?: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      "They took the time to explain my options in plain English. I finally feel like I understand my Medicare coverage.",
    author: "Margaret S.",
    location: "Spokane, WA",
  },
  {
    quote:
      "Local, friendly, and patient. They answered every question I had — even the ones I was embarrassed to ask.",
    author: "Robert P.",
    location: "Spokane Valley, WA",
  },
  {
    quote:
      "I appreciated that there was no pressure. They helped me compare options and choose coverage that fits my needs.",
    author: "Linda K.",
    location: "Liberty Lake, WA",
  },
];

export default function HomeTestimonials() {
  return (
    <section className="py-20 px-4 bg-slate-50 border-y border-slate-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="inline-block text-blue-700 text-sm font-semibold uppercase tracking-wider mb-3">
            Social Proof
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Spokane Clients Say
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Real feedback from Spokane-area residents we have helped review their Medicare options.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <figure
              key={t.author}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7 flex flex-col"
            >
              <div className="flex text-amber-500 text-lg mb-3">
                <span role="img" aria-label="5 out of 5 stars">★★★★★</span>
              </div>
              <blockquote className="text-gray-800 leading-relaxed flex-1 text-base">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-5 text-sm text-gray-700">
                <span className="font-semibold">— {t.author}</span>
                {t.location ? <span className="text-gray-500"> · {t.location}</span> : null}
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="max-w-3xl mx-auto mt-10 text-center text-xs text-gray-500 leading-relaxed">
          Sample testimonials shown for illustration. Individual experiences vary and are not a
          guarantee of any specific outcome, savings, or plan suitability for your situation.
        </p>

        <div className="mt-10 text-center">
          <Link
            href="/testimonials"
            className="inline-flex items-center justify-center text-blue-700 hover:text-blue-800 font-semibold underline-offset-4 hover:underline"
          >
            Read more client stories →
          </Link>
        </div>
      </div>
    </section>
  );
}
