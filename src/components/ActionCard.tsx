import * as React from 'react';

export default function ActionCard({
  title,
  description,
  buttonLabel,
  onClick,
  disabled,
  recommended,
  icon,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  onClick?: () => void;
  disabled?: boolean;
  recommended?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={`glass-card glass-card-hover group relative flex min-w-0 flex-col p-4 ${
        recommended
          ? 'ring-1 ring-[rgba(34,211,238,0.22)]'
          : ''
      }`}
    >
      <div className="flex flex-1 items-start gap-3">
        {icon && (
          <div
            className={`mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl ${
              recommended
                ? 'bg-[rgba(34,211,238,0.14)] text-white/90'
                : 'bg-white/10 text-white/70'
            }`}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-white">{title}</h3>
            {recommended && (
              <span className="rounded-full border border-[rgba(34,211,238,0.30)] bg-[rgba(34,211,238,0.12)] px-2 py-0.5 text-[11px] font-semibold text-white/90">
                Recommended
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-[color:var(--muted)]">{description}</p>
        </div>
      </div>
      <div className="mt-5">
        <button
          type="button"
          onClick={onClick}
          disabled={!!disabled}
          className={`btn h-12 w-full ${recommended ? 'btn-primary' : 'btn-secondary'} disabled:opacity-50`}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

