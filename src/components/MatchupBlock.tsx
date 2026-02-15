import GenderIcon from './GenderIcon';

function CategoryBadge({ category }: { category: string }) {
  const isBeginners = category === 'Beginners';
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        isBeginners
          ? 'bg-[rgba(251,191,36,0.18)] text-[rgba(255,241,200,0.95)]'
          : 'bg-white/10 text-white/80'
      }`}
    >
      {category}
    </span>
  );
}

function PlayerChip({ player }: { player: any }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs shadow-sm">
      <span className="text-white/60">
        <GenderIcon gender={player.gender} />
      </span>
      <span className="max-w-[11rem] truncate font-extrabold text-white">{player.name}</span>
      <CategoryBadge category={player.category} />
    </span>
  );
}

export default function MatchupBlock({
  match,
  onClick,
}: {
  match: any;
  onClick?: () => void;
}) {
  const clickable = !!onClick;
  return (
    <div
      className={`glass-inset relative p-4 shadow-sm transition ${
        clickable
          ? 'cursor-pointer hover:shadow-md'
          : ''
      }`}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick?.();
            }
          : undefined
      }
    >
      <div className="absolute left-4 top-4 flex items-center gap-2">
        <span className="inline-flex h-2 w-2 rounded-full bg-[color:var(--accent2)]" />
        <span className="text-xs font-extrabold uppercase tracking-wide text-white/70">
          Match in progress
        </span>
      </div>

      <div className="mt-6 grid gap-3">
        <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/10 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-white/70">Team A</span>
            <span className="text-[11px] font-extrabold text-white/50">2 players</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(match.team1 || []).map((p: any) => (
              <PlayerChip key={p.id} player={p} />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-extrabold text-white/70 shadow-sm">
            VS
          </span>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/10 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-white/70">Team B</span>
            <span className="text-[11px] font-extrabold text-white/50">2 players</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(match.team2 || []).map((p: any) => (
              <PlayerChip key={p.id} player={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

