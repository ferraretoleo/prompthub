"use client";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  onConfirm,
  onCancel,
  danger = false
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="modalBackdrop"
      role="presentation"
      onMouseDown={onCancel}
    >
      <div
        className="modalDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <h2 id="confirm-title">
          {title}
        </h2>

        <p className="meta">
          {message}
        </p>

        <div className="modalActions">
          <button
            type="button"
            className="button"
            onClick={onCancel}
          >
            Cancelar
          </button>

          <button
            type="button"
            className={
              danger
                ? "button buttonDanger"
                : "buttonPrimary"
            }
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
