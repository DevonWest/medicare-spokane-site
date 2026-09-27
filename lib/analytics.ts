"use client";

import { sendGTMEvent } from "@next/third-parties/google";
import { getGaMeasurementId, getGtmId, getSiteEnv } from "./env";
import { LEAD_SOURCES, type LeadSource } from "./leadSources";
import type { UtmParams } from "./utm";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    spokaneGaInitialized?: boolean;
  }
}

export interface LeadConversionMeta {
  source: LeadSource;
  utm?: UtmParams;
  hadMessage?: boolean;
}

export function isPublicAnalyticsPath(path: string): boolean {
  return !/^\/(admin|api|healthz)(\/|$)/.test(path);
}

/** Drop arbitrary query strings, fragments, and potential identifiers. */
export function analyticsUrl(value: string, campaign = false): string {
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol)) return "";
    const clean = new URL(url.origin + url.pathname);
    if (campaign) {
      for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_id"]) {
        const value = url.searchParams.get(key);
        if (value && /^[a-z0-9_. -]{1,100}$/i.test(value) && !/\d{7,}/.test(value)) {
          clean.searchParams.set(key, value);
        }
      }
    }
    return clean.href;
  } catch {
    return "";
  }
}

function enabled(): boolean {
  return typeof window !== "undefined" && getSiteEnv() === "production" &&
    /^(www\.)?medicareinspokane\.com$/.test(window.location.hostname) &&
    isPublicAnalyticsPath(window.location.pathname);
}

export function initializeAnalytics(): boolean {
  const id = getGaMeasurementId();
  if (!id || !enabled()) return false;
  if (!window.spokaneGaInitialized) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      // Google's command queue uses Arguments objects, not GTM event objects.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("set", {
      page_location: analyticsUrl(window.location.href, true),
      page_referrer: analyticsUrl(document.referrer),
    });
    window.gtag("config", id, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    window.spokaneGaInitialized = true;
  }
  return true;
}

function track(name: string, params: Record<string, string> = {}): void {
  if (!enabled()) return;
  // Tracking must never turn a successfully saved request into a UI error.
  try {
    if (initializeAnalytics()) {
      window.gtag!("event", name, {
        ...params,
        send_to: getGaMeasurementId(),
        site_env: getSiteEnv(),
        page_location: analyticsUrl(window.location.href, true),
        page_referrer: analyticsUrl(document.referrer),
      });
    } else if (getGtmId()) {
      sendGTMEvent({ event: name, ...params, site_env: getSiteEnv() });
    }
  } catch {
    // An unavailable analytics service must not interrupt the website.
  }
}

export function trackPageView(): void {
  if (!enabled()) return;
  initializeAnalytics();
  window.gtag?.("set", "page_location", analyticsUrl(window.location.href, true));
  track("page_view", { page_title: document.title });
}

export function trackContactClick(method: "phone" | "email"): void {
  track(method === "phone" ? "phone_click" : "email_click", { contact_method: method });
}

export function trackFormStart(source: LeadSource): void {
  if (LEAD_SOURCES.includes(source)) track("form_start", { lead_source: source });
}

/** Only called after the server confirms the lead was saved. Never send form values. */
export function trackLeadConversion(meta: LeadConversionMeta): void {
  if (!LEAD_SOURCES.includes(meta.source)) return;
  track("generate_lead", { lead_source: meta.source, had_message: meta.hadMessage ? "yes" : "no" });
}
