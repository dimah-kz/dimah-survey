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

/** Same proportion as the nav badge (6px on 24px) and the dimah-form favicon (rx 8 on 32). */
const iconRadius = 0.25;

export function BrandTile({ size }: { size: number }) {
  const mark = Math.round(size * 0.62);

  return (
    <div
      style={{
        alignItems: "center",
        background: brandColor,
        borderRadius: Math.round(size * iconRadius),
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

export function brandIcon(size: number, options?: { rounded?: boolean }) {
  const rounded = options?.rounded ?? true;
  const mark = Math.round(size * (rounded ? 0.62 : 0.68));

  const radius = Math.round(size * iconRadius);
  const tile = (
    <div
      style={{
        alignItems: "center",
        background: brandColor,
        borderRadius: rounded ? radius : 0,
        display: "flex",
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <BrandMark size={mark} />
    </div>
  );

  return new ImageResponse(
    rounded ? (
      <div
        style={{
          background: "transparent",
          display: "flex",
          height: "100%",
          width: "100%",
        }}
      >
        {tile}
      </div>
    ) : (
      tile
    ),
    { width: size, height: size },
  );
}
