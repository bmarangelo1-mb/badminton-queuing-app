export default function PlayerList({ players, onRemove }) {
  if (!players.length) {
    return (
      <p className="text-sm text-slate-500">No players yet. Add players above.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {players.map((p, i) => (
        <li
          key={p.id}
          className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 shadow-sm transition hover:shadow-md"
        >
          <div className="flex items-center gap-2">
            <span className="w-6 text-sm text-slate-400">{i + 1}.</span>
            <span className="font-medium text-slate-900">{p.name}</span>
            <span
              className={`rounded-lg px-2 py-0.5 text-xs font-medium ${
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
              className="text-sm text-slate-400 hover:text-red-500 focus:outline-none"
            >
              Remove
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
