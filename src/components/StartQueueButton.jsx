export default function StartQueueButton({ playerCount, onStart, disabled }) {
  const canStart = playerCount >= 4 && !disabled;

  return (
    <button
      type="button"
      onClick={onStart}
      disabled={!canStart}
      className="rounded-xl bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
    >
      Start Queue
    </button>
  );
}
