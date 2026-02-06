import { useEffect, useState } from 'react';
import MatchCard from './MatchCard';
import CreateMatchButton from './CreateMatchButton';

export default function CourtCard({
  court,
  match,
  canCreateNextMatch,
  canRemoveCourt,
  onEditCourtName,
  onRemoveCourt,
  onManualMatch,
  onCreateNextMatch,
  onCompleteMatch,
  onCancelMatch,
  onEditMatch,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(court.name);

  useEffect(() => {
    setDraftName(court.name);
  }, [court.name]);

  const commitName = () => {
    const trimmed = draftName.trim();
    onEditCourtName(court.id, trimmed || court.name);
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setDraftName(court.name);
    setIsEditing(false);
  };

  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        {isEditing ? (
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                commitName();
              } else if (e.key === 'Escape') {
                cancelEdit();
              }
            }}
            autoFocus
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-lg px-2 py-1 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
            aria-label="Edit court name"
          >
            {court.name}
          </button>
        )}
        {!match && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            Available
          </span>
        )}
        {onRemoveCourt && (
          <button
            type="button"
            onClick={() => onRemoveCourt(court.id)}
            disabled={!canRemoveCourt}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
            aria-label="Remove court"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {match ? (
        <MatchCard
          match={match}
          onComplete={onCompleteMatch}
          onCancel={onCancelMatch}
          onEdit={onEditMatch}
          courtName={court.name}
          showCourtLabel={false}
          className="border-0 p-0 shadow-none"
        />
      ) : (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onManualMatch(court.id)}
            className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Manual match
          </button>
          <CreateMatchButton
            canCreate={canCreateNextMatch}
            onCreate={() => onCreateNextMatch(court.id)}
          />
        </div>
      )}
    </div>
  );
}
