"use client";

import { useEffect, useRef, useState } from "react";
import {
  AEP_CONTACT_OPTIONS,
  AEP_HELP_OPTIONS,
  AEP_TIME_OPTIONS,
  buildAepLeadMessage,
  isAepBestTime,
  isAepContactPreference,
  isAepHelpType,
} from "@/lib/aepLead";
import { trackLeadConversion } from "@/lib/analytics";
import { buildLeadRequestPayload, type LeadFormFields } from "@/lib/leadPayload";
import { submitLeadRequest } from "@/lib/leadSubmissionClient";
import { validateLead, validateLeadRequest } from "@/lib/leadValidation";
import { siteConfig, telHref } from "@/lib/site";
import { captureUtmFromLocation } from "@/lib/utm";

type Status = "idle" | "submitting" | "success" | "error";
type FieldName =
  | "fullName"
  | "email"
  | "phone"
  | "zip"
  | "helpType"
  | "contactPreference"
  | "wantsReview"
  | "consent";
type FieldErrors = Partial<Record<FieldName, string>>;

const source = "spokane-aep-review" as const;

function getTextFieldClassName(hasError: boolean) {
  return `min-h-12 w-full rounded-xl bg-white px-3.5 py-3 text-base leading-5 text-slate-950 outline-none transition ${
    hasError
      ? "border border-red-600 focus:border-red-700 focus:ring-2 focus:ring-red-200"
      : "border border-slate-300 focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
  }`;
}

function valueFrom(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

export default function AepReviewLeadForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    captureUtmFromLocation();
  }, []);

  useEffect(() => {
    if (status !== "success") return;
    successRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    successRef.current?.focus();
  }, [status]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setFieldErrors({});

    const form = event.currentTarget;
    const formData = new FormData(form);
    const fullName = valueFrom(formData, "fullName");
    const email = valueFrom(formData, "email");
    const phone = valueFrom(formData, "phone");
    const zip = valueFrom(formData, "zip");
    const helpType = valueFrom(formData, "helpType");
    const contactPreference = valueFrom(formData, "contactPreference");
    const bestTime = valueFrom(formData, "bestTime");
    const wantsReview = formData.get("wantsReview") === "yes";
    const consent = formData.get("consent") === "yes";

    const fieldsForValidation: LeadFormFields = { fullName, email, phone, zip };
    const baseValidation = validateLead(fieldsForValidation);
    const errors: FieldErrors = {
      fullName: baseValidation.errors.fullName,
      email: baseValidation.errors.email,
      phone: baseValidation.errors.phone,
      zip: baseValidation.errors.zip,
    };

    if (!email) errors.email = "Email is required.";
    if (!phone) errors.phone = "Phone number is required.";
    if (!zip) errors.zip = "ZIP code is required.";
    if (!isAepHelpType(helpType)) errors.helpType = "Choose what you would like help reviewing.";
    if (!isAepContactPreference(contactPreference)) {
      errors.contactPreference = "Choose how you would like us to contact you.";
    }
    if (!wantsReview) errors.wantsReview = "Confirm that you would like a Medicare review.";
    if (!consent) errors.consent = "Consent is required so a licensed agent can contact you.";

    if (
      Object.values(errors).some(Boolean) ||
      !isAepHelpType(helpType) ||
      !isAepContactPreference(contactPreference) ||
      !isAepBestTime(bestTime)
    ) {
      setFieldErrors(errors);
      setStatus("error");
      setErrorMessage("Please complete the highlighted fields.");
      return;
    }

    const fields: LeadFormFields = {
      ...fieldsForValidation,
      message: buildAepLeadMessage({ helpType, contactPreference, bestTime }),
    };
    const utm = captureUtmFromLocation();
    const requestPayload = buildLeadRequestPayload({
      fields,
      source,
      sourcePath: typeof window !== "undefined" ? window.location.pathname : "/spokane-aep-review",
      referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
      utm: Object.keys(utm).length ? utm : undefined,
      clientSubmittedAt: new Date().toISOString(),
    });
    const requestValidation = validateLeadRequest(requestPayload);

    if (!requestValidation.ok) {
      setStatus("error");
      setErrorMessage(requestValidation.error ?? "Please review your information and try again.");
      return;
    }

    setStatus("submitting");
    const result = await submitLeadRequest(fetch, requestPayload);

    if (result.kind !== "success") {
      setStatus("error");
      setErrorMessage(result.message);
      return;
    }

    trackLeadConversion({ source, utm: Object.keys(utm).length ? utm : undefined, hadMessage: true });
    form.reset();
    setFieldErrors({});
    setErrorMessage("");
    setStatus("success");
  }

  if (status === "success") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-blue-50 p-6 shadow-xl outline-none focus:ring-2 focus:ring-emerald-300 sm:p-8"
      >
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-700 text-2xl font-bold text-white" aria-hidden="true">
          ✓
        </span>
        <h2 className="mt-5 text-2xl font-bold text-slate-950">Your review request is in.</h2>
        <p className="mt-3 text-base leading-7 text-slate-700">
          A licensed local agent will review your request and contact you, typically the same business day during business hours.
        </p>
        <a
          href={telHref}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-800 px-5 py-3 font-semibold text-white transition hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Need help now? Call {siteConfig.phone}
        </a>
      </div>
    );
  }

  return (
    <form
      id="aep-review-form"
      onSubmit={handleSubmit}
      noValidate
      className="scroll-mt-28 rounded-3xl border border-blue-100 bg-white p-5 shadow-xl shadow-blue-950/10 sm:p-7"
      aria-describedby="aep-form-intro aep-form-disclosure"
    >
      <div className="mb-5">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">No-cost local review</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">Request your Medicare review</h2>
        <p id="aep-form-intro" className="mt-2 text-sm leading-6 text-slate-600">
          Required fields help us confirm local plan availability and respond in the way you prefer.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="aep-fullName" className="mb-1.5 block text-sm font-semibold text-slate-800">
            Full name <span className="text-red-700">*</span>
          </label>
          <input
            id="aep-fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            aria-invalid={Boolean(fieldErrors.fullName)}
            aria-describedby={fieldErrors.fullName ? "aep-fullName-error" : undefined}
            className={getTextFieldClassName(Boolean(fieldErrors.fullName))}
          />
          {fieldErrors.fullName ? <p id="aep-fullName-error" className="mt-1.5 text-sm text-red-700">{fieldErrors.fullName}</p> : null}
        </div>

        <div>
          <label htmlFor="aep-phone" className="mb-1.5 block text-sm font-semibold text-slate-800">
            Phone number <span className="text-red-700">*</span>
          </label>
          <input
            id="aep-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            aria-invalid={Boolean(fieldErrors.phone)}
            aria-describedby={fieldErrors.phone ? "aep-phone-error" : undefined}
            className={getTextFieldClassName(Boolean(fieldErrors.phone))}
          />
          {fieldErrors.phone ? <p id="aep-phone-error" className="mt-1.5 text-sm text-red-700">{fieldErrors.phone}</p> : null}
        </div>

        <div>
          <label htmlFor="aep-email" className="mb-1.5 block text-sm font-semibold text-slate-800">
            Email <span className="text-red-700">*</span>
          </label>
          <input
            id="aep-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "aep-email-error" : undefined}
            className={getTextFieldClassName(Boolean(fieldErrors.email))}
          />
          {fieldErrors.email ? <p id="aep-email-error" className="mt-1.5 text-sm text-red-700">{fieldErrors.email}</p> : null}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="aep-zip" className="mb-1.5 block text-sm font-semibold text-slate-800">
            ZIP code <span className="text-red-700">*</span>
          </label>
          <input
            id="aep-zip"
            name="zip"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{5}"
            maxLength={5}
            autoComplete="postal-code"
            required
            aria-invalid={Boolean(fieldErrors.zip)}
            aria-describedby={fieldErrors.zip ? "aep-zip-error" : undefined}
            className={getTextFieldClassName(Boolean(fieldErrors.zip))}
          />
          {fieldErrors.zip ? <p id="aep-zip-error" className="mt-1.5 text-sm text-red-700">{fieldErrors.zip}</p> : null}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="aep-helpType" className="mb-1.5 block text-sm font-semibold text-slate-800">
            What would you like to review? <span className="text-red-700">*</span>
          </label>
          <select
            id="aep-helpType"
            name="helpType"
            defaultValue=""
            required
            aria-invalid={Boolean(fieldErrors.helpType)}
            aria-describedby={fieldErrors.helpType ? "aep-helpType-error" : undefined}
            className={getTextFieldClassName(Boolean(fieldErrors.helpType))}
          >
            <option value="" disabled>Select one</option>
            {AEP_HELP_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          {fieldErrors.helpType ? <p id="aep-helpType-error" className="mt-1.5 text-sm text-red-700">{fieldErrors.helpType}</p> : null}
        </div>

        <fieldset className="sm:col-span-2" aria-describedby={fieldErrors.contactPreference ? "aep-contactPreference-error" : undefined}>
          <legend className="mb-2 text-sm font-semibold text-slate-800">
            How should we contact you? <span className="text-red-700">*</span>
          </legend>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {AEP_CONTACT_OPTIONS.map((option) => (
              <label key={option.value} className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-800 has-[:checked]:border-blue-700 has-[:checked]:bg-blue-50">
                <input type="radio" name="contactPreference" value={option.value} className="h-4 w-4 accent-blue-700" />
                {option.label}
              </label>
            ))}
          </div>
          {fieldErrors.contactPreference ? <p id="aep-contactPreference-error" className="mt-1.5 text-sm text-red-700">{fieldErrors.contactPreference}</p> : null}
        </fieldset>

        <div className="sm:col-span-2">
          <label htmlFor="aep-bestTime" className="mb-1.5 block text-sm font-semibold text-slate-800">Best time to reach you</label>
          <select id="aep-bestTime" name="bestTime" defaultValue="anytime" className={getTextFieldClassName(false)}>
            {AEP_TIME_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm leading-6 ${fieldErrors.wantsReview ? "border-red-500 bg-red-50" : "border-slate-200 bg-slate-50"}`}>
          <input type="checkbox" name="wantsReview" value="yes" className="mt-1 h-4 w-4 shrink-0 accent-blue-700" />
          <span><strong>Yes, I would like a no-cost Medicare review.</strong> I understand I am requesting contact from a licensed insurance agent.</span>
        </label>
        {fieldErrors.wantsReview ? <p className="text-sm text-red-700">{fieldErrors.wantsReview}</p> : null}

        <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm leading-6 ${fieldErrors.consent ? "border-red-500 bg-red-50" : "border-slate-200 bg-slate-50"}`}>
          <input type="checkbox" name="consent" value="yes" className="mt-1 h-4 w-4 shrink-0 accent-blue-700" />
          <span>I agree that a licensed insurance agent from {siteConfig.legalName} may call, text, or email me about Medicare insurance options using the information I provided. Consent is not a condition of purchase.</span>
        </label>
        {fieldErrors.consent ? <p className="text-sm text-red-700">{fieldErrors.consent}</p> : null}
      </div>

      {status === "error" ? <p className="mt-4 text-sm font-medium text-red-700" role="alert">{errorMessage}</p> : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-5 min-h-12 w-full rounded-xl bg-blue-800 px-5 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-wait disabled:bg-blue-400"
      >
        {status === "submitting" ? "Sending your request…" : "Request My No-Cost Review"}
      </button>

      <div id="aep-form-disclosure" className="mt-4 space-y-2 text-[11px] leading-5 text-slate-500">
        <p>{siteConfig.disclaimer}</p>
        <p>{siteConfig.nonAffiliation}</p>
      </div>
    </form>
  );
}
