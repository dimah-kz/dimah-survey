import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "#0f766e",
        borderRadius: "14px",
        color: "#ffffff",
        display: "flex",
        fontFamily: "sans-serif",
        fontSize: 34,
        fontWeight: 700,
        height: "100%",
        justifyContent: "center",
        letterSpacing: "-3px",
        width: "100%",
      }}
    >
      D
    </div>,
    size,
  );
}
