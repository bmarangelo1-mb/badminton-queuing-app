function StatusBadge({ status }) {
  const isPlaying = status === 'playing';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isPlaying ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {isPlaying ? 'Playing' : 'Waiting'}
    </span>
  );
}

function CategoryBadge({ category }) {
  const isBeginners = category === 'Beginners';
  return (
    <span
      className={`rounded-lg px-2 py-0.5 text-xs font-medium ${
        isBeginners ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
      }`}
    >
      {category}
    </span>
  );
}

export default function PlayerStatusList({ players, playingIds, onRemove }) {
  if (!players.length) {
    return (
      <p className="text-sm text-slate-500">No players yet. Add players above.</p>
    );
  }

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {players.map((p) => (
        <li
          key={p.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm transition hover:shadow-md"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-slate-900">{p.name}</span>
            <CategoryBadge category={p.category} />
            <StatusBadge status={playingIds.has(p.id) ? 'playing' : 'waiting'} />
            <span className="text-xs text-slate-500" title="Games played">
              {p.gamesPlayed} game{p.gamesPlayed !== 1 ? 's' : ''}
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
