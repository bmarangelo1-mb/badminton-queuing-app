import EditablePlayerCard from './EditablePlayerCard';

export default function PlayerStatusList({ players, playingIds, onUpdate, onRemove }) {
  if (!players.length) {
    return (
      <p className="text-sm text-[color:var(--muted)]">No players yet. Add players above.</p>
    );
  }

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {players.map((p) => (
        <EditablePlayerCard
          key={p.id}
          player={p}
          playingIds={playingIds}
          onUpdate={onUpdate}
          onRemove={onRemove}
        />
      ))}
    </ul>
  );
}
