import type { ReactNode } from "react";

export function PageFrame({
  back,
  title,
  description,
  action,
  children,
}: {
  back?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-4">
        {back}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-lg font-medium tracking-tight">{title}</h1>
            {description ? (
              <p className="max-w-xl text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          {action}
        </div>
      </div>
      {children}
    </div>
  );
}
