import { useEffect, useRef } from 'react';
import { ViewMode } from '../../../../../electron/types/electron-auxiliar.interfaces';
import { VIEW_MODE_LABEL } from '@/shared/components/ViewModeSelector/ViewModeSelector';
import styles from './ViewModeModal.module.scss';

interface ViewModeModalProps {
  mode: ViewMode | null; // null = fechado
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ViewModeModal({ mode, onConfirm, onCancel }: ViewModeModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (mode && !dialog.open) dialog.showModal();
    if (!mode && dialog.open) dialog.close();
  }, [mode]);

  return (
    <dialog
      ref={ref}
      className={styles.modal}
      onCancel={(e) => {
        e.preventDefault(); // Esc passa pelo nosso estado
        onCancel();
      }}
      onClick={(e) => e.target === e.currentTarget && onCancel()} // clique no backdrop
    >
      {mode && (
        <div className={styles.content}>
          <h2>Modo de exibição: {VIEW_MODE_LABEL[mode]}</h2>

          {/* TODO: preview real da série neste modo */}
          <div className={styles.preview}>Preview em breve</div>

          <div className={styles.actions}>
            <button type="button" onClick={onCancel}>
              Cancelar
            </button>
            <button type="button" className={styles.primary} onClick={onConfirm}>
              OK
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
