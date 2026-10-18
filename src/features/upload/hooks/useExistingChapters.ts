import { useState, useEffect, useCallback } from 'react';
import { ExistingChapterItem } from '../types/upload.interfaces';
import { graphChapter } from '../../../../electron/types/electron-auxiliar.interfaces';

export default function useExistingChapters(serieId: number) {
  const [existingItems, setExistingItems] = useState<ExistingChapterItem[]>([]);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    setExistingItems([]);
    setLoadError(false);

    if (!serieId) {
      setIsLoadingExisting(false);
      return;
    }

    let cancelled = false;
    setIsLoadingExisting(true);

    (async () => {
      try {
        const response = await window.electronAPI.chapters.getBySerie(serieId);
        const data = response.data as graphChapter[];
        if (cancelled) return;

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Erro ao buscar capítulos');
        }

        setExistingItems(
          data.map((c) => ({
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
    })();

    return () => {
      cancelled = true;
    };
  }, [serieId, reloadToken]);

  return { existingItems, isLoadingExisting, loadError, refetch };
}
