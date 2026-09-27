"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { getGaMeasurementId, getSiteEnv } from "@/lib/env";
import { isPublicAnalyticsPath, trackContactClick, trackPageView, trackArticleHelpClick } from "@/lib/analytics";
import { rememberArticle } from "@/lib/articleAttribution";

export default function SiteAnalytics() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);
  const id = getGaMeasurementId();
  const active = Boolean(id) && getSiteEnv() === "production" && isPublicAnalyticsPath(pathname);

  useEffect(() => {
    // Stop automatic events too if someone enters the private CMS in this session.
    Reflect.set(window, `ga-disable-${id}`, !active);
    if (!active) {
      lastPath.current = null;
      return;
    }
    rememberArticle(pathname);
    if (lastPath.current !== pathname) {
      trackPageView();
      lastPath.current = pathname;
    }
    function onClick(event: MouseEvent) {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      const href = link?.getAttribute("href") || "";
      if (href.startsWith("tel:")) trackContactClick("phone");
      if (href.startsWith("mailto:")) trackContactClick("email");
      if (href === "/contact#contact-form" && link?.closest("[data-article-help]")) trackArticleHelpClick();
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [active, id, pathname]);

  if (!active) return null;
  return <Script id="spokane-ga4" src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />;
}
