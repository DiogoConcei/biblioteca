import { useEffect, useId, useRef } from 'react';
import styles from './ConfirmDialog.module.scss';
import { ConfirmDialogProps } from '@/shared/types/components.interfaces';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  busy = false,
  error = null,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus(); // foco no botão seguro, não no destrutivo
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <div className={styles.panel}>
        <h2 id={titleId}>{title}</h2>
        {description && <p id={descId}>{description}</p>}
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <button
            ref={cancelRef}
            type="button"
            className={styles.cancel}
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={styles.confirm}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Aguarde…' : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
