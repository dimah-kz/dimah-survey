import { brandIcon } from "@/lib/brand-mark";

const sizes = {
  "192": 192,
  "512": 512,
} as const;

export function generateImageMetadata() {
  return (Object.keys(sizes) as (keyof typeof sizes)[]).map((id) => ({
    contentType: "image/png",
    id,
    size: { width: sizes[id], height: sizes[id] },
  }));
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const iconId = await id;
  const size = sizes[iconId as keyof typeof sizes] ?? sizes["192"];

  return brandIcon(size);
}
