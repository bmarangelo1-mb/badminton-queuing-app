export default function AddCourtCard({ onAddCourt }) {
  return (
    <button
      type="button"
      onClick={onAddCourt}
      className="flex min-h-[140px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-400 bg-slate-50 text-slate-400 transition hover:border-emerald-400 hover:bg-emerald-50/40 hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      aria-label="Add court"
    >
      <span className="text-4xl font-semibold">+</span>
      <span className="mt-2 text-sm font-medium">Add court</span>
    </button>
  );
}
