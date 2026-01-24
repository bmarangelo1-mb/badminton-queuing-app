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

export default function PlayerSummary({ removedPlayers }) {
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
    <div className="space-y-2">
      {sorted.map((p) => (
        <div
          key={p.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/60 bg-slate-50/50 px-4 py-2.5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-slate-700">{p.name}</span>
            <CategoryBadge category={p.category} />
            <span className="text-xs text-slate-500">
              {p.gamesPlayed} game{p.gamesPlayed !== 1 ? 's' : ''} played
            </span>
          </div>
          <span className="text-xs text-slate-400">Removed</span>
        </div>
      ))}
    </div>
  );
}
