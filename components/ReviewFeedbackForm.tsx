"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { telHref } from "@/lib/site";
import {
  getReviewRatingLabel,
  validateReviewFeedbackInput,
} from "@/lib/reviewFlow";

type Status = "idle" | "submitting" | "success" | "error";
type FieldErrors = Partial<Record<"fullName" | "email" | "phone" | "message", string>>;

interface ReviewFeedbackFormProps {
  agentSlug?: string;
  agentName?: string;
  rating?: number;
}

export default function ReviewFeedbackForm({ agentSlug, agentName, rating }: ReviewFeedbackFormProps) {
  const successRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const ratingIsValid = typeof rating === "number" && rating >= 1 && rating <= 4;
  const agentLabel = agentName ?? "General feedback for our team";
  const ratingLabel = ratingIsValid && rating ? getReviewRatingLabel(rating) : "";

  useEffect(() => {
    if (status !== "success") return;
    successRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    successRef.current?.focus();
  }, [status]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("idle");
    setErrorMessage("");
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const payload = {
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      message: String(formData.get("message") ?? ""),
      agentSlug,
      rating,
      sourcePath: typeof window !== "undefined" ? window.location.pathname : "/review/feedback",
    };

    const validation = validateReviewFeedbackInput(payload);
    if (!validation.ok) {
      setStatus("error");
      setFieldErrors(validation.errors);
      setErrorMessage(validation.error ?? "Please review your feedback and try again.");
      return;
    }

    setStatus("submitting");

    let response: Response;

    try {
      response = await fetch("/api/review-feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: payload.fullName,
          email: payload.email,
          phone: payload.phone || undefined,
          agentSlug: payload.agentSlug,
          rating: payload.rating,
          message: payload.message,
          sourcePath: payload.sourcePath,
        }),
      });
    } catch {
      setStatus("error");
      setErrorMessage("We couldn't submit your feedback. Please call us at 509-353-0476.");
      return;
    }

    const result = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

    if (!response.ok || !result?.ok) {
      setStatus("error");
      setErrorMessage(result?.error ?? "We couldn't submit your feedback. Please call us at 509-353-0476.");
      return;
    }

    event.currentTarget.reset();
    setStatus("success");
    setErrorMessage("");
    setFieldErrors({});
  }

  function getFieldClassName(hasError: boolean) {
    return `min-h-12 w-full rounded-xl px-4 py-3 text-base leading-6 text-gray-900 outline-none ${
      hasError
        ? "border border-red-600 focus:border-red-700 focus:ring-2 focus:ring-red-200"
        : "border border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
    }`;
  }

  if (!ratingIsValid || !rating) {
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
              <span>Share Feedback</span>
            </nav>
            <h1 className="mb-4 text-4xl font-extrabold leading-tight md:text-5xl landscape-mobile:text-2xl landscape-mobile:leading-snug">
              Tell Us How We Can Improve
            </h1>
            <p className="max-w-3xl text-xl text-blue-100 landscape-mobile:text-base">
              We&apos;re sorry your experience was not what you expected. Please share what happened so our team can
              follow up and make it right.
            </p>
          </div>
        </section>

        <section className="bg-white px-4 py-12">
          <div className="mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900">Please choose a rating first.</h2>
            <p className="mt-3 text-base leading-7 text-gray-700">
              Start on the review page so we can route your feedback to the right place.
            </p>
            <Link
              href="/review"
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-700 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-800"
            >
              Go to Review Page
            </Link>
          </div>
        </section>
      </>
    );
  }

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
            <span>Share Feedback</span>
          </nav>
          <h1 className="mb-4 text-4xl font-extrabold leading-tight md:text-5xl landscape-mobile:text-2xl landscape-mobile:leading-snug">
            Tell Us How We Can Improve
          </h1>
          <p className="max-w-3xl text-xl text-blue-100 landscape-mobile:text-base">
            We&apos;re sorry your experience was not what you expected. Please share what happened so our team can
            follow up and make it right.
          </p>
        </div>
      </section>

      <section className="bg-white px-4 py-12">
        <div className="mx-auto max-w-4xl">
          {status === "success" ? (
            <div
              ref={successRef}
              tabIndex={-1}
              className="rounded-3xl border border-green-200 bg-gradient-to-br from-green-50 to-blue-50 p-6 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-300 sm:p-8"
              role="status"
              aria-live="polite"
            >
              <h2 className="text-2xl font-bold text-green-950">Thank you — we received your feedback.</h2>
              <p className="mt-3 text-base leading-7 text-slate-800">
                Our team will review your message. If you need immediate help, call 509-353-0476.
              </p>
              <a
                href={telHref}
                className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-700 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-800"
              >
                Call 509-353-0476
              </a>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="review-agent" className="mb-1 block text-sm font-medium text-gray-700">
                    Agent reviewed
                  </label>
                  <input id="review-agent" value={agentLabel} readOnly className={getFieldClassName(false)} />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="review-rating" className="mb-1 block text-sm font-medium text-gray-700">
                    Star rating
                  </label>
                  <input id="review-rating" value={ratingLabel} readOnly className={getFieldClassName(false)} />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="review-fullName" className="mb-1 block text-sm font-medium text-gray-700">
                    Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="review-fullName"
                    name="fullName"
                    type="text"
                    required
                    autoComplete="name"
                    aria-invalid={fieldErrors.fullName ? "true" : "false"}
                    aria-describedby={fieldErrors.fullName ? "review-fullName-error" : undefined}
                    className={getFieldClassName(Boolean(fieldErrors.fullName))}
                  />
                  {fieldErrors.fullName ? (
                    <p id="review-fullName-error" className="mt-2 text-sm text-red-700" role="alert">
                      {fieldErrors.fullName}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="review-email" className="mb-1 block text-sm font-medium text-gray-700">
                    Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="review-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    aria-invalid={fieldErrors.email ? "true" : "false"}
                    aria-describedby={fieldErrors.email ? "review-email-error" : undefined}
                    className={getFieldClassName(Boolean(fieldErrors.email))}
                  />
                  {fieldErrors.email ? (
                    <p id="review-email-error" className="mt-2 text-sm text-red-700" role="alert">
                      {fieldErrors.email}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="review-phone" className="mb-1 block text-sm font-medium text-gray-700">
                    Phone <span className="font-normal text-gray-500">(optional)</span>
                  </label>
                  <input
                    id="review-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    aria-invalid={fieldErrors.phone ? "true" : "false"}
                    aria-describedby={fieldErrors.phone ? "review-phone-error" : undefined}
                    className={getFieldClassName(Boolean(fieldErrors.phone))}
                  />
                  {fieldErrors.phone ? (
                    <p id="review-phone-error" className="mt-2 text-sm text-red-700" role="alert">
                      {fieldErrors.phone}
                    </p>
                  ) : null}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="review-message" className="mb-1 block text-sm font-medium text-gray-700">
                    Comment or message <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id="review-message"
                    name="message"
                    rows={6}
                    required
                    aria-invalid={fieldErrors.message ? "true" : "false"}
                    aria-describedby={fieldErrors.message ? "review-message-error" : undefined}
                    className={getFieldClassName(Boolean(fieldErrors.message))}
                  />
                  {fieldErrors.message ? (
                    <p id="review-message-error" className="mt-2 text-sm text-red-700" role="alert">
                      {fieldErrors.message}
                    </p>
                  ) : null}
                </div>
              </div>

              {status === "error" ? (
                <p className="mt-4 text-sm text-red-700" role="alert">
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-700 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-800 disabled:bg-blue-400"
              >
                {status === "submitting" ? "Sending..." : "Send Feedback"}
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
