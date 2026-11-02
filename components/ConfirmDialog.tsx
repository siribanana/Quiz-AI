interface Props {
  open: boolean;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-md bg-background-alt p-5 shadow-lg"
      >
        <p className="mb-4 text-foreground">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-3 py-1.5 text-sm lowercase text-sub transition-colors hover:text-foreground"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-accent px-4 py-1.5 text-sm font-semibold lowercase text-accent-ink transition-[filter] hover:brightness-110"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
