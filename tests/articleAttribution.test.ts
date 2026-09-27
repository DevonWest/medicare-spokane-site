import assert from "node:assert/strict";
import test from "node:test";
import { ARTICLE_PATHS, lastArticlePath, rememberArticle } from "../lib/articleAttribution";
import { trackLeadConversion } from "../lib/analytics";

test("article attribution survives navigation and never includes free-form fields", () => {
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  let saved = "";
  const win = {
    location: { hostname: "www.medicareinspokane.com", pathname: ARTICLE_PATHS[0] as string, href: "https://www.medicareinspokane.com/contact?email=private@example.com" },
    sessionStorage: { setItem: (_key: string, value: string) => { saved = value; }, getItem: () => saved },
    dataLayer: [] as unknown[],
  };
  Object.defineProperty(globalThis, "window", { value: win, configurable: true });
  Object.defineProperty(globalThis, "document", { value: { referrer: "" }, configurable: true });
  try {
    rememberArticle(ARTICLE_PATHS[0]);
    win.location.pathname = "/contact";
    assert.equal(lastArticlePath(), ARTICLE_PATHS[0]);
    rememberArticle("/contact?email=private@example.com");
    assert.equal(lastArticlePath(), ARTICLE_PATHS[0]);
    trackLeadConversion({ source: "contact", hadMessage: true });
    const event = win.dataLayer.map((entry) => Array.from(entry as ArrayLike<unknown>)).find((entry) => entry[1] === "generate_lead");
    assert.equal((event?.[2] as Record<string, string>).article_path, ARTICLE_PATHS[0]);
    assert.equal(JSON.stringify(win.dataLayer).includes("private"), false);
    saved = JSON.stringify({ path: ARTICLE_PATHS[0], at: Date.now() - 31 * 60 * 1000 });
    assert.equal(lastArticlePath(), undefined);
    saved = JSON.stringify({ path: "/contact?email=private@example.com", at: Date.now() });
    assert.equal(lastArticlePath(), undefined);
    saved = "invalid json";
    assert.equal(lastArticlePath(), undefined);
    win.sessionStorage.getItem = () => { throw new Error("Storage blocked"); };
    win.sessionStorage.setItem = () => { throw new Error("Storage blocked"); };
    assert.doesNotThrow(() => rememberArticle(ARTICLE_PATHS[0]));
    assert.equal(lastArticlePath(), undefined);
  } finally {
    if (oldWindow) Object.defineProperty(globalThis, "window", oldWindow); else Reflect.deleteProperty(globalThis, "window");
    if (oldDocument) Object.defineProperty(globalThis, "document", oldDocument); else Reflect.deleteProperty(globalThis, "document");
  }
});
