import { useEffect } from 'react';
import CompletedMatchHistory from './CompletedMatchHistory';

export default function MatchHistoryModal({ open, completedMatches, onClose, onRequestToggleVoid }) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-history-title"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="glass-modal w-full max-w-4xl">
        <div className="border-b border-white/10 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 id="match-history-title" className="text-2xl font-bold text-white">
                Match history
              </h2>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                Completed games. You can void or restore a game to exclude/include it in totals.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
              aria-label="Close"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">
          <CompletedMatchHistory
            completedMatches={completedMatches}
            onRequestToggleVoid={onRequestToggleVoid}
          />
        </div>

        <div className="border-t border-white/10 p-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

