import MatchCard from './MatchCard';

export default function MatchList({ matches, onCompleteMatch }) {
  if (!matches.length) {
    return (
      <p className="text-sm text-gray-500">No active matches. Add players and matches will be created automatically.</p>
    );
  }

  return (
    <div className="space-y-3">
      {matches.map((m) => (
        <MatchCard
          key={m.id}
          match={m}
          onComplete={() => onCompleteMatch(m.id)}
        />
      ))}
    </div>
  );
}
