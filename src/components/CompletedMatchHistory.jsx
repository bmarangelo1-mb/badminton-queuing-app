import GenderIcon from './GenderIcon';

function CategoryBadge({ category }) {
  const isBeginners = category === 'Beginners';
  return (
    <span
      className={`inline-flex min-w-[5.5rem] items-center justify-center rounded px-1.5 py-0.5 text-xs font-medium ${
        isBeginners ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
      }`}
    >
      {category}
    </span>
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
          <CategoryBadge category={p.category} />
        </span>
      ))}
    </div>
  );
}

export default function CompletedMatchHistory({ completedMatches, onRequestToggleVoid }) {
  const list = Array.isArray(completedMatches) ? completedMatches : [];
  const sorted = [...list].sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

  if (!sorted.length) {
    return <p className="text-sm text-slate-500">No completed matches yet.</p>;
  }

  return (
    <div className="space-y-3">
      {sorted.map((m) => {
        const completedAt = m.completedAt ? new Date(m.completedAt) : null;
        const subtitle = completedAt ? completedAt.toLocaleString() : '';
        return (
          <div
            key={m.id}
            className={`flex min-w-0 flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm ${
              m.voided ? 'border-red-200/80' : 'border-slate-200/80'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-700">
                    {m.courtNameSnapshot || 'Court'}
                  </span>
                  {m.voided && (
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                      Voided
                    </span>
                  )}
                </div>
                {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Shuttles used: <span className="text-slate-900">{m.shuttleUsed || 0}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onRequestToggleVoid?.(m.id)}
                  className={`min-h-[40px] rounded-xl px-3 py-1.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    m.voided
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus:ring-emerald-500/30'
                      : 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-500/30'
                  }`}
                >
                  {m.voided ? 'Restore game' : 'Void game'}
                </button>
              </div>
            </div>

            <div className="flex min-w-0 flex-col items-center justify-center gap-2 sm:flex-row sm:flex-wrap sm:gap-2">
              <TeamDisplay team={m.team1 || []} />
              <span className="w-full shrink-0 py-1 text-center font-medium text-slate-400 sm:w-auto sm:py-0">
                vs
              </span>
              <TeamDisplay team={m.team2 || []} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

