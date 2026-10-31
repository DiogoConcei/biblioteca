import { useEffect, useState } from 'react';
import { useController, Control, FieldValues, Path } from 'react-hook-form';
import { useUIStore } from '@/shared/store/useUIStore';
import { ImagePlus } from 'lucide-react';
import useImage from '@/shared/hooks/useImage';
import styles from './ImageController.module.scss';
import { LiteratureForm } from '@/shared/types/series.interfaces';
import { SuggestedCover } from '@/shared/types/preload';

export default function ImageController<T extends FieldValues>({
  control,
  name,
  sourcePath,
  type,
}: {
  control: Control<T>;
  name: Path<T>;
  sourcePath: string;
  type: LiteratureForm;
}) {
  const { previewSrc, getPreview, loadExistingImage } = useImage();
  const [suggestCovers, setSuggestCovers] = useState<SuggestedCover[]>([]);
  const setError = useUIStore((s) => s.setError);

  const { field, fieldState } = useController({ name, control });

  useEffect(() => {
    if (field.value) {
      loadExistingImage(field.value);
    }
  }, [field.value, loadExistingImage]);

  useEffect(() => {
    setSuggestCovers([]); // não deixa sugestão do tipo antigo na tela

    if (!sourcePath || !type || type === LiteratureForm.BOOK) return;

    let cancelled = false;

    (async () => {
      try {
        const response = await window.electronAPI.upload.suggestCovers(sourcePath, type);
        if (cancelled) return;
        if (response.success && response.data) setSuggestCovers(response.data);
      } catch {
        // sugestão é opcional: falhou, a faixa simplesmente não aparece
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sourcePath, type]);

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
          <img src={previewSrc} alt="Preview da capa" className={styles.coverPreview} />
        ) : (
          <div className={styles.placeholder}>
            <ImagePlus size={48} />
            <span>Clique para adicionar do PC</span>
          </div>
        )}
      </div>
      {fieldState.error && <p className={styles.error}>{fieldState.error.message}</p>}

      {suggestCovers.length > 0 && (
        <div className={styles.suggestionsGallery}>
          {suggestCovers.map((coverImg) => (
            <img
              key={coverImg.path}
              src={coverImg.url}
              alt="Sugestão de capa"
              onClick={(e) => {
                e.stopPropagation();
                field.onChange(coverImg.path);
              }}
              style={{ width: 80, height: 120, cursor: 'pointer', objectFit: 'cover' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
