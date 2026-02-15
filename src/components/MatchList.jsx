import CourtCard from './CourtCard.tsx';
import AddCourtCard from './AddCourtCard';

export default function MatchList({
  matches,
  courts,
  canCreate,
  availableCourtIds,
  onAddCourt,
  onEditCourtName,
  onRemoveCourt,
  onManualMatch,
  onCreateNextMatch,
  onCompleteMatch,
  onCancelMatch,
  onEditMatch,
  onRequestSwitchCourt,
}) {
  const matchByCourtId = new Map(matches.map((m) => [m.courtId, m]));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {courts.map((court) => {
        const match = matchByCourtId.get(court.id) || null;
        const canCreateNextMatch = !match && availableCourtIds.includes(court.id) && canCreate;
        const canRemoveCourt = courts.length > 1 && !match;
        return (
          <CourtCard
            key={court.id}
            court={court}
            courts={courts}
            match={match}
            canCreateNextMatch={canCreateNextMatch}
            canRemoveCourt={canRemoveCourt}
            onEditCourtName={onEditCourtName}
            onRemoveCourt={onRemoveCourt}
            onManualMatch={onManualMatch}
            onCreateNextMatch={onCreateNextMatch}
            onCompleteMatch={match ? () => onCompleteMatch(match.id) : undefined}
            onCancelMatch={match && onCancelMatch ? () => onCancelMatch(match.id) : undefined}
            onEditMatch={match && onEditMatch ? () => onEditMatch(match.id) : undefined}
            onRequestSwitchCourt={onRequestSwitchCourt}
          />
        );
      })}
      <AddCourtCard onAddCourt={onAddCourt} />
    </div>
  );
}
