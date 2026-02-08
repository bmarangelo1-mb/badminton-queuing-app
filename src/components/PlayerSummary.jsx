import GenderIcon from './GenderIcon';

function CategoryBadge({ category }) {
  const isBeginners = category === 'Beginners';
  return (
    <span
      className={`inline-flex min-w-[5.5rem] items-center justify-center rounded-lg px-2 py-0.5 text-xs font-medium ${
        isBeginners ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
      }`}
    >
      {category}
    </span>
  );
}

export default function PlayerSummary({ removedPlayers, onRestore, onPermanentRemove }) {
  if (!removedPlayers || removedPlayers.length === 0) {
    return (
      <p className="text-sm text-slate-500">No players have been removed yet.</p>
    );
  }

  const sorted = [...removedPlayers].sort((a, b) => {
    if (b.gamesPlayed !== a.gamesPlayed) {
      return b.gamesPlayed - a.gamesPlayed;
    }
    return (b.removedAt || 0) - (a.removedAt || 0);
  });

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {sorted.map((p) => (
        <div
          key={p.id}
          className="flex flex-col rounded-xl border border-slate-200/60 bg-slate-50/50 px-4 py-3"
        >
          <div className="mb-2 flex items-center gap-2 font-semibold uppercase tracking-wide text-slate-700">
            <GenderIcon gender={p.gender} />
            {p.name}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge category={p.category} />
              <span className="text-xs text-slate-500">
                {p.gamesPlayed} game{p.gamesPlayed !== 1 ? 's' : ''} played
              </span>
            </div>
            {onRestore ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onRestore(p.id)}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  Undo
                </button>
                {onPermanentRemove && (
                  <button
                    type="button"
                    onClick={() => onPermanentRemove(p.id)}
                    className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                  >
                    Remove permanently
                  </button>
                )}
              </div>
            ) : (
              <span className="text-xs font-medium text-slate-400">Removed</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
