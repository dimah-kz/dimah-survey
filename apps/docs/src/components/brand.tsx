import { BrandMark } from "@/lib/brand-mark";
import { packageVersion } from "@/lib/shared";

export function BrandTitle() {
  return (
    <span className="inline-flex items-center gap-2.5 text-fd-foreground">
      <span
        aria-hidden
        className="grid size-6 place-items-center rounded-md bg-fd-primary text-fd-primary-foreground shadow-sm"
      >
        <BrandMark size={14} color="currentColor" />
      </span>
      <span className="inline-flex items-center gap-1.75">
        <span className="text-sm font-semibold tracking-[-0.02em]">
          dimah<span className="text-fd-muted-foreground">-survey</span>
        </span>
        <span className="ms-0.5 rounded-full border border-fd-border bg-fd-muted/80 px-1.5 py-0.5 text-[11px] font-medium tracking-wide text-fd-muted-foreground tabular-nums">
          v{packageVersion}
        </span>
      </span>
    </span>
  );
}
