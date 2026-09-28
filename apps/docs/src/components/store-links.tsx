import Link from "next/link";
import type { SVGProps } from "react";

type MarkProps = SVGProps<SVGSVGElement>;

export function DrizzleMark(props: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="currentColor" {...props}>
      <path d="M5.353 11.823a1.036 1.036 0 0 0-.395-1.422 1.063 1.063 0 0 0-1.437.399L.138 16.702a1.035 1.035 0 0 0 .395 1.422 1.063 1.063 0 0 0 1.437-.398l3.383-5.903Zm11.216 0a1.036 1.036 0 0 0-.394-1.422 1.064 1.064 0 0 0-1.438.399l-3.382 5.902a1.036 1.036 0 0 0 .394 1.422c.506.283 1.15.104 1.438-.398l3.382-5.903Zm7.293-4.525a1.036 1.036 0 0 0-.395-1.422 1.062 1.062 0 0 0-1.437.399l-3.383 5.902a1.036 1.036 0 0 0 .395 1.422 1.063 1.063 0 0 0 1.437-.399l3.383-5.902Zm-11.219 0a1.035 1.035 0 0 0-.394-1.422 1.064 1.064 0 0 0-1.438.398l-3.382 5.903a1.036 1.036 0 0 0 .394 1.422c.506.282 1.15.104 1.438-.399l3.382-5.902Z" />
    </svg>
  );
}

export function PrismaMark(props: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="currentColor" {...props}>
      <path d="M21.8068 18.2848 13.5528.7565c-.207-.4382-.639-.7273-1.1286-.7541-.5023-.0293-.9523.213-1.2062.6253L2.266 15.1271c-.2773.4518-.2718 1.0091.0158 1.4555l4.3759 6.7786c.2608.4046.7127.6388 1.1823.6388.1332 0 .267-.0188.3987-.0577l12.7019-3.7568c.3891-.1151.7072-.3904.8737-.7553s.1633-.7828-.0075-1.1454zm-1.8481.7519L9.1814 22.2242c-.3292.0975-.6448-.1873-.5756-.5194l3.8501-18.4386c.072-.3448.5486-.3996.699-.0803l7.1288 15.138c.1344.2856-.019.6224-.325.7128z" />
    </svg>
  );
}

export function KyselyMark(props: MarkProps) {
  return (
    <svg viewBox="41 23 58 86" aria-hidden fill="currentColor" {...props}>
      <path d="M41.2983 109V23.9091H46.4918V73.31H47.0735L91.9457 23.9091H98.8427L61.9062 64.1694L98.5103 109H92.0288L58.5824 67.9087L46.4918 81.2873V109H41.2983Z" />
    </svg>
  );
}

const stores = [
  { name: "Drizzle", href: "/docs/database", Mark: DrizzleMark },
  { name: "Prisma", href: "/docs/database", Mark: PrismaMark },
  { name: "Kysely", href: "/docs/database", Mark: KyselyMark },
] as const;

export function StoreLinks() {
  return (
    <nav
      aria-label="Database"
      className="not-prose my-4 grid grid-cols-3 gap-2"
    >
      {stores.map((store) => (
        <Link
          key={store.name}
          href={store.href}
          className="flex items-center justify-center gap-2 rounded-xl border bg-fd-card px-3 py-2.5 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent/80"
        >
          <store.Mark className="size-4 shrink-0" />
          {store.name}
        </Link>
      ))}
    </nav>
  );
}
