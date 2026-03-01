import { create } from 'zustand';

import { TieIn } from 'electron/types/comic.interfaces';

import {
  Literatures,
  LiteratureChapter,
  LiteratureChapterAttributes,
  LiteraturesAttributes,
  APIResponse,
} from '../../electron/types/electron-auxiliar.interfaces';
import { useUIStore } from './useUIStore';

interface UseSerieStore {
  serie: Literatures | TieIn | null;
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

const useSerieStore = create<UseSerieStore>((set) => ({
  serie: null,
  chapters: [],

  setChapters: (new_chapters: LiteratureChapter[]) => {
    set({ chapters: new_chapters });
  },

  setSerie: (serie) => {
    set({ serie, chapters: serie?.chapters ?? [] });
  },

  fetchSerie: async (serieName, literatureForm) => {
    const { controlFetching } = useUIStore.getState();

    try {
      controlFetching(true, null);
      let response: APIResponse<Literatures | TieIn | null>;
      switch (literatureForm) {
        case 'Manga':
          response = await window.electronAPI.series.getManga(serieName);
          break;
        case 'Quadrinho':
          response = await window.electronAPI.series.getComic(serieName);
          break;
        case 'childSeries':
          response = await window.electronAPI.series.getTieIn(serieName);
          break;
        default:
          throw new Error('Tipo de literatura desconhecido');
      }

      if (!response.success || !response.data)
        throw new Error(response.error || 'Erro ao buscar série');

      set({ serie: response.data, chapters: response.data.chapters });
    } catch (e) {
      controlFetching(false, (e as Error).message);
    } finally {
      controlFetching(false, null);
    }
  },

  clearSerie: () => set({ serie: null, chapters: [] }),

  updateSerie: (path, newValue) => {
    set((state) => {
      if (!state.serie) return {};
      const updated = { ...state.serie };
      const keys = path.split('.');
      let cursor: Record<string, unknown> = updated;
      for (let i = 0; i < keys.length - 1; i++) cursor = cursor[keys[i]] as Record<string, unknown>;
      cursor[keys.at(-1)!] = newValue;
      return { serie: updated };
    });
  },

  updateChapter: (idOrIndex: number | string, path: string, newValue: unknown) => {
    set((state) => {
      const idNum = Number(idOrIndex);

      let index = state.chapters.findIndex((ch) => ch.id === idNum);

      if (
        index === -1 &&
        Number.isInteger(idNum) &&
        idNum >= 0 &&
        idNum < state.chapters.length
      ) {
        index = idNum;
      }

      if (index === -1) {
        return state;
      }

      const updatedChapters = [...state.chapters];
      const originalChapter = updatedChapters[index];

      const keys = path.split('.');

      const chapter = { ...originalChapter };
      let cursor: Record<string, unknown> = chapter;

      if (keys.length === 1) {
        cursor[keys[0]] = newValue;
      } else {
        for (let i = 0; i < keys.length - 1; i++) {
          const k = keys[i];
          const next = cursor[k];
          cursor[k] = next && typeof next === 'object' ? { ...next } : {};
          cursor = cursor[k] as Record<string, unknown>;
        }

        const lastKey = keys[keys.length - 1];
        cursor[lastKey] = newValue;
      }

      updatedChapters[index] = chapter;

      return { chapters: updatedChapters };
    });
  },
}));

export default useSerieStore;
