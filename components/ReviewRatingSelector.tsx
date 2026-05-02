import Link from "next/link";
import {
  getReviewRatingDestination,
  getReviewRatingLabel,
  GOOGLE_REVIEW_URL,
} from "@/lib/reviewFlow";

const RATING_OPTIONS = [1, 2, 3, 4, 5] as const;

interface ReviewRatingSelectorProps {
  agentSlug?: string;
  agentName?: string;
}

export default function ReviewRatingSelector({ agentSlug, agentName }: ReviewRatingSelectorProps) {
  return (
    <>
      <section className="bg-gradient-to-br from-blue-800 to-blue-600 px-4 py-16 text-white landscape-mobile:py-5">
        <div className="mx-auto max-w-4xl">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-blue-200 landscape-mobile:mb-2">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/review" className="hover:text-white">
              Review
            </Link>
            <span className="mx-2">/</span>
            <span>Rate Your Experience</span>
          </nav>
          <h1 className="mb-4 text-4xl font-extrabold leading-tight md:text-5xl landscape-mobile:text-2xl landscape-mobile:leading-snug">
            Please Review Your Experience
          </h1>
          <p className="max-w-3xl text-xl text-blue-100 landscape-mobile:text-base">
            Your feedback helps us improve and helps local Medicare clients know what to expect.
          </p>
          {agentName ? (
            <p className="mt-5 text-lg font-semibold text-white">How was your experience with {agentName}?</p>
          ) : null}
        </div>
      </section>

      <section className="bg-white px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {RATING_OPTIONS.map((rating) => {
                const destination = getReviewRatingDestination(agentSlug, rating);
                const stars = "★".repeat(rating);
                const commonClassName =
                  "flex min-h-28 items-center justify-center rounded-2xl border border-gray-200 px-4 py-5 text-center transition-colors hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";

                return rating === 5 ? (
                  <a
                    key={rating}
                    href={destination}
                    className={commonClassName}
                    aria-label={`${getReviewRatingLabel(rating)}${destination === GOOGLE_REVIEW_URL ? " opens the Google review page" : ""}`}
                  >
                    <span>
                      <span className="block text-3xl text-amber-500" aria-hidden="true">
                        {stars}
                      </span>
                      <span className="mt-3 block text-lg font-semibold text-gray-900">{getReviewRatingLabel(rating)}</span>
                    </span>
                  </a>
                ) : (
                  <Link key={rating} href={destination} className={commonClassName} aria-label={getReviewRatingLabel(rating)}>
                    <span>
                      <span className="block text-3xl text-amber-500" aria-hidden="true">
                        {stars}
                      </span>
                      <span className="mt-3 block text-lg font-semibold text-gray-900">{getReviewRatingLabel(rating)}</span>
                    </span>
                  </Link>
                );
              })}
            </div>

            <p className="mt-6 text-base leading-7 text-gray-700">
              If something wasn&apos;t right, we want the opportunity to hear about it and improve.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
