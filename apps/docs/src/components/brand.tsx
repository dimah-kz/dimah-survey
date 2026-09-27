export function BrandTitle() {
  return (
    <span className="inline-flex items-center gap-2.5 text-fd-foreground">
      <span
        aria-hidden
        className="grid size-6 place-items-center rounded-md bg-fd-primary text-fd-primary-foreground shadow-sm"
      >
        <svg viewBox="0 0 16 16" className="size-3.5 fill-none">
          <path
            d="M3 3.25h4.2a3.55 3.55 0 1 1 0 7.1H3v-7.1Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          <path
            d="M3 12.75h5.8"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
        </svg>
      </span>
      <span className="text-sm font-semibold tracking-[-0.02em]">
        dimah<span className="text-fd-muted-foreground">-survey</span>
      </span>
    </span>
  );
}
