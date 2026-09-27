import assert from "node:assert/strict";
import { test } from "node:test";
import { analyticsUrl, isPublicAnalyticsPath, trackLeadConversion, trackPageView, trackContactClick } from "../lib/analytics";

test("analytics strips personal URL fields and preserves safe campaign attribution", () => {
  const url = analyticsUrl("https://www.medicareinspokane.com/contact?email=jane@example.com&phone=5095550100&utm_source=facebook&utm_campaign=spokane-aep-2027&utm_term=diabetes#jane", true);
  assert.equal(url, "https://www.medicareinspokane.com/contact?utm_source=facebook&utm_campaign=spokane-aep-2027");
  assert.equal(analyticsUrl("https://example.com/?utm_campaign=jane@example.com", true), "https://example.com/");
  assert.equal(analyticsUrl("mailto:jane@example.com"), "");
  assert.equal(isPublicAnalyticsPath("/admin/knowledge/123"), false);
  assert.equal(isPublicAnalyticsPath("/contact"), true);
});

test("queues page, contact and saved-lead events once configured without form values", () => {
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const win = { location: { hostname: "www.medicareinspokane.com", pathname: "/contact", href: "https://www.medicareinspokane.com/contact?email=jane@example.com" }, dataLayer: [] as unknown[] };
  Object.defineProperty(globalThis, "window", { value: win, configurable: true });
  Object.defineProperty(globalThis, "document", { value: { title: "Contact", referrer: "https://google.com/?q=private" }, configurable: true });
  try {
    trackPageView();
    trackContactClick("phone");
    trackLeadConversion({ source: "contact", hadMessage: true, utm: { source: "jane@example.com" } });
    const commands = win.dataLayer.map((entry) => Array.from(entry as ArrayLike<unknown>));
    assert.equal(commands.filter((entry) => entry[0] === "config").length, 1);
    assert.deepEqual(commands.filter((entry) => entry[0] === "event").map((entry) => entry[1]), ["page_view", "phone_click", "generate_lead"]);
    assert.equal(JSON.stringify(commands).includes("jane"), false);
    assert.equal(JSON.stringify(commands).includes("private"), false);
    win.location.pathname = "/admin/knowledge";
    const count = win.dataLayer.length;
    trackLeadConversion({ source: "contact" });
    assert.equal(win.dataLayer.length, count);
    win.location.pathname = "/contact";
    win.location.hostname = "localhost";
    trackLeadConversion({ source: "contact" });
    assert.equal(win.dataLayer.length, count);
  } finally {
    if (oldWindow) Object.defineProperty(globalThis, "window", oldWindow); else Reflect.deleteProperty(globalThis, "window");
    if (oldDocument) Object.defineProperty(globalThis, "document", oldDocument); else Reflect.deleteProperty(globalThis, "document");
  }
});
