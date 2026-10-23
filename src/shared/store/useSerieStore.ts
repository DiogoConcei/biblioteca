import { create } from 'zustand';
import { TieIn } from '../../../electron/types/comic.interfaces';

import {
  Literatures,
  LiteratureChapter,
  LiteratureChapterAttributes,
  LiteraturesAttributes,
} from '../../../electron/types/electron-auxiliar.interfaces';
import { useUIStore } from './useUIStore';

export type StoreSerie = Omit<Literatures, 'chapters'> | Omit<TieIn, 'chapters'>;

interface UseSerieStore {
  serie: StoreSerie | null;
  chapters: LiteratureChapter[];

  fetchSerie: (serieName: string, literatureForm: string) => Promise<void>;
  setSerie: (serie: Literatures | TieIn | null) => void;
  setChapters: (chapters: LiteratureChapter[]) => void;

  updateSerie: (path: string, newValue: LiteraturesAttributes) => void;
  updateChapter: (
    id: number,
    path: string,
    newValue: LiteratureChapterAttributes,
  ) => void;
  clearSerie: () => void;
}

let latestRequest = 0;

const useSerieStore = create<UseSerieStore>((set, get) => ({
  serie: null,
  chapters: [],

  setChapters: (new_chapters: LiteratureChapter[]) => {
    set({ chapters: new_chapters });
  },

  setSerie: (serie) => {
    if (!serie) {
      set({ serie: null, chapters: [] });
      return;
    }
    const { chapters, ...rest } = serie;
    set({ serie: rest as StoreSerie, chapters: chapters ?? [] });
  },

  fetchSerie: async (serieName, literatureForm) => {
    const { controlFetching } = useUIStore.getState();
    const requestId = ++latestRequest;

    try {
      controlFetching(true, null);

      const response = await window.electronAPI.series.getSerie(
        serieName,
        literatureForm,
      );
      if (requestId !== latestRequest) return;

      if (!response.success || !response.data)
        throw new Error(response.error || 'Erro ao buscar série');

      get().setSerie(response.data); // reaproveita setSerie (precisa de `get` no create)
      controlFetching(false, null);
    } catch (e) {
      if (requestId !== latestRequest) return;
      set({ serie: null, chapters: [] });
      controlFetching(false, (e as Error).message);
    }
  },

  clearSerie: () => set({ serie: null, chapters: [] }),

  updateSerie: (path, newValue) => {
    set((state) => {
      if (!state.serie) return {};
      const keys = path.split('.');
      const updated = { ...state.serie } as Record<string, unknown>;
      let cursor = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        const next = cursor[keys[i]];
        cursor[keys[i]] = Array.isArray(next)
          ? [...next]
          : next && typeof next === 'object'
            ? { ...next }
            : {};
        cursor = cursor[keys[i]] as Record<string, unknown>;
      }
      cursor[keys[keys.length - 1]] = newValue;
      return { serie: updated as StoreSerie };
    });
  },

  updateChapter: (id, path, newValue) => {
    set((state) => {
      const index = state.chapters.findIndex((ch) => ch.id === id);
      if (index === -1) return state; // id inexistente: não altera nada

      const keys = path.split('.');
      const chapter = { ...state.chapters[index] } as Record<string, unknown>;
      let cursor = chapter;
      for (let i = 0; i < keys.length - 1; i++) {
        const next = cursor[keys[i]];
        cursor[keys[i]] = Array.isArray(next)
          ? [...next]
          : next && typeof next === 'object'
            ? { ...next }
            : {};
        cursor = cursor[keys[i]] as Record<string, unknown>;
      }
      cursor[keys[keys.length - 1]] = newValue;

      const chapters = [...state.chapters];
      chapters[index] = chapter as unknown as LiteratureChapter;
      return { chapters };
    });
  },
}));

export default useSerieStore;
