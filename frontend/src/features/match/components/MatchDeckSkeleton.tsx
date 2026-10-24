export default function MatchDeckSkeleton() {
  const pulse = 'animate-pulse motion-reduce:animate-none bg-zinc-200/85'

  return (
    <div className="space-y-4" aria-hidden="true">
      <div className={`h-2 rounded-full ${pulse}`} />

      <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-2">
          <div className={`h-4 w-4 rounded-full ${pulse}`} />
          <div className={`h-4 w-16 rounded ${pulse}`} />
        </div>
        <div className={`h-4 w-24 rounded ${pulse}`} />
      </div>

      <div className="relative mx-auto h-107.5 max-w-77.5 sm:h-112.5 sm:max-w-[320px]">
        <div className="absolute inset-x-4 top-4 h-full rounded-3xl bg-zinc-100" style={{ opacity: 0.62, transform: 'scale(0.985)' }} />
        <div
          className="absolute inset-x-2 top-2 h-full rounded-3xl border border-zinc-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
          style={{ opacity: 0.82, transform: 'scale(0.992)' }}
        />

        <div className={`relative h-full rounded-3xl border border-zinc-200 ${pulse} shadow-[0_18px_50px_rgba(15,23,42,0.1)]`} />
      </div>

      <div className="flex items-center justify-center gap-4">
        <div className={`h-11 w-11 rounded-full ${pulse}`} />
        <div className={`h-14 w-14 rounded-full ${pulse}`} />
        <div className={`h-11 w-11 rounded-full ${pulse}`} />
      </div>
    </div>
  )
}
