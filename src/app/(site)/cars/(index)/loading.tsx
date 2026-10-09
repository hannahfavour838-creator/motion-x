import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div className="container-x pb-24 pt-28 md:pt-36" role="status" aria-label="Loading vehicles">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-8 h-14 w-2/3 max-w-xl" />
      <Skeleton className="mt-4 h-4 w-48" />
      <div className="mt-14 grid gap-10 lg:grid-cols-[17.5rem_1fr]">
        <div className="hidden space-y-5 lg:block">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
        <div className="grid gap-px sm:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-ink">
              <Skeleton className="aspect-[3/2] w-full rounded-none" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading vehicles…</span>
    </div>
  );
}
