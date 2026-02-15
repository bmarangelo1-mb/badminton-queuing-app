import GenderIcon from './GenderIcon';

function CategoryBadge({ category }) {
  const isBeginners = category === 'Beginners';
  return (
    <span
      className={`inline-flex min-w-[5.5rem] items-center justify-center rounded px-1.5 py-0.5 text-xs font-medium ${
        isBeginners
          ? 'bg-[rgba(251,191,36,0.18)] text-[rgba(255,241,200,0.95)]'
          : 'bg-white/10 text-white/80'
      }`}
    >
      {category}
    </span>
  );
}

function TeamDisplay({ team }) {
  return (
    <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 shadow-sm sm:w-auto sm:justify-start">
      {team.map((p, i) => (
        <span key={p.id} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-white/30">+</span>}
          <span className="flex items-center gap-1.5 font-extrabold text-white">
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
    return <p className="text-sm text-[color:var(--muted)]">No completed matches yet.</p>;
  }

  return (
    <div className="space-y-3">
      {sorted.map((m) => {
        const completedAt = m.completedAt ? new Date(m.completedAt) : null;
        const subtitle = completedAt ? completedAt.toLocaleString() : '';
        return (
          <div
            key={m.id}
            className={`glass-card glass-card-hover flex min-w-0 flex-col gap-3 p-4 ${
              m.voided ? 'ring-1 ring-[rgba(251,113,133,0.22)]' : ''
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="pill">
                    {m.courtNameSnapshot || 'Court'}
                  </span>
                  {m.voided && (
                    <span className="pill pill-danger">
                      <span className="pill-dot bg-[color:var(--danger)]" />
                      Voided
                    </span>
                  )}
                </div>
                {subtitle && <p className="mt-1 text-xs text-[color:var(--muted)]">{subtitle}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-extrabold text-white/80">
                  Shuttles used: <span className="text-white">{m.shuttleUsed || 0}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onRequestToggleVoid?.(m.id)}
                  className={`btn ${m.voided ? 'btn-primary' : 'btn-danger'} min-h-[40px] px-3 py-2 text-sm`}
                >
                  {m.voided ? 'Restore game' : 'Void game'}
                </button>
              </div>
            </div>

            <div className="flex min-w-0 flex-col items-center justify-center gap-2 sm:flex-row sm:flex-wrap sm:gap-2">
              <TeamDisplay team={m.team1 || []} />
              <span className="w-full shrink-0 py-1 text-center font-extrabold text-white/40 sm:w-auto sm:py-0">
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

