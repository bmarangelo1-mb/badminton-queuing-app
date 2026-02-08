import GenderIcon from './GenderIcon';

export default function MatchCard({ match, onComplete, onCancel, onEdit, courtName, showCourtLabel = true, className = '' }) {
  const { team1, team2 } = match;

  return (
    <div
      className={`flex min-w-0 flex-col rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition ${className} ${
        onEdit ? 'cursor-pointer hover:border-emerald-300 hover:shadow-md' : 'hover:shadow-md'
      }`}
      onClick={onEdit ? (e) => {
        if (e.target.tagName !== 'BUTTON') {
          onEdit();
        }
      } : undefined}
    >
      {showCourtLabel && (
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-700">
            {courtName || 'Court'}
          </span>
        </div>
      )}
      <div className="mb-4 flex min-w-0 flex-col items-center justify-center gap-2 sm:flex-row sm:flex-wrap sm:gap-2">
        <TeamDisplay team={team1} />
        <span className="w-full shrink-0 py-1 text-center font-medium text-slate-400 sm:w-auto sm:py-0">vs</span>
        <TeamDisplay team={team2} />
      </div>
      <div className="mt-auto flex flex-col gap-2 pt-1">
        <button
          type="button"
          onClick={onComplete}
          className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          Complete match
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Cancel match
          </button>
        )}
      </div>
    </div>
  );
}

function TeamDisplay({ team }) {
  return (
    <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-1.5 sm:w-auto sm:justify-start">
      {team.map((p, i) => (
        <span key={p.id} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-slate-400">+</span>}
          <span className="flex items-center gap-1.5 font-medium text-slate-900">
            <GenderIcon gender={p.gender} />
            {p.name}
          </span>
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
