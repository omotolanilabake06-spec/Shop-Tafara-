/** Quiet placeholders shown for a moment while a page's URL-dependent content streams in. */

const block = "bg-stone animate-pulse [animation-duration:2.4s]";

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-2.5 gap-y-9 sm:gap-x-4 lg:grid-cols-4 lg:gap-y-14" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className={`aspect-[2/3] ${block}`} />
          <div className={`mt-4 h-2.5 w-2/3 ${block}`} />
          <div className={`mt-2 h-2.5 w-1/4 ${block}`} />
        </div>
      ))}
    </div>
  );
}

export function ListingSkeleton() {
  return (
    <div className="gutter pb-24" aria-busy>
      <div className="flex flex-col items-center pb-10 pt-10 sm:pb-12 sm:pt-14">
        <div className={`h-2.5 w-16 ${block}`} />
        <div className={`mt-5 h-10 w-64 ${block}`} />
      </div>
      <div className="mb-7 h-[50px] border-y border-line" />
      <GridSkeleton />
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <div className="lg:gutter grid lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-14 lg:pt-6 xl:gap-20" aria-busy>
      <div className="grid gap-2.5 lg:grid-cols-2">
        <div className={`aspect-[2/3] ${block}`} />
        <div className={`hidden aspect-[2/3] lg:block ${block}`} />
      </div>
      <div className="gutter pt-8 lg:px-0 lg:pt-4">
        <div className={`h-2.5 w-28 ${block}`} />
        <div className={`mt-6 h-9 w-3/4 ${block}`} />
        <div className={`mt-4 h-4 w-24 ${block}`} />
        <div className={`mt-8 h-3 w-full ${block}`} />
        <div className={`mt-2 h-3 w-5/6 ${block}`} />
        <div className="mt-10 flex gap-2.5">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className={`h-[42px] w-[42px] ${block}`} />
          ))}
        </div>
        <div className={`mt-10 h-[52px] w-full ${block}`} />
      </div>
    </div>
  );
}
