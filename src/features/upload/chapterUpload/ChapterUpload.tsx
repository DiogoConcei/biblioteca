import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers } from 'lucide-react';
import TextInput from '@/shared/components/TextInput/TextInput';
import useAllSeries from '@/shared/hooks/useAllSeries';
import { useAllSeriesStore } from '@/shared/store/useAllSeriesStore';
import Loading from '@/shared/components/Loading/Loading';
import SearchBar from '@/features/hub/components/SearchBar/SearchBar';
import { viewData } from '../../../../electron/types/electron-auxiliar.interfaces';
import { useUploadStore } from '../store/uploadStore';
import useChapterUploadForm from '../hooks/useChapterUploadForm';

import styles from './ChapterUpload.module.scss';

export default function ChapterUpload() {
  const navigate = useNavigate();
  const series = useAllSeries();

  // Snapshot único da fila: não reage a limpezas futuras da store.
  const [initial] = useState(() => useUploadStore.getState().pendingChapters);
  const clearChapters = useUploadStore((s) => s.consumeChapters);
  const [selectedSerie, setSelectedSerie] = useState<viewData | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    key: string;
    position: 'before' | 'after';
  } | null>(null);

  const emptyDragImage = useRef<HTMLImageElement | null>(null);

  if (!emptyDragImage.current) {
    const img = new Image();
    img.src =
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    emptyDragImage.current = img;
  }

  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});

  const {
    form: {
      register,
      formState: { errors },
    },
    isLoadingExisting,
    loadError,
    mergedSorted,
    focusedKey,
    currentNewIndex,
    setCurrentNewIndex,
    newItemCount,
    prevFocus,
    nextFocus,
    positionDraft,
    setPositionDraft,
    commitPosition,
    selectSerie,
    moveItem,
    moveRelativeTo,
    submit,
    isSubmitting,
    serverError,
  } = useChapterUploadForm(initial, {
    onSuccess: () => {
      const store = useUploadStore.getState();
      store.consumeChapters();
      useAllSeriesStore.getState().fetchAllSeries();
      navigate(store.pendingSeries.length > 0 ? '/local-upload/serie' : '/');
    },
  });

  useEffect(() => {
    return () => {
      clearChapters();
    };
  }, []);

  // Fila vazia (ex.: F5 na tela): volta pra home.
  useEffect(() => {
    if (initial.length === 0) {
      navigate('/', { replace: true });
    }
  }, [initial, navigate]);

  // Mantém o item em foco visível conforme ele muda de posição na lista.
  useEffect(() => {
    if (!focusedKey) return;
    itemRefs.current[focusedKey]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusedKey, mergedSorted]);

  const filteredSeries = useMemo(() => {
    if (!series) return [];
    const termoMinusculo = searchInput.toLowerCase().replace(/\s+/g, '');
    return series.filter((serie) => {
      const nomeMinusculo = serie.name.toLowerCase().replace(/\s+/g, '');
      return nomeMinusculo.includes(termoMinusculo);
    });
  }, [series, searchInput]);

  const handleSelectSerie = (serie: viewData) => {
    setSelectedSerie(serie);
    selectSerie(serie.id);
  };

  const handleDeselect = () => {
    setSelectedSerie(null);
    selectSerie(null);
  };

  const resetDrag = () => {
    setDraggedKey(null);
    setDropTarget(null);
  };

  const handleDrop = () => {
    if (draggedKey && dropTarget) {
      moveRelativeTo(draggedKey, dropTarget.key, dropTarget.position);
    }
    resetDrag();
  };

  const handleDragOverItem = (e: React.DragEvent<HTMLLIElement>, itemKey: string) => {
    e.preventDefault();
    if (!draggedKey) return;

    if (itemKey === draggedKey) {
      setDropTarget((prev) => (prev ? null : prev));
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const position = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';

    // Devolve o mesmo objeto se nada mudou: o React ignora o update.
    setDropTarget((prev) =>
      prev?.key === itemKey && prev.position === position
        ? prev
        : { key: itemKey, position },
    );
  };

  if (initial.length === 0 || isSubmitting || !series) return <Loading />;

  return (
    <article className={styles.container}>
      <header className={styles.header}>
        <Layers size={36} />
        <div className={styles['header-content']}>
          <h1>Upload de Capítulos</h1>
          <p>
            Você tem <strong>{initial.length}</strong> arquivos pendentes. Escolha a série
            de destino.
          </p>
        </div>
      </header>

      <motion.div
        layout
        className={`${styles.mainContent} ${selectedSerie ? styles.hasSelection : ''}`}
      >
        <AnimatePresence mode="popLayout">
          {selectedSerie && (
            <motion.div
              className={styles.focusPanel}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30, transition: { duration: 0.2 } }}
            >
              <div className={styles.heroSection}>
                <motion.figure
                  layoutId={`cover-${selectedSerie.id}`}
                  className={styles.heroCover}
                  onClick={handleDeselect}
                >
                  <img src={selectedSerie.coverImage} alt={selectedSerie.name} />
                </motion.figure>

                <motion.h2 layoutId={`title-${selectedSerie.id}`}>
                  {selectedSerie.name}
                </motion.h2>
              </div>

              <motion.form
                onSubmit={submit}
                className={styles.formSection}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
              >
                {newItemCount > 0 && (
                  <div className={styles.focusedChapterFields}>
                    {newItemCount > 1 && (
                      <div className={styles.navRow}>
                        <button
                          type="button"
                          onClick={prevFocus}
                          disabled={currentNewIndex === 0}
                          className={styles.navButton}
                        >
                          ‹ Anterior
                        </button>
                        <span className={styles.navCounter}>
                          {currentNewIndex + 1} / {newItemCount}
                        </span>
                        <button
                          type="button"
                          onClick={nextFocus}
                          disabled={currentNewIndex === newItemCount - 1}
                          className={styles.navButton}
                        >
                          Próximo ›
                        </button>
                      </div>
                    )}

                    <TextInput
                      register={register(`chapters.${currentNewIndex}.label` as const)}
                      error={errors.chapters?.[currentNewIndex]?.label}
                      msg="Nome do capítulo"
                    />

                    <div className={styles.positionField}>
                      <label className={styles.positionLabel}>Número do capítulo</label>
                      <input
                        type="number"
                        min={1}
                        max={mergedSorted.length}
                        value={positionDraft}
                        onChange={(e) => setPositionDraft(e.target.value)}
                        onBlur={commitPosition}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            commitPosition();
                          }
                        }}
                        className={styles.positionInput}
                      />
                    </div>
                  </div>
                )}

                {errors.serieId && (
                  <p className={styles.warningText}>{errors.serieId.message}</p>
                )}
                {errors.chapters?.message && (
                  <p className={styles.warningText}>{errors.chapters.message}</p>
                )}

                {/* --- CONTAINER COM ROLAGEM INDEPENDENTE --- */}
                <div className={styles.listContainer}>
                  {isLoadingExisting ? (
                    <p className={styles.emptyState}>
                      Carregando capítulos existentes...
                    </p>
                  ) : loadError ? (
                    <p className={styles.warningText}>
                      Não foi possível carregar os capítulos existentes dessa série.
                    </p>
                  ) : (
                    <ul className={styles.chapterList}>
                      {mergedSorted.map((item) => {
                        const isFocused =
                          item.kind === 'new' && item.formIndex === currentNewIndex;
                        const isDragging = draggedKey === item.key;
                        const dropPosition =
                          dropTarget?.key === item.key ? dropTarget.position : null;

                        const rowClass = [
                          styles.chapterRow,
                          item.kind === 'new'
                            ? styles.chapterRowNew
                            : styles.chapterRowExisting,
                          isFocused && styles.chapterRowFocused,
                          isDragging && styles.chapterRowDragging,
                          dropPosition === 'before' && styles.dropBefore,
                          dropPosition === 'after' && styles.dropAfter,
                        ]
                          .filter(Boolean)
                          .join(' ');

                        return (
                          <li
                            key={item.key}
                            ref={(el) => {
                              itemRefs.current[item.key] = el;
                            }}
                            className={rowClass}
                            draggable={item.kind === 'new'}
                            onDragStart={(e) => {
                              e.dataTransfer.effectAllowed = 'move';
                              e.dataTransfer.setData('text/plain', item.key);
                              if (emptyDragImage.current) {
                                e.dataTransfer.setDragImage(emptyDragImage.current, 0, 0);
                              }
                              setDraggedKey(item.key);
                            }}
                            onDragOver={(e) => handleDragOverItem(e, item.key)}
                            onDrop={(e) => {
                              e.preventDefault();
                              handleDrop();
                            }}
                            onDragEnd={resetDrag}
                            onClick={() => {
                              if (item.kind === 'new') setCurrentNewIndex(item.formIndex);
                            }}
                          >
                            <span className={styles.dragHandle}>
                              {item.kind === 'new' ? '⠿' : ''}
                            </span>

                            <span className={styles.chapterNameReadonly}>
                              {item.label}
                            </span>

                            {item.kind === 'new' && (
                              <div className={styles.orderControls}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveItem(item.key, 'up');
                                  }}
                                  className={styles.orderButton}
                                  aria-label="Mover para cima"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveItem(item.key, 'down');
                                  }}
                                  className={styles.orderButton}
                                  aria-label="Mover para baixo"
                                >
                                  ↓
                                </button>
                              </div>
                            )}
                          </li>
                        );
                      })}
                      {mergedSorted.length === 0 && (
                        <li className={styles.emptyState}>
                          Nenhum capítulo nesta série ainda.
                        </li>
                      )}
                    </ul>
                  )}
                </div>
                {/* --- FIM DO CONTAINER --- */}

                {serverError && <p className={styles.warningText}>{serverError}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting || newItemCount === 0}
                  className={styles.submitButton}
                >
                  {isSubmitting ? 'Enviando...' : 'Salvar capítulos'}
                </button>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.section layout className={styles.gridPanel}>
          <motion.div layout className={styles.searchWrapper}>
            <SearchBar
              searchInput={searchInput}
              onSearchChange={(e) => setSearchInput(e.target.value)}
            />
          </motion.div>

          <motion.div layout className={styles.grid}>
            {filteredSeries.map((serie) => {
              if (selectedSerie?.id === serie.id) return null;

              return (
                <motion.button
                  layout
                  key={serie.id}
                  className={styles.serieCard}
                  onClick={() => handleSelectSerie(serie)}
                >
                  <motion.figure
                    layoutId={`cover-${serie.id}`}
                    className={styles.coverWrapper}
                  >
                    <img src={serie.coverImage} alt={serie.name} loading="lazy" />
                  </motion.figure>

                  <motion.p layoutId={`title-${serie.id}`} className={styles.serieName}>
                    {serie.name}
                  </motion.p>
                </motion.button>
              );
            })}
          </motion.div>
        </motion.section>
      </motion.div>
    </article>
  );
}
