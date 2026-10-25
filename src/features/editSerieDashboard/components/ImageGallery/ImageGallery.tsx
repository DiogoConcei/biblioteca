import { useEffect, useState } from 'react';
import { useController, Control, FieldValues, Path } from 'react-hook-form';
import { ImagePlus } from 'lucide-react';

import useImage from '@/shared/hooks/useImage';

import styles from './ImageGallery.module.scss';
import SerieGallery from '../SerieGallery/SerieGallery';

export default function ImageGallery<T extends FieldValues>({
  control,
  name,
}: {
  control: Control<T>;
  name: Path<T>;
}) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const { previewSrc, loadExistingImage } = useImage();

  const { field, fieldState } = useController({
    name,
    control,
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
        onClick={() => {
          setIsOpen(true);
        }}
        role="button"
      >
        {previewSrc ? (
          <img src={previewSrc} alt="Preview da capa" className={styles.coverPreview} />
        ) : (
          <div className={styles.placeholder}>
            <ImagePlus size={48} />
            <span>Clique para adicionar</span>
          </div>
        )}
      </div>

      {fieldState.error && <p className={styles.error}>{fieldState.error.message}</p>}

      {isOpen && (
        <SerieGallery
          currentCover={field.value}
          onClose={() => setIsOpen(false)}
          onSelect={(novaCapa) => {
            field.onChange(novaCapa);
            setIsOpen(false);
          }}
        />
      )}
    </div>
  );
}
