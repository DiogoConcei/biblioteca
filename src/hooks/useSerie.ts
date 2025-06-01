import { useEffect } from 'react';

import { useSerieStore } from '../store/seriesStore';
import {
  Literatures,
  LiteraturesAttributes,
  LiteratureChapterAttributes,
} from '../types/series.interfaces';

interface UseSerieResult {
  serie: Literatures | null;
  updateSerie: (path: string, newValue: LiteraturesAttributes) => void;
  updateChapter: (index: number, path: string, newValue: LiteratureChapterAttributes) => void;
}

export default function useSerie(serieName: string): UseSerieResult {
  const serie = useSerieStore(state => state.serie) as Literatures | null;
  const setError = useSerieStore(state => state.setError);
  const setSerie = useSerieStore(state => state.setSerie);
  const fetchManga = useSerieStore(state => state.fetchManga);
  const resetStates = useSerieStore(state => state.resetStates);

  useEffect(() => {
    async function getManga(serieName: string) {
      if (!serieName) return;

      const response = await fetchManga(serieName);

      if (!response) {
        setError('Série não encontrada ou erro ao buscar série.');
        return;
      }

      const manga = response;

      setSerie(manga);
    }

    getManga(serieName);

    return () => {
      resetStates();
    };
  }, [fetchManga, serieName, resetStates, setError, setSerie]);

  function updateSerie(path: string, newValue: LiteraturesAttributes) {
    useSerieStore.setState(state => {
      const current = state.serie;
      if (!current) return {};

      const updated = structuredClone(current);
      const keys = path.split('.');

      let cursor: unknown = updated;

      for (let i = 0; i < keys.length - 1; i++) {
        if (typeof cursor !== 'object' || cursor === null) return {};

        const key = keys[i];

        if (!(key in cursor)) return {};

        cursor = (cursor as Record<string, unknown>)[key];
      }

      if (typeof cursor !== 'object' || cursor === null) return {};

      const lastKey = keys[keys.length - 1];
      if (!(lastKey in cursor)) return {};

      if (!(lastKey in cursor)) return {};

      const currentValue = (cursor as Record<string, unknown>)[lastKey];

      const isPrimitive =
        typeof currentValue === 'string' ||
        typeof currentValue === 'number' ||
        typeof currentValue === 'boolean';

      if (!isPrimitive) return {};

      (cursor as Record<string, unknown>)[lastKey] = newValue;

      return { serie: updated };
    });
  }

  function updateChapter(index: number, path: string, newValue: LiteratureChapterAttributes) {
    useSerieStore.setState(state => {
      const current = state.serie;
      if (!current || !Array.isArray(current.chapters)) return {};

      if (index < 0 || index >= current.chapters.length) return {};

      const updated = structuredClone(current);
      if (!updated.chapters || !Array.isArray(updated.chapters)) return {};
      const chapter = updated.chapters[index];
      if (!chapter) return {};

      const keys = path.split('.');

      let cursor = chapter as unknown as Record<string, unknown>;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        const next = cursor[key];
        if (typeof next !== 'object' || next === null) return {};
        cursor = next as Record<string, unknown>;
      }

      const lastKey = keys[keys.length - 1];
      const currentValue = cursor[lastKey];

      const isPrimitive =
        typeof currentValue === 'string' ||
        typeof currentValue === 'number' ||
        typeof currentValue === 'boolean';

      if (!isPrimitive) return {};

      cursor[lastKey] = newValue;

      return { serie: updated };
    });
  }

  return {
    serie,
    updateSerie,
    updateChapter,
  };
}
