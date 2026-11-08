import { useEffect } from 'react';
import { useController, Control, FieldValues, Path } from 'react-hook-form';
import { Wallpaper, Trash2, RefreshCw } from 'lucide-react';
import useImage from '@/shared/hooks/useImage';
import styles from './BackgroundField.module.scss';

interface Props<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  disabled?: boolean;
}

export default function BackgroundImageField<T extends FieldValues>({
  control,
  name,
  disabled = false,
}: Props<T>) {
  const { previewSrc, getPreview, loadExistingImage } = useImage();
  const { field, fieldState } = useController({ name, control });

  useEffect(() => {
    loadExistingImage(field.value ?? '');
  }, [field.value, loadExistingImage]);

  const pick = async () => {
    if (disabled) return;
    const path = await getPreview();
    if (path) field.onChange(path);
  };

  return (
    <div className={styles.field}>
      <span className={styles.label}>Imagem de fundo</span>

      <div className={styles.uploadArea} data-has-image={!!previewSrc}>
        {previewSrc ? (
          <>
            <img src={previewSrc} alt="Pré-visualização" className={styles.image} />
            <div className={styles.overlay}>
              <button
                type="button"
                className={styles.actionBtn}
                disabled={disabled}
                onClick={pick}
                title="Trocar imagem"
              >
                <RefreshCw size={20} />
                <span>Trocar</span>
              </button>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.danger}`}
                disabled={disabled}
                onClick={() => field.onChange('')}
                title="Remover imagem"
              >
                <Trash2 size={20} />
                <span>Remover</span>
              </button>
            </div>
          </>
        ) : (
          <div className={styles.placeholder} onClick={pick} role="button" tabIndex={0}>
            <Wallpaper size={48} className={styles.icon} />
            <span className={styles.text}>Clique para adicionar um banner de fundo</span>
          </div>
        )}

        {fieldState.error && <p className={styles.error}>{fieldState.error.message}</p>}
      </div>
    </div>
  );
}
