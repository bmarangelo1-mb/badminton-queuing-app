export default function StartQueueButton({ playerCount, onStart, disabled }) {
  const canStart = playerCount >= 4 && !disabled;

  return (
    <button
      type="button"
      onClick={onStart}
      disabled={!canStart}
      className="btn btn-primary px-6 text-base disabled:opacity-50"
    >
      Start Queue
    </button>
  );
}
