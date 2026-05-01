"use client";

import { useEffect, useState } from "react";
import { buildLeadFormFields, buildLeadRequestPayload } from "@/lib/leadPayload";
import { validateLead, validateLeadRequest } from "@/lib/leadValidation";
import type { LeadSource } from "@/lib/leads";
import { isLeadErrorResponse, isLeadSuccessResponse } from "@/lib/leadResponse";
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

  function getFieldClassName(hasError: boolean) {
    return `w-full rounded-lg px-3 py-2 text-gray-900 outline-none ${
      hasError
        ? "border border-red-600 focus:border-red-700 focus:ring-2 focus:ring-red-200"
        : "border border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
    }`;
  }

  // Capture UTMs once on mount so they survive client-side navigation.
  useEffect(() => {
    captureUtmFromLocation();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
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

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });
      let data: unknown = null;
      try {
        data = await res.json();
      } catch (error) {
        console.warn("[LeadForm] Failed to parse lead API response.", error);
      }

      if (!res.ok || !isLeadSuccessResponse(data)) {
        setStatus("error");
        setErrorMessage(
          isLeadErrorResponse(data) ? data.error : "Something went wrong. Please call us instead.",
        );
        return;
      }
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please call us instead.");
      return;
    }

    setStatus("success");
    setFieldErrors({});
    event.currentTarget.reset();

    try {
      // Privacy-friendly conversion tracking — no PII/PHI sent to GTM.
      trackLeadConversion({
        source,
        utm: Object.keys(utm).length ? utm : undefined,
        hadMessage: showMessage && Boolean(fields.message && fields.message.trim()),
      });
    } catch (error) {
      console.warn("[LeadForm] Lead submitted but conversion tracking failed.", error);
    }
  }

  if (status === "success") {
    return (
      <div
        className={`bg-green-50 border border-green-200 rounded-xl p-6 text-center ${className}`}
        role="status"
        aria-live="polite"
      >
        <h3 className="text-xl font-semibold text-green-900 mb-2">Thank you!</h3>
        <p className="text-green-800">
          Your request was received. A licensed agent will reach out shortly — usually the same business day. For
          immediate help, please call us.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 ${className}`}
      noValidate
      aria-describedby="lead-form-reassurance"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{heading}</h2>
        <p className="text-gray-600 text-sm">{subheading}</p>
        <p id="lead-form-reassurance" className="text-gray-600 text-sm mt-2">
          We typically respond the same business day. There is no cost and no obligation.
        </p>
        <p className="text-sm text-gray-700 mt-2">
          <span className="text-red-600" aria-hidden="true">
            *
          </span>{" "}
          Required fields
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label htmlFor="lead-fullName" className="block text-sm font-medium text-gray-700 mb-1">
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
          <label htmlFor="lead-email" className="block text-sm font-medium text-gray-700 mb-1">
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
          <label htmlFor="lead-phone" className="block text-sm font-medium text-gray-700 mb-1">
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
          <label htmlFor="lead-zip" className="block text-sm font-medium text-gray-700 mb-1">
            ZIP code
          </label>
          <p id="lead-zip-helper" className="mb-1 text-sm text-gray-600">
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
            <label htmlFor="lead-message" className="block text-sm font-medium text-gray-700 mb-1">
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
        className="mt-6 w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
      >
        {status === "submitting" ? "Sending..." : "Request My Free Medicare Review"}
      </button>

      <p className="mt-4 text-xs text-gray-500 leading-relaxed">
        By submitting, you agree to be contacted by a licensed insurance professional about Medicare insurance
        options. We do not offer every plan available in your area. Currently, we represent 8 organizations which
        offer 75 products in your area. Please contact Medicare.gov, 1-800-MEDICARE, or your local State Health
        Insurance Assistance Program (SHIP) to get information on all of your options.
      </p>
    </form>
  );
}
