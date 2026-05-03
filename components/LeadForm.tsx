"use client";

import { useEffect, useRef, useState } from "react";
import FriendlyIllustration from "@/components/FriendlyIllustration";
import { buildLeadFormFields, buildLeadRequestPayload } from "@/lib/leadPayload";
import { submitLeadRequest } from "@/lib/leadSubmissionClient";
import { validateLead, validateLeadRequest } from "@/lib/leadValidation";
import type { LeadSource } from "@/lib/leads";
import { captureUtmFromLocation } from "@/lib/utm";
import { trackLeadConversion } from "@/lib/analytics";

interface LeadFormProps {
  source: LeadSource;
  heading?: string;
  subheading?: string;
  showMessage?: boolean;
  className?: string;
}

type Status = "idle" | "submitting" | "success" | "error";
type FieldErrors = Partial<Record<"fullName" | "email" | "phone" | "zip" | "message", string>>;

export default function LeadForm({
  source,
  heading = "Request a Free Medicare Review",
  subheading = "Fill out the form and a licensed agent will contact you. There is no cost or obligation.",
  showMessage = false,
  className = "",
}: LeadFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const successRef = useRef<HTMLDivElement>(null);

  function getFieldClassName(hasError: boolean) {
    return `min-h-11 w-full scroll-mb-[calc(var(--mobile-sticky-cta-offset)+1rem)] rounded-lg px-3 py-2.5 text-base leading-5 text-gray-900 outline-none ${
      hasError
        ? "border border-red-600 focus:border-red-700 focus:ring-2 focus:ring-red-200"
        : "border border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
    }`;
  }

  // Capture UTMs once on mount so they survive client-side navigation.
  useEffect(() => {
    captureUtmFromLocation();
  }, []);

  useEffect(() => {
    if (status !== "success") return;

    successRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    successRef.current?.focus();
  }, [status]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setFieldErrors({});

    const form = event.currentTarget;

    const formData = new FormData(form);
    const fields = buildLeadFormFields(formData, showMessage);

    const validation = validateLead(fields);
    if (!validation.ok) {
      setStatus("error");
      setFieldErrors(validation.errors);
      setErrorMessage(validation.error ?? "Please review your submission and try again.");
      return;
    }

    setStatus("submitting");

    // Capture attribution data at submit time.
    const utm = captureUtmFromLocation();
    const requestPayload = buildLeadRequestPayload({
      fields,
      source,
      sourcePath: typeof window !== "undefined" ? window.location.pathname : "/",
      referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
      utm: Object.keys(utm).length ? utm : undefined,
      clientSubmittedAt: new Date().toISOString(),
    });
    const requestValidation = validateLeadRequest(requestPayload);
    if (!requestValidation.ok) {
      setStatus("error");
      setErrorMessage(requestValidation.error ?? "Please review your submission and try again.");
      return;
    }

    const result = await submitLeadRequest(fetch, requestPayload);

    if (result.kind !== "success") {
      setStatus("error");
      setErrorMessage(result.message);
      return;
    }

    setStatus("success");
    setErrorMessage("");
    setFieldErrors({});
    // Privacy-friendly conversion tracking — no PII/PHI sent to GTM.
    trackLeadConversion({
      source,
      utm: Object.keys(utm).length ? utm : undefined,
      hadMessage: showMessage && Boolean(fields.message && fields.message.trim()),
    });
    form.reset();
  }

  return (
    <div className={`scroll-mt-[calc(var(--mobile-header-offset)+0.75rem)] ${className}`.trim()}>
      {status === "success" && (
        <div
          ref={successRef}
          tabIndex={-1}
          className="mb-5 rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-blue-50 p-5 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-300 sm:mb-6 sm:p-6"
          role="status"
          aria-live="polite"
        >
          <div className="mb-5 hidden overflow-hidden rounded-2xl border border-white/80 bg-white p-4 shadow-sm sm:block">
            <FriendlyIllustration name="requestConfirmation" />
          </div>
          <h3 className="mb-3 text-2xl font-semibold text-green-950">Thank you — we received your request.</h3>
          <p className="text-base leading-7 text-slate-800">
            A licensed local Medicare agent will review your information and contact you soon. We typically respond the
            same business day during business hours.
          </p>
          <p className="mt-3 text-base font-medium text-slate-900">Need help right away? Call 509-353-0476.</p>
          <a
            href="tel:5093530476"
            className="mt-5 inline-flex min-h-11 scroll-mb-[calc(var(--mobile-sticky-cta-offset)+1rem)] items-center justify-center rounded-lg bg-blue-700 px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Call 509-353-0476
          </a>
        </div>
      )}

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8"
          noValidate
          aria-describedby="lead-form-reassurance"
        >
          <div className="mb-5">
            <h2 className="mb-2 text-xl font-bold text-gray-900 sm:text-2xl">{heading}</h2>
            <p className="text-sm leading-6 text-gray-600">{subheading}</p>
            <p id="lead-form-reassurance" className="mt-2 text-sm leading-6 text-gray-600">
              We typically respond the same business day. There is no cost and no obligation.
            </p>
            <p className="mt-1.5 text-sm text-gray-700">
              <span className="text-red-600" aria-hidden="true">
                *
            </span>{" "}
            Required fields
          </p>
        </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="lead-fullName" className="mb-1 block text-sm font-medium text-gray-700">
              Your full name <span className="text-red-600" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </label>
            <input
              id="lead-fullName"
              name="fullName"
              type="text"
              required
              autoComplete="name"
              aria-invalid={fieldErrors.fullName ? "true" : "false"}
              aria-describedby={fieldErrors.fullName ? "lead-fullName-error" : undefined}
              className={getFieldClassName(Boolean(fieldErrors.fullName))}
            />
            {fieldErrors.fullName && (
              <p id="lead-fullName-error" className="mt-2 text-sm text-red-700" role="alert">
                {fieldErrors.fullName}
              </p>
            )}
          </div>

          <div>
              <label htmlFor="lead-email" className="mb-1 block text-sm font-medium text-gray-700">
              Email <span className="text-red-600" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </label>
            <input
              id="lead-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              aria-invalid={fieldErrors.email ? "true" : "false"}
              aria-describedby={fieldErrors.email ? "lead-email-error" : undefined}
              className={getFieldClassName(Boolean(fieldErrors.email))}
            />
            {fieldErrors.email && (
              <p id="lead-email-error" className="mt-2 text-sm text-red-700" role="alert">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
              <label htmlFor="lead-phone" className="mb-1 block text-sm font-medium text-gray-700">
              Best phone number <span className="text-red-600" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </label>
            <input
              id="lead-phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              aria-invalid={fieldErrors.phone ? "true" : "false"}
              aria-describedby={fieldErrors.phone ? "lead-phone-error" : undefined}
              className={getFieldClassName(Boolean(fieldErrors.phone))}
            />
            {fieldErrors.phone && (
              <p id="lead-phone-error" className="mt-2 text-sm text-red-700" role="alert">
                {fieldErrors.phone}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
              <label htmlFor="lead-zip" className="mb-1 block text-sm font-medium text-gray-700">
                ZIP code
              </label>
              <p id="lead-zip-helper" className="mb-1 text-sm leading-5 text-gray-600">
                Optional, but helpful because Medicare plan availability varies by ZIP code.
              </p>
            <input
              id="lead-zip"
              name="zip"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{5}"
              maxLength={5}
              autoComplete="postal-code"
              aria-invalid={fieldErrors.zip ? "true" : "false"}
              aria-describedby={fieldErrors.zip ? "lead-zip-helper lead-zip-error" : "lead-zip-helper"}
              className={getFieldClassName(Boolean(fieldErrors.zip))}
            />
            {fieldErrors.zip && (
              <p id="lead-zip-error" className="mt-2 text-sm text-red-700" role="alert">
                {fieldErrors.zip}
              </p>
            )}
          </div>

          {showMessage && (
            <div className="sm:col-span-2">
              <label htmlFor="lead-message" className="mb-1 block text-sm font-medium text-gray-700">
                How can we help?{" "}
                <span className="font-normal text-gray-500">(turning 65, comparing plans, helping a parent, etc.)</span>
              </label>
              <textarea
                id="lead-message"
                name="message"
                rows={4}
                aria-invalid={fieldErrors.message ? "true" : "false"}
                aria-describedby={fieldErrors.message ? "lead-message-error" : undefined}
                className={getFieldClassName(Boolean(fieldErrors.message))}
              />
              {fieldErrors.message && (
                <p id="lead-message-error" className="mt-2 text-sm text-red-700" role="alert">
                  {fieldErrors.message}
                </p>
              )}
            </div>
          )}
        </div>

        {status === "error" && (
          <p className="mt-4 text-sm text-red-700" role="alert">
            {errorMessage}
          </p>
        )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="mt-5 min-h-11 w-full scroll-mb-[calc(var(--mobile-sticky-cta-offset)+1rem)] rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-800 disabled:bg-blue-400"
          >
            {status === "submitting" ? "Sending..." : "Request My Free Medicare Review"}
          </button>

          <p className="mt-4 text-[11px] leading-5 text-gray-500">
            By submitting, you agree to be contacted by a licensed insurance professional about Medicare insurance
            options. We do not offer every plan available in your area. Currently, we represent 8 organizations which
          offer 75 products in your area. Please contact Medicare.gov, 1-800-MEDICARE, or your local State Health
          Insurance Assistance Program (SHIP) to get information on all of your options.
        </p>
      </form>
    </div>
  );
}
