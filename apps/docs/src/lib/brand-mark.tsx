import { ImageResponse } from "next/og";

import { brandColor } from "@/lib/brand";

export function BrandMark({
  size,
  color = "#ffffff",
}: {
  size: number;
  color?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="-1.125 0 16 16"
      fill="none"
    >
      <path
        d="M3 3.25h4.2a3.55 3.55 0 1 1 0 7.1H3v-7.1Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 12.75h5.8"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BrandTile({ size }: { size: number }) {
  const mark = Math.round(size * 0.62);

  return (
    <div
      style={{
        alignItems: "center",
        background: brandColor,
        borderRadius: Math.round(size * 0.22),
        display: "flex",
        height: size,
        justifyContent: "center",
        width: size,
      }}
    >
      <BrandMark size={mark} />
    </div>
  );
}

/** Full-bleed tile. Browsers and Google crop the corners; the mark stays inside that crop. */
export function brandIcon(size: number) {
  const mark = Math.round(size * 0.68);

  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: brandColor,
        display: "flex",
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <BrandMark size={mark} />
    </div>,
    { width: size, height: size },
  );
}
