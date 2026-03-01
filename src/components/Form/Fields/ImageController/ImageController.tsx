import { useEffect } from 'react';
import { useController, Control, FieldValues, Path } from 'react-hook-form';
import { ImagePlus } from 'lucide-react';

import useImage from '@/hooks/useImage';

import styles from './ImageController.module.scss';

export default function ImageController<T extends FieldValues>({
  control,
  name,
}: {
  control: Control<T>;
  name: Path<T>;
}) {
  const { previewSrc, getPreview, loadExistingImage } = useImage();

  const { field, fieldState } = useController({
    name,
    control,
    rules: { required: 'A capa é obrigatória' },
  });

  useEffect(() => {
    if (field.value) {
      loadExistingImage(field.value);
    }
  }, [field.value, loadExistingImage]);

  return (
    <div className={styles['image-upload']}>
      <span>Capa</span>

      <div
        className={styles.imageContainer}
        onClick={async () => {
          const image = await getPreview();
          if (!image) return;
          field.onChange(image);
        }}
        role="button"
      >
        {previewSrc ? (
          <img
            src={previewSrc}
            alt="Preview da capa"
            className={styles.coverPreview}
          />
        ) : (
          <div className={styles.placeholder}>
            <ImagePlus size={48} />
            <span>Clique para adicionar</span>
          </div>
        )}
      </div>

      {fieldState.error && (
        <p className={styles.error}>{fieldState.error.message}</p>
      )}
    </div>
  );
}
