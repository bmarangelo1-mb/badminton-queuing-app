import EditablePlayerCard from './EditablePlayerCard';

export default function PlayerList({ players, onUpdate, onRemove }) {
  if (!players.length) {
    return (
      <p className="text-sm text-slate-500">No players yet. Add players above.</p>
    );
  }

  // Empty Set for playingIds since on setup page, no matches exist yet
  const emptyPlayingIds = new Set();

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {players.map((p) => (
        <EditablePlayerCard
          key={p.id}
          player={p}
          playingIds={emptyPlayingIds}
          onUpdate={onUpdate}
          onRemove={onRemove}
          hideStatus={true}
        />
      ))}
    </ul>
  );
}
