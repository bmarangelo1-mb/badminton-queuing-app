import { Plus } from 'lucide-react';

export default function AddCourtCard({ onAddCourt }) {
  return (
    <button
      type="button"
      onClick={onAddCourt}
      className="glass-card glass-card-hover group flex min-h-[170px] w-full flex-col items-center justify-center border-2 border-dashed border-white/20 bg-[rgba(255,255,255,0.04)] p-6 text-white/80 hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
      aria-label="Add court"
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80 shadow-sm transition group-hover:border-[rgba(34,211,238,0.25)] group-hover:bg-[rgba(34,211,238,0.10)]">
        <Plus className="h-6 w-6" />
      </span>
      <span className="mt-3 text-sm font-extrabold text-white">Add court</span>
      <span className="mt-1 text-xs text-[color:var(--muted)]">Adds another court lane for matches</span>
    </button>
  );
}
