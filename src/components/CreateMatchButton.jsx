export default function CreateMatchButton({ canCreate, onCreate }) {
  return (
    <button
      type="button"
      onClick={onCreate}
      disabled={!canCreate}
      className="min-h-[44px] rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
    >
      Create next match
    </button>
  );
}
