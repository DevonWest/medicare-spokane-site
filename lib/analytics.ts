"use client";

/**
 * Privacy-first analytics helpers.
 *
 * RULES (enforced by trackLeadConversion):
 *   - NEVER include name, email, phone, ZIP, IP, message body, or any free-text
 *     PII/PHI in the dataLayer payload.
 *   - Only structural / categorical metadata is sent: event name, lead source
 *     (which page/form), UTM source/medium/campaign, site env, and a boolean
 *     "had_message" flag.
 *   - Calls are no-ops when GTM isn't configured or when running on the server.
 */

import { sendGTMEvent } from "@next/third-parties/google";
import { getGtmId, getSiteEnv } from "./env";
import type { LeadSource } from "./leads";
import type { UtmParams } from "./utm";

export interface LeadConversionMeta {
  source: LeadSource;
  utm?: UtmParams;
  hadMessage?: boolean;
}

/** Whether GTM is configured for this build. */
function gtmEnabled(): boolean {
  return Boolean(getGtmId());
}

/**
 * Fire a privacy-friendly `generate_lead` conversion event.
 *
 * The event name `generate_lead` matches GA4's recommended events vocabulary
 * so it can be mapped to a conversion in GA4 / Google Ads via GTM without any
 * extra code on the page.
 */
export function trackLeadConversion(meta: LeadConversionMeta): void {
  if (typeof window === "undefined" || !gtmEnabled()) return;

  // Whitelist UTM keys — never forward arbitrary fields.
  const utm = meta.utm
    ? {
        utm_source: clean(meta.utm.source),
        utm_medium: clean(meta.utm.medium),
        utm_campaign: clean(meta.utm.campaign),
        utm_term: clean(meta.utm.term),
        utm_content: clean(meta.utm.content),
      }
    : undefined;

  sendGTMEvent({
    event: "generate_lead",
    lead_source: meta.source,
    had_message: meta.hadMessage ? "yes" : "no",
    site_env: getSiteEnv(),
    ...(utm ?? {}),
  });
}

/** Returns undefined for empty/whitespace-only strings so GTM ignores them. */
function clean(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}
