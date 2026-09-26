import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-10">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-4 w-72" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
