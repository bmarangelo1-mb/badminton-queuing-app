export default function PlayerList({ players, onRemove }) {
  if (!players.length) {
    return (
      <p className="text-sm text-gray-500">No players in queue. Add players above.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {players.map((p, i) => (
        <li
          key={p.id}
          className="flex items-center justify-between rounded border border-gray-200 bg-white px-3 py-2 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 w-6">{i + 1}.</span>
            <span className="font-medium text-gray-900">{p.name}</span>
            <span
              className={`rounded px-2 py-0.5 text-xs font-medium ${
                p.category === 'Beginners'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              {p.category}
            </span>
          </div>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(p.id)}
              className="text-sm text-gray-500 hover:text-red-600 focus:outline-none"
            >
              Remove
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
