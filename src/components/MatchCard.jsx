export default function MatchCard({ match, onComplete }) {
  const { team1, team2 } = match;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <TeamDisplay team={team1} />
          <span className="text-gray-400 font-medium">vs</span>
          <TeamDisplay team={team2} />
        </div>
        <button
          type="button"
          onClick={onComplete}
          className="rounded bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Complete match
        </button>
      </div>
    </div>
  );
}

function TeamDisplay({ team }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded border border-gray-200 bg-gray-50 px-2 py-1">
      {team.map((p, i) => (
        <span key={p.id} className="flex items-center gap-1">
          {i > 0 && <span className="text-gray-400">+</span>}
          <span className="font-medium text-gray-900">{p.name}</span>
          <span
            className={`rounded px-1.5 py-0.5 text-xs ${
              p.category === 'Beginners' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
            }`}
          >
            {p.category}
          </span>
        </span>
      ))}
    </div>
  );
}
