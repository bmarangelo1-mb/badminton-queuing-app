import { useState, useMemo } from 'react';

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

export default function ManualMatchMaker({ players, playingIds, matches, courts, onCreate, onClose }) {
  const [selectedTeam1, setSelectedTeam1] = useState([]);
  const [selectedTeam2, setSelectedTeam2] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(1);

  const waitingPlayers = useMemo(
    () => players.filter((p) => !playingIds.has(p.id)),
    [players, playingIds]
  );

  const availableCourts = useMemo(() => {
    const used = new Set(matches.map((m) => m.courtId));
    return Array.from({ length: courts }, (_, i) => i + 1).filter((id) => !used.has(id));
  }, [matches, courts]);

  const togglePlayer = (playerId, team) => {
    const isSelected = team === 1 ? selectedTeam1.includes(playerId) : selectedTeam2.includes(playerId);
    const otherTeam = team === 1 ? selectedTeam2 : selectedTeam1;
    
    if (isSelected) {
      if (team === 1) {
        setSelectedTeam1(selectedTeam1.filter((id) => id !== playerId));
      } else {
        setSelectedTeam2(selectedTeam2.filter((id) => id !== playerId));
      }
    } else {
      // Check if already in other team
      if (otherTeam.includes(playerId)) return;
      
      // Check team size limit
      if (team === 1 && selectedTeam1.length >= 2) return;
      if (team === 2 && selectedTeam2.length >= 2) return;
      
      if (team === 1) {
        setSelectedTeam1([...selectedTeam1, playerId]);
      } else {
        setSelectedTeam2([...selectedTeam2, playerId]);
      }
    }
  };

  const handleCreate = () => {
    if (selectedTeam1.length === 2 && selectedTeam2.length === 2 && selectedCourt) {
      onCreate(selectedTeam1, selectedTeam2, selectedCourt);
      onClose();
    }
  };

  const canCreate = selectedTeam1.length === 2 && selectedTeam2.length === 2 && selectedCourt && availableCourts.includes(selectedCourt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Manual Match Creation</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Select 2 players for each team and choose a court.
          </p>
        </div>
        
        <div className="max-h-[70vh] overflow-y-auto p-6">
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">Court</label>
            <select
              value={selectedCourt}
              onChange={(e) => setSelectedCourt(parseInt(e.target.value, 10))}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {availableCourts.map((courtId) => (
                <option key={courtId} value={courtId}>
                  Court {courtId}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-800">
                Team 1 ({selectedTeam1.length}/2)
              </h3>
              <div className="space-y-2">
                {waitingPlayers.map((p) => {
                  const isSelected = selectedTeam1.includes(p.id);
                  const isInOtherTeam = selectedTeam2.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePlayer(p.id, 1)}
                      disabled={isInOtherTeam || (!isSelected && selectedTeam1.length >= 2)}
                      className={`w-full rounded-xl border px-4 py-2.5 text-left transition ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50'
                          : isInOtherTeam
                          ? 'border-slate-200 bg-slate-100 opacity-50'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      } disabled:cursor-not-allowed`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-slate-900">{p.name}</span>
                          <CategoryBadge category={p.category} />
                          <span className="text-xs text-slate-500">
                            {p.gamesPlayed} game{p.gamesPlayed !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {isSelected && <span className="text-emerald-600">✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-800">
                Team 2 ({selectedTeam2.length}/2)
              </h3>
              <div className="space-y-2">
                {waitingPlayers.map((p) => {
                  const isSelected = selectedTeam2.includes(p.id);
                  const isInOtherTeam = selectedTeam1.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePlayer(p.id, 2)}
                      disabled={isInOtherTeam || (!isSelected && selectedTeam2.length >= 2)}
                      className={`w-full rounded-xl border px-4 py-2.5 text-left transition ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : isInOtherTeam
                          ? 'border-slate-200 bg-slate-100 opacity-50'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      } disabled:cursor-not-allowed`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-slate-900">{p.name}</span>
                          <CategoryBadge category={p.category} />
                          <span className="text-xs text-slate-500">
                            {p.gamesPlayed} game{p.gamesPlayed !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {isSelected && <span className="text-blue-600">✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 p-6">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!canCreate}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create Match
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
