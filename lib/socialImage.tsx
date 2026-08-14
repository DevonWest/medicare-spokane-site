import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const socialImageSize = {
  width: 1200,
  height: 630,
};

export function createSocialImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#173b73",
          color: "#ffffff",
          padding: "68px 76px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div
            style={{
              width: "92px",
              height: "92px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "22px",
              background: "#ffffff",
              color: "#173b73",
              fontSize: "34px",
              fontWeight: 800,
              letterSpacing: "-2px",
            }}
          >
            HIO
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "28px", fontWeight: 700 }}>
              Health Insurance Options LLC
            </div>
            <div style={{ marginTop: "7px", fontSize: "20px", color: "#cfe3ff" }}>
              Licensed Independent Insurance Agency · Spokane, WA
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: "980px" }}>
          <div
            style={{
              fontSize: "74px",
              lineHeight: 1.04,
              fontWeight: 800,
              letterSpacing: "-3px",
            }}
          >
            Medicare in Spokane
          </div>
          <div style={{ marginTop: "22px", fontSize: "34px", lineHeight: 1.25, color: "#e6f1ff" }}>
            Local Medicare and individual health insurance guidance
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "2px solid #42679f",
            paddingTop: "24px",
            fontSize: "22px",
            color: "#d9eaff",
          }}
        >
          <div>medicareinspokane.com</div>
          <div>{`${siteConfig.phone} · No-cost consultations`}</div>
        </div>
      </div>
    ),
    socialImageSize,
  );
}
