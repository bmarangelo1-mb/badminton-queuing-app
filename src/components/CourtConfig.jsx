export default function CourtConfig({ courts, onCourtsChange, disabled }) {
  const handleIncrement = () => {
    if (disabled) return;
    const newValue = Math.min(10, courts + 1);
    onCourtsChange(newValue);
  };

  const handleDecrement = () => {
    if (disabled) return;
    const newValue = Math.max(1, courts - 1);
    onCourtsChange(newValue);
  };

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor="courts" className="text-sm font-medium text-slate-700">
        Number of courts
      </label>
      <div className="relative inline-flex w-full min-w-[100px] max-w-[7rem] items-center">
        <input
          id="courts"
          type="number"
          min={1}
          max={10}
          step={1}
          value={courts}
          onChange={(e) => {
            const val = e.target.value;
            // Handle empty string - allow it temporarily
            if (val === '') {
              return;
            }
            const v = Number(val);
            // Update if valid number within range
            if (!Number.isNaN(v)) {
              // Clamp to valid range
              const clamped = Math.max(1, Math.min(10, v));
              onCourtsChange(clamped);
            }
          }}
          onBlur={(e) => {
            // Ensure value is valid on blur
            const val = e.target.value;
            const v = Number(val);
            if (val === '' || Number.isNaN(v) || v < 1 || v > 10) {
              // Reset to current valid value
              e.target.value = String(courts);
            }
          }}
          disabled={disabled}
          inputMode="numeric"
          autoComplete="off"
          className="court-number-input min-h-[44px] w-full touch-manipulation rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-12 text-base text-slate-900 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
        />
        <div className="absolute right-1 flex flex-col overflow-hidden rounded-md border border-slate-300 bg-slate-50">
          <button
            type="button"
            onClick={handleIncrement}
            disabled={disabled || courts >= 10}
            className="flex h-5 w-6 items-center justify-center text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Increment"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <div className="h-px bg-slate-300" />
          <button
            type="button"
            onClick={handleDecrement}
            disabled={disabled || courts <= 1}
            className="flex h-5 w-6 items-center justify-center text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Decrement"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
