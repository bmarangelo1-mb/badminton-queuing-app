import { useEffect } from 'react';

export default function AlertDialog({ open, title, message, buttonLabel = 'OK', onClose }) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-md"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alert-title"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className="glass-modal w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="alert-title" className="text-lg font-semibold text-white">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--muted)]">{message}</p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
