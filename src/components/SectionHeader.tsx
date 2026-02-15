import type { ReactNode } from 'react';

export default function SectionHeader({
  title,
  meta,
  description,
  actions,
}: {
  title: string;
  meta?: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-bold tracking-tight text-white">{title}</h2>
          {meta && (
            <span className="pill">
              {meta}
            </span>
          )}
        </div>
        {description && <p className="mt-1 text-sm text-[color:var(--muted)]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

