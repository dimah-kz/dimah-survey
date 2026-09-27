"use client";

import { Check, Copy } from "lucide-react";
import { useCopyButton } from "fumadocs-ui/utils/use-copy-button";

export function InstallCommand({ command }: { command: string }) {
  const [checked, onClick] = useCopyButton(() =>
    navigator.clipboard.writeText(command),
  );

  return (
    <button
      type="button"
      onClick={onClick}
      aria-live="polite"
      className="group inline-flex h-10 w-full min-w-0 items-center justify-center gap-2.5 rounded-lg border border-fd-border bg-fd-card/60 ps-3.5 pe-3 font-mono text-[0.8125rem] text-fd-foreground transition-colors hover:border-fd-foreground/15 hover:bg-fd-accent/60 sm:w-auto"
    >
      <span aria-hidden className="text-fd-muted-foreground select-none">
        $
      </span>
      <span className="truncate">{command}</span>
      <span className="sr-only">{checked ? "Copied" : "Copy"}</span>
      {checked ? (
        <Check aria-hidden className="size-3.5 shrink-0 text-fd-primary" />
      ) : (
        <Copy
          aria-hidden
          className="size-3.5 shrink-0 text-fd-muted-foreground transition-colors group-hover:text-fd-foreground"
        />
      )}
    </button>
  );
}
