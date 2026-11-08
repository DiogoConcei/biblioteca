import { useEffect, useRef, useState } from 'react';
import { useController, Control, FieldValues, Path } from 'react-hook-form';
import { ImagePlus, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [carouselIndex, setCarouselIndex] = useState(0);
  const { field, fieldState } = useController({ name, control });

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
    setCarouselIndex(0);
    if (!sourcePath || !type || type === LiteratureForm.BOOK) return;

    let cancelled = false;

    (async () => {
      try {
        const response = await window.electronAPI.upload.suggestCovers(sourcePath, type);
        if (cancelled) return;
        if (!response.success || !response.data) return;

        setSuggestCovers(response.data);

        const recommendedIndex = response.data.findIndex(
          (c: SuggestedCover) => c.recommended,
        );
        const pick = response.data[recommendedIndex];

        if (recommendedIndex !== -1) {
          setCarouselIndex(recommendedIndex);
        }

        const canReplace = !valueRef.current || sourceRef.current === 'suggestion';
        if (pick && canReplace) {
          sourceRef.current = 'suggestion';
          onChangeRef.current(pick.path);
        }
      } catch {
        // Falha ignorada
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sourcePath, type]);

  // NOVA FUNÇÃO: Centraliza a troca do índice do carrossel E a atualização do form
  const handleSelectSuggestion = (newIndex: number) => {
    setCarouselIndex(newIndex);
    const selectedCover = suggestCovers[newIndex];
    if (selectedCover) {
      sourceRef.current = 'suggestion';
      field.onChange(selectedCover.path); // Isso faz a capa principal mudar instantaneamente
    }
  };

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
      {/* Remove o conditional rendering agressivo e deixa o container manter o espaço */}
      <div
        className={styles.carouselContainer}
        style={{
          opacity: suggestCovers.length > 0 ? 1 : 0,
          pointerEvents: suggestCovers.length > 0 ? 'auto' : 'none',
        }}
      >
        {suggestCovers.length > 0 && (
          <>
            <button
              type="button"
              className={styles.carouselArrow}
              disabled={carouselIndex === 0}
              onClick={() => handleSelectSuggestion(Math.max(0, carouselIndex - 1))}
            >
              <ChevronLeft size={24} />
            </button>

            <div className={styles.carouselWindow}>
              {suggestCovers.map((cover, index) => {
                const distance = Math.abs(index - carouselIndex);
                if (distance > 1) return null;

                const isCenter = distance === 0;

                return (
                  <img
                    key={cover.path}
                    src={cover.url}
                    alt={`Sugestão de capa: pág. ${cover.page + 1}`}
                    className={`${styles.carouselItem} ${isCenter ? styles.center : styles.side}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectSuggestion(index);
                    }}
                  />
                );
              })}
            </div>

            <button
              type="button"
              className={styles.carouselArrow}
              disabled={carouselIndex === suggestCovers.length - 1}
              onClick={() =>
                handleSelectSuggestion(
                  Math.min(suggestCovers.length - 1, carouselIndex + 1),
                )
              }
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>{' '}
    </div>
  );
}
