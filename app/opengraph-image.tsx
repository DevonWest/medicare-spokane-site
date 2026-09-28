import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = "Medicare in Spokane — Health Insurance Options LLC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// A static, local fallback for shared links. No remote fonts, requests, or
// changes to page titles/canonicals; page-specific images can override it.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex",
          flexDirection: "column", justifyContent: "space-between",
          background: "#173b73", color: "#ffffff", padding: "68px 76px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{siteConfig.legalName}</div>
          <div style={{ marginTop: 10, fontSize: 22, color: "#cfe3ff" }}>
            Licensed Independent Insurance Agency · Spokane, WA
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 74, fontWeight: 800, letterSpacing: -3 }}>
            Medicare in Spokane
          </div>
          <div style={{ marginTop: 18, fontSize: 32, color: "#e6f1ff" }}>
            Local Medicare and health insurance guidance
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between",
          borderTop: "2px solid #42679f", paddingTop: 24, fontSize: 22 }}>
          <div>medicareinspokane.com</div>
          <div>{`${siteConfig.phone} · No-cost consultations`}</div>
        </div>
      </div>
    ),
    size,
  );
}
