import MatchCard from './MatchCard';

export default function MatchList({ matches, courts, onCompleteMatch, onCancelMatch, onEditMatch }) {
  if (!matches.length) {
    return (
      <p className="text-sm text-slate-500">
        No active matches. Click “Create next match” when you have at least 4 waiting players and a free court.
      </p>
    );
  }

  const byCourt = Array.from({ length: courts }, (_, i) => ({
    courtId: i + 1,
    match: matches.find((m) => m.courtId === i + 1),
  }));

  return (
    <div className="space-y-3">
      {byCourt.map(({ courtId, match: m }) =>
        m ? (
          <MatchCard
            key={m.id}
            match={m}
            onComplete={() => onCompleteMatch(m.id)}
            onCancel={onCancelMatch ? () => onCancelMatch(m.id) : undefined}
            onEdit={onEditMatch ? () => onEditMatch(m.id) : undefined}
          />
        ) : (
          <div
            key={`empty-${courtId}`}
            className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center text-sm text-slate-400"
          >
            Court {courtId} — available
          </div>
        )
      )}
    </div>
  );
}
