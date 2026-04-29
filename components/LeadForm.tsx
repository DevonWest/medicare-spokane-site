"use client";

import { useState } from "react";
import type { LeadSource } from "@/lib/leads";

interface LeadFormProps {
  source: LeadSource;
  heading?: string;
  subheading?: string;
  showMessage?: boolean;
  className?: string;
}

type Status = "idle" | "submitting" | "success" | "error";

export default function LeadForm({
  source,
  heading = "Request a Free Medicare Review",
  subheading = "Fill out the form and a licensed agent will contact you. There is no cost or obligation.",
  showMessage = false,
  className = "",
}: LeadFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      zip: String(formData.get("zip") ?? ""),
      message: showMessage ? String(formData.get("message") ?? "") : undefined,
      source,
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };

      if (!res.ok || !data.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Something went wrong. Please call us instead.");
        return;
      }

      setStatus("success");
      event.currentTarget.reset();
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please call us instead.");
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
          Your request was received. A licensed agent will reach out shortly. For immediate help, please call us.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 ${className}`}
      noValidate
    >
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{heading}</h3>
        <p className="text-gray-600 text-sm">{subheading}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label htmlFor="lead-fullName" className="block text-sm font-medium text-gray-700 mb-1">
            Full name <span className="text-red-600">*</span>
          </label>
          <input
            id="lead-fullName"
            name="fullName"
            type="text"
            required
            autoComplete="name"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
          />
        </div>

        <div>
          <label htmlFor="lead-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-600">*</span>
          </label>
          <input
            id="lead-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
          />
        </div>

        <div>
          <label htmlFor="lead-phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone <span className="text-red-600">*</span>
          </label>
          <input
            id="lead-phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="lead-zip" className="block text-sm font-medium text-gray-700 mb-1">
            ZIP code
          </label>
          <input
            id="lead-zip"
            name="zip"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{5}"
            maxLength={5}
            autoComplete="postal-code"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
          />
        </div>

        {showMessage && (
          <div className="sm:col-span-2">
            <label htmlFor="lead-message" className="block text-sm font-medium text-gray-700 mb-1">
              How can we help?
            </label>
            <textarea
              id="lead-message"
              name="message"
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
            />
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
        By submitting, you agree to be contacted by a licensed insurance agent about Medicare insurance options. We do
        not offer every plan available in your area. Any information we provide is limited to the plans we do offer in
        your area. Please contact Medicare.gov or 1-800-MEDICARE to get information on all of your options.
      </p>
    </form>
  );
}
