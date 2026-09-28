import { BrandMark } from "@/lib/brand-mark";

export function BrandTitle() {
  return (
    <span className="inline-flex items-center gap-2.5 text-fd-foreground">
      <span
        aria-hidden
        className="grid size-6 place-items-center rounded-md bg-fd-primary text-fd-primary-foreground shadow-sm"
      >
        <BrandMark size={14} color="currentColor" />
      </span>
      <span className="text-sm font-semibold tracking-[-0.02em]">
        dimah<span className="text-fd-muted-foreground">-survey</span>
      </span>
    </span>
  );
}
