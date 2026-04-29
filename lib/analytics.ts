declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(eventName: string, params: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', eventName, params);
}

export function trackLeadSubmit(formData: { source?: string }): void {
  trackEvent('generate_lead', {
    event_category: 'lead_form',
    event_label: formData.source ?? 'unknown',
  });
}
