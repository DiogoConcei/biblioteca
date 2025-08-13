import { useEffect } from 'react';

import { useSerieStore } from '../store/seriesStore';
import {
  Literatures,
  LiteraturesAttributes,
  LiteratureChapterAttributes,
} from '../types/auxiliar.interfaces';
import { TieIn } from 'electron/types/comic.interfaces';

interface UseSerieResult {
  serie: Literatures | TieIn | null;
  updateSerie: (path: string, newValue: LiteraturesAttributes) => void;
  updateChapter: (
    id: number,
    path: string,
    newValue: LiteratureChapterAttributes,
  ) => void;
}

export default function useSerie(
  serieName?: string,
  literatureForm?: string,
): UseSerieResult {
  const serie = useSerieStore((state) => state.serie) as Literatures | null;
  const setError = useSerieStore((state) => state.setError);
  const setSerie = useSerieStore((state) => state.setSerie);
  const fetchSerie = useSerieStore((state) => state.fetchSerie);

  useEffect(() => {
    let isActive = true;
    async function getSerie(name: string, typeL: string) {
      if (!name) return;

      if (!typeL) return;

      const response = await fetchSerie(name, typeL);
      console.log('Retorno da store: ', response);
      if (!isActive) return;

      if (!response) {
        setError('Série não encontrada ou erro ao buscar série.');
        return;
      }

      setSerie(response as Literatures);
    }

    getSerie(serieName!, literatureForm!);
  }, [fetchSerie, serieName, setError, setSerie]);

  function updateSerie(path: string, newValue: LiteraturesAttributes) {
    useSerieStore.setState((state) => {
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

  function updateChapter(
    id: number,
    path: string,
    newValue: LiteratureChapterAttributes,
  ) {
    useSerieStore.setState((state) => {
      const current = state.serie;

      if (!current || !Array.isArray(current.chapters)) return {};

      const index = current.chapters.findIndex((ch) => ch.id === id);
      if (index === -1) return {};

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
