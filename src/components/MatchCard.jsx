export default function MatchCard({ match, onComplete }) {
  const { courtId, team1, team2 } = match;

  return (
    <div className="flex flex-col rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-700">
          Court {courtId}
        </span>
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
        <TeamDisplay team={team1} />
        <span className="shrink-0 font-medium text-slate-400">vs</span>
        <TeamDisplay team={team2} />
      </div>
      <div className="mt-auto flex justify-center pt-1">
        <button
          type="button"
          onClick={onComplete}
          className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          Complete match
        </button>
      </div>
    </div>
  );
}

function TeamDisplay({ team }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-1.5">
      {team.map((p, i) => (
        <span key={p.id} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-slate-400">+</span>}
          <span className="font-medium text-slate-900">{p.name}</span>
          <span
            className={`rounded px-1.5 py-0.5 text-xs font-medium ${
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
