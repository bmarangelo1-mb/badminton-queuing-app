export default function PlayerList({ players, onRemove }) {
  if (!players.length) {
    return (
      <p className="text-sm text-slate-500">No players yet. Add players above.</p>
    );
  }

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {players.map((p, i) => (
        <li
          key={p.id}
          className="flex flex-col rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm transition hover:shadow-md"
        >
          <div className="mb-2 font-semibold uppercase tracking-wide text-slate-900">
            {p.name}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">{i + 1}.</span>
              <span
                className={`inline-flex min-w-[5.5rem] items-center justify-center rounded-lg px-2 py-0.5 text-xs font-medium ${
                  p.category === 'Beginners'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {p.category}
              </span>
            </div>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(p.id)}
                className="text-xs font-medium text-slate-400 hover:text-red-500 focus:outline-none"
              >
                Remove
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
