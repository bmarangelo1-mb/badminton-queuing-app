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

export default function EndQueueSummary({ players, removedPlayers, onConfirm, onCancel }) {
  // Combine all players (current + removed), deduplicate by ID, and sort by games played
  const playerMap = new Map();
  [...(players || []), ...(removedPlayers || [])].forEach((p) => {
    if (!playerMap.has(p.id) || (p.gamesPlayed || 0) > (playerMap.get(p.id)?.gamesPlayed || 0)) {
      playerMap.set(p.id, p);
    }
  });
  const allPlayers = Array.from(playerMap.values());

  const sorted = [...allPlayers].sort((a, b) => {
    if (b.gamesPlayed !== a.gamesPlayed) {
      return b.gamesPlayed - a.gamesPlayed;
    }
    return (a.name || '').localeCompare(b.name || '');
  });

  const totalGames = allPlayers.reduce((sum, p) => sum + (p.gamesPlayed || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-900">End Queue - Player Summary</h2>
          <p className="mt-2 text-sm text-slate-600">
            Final statistics for all players. This will clear all data and reset the app.
          </p>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {sorted.length === 0 ? (
            <p className="text-sm text-slate-500">No players to display.</p>
          ) : (
            <>
              <div className="mb-4 rounded-lg bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Total Players:</span>
                  <span className="text-sm font-semibold text-slate-900">{allPlayers.length}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Total Games Played:</span>
                  <span className="text-sm font-semibold text-slate-900">{totalGames}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {sorted.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/60 bg-slate-50/50 px-4 py-2.5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-2 font-medium text-slate-700">
                        <GenderIcon gender={p.gender} />
                        {p.name}
                      </span>
                      <CategoryBadge category={p.category} />
                      <span className="text-xs text-slate-500">
                        {p.gamesPlayed || 0} game{(p.gamesPlayed || 0) !== 1 ? 's' : ''} played
                      </span>
                    </div>
                    {removedPlayers?.some((rp) => rp.id === p.id) && (
                      <span className="text-xs text-slate-400">Removed</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="border-t border-slate-200 p-6">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              End Queue & Clear All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
