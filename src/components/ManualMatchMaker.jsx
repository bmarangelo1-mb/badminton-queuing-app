import { useState, useMemo, useEffect } from 'react';
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

export default function ManualMatchMaker({
  players,
  playingIds,
  matches,
  courts,
  onCreate,
  onCreateAdvance,
  onUpdate,
  editMatchId,
  onClose,
  mode = 'manual',
  reservedIds = [],
  preselectedCourtId = null,
}) {
  const editMatch = useMemo(() => editMatchId ? matches.find((m) => m.id === editMatchId) : null, [matches, editMatchId]);
  const isAdvance = mode === 'advance';
  const reservedSet = useMemo(() => new Set(reservedIds), [reservedIds]);
  const courtNameById = useMemo(
    () => new Map(courts.map((court) => [court.id, court.name])),
    [courts]
  );
  const lockCourtSelection = !!preselectedCourtId && !editMatchId && !isAdvance;
  
  const [selectedTeam1, setSelectedTeam1] = useState([]);
  const [selectedTeam2, setSelectedTeam2] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);

  useEffect(() => {
    if (editMatch) {
      setSelectedTeam1(editMatch.team1.map((p) => p.id));
      setSelectedTeam2(editMatch.team2.map((p) => p.id));
      setSelectedCourt(editMatch.courtId);
    }
  }, [editMatch]);

  const availablePlayers = useMemo(() => {
    if (editMatch) {
      // When editing, show all players but mark those playing in other matches
      return players;
    }
    // When creating, only show waiting players (excluding reserved)
    return players.filter((p) => !playingIds.has(p.id) && !reservedSet.has(p.id));
  }, [players, playingIds, editMatch, reservedSet]);

  const availableCourts = useMemo(() => {
    const used = new Set(matches.filter((m) => m.id !== editMatchId).map((m) => m.courtId));
    return courts.filter((court) => !used.has(court.id)).map((court) => court.id);
  }, [matches, courts, editMatchId]);

  // Initialize selectedCourt to first available court when creating (not editing)
  useEffect(() => {
    if (isAdvance) {
      setSelectedCourt(null);
      return;
    }
    if (lockCourtSelection) {
      setSelectedCourt(preselectedCourtId);
      return;
    }
    if (!editMatch && availableCourts.length > 0) {
      // Only update if current selection is not in available courts
      if (!availableCourts.includes(selectedCourt)) {
        setSelectedCourt(availableCourts[0]);
      }
    } else if (!editMatch && availableCourts.length === 0) {
      // If no courts available, set to null/undefined to disable submit
      setSelectedCourt(null);
    }
  }, [availableCourts, editMatch, selectedCourt, isAdvance, lockCourtSelection, preselectedCourtId]);

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

  const handleSubmit = () => {
    if (selectedTeam1.length === 2 && selectedTeam2.length === 2) {
      if (editMatchId && onUpdate) {
        onUpdate(editMatchId, selectedTeam1, selectedTeam2, selectedCourt);
      } else if (isAdvance) {
        onCreateAdvance?.(selectedTeam1, selectedTeam2);
      } else {
        onCreate(selectedTeam1, selectedTeam2, selectedCourt);
      }
      onClose();
    }
  };

  const canSubmit =
    selectedTeam1.length === 2 &&
    selectedTeam2.length === 2 &&
    (isAdvance || (selectedCourt && availableCourts.length > 0 && availableCourts.includes(selectedCourt)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">
              {editMatchId ? 'Edit Match' : isAdvance ? 'Queue Match' : 'Manual Match Creation'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {editMatchId
              ? 'Update players and court for this match.'
              : isAdvance
              ? 'Select 2 players for each team. Court is assigned when moved to matches.'
              : 'Select 2 players for each team and choose a court.'}
          </p>
        </div>
        
        <div className="max-h-[70vh] overflow-y-auto p-6">
          {!isAdvance && (
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">Court</label>
              {availableCourts.length > 0 ? (
                lockCourtSelection ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                    {courtNameById.get(preselectedCourtId) || 'Court'}
                  </div>
                ) : (
                  <select
                    value={selectedCourt || ''}
                    onChange={(e) => setSelectedCourt(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {availableCourts.map((courtId) => (
                      <option key={courtId} value={courtId}>
                        {courtNameById.get(courtId) || courtId}
                      </option>
                    ))}
                  </select>
                )
              ) : (
                <p className="text-sm text-amber-600">No available courts. Complete or cancel existing matches first.</p>
              )}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-800">
                Team 1 ({selectedTeam1.length}/2)
              </h3>
              <div className="space-y-2">
                {availablePlayers.map((p) => {
                  const isSelected = selectedTeam1.includes(p.id);
                  const isInOtherTeam = selectedTeam2.includes(p.id);
                  const isInEditMatch = editMatch && [...editMatch.team1, ...editMatch.team2].some((t) => t.id === p.id);
                  const isPlayingElsewhere = editMatch && !isInEditMatch && playingIds.has(p.id);
                  const isReservedElsewhere = editMatch && !isInEditMatch && reservedSet.has(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePlayer(p.id, 1)}
                      disabled={isInOtherTeam || (!isSelected && selectedTeam1.length >= 2) || isPlayingElsewhere || isReservedElsewhere}
                      className={`w-full rounded-xl border px-4 py-2.5 text-left transition ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50'
                          : isInOtherTeam || isPlayingElsewhere || isReservedElsewhere
                          ? 'border-slate-200 bg-slate-100 opacity-50'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      } disabled:cursor-not-allowed`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-2 font-medium text-slate-900">
                            <GenderIcon gender={p.gender} />
                            {p.name}
                          </span>
                          <CategoryBadge category={p.category} />
                          <span className="text-xs text-slate-500">
                            {p.gamesPlayed} game{p.gamesPlayed !== 1 ? 's' : ''}
                          </span>
                          {isPlayingElsewhere && <span className="text-xs text-amber-600">(Playing)</span>}
                          {isReservedElsewhere && <span className="text-xs text-amber-600">(Queued)</span>}
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
                {availablePlayers.map((p) => {
                  const isSelected = selectedTeam2.includes(p.id);
                  const isInOtherTeam = selectedTeam1.includes(p.id);
                  const isInEditMatch = editMatch && [...editMatch.team1, ...editMatch.team2].some((t) => t.id === p.id);
                  const isPlayingElsewhere = editMatch && !isInEditMatch && playingIds.has(p.id);
                  const isReservedElsewhere = editMatch && !isInEditMatch && reservedSet.has(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePlayer(p.id, 2)}
                      disabled={isInOtherTeam || (!isSelected && selectedTeam2.length >= 2) || isPlayingElsewhere || isReservedElsewhere}
                      className={`w-full rounded-xl border px-4 py-2.5 text-left transition ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : isInOtherTeam || isPlayingElsewhere || isReservedElsewhere
                          ? 'border-slate-200 bg-slate-100 opacity-50'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      } disabled:cursor-not-allowed`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-2 font-medium text-slate-900">
                            <GenderIcon gender={p.gender} />
                            {p.name}
                          </span>
                          <CategoryBadge category={p.category} />
                          <span className="text-xs text-slate-500">
                            {p.gamesPlayed} game{p.gamesPlayed !== 1 ? 's' : ''}
                          </span>
                          {isPlayingElsewhere && <span className="text-xs text-amber-600">(Playing)</span>}
                          {isReservedElsewhere && <span className="text-xs text-amber-600">(Queued)</span>}
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
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {editMatchId ? 'Update Match' : isAdvance ? 'Queue Match' : 'Create Match'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
