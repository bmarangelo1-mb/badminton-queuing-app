import { useState, useEffect } from 'react';
import { CalendarClock, Sparkles } from 'lucide-react';

function TeamDisplay({ team }) {
  return (
    <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 shadow-sm sm:w-auto sm:justify-start">
      {team.map((p, i) => (
        <span key={p.id} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-white/30">+</span>}
          <span className="max-w-[10rem] truncate font-extrabold text-white">{p.name}</span>
          <span
            className={`inline-flex min-w-[5.5rem] items-center justify-center rounded px-1.5 py-0.5 text-xs font-medium ${
              p.category === 'Beginners'
                ? 'bg-[rgba(251,191,36,0.18)] text-[rgba(255,241,200,0.95)]'
                : 'bg-white/10 text-white/80'
            }`}
          >
            {p.category}
          </span>
        </span>
      ))}
    </div>
  );
}

function QueuedMatchCard({
  match,
  index,
  availableCourts,
  onStart,
  onCancel,
  canStart,
  onEdit,
}) {
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
    <div
      className={`glass-card glass-card-hover flex min-w-0 flex-col p-4 ${
        onEdit ? 'cursor-pointer hover:border-white/20 hover:shadow-md' : ''
      }`}
      onClick={
        onEdit
          ? (e) => {
              const target = e.target;
              const tag = target?.tagName;
              if (tag === 'BUTTON' || tag === 'SELECT' || tag === 'OPTION') return;
              if (typeof target?.closest === 'function' && target.closest('button,select,label')) return;
              onEdit();
            }
          : undefined
      }
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="pill">
            Queued #{index + 1}
          </span>
          <span className="text-xs text-[color:var(--muted)]">Ready for the next open court</span>
        </div>
        <CalendarClock className="h-5 w-5 text-white/40" />
      </div>
      <div className="flex min-w-0 flex-col items-center justify-center gap-2 sm:flex-row sm:flex-wrap sm:gap-2">
        <TeamDisplay team={match.team1} />
        <span className="w-full shrink-0 py-1 text-center font-extrabold text-white/40 sm:w-auto sm:py-0">vs</span>
        <TeamDisplay team={match.team2} />
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <button
          type="button"
          onClick={() => onCancel?.(match.id)}
          className="btn btn-secondary"
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
              className="field field-select min-h-[40px] px-3 py-2 text-sm font-semibold"
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
              className="btn btn-primary disabled:opacity-50 w-full"
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
  onEditMatch,
}) {
  const availableCourts = courts.filter((c) => availableCourtIds.includes(c.id));

  if (!queuedMatches.length) {
    return (
      <div className="glass-inset flex items-start gap-3 p-4">
        <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white/70 shadow-sm">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-white">No queued matches yet</p>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Queue the next game now, then start it instantly when a court becomes available.
          </p>
        </div>
      </div>
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
          onEdit={onEditMatch ? () => onEditMatch(m.id) : undefined}
        />
      ))}
    </div>
  );
}
