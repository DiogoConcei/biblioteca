import { create } from 'zustand';

import { Literatures } from '../types/series.interfaces';
import { Manga } from '../../electron/types/manga.interfaces';

interface SeriesState {
  serie: Literatures | null;
  error: string | null;
  loading: boolean;

  setSerie: (newSerie: Literatures | null) => void;
  fetchManga: (serieName: string) => Promise<Manga | null>;
  setError: (error: string | null) => void;

  resetStates: () => void;
}

export const useSerieStore = create<SeriesState>(set => ({
  serie: null,
  error: null,
  loading: true,

  setError: (error: string | null) => set({ error, loading: false }),
  resetStates: () => set({ serie: null, error: null, loading: false }),

  setSerie: (newSerie: Literatures | null) => set({ serie: newSerie }),

  fetchManga: async (serieName: string) => {
    try {
      const response = await window.electronAPI.series.getManga(serieName);

      if (response.success && response.data) {
        set({
          loading: false,
        });

        return response.data as Manga;
      } else {
        set({
          loading: false,
          error: response.error ?? 'Erro inesperado ao buscar série',
        });

        return null;
      }
    } catch (e) {
      set({
        loading: false,
        error: 'Falha ao recuperar série. Tente novamente.',
      });
      return null;
    }
  },
}));
