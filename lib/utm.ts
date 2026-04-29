export function captureUTM(): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  utmKeys.forEach((key) => {
    const value = params.get(key);
    if (value) {
      sessionStorage.setItem(key, value);
    }
  });
}

export function getUTMData(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  const data: Record<string, string> = {};
  utmKeys.forEach((key) => {
    const value = sessionStorage.getItem(key);
    if (value) data[key] = value;
  });
  return data;
}
