import {
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  LayoutGrid,
  Trash2,
  X,
} from 'lucide-react';

import { FocusedCollectionViewProps } from '../../types/components.interfaces';
import CollectionSeriesCard from '../CollectionsSerieCard/CollectionsSerieCard';
import styles from './CollectionView.module.scss';

export default function CollectionView({
  collection,
  activeIndex,
  onChangeIndex,
  onOpenReader,
  onRemoveFromCollection,
  onReorderSeries,
  onUpdateSerieBackground,
}: FocusedCollectionViewProps) {
  const [showAll, setShowAll] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [fallbackDescriptions, setFallbackDescriptions] = useState<
    Record<number, string>
  >({});
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(
    null,
  );
  const [backgroundPath, setBackgroundPath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const orderedSeries = useMemo(
    () =>
      [...(collection?.series ?? [])].sort(
        (a, b) => (a.position || 0) - (b.position || 0),
      ),
    [collection?.series],
  );

  const safeIndex = orderedSeries.length
    ? ((activeIndex % orderedSeries.length) + orderedSeries.length) %
      orderedSeries.length
    : 0;

  const activeSerie = orderedSeries[safeIndex] ?? null;

  const setIndex = useCallback(
    (next: number, nextDirection: 1 | -1) => {
      if (!orderedSeries.length || !onChangeIndex) return;

      const wrapped =
        ((next % orderedSeries.length) + orderedSeries.length) %
        orderedSeries.length;
      setDirection(nextDirection);
      onChangeIndex(wrapped);
    },
    [onChangeIndex, orderedSeries.length],
  );

  useEffect(() => {
    setBackgroundPreview(null);
    setBackgroundPath(null);
  }, [activeSerie?.id]);

  useEffect(() => {
    const loadMetadata = async () => {
      const missing = orderedSeries.filter(
        (serie) => !serie.description?.trim(),
      );

      for (const serie of missing) {
        const response = await window.electronAPI.collections.fetchMetadata(
          serie.name,
          'manga',
        );

        if (response.success && response.data) {
          setFallbackDescriptions((prev) => ({
            ...prev,
            [serie.id]: response.data!.description,
          }));
        }
      }
    };

    void loadMetadata();
  }, [orderedSeries]);

  const pickImagePath = async () => {
    const bridge = (
      window as Window & {
        electron?: {
          dialog?: { openFile?: () => Promise<string | null> };
        };
      }
    ).electron;

    if (bridge?.dialog?.openFile) {
      const pickedPath = await bridge.dialog.openFile();
      return pickedPath || null;
    }

    const response = await window.electronAPI.system.pickImage();
    return response.success ? (response.data ?? null) : null;
  };

  const onPickBackground = async () => {
    const pickedPath = await pickImagePath();

    if (pickedPath) {
      const dataUrl =
        await window.electronAPI.webUtilities.readFileAsDataUrl(pickedPath);
      setBackgroundPath(pickedPath);
      setBackgroundPreview(dataUrl || null);
      return;
    }

    fileInputRef.current?.click();
  };

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!orderedSeries.length) return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setIndex(safeIndex - 1, -1);
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setIndex(safeIndex + 1, 1);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [safeIndex, orderedSeries.length, setIndex]);

  if (!collection) {
    return (
      <section className={styles.emptyState}>
        <h2>Nenhuma coleção disponível</h2>
      </section>
    );
  }

  if (!orderedSeries.length) {
    return (
      <section className={styles.emptyState}>
        <h2>{collection.name}</h2>
        <p>Essa coleção ainda não possui séries.</p>
      </section>
    );
  }

  const onReorder = async (sourceId: number, targetId: number) => {
    if (!onReorderSeries) return;

    const sourceIndex = orderedSeries.findIndex(
      (serie) => serie.id === sourceId,
    );
    const targetIndex = orderedSeries.findIndex(
      (serie) => serie.id === targetId,
    );
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex)
      return;

    const clone = [...orderedSeries];
    const [moved] = clone.splice(sourceIndex, 1);
    clone.splice(targetIndex, 0, moved);

    await onReorderSeries(
      collection.name,
      clone.map((serie) => serie.id),
    );
  };

  const onCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') setIndex(safeIndex - 1, -1);
    if (event.key === 'ArrowRight') setIndex(safeIndex + 1, 1);
  };

  return (
    <section className={styles.wrapper}>
      <header className={styles.header}>
        <h2>{collection.name}</h2>
        <p>{collection.description || 'Sem descrição da coleção.'}</p>
      </header>

      <button
        className={styles.toggleViewBtn}
        type="button"
        aria-pressed={showAll}
        aria-controls="collection-focus-content"
        onClick={() => setShowAll((prev) => !prev)}
      >
        <LayoutGrid size={16} />
        {showAll ? 'Voltar ao foco' : 'Mostrar todas'}
      </button>

      {showAll ? (
        <div className={styles.grid} id="collection-focus-content" role="list">
          {orderedSeries.map((serie, index) => (
            <CollectionSeriesCard
              key={serie.id}
              serie={serie}
              onDropOnCard={onReorder}
              onActivate={() => onChangeIndex?.(index)}
            />
          ))}
        </div>
      ) : (
        <article
          id="collection-focus-content"
          className={styles.focusedWrapper}
          onKeyDown={onCardKeyDown}
        >
          <button
            className={styles.navButton}
            type="button"
            onClick={() => setIndex(safeIndex - 1, -1)}
            aria-label="Série anterior"
          >
            <ChevronLeft />
          </button>

          <div className={styles.focusedViewport}>
            {activeSerie && (
              <div
                key={activeSerie.id}
                className={`${styles.focusedCard} ${direction > 0 ? styles.slideFromRight : styles.slideFromLeft}`}
                role="group"
                aria-label={`Série ${safeIndex + 1} de ${orderedSeries.length}`}
              >
                <img
                  src={activeSerie.coverImage}
                  alt={`Capa de ${activeSerie.name}`}
                  loading="lazy"
                  className={styles.focusedCover}
                />

                <div className={styles.focusedInfo}>
                  <h2 tabIndex={-1} ref={titleRef}>
                    {activeSerie.name}
                  </h2>
                  <p aria-live="polite">
                    {(
                      activeSerie.description ||
                      fallbackDescriptions[activeSerie.id] ||
                      'Descrição ainda não disponível.'
                    ).slice(0, 1500)}
                  </p>

                  <div className={styles.actions}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className={styles.hiddenInput}
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;

                        const path =
                          window.electronAPI.webUtilities.getPathForFile(file);
                        if (!path) return;

                        const dataUrl =
                          await window.electronAPI.webUtilities.readFileAsDataUrl(
                            path,
                          );

                        setBackgroundPath(path);
                        setBackgroundPreview(dataUrl || null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => onOpenReader(e, activeSerie.id)}
                    >
                      Abrir leitura
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onRemoveFromCollection(collection.name, activeSerie.id)
                      }
                    >
                      <Trash2 size={16} /> Remover da coleção
                    </button>
                    <button type="button" onClick={onPickBackground}>
                      <ImagePlus size={16} /> Editar Background
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await onUpdateSerieBackground?.(
                          collection.name,
                          activeSerie.id,
                          null,
                        );
                      }}
                    >
                      <X size={16} /> Remover background
                    </button>
                  </div>

                  {backgroundPreview && backgroundPath && (
                    <div className={styles.backgroundPreviewBox}>
                      <img src={backgroundPreview} alt="Prévia do background" />
                      <button
                        type="button"
                        onClick={async () => {
                          const updated = await onUpdateSerieBackground?.(
                            collection.name,
                            activeSerie.id,
                            backgroundPath,
                            backgroundPreview,
                          );

                          if (updated) {
                            setBackgroundPreview(null);
                            setBackgroundPath(null);
                          }
                        }}
                      >
                        Confirmar background
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            className={styles.navButton}
            type="button"
            onClick={() => setIndex(safeIndex + 1, 1)}
            aria-label="Próxima série"
          >
            <ChevronRight />
          </button>
        </article>
      )}
    </section>
  );
}
