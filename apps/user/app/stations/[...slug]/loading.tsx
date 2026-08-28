import { Skeleton } from "@/components/Skeleton";

// Instant shell for station pages
export default function StationLoading() {
  return (
    <section className="container-x py-12">
      <Skeleton className="mb-6 h-4 w-28" />
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="col-span-2 aspect-video w-full rounded-xl" />
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="aspect-square w-full rounded-xl" />
        </div>
        <div>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/2" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-20 rounded-full" />
            ))}
          </div>
          <Skeleton className="mt-7 h-12 w-full rounded-full" />
        </div>
      </div>
    </section>
  );
}
