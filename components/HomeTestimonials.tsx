import Link from "next/link";
import { testimonials } from "@/lib/testimonials";

const homepageTestimonials = [...testimonials]
  .sort((left, right) => (right.featured ? 1 : 0) - (left.featured ? 1 : 0))
  .slice(0, 6);

export default function HomeTestimonials() {
  return (
    <section className="border-y border-slate-100 bg-slate-50 px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <p className="mb-3 inline-block text-sm font-semibold uppercase tracking-wider text-blue-700">
            Social Proof
          </p>
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
            What Spokane Clients Say
          </h2>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-600">
            Real feedback from Spokane-area residents we&apos;ve helped navigate Medicare.
          </p>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0 md:pb-0">
          <div className="flex snap-x snap-mandatory gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
            {homepageTestimonials.map((testimonial) => (
              <figure
                key={testimonial.name}
                className="min-h-[19rem] w-[85vw] max-w-sm shrink-0 snap-start rounded-3xl border border-gray-200 bg-white p-7 shadow-sm md:min-h-0 md:w-auto md:max-w-none"
              >
                <div className="mb-4 text-xl tracking-[0.2em] text-amber-500" aria-label="5 out of 5 stars">
                  ★★★★★
                </div>
                <blockquote className="text-lg leading-relaxed text-gray-900">
                  “{testimonial.text}”
                </blockquote>
                <figcaption className="mt-6 border-t border-gray-100 pt-5">
                  <p className="text-base font-semibold text-gray-900">{testimonial.name}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <span>{testimonial.location}</span>
                    <span aria-hidden="true">•</span>
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                      {testimonial.source} Review
                    </span>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        <p className="mx-auto mt-2 max-w-3xl text-center text-sm text-gray-600 md:mt-6">
          Reviews sourced from Google. More reviews available on Google.
        </p>

        <div className="mt-8 text-center">
          <Link
            href="/testimonials"
            className="inline-flex items-center justify-center font-semibold text-blue-700 underline-offset-4 hover:text-blue-800 hover:underline"
          >
            Read more client reviews →
          </Link>
        </div>
      </div>
    </section>
  );
}
