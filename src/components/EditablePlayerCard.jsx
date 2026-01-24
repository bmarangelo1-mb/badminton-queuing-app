import { useState } from 'react';
import { CATEGORIES } from '../utils/queueMatcher';

function StatusBadge({ status }) {
  const isPlaying = status === 'playing';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isPlaying ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {isPlaying ? 'Playing' : 'Waiting'}
    </span>
  );
}

export default function EditablePlayerCard({ player, playingIds, onUpdate, onRemove }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(player.name);
  const [category, setCategory] = useState(player.category);

  const handleSave = () => {
    if (name.trim()) {
      onUpdate(player.id, { name: name.trim(), category });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setName(player.name);
    setCategory(player.category);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <li className="flex flex-col rounded-xl border-2 border-emerald-300 bg-white px-4 py-3 shadow-sm">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          className="mb-2 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm font-semibold uppercase tracking-wide text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          autoFocus
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`inline-flex min-w-[5.5rem] items-center justify-center rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
              category === 'Beginners'
                ? 'bg-amber-50 text-amber-800'
                : 'bg-slate-50 text-slate-700'
            }`}
          >
            <option value={CATEGORIES.BEGINNERS}>{CATEGORIES.BEGINNERS}</option>
            <option value={CATEGORIES.INTERMEDIATE}>{CATEGORIES.INTERMEDIATE}</option>
          </select>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-emerald-500"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="flex flex-col rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm transition hover:shadow-md">
      <div className="mb-2 font-semibold uppercase tracking-wide text-slate-900">
        {player.name}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex min-w-[5.5rem] items-center justify-center rounded-lg px-2 py-0.5 text-xs font-medium ${
              player.category === 'Beginners'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {player.category}
          </span>
          <StatusBadge status={playingIds.has(player.id) ? 'playing' : 'waiting'} />
          <span className="text-xs text-slate-500" title="Games played">
            {player.gamesPlayed} game{player.gamesPlayed !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded p-1.5 text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            aria-label="Update"
            title="Update"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(player.id)}
              className="rounded p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30"
              aria-label="Remove"
              title="Remove"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
