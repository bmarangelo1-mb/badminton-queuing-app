import GenderIcon from './GenderIcon';

function CategoryBadge({ category }) {
  const isBeginners = category === 'Beginners';
  return (
    <span
      className={`inline-flex min-w-[5.5rem] items-center justify-center rounded-lg px-2 py-0.5 text-xs font-medium ${
        isBeginners
          ? 'bg-[rgba(251,191,36,0.18)] text-[rgba(255,241,200,0.95)]'
          : 'bg-white/10 text-white/80'
      }`}
    >
      {category}
    </span>
  );
}

export default function PlayerSummary({ removedPlayers, onRestore, onPermanentRemove }) {
  if (!removedPlayers || removedPlayers.length === 0) {
    return (
      <p className="text-sm text-[color:var(--muted)]">No players have been removed yet.</p>
    );
  }

  const sorted = [...removedPlayers].sort((a, b) => {
    if (b.gamesPlayed !== a.gamesPlayed) {
      return b.gamesPlayed - a.gamesPlayed;
    }
    return (b.removedAt || 0) - (a.removedAt || 0);
  });

  return (
    <>
      <p className="mb-2 text-xs text-[rgba(255,241,200,0.95)]">
        Warning: Permanently removed players are excluded from payment totals.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {sorted.map((p) => (
          <div
            key={p.id}
            className="glass-card glass-card-hover flex flex-col px-4 py-3"
          >
            <div className="mb-2 flex items-center gap-2 font-extrabold uppercase tracking-wide text-white/90">
              <GenderIcon gender={p.gender} />
              {p.name}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <CategoryBadge category={p.category} />
                <span className="text-xs text-[color:var(--muted)]">
                  {p.gamesPlayed} game{p.gamesPlayed !== 1 ? 's' : ''} played
                </span>
              </div>
              {onRestore ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onRestore(p.id)}
                    className="btn btn-primary min-h-[34px] rounded-full px-3 py-1 text-xs"
                  >
                    Undo
                  </button>
                  {onPermanentRemove && (
                    <button
                      type="button"
                      onClick={() => onPermanentRemove(p.id)}
                      className="btn btn-danger min-h-[34px] rounded-full px-3 py-1 text-xs"
                    >
                      Remove permanently
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-xs font-semibold text-white/40">Removed</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
