import { ImageResponse } from "next/og";

export const alt =
  "dimah-survey — server-authoritative response lifecycle for SurveyJS JSON";

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
          color: "#0f766e",
          display: "flex",
          fontFamily: "monospace",
          fontSize: 25,
          fontWeight: 700,
          gap: "14px",
          letterSpacing: "1px",
          textTransform: "uppercase",
        }}
      >
        <span
          style={{
            alignItems: "center",
            background: "#0f766e",
            borderRadius: "10px",
            color: "#ffffff",
            display: "flex",
            fontFamily: "sans-serif",
            fontSize: 25,
            height: "42px",
            justifyContent: "center",
            letterSpacing: "-2px",
            width: "42px",
          }}
        >
          D
        </span>
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
          <span>The survey can change.</span>
          <span style={{ color: "#0f766e" }}>The response should not.</span>
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
          Server-authoritative response lifecycle for SurveyJS JSON.
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
          gap: "22px",
          paddingTop: "26px",
        }}
      >
        <span>draft</span>
        <span style={{ color: "#0f766e" }}>→</span>
        <span>publish</span>
        <span style={{ color: "#0f766e" }}>→</span>
        <span>snapshot</span>
        <span style={{ color: "#0f766e" }}>→</span>
        <span>submit</span>
      </div>
    </div>,
    size,
  );
}
