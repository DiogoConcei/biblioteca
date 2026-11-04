import { useEffect, useRef, useState } from 'react';
import { useController, Control, FieldValues, Path } from 'react-hook-form';
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
  type?: LiteratureForm;
}) {
  const { previewSrc, getPreview, loadExistingImage } = useImage();
  const [suggestCovers, setSuggestCovers] = useState<SuggestedCover[]>([]);
  const { field, fieldState } = useController({ name, control });

  // refs: dentro do effect assíncrono, o valor capturado seria antigo
  const valueRef = useRef(field.value);
  valueRef.current = field.value;
  const onChangeRef = useRef(field.onChange);
  onChangeRef.current = field.onChange;
  const sourceRef = useRef<'none' | 'suggestion' | 'manual'>('none');

  useEffect(() => {
    if (field.value) {
      loadExistingImage(field.value);
    }
  }, [field.value, loadExistingImage]);

  useEffect(() => {
    setSuggestCovers([]);
    if (!sourcePath || !type || type === LiteratureForm.BOOK) return;

    let cancelled = false;

    (async () => {
      try {
        const response = await window.electronAPI.upload.suggestCovers(sourcePath, type);
        if (cancelled) return;
        if (!response.success || !response.data) return;

        setSuggestCovers(response.data);

        const pick = response.data.find((c: SuggestedCover) => c.recommended);
        const canReplace = !valueRef.current || sourceRef.current === 'suggestion';
        if (pick && canReplace) {
          sourceRef.current = 'suggestion';
          onChangeRef.current(pick.path);
        }
      } catch {
        // sugestão é opcional: se falhar, a faixa simplesmente não aparece
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
          sourceRef.current = 'manual';
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
          {suggestCovers.map((cover) => (
            <img
              key={cover.path}
              src={cover.url}
              alt={`Sugestão de capa: pág. ${cover.page + 1}`}
              onClick={(e) => {
                e.stopPropagation();
                sourceRef.current = 'suggestion';
                field.onChange(cover.path);
              }}
              style={{
                width: 80,
                height: 120,
                cursor: 'pointer',
                objectFit: 'cover',
                outline: field.value === cover.path ? '2px solid #8e5fc9' : 'none',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
