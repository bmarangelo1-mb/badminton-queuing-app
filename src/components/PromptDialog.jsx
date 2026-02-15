import { useEffect } from 'react';

export default function PromptDialog({
  open,
  title,
  message,
  inputLabel,
  inputValue,
  onInputChange,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  inputProps = {},
}) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-title"
      onClick={(e) => e.target === e.currentTarget && onCancel?.()}
    >
      <div
        className="glass-modal w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="prompt-title" className="text-lg font-semibold text-white">
          {title}
        </h2>
        {message && (
          <p className="mt-3 text-sm leading-relaxed text-[color:var(--muted)]">{message}</p>
        )}
        <label className="mt-4 flex flex-col gap-1 text-sm font-medium text-[color:var(--muted)]">
          {inputLabel}
          <input
            value={inputValue}
            onChange={(e) => onInputChange?.(e.target.value)}
            className="field"
            {...inputProps}
          />
        </label>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn btn-primary"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
