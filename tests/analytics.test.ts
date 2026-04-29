import { trackEvent, trackLeadSubmit } from '@/lib/analytics';

describe('analytics', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'gtag', {
      value: jest.fn(),
      writable: true,
      configurable: true,
    });
  });

  it('calls gtag with event data', () => {
    trackEvent('test_event', { key: 'value' });
    expect(window.gtag).toHaveBeenCalledWith('event', 'test_event', { key: 'value' });
  });

  it('trackLeadSubmit calls gtag with lead event', () => {
    trackLeadSubmit({ source: 'google' });
    expect(window.gtag).toHaveBeenCalledWith('event', 'generate_lead', {
      event_category: 'lead_form',
      event_label: 'google',
    });
  });

  it('does not throw when gtag is not available', () => {
    Object.defineProperty(window, 'gtag', { value: undefined, writable: true, configurable: true });
    expect(() => trackEvent('test')).not.toThrow();
  });
});
