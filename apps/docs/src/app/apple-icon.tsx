import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#0f766e",
        color: "#ffffff",
        display: "flex",
        fontFamily: "sans-serif",
        fontSize: 96,
        fontWeight: 700,
        height: "100%",
        justifyContent: "center",
        letterSpacing: "-8px",
        width: "100%",
      }}
    >
      D
    </div>,
    size,
  );
}
