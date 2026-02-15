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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-history-title"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-200 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 id="match-history-title" className="text-2xl font-bold text-slate-900">
                Match history
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Completed games. You can void or restore a game to exclude/include it in totals.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
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

        <div className="border-t border-slate-200 p-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

