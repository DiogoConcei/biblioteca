import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { computeOrder } from '../utils/chapter';
import TextInput from '@/shared/components/TextInput/TextInput';
import useAllSeries from '@/shared/hooks/useAllSeries';
import Loading from '@/shared/components/Loading/Loading';
import SearchBar from '@/features/hub/components/SearchBar/SearchBar';
import {
  APIResponse,
  graphChapter,
  viewData,
} from '../../../../electron/types/electron-auxiliar.interfaces';
import { useUploadStore } from '../store/uploadStore';
import { ExistingChapterItem, DisplayChapterItem } from '../types/upload.interfaces';
import {
  chapterUploadSchema,
  type ChapterUploadFormValues,
} from '../schemas/chapterUpload.schema';

import styles from './ChapterUpload.module.scss';

export default function ChapterUpload() {
  const navigate = useNavigate();
  const series = useAllSeries();

  const pendingChapters = useUploadStore((s) => s.pendingChapters);
  const consumeChapters = useUploadStore((s) => s.consumeChapters);

  const [selectedSerie, setSelectedSerie] = useState<viewData | null>(null);
  const [searchInput, setSearchInput] = useState('');

  const [existingItems, setExistingItems] = useState<ExistingChapterItem[]>([]);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [draggedKey, setDraggedKey] = useState<string | null>(null);

  const [currentNewIndex, setCurrentNewIndex] = useState(0);
  const [positionDraft, setPositionDraft] = useState('1');

  const hasInitialized = useRef(false);
  const listRef = useRef<HTMLUListElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});

  const {
    control,
    register,
    setValue,
    getValues,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChapterUploadFormValues>({
    resolver: zodResolver(chapterUploadSchema),
    defaultValues: { serieId: 0, chapters: [] },
    mode: 'onChange',
  });

  const watchedChapters = useWatch({ control, name: 'chapters' });

  useEffect(() => {
    if (pendingChapters.length === 0) {
      navigate('/', { replace: true });
    }
  }, [pendingChapters, navigate]);

  useEffect(() => {
    if (hasInitialized.current || pendingChapters.length === 0) return;
    hasInitialized.current = true;

    reset({
      serieId: getValues('serieId'),
      chapters: pendingChapters.map((chapter, idx) => ({
        key: `new-${chapter.oldPath}`,
        label: chapter.name,
        order: idx + 1,
        sourcePath: chapter.oldPath,
      })),
    });
  }, [pendingChapters, reset, getValues]);

  useEffect(() => {
    if (!selectedSerie) {
      setExistingItems([]);
      setLoadError(false);
      return;
    }

    let cancelled = false;
    setIsLoadingExisting(true);
    setLoadError(false);

    async function fetchChapters() {
      try {
        if (!selectedSerie) return;

        const response: APIResponse<graphChapter[]> =
          await window.electronAPI.chapters.getBySerie(selectedSerie.id);

        const existing = response.data;
        if (cancelled || !existing) return;

        setExistingItems(
          existing.map((c) => ({
            key: `existing-${c.id}`,
            kind: 'existing' as const,
            label: c.name,
            order: c.order,
            chapterId: c.id,
          })),
        );
      } catch (err: unknown) {
        if (cancelled) return;
        console.error('Erro ao buscar capítulos da série:', err);
        setLoadError(true);
      } finally {
        if (!cancelled) setIsLoadingExisting(false);
      }
    }

    fetchChapters();

    return () => {
      cancelled = true;
    };
  }, [selectedSerie]);

  const filteredSeries = useMemo(() => {
    if (!series) return [];
    const termoMinusculo = searchInput.toLowerCase().replace(/\s+/g, '');
    return series.filter((serie) => {
      const nomeMinusculo = serie.name.toLowerCase().replace(/\s+/g, '');
      return nomeMinusculo.includes(termoMinusculo);
    });
  }, [series, searchInput]);

  const newItemKeys = useMemo(
    () => (watchedChapters ?? []).map((c) => c.key),
    [watchedChapters],
  );
  const newItemCount = newItemKeys.length;

  const mergedSorted: DisplayChapterItem[] = useMemo(() => {
    const newDisplay: DisplayChapterItem[] = (watchedChapters ?? []).map((c, index) => ({
      key: c.key,
      kind: 'new' as const,
      label: c.label,
      order: c.order,
      sourcePath: c.sourcePath,
      formIndex: index,
    }));

    return [...existingItems, ...newDisplay].sort((a, b) => a.order - b.order);
  }, [existingItems, watchedChapters]);

  const focusedKey = newItemKeys[currentNewIndex];

  // Reseta o rascunho da posição só quando o CAPÍTULO em foco muda — não a
  // cada reordenação, pra não apagar o que o usuário está digitando.
  useEffect(() => {
    if (!focusedKey) return;
    const pos = mergedSorted.findIndex((item) => item.key === focusedKey) + 1;
    setPositionDraft(String(pos));
  }, [focusedKey]);

  // Mantém o item em foco visível conforme ele muda de posição na lista.
  useEffect(() => {
    if (!focusedKey) return;
    itemRefs.current[focusedKey]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusedKey, mergedSorted]);

  const handleSelectSerie = (serie: viewData) => {
    setSelectedSerie(serie);
    setValue('serieId', serie.id, { shouldValidate: true });
    setCurrentNewIndex(0);
  };

  const applyNewOrder = (key: string, newOrder: number) => {
    const formIndex = getValues('chapters').findIndex((c) => c.key === key);
    if (formIndex === -1) return;
    setValue(`chapters.${formIndex}.order`, newOrder, { shouldDirty: true });
  };

  const moveItem = (key: string, direction: 'up' | 'down') => {
    const index = mergedSorted.findIndex((item) => item.key === key);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= mergedSorted.length) return;

    const withoutSelf = mergedSorted.filter((item) => item.key !== key);
    const insertAt = direction === 'up' ? targetIndex : targetIndex - 1;

    applyNewOrder(
      key,
      computeOrder(withoutSelf[insertAt - 1]?.order, withoutSelf[insertAt]?.order),
    );
  };

  const handleDropOnItem = (targetKey: string) => {
    if (!draggedKey || draggedKey === targetKey) {
      setDraggedKey(null);
      return;
    }

    const withoutDragged = mergedSorted.filter((item) => item.key !== draggedKey);
    const targetIndex = withoutDragged.findIndex((item) => item.key === targetKey);
    if (targetIndex === -1) {
      setDraggedKey(null);
      return;
    }

    applyNewOrder(
      draggedKey,
      computeOrder(
        withoutDragged[targetIndex - 1]?.order,
        withoutDragged[targetIndex]?.order,
      ),
    );
    setDraggedKey(null);
  };

  // Traduz "número do capítulo" (posição 1-based na lista inteira) pro
  // `order` float correspondente, reaproveitando computeOrder.
  const commitPosition = () => {
    if (!focusedKey) return;

    const total = mergedSorted.length;
    let targetPos = parseInt(positionDraft, 10);

    if (Number.isNaN(targetPos)) {
      const current = mergedSorted.findIndex((item) => item.key === focusedKey) + 1;
      setPositionDraft(String(current));
      return;
    }

    targetPos = Math.min(Math.max(targetPos, 1), total);

    const withoutSelf = mergedSorted.filter((item) => item.key !== focusedKey);
    const prevOrder = withoutSelf[targetPos - 2]?.order;
    const nextOrder = withoutSelf[targetPos - 1]?.order;

    applyNewOrder(focusedKey, computeOrder(prevOrder, nextOrder));
    setPositionDraft(String(targetPos));
  };

  const handlePrevFocus = () => setCurrentNewIndex((i) => Math.max(i - 1, 0));
  const handleNextFocus = () =>
    setCurrentNewIndex((i) => Math.min(i + 1, newItemCount - 1));

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload = values.chapters.map((item) => ({
        serieId: values.serieId,
        sourcePath: item.sourcePath,
        label: item.label,
        order: item.order,
      }));

      // ASSUMIDO: nome do método IPC — confirme o nome real no preload.
      // await window.electronAPI.upload.submitChapters(payload);

      consumeChapters();
      navigate('/');
    } catch (error) {
      console.error('Erro ao enviar capítulos:', error);
    }
  });

  if (isSubmitting) return <Loading />;
  if (!series) return <Loading />;

  return (
    <article className={styles.container}>
      <header className={styles.header}>
        <Layers size={36} />
        <div className={styles['header-content']}>
          <h1>Upload de Capítulos</h1>
          <p>
            Você tem <strong>{pendingChapters.length}</strong> arquivos pendentes. Escolha
            a série de destino.
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
                  onClick={() => setSelectedSerie(null)}
                >
                  <img src={selectedSerie.coverImage} alt={selectedSerie.name} />
                </motion.figure>

                <motion.h2 layoutId={`title-${selectedSerie.id}`}>
                  {selectedSerie.name}
                </motion.h2>
              </div>
              <motion.form
                onSubmit={onSubmit}
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
                          onClick={handlePrevFocus}
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
                          onClick={handleNextFocus}
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

                {/* --- AQUI COMEÇA O CONTAINER COM ROLAGEM INDEPENDENTE --- */}
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
                    <ul ref={listRef} className={styles.chapterList}>
                      {mergedSorted.map((item) => {
                        const isFocused =
                          item.kind === 'new' && item.formIndex === currentNewIndex;

                        return (
                          <li
                            key={item.key}
                            ref={(el) => {
                              itemRefs.current[item.key] = el;
                            }}
                            className={`${styles.chapterRow} ${
                              item.kind === 'new'
                                ? styles.chapterRowNew
                                : styles.chapterRowExisting
                            } ${isFocused ? styles.chapterRowFocused : ''}`}
                            draggable={item.kind === 'new'}
                            onDragStart={() => setDraggedKey(item.key)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDropOnItem(item.key)}
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

                <button
                  type="submit"
                  disabled={isSubmitting || newItemCount === 0}
                  className={styles.submitButton}
                >
                  {isSubmitting ? 'Enviando...' : 'Salvar capítulos'}
                </button>
              </motion.form>{' '}
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
