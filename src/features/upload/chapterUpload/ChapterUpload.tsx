import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Loading from '@/shared/components/Loading/Loading';
import useAllSeries from '@/shared/hooks/useAllSeries';
import { useUploadStore } from '../store/uploadStore';

import styles from './ChapterUpload.module.scss';

interface ExistingChapterItem {
  key: string;
  kind: 'existing';
  label: string;
  order: number;
  chapterId: number;
}

interface NewChapterItem {
  key: string;
  kind: 'new';
  label: string;
  order: number;
  sourcePath: string;
}

type ChapterListItem = ExistingChapterItem | NewChapterItem;

// Mesma fórmula de bissecção usada no backend pro campo `order` dos capítulos
// (ver Fase 1) — duplicada aqui de propósito pro prazo de hoje; idealmente
// deveria virar um util compartilhado entre frontend e electron amanhã.
function computeOrder(prev?: number, next?: number): number {
  if (prev === undefined) return next !== undefined ? next - 1 : 1;
  if (next === undefined) return prev + 1;
  return (prev + next) / 2;
}

export default function ChapterUpload() {
  const navigate = useNavigate();
  const consumeChapters = useUploadStore((s) => s.consumeChapters);
  const allSeries = useAllSeries();

  const [newItems, setNewItems] = useState<NewChapterItem[]>([]);
  const [existingItems, setExistingItems] = useState<ExistingChapterItem[]>([]);
  const [selectedSerieId, setSelectedSerieId] = useState<number | null>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggedKey, setDraggedKey] = useState<string | null>(null);

  // Roda só na montagem — não reage a mudanças futuras da store, porque o
  // próprio submit desta tela vai consumir a store (consumeChapters), e se
  // esse effect estivesse inscrito nela, ia tentar redirecionar de novo no
  // meio do fluxo de sucesso.
  useEffect(() => {
    const pendingChapters = useUploadStore.getState().pendingChapters;

    if (pendingChapters.length === 0) {
      navigate('/', { replace: true });
      return;
    }

    setNewItems(
      pendingChapters.map((chapter, idx) => ({
        key: `new-${chapter.oldPath}`,
        kind: 'new',
        label: chapter.name,
        order: idx + 1, // provisório — recalculado de verdade quando a série for escolhida
        sourcePath: chapter.oldPath,
      })),
    );
  }, [navigate]);

  // Busca os capítulos já existentes da série assim que ela é selecionada.
  useEffect(() => {
    if (selectedSerieId === null) {
      setExistingItems([]);
      return;
    }

    let cancelled = false;
    setIsLoadingExisting(true);

    // 1. Declaramos a função assíncrona dentro do useEffect
    const fetchChapters = async () => {
      try {
        const response = await window.electronAPI.chapters.getBySerie(selectedSerieId);
        console.log(response);
        // Se o componente desmontou ou o ID mudou enquanto a promise resolvia, aborta.
        if (cancelled) return;

        if (!response.success || !response.data) {
          console.error('Erro:', response.error);
          return;
        }

        setExistingItems(
          response.data.map((c) => ({
            key: `existing-${c.id}`,
            kind: 'existing' as const,
            label: c.name,
            order: c.order,
            chapterId: c.id,
          })),
        );
      } catch (err) {
        if (cancelled) return; // Evita logar erros de requisições que foram "canceladas"
        console.error('Erro fatal:', err);
      } finally {
        if (!cancelled) {
          setIsLoadingExisting(false);
        }
      }
    };

    // 2. Invocamos a função imediatamente
    fetchChapters();

    // 3. Função de limpeza (cleanup)
    return () => {
      cancelled = true;
    };
  }, [selectedSerieId]);
  const mergedSorted: ChapterListItem[] = useMemo(() => {
    return [...existingItems, ...newItems].sort((a, b) => a.order - b.order);
  }, [existingItems, newItems]);

  const updateNewOrder = (key: string, newOrder: number) => {
    setNewItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, order: newOrder } : item)),
    );
  };

  const updateNewLabel = (key: string, label: string) => {
    setNewItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, label } : item)),
    );
  };

  const moveItem = (key: string, direction: 'up' | 'down') => {
    const index = mergedSorted.findIndex((item) => item.key === key);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= mergedSorted.length) return;

    // Vizinhos considerados na nova posição, excluindo o próprio item
    const withoutSelf = mergedSorted.filter((item) => item.key !== key);
    const insertAt = direction === 'up' ? targetIndex : targetIndex - 1;

    const prevOrder = withoutSelf[insertAt - 1]?.order;
    const nextOrder = withoutSelf[insertAt]?.order;

    updateNewOrder(key, computeOrder(prevOrder, nextOrder));
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

    const prevOrder = withoutDragged[targetIndex - 1]?.order;
    const nextOrder = withoutDragged[targetIndex]?.order;

    updateNewOrder(draggedKey, computeOrder(prevOrder, nextOrder));
    setDraggedKey(null);
  };

  const handleSubmit = async () => {
    if (!selectedSerieId || newItems.length === 0) return;

    setIsSubmitting(true);
    try {
      const payload = newItems.map((item) => ({
        serieId: selectedSerieId,
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
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return <Loading />;
  }

  return (
    <article className={styles['chapter-upload']}>
      <section className={styles['serie-picker-section']}>
        <h2 className={styles['section-title']}>Selecione a série</h2>

        <div className={styles['serie-picker-grid']}>
          {allSeries?.map((serie) => (
            <button
              key={serie.id}
              type="button"
              className={`${styles['serie-card']} ${
                selectedSerieId === serie.id ? styles['serie-card-active'] : ''
              }`}
              onClick={() => setSelectedSerieId(serie.id)}
            >
              <div className={styles['serie-cover-wrapper']}>
                <img
                  src={serie.coverImage}
                  alt={`Capa de ${serie.name}`}
                  className={styles['serie-cover']}
                />
              </div>
              <span className={styles['serie-name']}>{serie.name}</span>
            </button>
          ))}

          {(!allSeries || allSeries.length === 0) && (
            <p className={styles['empty-state']}>Nenhuma série encontrada.</p>
          )}
        </div>
      </section>

      {selectedSerieId && (
        <section className={styles['chapter-list-section']}>
          <h2 className={styles['section-title']}>Ordem dos capítulos</h2>

          {isLoadingExisting ? (
            <p className={styles['empty-state']}>Carregando capítulos existentes...</p>
          ) : (
            <ul className={styles['chapter-list']}>
              {mergedSorted.map((item) => (
                <li
                  key={item.key}
                  className={`${styles['chapter-row']} ${
                    item.kind === 'new'
                      ? styles['chapter-row-new']
                      : styles['chapter-row-existing']
                  }`}
                  draggable={item.kind === 'new'}
                  onDragStart={() => setDraggedKey(item.key)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDropOnItem(item.key)}
                >
                  <span className={styles['drag-handle']}>
                    {item.kind === 'new' ? '⠿' : ''}
                  </span>

                  {item.kind === 'new' ? (
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => updateNewLabel(item.key, e.target.value)}
                      className={styles['chapter-name-input']}
                    />
                  ) : (
                    <span className={styles['chapter-name-readonly']}>{item.label}</span>
                  )}

                  {item.kind === 'new' && (
                    <div className={styles['order-controls']}>
                      <button
                        type="button"
                        onClick={() => moveItem(item.key, 'up')}
                        className={styles['order-button']}
                        aria-label="Mover para cima"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(item.key, 'down')}
                        className={styles['order-button']}
                        aria-label="Mover para baixo"
                      >
                        ↓
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={newItems.length === 0}
            className={styles['submit-button']}
          >
            Salvar capítulos
          </button>
        </section>
      )}
    </article>
  );
}
