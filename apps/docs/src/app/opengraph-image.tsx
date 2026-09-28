import { ImageResponse } from "next/og";

import { brandColor } from "@/lib/brand";
import { BrandTile } from "@/lib/brand-mark";
import { siteDescription, siteHeadline, siteTitle } from "@/lib/shared";

export const alt = siteTitle;

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        background: "#f7faf9",
        color: "#10201e",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "space-between",
        padding: "72px",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          alignItems: "center",
          color: brandColor,
          display: "flex",
          fontFamily: "monospace",
          fontSize: 25,
          fontWeight: 700,
          gap: "14px",
          letterSpacing: "1px",
          textTransform: "uppercase",
        }}
      >
        <BrandTile size={42} />
        dimah-survey
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontFamily: "sans-serif",
            fontSize: 70,
            fontWeight: 700,
            letterSpacing: "-3.5px",
            lineHeight: 1.05,
            maxWidth: "940px",
          }}
        >
          <span>{siteHeadline}</span>
        </div>
        <div
          style={{
            color: "#4b5b58",
            fontFamily: "sans-serif",
            fontSize: 28,
            lineHeight: 1.35,
            maxWidth: "850px",
          }}
        >
          {siteDescription}
        </div>
      </div>

      <div
        style={{
          alignItems: "center",
          borderTop: "1px solid #c8d4d1",
          color: "#4b5b58",
          display: "flex",
          fontFamily: "monospace",
          fontSize: 19,
          justifyContent: "space-between",
          paddingTop: "26px",
        }}
      >
        <div style={{ display: "flex", gap: "22px" }}>
          <span>draft</span>
          <span style={{ color: brandColor }}>→</span>
          <span>publish</span>
          <span style={{ color: brandColor }}>→</span>
          <span>snapshot</span>
          <span style={{ color: brandColor }}>→</span>
          <span>submit</span>
        </div>
        <span>survey.dimah.dev</span>
      </div>
    </div>,
    size,
  );
}
