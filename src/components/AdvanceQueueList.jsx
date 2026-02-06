import { useState, useEffect } from 'react';

function TeamDisplay({ team }) {
  return (
    <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-1.5 sm:w-auto sm:justify-start">
      {team.map((p, i) => (
        <span key={p.id} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-slate-400">+</span>}
          <span className="font-medium text-slate-900">{p.name}</span>
          <span
            className={`inline-flex min-w-[5.5rem] items-center justify-center rounded px-1.5 py-0.5 text-xs font-medium ${
              p.category === 'Beginners'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {p.category}
          </span>
        </span>
      ))}
    </div>
  );
}

function QueuedMatchCard({ match, index, availableCourts, onStart, onCancel, canStart }) {
  const [selectedCourtId, setSelectedCourtId] = useState(
    availableCourts.length > 0 ? availableCourts[0].id : null
  );

  useEffect(() => {
    const valid = availableCourts.some((c) => c.id === selectedCourtId);
    if (!valid && availableCourts.length > 0) {
      setSelectedCourtId(availableCourts[0].id);
    } else if (availableCourts.length === 0) {
      setSelectedCourtId(null);
    }
  }, [availableCourts, selectedCourtId]);

  const handleStart = () => {
    if (selectedCourtId) onStart?.(match.id, selectedCourtId);
  };

  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-700">
          Queued {index + 1}
        </span>
      </div>
      <div className="flex min-w-0 flex-col items-center justify-center gap-2 sm:flex-row sm:flex-wrap sm:gap-2">
        <TeamDisplay team={match.team1} />
        <span className="w-full shrink-0 py-1 text-center font-medium text-slate-400 sm:w-auto sm:py-0">vs</span>
        <TeamDisplay team={match.team2} />
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-end">
        <button
          type="button"
          onClick={() => onCancel?.(match.id)}
          className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        {availableCourts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor={`court-${match.id}`} className="sr-only">
              Choose court
            </label>
            <select
              id={`court-${match.id}`}
              value={selectedCourtId || ''}
              onChange={(e) => setSelectedCourtId(e.target.value)}
              className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {availableCourts.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleStart}
              disabled={!canStart}
              className="min-h-[44px] rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              Start on court
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdvanceQueueList({
  queuedMatches,
  courts,
  availableCourtIds,
  onStart,
  onCancel,
  canStart,
}) {
  const availableCourts = courts.filter((c) => availableCourtIds.includes(c.id));

  if (!queuedMatches.length) {
    return (
      <p className="text-sm text-slate-500">
        No queued matches yet. Add one to prepare for the next available court.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {queuedMatches.map((m, index) => (
        <QueuedMatchCard
          key={m.id}
          match={m}
          index={index}
          availableCourts={availableCourts}
          onStart={onStart}
          onCancel={onCancel}
          canStart={canStart}
        />
      ))}
    </div>
  );
}
