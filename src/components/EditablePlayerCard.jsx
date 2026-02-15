import { useState, useEffect } from 'react';
import { CATEGORIES, GENDERS } from '../utils/queueMatcher';
import GenderIcon from './GenderIcon';

function StatusBadge({ status }) {
  const isPlaying = status === 'playing';
  return (
    <span className={`pill ${isPlaying ? 'pill-accent' : ''}`}>
      <span className={`pill-dot ${isPlaying ? 'bg-[color:var(--accent)]' : 'bg-white/40'}`} />
      {isPlaying ? 'Playing' : 'Waiting'}
    </span>
  );
}

export default function EditablePlayerCard({ player, playingIds, onUpdate, onRemove, hideStatus = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(player.name);
  const [category, setCategory] = useState(player.category);
  const [gender, setGender] = useState(player.gender || GENDERS.MALE);

  // Sync local state when player prop changes
  useEffect(() => {
    if (!isEditing) {
      setName(player.name);
      setCategory(player.category);
      setGender(player.gender || GENDERS.MALE);
    }
  }, [player.name, player.category, player.gender, isEditing]);

  const handleSave = () => {
    if (name.trim() && onUpdate) {
      onUpdate(player.id, { name: name.trim(), category, gender });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setName(player.name);
    setCategory(player.category);
    setGender(player.gender || GENDERS.MALE);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <li className="glass-card flex flex-col px-4 py-3 ring-1 ring-[rgba(34,211,238,0.22)]">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          className="field mb-2 text-sm font-extrabold uppercase tracking-wide"
          autoFocus
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="field field-select min-w-[9.5rem] px-2 py-1 text-xs font-extrabold"
            >
              <option value={CATEGORIES.BEGINNERS}>{CATEGORIES.BEGINNERS}</option>
              <option value={CATEGORIES.INTERMEDIATE}>{CATEGORIES.INTERMEDIATE}</option>
            </select>
            <div className="segmented">
              <button
                type="button"
                onClick={() => setGender(GENDERS.MALE)}
                className={`segment ${gender === GENDERS.MALE ? 'segment-active' : ''}`}
                aria-pressed={gender === GENDERS.MALE}
                title="Male"
              >
                <GenderIcon gender={GENDERS.MALE} />
              </button>
              <button
                type="button"
                onClick={() => setGender(GENDERS.FEMALE)}
                className={`segment ${gender === GENDERS.FEMALE ? 'segment-active' : ''}`}
                aria-pressed={gender === GENDERS.FEMALE}
                title="Female"
              >
                <GenderIcon gender={GENDERS.FEMALE} />
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="btn btn-primary min-h-[36px] px-3 py-2 text-xs"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-secondary min-h-[36px] px-3 py-2 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="glass-card glass-card-hover flex flex-col px-4 py-3">
      <div className="mb-2 font-extrabold uppercase tracking-wide text-white">
        {player.name}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <GenderIcon gender={player.gender || GENDERS.MALE} />
          <span
            className={`inline-flex min-w-[5.5rem] items-center justify-center rounded-lg px-2 py-0.5 text-xs font-medium ${
              player.category === 'Beginners'
                ? 'bg-[rgba(251,191,36,0.18)] text-[rgba(255,241,200,0.95)]'
                : 'bg-white/10 text-white/80'
            }`}
          >
            {player.category}
          </span>
          {!hideStatus && (
            <>
              <StatusBadge status={playingIds.has(player.id) ? 'playing' : 'waiting'} />
              <span className="text-xs text-[color:var(--muted)]" title="Games played">
                {player.gamesPlayed} game{player.gamesPlayed !== 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onUpdate && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="btn btn-secondary btn-icon min-h-[36px] w-9 rounded-xl p-0 text-white/80"
              aria-label="Update"
              title="Update"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(player.id)}
              className="btn btn-secondary btn-icon min-h-[36px] w-9 rounded-xl p-0 text-white/60 hover:text-white"
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
