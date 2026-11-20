export default function AppLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/80 ring-1 ring-slate-100" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-white/80 ring-1 ring-slate-100" />
    </div>
  );
}
