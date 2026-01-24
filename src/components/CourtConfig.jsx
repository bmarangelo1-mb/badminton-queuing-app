export default function CourtConfig({ courts, onCourtsChange, disabled }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="courts" className="text-sm font-medium text-slate-700">
        Number of courts
      </label>
      <input
        id="courts"
        type="number"
        min={1}
        max={10}
        value={courts}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (!Number.isNaN(v) && v >= 1 && v <= 10) onCourtsChange(v);
        }}
        disabled={disabled}
        className="w-24 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
      />
    </div>
  );
}
