const GRID = [
  { title: 'Electronics', pct: 'Up to 12%', tone: 'from-slate-600 to-slate-800' },
  { title: 'Fashion', pct: 'Up to 15%', tone: 'from-fuchsia-500 to-purple-700' },
  { title: 'Food & drink', pct: 'Up to 10%', tone: 'from-amber-500 to-orange-600' },
  { title: 'Travel', pct: 'Up to 8%', tone: 'from-sky-500 to-blue-700' },
  { title: 'Beauty', pct: 'Up to 11%', tone: 'from-rose-400 to-pink-600' },
  { title: 'Home', pct: 'Up to 9%', tone: 'from-emerald-500 to-teal-700' },
]

export function ExploreScreen() {
  return (
    <div className="space-y-6 pb-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Explore categories</h1>
        <p className="mt-1 text-sm text-[var(--stitch-on-surface-variant)]">Find deals matched to your cards</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {['All', 'Trending', 'New', 'Ending soon'].map((f, i) => (
          <button
            key={f}
            type="button"
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
              i === 0
                ? 'bg-[var(--stitch-secondary-container)] text-[var(--stitch-on-secondary-container)]'
                : 'border border-[var(--stitch-outline-variant)] bg-[var(--stitch-surface-container-low)] text-[var(--stitch-on-surface)]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <ul className="grid grid-cols-2 gap-3">
        {GRID.map((item) => (
          <li key={item.title}>
            <button
              type="button"
              className="group w-full overflow-hidden rounded-3xl border border-[var(--stitch-outline-variant)] bg-[var(--stitch-surface-container-low)] text-left shadow-sm transition hover:border-[var(--stitch-outline)]"
            >
              <div className={`h-24 bg-gradient-to-br ${item.tone} opacity-90 transition group-hover:opacity-100`} role="presentation" />
              <div className="p-3">
                <p className="text-xs font-medium text-[var(--stitch-primary)]">{item.pct}</p>
                <p className="mt-0.5 font-semibold text-[var(--stitch-on-surface)]">{item.title}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
