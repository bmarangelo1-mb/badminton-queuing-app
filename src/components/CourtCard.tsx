import { useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, Trash2, UsersRound, Wand2 } from 'lucide-react';
import ActionCard from './ActionCard';
import MatchupBlock from './MatchupBlock';

export default function CourtCard({
  court,
  courts,
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
  onRequestSwitchCourt,
}: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(court?.name || 'Court');

  const [showTransfer, setShowTransfer] = useState(false);
  const [draftCourtId, setDraftCourtId] = useState(court?.id || '');

  useEffect(() => setDraftName(court?.name || 'Court'), [court?.name]);
  useEffect(() => {
    setDraftCourtId(court?.id || '');
    setShowTransfer(false);
  }, [court?.id, match?.id]);

  const courtNameById = useMemo(
    () => new Map((courts || []).map((c: any) => [c.id, c.name])),
    [courts]
  );

  const isPlaying = !!match;
  const statusPill = isPlaying ? (
    <span className="pill pill-accent">
      <span className="pill-dot bg-[color:var(--accent)]" />
      Playing
    </span>
  ) : (
    <span className="pill">
      <span className="pill-dot bg-white/40" />
      Available
    </span>
  );

  const commitName = () => {
    const trimmed = String(draftName || '').trim();
    onEditCourtName?.(court.id, trimmed || court.name);
    setIsEditing(false);
  };
  const cancelEdit = () => {
    setDraftName(court.name);
    setIsEditing(false);
  };

  const canTransfer =
    !!match && !!onRequestSwitchCourt && Array.isArray(courts) && courts.length > 1;

  return (
    <div
      className={`glass-card glass-card-hover relative flex min-w-0 flex-col overflow-hidden ${
        isPlaying ? 'ring-1 ring-[rgba(34,211,238,0.18)]' : ''
      }`}
    >
      {/* Top bar */}
      <div className="flex items-start justify-between gap-3 border-b border-white/10 bg-white/5 px-4 py-3">
        <div className="min-w-0">
          {isEditing ? (
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitName();
                if (e.key === 'Escape') cancelEdit();
              }}
              autoFocus
              className="field text-sm font-bold"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="group inline-flex max-w-full items-center gap-2 rounded-xl px-2 py-1 text-left text-sm font-bold text-white/95 transition hover:bg-white/10"
              aria-label="Edit court name"
              title="Edit court name"
            >
              <span className="truncate">{court?.name || 'Court'}</span>
              <span className="text-xs font-semibold text-white/50 opacity-0 transition group-hover:opacity-100">
                Edit
              </span>
            </button>
          )}
          <div className="mt-1">{statusPill}</div>
        </div>

        <div className="flex items-center gap-1.5">
          {canTransfer && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTransfer((v) => !v)}
                className="btn btn-secondary btn-icon"
                aria-label="Transfer match"
                title="Transfer match"
              >
                <ArrowRightLeft className="h-5 w-5" />
              </button>

              {showTransfer && (
                <div className="glass-card absolute right-0 top-11 z-10 w-72 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-white/90">Transfer to</span>
                    <button
                      type="button"
                      onClick={() => setShowTransfer(false)}
                      className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white"
                      aria-label="Close"
                      title="Close"
                    >
                      ✕
                    </button>
                  </div>
                  <select
                    value={draftCourtId || ''}
                    onChange={(e) => setDraftCourtId(e.target.value)}
                    className="field field-select mt-2 min-h-[44px] w-full text-sm font-extrabold"
                  >
                    {(courts || []).map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.id}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-[color:var(--muted)]">
                    If the target court is occupied, we’ll swap the matches.
                  </p>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowTransfer(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!draftCourtId || draftCourtId === court.id}
                      onClick={() => {
                        onRequestSwitchCourt?.(match.id, draftCourtId);
                        setShowTransfer(false);
                      }}
                      className="btn btn-primary disabled:opacity-50"
                      title={
                        !draftCourtId || draftCourtId === court.id
                          ? 'Select a different court'
                          : `Transfer to ${courtNameById.get(draftCourtId) || 'selected court'}`
                      }
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {onRemoveCourt && (
            <button
              type="button"
              onClick={() => onRemoveCourt(court.id)}
              disabled={!canRemoveCourt}
              className="btn btn-secondary btn-icon disabled:opacity-40"
              aria-label="Remove court"
              title={canRemoveCourt ? 'Remove court' : 'Cannot remove while playing'}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 px-4 py-4">
        {match ? (
          <>
            <MatchupBlock match={match} onClick={onEditMatch} />

            <div className="glass-inset mt-auto p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <button
                    type="button"
                    onClick={onCompleteMatch}
                    className="btn btn-primary h-11 w-full"
                  >
                    Complete match
                  </button>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">Logs result + frees the court</p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={onCancelMatch}
                    className="btn btn-secondary h-11 w-full border-[rgba(251,113,133,0.35)] text-[rgba(255,230,235,0.95)] hover:bg-[rgba(251,113,133,0.10)]"
                  >
                    Cancel match
                  </button>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">Returns players to queue</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="glass-inset flex items-start gap-3 p-4">
              <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white/70 shadow-sm">
                <UsersRound className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-white">No match on this court</p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  Create a match manually or let the smart queue pick the best 4.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <ActionCard
                title="Manual match"
                description="Pick 4 players to create a match."
                buttonLabel="Create manually"
                onClick={() => onManualMatch?.(court.id)}
                icon={<UsersRound className="h-5 w-5" />}
              />
              <ActionCard
                title="Smart queue match"
                description="Auto-picks the best 4 based on fairness."
                buttonLabel="Generate match"
                onClick={() => onCreateNextMatch?.(court.id)}
                disabled={!canCreateNextMatch}
                recommended
                icon={<Wand2 className="h-5 w-5" />}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

