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

function QueuedMatchCard({ match, index, onStart, onCancel, canStart }) {
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
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => onCancel?.(match.id)}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onStart?.(match.id)}
          disabled={!canStart}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          Start
        </button>
      </div>
    </div>
  );
}

export default function AdvanceQueueList({ queuedMatches, onStart, onCancel, canStart }) {
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
          onStart={onStart}
          onCancel={onCancel}
          canStart={canStart}
        />
      ))}
    </div>
  );
}
