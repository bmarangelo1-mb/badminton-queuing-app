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

export default function EndQueueSummary({
  players,
  removedPlayers,
  totalCourtCost,
  onTotalCourtCostChange,
  costPerShuttlecock,
  onCostPerShuttlecockChange,
  onConfirm,
  onCancel,
}) {
  const courtCostValue = Number(totalCourtCost);
  const shuttleCostValue = Number(costPerShuttlecock);

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
  const totalShuttleUsed = allPlayers.reduce(
    (sum, p) => sum + (Number.isFinite(p.shuttleShare) ? p.shuttleShare : 0),
    0
  );
  const playerCount = allPlayers.length;
  const courtSharePerPlayer = playerCount > 0 && Number.isFinite(courtCostValue)
    ? courtCostValue / playerCount
    : 0;
  const totalShuttleCost = Number.isFinite(shuttleCostValue)
    ? totalShuttleUsed * shuttleCostValue
    : 0;

  const formatPhp = (amount) => {
    const value = Number.isFinite(amount) ? amount : 0;
    const rounded = Math.round(value * 100) / 100;
    const [whole, decimal] = rounded.toFixed(2).split('.');
    const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decimal === '00' ? withCommas : `${withCommas}.${decimal}`;
  };
  const formatShuttleFraction = (value) => {
    const safeValue = Number.isFinite(value) ? value : 0;
    const quarters = Math.round(safeValue * 4);
    if (quarters === 0) return '0';
    const whole = Math.floor(quarters / 4);
    const remainder = quarters % 4;
    if (remainder === 0) return `${whole}`;
    if (whole === 0) return `${remainder}/4`;
    return `${whole} ${remainder}/4`;
  };
  const formatShuttleWhole = (value) => {
    const safeValue = Number.isFinite(value) ? value : 0;
    return `${Math.round(safeValue)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-md">
      <div className="glass-modal w-full max-w-4xl">
        <div className="border-b border-white/10 p-6">
          <h2 className="text-2xl font-extrabold text-white">End Queue - Player Summary</h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Final statistics for all players. This will clear all data and reset the app.
          </p>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {sorted.length === 0 ? (
            <p className="text-sm text-[color:var(--muted)]">No players to display.</p>
          ) : (
            <>
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm font-semibold text-[color:var(--muted)]">
                  Total court cost (PHP)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={totalCourtCost}
                    onChange={(e) => onTotalCourtCostChange?.(e.target.value)}
                    className="field"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm font-semibold text-[color:var(--muted)]">
                  Cost per shuttlecock (PHP)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={costPerShuttlecock}
                    onChange={(e) => onCostPerShuttlecockChange?.(e.target.value)}
                    className="field"
                  />
                </label>
              </div>
              <div className="glass-inset mb-4 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[color:var(--muted)]">Total Players:</span>
                  <span className="text-sm font-extrabold text-white">{allPlayers.length}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-[color:var(--muted)]">Total Games Played:</span>
                  <span className="text-sm font-extrabold text-white">{totalGames}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-[color:var(--muted)]">Court per player:</span>
                  <span className="text-sm font-extrabold text-white">
                    {formatPhp(courtSharePerPlayer)} PHP
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-[color:var(--muted)]">Total shuttles used:</span>
                  <span className="text-sm font-extrabold text-white">
                    {formatShuttleWhole(totalShuttleUsed)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-[color:var(--muted)]">Total shuttle cost:</span>
                  <span className="text-sm font-extrabold text-white">
                    {formatPhp(totalShuttleCost)} PHP
                  </span>
                </div>
              </div>
              <p className="mb-2 text-xs italic text-[color:var(--muted)]">
                Note: One shuttlecock used in a game is split evenly, so each player is charged 1/4.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {sorted.map((p) => {
                  const gamesPlayed = p.gamesPlayed || 0;
                  const shuttleShareCount = Number.isFinite(p.shuttleShare) ? p.shuttleShare : 0;
                  const shuttleShareCost = shuttleShareCount * shuttleCostValue;
                  const totalToPay = courtSharePerPlayer + shuttleShareCost;
                  return (
                    <div
                      key={p.id}
                      className="glass-inset flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-2 font-extrabold text-white">
                          <GenderIcon gender={p.gender} />
                          {p.name}
                        </span>
                        <CategoryBadge category={p.category} />
                        <span className="text-xs text-[color:var(--muted)]">
                          {gamesPlayed} game{gamesPlayed !== 1 ? 's' : ''} played
                        </span>
                        <span className="text-xs text-[color:var(--muted)]">
                          Court: {formatPhp(courtSharePerPlayer)} PHP
                        </span>
                        <span className="text-xs text-[color:var(--muted)]">
                          Shuttle: {formatPhp(shuttleShareCost)} PHP
                        </span>
                        <span className="text-xs text-[color:var(--muted)]">
                          Shuttles used: {formatShuttleFraction(shuttleShareCount)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-white">
                          Total to pay: {formatPhp(totalToPay)} PHP
                        </span>
                        {removedPlayers?.some((rp) => rp.id === p.id) && (
                          <span className="text-xs text-white/40">Removed</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
        <div className="border-t border-white/10 p-6">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="btn btn-danger"
            >
              End Queue & Clear All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
